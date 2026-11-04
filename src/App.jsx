import React, { useState, useMemo } from 'react';

// --- ICONS ---
const ZapIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
);
const CalendarIcon = ({ width = 20, height = 20, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={width} height={height} className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
);
const PlusIcon = ({ width = 16, height = 16, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={width} height={height} className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
);
const ActivityIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
);
const HomeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
);
const SearchIcon = ({ className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
);
const ChevronDown = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
);
const SettingsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
);
const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
);

// --- DATA SETUP ---
const stepsKeys = [
  { key: 'earlySurvey', label: 'Early Survey' },
  { key: 'surveyTeknis', label: 'Survey Teknis' },
  { key: 'surveyPLN', label: 'Survey PLN' },
  { key: 'perizinan', label: 'Perizinan' },
  { key: 'penawaranVendor', label: 'Penawaran Vendor' },
  { key: 'pks', label: 'PKS' },
  { key: 'instalasi', label: 'Proses Instalasi' },
  { key: 'testing', label: 'Testing & Comm.' }
];

const initialData = [
  { 
    id: 1, 
    lokasi: "Mall Grand Indonesia", 
    chargers: [{ type: "7kW", brand: "TIDE", qty: 2 }, { type: "30kW", brand: "Starcharge", qty: 1 }],
    pics: ["Andi S."], 
    steps: { earlySurvey: "Selesai", surveyTeknis: "Selesai", surveyPLN: "Selesai", perizinan: "Proses", penawaranVendor: "Belum", pks: "Belum", instalasi: "Belum", testing: "Belum" }, 
    schedules: {},
    keterangan: "Menunggu tanda tangan izin manajemen" 
  },
  { 
    id: 2, 
    lokasi: "Rest Area KM 57", 
    chargers: [{ type: "120kW", brand: "Moderntec", qty: 2 }],
    pics: ["Budi P.", "Siti A."], 
    steps: { earlySurvey: "Selesai", surveyTeknis: "Selesai", surveyPLN: "Jadwal", perizinan: "Selesai", penawaranVendor: "Selesai", pks: "Proses", instalasi: "Belum", testing: "Belum" }, 
    schedules: { surveyPLN: "2026-11-10" },
    keterangan: "Draft PKS direview legal" 
  },
  { 
    id: 3, 
    lokasi: "Apartemen Kalibata City", 
    chargers: [{ type: "7kW", brand: "Teison", qty: 3 }],
    pics: ["Citra R."], 
    steps: { earlySurvey: "Selesai", surveyTeknis: "Jadwal", surveyPLN: "Belum", perizinan: "Belum", penawaranVendor: "Belum", pks: "Belum", instalasi: "Belum", testing: "Belum" }, 
    schedules: { surveyTeknis: "2026-11-20" },
    keterangan: "Jadwal teknis 20 Nov" 
  },
  { 
    id: 4, 
    lokasi: "Perkantoran Sudirman", 
    chargers: [{ type: "22kW", brand: "TIDE", qty: 1 }, { type: "60kW", brand: "Starcharge", qty: 2 }],
    pics: ["Dimas W."], 
    steps: { earlySurvey: "Selesai", surveyTeknis: "Selesai", surveyPLN: "Selesai", perizinan: "Jadwal", penawaranVendor: "Selesai", pks: "Selesai", instalasi: "Proses", testing: "Belum" }, 
    schedules: { perizinan: "2026-11-28" },
    keterangan: "Pekerjaan sipil berjalan" 
  },
  { 
    id: 5, 
    lokasi: "RS Mitra Keluarga", 
    chargers: [{ type: "30kW", brand: "Moderntec", qty: 1 }],
    pics: ["Eka T."], 
    steps: { earlySurvey: "Belum", surveyTeknis: "Belum", surveyPLN: "Belum", perizinan: "Belum", penawaranVendor: "Belum", pks: "Belum", instalasi: "Belum", testing: "Belum" }, 
    schedules: {},
    keterangan: "Masuk pipeline bulan depan" 
  }
];

const initialUsers = [
  { id: 1, name: 'Admin EV', email: 'admin@chargetrack.id', role: 'Admin' },
  { id: 2, name: 'Budi P.', email: 'budi@chargetrack.id', role: 'Editor' },
  { id: 3, name: 'Siti A.', email: 'siti@chargetrack.id', role: 'Viewer' },
];

