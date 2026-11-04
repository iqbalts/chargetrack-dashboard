import React, { useState } from 'react';
import { Activity, Home, Calendar, Settings, Search, Trash2, Plus } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Data Lokasi SPKLU
  const [locations, setLocations] = useState([
    {
      id: 1,
      lokasi: 'Mall Grand Indonesia',
      jenis: ['7kW AC', '30kW DC'],
      brand: ['TIDE', 'Starcharge'],
      jumlah: ['2 Unit', '1 Unit'],
      pic: 'Andi S.',
      progress: 38,
      survey: 'Selesai',
      teknis: 'Selesai',
      pln: 'Selesai',
      izin: 'Proses'
    },
    {
      id: 2,
      lokasi: 'Rest Area KM 57',
      jenis: ['120kW DC'],
      brand: ['Moderntec'],
      jumlah: ['2 Unit'],
      pic: 'Budi P.',
      progress: 50,
      survey: 'Selesai',
      teknis: 'Selesai',
      pln: 'Jadwal 10 Nov',
      izin: 'Selesai'
    },
    {
      id: 3,
      lokasi: 'Apartemen Kalibata City',
      jenis: ['7kW AC'],
      brand: ['Teison'],
      jumlah: ['3 Unit'],
      pic: 'Citra R.',
      progress: 13,
      survey: 'Selesai',
      teknis: 'Jadwal 20 Nov',
      pln: 'Belum',
      izin: 'Belum'
    },
    {
      id: 4,
      lokasi: 'Perkantoran Sudirman',
      jenis: ['22kW AC', '60kW DC'],
      brand: ['TIDE', 'Starcharge'],
      jumlah: ['1 Unit', '2 Unit'],
      pic: 'Dimas W.',
      progress: 63,
      survey: 'Selesai',
      teknis: 'Selesai',
      pln: 'Selesai',
      izin: 'Jadwal 28 Nov'
    }
  ]);

  // Data Pengguna (Untuk Tab Pengaturan)
  const [users, setUsers] = useState([
    { id: 1, name: 'Admin Utama', email: 'admin@mail.com', role: 'Admin' },
    { id: 2, name: 'Budi P.', email: 'budi@mail.com', role: 'Editor' },
    { id: 3, name: 'Siti A.', email: 'siti@mail.com', role: 'Viewer' }
  ]);
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'Viewer' });

  // Fungsi Hapus Lokasi
  const handleDeleteLocation = (id) => {
    const isConfirm = window.confirm("Apakah Anda yakin ingin menghapus lokasi ini?");
    if (isConfirm) {
      setLocations(locations.filter(loc => loc.id !== id));
    }
  };

  // Fungsi Tambah User
  const handleAddUser = (e) => {
    e.preventDefault();
    if (newUser.name && newUser.email) {
      setUsers([...users, { id: Date.now(), ...newUser }]);
      setNewUser({ name: '', email: '', role: 'Viewer' });
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Activity },
    { id: 'update', label: 'Update Progress', icon: Home },
    { id: 'calendar', label: 'Kalender', icon: Calendar },
    { id: 'settings', label: 'Pengaturan', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-slate-50 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col p-4 shadow-xl z-10">
        <div className="mb-10 mt-4 px-2">
          {/* Logo dihapus agar rapi dan clean sesuai permintaan sebelumnya */}
          <h1 className="text-xl font-bold tracking-wider text-green-400">CHARGE<span className="text-white">TRACK</span></h1>
        </div>
        
        <nav className="flex-1 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-8 max-w-7xl mx-auto">
          
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-3xl font-bold text-slate-800">
                {activeTab === 'dashboard' && 'Dashboard Project SPKLU'}
                {activeTab === 'update' && 'Update Progress SPKLU'}
                {activeTab === 'calendar' && 'Kalender Deployment'}
                {activeTab === 'settings' && 'Pengaturan Sistem'}
              </h2>
              <p className="text-slate-500 mt-1">Pantau progres deployment titik charging station.</p>
            </div>
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Cari lokasi atau PIC..." 
                className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-full w-64 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
              />
            </div>
          </div>

          {/* TAB: DASHBOARD */}
          {activeTab === 'dashboard' && (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500 mb-1">Total Titik</p>
                    <p className="text-3xl font-bold text-slate-800">{locations.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                    <Home className="w-6 h-6" />
                  </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500 mb-1">Selesai Beroperasi</p>
                    <p className="text-3xl font-bold text-slate-800 text-green-600">0</p>
                  </div>
                  <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center text-green-600">
                    <Activity className="w-6 h-6" />
                  </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500 mb-1">Sedang Proses</p>
                    <p className="text-3xl font-bold text-slate-800 text-amber-500">{locations.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center text-amber-500">
                    <Activity className="w-6 h-6" />
                  </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500 mb-1">Menunggu</p>
                    <p className="text-3xl font-bold text-slate-800 text-slate-400">1</p>
                  </div>
                  <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-400">
                    <Search className="w-6 h-6" />
                  </div>
                </div>
              </div>

              {/* Data Table */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-100">
                      <tr>
                        <th className="py-4 px-4">NO</th>
                        <th className="py-4 px-4">LOKASI</th>
                        <th className="py-4 px-4">JENIS CHARGER</th>
                        <th className="py-4 px-4">BRAND</th>
                        <th className="py-4 px-4 text-center">JUMLAH</th>
                        <th className="py-4 px-4">PIC</th>
                        <th className="py-4 px-4 min-w-[120px]">PROGRESS</th>
                        <th className="py-4 px-4">SURVEY AWAL</th>
                        <th className="py-4 px-4">SURVEY TEKNIS</th>
                        <th className="py-4 px-4">SURVEY PLN</th>
                        <th className="py-4 px-4">PERIZINAN</th>
                        <th className="py-4 px-4 text-center">AKSI</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {locations.map