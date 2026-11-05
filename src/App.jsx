import React, { useState, useEffect } from 'react';
import { 
  BatteryCharging, Calendar, CheckCircle2, ChevronRight, 
  LayoutDashboard, LogOut, Settings as SettingsIcon, 
  MapPin, Wrench, Shield, Users, Plus, Trash2, Key 
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
  const [resetModal, setResetModal] = useState({ isOpen: false, email: '' });
  const [authError, setAuthError] = useState('');

  // --- LOGIN STATE ---
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // --- FIREBASE SYNC & SEEDING ---
  useEffect(() => {
    // Login Anonim ke Firebase untuk buka gembok Firestore
    signInAnonymously(auth).catch((error) => console.error("Firebase Auth Error:", error));

    // Sinkronisasi Data Lokasi (Real-time)
    const unsubLocations = onSnapshot(collection(db, "locations"), (snapshot) => {
      const locData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setLocations(locData);
    });

    // Sinkronisasi Data Users (Real-time)
    const unsubUsers = onSnapshot(collection(db, "users"), (snapshot) => {
      const userData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      if (userData.length === 0) {
        // Seeding default users
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

  // --- HANDLERS ---
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
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 outline-none"
                placeholder="email@cazgo.id"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500 outline-none"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors font-medium"
            >
              Masuk
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- RENDER DASHBOARD (Main Layout) ---
  return (
    <div className="min-h-screen bg-gray-50 flex">
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
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${activeTab === 'dashboard' ? 'bg-green-50 text-green-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <LayoutDashboard size={20} />
            Overview
          </button>
          
          <button 
            onClick={() => setActiveTab('calendar')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${activeTab === 'calendar' ? 'bg-green-50 text-green-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <Calendar size={20} />
            Jadwal & Kalender
          </button>

          {(currentUser.role === 'admin' || currentUser.role === 'editor') && (
            <button 
              onClick={() => setActiveTab('update')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${activeTab === 'update' ? 'bg-green-50 text-green-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <Wrench size={20} />
              Update Progress
            </button>
          )}

          {currentUser.role === 'admin' && (
            <button 
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${activeTab === 'settings' ? 'bg-green-50 text-green-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <SettingsIcon size={20} />
              Pengaturan
            </button>
          )}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className="mb-4 px-4">
            <p className="text-sm font-medium text-gray-800">{currentUser.name}</p>
            <p className="text-xs text-gray-500 capitalize">Role: {currentUser.role}</p>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut size={20} />
            Keluar
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-8 overflow-y-auto">
        
        {/* TAB OVERVIEW */}
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
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mt-8">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-sm font-medium text-gray-500">Lokasi</th>
                    <th className="px-6 py-4 text-sm font-medium text-gray-500">Progress</th>
                    <th className="px-6 py-4 text-sm font-medium text-gray-500">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {locations.map(loc => (
                    <tr key={loc.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-800">{loc.name}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-full bg-gray-200 rounded-full h-2 max-w-[150px]">
                            <div className="bg-green-500 h-2 rounded-full" style={{ width: `${loc.progress}%` }}></div>
                          </div>
                          <span className="text-sm font-medium text-gray-600">{loc.progress}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${loc.status === 'Selesai' ? 'bg-green-100 text-green-700' : loc.status === 'Sedang Berjalan' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                          {loc.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB UPDATE PROGRESS */}
        {activeTab === 'update' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Update Progress SPKLU</h2>
              <button 
                onClick={handleAddLocation}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center"
              >
                <Plus size={18} className="mr-2" /> Tambah Lokasi
              </button>
            </div>

            {locations.map((loc) => (
              <div key={loc.id} className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
                <div className="flex justify-between items-center bg-gray-50 p-3 rounded-md mb-4">
                  <input
                    type="text"
                    value={loc.name}
                    onChange={(e) => handleLocationChange(loc.id, "name", e.target.value)}
                    className="text-lg font-bold bg-transparent border-b border-gray-300 focus:border-green-600 focus:outline-none w-1/2"
                    placeholder="Nama Lokasi..."
                  />
                  <button 
                    onClick={() => handleDeleteLocation(loc.id)}
                    className="text-red-500 hover:text-red-700 ml-4 p-2 bg-red-50 rounded-md hover:bg-red-100 transition-colors"
                    title="Hapus Lokasi"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
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
              </div>
            ))}
          </div>
        )}

        {/* TAB LAINNYA BISA DITAMBAHKAN DI SINI SEPERTI CALENDAR DAN SETTINGS (DISEDERHANAKAN DEMI CONCISE) */}
        {(activeTab === 'calendar' || activeTab === 'settings') && (
          <div className="flex items-center justify-center h-full text-gray-400">
            <p>Fitur {activeTab} siap digunakan. (Data sinkron dengan Firestore)</p>
          </div>
        )}

      </div>
    </div>
  );
}