import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity, AlertTriangle, ArrowDownToLine, BarChart3, CalendarDays,
  CheckCircle2, ClipboardList, Clock3, Download, History as HistoryIcon,
  Package, Plus, RefreshCw, Search, ShieldCheck, Wrench, X, Zap, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, ArrowUpDown, Filter
} from 'lucide-react';
import {
  addDoc, deleteDoc, onSnapshot, serverTimestamp, setDoc
} from 'firebase/firestore';
import {
  MAINTENANCE_COLLECTIONS, addMaintenanceAudit, calculateDowntimeMinutes,
  createMaintenanceTicket, createStockMovement, formatDate, getPmStatus,
  maintenanceCollection, maintenanceDoc, updateMaintenanceRecord
} from '../../services/maintenanceService';

const cn = (...parts) => parts.filter(Boolean).join(' ');
const todayInput = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const money = (v) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(v || 0));
const safeDate = (v) => v?.toDate ? v.toDate() : (v ? new Date(v) : null);
const dateTimeInput = (d = new Date()) => {
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
};
const statusTone = (status) => ({
  Selesai: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  Active: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  OK: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  Open: 'bg-blue-50 text-blue-700 ring-blue-200',
  Progress: 'bg-amber-50 text-amber-700 ring-amber-200',
  Pending: 'bg-orange-50 text-orange-700 ring-orange-200',
  'Waiting Sparepart': 'bg-orange-50 text-orange-700 ring-orange-200',
  Overdue: 'bg-rose-50 text-rose-700 ring-rose-200',
  'Due Soon': 'bg-amber-50 text-amber-700 ring-amber-200',
  Fault: 'bg-rose-50 text-rose-700 ring-rose-200',
  Cancelled: 'bg-slate-100 text-slate-600 ring-slate-200',
}[status] || 'bg-slate-100 text-slate-600 ring-slate-200');

const CHECKLIST_GROUPS = [
  { group: 'Physical', items: ['Body / Enclosure', 'Display / HMI', 'Pintu dan kunci panel', 'Label dan signage'] },
  { group: 'Electrical', items: ['MCB / MCCB', 'Kabel dan terminal', 'Koneksi internal', 'Proteksi listrik'] },
  { group: 'Grounding & Safety', items: ['Koneksi grounding', 'Emergency Stop', 'Interlock dan proteksi', 'Kondisi area kerja'] },
  { group: 'Connector & Cooling', items: ['Charging gun / connector', 'Kabel charging', 'Fan / filter', 'Sistem pendingin'] },
  { group: 'Communication & Function', items: ['LAN / modem', 'OCPP connectivity', 'Boot / status charger', 'Charging test'] },
];
const defaultInspectionItems = () => Object.fromEntries(CHECKLIST_GROUPS.flatMap(group => group.items.map(item => [item, 'OK'])));

function Badge({ children }) {
  return <span className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ring-inset', statusTone(children))}>{children || '—'}</span>;
}
function Button({ children, onClick, variant = 'primary', type = 'button', disabled = false, className = '' }) {
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm',
    secondary: 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50',
    danger: 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100',
    ghost: 'text-slate-500 hover:bg-slate-100',
  };
  return <button type={type} disabled={disabled} onClick={onClick} className={cn('inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50', variants[variant], className)}>{children}</button>;
}
function Field({ label, children, className = '' }) {
  return <label className={cn('block min-w-0', className)}><span className="mb-1.5 block text-xs font-semibold text-slate-600">{label}</span>{children}</label>;
}
function Input({ className = '', ...props }) {
  return <input {...props} className={cn('w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100', className)} />;
}
function Select({ children, className = '', ...props }) {
  return <select {...props} className={cn('w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100', className)}>{children}</select>;
}
function Textarea({ className = '', ...props }) {
  return <textarea {...props} className={cn('w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100', className)} />;
}
function Panel({ title, subtitle, action, children, className = '' }) {
  return <section className={cn('rounded-2xl border border-slate-200 bg-white shadow-sm', className)}><div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-5 py-4"><div><h3 className="font-bold text-slate-800">{title}</h3>{subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}</div>{action}</div><div className="p-5">{children}</div></section>;
}
function Modal({ title, onClose, children, wide = false }) {
  return <div className="fixed inset-0 z-[160] flex items-center justify-center bg-slate-950/50 p-3 backdrop-blur-sm sm:p-6"><div className={cn('flex max-h-[92vh] w-full flex-col overflow-hidden rounded-2xl bg-white shadow-2xl', wide ? 'max-w-4xl' : 'max-w-2xl')}><div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><h3 className="font-bold text-slate-800">{title}</h3><button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X size={18}/></button></div><div className="overflow-y-auto p-5">{children}</div></div></div>;
}
function Empty({ title = 'Belum ada data', detail = 'Data akan muncul setelah transaksi pertama dibuat.' }) {
  return <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-12 text-center"><div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-white text-slate-400 shadow-sm"><ClipboardList size={20}/></div><p className="font-semibold text-slate-700">{title}</p><p className="mt-1 text-xs text-slate-500">{detail}</p></div>;
}
function StatCard({ label, value, hint, icon: Icon, tone = 'blue' }) {
  const tones = { blue: 'bg-blue-50 text-blue-600', green: 'bg-emerald-50 text-emerald-600', amber: 'bg-amber-50 text-amber-600', red: 'bg-rose-50 text-rose-600', violet: 'bg-violet-50 text-violet-600' };
  return <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-center justify-between gap-3"><span className="text-xs font-semibold text-slate-500">{label}</span><span className={cn('flex h-9 w-9 items-center justify-center rounded-xl', tones[tone])}><Icon size={18}/></span></div><p className="mt-3 text-2xl font-extrabold tracking-tight text-slate-800">{value}</p>{hint && <p className="mt-1 text-[11px] text-slate-400">{hint}</p>}</div>;
}
function TableWrap({ children }) {
  return <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-xs">{children}</table></div>;
}

