import {
  addDoc, collection, doc, runTransaction, serverTimestamp, updateDoc
} from 'firebase/firestore';

export const MAINTENANCE_COLLECTIONS = {
  chargers: 'chargers',
  technicians: 'technicians',
  tickets: 'maintenanceTickets',
  schedules: 'pmSchedules',
  inspections: 'inspections',
  spareparts: 'spareparts',
  stockMovements: 'stockMovements',
  auditLogs: 'maintenanceAuditLogs',
};

export const maintenanceCollection = (db, appId, name) =>
  collection(db, 'artifacts', appId, 'public', 'data', name);

export const maintenanceDoc = (db, appId, name, id) =>
  doc(db, 'artifacts', appId, 'public', 'data', name, String(id));

export async function createMaintenanceTicket(db, appId, payload, user) {
  const counterRef = maintenanceDoc(db, appId, 'maintenanceCounters', 'tickets');
  const ticketRef = doc(maintenanceCollection(db, appId, MAINTENANCE_COLLECTIONS.tickets));
  const stockUsage = payload.sparepartUsage?.[0];
  const stockRef = stockUsage?.sparepartId
    ? maintenanceDoc(db, appId, MAINTENANCE_COLLECTIONS.spareparts, stockUsage.sparepartId)
    : null;
  const movementRef = stockUsage?.sparepartId
    ? doc(maintenanceCollection(db, appId, MAINTENANCE_COLLECTIONS.stockMovements))
    : null;
  let ticketId = '';

  await runTransaction(db, async (tx) => {
    const counterSnap = await tx.get(counterRef);
    const stockSnap = stockRef ? await tx.get(stockRef) : null;
    const next = (counterSnap.exists() ? Number(counterSnap.data().lastNumber || 0) : 0) + 1;
    ticketId = `MT-${String(next).padStart(4, '0')}`;
    if (stockSnap && !stockSnap.exists()) throw new Error('Sparepart tidak ditemukan.');
    const stockData = stockSnap?.data();
    const qty = Number(stockUsage?.qty || 0);
    const stockBefore = Number(stockData?.stock || 0);
    if (stockRef && qty > stockBefore) {
      throw new Error(`Stok tidak cukup. Stok tersedia: ${stockBefore}`);
    }

    tx.set(counterRef, { lastNumber: next, updatedAt: serverTimestamp() }, { merge: true });
    tx.set(ticketRef, {
      ...payload,
      ticketId,
      status: payload.status || 'Open',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: user?.email || user?.name || 'unknown',
      createdByName: user?.name || user?.email || 'Unknown',
    });
    if (stockRef && movementRef && qty > 0) {
      const unitPrice = Number(stockData?.unitPrice || 0);
      tx.update(stockRef, { stock: stockBefore - qty, updatedAt: serverTimestamp() });
      tx.set(movementRef, {
        sparepartId: stockUsage.sparepartId,
        direction: 'OUT',
        qty,
        ticketId,
        reference: 'Pemakaian maintenance',
        notes: `Pemakaian untuk ${ticketId}`,
        totalCost: unitPrice * qty,
        stockBefore,
        stockAfter: stockBefore - qty,
        createdAt: serverTimestamp(),
        createdBy: user?.email || user?.name || 'unknown',
      });
    }
  });

  await addMaintenanceAudit(db, appId, {
    entityType: 'ticket', entityId: ticketRef.id, action: 'CREATE',
    description: `Membuat tiket ${ticketId}`,
  }, user);
  return { id: ticketRef.id, ticketId };
}

export async function addMaintenanceAudit(db, appId, payload, user) {
  try {
    return await addDoc(maintenanceCollection(db, appId, MAINTENANCE_COLLECTIONS.auditLogs), {
      ...payload,
      actor: user?.email || user?.name || 'unknown',
      actorName: user?.name || user?.email || 'Unknown',
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    // Audit logging must not make a successfully committed business transaction look failed.
    console.warn('Maintenance audit log could not be written:', error);
    return null;
  }
}

export async function updateMaintenanceRecord(db, appId, collectionName, id, updates, user, description) {
  await updateDoc(maintenanceDoc(db, appId, collectionName, id), {
    ...updates,
    updatedAt: serverTimestamp(),
    updatedBy: user?.email || user?.name || 'unknown',
  });
  await addMaintenanceAudit(db, appId, {
    entityType: collectionName, entityId: id, action: 'UPDATE',
    description: description || `Memperbarui ${collectionName}`,
  }, user);
}

export async function createStockMovement(db, appId, movement, user) {
  const stockRef = maintenanceDoc(db, appId, MAINTENANCE_COLLECTIONS.spareparts, movement.sparepartId);
  const movementRef = doc(maintenanceCollection(db, appId, MAINTENANCE_COLLECTIONS.stockMovements));
  await runTransaction(db, async (tx) => {
    const stockSnap = await tx.get(stockRef);
    if (!stockSnap.exists()) throw new Error('Sparepart tidak ditemukan.');
    const current = Number(stockSnap.data().stock || 0);
    const qty = Number(movement.qty || 0);
    if (movement.direction === 'OUT' && qty > current) {
      throw new Error(`Stok tidak cukup. Stok tersedia: ${current}`);
    }
    const nextStock = movement.direction === 'IN' ? current + qty : current - qty;
    tx.update(stockRef, { stock: nextStock, updatedAt: serverTimestamp() });
    tx.set(movementRef, {
      ...movement,
      qty,
      stockBefore: current,
      stockAfter: nextStock,
      createdAt: serverTimestamp(),
      createdBy: user?.email || user?.name || 'unknown',
    });
  });
  await addMaintenanceAudit(db, appId, {
    entityType: 'sparepart', entityId: movement.sparepartId, action: movement.direction,
    description: `${movement.direction === 'IN' ? 'Stok masuk' : 'Stok keluar'} ${movement.qty} unit`,
  }, user);
}

export function calculateDowntimeMinutes(start, finish) {
  if (!start || !finish) return 0;
  const startDate = new Date(start);
  const finishDate = new Date(finish);
  const diff = Math.floor((finishDate.getTime() - startDate.getTime()) / 60000);
  return Number.isFinite(diff) && diff > 0 ? diff : 0;
}

export function getPmStatus(nextDate, today = new Date()) {
  if (!nextDate) return 'Belum Ada Jadwal';
  const due = new Date(`${nextDate}T00:00:00`);
  const now = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const diff = Math.ceil((due.getTime() - now.getTime()) / 86400000);
  if (diff < 0) return 'Overdue';
  if (diff <= 7) return 'Due Soon';
  return 'OK';
}

export function formatDate(value) {
  if (!value) return '-';
  const date = value?.toDate ? value.toDate() : new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Jakarta' }).format(date);
}

export function toDateInput(value) {
  if (!value) return '';
  const date = value?.toDate ? value.toDate() : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}