// --- MAIN COMPONENT ---
export default function SpkluDashboard() {
  const [locations, setLocations] = useState(initialData);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeView, setActiveView] = useState("dashboard"); // 'dashboard', 'update', 'calendar', 'settings'
  
  // State untuk Users
  const [users, setUsers] = useState(initialUsers);
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'Viewer' });

  // State untuk Simulasi Login
  const [activeUserId, setActiveUserId] = useState(initialUsers[0].id);
  const currentUser = users.find(u => u.id === activeUserId) || users[0];

  // Setup Kalender, Default ke Nov 2026
  const [calDate, setCalDate] = useState(new Date(2026, 10, 1)); 

  // Handler mengubah status dropdown
  const handleStatusChange = (id, stepKey, newValue) => {
    setLocations(prevData => prevData.map(loc => {
      if (loc.id === id) {
        return {
          ...loc,
          steps: { ...loc.steps, [stepKey]: newValue }
        };
      }
      return loc;
    }));
  };

  // Handler menyimpan input tanggal dari date picker
  const handleDateChange = (id, stepKey, dateValue) => {
    setLocations(prevData => prevData.map(loc => {
      if (loc.id === id) {
        return {
          ...loc,
          schedules: { ...loc.schedules, [stepKey]: dateValue }
        };
      }
      return loc;
    }));
  };

  // --- Handlers Charger ---
  const handleAddCharger = (id) => {
    setLocations(prevData => prevData.map(loc => {
      if (loc.id === id) {
        return { ...loc, chargers: [...(loc.chargers || []), { type: '7kW', brand: 'TIDE', qty: 1 }] };
      }
      return loc;
    }));
  };

  const handleRemoveCharger = (id, indexToRemove) => {
    setLocations(prevData => prevData.map(loc => {
      if (loc.id === id) {
        return { ...loc, chargers: loc.chargers.filter((_, idx) => idx !== indexToRemove) };
      }
      return loc;
    }));
  };

  const handleChargerChange = (id, index, field, value) => {
    setLocations(prevData => prevData.map(loc => {
      if (loc.id === id) {
        const newChargers = [...loc.chargers];
        newChargers[index] = { ...newChargers[index], [field]: value };
        return { ...loc, chargers: newChargers };
      }
      return loc;
    }));
  };

  // --- Handlers PIC ---
  const handleAddPic = (id) => {
    setLocations(prevData => prevData.map(loc => {
      if (loc.id === id) {
        return { ...loc, pics: [...(loc.pics || []), ""] };
      }
      return loc;
    }));
  };

  const handleRemovePic = (id, indexToRemove) => {
    setLocations(prevData => prevData.map(loc => {
      if (loc.id === id) {
        return { ...loc, pics: loc.pics.filter((_, idx) => idx !== indexToRemove) };
      }
      return loc;
    }));
  };

  const handlePicChange = (id, index, value) => {
    setLocations(prevData => prevData.map(loc => {
      if (loc.id === id) {
        const newPics = [...loc.pics];
        newPics[index] = value;
        return { ...loc, pics: newPics };
      }
      return loc;
    }));
  };

  // Handler buat baris lokasi baru
  const handleAddLocation = () => {
    const newLoc = {
      id: Date.now(),
      lokasi: "Titik SPKLU Baru",
      chargers: [{ type: '7kW', brand: 'TIDE', qty: 1 }],
      pics: ["Nama PIC"],
      steps: { earlySurvey: "Belum", surveyTeknis: "Belum", surveyPLN: "Belum", perizinan: "Belum", penawaranVendor: "Belum", pks: "Belum", instalasi: "Belum", testing: "Belum" }, 
      schedules: {},
      keterangan: "" 
    };
    setLocations([newLoc, ...locations]);
  };

  // --- Handlers Users ---
  const handleAddUser = (e) => {
    e.preventDefault();
    if (!newUser.name || !newUser.email) return;
    setUsers([...users, { ...newUser, id: Date.now() }]);
    setNewUser({ name: '', email: '', role: 'Viewer' });
  };

  const handleRemoveUser = (id) => {
    setUsers(users.filter(u => u.id !== id));
  };

  const calculateProgress = (steps) => {
    const totalSteps = 8;
    const completedSteps = Object.values(steps).filter(s => s === 'Selesai').length;
    return (completedSteps / totalSteps) * 100;
  };

  const getStatusClasses = (status) => {
    switch (status) {
      case 'Selesai': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Proses': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Jadwal': return 'bg-sky-100 text-sky-700 border-sky-200';
      case 'Belum': return 'bg-slate-100 text-slate-600 border-slate-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusAkhir = (progress) => {
    if (progress === 100) return { label: 'Selesai', color: 'bg-emerald-500' };
    if (progress > 0) return { label: 'Proses', color: 'bg-amber-500' };
    return { label: 'Menunggu', color: 'bg-slate-400' };
  };

  const stats = useMemo(() => {
    let completed = 0;
    let inProgress = 0;
    let waiting = 0;
    locations.forEach(loc => {
      const prog = calculateProgress(loc.steps);
      if (prog === 100) completed++;
      else if (prog > 0) inProgress++;
      else waiting++;
    });
    return { total: locations.length, completed, inProgress, waiting };
  }, [locations]);

  const filteredData = locations.filter(loc => 
    loc.lokasi.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (loc.pics && loc.pics.some(p => p.toLowerCase().includes(searchTerm.toLowerCase()))) ||
    (loc.pic && loc.pic.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // --- Logic Kalender ---
  const prevMonth = () => setCalDate(new Date(calDate.getFullYear(), calDate.getMonth() - 1, 1));
  const nextMonth = () => setCalDate(new Date(calDate.getFullYear(), calDate.getMonth() + 1, 1));

  const renderCalendar = () => {
    const year = calDate.getFullYear();
    const month = calDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    const monthName = calDate.toLocaleString('id-ID', { month: 'long' });

    const days = [];
    // Cell Kosong buat awal bulan
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="min-h-[120px] border border-slate-200 bg-slate-50/50 p-2"></div>);
    }

    // Hitung tanggal bulan ini
    for (let d = 1; d <= daysInMonth; d++) {
      const currentDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      
      const dayEvents = [];
      locations.forEach(loc => {
        Object.entries(loc.schedules).forEach(([stepKey, dateStr]) => {
          if (dateStr === currentDateStr && loc.steps[stepKey] === 'Jadwal') {
            const stepLabel = stepsKeys.find(s => s.key === stepKey)?.label;
            dayEvents.push({ locName: loc.lokasi, stepLabel });
          }
        });
      });

      days.push(
        <div key={`day-${d}`} className="min-h-[120px] border border-slate-200 bg-white p-2 flex flex-col gap-1.5 hover:bg-slate-50 transition-colors">
          <span className="text-sm font-bold text-slate-400 self-end mb-1">{d}</span>
          {dayEvents.map((ev, idx) => (
            <div key={idx} className="bg-blue-50 border-l-2 border-blue-500 text-slate-700 text-[10px] p-1.5 rounded-r shadow-sm leading-tight">
              <span className="block font-bold text-blue-700">{ev.stepLabel}</span>
              <span className="truncate block mt-0.5 opacity-90">{ev.locName}</span>
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 w-full max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-2xl font-bold text-slate-800">{monthName} {year}</h3>
            <p className="text-sm text-slate-500 mt-1">Jadwal deployment SPKLU bulan ini</p>
          </div>
          <div className="flex gap-2">
            <button onClick={prevMonth} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-semibold transition-colors">&laquo; Sebelumnya</button>
            <button onClick={nextMonth} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-semibold transition-colors">Berikutnya &raquo;</button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-0 border-t border-l border-slate-200 rounded-xl overflow-hidden bg-slate-200">
          {['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'].map(day => (
            <div key={day} className="py-3 text-center text-xs font-bold text-slate-600 uppercase bg-slate-100 border-r border-b border-slate-200">{day}</div>
          ))}
          {days}
        </div>
      </div>
    );
  };

  // --- Logic Settings (Users) ---
  const renderSettings = () => (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Card Tambah Pengguna */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h3 className="text-lg font-bold text-slate-800 mb-4">Tambah Pengguna Baru</h3>
        <form onSubmit={handleAddUser} className="flex flex-col md:flex-row gap-4 items-end">
          <div className="w-full">
            <label className="block text-xs font-semibold text-slate-500 mb-1">Nama Lengkap</label>
            <input 
              type="text" required
              value={newUser.name}
              onChange={(e) => setNewUser({...newUser, name: e.target.value})}
              placeholder="Contoh: Andi S."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 bg-slate-50 text-sm"
            />
          </div>
          <div className="w-full">
            <label className="block text-xs font-semibold text-slate-500 mb-1">Alamat Email</label>
            <input 
              type="email" required
              value={newUser.email}
              onChange={(e) => setNewUser({...newUser, email: e.target.value})}
              placeholder="andi@chargetrack.id"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 bg-slate-50 text-sm"
            />
          </div>
          <div className="w-full md:w-64 shrink-0">
            <label className="block text-xs font-semibold text-slate-500 mb-1">Hak Akses (Role)</label>
            <select 
              value={newUser.role}
              onChange={(e) => setNewUser({...newUser, role: e.target.value})}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 bg-slate-50 text-sm cursor-pointer"
            >
              <option value="Admin">Admin (Full Access)</option>
              <option value="Editor">Editor (Update Progress)</option>
              <option value="Viewer">Viewer (Read-only)</option>
            </select>
          </div>
          <button type="submit" className="w-full md:w-auto px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-sm transition-colors whitespace-nowrap">
            Simpan Pengguna
          </button>
        </form>
      </div>

      {/* Tabel Daftar Pengguna */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
          <h3 className="text-lg font-bold text-slate-800">Daftar Pengguna Sistem</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white text-slate-500 text-xs uppercase tracking-wider font-semibold border-b border-slate-200">
                <th className="py-3 px-6">Nama Pengguna</th>
                <th className="py-3 px-6">Email</th>
                <th className="py-3 px-6">Role</th>
                <th className="py-3 px-6 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-6 text-sm font-semibold text-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      {user.name}
                    </div>
                  </td>
                  <td className="py-3 px-6 text-sm text-slate-600">{user.email}</td>
                  <td className="py-3 px-6">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      user.role === 'Admin' ? 'bg-purple-100 text-purple-700' :
                      user.role === 'Editor' ? 'bg-amber-100 text-amber-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="py-3 px-6 text-center">
                    {user.role !== 'Admin' && (
                      <button 
                        onClick={() => handleRemoveUser(user.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors inline-flex"
                        title="Hapus Pengguna"
                      >
                        <TrashIcon />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-slate-900 text-white flex-col hidden md:flex">
        <nav className="flex-1 px-4 mt-8 space-y-2">
          <button 
            onClick={() => setActiveView('dashboard')} 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${activeView === 'dashboard' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
            <ActivityIcon /> <span className="font-medium">Dashboard</span>
          </button>
          
          {currentUser.role !== 'Viewer' && (
            <button 
              onClick={() => setActiveView('update')} 
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${activeView === 'update' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
              <HomeIcon /> <span className="font-medium">Update Progress</span>
            </button>
          )}

          <button 
            onClick={() => setActiveView('calendar')} 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${activeView === 'calendar' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
            <CalendarIcon /> <span className="font-medium">Kalender</span>
          </button>
          
          {currentUser.role === 'Admin' && (
            <button 
              onClick={() => setActiveView('settings')} 
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${activeView === 'settings' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
              <SettingsIcon /> <span className="font-medium">Pengaturan</span>
            </button>
          )}
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        
        <header className="bg-white border-b border-slate-200 px-8 py-5 flex justify-between items-center z-10">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">
              {activeView === 'dashboard' && 'Dashboard Project SPKLU'}
              {activeView === 'update' && 'Update Progress SPKLU'}
              {activeView === 'calendar' && 'Kalender Penjadwalan'}
              {activeView === 'settings' && 'Pengaturan Sistem'}
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              {activeView === 'settings' ? 'Kelola akses pengguna dan pengaturan lainnya.' : 'Pantau progres deployment titik charging station.'}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative hidden md:block">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">
                <SearchIcon />
              </div>
              <input 
                type="text" 
                placeholder="Cari lokasi atau PIC..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-slate-200 rounded-full bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all w-64"
              />
            </div>
            {/* Tombol Tambah Lokasi hanya muncul di menu Update Progress */}
            {activeView === 'update' && (
              <button 
                onClick={handleAddLocation} 
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition shadow-sm"
              >
                <PlusIcon /> Tambah Lokasi
              </button>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-auto p-8">
          {activeView === 'calendar' ? renderCalendar() : activeView === 'settings' ? renderSettings() : (
            <>
              {/* Stat Cards - Hanya Tampil di Dashboard view */}
              {activeView === 'dashboard' && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
                    <div>
                      <p className="text-slate-500 text-sm font-medium">Total Titik</p>
                      <p className="text-3xl font-bold text-slate-800 mt-1">{stats.total}</p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                      <HomeIcon />
                    </div>
                  </div>
                  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
                    <div>
                      <p className="text-slate-500 text-sm font-medium">Selesai Beroperasi</p>
                      <p className="text-3xl font-bold text-emerald-600 mt-1">{stats.completed}</p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                      <ActivityIcon />
                    </div>
                  </div>
                  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
                    <div>
                      <p className="text-slate-500 text-sm font-medium">Sedang Proses</p>
                      <p className="text-3xl font-bold text-amber-500 mt-1">{stats.inProgress}</p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                      <ZapIcon />
                    </div>
                  </div>
                  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
                    <div>
                      <p className="text-slate-500 text-sm font-medium">Menunggu</p>
                      <p className="text-3xl font-bold text-slate-600 mt-1">{stats.waiting}</p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                      <SearchIcon />
                    </div>
                  </div>
                </div>
              )}

              {/* Tabel - Dinamis antara Read-only dan Editable */}
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col relative z-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider font-semibold border-b border-slate-200">
                        <th className="py-4 px-4 sticky left-0 z-20 bg-slate-50 border-r border-slate-200">No</th>
                        <th className="py-4 px-4 sticky left-[48px] z-20 bg-slate-50 border-r border-slate-200 min-w-[200px]">Lokasi</th>
                        <th className="py-4 px-4 min-w-[140px]">Jenis Charger</th>
                        <th className="py-4 px-4 min-w-[130px]">Brand</th>
                        <th className="py-4 px-4 min-w-[100px]">Jumlah</th>
                        <th className="py-4 px-4 min-w-[120px]">PIC</th>
                        <th className="py-4 px-4 min-w-[180px]">Progress Keseluruhan</th>
                        {stepsKeys.map(step => (
                          <th key={step.key} className="py-4 px-4 min-w-[140px] text-center">{step.label}</th>
                        ))}
                        <th className="py-4 px-4 min-w-[140px]">Status Akhir</th>
                        <th className="py-4 px-4 min-w-[200px]">Keterangan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredData.map((row, index) => {
                        const progress = calculateProgress(row.steps);
                        const finalStatus = getStatusAkhir(progress);
                        
                        return (
                          <tr key={row.id} className="group border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                            <td className="py-3 px-4 text-sm text-slate-500 font-medium sticky left-0 z-10 bg-white group-hover:bg-slate-50/90 border-r border-slate-100">{index + 1}</td>
                            <td className="py-3 px-4 sticky left-[48px] z-10 bg-white group-hover:bg-slate-50/90 border-r border-slate-100 align-top">
                              {activeView === 'update' ? (
                                <input 
                                  type="text" 
                                  value={row.lokasi} 
                                  onChange={(e) => setLocations(locs => locs.map(l => l.id === row.id ? {...l, lokasi: e.target.value} : l))}
                                  className="w-full font-semibold text-slate-800 bg-transparent border-b border-dashed border-slate-300 focus:outline-none focus:border-blue-500 py-1" 
                                />
                              ) : (
                                <span className="font-semibold text-slate-800 block mt-1">{row.lokasi}</span>
                              )}
                            </td>
                            
                            {/* JENIS CHARGER */}
                            <td className="py-3 px-4 align-top">
                              {activeView === 'update' ? (
                                <div className="flex flex-col gap-1.5">
                                  {row.chargers?.map((c, i) => (
                                    <div key={i} className="h-7 flex items-center">
                                      <select
                                        value={c.type}
                                        onChange={(e) => handleChargerChange(row.id, i, 'type', e.target.value)}
                                        className="w-full text-xs font-semibold px-1 py-1 border border-slate-300 rounded focus:outline-none focus:border-blue-500 bg-slate-50 shadow-sm"
                                      >
                                        <option value="7kW">7kW</option>
                                        <option value="22kW">22kW</option>
                                        <option value="30kW">30kW</option>
                                        <option value="60kW">60kW</option>
                                        <option value="120kW">120kW</option>
                                        <option value="240kW">240kW</option>
                                      </select>
                                    </div>
                                  ))}
                                  <button onClick={() => handleAddCharger(row.id)} className="text-[10px] text-blue-600 font-bold mt-1 flex items-center gap-1 hover:text-blue-800 w-fit">
                                    <PlusIcon width={10} height={10} /> Tambah
                                  </button>
                                </div>
                              ) : (
                                <div className="flex flex-col gap-1.5">
                                  {row.chargers?.map((c, i) => (
                                    <div key={i} className="h-7 flex items-center text-[11px] font-bold text-slate-700 whitespace-nowrap bg-slate-100/60 px-2 rounded border border-slate-200/50 w-fit">
                                      {c.type} {['7kW', '22kW'].includes(c.type) ? 'AC' : 'DC'}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </td>

                            {/* BRAND CHARGER */}
                            <td className="py-3 px-4 align-top">
                              {activeView === 'update' ? (
                                <div className="flex flex-col gap-1.5">
                                  {row.chargers?.map((c, i) => (
                                    <div key={i} className="h-7 flex items-center">
                                      <select
                                        value={c.brand || 'TIDE'}
                                        onChange={(e) => handleChargerChange(row.id, i, 'brand', e.target.value)}
                                        className="w-full text-xs font-semibold px-1 py-1 border border-slate-300 rounded focus:outline-none focus:border-blue-500 bg-slate-50 shadow-sm"
                                      >
                                        <option value="TIDE">TIDE</option>
                                        <option value="Moderntec">Moderntec</option>
                                        <option value="Teison">Teison</option>
                                        <option value="Starcharge">Starcharge</option>
                                      </select>
                                    </div>
                                  ))}
                                  <div className="h-[22px] mt-1"></div> {/* Spacer untuk nyeimbangin tombol Tambah */}
                                </div>
                              ) : (
                                <div className="flex flex-col gap-1.5">
                                  {row.chargers?.map((c, i) => (
                                    <div key={i} className="h-7 flex items-center text-xs font-bold text-slate-600">
                                      {c.brand || 'TIDE'}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </td>

                            {/* JUMLAH UNIT */}
                            <td className="py-3 px-4 align-top">
                              {activeView === 'update' ? (
                                <div className="flex flex-col gap-1.5">
                                  {row.chargers?.map((c, i) => (
                                    <div key={i} className="h-7 flex items-center gap-1">
                                      <input
                                        type="number"
                                        min="1"
                                        value={c.qty}
                                        onChange={(e) => handleChargerChange(row.id, i, 'qty', parseInt(e.target.value) || 1)}
                                        className="w-12 text-xs font-semibold px-1 py-1 border border-slate-300 rounded focus:outline-none focus:border-blue-500 text-center bg-slate-50 shadow-sm"
                                      />
                                      <button onClick={() => handleRemoveCharger(row.id, i)} className="text-red-500 hover:bg-red-50 p-1 rounded transition-colors" title="Hapus">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                      </button>
                                    </div>
                                  ))}
                                  <div className="h-[22px] mt-1"></div> {/* Spacer */}
                                </div>
                              ) : (
                                <div className="flex flex-col gap-1.5">
                                  {row.chargers?.map((c, i) => (
                                    <div key={i} className="h-7 flex items-center text-xs font-semibold text-slate-600">
                                      {c.qty} Unit
                                    </div>
                                  ))}
                                </div>
                              )}
                            </td>

                            {/* PIC */}
                            <td className="py-3 px-4 text-sm text-slate-600 align-top">
                              {activeView === 'update' ? (
                                <div className="flex flex-col gap-1.5">
                                  {row.pics?.map((p, i) => (
                                    <div key={i} className="h-7 flex items-center gap-1">
                                      <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center shrink-0 text-[10px] font-bold text-slate-500">
                                        {p ? p.charAt(0).toUpperCase() : '-'}
                                      </div>
                                      <input 
                                        type="text" 
                                        value={p} 
                                        onChange={(e) => handlePicChange(row.id, i, e.target.value)}
                                        className="w-full text-xs font-semibold px-1 py-1 border border-slate-300 rounded focus:outline-none focus:border-blue-500 bg-slate-50 shadow-sm" 
                                        placeholder="Nama PIC"
                                      />
                                      <button onClick={() => handleRemovePic(row.id, i)} className="text-red-500 hover:bg-red-50 p-1 rounded transition-colors" title="Hapus">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                      </button>
                                    </div>
                                  ))}
                                  <button onClick={() => handleAddPic(row.id)} className="text-[10px] text-blue-600 font-bold mt-1 flex items-center gap-1 hover:text-blue-800 w-fit">
                                    <PlusIcon width={10} height={10} /> Tambah PIC
                                  </button>
                                </div>
                              ) : (
                                <div className="flex flex-col gap-1.5">
                                  {row.pics?.map((p, i) => (
                                    <div key={i} className="h-7 flex items-center gap-2">
                                      <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center shrink-0 text-[10px] font-bold text-slate-500">
                                        {p ? p.charAt(0).toUpperCase() : '-'}
                                      </div>
                                      <span className="truncate block mt-0.5 text-xs font-semibold">{p}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </td>
                            
                            {/* PROGRESS */}
                            <td className="py-3 px-4 align-top">
                              <div className="flex items-center gap-3 mt-1.5">
                                <div className="w-full bg-slate-100 rounded-full h-2.5 shadow-inner overflow-hidden">
                                  <div 
                                    className={`h-2.5 rounded-full transition-all duration-500 ease-out ${progress === 100 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                                    style={{ width: `${progress}%` }}
                                  ></div>
                                </div>
                                <span className="text-xs font-bold text-slate-600 w-9 text-right">{progress.toFixed(0)}%</span>
                              </div>
                            </td>

                            {stepsKeys.map(step => (
                              <td key={step.key} className="py-3 px-4 align-top">
                                {activeView === 'update' ? (
                                  // Mode Edit: Dropdown + DatePicker (kalau Jadwal)
                                  <div className="flex flex-col gap-1.5">
                                    <div className="relative inline-block w-full">
                                      <select 
                                        value={row.steps[step.key]} 
                                        onChange={(e) => handleStatusChange(row.id, step.key, e.target.value)}
                                        className={`w-full appearance-none px-2 py-1 pr-6 rounded text-xs font-semibold border outline-none cursor-pointer transition-colors shadow-sm ${getStatusClasses(row.steps[step.key])}`}
                                      >
                                        <option value="Selesai">Selesai</option>
                                        <option value="Proses">Proses</option>
                                        <option value="Jadwal">Jadwal</option>
                                        <option value="Belum">Belum</option>
                                      </select>
                                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1 text-slate-500">
                                        <ChevronDown />
                                      </div>
                                    </div>
                                    {row.steps[step.key] === 'Jadwal' && (
                                      <input 
                                        type="date"
                                        value={row.schedules[step.key] || ''}
                                        onChange={(e) => handleDateChange(row.id, step.key, e.target.value)}
                                        className="w-full text-[10px] px-1.5 py-1 border border-slate-300 rounded text-slate-700 bg-white shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                                      />
                                    )}
                                  </div>
                                ) : (
                                  // Mode Read: Label Status + Text Tanggal (kalau Jadwal)
                                  <div className="flex flex-col items-center gap-1">
                                    <div className={`px-2 py-1.5 rounded-lg text-[11px] font-semibold text-center border w-full truncate ${getStatusClasses(row.steps[step.key])}`}>
                                      {row.steps[step.key]}
                                    </div>
                                    {row.steps[step.key] === 'Jadwal' && row.schedules[step.key] && (
                                      <div className="text-[9px] font-medium text-slate-500 flex items-center gap-1 bg-slate-50 px-1.5 py-1 rounded border border-slate-200">
                                        <CalendarIcon width={10} height={10} /> 
                                        <span>{new Date(row.schedules[step.key]).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </td>
                            ))}

                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${finalStatus.color}`}></span>
                                <span className="text-sm font-semibold text-slate-700">{finalStatus.label}</span>
                              </div>
                            </td>
                            
                            <td className="py-3 px-4">
                              {activeView === 'update' ? (
                                <input 
                                  type="text" 
                                  value={row.keterangan} 
                                  onChange={(e) => setLocations(locs => locs.map(l => l.id === row.id ? {...l, keterangan: e.target.value} : l))}
                                  className="w-full text-sm text-slate-600 bg-transparent border-b border-transparent focus:border-slate-300 focus:outline-none focus:bg-slate-50 px-2 py-1.5 rounded transition-colors"
                                  placeholder="Tambahkan catatan..."
                                />
                              ) : (
                                <span className="text-sm text-slate-600 block leading-tight">{row.keterangan || '-'}</span>
                              )}
                            </td>
                            
                          </tr>
                        );
                      })}
                      
                      {filteredData.length === 0 && (
                        <tr>
                          <td colSpan={14} className="py-12 text-center text-slate-500">
                            Tidak ada data lokasi yang ditemukan.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}