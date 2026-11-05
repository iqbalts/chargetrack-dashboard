import React, { useState, useEffect } from 'react';
import { 
  BatteryCharging, Calendar, CheckCircle2, ChevronRight, 
  LayoutDashboard, LogOut, Settings as SettingsIcon, 
  MapPin, Wrench, Shield, Users, Plus, Trash2, Key, X, AlertCircle 
} from 'lucide-react';
import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import { 
  getFirestore, collection, onSnapshot, 
  doc, setDoc, updateDoc, deleteDoc, addDoc 
} from "firebase/firestore";

// --- FIREBASE CONFIGURATION ---
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "caztrack-app.firebaseapp.com",
  projectId: "caztrack-app",
  storageBucket: "caztrack-app.firebasestorage.app",
  messagingSenderId: "952486734549",
  appId: "1:952486734549:web:6e4ce8083a8aaa4fbad05c"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [locations, setLocations] = useState([]);
  const [users, setUsers] = useState([]);
  
  // States untuk fitur
  const [resetModal, setResetModal] = useState({ isOpen: false, userId: '', email: '', newPassword: '' });
  const [authError, setAuthError] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // State form tambah user
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'viewer' });

  // --- FIREBASE SYNC & SEEDING ---
  useEffect(() => {
    signInAnonymously(auth).catch((error) => console.error("Firebase Auth Error:", error));

    const unsubLocations = onSnapshot(collection(db, "locations"), (snapshot) => {
      const locData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setLocations(locData);
    });

    const unsubUsers = onSnapshot(collection(db, "users"), (snapshot) => {
      const userData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      if (userData.length === 0) {
        const defaultUsers = [
          { email: 'admin@cazgo.id', password: 'admin', role: 'admin', name: 'Admin Utama' },
          { email: 'budi@cazgo.id', password: 'budi', role: 'editor', name: 'Budi (Editor)' },
          { email: 'siti@cazgo.id', password: 'siti', role: 'viewer', name: 'Siti (Viewer)' }
        ];
        defaultUsers.forEach(u => setDoc(doc(collection(db, "users")), u));
      } else {
        setUsers(userData);
      }
    });

    return () => {
      unsubLocations();
      unsubUsers();
    };
  }, []);

  // --- HANDLERS LOGIN & LOGOUT ---
  const handleLogin = (e) => {
    e.preventDefault();
    const user = users.find(u => u.email === loginEmail && u.password === loginPassword);
    if (user) {
      setCurrentUser(user);
      setActiveTab('dashboard');
      setAuthError('');
    } else {
      setAuthError('Email atau password salah bray!');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setLoginEmail('');
    setLoginPassword('');
  };

  // --- HANDLERS LOKASI ---
  const handleAddLocation = async () => {
    try {
      await addDoc(collection(db, "locations"), {
        name: "Lokasi Baru CAZTrack",
        progress: 0,
        status: "Belum Mulai",
        date: "",
        description: "",
        chargers: [],
        pics: []
      });
    } catch (error) {
      console.error("Gagal nambah lokasi:", error);
    }
  };

  const handleDeleteLocation = async (id) => {
    if (window.confirm("Yakin bray mau ngapus lokasi ini secara permanen?")) {
      try {
        await deleteDoc(doc(db, "locations", id));
      } catch (error) {
        console.error("Gagal ngapus lokasi:", error);
      }
    }
  };

  const handleLocationChange = async (id, field, value) => {
    try {
      await updateDoc(doc(db, "locations", id), { [field]: value });
    } catch (error) {
      console.error("Gagal update lokasi:", error);
    }
  };

  // --- HANDLERS ARRAY DI LOKASI (CHARGER & PIC) ---
  const updateArrayField = async (locId, field, arrayData) => {
    try {
      await updateDoc(doc(db, "locations", locId), { [field]: arrayData });
    } catch (error) {
      console.error(`Gagal update array ${field}:`, error);
    }
  };

  const addArrayItem = (locId, field, defaultItem) => {
    const loc = locations.find(l => l.id === locId);
    const newArray = [...(loc[field] || []), defaultItem];
    updateArrayField(locId, field, newArray);
  };

  const removeArrayItem = (locId, field, index) => {
    const loc = locations.find(l => l.id === locId);
    const newArray = loc[field].filter((_, i) => i !== index);
    updateArrayField(locId, field, newArray);
  };

  const handleArrayChange = (locId, field, index, key, value) => {
    const loc = locations.find(l => l.id === locId);
    const newArray = [...loc[field]];
    newArray[index] = { ...newArray[index], [key]: value };
    updateArrayField(locId, field, newArray);
  };

  // --- HANDLERS PENGATURAN (USER) ---
  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "users"), newUser);
      setNewUser({ name: '', email: '', password: '', role: 'viewer' });
      alert("User berhasil ditambahkan!");
    } catch (error) {
      console.error("Gagal tambah user:", error);
    }
  };

  const handleDeleteUser = async (id) => {
    if (window.confirm("Hapus user ini?")) {
      await deleteDoc(doc(db, "users", id));
    }
  };

  const handleSavePassword = async () => {
    if (resetModal.newPassword.trim() === '') return alert("Password tidak boleh kosong!");
    try {
      await updateDoc(doc(db, "users", resetModal.userId), { password: resetModal.newPassword });
      setResetModal({ isOpen: false, userId: '', email: '', newPassword: '' });
      alert("Password berhasil diubah!");
    } catch (error) {
      console.error("Gagal reset password:", error);
    }
  };

  // --- RENDER LOGIN ---
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex justify-center items-center gap-2 mb-2">
              <BatteryCharging size={40} className="text-green-600" />
              <h1 className="text-3xl font-bold text-gray-800">
                <span className="text-green-600">CAZ</span>TRACK
              </h1>
            </div>
            <p className="text-gray-500">Masuk ke Dashboard SPKLU</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            {authError && (
              <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm border border-red-200">
                {authError}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email" required value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 outline-none"
                placeholder="admin@cazgo.id"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password" required value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 outline-none"
                placeholder="••••••••"
              />
            </div>
            <button type="submit" className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors font-medium">
              Masuk
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- RENDER UTAMA ---
  return (
    <div className="min-h-screen bg-gray-50 flex relative">
      
      {/* Custom Modal Reset Password */}
      {resetModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="bg-green-600 p-4 text-white flex justify-between items-center">
              <h3 className="font-bold flex items-center gap-2"><Key size={18} /> Reset Password</h3>
              <button onClick={() => setResetModal({ isOpen: false, userId: '', email: '', newPassword: '' })} className="hover:bg-green-700 p-1 rounded-md">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-green-50 text-green-800 p-3 rounded-md text-sm border border-green-200">
                Ubah password untuk akun: <strong>{resetModal.email}</strong>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password Baru</label>
                <input
                  type="text"
                  value={resetModal.newPassword}
                  onChange={(e) => setResetModal({...resetModal, newPassword: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 outline-none"
                  placeholder="Masukkan password baru..."
                  autoFocus
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setResetModal({ isOpen: false, userId: '', email: '', newPassword: '' })} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md">
                  Batal
                </button>
                <button onClick={handleSavePassword} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
                  Simpan Password
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6">
          <div className="flex items-center gap-2">
            <BatteryCharging size={32} className="text-green-600" />
            <h1 className="text-2xl font-bold text-gray-800">
              <span className="text-green-600">CAZ</span>TRACK
            </h1>
          </div>
        </div>
        
        <nav className="flex-1 px-4 space-y-2">
          <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${activeTab === 'dashboard' ? 'bg-green-50 text-green-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}>
            <LayoutDashboard size={20} /> Overview
          </button>
          <button onClick={() => setActiveTab('calendar')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${activeTab === 'calendar' ? 'bg-green-50 text-green-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}>
            <Calendar size={20} /> Jadwal & Kalender
          </button>
          {(currentUser.role === 'admin' || currentUser.role === 'editor') && (
            <button onClick={() => setActiveTab('update')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${activeTab === 'update' ? 'bg-green-50 text-green-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}>
              <Wrench size={20} /> Update Progress
            </button>
          )}
          {currentUser.role === 'admin' && (
            <button onClick={() => setActiveTab('settings')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${activeTab === 'settings' ? 'bg-green-50 text-green-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}>
              <SettingsIcon size={20} /> Pengaturan
            </button>
          )}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className="mb-4 px-4">
            <p className="text-sm font-medium text-gray-800">{currentUser.name}</p>
            <p className="text-xs text-gray-500 capitalize">Role: {currentUser.role}</p>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
            <LogOut size={20} /> Keluar
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-8 overflow-y-auto">
        
        {/* TAB 1: OVERVIEW */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Dashboard Overview</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><MapPin size={24} /></div>
                  <div><p className="text-sm text-gray-500">Total Lokasi</p><p className="text-2xl font-bold text-gray-800">{locations.length}</p></div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-50 text-green-600 rounded-lg"><CheckCircle2 size={24} /></div>
                  <div><p className="text-sm text-gray-500">Selesai</p><p className="text-2xl font-bold text-gray-800">{locations.filter(l => l.status === 'Selesai').length}</p></div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-yellow-50 text-yellow-600 rounded-lg"><BatteryCharging size={24} /></div>
                  <div><p className="text-sm text-gray-500">Sedang Berjalan</p><p className="text-2xl font-bold text-gray-800">{locations.filter(l => l.status === 'Sedang Berjalan').length}</p></div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-50 text-purple-600 rounded-lg"><Wrench size={24} /></div>
                  <div><p className="text-sm text-gray-500">Total Charger</p><p className="text-2xl font-bold text-gray-800">{locations.reduce((acc, loc) => acc + (loc.chargers?.length || 0), 0)}</p></div>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mt-8">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-800">Status Pekerjaan SPKLU</h3>
              </div>
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-sm font-medium text-gray-500">Lokasi</th>
                    <th className="px-6 py-4 text-sm font-medium text-gray-500">Progress</th>
                    <th className="px-6 py-4 text-sm font-medium text-gray-500">Status & Jadwal</th>
                    <th className="px-6 py-4 text-sm font-medium text-gray-500">Chargers</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {locations.map(loc => (
                    <tr key={loc.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-800">{loc.name}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-full bg-gray-200 rounded-full h-2 max-w-[150px]">
                            <div className={`h-2 rounded-full ${loc.progress === 100 ? 'bg-green-500' : 'bg-blue-500'}`} style={{ width: `${loc.progress}%` }}></div>
                          </div>
                          <span className="text-sm font-medium text-gray-600">{loc.progress}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1 items-start">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${loc.status === 'Selesai' ? 'bg-green-100 text-green-700' : loc.status === 'Sedang Berjalan' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                            {loc.status}
                          </span>
                          {loc.date && (
                            <span className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                              <Calendar size={12} /> {loc.date}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {loc.chargers?.length > 0 ? `${loc.chargers.length} Unit` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: KALENDER LENGKAP */}
        {activeTab === 'calendar' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Jadwal & Kalender (November 2026)</h2>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="grid grid-cols-7 gap-4 mb-4 text-center font-medium text-gray-500">
                <div>Min</div><div>Sen</div><div>Sel</div><div>Rab</div><div>Kam</div><div>Jum</div><div>Sab</div>
              </div>
              <div className="grid grid-cols-7 gap-4">
                {Array.from({ length: 30 }, (_, i) => i + 1).map(day => {
                  const currentDateStr = `2026-11-${day.toString().padStart(2, '0')}`;
                  const dayLocations = locations.filter(l => l.date === currentDateStr);
                  
                  return (
                    <div key={day} className={`min-h-[100px] p-2 border rounded-lg ${dayLocations.length > 0 ? 'bg-green-50 border-green-200' : 'border-gray-100'}`}>
                      <span className={`text-sm font-bold ${dayLocations.length > 0 ? 'text-green-700' : 'text-gray-400'}`}>{day}</span>
                      <div className="mt-2 space-y-1">
                        {dayLocations.map(loc => (
                          <div key={loc.id} className="text-xs bg-white p-1 rounded border border-green-100 text-green-700 shadow-sm truncate" title={loc.name}>
                            {loc.name}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: UPDATE PROGRESS (FULL NESTED FORM) */}
        {activeTab === 'update' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Update Progress SPKLU</h2>
              <button onClick={handleAddLocation} className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center">
                <Plus size={18} className="mr-2" /> Tambah Lokasi
              </button>
            </div>

            {locations.map((loc) => (
              <div key={loc.id} className="bg-white p-6 rounded-lg shadow-md border border-gray-100 mb-6">
                <div className="flex justify-between items-center bg-gray-50 p-3 rounded-md mb-4 border border-gray-200">
                  <input
                    type="text" value={loc.name}
                    onChange={(e) => handleLocationChange(loc.id, "name", e.target.value)}
                    className="text-xl font-bold bg-transparent border-b border-gray-300 focus:border-green-600 focus:outline-none w-1/2"
                    placeholder="Nama Lokasi..."
                  />
                  <button onClick={() => handleDeleteLocation(loc.id)} className="text-red-500 hover:text-red-700 ml-4 p-2 bg-red-50 rounded-md hover:bg-red-100 transition-colors" title="Hapus Lokasi">
                    <Trash2 size={20} />
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Progress (%)</label>
                    <input
                      type="range" min="0" max="100" value={loc.progress}
                      onChange={(e) => handleLocationChange(loc.id, "progress", parseInt(e.target.value))}
                      className="w-full accent-green-600"
                    />
                    <div className="text-right text-sm font-bold text-green-600 mt-1">{loc.progress}%</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status Pekerjaan</label>
                    <select
                      value={loc.status}
                      onChange={(e) => handleLocationChange(loc.id, "status", e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 outline-none"
                    >
                      <option value="Belum Mulai">Belum Mulai</option>
                      <option value="Sedang Berjalan">Sedang Berjalan</option>
                      <option value="Selesai">Selesai</option>
                      <option value="Tertunda">Tertunda</option>
                    </select>
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tanggal Target / Pemasangan</label>
                  <input
                    type="date" value={loc.date || ''}
                    onChange={(e) => handleLocationChange(loc.id, "date", e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md outline-none focus:border-green-500"
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Deskripsi / Catatan Lapangan</label>
                  <textarea
                    value={loc.description || ''}
                    onChange={(e) => handleLocationChange(loc.id, "description", e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md outline-none focus:border-green-500 h-24"
                    placeholder="Masukkan update lapangan di sini..."
                  />
                </div>

                {/* Sub-form Chargers */}
                <div className="bg-gray-50 p-4 rounded-md mb-4 border border-gray-200">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-bold text-gray-700">Daftar Charger</h4>
                    <button onClick={() => addArrayItem(loc.id, "chargers", { type: '', brand: '', qty: 1 })} className="text-sm bg-green-600 text-white px-2 py-1 rounded flex items-center hover:bg-green-700">
                      <Plus size={14} className="mr-1"/> Tambah Charger
                    </button>
                  </div>
                  {loc.chargers?.map((charger, idx) => (
                    <div key={idx} className="flex gap-2 mb-2 items-center">
                      <input type="text" placeholder="Tipe (cth: DC 50kW)" value={charger.type} onChange={(e) => handleArrayChange(loc.id, "chargers", idx, "type", e.target.value)} className="flex-1 p-2 text-sm border border-gray-300 rounded" />
                      <input type="text" placeholder="Brand" value={charger.brand} onChange={(e) => handleArrayChange(loc.id, "chargers", idx, "brand", e.target.value)} className="flex-1 p-2 text-sm border border-gray-300 rounded" />
                      <input type="number" placeholder="Qty" value={charger.qty} onChange={(e) => handleArrayChange(loc.id, "chargers", idx, "qty", parseInt(e.target.value))} className="w-20 p-2 text-sm border border-gray-300 rounded" />
                      <button onClick={() => removeArrayItem(loc.id, "chargers", idx)} className="p-2 text-red-500 hover:bg-red-100 rounded"><Trash2 size={16}/></button>
                    </div>
                  ))}
                </div>

                {/* Sub-form PICs */}
                <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-bold text-gray-700">Penanggung Jawab (PIC)</h4>
                    <button onClick={() => addArrayItem(loc.id, "pics", { name: '', contact: '' })} className="text-sm bg-green-600 text-white px-2 py-1 rounded flex items-center hover:bg-green-700">
                      <Plus size={14} className="mr-1"/> Tambah PIC
                    </button>
                  </div>
                  {loc.pics?.map((pic, idx) => (
                    <div key={idx} className="flex gap-2 mb-2 items-center">
                      <input type="text" placeholder="Nama PIC" value={pic.name} onChange={(e) => handleArrayChange(loc.id, "pics", idx, "name", e.target.value)} className="flex-1 p-2 text-sm border border-gray-300 rounded" />
                      <input type="text" placeholder="Kontak / No HP" value={pic.contact} onChange={(e) => handleArrayChange(loc.id, "pics", idx, "contact", e.target.value)} className="flex-1 p-2 text-sm border border-gray-300 rounded" />
                      <button onClick={() => removeArrayItem(loc.id, "pics", idx)} className="p-2 text-red-500 hover:bg-red-100 rounded"><Trash2 size={16}/></button>
                    </div>
                  ))}
                </div>

              </div>
            ))}
          </div>
        )}

        {/* TAB 4: PENGATURAN LENGKAP */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Pengaturan Sistem</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="p-6 border-b border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2"><Users size={20} className="text-green-600" /> Daftar Pengguna</h3>
                  </div>
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        <th className="px-6 py-4 text-sm font-medium text-gray-500">Nama Lengkap</th>
                        <th className="px-6 py-4 text-sm font-medium text-gray-500">Email Login</th>
                        <th className="px-6 py-4 text-sm font-medium text-gray-500">Role</th>
                        <th className="px-6 py-4 text-sm font-medium text-gray-500 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {users.map(u => (
                        <tr key={u.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 font-medium text-gray-800">{u.name}</td>
                          <td className="px-6 py-4 text-gray-600">{u.email}</td>
                          <td className="px-6 py-4 capitalize">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : u.role === 'editor' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>{u.role}</span>
                          </td>
                          <td className="px-6 py-4 flex justify-end gap-2">
                            <button onClick={() => setResetModal({ isOpen: true, userId: u.id, email: u.email, newPassword: '' })} className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-md transition-colors" title="Reset Password">
                              <Key size={18} />
                            </button>
                            <button onClick={() => handleDeleteUser(u.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Hapus User">
                              <Trash2 size={18} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><Shield size={20} className="text-green-600" /> Tambah Akses Baru</h3>
                  <form onSubmit={handleAddUser} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
                      <input type="text" required value={newUser.name} onChange={(e) => setNewUser({...newUser, name: e.target.value})} className="w-full p-2 border border-gray-300 rounded-md outline-none focus:border-green-500" placeholder="Cth: Joko Susilo" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email Login</label>
                      <input type="email" required value={newUser.email} onChange={(e) => setNewUser({...newUser, email: e.target.value})} className="w-full p-2 border border-gray-300 rounded-md outline-none focus:border-green-500" placeholder="nama@cazgo.id" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Password Baru</label>
                      <input type="text" required value={newUser.password} onChange={(e) => setNewUser({...newUser, password: e.target.value})} className="w-full p-2 border border-gray-300 rounded-md outline-none focus:border-green-500" placeholder="Password untuk login" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Role</label>
                      <select value={newUser.role} onChange={(e) => setNewUser({...newUser, role: e.target.value})} className="w-full p-2 border border-gray-300 rounded-md outline-none focus:border-green-500">
                        <option value="viewer">Viewer (Hanya Lihat)</option>
                        <option value="editor">Editor (Bisa Update)</option>
                        <option value="admin">Admin (Akses Penuh)</option>
                      </select>
                    </div>
                    <button type="submit" className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 mt-2 font-medium">
                      Simpan User Baru
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}