function exportCsv(filename, rows) {
  const csv = rows.map(row => row.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\\r\\n');
  const blob = new Blob(['\\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

const xmlEscape = (value) => String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
const columnName = (index) => {
  let n = index + 1, name = '';
  while (n) { const r = (n - 1) % 26; name = String.fromCharCode(65 + r) + name; n = Math.floor((n - 1) / 26); }
  return name;
};
function zipStored(files) {
  const encoder = new TextEncoder();
  const crcTable = Array.from({ length: 256 }, (_, n) => {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    return c >>> 0;
  });
  const crc32 = (bytes) => {
    let crc = 0xFFFFFFFF;
    for (const byte of bytes) crc = crcTable[(crc ^ byte) & 0xFF] ^ (crc >>> 8);
    return (crc ^ 0xFFFFFFFF) >>> 0;
  };
  const locals = [], centrals = [];
  let offset = 0;
  files.forEach(([filename, content]) => {
    const name = encoder.encode(filename), data = encoder.encode(content), crc = crc32(data);
    const local = new Uint8Array(30 + name.length + data.length), lv = new DataView(local.buffer);
    lv.setUint32(0, 0x04034b50, true); lv.setUint16(4, 20, true); lv.setUint16(6, 0, true);
    lv.setUint16(8, 0, true); lv.setUint32(14, crc, true); lv.setUint32(18, data.length, true); lv.setUint32(22, data.length, true);
    lv.setUint16(26, name.length, true); lv.setUint16(28, 0, true); local.set(name, 30); local.set(data, 30 + name.length);
    const central = new Uint8Array(46 + name.length), cv = new DataView(central.buffer);
    cv.setUint32(0, 0x02014b50, true); cv.setUint16(4, 20, true); cv.setUint16(6, 20, true);
    cv.setUint16(8, 0, true); cv.setUint16(10, 0, true); cv.setUint32(16, crc, true);
    cv.setUint32(20, data.length, true); cv.setUint32(24, data.length, true); cv.setUint16(28, name.length, true);
    cv.setUint32(42, offset, true); central.set(name, 46);
    locals.push(local); centrals.push(central); offset += local.length;
  });
  const centralSize = centrals.reduce((sum, part) => sum + part.length, 0);
  const end = new Uint8Array(22), ev = new DataView(end.buffer);
  ev.setUint32(0, 0x06054b50, true); ev.setUint16(8, files.length, true); ev.setUint16(10, files.length, true);
  ev.setUint32(12, centralSize, true); ev.setUint32(16, offset, true);
  return new Blob([...locals, ...centrals, end], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}
function exportXlsx(filename, rows) {
  const safeRows = rows?.length ? rows : [['Tidak ada data pada periode yang dipilih']];
  const sheetRows = safeRows.map((row, r) => `<row r="${r + 1}">${row.map((value, c) => {
    const ref = `${columnName(c)}${r + 1}`;
    if (typeof value === 'number' && Number.isFinite(value)) return `<c r="${ref}"${r === 0 ? ' s="1"' : ''}><v>${value}</v></c>`;
    if (typeof value === 'boolean') return `<c r="${ref}" t="b"${r === 0 ? ' s="1"' : ''}><v>${value ? 1 : 0}</v></c>`;
    return `<c r="${ref}" t="inlineStr"${r === 0 ? ' s="1"' : ''}><is><t xml:space="preserve">${xmlEscape(value)}</t></is></c>`;
  }).join('')}</row>`).join('');
  const maxColumns = Math.max(1, ...safeRows.map(row => row.length));
  const sheet = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><sheetData>${sheetRows}</sheetData><autoFilter ref="A1:${columnName(maxColumns - 1)}${safeRows.length}"/></worksheet>`;
  const files = [
    ['[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`],
    ['_rels/.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`],
    ['xl/workbook.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Data Maintenance" sheetId="1" r:id="rId1"/></sheets></workbook>`],
    ['xl/_rels/workbook.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`],
    ['xl/worksheets/sheet1.xml', sheet],
    ['xl/styles.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`],
  ];
  const blob = zipStored(files);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
const dateKey = (value) => {
  if (!value) return '';
  const date = safeDate(value);
  if (!date || Number.isNaN(date.getTime())) return String(value).slice(0, 10);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};
function CollapsibleFilterPanel({ title = 'Filter Data', subtitle, open, onToggle, children }) {
  return <div className="mb-3">
    {!open ? <div className="flex justify-end">
      <button type="button" onClick={onToggle} aria-label={`Buka ${title}`} title={`Buka ${title}`}
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm transition-all duration-200 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700">
        <Filter size={16}/>
      </button>
    </div> : <div className="w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all duration-200">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/80 px-4 py-3">
        <div className="min-w-0">
          <p className="text-xs font-bold text-slate-800">{title}</p>
          {subtitle && <p className="mt-1 text-[11px] text-slate-500">{subtitle}</p>}
        </div>
        <button type="button" onClick={onToggle} aria-label={`Tutup ${title}`} title="Tutup filter"
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-100">
          <ChevronUp size={16}/>
        </button>
      </div>
      <div className="w-full p-4">{children}</div>
    </div>}
  </div>;
}

function DateRangeToolbar({ range, onChange, onReset, onCsv, onExcel, count, open, onToggle, extraContent }) {
  return <div className="mb-4">
    {!open ? <div className="flex justify-end">
      <button type="button" onClick={onToggle} aria-expanded={false} aria-label="Buka filter" title="Filter"
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm transition-all duration-200 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700">
        <Filter size={16}/>
      </button>
    </div> : <div className="w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/80 px-4 py-3">
        <div>
          <p className="flex items-center gap-2 text-xs font-bold text-slate-800"><Filter size={15}/> Filter Data</p>
          <p className="mt-1 text-[11px] text-slate-500">{count} data sesuai filter</p>
        </div>
        <button type="button" onClick={onToggle} aria-expanded={true} aria-label="Tutup filter" title="Tutup filter"
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-100">
          <ChevronUp size={16}/>
        </button>
      </div>
      <div className="w-full space-y-4 p-4">
        {extraContent}
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Field label="Dari Tanggal"><Input type="date" value={range.from || ''} max={range.to || undefined} onChange={e=>onChange({ ...range, from: e.target.value })}/></Field>
          <Field label="Sampai Tanggal"><Input type="date" value={range.to || ''} min={range.from || undefined} onChange={e=>onChange({ ...range, to: e.target.value })}/></Field>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
          <Button variant="secondary" onClick={onReset}><RefreshCw size={14}/> Reset Tanggal</Button>
          <div className="flex gap-2"><Button variant="secondary" onClick={onCsv}><Download size={14}/> CSV</Button><Button onClick={onExcel}><Download size={14}/> Excel</Button></div>
        </div>
      </div>
    </div>}
  </div>;
}

export default function MaintenanceModule({ activeTab, db, appId, firebaseApp, currentUser, locations = [] }) {
  const [chargers, setChargers] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [inspections, setInspections] = useState([]);
  const [spareparts, setSpareparts] = useState([]);
  const [stockMovements, setStockMovements] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [modal, setModal] = useState('');
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [ticketForm, setTicketForm] = useState({ chargerId: '', type: 'Corrective', category: 'Electrical Failure', priority: 'Medium', complaint: '', findings: '', rootCause: '', actionTaken: '', technicianName: '', technicianId: '', startTime: dateTimeInput(), finishTime: '', status: 'Open', chargerCondition: 'Under Investigation', attachmentUrl: '', sparepartId: '', sparepartQty: 0, notes: '' });
  const [chargerForm, setChargerForm] = useState({ chargerId: '', site: '', address: '', city: '', chargerType: 'AC', power: '', connector: 'Type 2', serialNumber: '', vendor: '', installationDate: '', status: 'Active', ip: '', ocppStatus: 'Unknown', notes: '' });
  const [pmForm, setPmForm] = useState({ chargerId: '', intervalDays: 30, firstScheduleDate: todayInput(), assignedTechnician: '', assignedTechnicianId: '', checklist: 'Standard PM', notes: '' });
  const [technicianForm, setTechnicianForm] = useState({ name: '', email: '', status: 'Aktif' });
  const [editingChargerId, setEditingChargerId] = useState('');
  const [editingTechnicianId, setEditingTechnicianId] = useState('');
  const [selectedChargerProfile, setSelectedChargerProfile] = useState(null);
  const [chargerStatusFilter, setChargerStatusFilter] = useState('All');
  const [chargerSiteFilter, setChargerSiteFilter] = useState('All');
  const [chargerTypeFilter, setChargerTypeFilter] = useState('All');
  const [showArchivedChargers, setShowArchivedChargers] = useState(false);

  const [sparepartForm, setSparepartForm] = useState({ name: '', partNumber: '', category: '', unit: 'pcs', stock: 0, minimumStock: 1, unitPrice: 0, supplier: '', notes: '' });
  const [movementForm, setMovementForm] = useState({ sparepartId: '', direction: 'IN', qty: 1, ticketId: '', reference: '', notes: '' });
  const [inspectionForm, setInspectionForm] = useState({ chargerId: '', inspectionDate: todayInput(), technicianName: '', technicianId: '', result: 'OK', notes: '', items: defaultInspectionItems() });
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [ticketEditForm, setTicketEditForm] = useState({ findings: '', rootCause: '', actionTaken: '', technicianName: '', technicianId: '', chargerCondition: '', notes: '' });
  const [selectedHistoryCharger, setSelectedHistoryCharger] = useState('');
  const [reportPeriod, setReportPeriod] = useState('all');
  const [dateRanges, setDateRanges] = useState({
    overview: { from: '', to: '' }, pm: { from: '', to: '' }, corrective: { from: '', to: '' },
    inspection: { from: '', to: '' }, history: { from: '', to: '' }, sparepart: { from: '', to: '' },
    schedule: { from: '', to: '' }, reports: { from: '', to: '' },
  });
  const [filterOpen, setFilterOpen] = useState({});
  const [sortSettings, setSortSettings] = useState({
    overview: { field: 'createdAt', direction: 'desc' }, pm: { field: 'nextMaintenanceDate', direction: 'asc' },
    corrective: { field: 'createdAt', direction: 'desc' }, inspection: { field: 'inspectionDate', direction: 'desc' },
    history: { field: 'createdAt', direction: 'desc' }, sparepart: { field: 'createdAt', direction: 'desc' },
    schedule: { field: 'nextMaintenanceDate', direction: 'asc' }, reports: { field: 'createdAt', direction: 'desc' }, reportTech: { field: 'total', direction: 'desc' },
    masterCharger: { field: 'chargerId', direction: 'asc' }, technician: { field: 'name', direction: 'asc' },
    sparepartMaster: { field: 'name', direction: 'asc' },
  });
  const [scheduleMonth, setScheduleMonth] = useState(new Date());
  const [pmSearch, setPmSearch] = useState('');
  const [pmSiteFilter, setPmSiteFilter] = useState('All');
  const [pmStatusFilter, setPmStatusFilter] = useState('All');
  const [pmTechnicianFilter, setPmTechnicianFilter] = useState('All');

  const getDateRange = (key) => dateRanges[key] || { from: '', to: '' };
  const updateDateRange = (key, next) => setDateRanges(old => ({ ...old, [key]: next }));
  const resetDateRange = (key) => updateDateRange(key, { from: '', to: '' });
  const inDateRange = (value, key) => {
    const { from, to } = getDateRange(key);
    if (!from && !to) return true;
    const day = dateKey(value);
    if (!day) return false;
    return (!from || day >= from) && (!to || day <= to);
  };
  const filterDateRange = (rows, key, getDate) => rows.filter(row => inDateRange(getDate(row), key));
  const toggleFilter = (key) => setFilterOpen(old => ({ ...old, [key]: !old[key] }));
  const isFilterOpen = (key) => Boolean(filterOpen[key]);
  const getSort = (key) => sortSettings[key] || { field: 'createdAt', direction: 'desc' };
  const updateSort = (key, next) => setSortSettings(old => ({ ...old, [key]: next }));
  const sortRows = (rows, key) => {
    const { field, direction } = getSort(key);
    const sign = direction === 'asc' ? 1 : -1;
    return [...rows].sort((a,b) => {
      const av = key === 'schedule' && field === 'nextMaintenanceDate' ? (a?.nextMaintenanceDate || a?.startTime)
        : key === 'schedule' && field === 'assignedTechnician' ? (a?.assignedTechnician || a?.technicianName) : a?.[field];
      const bv = key === 'schedule' && field === 'nextMaintenanceDate' ? (b?.nextMaintenanceDate || b?.startTime)
        : key === 'schedule' && field === 'assignedTechnician' ? (b?.assignedTechnician || b?.technicianName) : b?.[field];
      const ad = field.toLowerCase().includes('date') || field.toLowerCase().includes('time') || field === 'createdAt' ? safeDate(av)?.getTime() : null;
      const bd = field.toLowerCase().includes('date') || field.toLowerCase().includes('time') || field === 'createdAt' ? safeDate(bv)?.getTime() : null;
      if (ad !== null || bd !== null) return ((ad ?? 0) - (bd ?? 0)) * sign;
      if (av == null && bv != null) return 1;
      if (av != null && bv == null) return -1;
      if (typeof av === 'number' || typeof bv === 'number') return (Number(av||0)-Number(bv||0))*sign;
      return String(av ?? '').localeCompare(String(bv ?? ''), 'id', { numeric:true, sensitivity:'base' }) * sign;
    });
  };
  const dateToolbar = (key, rows, filename, count = rows.length, extraContent = null) => <DateRangeToolbar
    range={getDateRange(key)} onChange={next=>updateDateRange(key,next)} onReset={()=>resetDateRange(key)} count={count}
    open={isFilterOpen(key)} onToggle={()=>toggleFilter(key)} extraContent={extraContent}
    onCsv={()=>exportCsv(`${filename}.csv`,rows)} onExcel={()=>exportXlsx(`${filename}.xlsx`,rows)}
  />;
  const sortHeader = (label, key, field, sortable = true) => {
    const current = getSort(key);
    const active = current.field === field;
    return <th key={`${key}-${field}-${label}`} className="px-3 py-3 whitespace-nowrap">
      {sortable ? <button type="button" onClick={()=>updateSort(key,{field,direction:active && current.direction==='asc'?'desc':'asc'})}
        className={cn('inline-flex items-center gap-1.5 text-left transition-colors hover:text-blue-700',active?'text-blue-700':'text-slate-500')}
        title={`Urutkan ${label} ${active && current.direction==='asc'?'descending':'ascending'}`}>
        {label}{active ? (current.direction==='asc' ? <ChevronUp size={12}/> : <ChevronDown size={12}/>) : <ArrowUpDown size={11} className="opacity-40"/>}
      </button> : label}
    </th>;
  };
  const path = (name) => maintenanceCollection(db, appId, name);
  useEffect(() => {
    if (!db) return undefined;
    const names = Object.values(MAINTENANCE_COLLECTIONS);
    const unsubs = names.map((name) => onSnapshot(path(name), (snap) => {
      const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const setters = {
        chargers: setChargers,
        technicians: setTechnicians,
        maintenanceTickets: setTickets,
        pmSchedules: setSchedules,
        inspections: setInspections,
        spareparts: setSpareparts,
        stockMovements: setStockMovements,
        maintenanceAuditLogs: setAuditLogs,
      };
      setters[name]?.(rows);
      setLoading(false);
    }, (error) => {
      console.error(`Maintenance ${name}:`, error);
      setLoadError('Sebagian data Maintenance belum dapat dibaca. Periksa Firestore Security Rules untuk koleksi maintenance.');
      setLoading(false);
    }));
    return () => unsubs.forEach(unsub => unsub());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db]);

  const currentPage = activeTab.replace('maintenance-', '');
  const canManage = ['Admin', 'Editor'].includes(currentUser?.role);
  const sortedTickets = useMemo(() => [...tickets].sort((a, b) => (safeDate(b.createdAt)?.getTime() || 0) - (safeDate(a.createdAt)?.getTime() || 0)), [tickets]);
  const openTickets = tickets.filter(t => ['Open', 'Progress', 'Pending', 'Waiting Sparepart'].includes(t.status));
  const correctiveTickets = tickets.filter(t => t.type === 'Corrective' || t.type === 'Emergency');
  const pmRows = schedules.map(s => ({ ...s, pmStatus: getPmStatus(s.nextMaintenanceDate) }));
  const dueSoon = pmRows.filter(s => s.pmStatus === 'Due Soon');
  const overdue = pmRows.filter(s => s.pmStatus === 'Overdue');
  const pmSites = [...new Set(pmRows.map(row => row.site).filter(Boolean))].sort();
  const pmTechnicians = [...new Set(pmRows.map(row => row.assignedTechnician).filter(Boolean))].sort();
  const filteredPmRows = sortRows(pmRows.map(row => ({...row, daysRemaining: row.nextMaintenanceDate ? Math.ceil((new Date(`${row.nextMaintenanceDate}T00:00:00`)-new Date(`${todayInput()}T00:00:00`))/86400000) : null})).filter(row => {
    const q = pmSearch.trim().toLowerCase();
    const matchesSearch = !q || [row.chargerId, row.site, row.assignedTechnician].some(value => String(value || '').toLowerCase().includes(q));
    return matchesSearch
      && (pmSiteFilter === 'All' || row.site === pmSiteFilter)
      && (pmStatusFilter === 'All' || row.pmStatus === pmStatusFilter)
      && (pmTechnicianFilter === 'All' || row.assignedTechnician === pmTechnicianFilter)
      && inDateRange(row.nextMaintenanceDate, 'pm');
  }), 'pm');
  const filteredTickets = sortedTickets.filter(t => {
    const q = search.toLowerCase();
    const matches = !q || [t.ticketId, t.chargerId, t.site, t.technicianName, t.complaint, t.category].some(v => String(v || '').toLowerCase().includes(q));
    return matches && (statusFilter === 'All' || t.status === statusFilter);
  });
  const activeChargers = chargers.filter(c => !c.archived);
  const selectedCharger = (id) => activeChargers.find(c => c.chargerId === id || c.id === id);
  const visibleChargers = useMemo(() => chargers.filter(c => {
    if (showArchivedChargers ? !c.archived : c.archived) return false;
    if (chargerStatusFilter !== 'All' && c.status !== chargerStatusFilter) return false;
    if (chargerSiteFilter !== 'All' && c.site !== chargerSiteFilter) return false;
    if (chargerTypeFilter !== 'All' && c.chargerType !== chargerTypeFilter) return false;
    return true;
  }), [chargers, showArchivedChargers, chargerStatusFilter, chargerSiteFilter, chargerTypeFilter]);

  const siteNames = useMemo(() => locations.map(l => l.lokasi).filter(Boolean), [locations]);
  // Penugasan maintenance selalu mengambil sumber dari Master Technician.
  const activeTechnicians = useMemo(
    () => technicians.filter(t => !t.archived && String(t.status || 'Aktif').toLowerCase() === 'aktif')
      .sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'id')),
    [technicians]
  );
  const selectedTechnician = (id) => activeTechnicians.find(t => t.id === id) || null;

  const resetTicket = (type = 'Corrective') => { setTicketForm({ chargerId: activeChargers[0]?.chargerId || '', type, category: type === 'Preventive' ? 'Routine PM' : 'Electrical Failure', priority: type === 'Preventive' ? 'Low' : 'Medium', complaint: '', findings: '', rootCause: '', actionTaken: '', technicianName: '', technicianId: '', startTime: dateTimeInput(), finishTime: '', status: 'Open', chargerCondition: 'Under Investigation', attachmentUrl: '', sparepartId: '', sparepartQty: 0, notes: '' }); };


  const saveTicket = async (e) => {
    e.preventDefault();
    if (!ticketForm.chargerId) { setNotice('Pilih Charger ID terlebih dahulu.'); return; }
    const charger = selectedCharger(ticketForm.chargerId);
    if (!charger) { setNotice('Charger tidak ditemukan di Master Charger.'); return; }
    const assignedTech = ticketForm.technicianId ? selectedTechnician(ticketForm.technicianId) : null;
    if (ticketForm.technicianId && !assignedTech) { setNotice('Teknisi yang dipilih tidak aktif atau tidak ditemukan di Master Technician.'); return; }
    setSaving(true); setNotice('');
    try {
      const selectedPart = spareparts.find(p => p.id === ticketForm.sparepartId);
      if (ticketForm.sparepartId && Number(ticketForm.sparepartQty) > Number(selectedPart?.stock || 0)) {
        throw new Error(`Stok ${selectedPart?.name || 'sparepart'} tidak mencukupi.`);
      }
      const attachmentUrl = String(ticketForm.attachmentUrl || '').trim();
      const downtime = calculateDowntimeMinutes(ticketForm.startTime, ticketForm.finishTime);
      const payload = {
        ...ticketForm,
        technicianId: assignedTech?.id || '',
        technicianName: assignedTech?.name || '',
        technicianEmail: assignedTech?.email || '',
        attachmentUrl,
        chargerId: charger.chargerId,
        siteId: charger.siteId || '',
        site: charger.site || '',
        city: charger.city || '',
        address: charger.address || '',
        connector: charger.connector || '',
        serialNumber: charger.serialNumber || '',
        vendor: charger.vendor || '',
        ocppStatus: charger.ocppStatus || '',
        chargerSnapshot: {
          chargerId: charger.chargerId, site: charger.site || '', address: charger.address || '',
          city: charger.city || '', chargerType: charger.chargerType || '',
          power: Number(charger.power || 0), connector: charger.connector || '',
          serialNumber: charger.serialNumber || '', vendor: charger.vendor || '',
          ocppStatus: charger.ocppStatus || ''
        },
        downtimeMinutes: downtime,
        sparepartUsage: ticketForm.sparepartId ? [{
          sparepartId: ticketForm.sparepartId,
          sparepartName: spareparts.find(p => p.id === ticketForm.sparepartId)?.name || '',
          partNumber: spareparts.find(p => p.id === ticketForm.sparepartId)?.partNumber || '',
          unitPrice: Number(spareparts.find(p => p.id === ticketForm.sparepartId)?.unitPrice || 0),
          supplier: spareparts.find(p => p.id === ticketForm.sparepartId)?.supplier || '',
          qty: Number(ticketForm.sparepartQty || 0)
        }] : [],
      };
      delete payload.sparepartId; delete payload.sparepartQty;
      const result = await createMaintenanceTicket(db, appId, payload, currentUser);
      setModal(''); resetTicket(); setNotice(`Tiket ${result.ticketId} berhasil dibuat.`);
    } catch (error) { console.error(error); setNotice(error.message || 'Gagal menyimpan tiket.'); }
    finally { setSaving(false); }
  };

  const updateTicketStatus = async (ticket, status) => {
    try {
      const updates = { status };
      if (status === 'Selesai') {
        updates.finishTime = dateTimeInput();
        updates.downtimeMinutes = calculateDowntimeMinutes(ticket.startTime, updates.finishTime);
        updates.completedAt = serverTimestamp();
        updates.completedBy = currentUser?.email || currentUser?.name || '';
        if (ticket.type === 'Preventive') {
          const schedule = schedules.find(s => s.chargerId === ticket.chargerId);
          if (schedule) {
            const last = todayInput();
            const next = new Date(`${last}T00:00:00`);
            next.setDate(next.getDate() + Number(schedule.intervalDays || 30));
            await updateMaintenanceRecord(db, appId, MAINTENANCE_COLLECTIONS.schedules, schedule.id, { lastMaintenanceDate: last, nextMaintenanceDate: `${next.getFullYear()}-${String(next.getMonth()+1).padStart(2,'0')}-${String(next.getDate()).padStart(2,'0')}` }, currentUser, `Memperbarui jadwal PM setelah ${ticket.ticketId}`);
          }
        }
      }
      await updateMaintenanceRecord(db, appId, MAINTENANCE_COLLECTIONS.tickets, ticket.id, updates, currentUser, `Mengubah status ${ticket.ticketId} menjadi ${status}`);
      setNotice(`${ticket.ticketId} diperbarui menjadi ${status}.`);
    } catch (error) { setNotice(error.message || 'Gagal memperbarui tiket.'); }
  };

  const saveTicketEdit = async (e) => {
    e.preventDefault();
    if (!selectedTicket) return;
    setSaving(true);
    try {
      const isLegacyTech = String(ticketEditForm.technicianId || '').startsWith('legacy:');
      const assignedTech = ticketEditForm.technicianId && !isLegacyTech ? selectedTechnician(ticketEditForm.technicianId) : null;
      if (ticketEditForm.technicianId && !isLegacyTech && !assignedTech) throw new Error('Teknisi yang dipilih tidak aktif atau tidak ditemukan di Master Technician.');
      const editPayload = { ...ticketEditForm, technicianId: assignedTech?.id || (isLegacyTech ? selectedTicket.technicianId || '' : ''), technicianName: assignedTech?.name || (isLegacyTech ? selectedTicket.technicianName || '' : ''), technicianEmail: assignedTech?.email || (isLegacyTech ? selectedTicket.technicianEmail || '' : '') };
      await updateMaintenanceRecord(db, appId, MAINTENANCE_COLLECTIONS.tickets, selectedTicket.id, editPayload, currentUser, `Memperbarui detail ${selectedTicket.ticketId}`);
      setModal('');
      setNotice(`Detail ${selectedTicket.ticketId} berhasil diperbarui.`);
    } catch (error) { setNotice(error.message || 'Gagal memperbarui tiket.'); }
    finally { setSaving(false); }
  };

  const saveCharger = async (e) => {
    e.preventDefault();
    const id = editingChargerId || chargerForm.chargerId.trim();
    if (!id) return;
    setSaving(true);
    try {
      const ref = maintenanceDoc(db, appId, MAINTENANCE_COLLECTIONS.chargers, id);
      const payload = {
        ...chargerForm,
        chargerId: id,
        power: Number(chargerForm.power || 0),
        siteId: locations.find(l => l.lokasi === chargerForm.site)?.id || '',
        updatedAt: serverTimestamp(),
      };
      if (!editingChargerId) payload.createdAt = serverTimestamp();
      await setDoc(ref, payload, { merge: true });
      await addMaintenanceAudit(db, appId, {
        entityType: 'charger', entityId: id, action: editingChargerId ? 'UPDATE' : 'CREATE',
        description: `${editingChargerId ? 'Memperbarui' : 'Menambahkan'} master charger ${id}`,
      }, currentUser);
      setModal('');
      setEditingChargerId('');
      setChargerForm({ chargerId: '', site: '', address: '', city: '', chargerType: 'AC', power: '', connector: 'Type 2', serialNumber: '', installationDate: '', vendor: '', status: 'Active', ip: '', ocppStatus: 'Unknown', notes: '' });
      setNotice(`Master charger ${id} berhasil ${editingChargerId ? 'diperbarui' : 'disimpan'}.`);
    } catch (error) { setNotice(error.message || 'Gagal menyimpan charger.'); }
    finally { setSaving(false); }
  };

  const openEditCharger = (charger) => {
    setEditingChargerId(charger.chargerId);
    setChargerForm({
      chargerId: charger.chargerId || '', site: charger.site || '', address: charger.address || '',
      city: charger.city || '', chargerType: charger.chargerType || 'AC', power: charger.power ?? '',
      connector: charger.connector || '', serialNumber: charger.serialNumber || '',
      installationDate: charger.installationDate || '', vendor: charger.vendor || '',
      status: charger.status || 'Active', ip: charger.ip || '', ocppStatus: charger.ocppStatus || 'Unknown',
      notes: charger.notes || '',
    });
    setModal('charger');
  };

  const archiveCharger = async (charger) => {
    if (!window.confirm(`Arsipkan charger ${charger.chargerId}? Data dan histori tetap tersimpan.`)) return;
    try {
      await updateMaintenanceRecord(db, appId, MAINTENANCE_COLLECTIONS.chargers, charger.id, { archived: true, archivedPreviousStatus: charger.status || 'Active', status: 'Inactive', archivedAt: serverTimestamp() }, currentUser, `Mengarsipkan charger ${charger.chargerId}`);
      setNotice(`Charger ${charger.chargerId} berhasil diarsipkan.`);
    } catch (error) { setNotice(error.message || 'Gagal mengarsipkan charger.'); }
  };

  const restoreCharger = async (charger) => {
    try {
      await updateMaintenanceRecord(db, appId, MAINTENANCE_COLLECTIONS.chargers, charger.id, { archived: false, status: charger.archivedPreviousStatus || 'Active', archivedAt: null, archivedPreviousStatus: null }, currentUser, `Memulihkan charger ${charger.chargerId} dari arsip`);
      setNotice(`Charger ${charger.chargerId} berhasil dipulihkan.`);
    } catch (error) { setNotice(error.message || 'Gagal memulihkan charger.'); }
  };

  const permanentlyDeleteCharger = async (charger) => {
    const hasHistory = tickets.some(t => t.chargerId === charger.chargerId)
      || schedules.some(x => x.chargerId === charger.chargerId)
      || inspections.some(x => x.chargerId === charger.chargerId);
    if (hasHistory) {
      setNotice(`Charger ${charger.chargerId} memiliki histori maintenance. Hapus permanen tidak diizinkan; gunakan Arsipkan.`);
      return;
    }
    if (!window.confirm(`HAPUS PERMANEN charger ${charger.chargerId}? Tindakan ini tidak dapat dibatalkan.`)) return;
    try {
      await deleteDoc(maintenanceDoc(db, appId, MAINTENANCE_COLLECTIONS.chargers, charger.id));
      await addMaintenanceAudit(db, appId, { entityType: 'charger', entityId: charger.chargerId, action: 'DELETE', description: `Menghapus permanen charger ${charger.chargerId}` }, currentUser);
      setNotice(`Charger ${charger.chargerId} berhasil dihapus permanen.`);
    } catch (error) { setNotice(error.message || 'Gagal menghapus charger.'); }
  };

  const openChargerProfile = (charger) => {
    setSelectedChargerProfile(charger);
    setModal('charger-profile');
  };

  const saveTechnician = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingTechnicianId) {
        await updateMaintenanceRecord(db, appId, MAINTENANCE_COLLECTIONS.technicians, editingTechnicianId, technicianForm, currentUser, `Memperbarui teknisi ${technicianForm.name}`);
      } else {
        const result = await addDoc(path(MAINTENANCE_COLLECTIONS.technicians), { ...technicianForm, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
        await addMaintenanceAudit(db, appId, { entityType: 'technician', entityId: result.id, action: 'CREATE', description: `Menambahkan teknisi ${technicianForm.name}` }, currentUser);
      }
      setTechnicianForm({ name: '', email: '', status: 'Aktif' });
      setEditingTechnicianId('');
      setModal('');
      setNotice(`Master teknisi berhasil ${editingTechnicianId ? 'diperbarui' : 'ditambahkan'}.`);
    } catch (error) { setNotice(error.message || 'Gagal menyimpan teknisi.'); }
    finally { setSaving(false); }
  };

  const openEditTechnician = (tech) => {
    setEditingTechnicianId(tech.id);
    setTechnicianForm({ name: tech.name || '', email: tech.email || '', status: tech.status || 'Aktif' });
    setModal('technician');
  };

  const permanentlyDeleteTechnician = async (tech) => {
    const hasHistory = tickets.some(t => t.technicianName === tech.name)
      || schedules.some(x => x.assignedTechnician === tech.name)
      || inspections.some(x => x.technicianName === tech.name);
    if (hasHistory) {
      setNotice(`Teknisi ${tech.name} memiliki histori pekerjaan. Hapus permanen tidak diizinkan; nonaktifkan saja.`);
      return;
    }
    if (!window.confirm(`HAPUS PERMANEN teknisi ${tech.name}?`)) return;
    try {
      await deleteDoc(maintenanceDoc(db, appId, MAINTENANCE_COLLECTIONS.technicians, tech.id));
      await addMaintenanceAudit(db, appId, { entityType: 'technician', entityId: tech.id, action: 'DELETE', description: `Menghapus permanen teknisi ${tech.name}` }, currentUser);
      setNotice(`Teknisi ${tech.name} berhasil dihapus permanen.`);
    } catch (error) { setNotice(error.message || 'Gagal menghapus teknisi.'); }
  };


  const savePm = async (e) => {
    e.preventDefault();
    const charger = selectedCharger(pmForm.chargerId);
    if (!charger) { setNotice('Pilih Charger ID.'); return; }
    const assignedTech = pmForm.assignedTechnicianId ? selectedTechnician(pmForm.assignedTechnicianId) : null;
    if (pmForm.assignedTechnicianId && !assignedTech) { setNotice('Teknisi yang dipilih tidak aktif atau tidak ditemukan di Master Technician.'); return; }
    setSaving(true);
    try {
      const payload = {
        chargerId: charger.chargerId, siteId: charger.siteId || '', site: charger.site || '',
        intervalDays: Number(pmForm.intervalDays || 30), firstScheduleDate: pmForm.firstScheduleDate,
        lastMaintenanceDate: '', nextMaintenanceDate: pmForm.firstScheduleDate,
        assignedTechnician: assignedTech?.name || '', assignedTechnicianId: assignedTech?.id || '',
        assignedTechnicianEmail: assignedTech?.email || '', checklist: pmForm.checklist,
        notes: pmForm.notes, createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
      };
      const existing = schedules.find(s => s.chargerId === charger.chargerId);
      if (existing) await updateMaintenanceRecord(db, appId, MAINTENANCE_COLLECTIONS.schedules, existing.id, payload, currentUser, `Memperbarui jadwal PM ${charger.chargerId}`);
      else {
        const result = await addDoc(path(MAINTENANCE_COLLECTIONS.schedules), payload);
        await addMaintenanceAudit(db, appId, { entityType: 'pmSchedule', entityId: result.id, action: 'CREATE', description: `Membuat jadwal PM ${charger.chargerId}` }, currentUser);
      }
      setModal(''); setPmForm({ chargerId: '', intervalDays: 30, firstScheduleDate: todayInput(), assignedTechnician: '', assignedTechnicianId: '', checklist: 'Standard PM', notes: '' });
      setNotice(`Jadwal PM ${charger.chargerId} berhasil disimpan.`);
    } catch (error) { setNotice(error.message || 'Gagal menyimpan jadwal PM.'); }
    finally { setSaving(false); }
  };

  const saveSparepart = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const result = await addDoc(path(MAINTENANCE_COLLECTIONS.spareparts), { ...sparepartForm, stock: Number(sparepartForm.stock || 0), minimumStock: Number(sparepartForm.minimumStock || 0), unitPrice: Number(sparepartForm.unitPrice || 0), createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
      await addMaintenanceAudit(db, appId, { entityType: 'sparepart', entityId: result.id, action: 'CREATE', description: `Menambahkan sparepart ${sparepartForm.name}` }, currentUser);
      setModal(''); setSparepartForm({ name: '', partNumber: '', category: '', unit: 'pcs', stock: 0, minimumStock: 1, unitPrice: 0, supplier: '', notes: '' });
      setNotice('Master sparepart berhasil ditambahkan.');
    } catch (error) { setNotice(error.message || 'Gagal menyimpan sparepart.'); }
    finally { setSaving(false); }
  };

  const saveMovement = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const part = spareparts.find(p => p.id === movementForm.sparepartId);
      await createStockMovement(db, appId, { ...movementForm, totalCost: movementForm.direction === 'OUT' ? Number(part?.unitPrice || 0) * Number(movementForm.qty || 0) : 0 }, currentUser);
      setModal(''); setNotice('Pergerakan stok berhasil dicatat.');
    } catch (error) { setNotice(error.message || 'Gagal mencatat stok.'); }
    finally { setSaving(false); }
  };

  const saveInspection = async (e) => {
    e.preventDefault();
    const charger = selectedCharger(inspectionForm.chargerId);
    if (!charger) { setNotice('Pilih Charger ID.'); return; }
    const assignedTech = inspectionForm.technicianId ? selectedTechnician(inspectionForm.technicianId) : null;
    if (inspectionForm.technicianId && !assignedTech) { setNotice('Teknisi yang dipilih tidak aktif atau tidak ditemukan di Master Technician.'); return; }
    setSaving(true);
    try {
      const inspectionResult = Object.values(inspectionForm.items || {}).includes('NG') && inspectionForm.result === 'OK' ? 'NG' : inspectionForm.result;
      const result = await addDoc(path(MAINTENANCE_COLLECTIONS.inspections), {
        ...inspectionForm, technicianId: assignedTech?.id || '', technicianName: assignedTech?.name || '',
        technicianEmail: assignedTech?.email || '', result: inspectionResult, chargerId: charger.chargerId, site: charger.site || '',
        siteId: charger.siteId || '', createdAt: serverTimestamp(), createdBy: currentUser?.email || '',
      });
      await addMaintenanceAudit(db, appId, { entityType: 'inspection', entityId: result.id, action: 'CREATE', description: `Membuat inspeksi ${charger.chargerId}` }, currentUser);
      let followupFailed = false;
      if (inspectionResult === 'NG' || inspectionResult === 'Perlu Tindak Lanjut') {
        try {
          await createMaintenanceTicket(db, appId, {
            chargerId: charger.chargerId, siteId: charger.siteId || '', site: charger.site || '',
            type: 'Corrective', category: 'Inspection Follow-up', priority: 'High',
            complaint: `Tindak lanjut hasil inspeksi ${inspectionForm.inspectionDate}`,
            findings: Object.entries(inspectionForm.items || {}).filter(([,v]) => v === 'NG').map(([k]) => k).join(', '),
            rootCause: '', actionTaken: '', technicianId: assignedTech?.id || '', technicianName: assignedTech?.name || '',
            startTime: dateTimeInput(), finishTime: '', downtimeMinutes: 0, status: 'Open',
            chargerCondition: 'Under Investigation', inspectionId: result.id,
          }, currentUser);
        } catch (error) {
          followupFailed = true;
          console.error('Inspection saved but corrective ticket creation failed:', error);
        }
      }
      setModal('');
      setNotice(followupFailed
        ? 'Inspeksi tersimpan, tetapi tiket Corrective otomatis gagal dibuat. Buat tiket tindak lanjut secara manual.'
        : inspectionResult === 'OK' ? 'Hasil inspeksi berhasil disimpan.' : 'Hasil inspeksi disimpan dan tiket Corrective otomatis dibuat.');
    } catch (error) { setNotice(error.message || 'Gagal menyimpan inspeksi.'); }
    finally { setSaving(false); }
  };


  const renderTicketTable = (rows, sortKey = 'corrective') => rows.length ? <TableWrap><thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wide text-slate-500"><tr>
    {sortHeader('Ticket / Tanggal',sortKey,'createdAt')}{sortHeader('Charger / Site',sortKey,'chargerId')}{sortHeader('Jenis / Prioritas',sortKey,'type')}{sortHeader('Teknisi',sortKey,'technicianName')}{sortHeader('Downtime',sortKey,'downtimeMinutes')}{sortHeader('Status',sortKey,'status')}{sortHeader('Aksi',sortKey,'_action',false)}
  </tr></thead><tbody className="divide-y divide-slate-100">{rows.map(t => <tr key={t.id} className="hover:bg-slate-50"><td className="px-3 py-3"><button type="button" className="font-bold text-blue-700 hover:underline" onClick={()=>{setSelectedTicket(t);setTicketEditForm({findings:t.findings||'',rootCause:t.rootCause||'',actionTaken:t.actionTaken||'',technicianName:t.technicianName||'',technicianId:t.technicianId||(t.technicianName?`legacy:${t.technicianName}`:''),chargerCondition:t.chargerCondition||'',notes:t.notes||''});setModal('ticket-detail')}}>{t.ticketId || '—'}</button><p className="mt-1 text-[10px] text-slate-400">{formatDate(t.createdAt)}</p></td><td className="px-3 py-3"><p className="font-semibold text-slate-700">{t.chargerId}</p><p className="mt-1 text-[10px] text-slate-400">{t.site || '—'}</p></td><td className="px-3 py-3"><p className="text-slate-700">{t.type}</p><p className="mt-1 text-[10px] text-slate-400">{t.priority} · {t.category}</p></td><td className="px-3 py-3 text-slate-600">{t.technicianName || '—'}</td><td className="px-3 py-3 tabular-nums text-slate-600">{Number(t.downtimeMinutes || 0)} mnt</td><td className="px-3 py-3"><Badge>{t.status}</Badge></td><td className="px-3 py-3"><Select className="min-w-[115px] py-1.5 text-[11px]" value={t.status || 'Open'} disabled={!canManage} onChange={e => updateTicketStatus(t, e.target.value)}><option>Open</option><option>Progress</option><option>Waiting Sparepart</option><option>Pending</option><option>Selesai</option><option>Cancelled</option></Select></td></tr>)}</tbody></TableWrap> : <Empty title="Belum ada tiket maintenance"/>;

  const renderMasterCharger = () => {
    const activeRows = sortRows(visibleChargers, 'masterCharger');
    const distinctSites = [...new Set(chargers.filter(c => !c.archived).map(c => c.site).filter(Boolean))].sort();
    return <div className="space-y-5">
      <CollapsibleFilterPanel title="Filter & Pengurutan Master Charger" subtitle="Saring daftar charger berdasarkan lokasi, status, dan tipe" open={isFilterOpen('master-charger')} onToggle={()=>toggleFilter('master-charger')}>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <Field label="Lokasi"><Select value={chargerSiteFilter} onChange={e=>setChargerSiteFilter(e.target.value)}><option value="All">Semua Lokasi</option>{distinctSites.map(site=><option key={site}>{site}</option>)}</Select></Field>
          <Field label="Status Charger"><Select value={chargerStatusFilter} onChange={e=>setChargerStatusFilter(e.target.value)}><option value="All">Semua Status</option>{['Active','Fault','Inactive','Decommissioned'].map(x=><option key={x}>{x}</option>)}</Select></Field>
          <Field label="Jenis Charger"><Select value={chargerTypeFilter} onChange={e=>setChargerTypeFilter(e.target.value)}><option value="All">AC & DC</option><option>AC</option><option>DC</option></Select></Field>
          <div className="flex items-end gap-2"><label className="flex flex-1 items-center gap-2 rounded-lg border border-slate-200 px-3 py-2.5 text-xs text-slate-600"><input type="checkbox" checked={showArchivedChargers} onChange={e=>setShowArchivedChargers(e.target.checked)}/> Tampilkan arsip</label><Button variant="secondary" onClick={()=>{setChargerSiteFilter('All');setChargerStatusFilter('All');setChargerTypeFilter('All');setShowArchivedChargers(false)}}><RefreshCw size={14}/> Reset</Button></div>
        </div>
      </CollapsibleFilterPanel>
      <Panel title="Master Charger" subtitle="Data unit dan profil aset yang menjadi referensi seluruh transaksi Maintenance" action={<Button disabled={!canManage} onClick={()=>{setEditingChargerId('');setChargerForm({chargerId:'',site:'',address:'',city:'',chargerType:'AC',power:'',connector:'Type 2',serialNumber:'',installationDate:'',vendor:'',status:'Active',ip:'',ocppStatus:'Unknown',notes:''});setModal('charger')}}><Plus size={15}/> Tambah Charger</Button>}>
        {activeRows.length ? <TableWrap><thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-500"><tr>{sortHeader('Charger ID','masterCharger','chargerId')}{sortHeader('Site','masterCharger','site')}{sortHeader('Tipe / Daya','masterCharger','chargerType')}{sortHeader('Vendor','masterCharger','vendor')}{sortHeader('Status','masterCharger','status')}{sortHeader('OCPP','masterCharger','ocppStatus')}{sortHeader('Aksi','masterCharger','_action',false)}</tr></thead><tbody className="divide-y divide-slate-100">{activeRows.map(c=><tr key={c.id}><td className="px-3 py-3 font-bold text-slate-800">{c.chargerId}</td><td className="px-3 py-3 text-slate-600">{c.site}</td><td className="px-3 py-3 text-slate-600">{c.chargerType} · {c.power} kW</td><td className="px-3 py-3 text-slate-600">{c.vendor || '—'}</td><td className="px-3 py-3"><Badge>{c.status}</Badge></td><td className="px-3 py-3 text-slate-600">{c.ocppStatus || '—'}</td><td className="px-3 py-3"><div className="flex flex-wrap gap-1"><Button variant="ghost" className="px-2 py-1 text-xs" onClick={()=>openChargerProfile(c)}>Detail</Button>{!c.archived ? <Button variant="danger" disabled={!canManage} className="px-2 py-1 text-xs" onClick={()=>archiveCharger(c)}>Arsipkan</Button> : <Button variant="secondary" disabled={!canManage} className="px-2 py-1 text-xs" onClick={()=>restoreCharger(c)}>Pulihkan</Button>}<Button variant="danger" disabled={!canManage} className="px-2 py-1 text-xs" onClick={()=>permanentlyDeleteCharger(c)}>Hapus</Button></div></td></tr>)}</tbody></TableWrap> : <Empty title={showArchivedChargers?'Belum ada charger arsip':'Master charger belum diisi'} detail="Tambahkan charger menggunakan form master charger."/>}
      </Panel>
    </div>;
  };

  const renderMasterTechnician = () => {
    const technicianRows = sortRows(technicians.map(t=>({...t,jobCount:tickets.filter(x=>x.technicianName===t.name).length,displayStatus:t.archived?'Nonaktif':(t.status||'Aktif')})), 'technician');
    return <div className="space-y-5">
    <Panel title="Master Technician" subtitle="Daftar teknisi untuk penugasan maintenance" action={<Button disabled={!canManage} onClick={()=>{setEditingTechnicianId('');setTechnicianForm({name:'',email:'',status:'Aktif'});setModal('technician')}}><Plus size={15}/> Tambah Teknisi</Button>}>
      {technicianRows.length ? <TableWrap><thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-500"><tr>{sortHeader('Nama Teknisi','technician','name')}{sortHeader('Email','technician','email')}{sortHeader('Status','technician','displayStatus')}{sortHeader('Pekerjaan','technician','jobCount')}{sortHeader('Aksi','technician','_action',false)}</tr></thead><tbody className="divide-y divide-slate-100">{technicianRows.map(t=><tr key={t.id}><td className="px-3 py-3 font-semibold text-slate-800">{t.name}</td><td className="px-3 py-3 text-slate-600">{t.email || '—'}</td><td className="px-3 py-3"><Badge>{t.archived?'Nonaktif':(t.status||'Aktif')}</Badge></td><td className="px-3 py-3">{t.jobCount}</td><td className="px-3 py-3"><div className="flex flex-wrap gap-1"><Button variant="secondary" disabled={!canManage} className="px-2 py-1 text-xs" onClick={()=>openEditTechnician(t)}>Edit</Button><Button variant="danger" disabled={!canManage} className="px-2 py-1 text-xs" onClick={()=>permanentlyDeleteTechnician(t)}>Hapus</Button></div></td></tr>)}</tbody></TableWrap> : <Empty title="Master teknisi belum diisi" detail="Tambahkan teknisi untuk digunakan dalam penugasan maintenance."/>}
    </Panel>
  </div>;
  };

  const renderOverview = () => {
    const activeRows = visibleChargers;
    const scopedTickets = sortRows(filterDateRange(tickets, 'overview', t => t.createdAt).filter(t => activeRows.some(c => c.chargerId === t.chargerId)), 'overview');
    const scopedSchedules = filterDateRange(schedules, 'overview', x => x.nextMaintenanceDate).filter(x => activeRows.some(c => c.chargerId === x.chargerId)).map(x => ({ ...x, pmStatus: getPmStatus(x.nextMaintenanceDate) }));
    const scopedDueSoon = scopedSchedules.filter(x => x.pmStatus === 'Due Soon');
    const scopedOverdue = scopedSchedules.filter(x => x.pmStatus === 'Overdue');
    const scopedTicketIds = new Set(scopedTickets.map(t => t.ticketId));
    const scopedDowntime = scopedTickets.reduce((sum,t) => sum + Number(t.downtimeMinutes || 0), 0);
    const scopedSparepartCost = filterDateRange(stockMovements, 'overview', m => m.createdAt).filter(m => m.direction === 'OUT' && scopedTicketIds.has(m.ticketId)).reduce((sum,m) => sum + Number(m.totalCost || 0), 0);
    const openCount = scopedTickets.filter(t => ['Open','Progress','Waiting Sparepart','Pending'].includes(t.status)).length;
    const distinctSites = [...new Set(chargers.filter(c => !c.archived).map(c => c.site).filter(Boolean))].sort();
    return <div className="space-y-5">
      {dateToolbar('overview', [['Ticket ID','Tanggal','Charger ID','Site','Jenis','Teknisi','Status','Downtime (menit)'], ...scopedTickets.map(t=>[t.ticketId,formatDate(t.createdAt),t.chargerId,t.site,t.type,t.technicianName,t.status,Number(t.downtimeMinutes||0)])], 'cazgo-maintenance-overview', scopedTickets.length,
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <Field label="Lokasi"><Select value={chargerSiteFilter} onChange={e=>setChargerSiteFilter(e.target.value)}><option value="All">Semua Lokasi</option>{distinctSites.map(site=><option key={site}>{site}</option>)}</Select></Field>
          <Field label="Status Charger"><Select value={chargerStatusFilter} onChange={e=>setChargerStatusFilter(e.target.value)}><option value="All">Semua Status</option>{['Active','Fault','Inactive','Decommissioned'].map(x=><option key={x}>{x}</option>)}</Select></Field>
          <Field label="Jenis Charger"><Select value={chargerTypeFilter} onChange={e=>setChargerTypeFilter(e.target.value)}><option value="All">AC & DC</option><option>AC</option><option>DC</option></Select></Field>
          <div className="flex items-end gap-2"><label className="flex flex-1 items-center gap-2 rounded-lg border border-slate-200 px-3 py-2.5 text-xs text-slate-600"><input type="checkbox" checked={showArchivedChargers} onChange={e=>setShowArchivedChargers(e.target.checked)}/> Tampilkan arsip</label><Button variant="secondary" onClick={()=>{setChargerSiteFilter('All');setChargerStatusFilter('All');setChargerTypeFilter('All');setShowArchivedChargers(false);setSearch('');setStatusFilter('All')}}><RefreshCw size={14}/> Reset</Button></div>
        </div>)}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard label="Total Charger" value={activeRows.length} hint={showArchivedChargers ? 'Charger diarsipkan' : 'Sesuai filter aktif'} icon={Zap}/>
        <StatCard label="Charger Active" value={activeRows.filter(c=>c.status==='Active').length} hint="Status master Active" icon={CheckCircle2} tone="green"/>
        <StatCard label="Charger Fault" value={activeRows.filter(c=>c.status==='Fault').length} hint="Status master Fault" icon={AlertTriangle} tone="red"/>
        <StatCard label="Open Tickets" value={openCount} hint="Open, Progress, Waiting Sparepart" icon={ClipboardList} tone="amber"/>
        <StatCard label="PM Due Soon" value={scopedDueSoon.length} hint="Jatuh tempo ≤ 7 hari" icon={CalendarDays} tone="amber"/>
        <StatCard label="PM Overdue" value={scopedOverdue.length} hint="Melewati tanggal PM" icon={AlertTriangle} tone="red"/>
        <StatCard label="Total Downtime" value={`${(scopedDowntime / 60).toFixed(1)} jam`} hint={`${scopedDowntime.toLocaleString('id-ID')} menit`} icon={Clock3} tone="violet"/>
        <StatCard label="Sparepart Cost" value={money(scopedSparepartCost)} hint="Pemakaian sparepart tercatat" icon={Package} tone="green"/>
      </div>
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <Panel title="Maintenance Trend" subtitle="Jumlah tiket berdasarkan jenis pekerjaan" className="xl:col-span-2">
          {scopedTickets.length ? <div className="space-y-4">{['Preventive','Corrective','Inspection','Emergency','Software-Firmware','Other'].map(type => {
            const count = scopedTickets.filter(t => t.type === type).length;
            const percent = scopedTickets.length ? count / scopedTickets.length * 100 : 0;
            return <div key={type}><div className="mb-1.5 flex justify-between text-xs"><span className="font-semibold text-slate-600">{type}</span><span className="font-bold text-slate-700">{count}</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-blue-500" style={{ width: `${percent}%` }}/></div></div>;
          })}</div> : <Empty title="Belum ada aktivitas" detail="Grafik akan terisi setelah work order dibuat."/>}
        </Panel>
        <Panel title="PM Status" subtitle="Kondisi jadwal preventive maintenance">
          <div className="space-y-3">{[{label:'OK',value:pmRows.filter(s=>s.pmStatus==='OK').length,color:'bg-emerald-500'},{label:'Due Soon',value:dueSoon.length,color:'bg-amber-500'},{label:'Overdue',value:overdue.length,color:'bg-rose-500'},{label:'Belum Ada Jadwal',value:pmRows.filter(s=>s.pmStatus==='Belum Ada Jadwal').length,color:'bg-slate-400'}].map(x=><div key={x.label} className="flex items-center justify-between"><span className="flex items-center gap-2 text-xs text-slate-600"><span className={cn('h-2.5 w-2.5 rounded-full',x.color)}/>{x.label}</span><strong className="text-sm text-slate-800">{x.value}</strong></div>)}</div>
        </Panel>
      </div>
      <Panel title="Recent Maintenance Activities" subtitle="Aktivitas terbaru dari seluruh lokasi" action={<Button variant="secondary" onClick={() => window.dispatchEvent(new CustomEvent('chargetrack-maintenance-nav', { detail: 'maintenance-ticket' }))}>Lihat Semua Aktivitas</Button>}>
        {renderTicketTable(scopedTickets.slice(0, 6), 'overview')}
      </Panel>


      <Panel title="Maintenance Audit Trail" subtitle="Catatan perubahan transaksi dan master data">
        {auditLogs.length ? <div className="space-y-3">{[...auditLogs].sort((a,b)=>(safeDate(b.createdAt)?.getTime()||0)-(safeDate(a.createdAt)?.getTime()||0)).slice(0,8).map(log=><div key={log.id} className="flex items-start gap-3 border-b border-slate-100 pb-3 last:border-0 last:pb-0"><span className="mt-0.5 rounded-lg bg-slate-100 p-2 text-slate-500"><HistoryIcon size={15}/></span><div className="min-w-0 flex-1"><p className="text-xs font-semibold text-slate-700">{log.description || log.action}</p><p className="mt-1 text-[10px] text-slate-400">{log.actorName || log.actor || 'System'} · {formatDate(log.createdAt)}</p></div><Badge>{log.action}</Badge></div>)}</div> : <Empty title="Belum ada audit trail"/>}
      </Panel>
    </div>;
  };

  const renderTickets = (correctiveOnly = false) => {
    const datePage = correctiveOnly ? 'corrective' : 'corrective';
    const rows = sortRows(filterDateRange(filteredTickets.filter(t => !correctiveOnly || ['Corrective','Emergency'].includes(t.type)), datePage, t => t.createdAt), datePage);
    const exportRows = [['Ticket ID','Tanggal Dibuat','Charger ID','Lokasi','Jenis','Kategori','Prioritas','Teknisi','Status','Downtime (menit)','Keluhan','Temuan','Root Cause','Tindakan Perbaikan','Link Dokumentasi'],
      ...rows.map(t=>[t.ticketId,formatDate(t.createdAt),t.chargerId,t.site,t.type,t.category,t.priority,t.technicianName,t.status,Number(t.downtimeMinutes||0),t.complaint,t.findings,t.rootCause,t.actionTaken,t.attachmentUrl])];
    return <div className="space-y-5"><Panel title={correctiveOnly ? 'Corrective Maintenance Tickets' : 'Work Order Register'} subtitle={correctiveOnly ? 'Penanganan gangguan dan pemulihan charger' : 'Daftar seluruh pekerjaan maintenance'} action={<Button disabled={!canManage} onClick={() => { resetTicket(correctiveOnly ? 'Corrective' : 'Corrective'); setModal('ticket'); }}><Plus size={16}/> Buat Work Order</Button>}>
      {dateToolbar(datePage, exportRows, correctiveOnly ? 'cazgo-corrective-maintenance' : 'cazgo-work-orders', rows.length,
        <div className="flex flex-col gap-2 sm:flex-row"><div className="relative flex-1"><Search size={16} className="absolute left-3 top-3 text-slate-400"/><Input className="pl-9" placeholder="Cari Ticket ID, Charger ID, site, teknisi..." value={search} onChange={e=>setSearch(e.target.value)}/></div><Select className="sm:w-44" value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}><option value="All">Semua Status</option>{['Open','Progress','Waiting Sparepart','Pending','Selesai','Cancelled'].map(s=><option key={s}>{s}</option>)}</Select></div>)}
      {renderTicketTable(rows, datePage)}
    </Panel></div>;
  };

  const renderPm = () => <div className="space-y-5">
    <Panel title="Preventive Maintenance Planner" subtitle="Jadwal PM dihitung dari tanggal PM berikutnya dan interval per charger" action={<Button disabled={!canManage} onClick={() => { setPmForm({ chargerId: activeChargers[0]?.chargerId || '', intervalDays: 30, firstScheduleDate: todayInput(), assignedTechnician: '', assignedTechnicianId: '', checklist: 'Standard PM', notes: '' }); setModal('pm'); }}><Plus size={16}/> Atur Jadwal PM</Button>}>
      {dateToolbar('pm', [['Charger ID','Lokasi','PM Terakhir','Interval (hari)','PM Berikutnya','Teknisi','Status'], ...filteredPmRows.map(r=>[r.chargerId,r.site,r.lastMaintenanceDate,r.intervalDays,r.nextMaintenanceDate,r.assignedTechnician,r.pmStatus])], 'cazgo-preventive-maintenance', filteredPmRows.length,
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <Field label="Pencarian"><Input value={pmSearch} onChange={e=>setPmSearch(e.target.value)} placeholder="Charger ID / lokasi..."/></Field>
          <Field label="Lokasi"><Select value={pmSiteFilter} onChange={e=>setPmSiteFilter(e.target.value)}><option value="All">Semua Lokasi</option>{pmSites.map(site=><option key={site}>{site}</option>)}</Select></Field>
          <Field label="Status PM"><Select value={pmStatusFilter} onChange={e=>setPmStatusFilter(e.target.value)}><option value="All">Semua Status</option>{['OK','Due Soon','Overdue','Belum Ada Jadwal'].map(status=><option key={status}>{status}</option>)}</Select></Field>
          <div className="flex items-end gap-2"><Field label="Teknisi" className="min-w-0 flex-1"><Select value={pmTechnicianFilter} onChange={e=>setPmTechnicianFilter(e.target.value)}><option value="All">Semua Teknisi</option>{pmTechnicians.map(name=><option key={name}>{name}</option>)}</Select></Field><Button variant="secondary" onClick={()=>{setPmSearch('');setPmSiteFilter('All');setPmStatusFilter('All');setPmTechnicianFilter('All')}}><RefreshCw size={14}/> Reset</Button></div>
        </div>)}
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4"><StatCard label="Total Jadwal" value={filteredPmRows.length} icon={CalendarDays}/><StatCard label="OK" value={filteredPmRows.filter(s=>s.pmStatus==='OK').length} icon={CheckCircle2} tone="green"/><StatCard label="Due Soon" value={filteredPmRows.filter(s=>s.pmStatus==='Due Soon').length} icon={Clock3} tone="amber"/><StatCard label="Overdue" value={filteredPmRows.filter(s=>s.pmStatus==='Overdue').length} icon={AlertTriangle} tone="red"/></div>
      {filteredPmRows.length ? <TableWrap><thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-500"><tr>{sortHeader('Charger ID / Site','pm','chargerId')}{sortHeader('PM Terakhir','pm','lastMaintenanceDate')}{sortHeader('Interval','pm','intervalDays')}{sortHeader('PM Berikutnya','pm','nextMaintenanceDate')}{sortHeader('Sisa Hari','pm','daysRemaining')}{sortHeader('Teknisi','pm','assignedTechnician')}{sortHeader('Status','pm','pmStatus')}{sortHeader('Aksi','pm','_action',false)}</tr></thead><tbody className="divide-y divide-slate-100">{filteredPmRows.map(row=>{const diff=row.nextMaintenanceDate?Math.ceil((new Date(`${row.nextMaintenanceDate}T00:00:00`)-new Date(`${todayInput()}T00:00:00`))/86400000):null;return <tr key={row.id}><td className="px-3 py-3"><b className="text-slate-800">{row.chargerId}</b><p className="text-[10px] text-slate-400">{row.site}</p></td><td className="px-3 py-3">{row.lastMaintenanceDate || '—'}</td><td className="px-3 py-3">{row.intervalDays} hari</td><td className="px-3 py-3">{row.nextMaintenanceDate || '—'}</td><td className="px-3 py-3">{diff === null ? '—' : diff}</td><td className="px-3 py-3">{row.assignedTechnician || '—'}</td><td className="px-3 py-3"><Badge>{row.pmStatus}</Badge></td><td className="px-3 py-3"><Button variant="secondary" disabled={!canManage} onClick={()=>{setTicketForm({...ticketForm,chargerId:row.chargerId,type:'Preventive',category:'Routine PM',priority:'Low',complaint:'Preventive maintenance terjadwal',technicianId:activeTechnicians.some(t=>t.id===row.assignedTechnicianId)?row.assignedTechnicianId:'',technicianName:activeTechnicians.find(t=>t.id===row.assignedTechnicianId)?.name||''});setModal('ticket')}}>Buat PM</Button></td></tr>})}</tbody></TableWrap> : <Empty title={pmRows.length?'Tidak ada jadwal sesuai filter':'Belum ada jadwal PM'} detail={pmRows.length?'Ubah filter atau tekan Reset untuk melihat semua jadwal.':'Tambahkan jadwal PM untuk setiap Charger ID yang akan dipelihara.'}/>}
    </Panel>
  </div>;

  const renderInspection = () => {
    const rows = sortRows(filterDateRange(inspections, 'inspection', i => i.inspectionDate), 'inspection');
    const exportRows = [['Tanggal Inspeksi','Charger ID','Lokasi','Teknisi','Hasil','Catatan','Checklist'], ...rows.map(i=>[i.inspectionDate,i.chargerId,i.site,i.technicianName,i.result,i.notes,Object.entries(i.items||{}).map(([k,v])=>`${k}: ${v}`).join('; ')])];
    return <div className="space-y-5"><Panel title="Inspection Register" subtitle="Checklist inspeksi kondisi fisik, elektrikal, safety, dan fungsi charger" action={<div className="flex flex-wrap gap-2"><a href="/templates/CAZGO_Manual_Inspection_Template.xlsx" download className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"><Download size={15}/> Download Template</a><Button disabled={!canManage} onClick={()=>{setInspectionForm({chargerId:activeChargers[0]?.chargerId||'',inspectionDate:todayInput(),technicianName:'',technicianId:'',result:'OK',notes:'',items:defaultInspectionItems()});setModal('inspection')}}><Plus size={16}/> Buat Inspeksi</Button></div>}>
    {dateToolbar('inspection', exportRows, 'cazgo-inspection-checklist', rows.length)}
    {rows.length ? <TableWrap><thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-500"><tr>{sortHeader('Tanggal','inspection','inspectionDate')}{sortHeader('Charger ID / Site','inspection','chargerId')}{sortHeader('Teknisi','inspection','technicianName')}{sortHeader('Hasil','inspection','result')}{sortHeader('Catatan','inspection','notes')}</tr></thead><tbody className="divide-y divide-slate-100">{rows.map(i=><tr key={i.id}><td className="px-3 py-3">{i.inspectionDate}</td><td className="px-3 py-3"><b>{i.chargerId}</b><p className="text-[10px] text-slate-400">{i.site}</p></td><td className="px-3 py-3">{i.technicianName}</td><td className="px-3 py-3"><Badge>{i.result}</Badge></td><td className="px-3 py-3">{i.notes || '—'}</td></tr>)}</tbody></TableWrap> : <Empty title="Belum ada inspeksi pada periode ini"/>}
  </Panel></div>;
  };

  const renderHistory = () => {
    const rows = sortRows(filterDateRange(sortedTickets.filter(t => !selectedHistoryCharger || t.chargerId === selectedHistoryCharger), 'history', t => t.createdAt), 'history');
    const totalCost = filterDateRange(stockMovements, 'history', m => m.createdAt).filter(m => rows.some(t => t.ticketId === m.ticketId)).reduce((sum,m)=>sum+Number(m.totalCost||0),0);
    return <div className="space-y-5"><Panel title="Charger Maintenance History" subtitle="Riwayat pekerjaan berdasarkan Charger ID" >
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2"><div className="rounded-xl bg-slate-50 p-3"><p className="text-[10px] font-semibold uppercase text-slate-500">Total Riwayat</p><p className="mt-1 text-xl font-extrabold text-slate-800">{rows.length}</p></div><div className="rounded-xl bg-slate-50 p-3"><p className="text-[10px] font-semibold uppercase text-slate-500">Biaya Sparepart</p><p className="mt-1 text-xl font-extrabold text-slate-800">{money(totalCost)}</p></div></div>
      {dateToolbar('history', [['Ticket ID','Tanggal','Charger ID','Lokasi','Jenis','Teknisi','Status','Downtime (menit)'], ...rows.map(t=>[t.ticketId,formatDate(t.createdAt),t.chargerId,t.site,t.type,t.technicianName,t.status,Number(t.downtimeMinutes||0)])], 'cazgo-charger-history', rows.length,
        <Field label="Pilih Charger ID"><Select value={selectedHistoryCharger} onChange={e=>setSelectedHistoryCharger(e.target.value)}><option value="">Semua Charger</option>{activeChargers.map(c=><option key={c.id} value={c.chargerId}>{c.chargerId} — {c.site}</option>)}</Select></Field>)}
      <div className="mt-5">{renderTicketTable(rows, 'history')}</div>
    </Panel></div>;
  };

  const renderSpareparts = () => {
    const sortedSpareparts = sortRows(spareparts.map(p=>({...p,stockStatus:Number(p.stock||0)<=Number(p.minimumStock||0)?'Low Stock':'Active'})), 'sparepartMaster');
    const movementRows = sortRows(filterDateRange(stockMovements.map(m=>({...m, name: spareparts.find(p=>p.id===m.sparepartId)?.name || m.sparepartId})), 'sparepart', m => m.createdAt), 'sparepart');
    const movementExport = [['Tanggal','Sparepart','Arah','Qty','Stok Akhir','Ticket / Referensi','Biaya'], ...movementRows.map(m=>[formatDate(m.createdAt),spareparts.find(p=>p.id===m.sparepartId)?.name || m.sparepartId,m.direction==='IN'?'Masuk':'Keluar',m.qty,m.stockAfter,m.ticketId || m.reference,m.totalCost])];
    return <div className="space-y-5"><Panel title="Sparepart Inventory" subtitle="Master barang dan stok saat ini; filter tanggal berlaku untuk riwayat mutasi stok" action={<div className="flex flex-wrap gap-2"><Button variant="secondary" disabled={!canManage} onClick={()=>{setMovementForm({sparepartId:spareparts[0]?.id||'',direction:'IN',qty:1,ticketId:'',reference:'',notes:''});setModal('movement')}}><ArrowDownToLine size={15}/> Mutasi Stok</Button><Button disabled={!canManage} onClick={()=>setModal('sparepart')}><Plus size={16}/> Tambah Sparepart</Button></div>}>
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-3"><StatCard label="Jenis Sparepart" value={spareparts.length} icon={Package}/><StatCard label="Stok Menipis" value={spareparts.filter(p=>Number(p.stock||0)<=Number(p.minimumStock||0)).length} icon={AlertTriangle} tone="red"/><StatCard label="Nilai Persediaan" value={money(spareparts.reduce((s,p)=>s+Number(p.stock||0)*Number(p.unitPrice||0),0))} icon={BarChart3} tone="green"/></div>
      {spareparts.length ? <TableWrap><thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-500"><tr>{sortHeader('Nama / Part Number','sparepartMaster','name')}{sortHeader('Kategori','sparepartMaster','category')}{sortHeader('Stok','sparepartMaster','stock')}{sortHeader('Min. Stok','sparepartMaster','minimumStock')}{sortHeader('Harga Satuan','sparepartMaster','unitPrice')}{sortHeader('Supplier','sparepartMaster','supplier')}{sortHeader('Status','sparepartMaster','stockStatus')}</tr></thead><tbody className="divide-y divide-slate-100">{sortedSpareparts.map(p=><tr key={p.id}><td className="px-3 py-3"><b className="text-slate-800">{p.name}</b><p className="text-[10px] text-slate-400">{p.partNumber || 'No part number'}</p></td><td className="px-3 py-3">{p.category || '—'}</td><td className="px-3 py-3 font-bold">{p.stock} {p.unit}</td><td className="px-3 py-3">{p.minimumStock}</td><td className="px-3 py-3">{money(p.unitPrice)}</td><td className="px-3 py-3">{p.supplier || '—'}</td><td className="px-3 py-3"><Badge>{Number(p.stock||0)<=Number(p.minimumStock||0)?'Low Stock':'Active'}</Badge></td></tr>)}</tbody></TableWrap> : <Empty title="Master sparepart masih kosong"/>}
    </Panel><Panel title="Stock Movement History" subtitle="Seluruh transaksi stok masuk dan keluar">{dateToolbar('sparepart', movementExport, 'cazgo-sparepart-stock-movements', movementRows.length)}{movementRows.length ? <TableWrap><thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-500"><tr>{sortHeader('Tanggal','sparepart','createdAt')}{sortHeader('Sparepart','sparepart','name')}{sortHeader('Arah','sparepart','direction')}{sortHeader('Qty','sparepart','qty')}{sortHeader('Stok Akhir','sparepart','stockAfter')}{sortHeader('Ticket / Referensi','sparepart','ticketId')}{sortHeader('Biaya','sparepart','totalCost')}</tr></thead><tbody className="divide-y divide-slate-100">{movementRows.map(m=><tr key={m.id}><td className="px-3 py-3">{formatDate(m.createdAt)}</td><td className="px-3 py-3">{spareparts.find(p=>p.id===m.sparepartId)?.name || m.sparepartId}</td><td className="px-3 py-3">{m.direction==='IN'?'Masuk':'Keluar'}</td><td className="px-3 py-3">{m.qty}</td><td className="px-3 py-3">{m.stockAfter}</td><td className="px-3 py-3">{m.ticketId || m.reference || '—'}</td><td className="px-3 py-3">{money(m.totalCost)}</td></tr>)}</tbody></TableWrap> : <Empty title="Belum ada pergerakan stok"/>}</Panel></div>;
  };

  const renderSchedule = () => {
    const year = scheduleMonth.getFullYear();
    const month = scheduleMonth.getMonth();
    const monthNames = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    // Maintenance Calendar menampilkan seluruh agenda; filter tanggal sengaja tidak diterapkan di kalender.
    const schedulePmRows = sortRows(pmRows, 'schedule');
    const scheduleWoRows = sortRows(tickets, 'schedule');
    const scheduleExportItems = sortRows([
      ...schedulePmRows.map(r=>({ ...r, nextMaintenanceDate:r.nextMaintenanceDate, kind:'Preventive', exportTicketId:'' })),
      ...scheduleWoRows.map(t=>({ ...t, startTime:t.startTime, kind:'Work Order', exportTicketId:t.ticketId })),
    ], 'schedule');
    const scheduleExport = [['Tanggal','Jenis','Ticket ID','Charger ID','Lokasi','Teknisi','Status'], ...scheduleExportItems.map(r=>[dateKey(r.nextMaintenanceDate || r.startTime),r.kind,r.exportTicketId,r.chargerId,r.site,r.assignedTechnician || r.technicianName,r.pmStatus || r.status])];
    const upcoming = schedulePmRows;
    const eventsForDate = (dateString) => [
      ...schedulePmRows.filter(s => s.nextMaintenanceDate === dateString).map(s => ({ id: `pm-${s.id}`, label: `PM · ${s.chargerId}`, type: 'PM', chargerId: s.chargerId })),
      ...scheduleWoRows.filter(t => String(t.startTime || '').slice(0,10) === dateString).map(t => ({ id: `wo-${t.id}`, label: `${t.ticketId} · ${t.chargerId}`, type: 'WO', chargerId: t.chargerId })),
    ];
    return <div className="space-y-5">
      <Panel title="Maintenance Calendar" subtitle="Kalender jadwal PM dan pekerjaan berdasarkan tanggal">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div className="flex flex-wrap gap-2"><Button variant="secondary" onClick={()=>exportCsv('cazgo-maintenance-schedule.csv',scheduleExport)}><Download size={14}/> CSV</Button><Button variant="secondary" onClick={()=>exportXlsx('cazgo-maintenance-schedule.xlsx',scheduleExport)}><Download size={14}/> Excel</Button></div><div className="flex items-center gap-2"><div><p className="text-lg font-extrabold text-slate-800">{monthNames[month]} {year}</p><p className="text-xs text-slate-500">PM schedule dan tanggal mulai work order</p></div><div className="flex gap-2"><Button variant="secondary" onClick={()=>setScheduleMonth(new Date(year,month-1,1))}><ChevronLeft size={16}/></Button><Button variant="secondary" onClick={()=>setScheduleMonth(new Date(year,month+1,1))}><ChevronRight size={16}/></Button></div></div></div>
        <div className="overflow-x-auto"><div className="grid min-w-[700px] grid-cols-7 gap-px overflow-hidden rounded-xl border border-slate-200 bg-slate-200">
          {['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'].map(day=><div key={day} className="bg-slate-50 px-2 py-3 text-center text-[10px] font-bold uppercase text-slate-500">{day}</div>)}
          {Array.from({length:firstDay},(_,i)=><div key={`empty-${i}`} className="min-h-[105px] bg-slate-50/70"/>)}
          {Array.from({length:daysInMonth},(_,i)=>{
            const day=i+1;
            const dateString=`${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
            const events=eventsForDate(dateString);
            const isToday=dateString===todayInput();
            return <div key={dateString} className={cn('min-h-[105px] bg-white p-2',isToday&&'bg-blue-50/60')}>
              <span className={cn('inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold',isToday?'bg-blue-600 text-white':'text-slate-600')}>{day}</span>
              <div className="mt-1 space-y-1">{events.slice(0,3).map(event=><div key={event.id} title={event.label} className={cn('truncate rounded px-1.5 py-1 text-[9px] font-semibold',event.type==='PM'?'bg-emerald-50 text-emerald-700':'bg-blue-50 text-blue-700')}>{event.label}</div>)}{events.length>3&&<p className="text-[9px] text-slate-400">+{events.length-3} lainnya</p>}</div>
            </div>;
          })}
        </div></div>
        <div className="mt-3 flex flex-wrap gap-4 text-[10px] text-slate-500"><span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm bg-emerald-400"/> Preventive Maintenance</span><span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-sm bg-blue-400"/> Work Order</span></div>
      </Panel>
      <Panel title="Upcoming Preventive Maintenance" subtitle="Daftar jadwal PM terdekat">
        {upcoming.length ? <div className="space-y-2">{upcoming.map(s=><div key={s.id} className="flex flex-col gap-3 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-center"><div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-blue-50 text-blue-700"><CalendarDays size={17}/><span className="mt-0.5 text-[9px] font-bold">{s.nextMaintenanceDate?.slice(5) || '—'}</span></div><div className="min-w-0 flex-1"><p className="font-bold text-slate-800">{s.chargerId} · {s.site}</p><p className="mt-1 text-xs text-slate-500">PM berikutnya: {s.nextMaintenanceDate || 'Belum dijadwalkan'} · Interval {s.intervalDays} hari</p><p className="mt-1 text-[11px] text-slate-400">Teknisi: {s.assignedTechnician || 'Belum ditentukan'}</p></div><Badge>{s.pmStatus}</Badge><Button variant="secondary" disabled={!canManage} onClick={()=>{setTicketForm({...ticketForm,chargerId:s.chargerId,type:'Preventive',category:'Routine PM',priority:'Low',complaint:'Preventive maintenance terjadwal',technicianId:activeTechnicians.some(t=>t.id===s.assignedTechnicianId)?s.assignedTechnicianId:'',technicianName:activeTechnicians.find(t=>t.id===s.assignedTechnicianId)?.name||''});setModal('ticket')}}>Buat WO</Button></div>)}</div> : <Empty title="Belum ada jadwal maintenance"/>}
      </Panel>
    </div>;
  };

  const renderReports = () => {
    const monthKey = (value) => {
      const date = safeDate(value);
      return date ? `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}` : '';
    };
    const months = [...new Set(tickets.map(t=>monthKey(t.createdAt)).filter(Boolean))].sort().reverse();
    const reportTickets = sortRows(filterDateRange(tickets.filter(t => reportPeriod === 'all' || monthKey(t.createdAt) === reportPeriod), 'reports', t => t.createdAt), 'reports');
    const reportCorrective = reportTickets.filter(t => ['Corrective','Emergency'].includes(t.type) && t.status === 'Selesai' && t.startTime && t.finishTime);
    const mttr = reportCorrective.length ? reportCorrective.reduce((sum,t)=>sum+Number(t.downtimeMinutes||0),0)/reportCorrective.length : 0;
    const completedPm = reportTickets.filter(t=>t.type==='Preventive'&&t.status==='Selesai').length;
    const reportDowntime = reportTickets.reduce((sum,t)=>sum+Number(t.downtimeMinutes||0),0);
    const reportCosts = filterDateRange(stockMovements.filter(m => m.direction === 'OUT' && (reportPeriod === 'all' || monthKey(m.createdAt) === reportPeriod)), 'reports', m => m.createdAt).reduce((sum,m)=>sum+Number(m.totalCost||0),0);
    const technicianStats = technicians.map(tech => {
      const assigned = reportTickets.filter(t => t.technicianName === tech.name);
      return { ...tech, total: assigned.length, completed: assigned.filter(t=>t.status==='Selesai').length, downtime: assigned.reduce((sum,t)=>sum+Number(t.downtimeMinutes||0),0) };
    }).filter(t=>t.total>0);
    const duePmCount = filterDateRange(pmRows, 'reports', s => s.nextMaintenanceDate).filter(s=>s.pmStatus==='Due Soon'||s.pmStatus==='Overdue').length;
    return <div className="space-y-5"><Panel title="Maintenance Performance Reports" subtitle="Ringkasan performa dan ekspor transaksi" action={null}>
      {dateToolbar('reports', [['Ticket ID','Tanggal','Charger ID','Site','Jenis','Kategori','Prioritas','Teknisi','Status','Downtime (menit)','Keluhan','Root Cause','Tindakan'], ...reportTickets.map(t=>[t.ticketId,formatDate(t.createdAt),t.chargerId,t.site,t.type,t.category,t.priority,t.technicianName,t.status,Number(t.downtimeMinutes||0),t.complaint,t.rootCause,t.actionTaken])], 'cazgo-maintenance-report', reportTickets.length,
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end"><Field label="Periode laporan"><Select value={reportPeriod} onChange={e=>setReportPeriod(e.target.value)}><option value="all">Semua Periode</option>{months.map(m=><option key={m} value={m}>{m}</option>)}</Select></Field><p className="pb-2 text-xs text-slate-500">KPI dan grafik mengikuti periode yang dipilih.</p></div>)}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4"><StatCard label="Total Work Order" value={reportTickets.length} icon={ClipboardList}/><StatCard label="Completed WO" value={reportTickets.filter(t=>t.status==='Selesai').length} icon={CheckCircle2} tone="green"/><StatCard label="MTTR" value={`${mttr.toFixed(0)} menit`} hint="Rata-rata durasi corrective selesai" icon={Clock3} tone="violet"/><StatCard label="PM Completed" value={completedPm} hint={`${duePmCount} jadwal perlu perhatian`} icon={ShieldCheck} tone="green"/></div>
      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2"><div className="rounded-xl border border-slate-200 p-4"><h4 className="mb-3 text-sm font-bold text-slate-700">Work Order by Type</h4>{['Preventive','Corrective','Inspection','Emergency','Software-Firmware','Other'].map(type=><div key={type} className="mb-3"><div className="mb-1 flex justify-between text-xs"><span>{type}</span><b>{reportTickets.filter(t=>t.type===type).length}</b></div><div className="h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-blue-500" style={{width:`${reportTickets.length?reportTickets.filter(t=>t.type===type).length/reportTickets.length*100:0}%`}}/></div></div>)}</div><div className="rounded-xl border border-slate-200 p-4"><h4 className="mb-3 text-sm font-bold text-slate-700">Downtime & Cost</h4><div className="mb-4"><p className="text-xs text-slate-500">Total Downtime</p><p className="text-2xl font-extrabold text-slate-800">{(reportDowntime/60).toFixed(1)} jam</p></div><div><p className="text-xs text-slate-500">Sparepart Cost</p><p className="text-2xl font-extrabold text-slate-800">{money(reportCosts)}</p></div></div></div>
      <div className="mt-5 rounded-xl border border-slate-200 p-4"><h4 className="mb-3 text-sm font-bold text-slate-700">Technician Performance</h4>{technicianStats.length ? <TableWrap><thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-500"><tr>{sortHeader('Teknisi','reportTech','name')}{sortHeader('Total WO','reportTech','total')}{sortHeader('Selesai','reportTech','completed')}{sortHeader('Downtime','reportTech','downtime')}</tr></thead><tbody className="divide-y divide-slate-100">{sortRows(technicianStats, 'reportTech').map(t=><tr key={t.id}><td className="px-3 py-3 font-semibold">{t.name}</td><td className="px-3 py-3">{t.total}</td><td className="px-3 py-3">{t.completed}</td><td className="px-3 py-3">{t.downtime} menit</td></tr>)}</tbody></TableWrap> : <p className="text-xs text-slate-400">Belum ada data penugasan teknisi pada periode ini.</p>}</div>
      <p className="mt-4 rounded-lg bg-amber-50 p-3 text-xs leading-5 text-amber-800">Catatan metrik: MTTR dihitung dari rata-rata durasi start–finish pada corrective selesai. MTBF belum ditampilkan karena definisi waktu kegagalan dan histori occurrence per unit perlu divalidasi. PM Completed adalah jumlah tiket Preventive selesai, bukan persentase compliance.</p>
    </Panel></div>;
  };

  const renderModal = () => {
    if (modal === 'ticket-detail' && selectedTicket) return <Modal title={`Detail ${selectedTicket.ticketId}`} onClose={()=>setModal('')} wide><form onSubmit={saveTicketEdit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4"><div className="rounded-lg bg-slate-50 p-3"><p className="text-[10px] text-slate-500">Charger</p><b className="text-sm">{selectedTicket.chargerId}</b></div><div className="rounded-lg bg-slate-50 p-3"><p className="text-[10px] text-slate-500">Site</p><b className="text-sm">{selectedTicket.site || '—'}</b></div><div className="rounded-lg bg-slate-50 p-3"><p className="text-[10px] text-slate-500">Jenis</p><b className="text-sm">{selectedTicket.type}</b></div><div className="rounded-lg bg-slate-50 p-3"><p className="text-[10px] text-slate-500">Prioritas</p><b className="text-sm">{selectedTicket.priority}</b></div></div>
      <div className="rounded-xl border border-slate-200 p-4"><p className="mb-1 text-xs font-semibold text-slate-500">Keluhan</p><p className="text-sm text-slate-800">{selectedTicket.complaint || '—'}</p></div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2"><Field label="Temuan"><Textarea rows={3} value={ticketEditForm.findings} onChange={e=>setTicketEditForm({...ticketEditForm,findings:e.target.value})}/></Field><Field label="Root Cause"><Textarea rows={3} value={ticketEditForm.rootCause} onChange={e=>setTicketEditForm({...ticketEditForm,rootCause:e.target.value})}/></Field></div>
      <Field label="Tindakan Perbaikan"><Textarea rows={3} value={ticketEditForm.actionTaken} onChange={e=>setTicketEditForm({...ticketEditForm,actionTaken:e.target.value})}/></Field>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2"><Field label="Teknisi"><Select value={ticketEditForm.technicianId || ''} onChange={e=>{const tech=selectedTechnician(e.target.value);setTicketEditForm({...ticketEditForm,technicianId:tech?.id||'',technicianName:tech?.name||''})}}><option value="">Pilih Teknisi</option> {String(ticketEditForm.technicianId||'').startsWith('legacy:') && <option value={ticketEditForm.technicianId}>{ticketEditForm.technicianName} (data lama)</option>}{activeTechnicians.map(t=><option key={t.id} value={t.id}>{t.name}{t.email?` · ${t.email}`:''}</option>)}</Select></Field><Field label="Kondisi Charger"><Select value={ticketEditForm.chargerCondition} onChange={e=>setTicketEditForm({...ticketEditForm,chargerCondition:e.target.value})}>{['Under Investigation','Normal / Online','Normal / Offline','Gangguan','Tidak dapat digunakan','Operational','Partially Operational','Fault','Out of Service'].map(x=><option key={x}>{x}</option>)}</Select></Field></div>
      <Field label="Catatan"><Textarea rows={2} value={ticketEditForm.notes} onChange={e=>setTicketEditForm({...ticketEditForm,notes:e.target.value})}/></Field>
      <div className="flex flex-wrap gap-3">{[['Buka Dokumentasi',selectedTicket.attachmentUrl],['Foto Sebelum (data lama)',selectedTicket.photoBeforeUrl],['Foto Sesudah (data lama)',selectedTicket.photoAfterUrl],['Foto Tambahan (data lama)',selectedTicket.photoAdditionalUrl]].filter(([,url])=>url).map(([label,url])=><a key={label} href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-xs font-semibold text-blue-700 hover:underline">{label} <Download size={13}/></a>)}</div>
      <div className="flex justify-end gap-2 border-t border-slate-100 pt-4"><Button variant="secondary" onClick={()=>setModal('')}>Tutup</Button><Button type="submit" disabled={!canManage || saving}>{saving?'Menyimpan...':'Simpan Perubahan'}</Button></div>
    </form></Modal>;
    if (modal === 'ticket') return <Modal title="Buat Work Order" onClose={()=>setModal('')} wide><form onSubmit={saveTicket} className="space-y-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2"><Field label="Charger ID *"><Select required value={ticketForm.chargerId} onChange={e=>setTicketForm({...ticketForm,chargerId:e.target.value})}><option value="">Pilih Charger</option>{activeChargers.map(c=><option key={c.id} value={c.chargerId}>{c.chargerId} — {c.site}</option>)}</Select></Field><Field label="Jenis Maintenance"><Select value={ticketForm.type} onChange={e=>setTicketForm({...ticketForm,type:e.target.value})}>{['Preventive','Corrective','Inspection','Software-Firmware','Emergency','Other'].map(x=><option key={x}>{x}</option>)}</Select></Field><Field label="Kategori Gangguan / Pekerjaan"><Select value={ticketForm.category} onChange={e=>setTicketForm({...ticketForm,category:e.target.value})}>{['Electrical Failure','Communication Failure','Connector / Gun Failure','Power Module Failure','Cooling System Failure','Display / HMI Failure','Software / Firmware','Payment / Transaction Failure','Routine PM','Inspection','Other'].map(x=><option key={x}>{x}</option>)}</Select></Field><Field label="Prioritas"><Select value={ticketForm.priority} onChange={e=>setTicketForm({...ticketForm,priority:e.target.value})}>{['Low','Medium','High','Critical'].map(x=><option key={x}>{x}</option>)}</Select></Field><Field label="Teknisi"><Select value={ticketForm.technicianId} onChange={e=>{const tech=selectedTechnician(e.target.value);setTicketForm({...ticketForm,technicianId:tech?.id||'',technicianName:tech?.name||''})}}><option value="">Pilih Teknisi</option>{activeTechnicians.map(t=><option key={t.id} value={t.id}>{t.name}{t.email?` · ${t.email}`:''}</option>)}</Select>{!activeTechnicians.length && <span className="text-[11px] text-amber-700">Belum ada teknisi aktif. Tambahkan melalui Master → Technician.</span>}</Field><Field label="Status awal"><Select value={ticketForm.status} onChange={e=>setTicketForm({...ticketForm,status:e.target.value})}><option>Open</option><option>Progress</option><option>Pending</option></Select></Field><Field label="Waktu mulai"><Input type="datetime-local" value={ticketForm.startTime} onChange={e=>setTicketForm({...ticketForm,startTime:e.target.value})}/></Field><Field label="Waktu selesai (opsional)"><Input type="datetime-local" value={ticketForm.finishTime} onChange={e=>setTicketForm({...ticketForm,finishTime:e.target.value})}/></Field></div>
      <Field label="Keluhan / Laporan Awal *"><Textarea required rows={2} value={ticketForm.complaint} onChange={e=>setTicketForm({...ticketForm,complaint:e.target.value})}/></Field>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2"><Field label="Temuan"><Textarea rows={2} value={ticketForm.findings} onChange={e=>setTicketForm({...ticketForm,findings:e.target.value})}/></Field><Field label="Root Cause"><Textarea rows={2} value={ticketForm.rootCause} onChange={e=>setTicketForm({...ticketForm,rootCause:e.target.value})}/></Field></div>
      <Field label="Tindakan Perbaikan"><Textarea rows={2} value={ticketForm.actionTaken} onChange={e=>setTicketForm({...ticketForm,actionTaken:e.target.value})}/></Field>
      <div className="rounded-xl border border-slate-200 p-4 space-y-2">
        <p className="text-sm font-bold text-slate-700">Link Dokumentasi</p>
        <p className="text-xs text-slate-500">Masukkan link folder atau file dokumentasi Google Drive perusahaan. Foto dikelola langsung melalui Google Drive; ChargeTrack hanya menyimpan tautannya.</p>
        <Field label="Link Dokumentasi Google Drive / URL (opsional)">
          <Input type="url" value={ticketForm.attachmentUrl} onChange={e=>setTicketForm({...ticketForm,attachmentUrl:e.target.value})} placeholder="https://drive.google.com/drive/folders/..."/>
        </Field>
      </div>
      <div className="rounded-xl border border-slate-200 p-4"><p className="mb-3 text-sm font-bold text-slate-700">Pemakaian Sparepart (opsional)</p><div className="grid grid-cols-1 gap-3 md:grid-cols-2"><Field label="Sparepart"><Select value={ticketForm.sparepartId} onChange={e=>setTicketForm({...ticketForm,sparepartId:e.target.value})}><option value="">Tidak ada</option>{spareparts.map(p=><option key={p.id} value={p.id}>{p.name} · Stok {p.stock}</option>)}</Select></Field><Field label="Qty"><Input type="number" min="0" value={ticketForm.sparepartQty} onChange={e=>setTicketForm({...ticketForm,sparepartQty:e.target.value})}/></Field></div></div>
      <Field label="Catatan"><Textarea rows={2} value={ticketForm.notes} onChange={e=>setTicketForm({...ticketForm,notes:e.target.value})}/></Field>
      <div className="flex justify-end gap-2 border-t border-slate-100 pt-4"><Button variant="secondary" onClick={()=>setModal('')}>Batal</Button><Button type="submit" disabled={saving || !chargers.length}>{saving?'Menyimpan...':'Simpan Work Order'}</Button></div>
      {!chargers.length && <p className="text-xs text-rose-600">Master charger masih kosong. Tambahkan atau impor data charger terlebih dahulu.</p>}
    </form></Modal>;
    if (modal === 'technician') return <Modal title={editingTechnicianId ? 'Edit Master Technician' : 'Tambah Master Technician'} onClose={()=>{setModal('');setEditingTechnicianId('')}}><form onSubmit={saveTechnician} className="space-y-3"><Field label="Nama Teknisi *"><Input required value={technicianForm.name} onChange={e=>setTechnicianForm({...technicianForm,name:e.target.value})}/></Field><Field label="Email"><Input type="email" value={technicianForm.email} onChange={e=>setTechnicianForm({...technicianForm,email:e.target.value})}/></Field><Field label="Status"><Select value={technicianForm.status} onChange={e=>setTechnicianForm({...technicianForm,status:e.target.value})}><option>Aktif</option><option>Nonaktif</option></Select></Field><div className="flex justify-end gap-2 pt-3"><Button variant="secondary" onClick={()=>{setModal('');setEditingTechnicianId('')}}>Batal</Button><Button type="submit" disabled={saving}>{saving?'Menyimpan...':'Simpan Teknisi'}</Button></div></form></Modal>;
    if (modal === 'charger') return <Modal title={editingChargerId ? 'Edit Master Charger' : 'Tambah Master Charger'} onClose={()=>setModal('')} wide><form onSubmit={saveCharger} className="grid grid-cols-1 gap-3 md:grid-cols-2">
      <Field label="Charger ID *"><Input required disabled={!!editingChargerId} value={chargerForm.chargerId} onChange={e=>setChargerForm({...chargerForm,chargerId:e.target.value})}/></Field>
      <Field label="Site *"><Input required list="charge-sites" value={chargerForm.site} onChange={e=>setChargerForm({...chargerForm,site:e.target.value})}/><datalist id="charge-sites">{siteNames.map(s=><option key={s} value={s}/>)}</datalist></Field>
      <Field label="Alamat"><Input value={chargerForm.address} onChange={e=>setChargerForm({...chargerForm,address:e.target.value})}/></Field><Field label="Kota"><Input value={chargerForm.city} onChange={e=>setChargerForm({...chargerForm,city:e.target.value})}/></Field>
      <Field label="Tipe Charger"><Select value={chargerForm.chargerType} onChange={e=>setChargerForm({...chargerForm,chargerType:e.target.value})}><option>AC</option><option>DC</option></Select></Field><Field label="Power (kW)"><Input type="number" min="0" value={chargerForm.power} onChange={e=>setChargerForm({...chargerForm,power:e.target.value})}/></Field>
      <Field label="Connector"><Input value={chargerForm.connector} onChange={e=>setChargerForm({...chargerForm,connector:e.target.value})}/></Field><Field label="Serial Number"><Input value={chargerForm.serialNumber} onChange={e=>setChargerForm({...chargerForm,serialNumber:e.target.value})}/></Field>
      <Field label="Vendor"><Input value={chargerForm.vendor} onChange={e=>setChargerForm({...chargerForm,vendor:e.target.value})}/></Field><Field label="Tanggal Instalasi"><Input type="date" value={chargerForm.installationDate} onChange={e=>setChargerForm({...chargerForm,installationDate:e.target.value})}/></Field>
      <Field label="Status"><Select value={chargerForm.status} onChange={e=>setChargerForm({...chargerForm,status:e.target.value})}><option>Active</option><option>Fault</option><option>Inactive</option><option>Decommissioned</option></Select></Field><Field label="OCPP Status"><Select value={chargerForm.ocppStatus} onChange={e=>setChargerForm({...chargerForm,ocppStatus:e.target.value})}><option>Unknown</option><option>Online</option><option>Offline</option></Select></Field>
      <Field label="IP / Hostname"><Input value={chargerForm.ip} onChange={e=>setChargerForm({...chargerForm,ip:e.target.value})}/></Field><Field label="Keterangan"><Input value={chargerForm.notes} onChange={e=>setChargerForm({...chargerForm,notes:e.target.value})}/></Field>
      <div className="flex justify-end gap-2 pt-3 md:col-span-2"><Button variant="secondary" onClick={()=>setModal('')}>Batal</Button><Button type="submit" disabled={saving}>{saving?'Menyimpan...':'Simpan Charger'}</Button></div>
    </form></Modal>;

    if (modal === 'charger-profile' && selectedChargerProfile) {
      const c = selectedChargerProfile;
      const relatedTickets = sortedTickets.filter(t => t.chargerId === c.chargerId);
      const relatedInspections = inspections.filter(i => i.chargerId === c.chargerId);
      const relatedPm = schedules.filter(x => x.chargerId === c.chargerId);
      return <Modal title={`Profil Charger · ${c.chargerId}`} onClose={()=>setModal('')} wide><div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">{[['Status',c.archived?'Archived':c.status],['OCPP',c.ocppStatus],['Tipe',c.chargerType],['Daya',`${c.power || 0} kW`]].map(([label,value])=><div key={label} className="rounded-xl bg-slate-50 p-3"><p className="text-[10px] uppercase text-slate-500">{label}</p><p className="mt-1 font-bold text-slate-800">{value || '—'}</p></div>)}</div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">{[['Lokasi',c.site],['Alamat',c.address],['Kota',c.city],['Connector',c.connector],['Serial Number',c.serialNumber],['Vendor',c.vendor],['Tanggal Instalasi',c.installationDate],['IP / Hostname',c.ip],['Keterangan',c.notes]].map(([label,value])=><div key={label} className="rounded-lg border border-slate-100 p-3"><p className="text-[10px] font-semibold text-slate-500">{label}</p><p className="mt-1 text-sm text-slate-800">{value || '—'}</p></div>)}</div>
        <div className="grid grid-cols-3 gap-3"><div className="rounded-xl border p-3"><p className="text-xs text-slate-500">Work Order</p><p className="text-xl font-bold">{relatedTickets.length}</p></div><div className="rounded-xl border p-3"><p className="text-xs text-slate-500">Inspeksi</p><p className="text-xl font-bold">{relatedInspections.length}</p></div><div className="rounded-xl border p-3"><p className="text-xs text-slate-500">Jadwal PM</p><p className="text-xl font-bold">{relatedPm.length}</p></div></div>
        <Panel title="Riwayat Maintenance" subtitle="Pekerjaan terakhir pada charger ini">{relatedTickets.length ? renderTicketTable(relatedTickets.slice(0,8), 'history') : <Empty title="Belum ada riwayat pekerjaan"/>}</Panel>
        <div className="flex justify-end"><Button variant="secondary" onClick={()=>openEditCharger(c)} disabled={!canManage}>Edit Data Charger</Button></div>
      </div></Modal>;
    }
    if (modal === 'pm') return <Modal title="Atur Preventive Maintenance" onClose={()=>setModal('')}><form onSubmit={savePm} className="space-y-3"><Field label="Charger ID *"><Select required value={pmForm.chargerId} onChange={e=>setPmForm({...pmForm,chargerId:e.target.value})}><option value="">Pilih Charger</option>{activeChargers.map(c=><option key={c.id} value={c.chargerId}>{c.chargerId} — {c.site}</option>)}</Select></Field><div className="grid grid-cols-2 gap-3"><Field label="Interval (hari)"><Input type="number" min="1" required value={pmForm.intervalDays} onChange={e=>setPmForm({...pmForm,intervalDays:e.target.value})}/></Field><Field label="PM Pertama"><Input type="date" required value={pmForm.firstScheduleDate} onChange={e=>setPmForm({...pmForm,firstScheduleDate:e.target.value})}/></Field></div><Field label="Teknisi"><Select value={pmForm.assignedTechnicianId} onChange={e=>{const tech=selectedTechnician(e.target.value);setPmForm({...pmForm,assignedTechnicianId:tech?.id||'',assignedTechnician:tech?.name||''})}}><option value="">Pilih Teknisi</option>{activeTechnicians.map(t=><option key={t.id} value={t.id}>{t.name}{t.email?` · ${t.email}`:''}</option>)}</Select>{!activeTechnicians.length && <span className="text-[11px] text-amber-700">Belum ada teknisi aktif. Tambahkan melalui Master → Technician.</span>}</Field><Field label="Checklist"><Select value={pmForm.checklist} onChange={e=>setPmForm({...pmForm,checklist:e.target.value})}><option>Standard PM</option><option>AC Charger PM</option><option>DC Charger PM</option><option>Custom</option></Select></Field><Field label="Catatan"><Textarea rows={2} value={pmForm.notes} onChange={e=>setPmForm({...pmForm,notes:e.target.value})}/></Field><div className="flex justify-end gap-2 pt-3"><Button variant="secondary" onClick={()=>setModal('')}>Batal</Button><Button type="submit" disabled={saving || !chargers.length}>{saving?'Menyimpan...':'Simpan Jadwal'}</Button></div></form></Modal>;
    if (modal === 'sparepart') return <Modal title="Tambah Master Sparepart" onClose={()=>setModal('')}><form onSubmit={saveSparepart} className="space-y-3"><Field label="Nama Sparepart *"><Input required value={sparepartForm.name} onChange={e=>setSparepartForm({...sparepartForm,name:e.target.value})}/></Field><div className="grid grid-cols-2 gap-3"><Field label="Part Number"><Input value={sparepartForm.partNumber} onChange={e=>setSparepartForm({...sparepartForm,partNumber:e.target.value})}/></Field><Field label="Kategori"><Input value={sparepartForm.category} onChange={e=>setSparepartForm({...sparepartForm,category:e.target.value})}/></Field><Field label="Stok Awal"><Input type="number" min="0" value={sparepartForm.stock} onChange={e=>setSparepartForm({...sparepartForm,stock:e.target.value})}/></Field><Field label="Minimum Stok"><Input type="number" min="0" value={sparepartForm.minimumStock} onChange={e=>setSparepartForm({...sparepartForm,minimumStock:e.target.value})}/></Field><Field label="Harga Satuan"><Input type="number" min="0" value={sparepartForm.unitPrice} onChange={e=>setSparepartForm({...sparepartForm,unitPrice:e.target.value})}/></Field><Field label="Satuan"><Input value={sparepartForm.unit} onChange={e=>setSparepartForm({...sparepartForm,unit:e.target.value})}/></Field></div><Field label="Supplier"><Input value={sparepartForm.supplier} onChange={e=>setSparepartForm({...sparepartForm,supplier:e.target.value})}/></Field><Field label="Catatan"><Textarea rows={2} value={sparepartForm.notes} onChange={e=>setSparepartForm({...sparepartForm,notes:e.target.value})}/></Field><div className="flex justify-end gap-2 pt-3"><Button variant="secondary" onClick={()=>setModal('')}>Batal</Button><Button type="submit" disabled={saving}>{saving?'Menyimpan...':'Simpan Sparepart'}</Button></div></form></Modal>;
    if (modal === 'movement') return <Modal title="Mutasi Stok Sparepart" onClose={()=>setModal('')}><form onSubmit={saveMovement} className="space-y-3"><Field label="Sparepart *"><Select required value={movementForm.sparepartId} onChange={e=>setMovementForm({...movementForm,sparepartId:e.target.value})}><option value="">Pilih Sparepart</option>{spareparts.map(p=><option key={p.id} value={p.id}>{p.name} · Stok {p.stock}</option>)}</Select></Field><Field label="Jenis Mutasi"><Select value={movementForm.direction} onChange={e=>setMovementForm({...movementForm,direction:e.target.value})}><option value="IN">Stok Masuk</option><option value="OUT">Stok Keluar</option></Select></Field><Field label="Qty"><Input type="number" min="1" required value={movementForm.qty} onChange={e=>setMovementForm({...movementForm,qty:e.target.value})}/></Field><Field label="Ticket ID / Referensi"><Input value={movementForm.ticketId} onChange={e=>setMovementForm({...movementForm,ticketId:e.target.value})}/></Field><Field label="Catatan"><Textarea rows={2} value={movementForm.notes} onChange={e=>setMovementForm({...movementForm,notes:e.target.value})}/></Field><div className="flex justify-end gap-2 pt-3"><Button variant="secondary" onClick={()=>setModal('')}>Batal</Button><Button type="submit" disabled={saving || !spareparts.length}>{saving?'Menyimpan...':'Simpan Mutasi'}</Button></div></form></Modal>;
    if (modal === 'inspection') return <Modal title="Form Inspection & Checklist" onClose={()=>setModal('')} wide><form onSubmit={saveInspection} className="space-y-4"><div className="grid grid-cols-1 gap-3 md:grid-cols-3"><Field label="Charger ID"><Select required value={inspectionForm.chargerId} onChange={e=>setInspectionForm({...inspectionForm,chargerId:e.target.value})}><option value="">Pilih Charger</option>{activeChargers.map(c=><option key={c.id} value={c.chargerId}>{c.chargerId} — {c.site}</option>)}</Select></Field><Field label="Tanggal"><Input type="date" value={inspectionForm.inspectionDate} onChange={e=>setInspectionForm({...inspectionForm,inspectionDate:e.target.value})}/></Field><Field label="Teknisi"><Select value={inspectionForm.technicianId} onChange={e=>{const tech=selectedTechnician(e.target.value);setInspectionForm({...inspectionForm,technicianId:tech?.id||'',technicianName:tech?.name||''})}}><option value="">Pilih Teknisi</option>{activeTechnicians.map(t=><option key={t.id} value={t.id}>{t.name}{t.email?` · ${t.email}`:''}</option>)}</Select>{!activeTechnicians.length && <span className="text-[11px] text-amber-700">Belum ada teknisi aktif. Tambahkan melalui Master → Technician.</span>}</Field></div><div className="space-y-3">{CHECKLIST_GROUPS.map(group=><div key={group.group} className="rounded-xl border border-slate-200 p-4"><h4 className="mb-3 text-sm font-bold text-slate-700">{group.group}</h4><div className="grid grid-cols-1 gap-3 md:grid-cols-2">{group.items.map(item=><Field key={item} label={item}><Select value={inspectionForm.items[item] || 'OK'} onChange={e=>setInspectionForm({...inspectionForm,items:{...inspectionForm.items,[item]:e.target.value}})}><option>OK</option><option>NG</option><option>N/A</option></Select></Field>)}</div></div>)}</div><Field label="Kesimpulan"><Select value={inspectionForm.result} onChange={e=>setInspectionForm({...inspectionForm,result:e.target.value})}><option>OK</option><option>NG</option><option>Perlu Tindak Lanjut</option></Select></Field><Field label="Catatan"><Textarea rows={2} value={inspectionForm.notes} onChange={e=>setInspectionForm({...inspectionForm,notes:e.target.value})}/></Field><div className="flex justify-end gap-2 pt-3"><Button variant="secondary" onClick={()=>setModal('')}>Batal</Button><Button type="submit" disabled={saving || !chargers.length}>{saving?'Menyimpan...':'Simpan Inspeksi'}</Button></div></form></Modal>;
    return null;
  };

  const titles = {
    overview: 'Ringkasan kondisi aset, pekerjaan, dan jadwal preventive maintenance.',
    charger: 'Kelola data master charger, profil aset, status, dan detail unit.',
    technician: 'Kelola daftar teknisi yang digunakan untuk penugasan maintenance.', 
    ticket: 'Kelola work order dari laporan gangguan hingga verifikasi selesai.',
    pm: 'Atur interval dan pantau jatuh tempo preventive maintenance.',
    corrective: 'Pantau gangguan, diagnosis, tindakan perbaikan, dan pemulihan unit.',
    inspection: 'Catat hasil pemeriksaan teknis menggunakan checklist standar.',
    history: 'Telusuri riwayat perawatan setiap charger dan lokasi.',
    sparepart: 'Kelola master sparepart, persediaan, dan pemakaian.',
    schedule: 'Pantau agenda preventive maintenance dan pekerjaan teknisi.',
    reports: 'Evaluasi downtime, MTTR, PM, biaya, dan aktivitas maintenance.',
  };

  return <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto pb-10">
  
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex items-center gap-2"><span className="rounded-lg bg-emerald-50 p-2 text-emerald-600"><Wrench size={19}/></span><span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Maintenance Management</span></div><p className="mt-2 text-xs text-slate-500">{titles[currentPage]}</p></div><div className="flex flex-wrap gap-2"><span className="inline-flex items-center rounded-lg bg-white px-3 py-2 text-xs font-semibold text-slate-500 ring-1 ring-slate-200"><Activity size={14} className={cn("mr-2",loadError?"text-rose-500":loading?"text-amber-500":"text-emerald-500")}/>{loadError?"Koneksi bermasalah":loading?"Sinkronisasi...":"Real-time aktif"}</span></div></div>
    {notice && <div className="flex items-start justify-between gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs text-blue-800"><span>{notice}</span><button onClick={()=>setNotice('')}><X size={14}/></button></div>}
    {loadError && <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-800">{loadError}</div>}
    {loading && <div className="rounded-xl bg-white p-4 text-xs text-slate-500 shadow-sm">Memuat data Maintenance dari Firestore...</div>}
    {currentPage === 'overview' && renderOverview()}
    {currentPage === 'charger' && renderMasterCharger()}
    {currentPage === 'technician' && renderMasterTechnician()}
    {currentPage === 'ticket' && renderTickets(false)}
    {currentPage === 'pm' && renderPm()}
    {currentPage === 'corrective' && renderTickets(true)}
    {currentPage === 'inspection' && renderInspection()}
    {currentPage === 'history' && renderHistory()}
    {currentPage === 'sparepart' && renderSpareparts()}
    {currentPage === 'schedule' && renderSchedule()}
    {currentPage === 'reports' && renderReports()}
    {renderModal()}
  </div>;
}
