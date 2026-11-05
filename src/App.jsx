import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, updateDoc, deleteDoc, onSnapshot, collection } from 'firebase/firestore';

// --- Custom Icons (Replacing lucide-react to fix React version element mismatch) ---
const Activity = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>;
const Home = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>;
const Calendar = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="18" height="18" x="3" y="4" rx="2" ry="2"></rect><line x1="16" x2="16" y1="2" y2="6"></line><line x1="8" x2="8" y1="2" y2="6"></line><line x1="3" x2="21" y1="10" y2="10"></line></svg>;
const Settings = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg>;
const Search = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg>;
const Trash2 = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path><line x1="10" x2="10" y1="11" y2="17"></line><line x1="14" x2="14" y1="11" y2="17"></line></svg>;
const Plus = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M5 12h14"></path><path d="M12 5v14"></path></svg>;
const LogOut = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" x2="9" y1="12" y2="12"></line></svg>;
const Lock = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>;
const Mail = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="20" height="16" x="2" y="4" rx="2"></rect><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path></svg>;
const Key = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="7.5" cy="15.5" r="5.5"></circle><path d="m21 2-9.6 9.6"></path><path d="m15.5 7.5 3 3L22 7l-3-3"></path></svg>;

// --- Firebase Initialization ---
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
const appId = 'caztrack-v1'; // Identifier unik buat database lo

// Default Data Seeders
const defaultUsers = [
  { id: '1', name: 'Admin EV', email: 'admin@cazgo.id', role: 'Admin', password: 'admin' },
  { id: '2', name: 'Budi P.', email: 'budi@cazgo.id', role: 'Editor', password: 'budi' },
  { id: '3', name: 'Siti A.', email: 'siti@cazgo.id', role: 'Viewer', password: 'siti' }
];

const defaultLocations = [
  {
    id: '1', lokasi: 'Mall Grand Indonesia',
    chargers: [{ jenis: '7kW AC', brand: 'TIDE', jumlah: 2 }, { jenis: '30kW DC', brand: 'Starcharge', jumlah: 1 }],
    pics: ['Andi S.'],
    survey: 'Selesai', teknis: 'Selesai', pln: 'Selesai', izin: 'Proses',
    vendor: 'Belum', pks: 'Belum', instalasi: 'Belum', testing: 'Belum',
    keterangan: 'Menunggu tanda tangan izin manajemen'
  },
  {
    id: '2', lokasi: 'Rest Area KM 57',
    chargers: [{ jenis: '120kW DC', brand: 'Moderntec', jumlah: 2 }],
    pics: ['Budi P.', 'Siti A.'],
    survey: 'Selesai', teknis: 'Selesai', pln: 'Jadwal 2026-11-10', izin: 'Selesai',
    vendor: 'Selesai', pks: 'Proses', instalasi: 'Belum', testing: 'Belum',
    keterangan: 'Draft PKS direview legal'
  },
  {
    id: '3', lokasi: 'Apartemen Kalibata City',
    chargers: [{ jenis: '7kW AC', brand: 'Teison', jumlah: 3 }],
    pics: ['Citra R.'],
    survey: 'Selesai', teknis: 'Jadwal 2026-11-20', pln: 'Belum', izin: 'Belum',
    vendor: 'Belum', pks: 'Belum', instalasi: 'Belum', testing: 'Belum',
    keterangan: 'Jadwal teknis 20 Nov'
  },
  {
    id: '4', lokasi: 'Perkantoran Sudirman',
    chargers: [{ jenis: '22kW AC', brand: 'TIDE', jumlah: 1 }, { jenis: '60kW DC', brand: 'Starcharge', jumlah: 2 }],
    pics: ['Dimas W.'],
    survey: 'Selesai', teknis: 'Selesai', pln: 'Selesai', izin: 'Jadwal 2026-11-28',
    vendor: 'Selesai', pks: 'Selesai', instalasi: 'Proses', testing: 'Belum',
    keterangan: 'Pekerjaan sipil berjalan'
  }
];

export default function App() {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [isFirebaseLoaded, setIsFirebaseLoaded] = useState(false);
  
  const [currentUser, setCurrentUser] = useState(null);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [loginError, setLoginError] = useState('');

  const [activeTab, setActiveTab] = useState('dashboard');
  
  const [users, setUsers] = useState([]);
  const [locations, setLocations] = useState([]);
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'Viewer', password: '' });

  const [resetModal, setResetModal] = useState({ isOpen: false, userId: null, newPassword: '' });

  // 1. Initialize Firebase Auth
  useEffect(() => {
    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
      } catch (err) {
        console.error("Auth init error:", err);
      }
    };
    initAuth();
    
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
    });
    return () => unsubscribe();
  }, []);

  // 2. Fetch Users & Locations from Firestore
  useEffect(() => {
    if (!firebaseUser) return;

    const usersRef = collection(db, 'artifacts', appId, 'public', 'data', 'users');
    const locsRef = collection(db, 'artifacts', appId, 'public', 'data', 'locations');

    let seededUsers = false;
    let seededLocs = false;

    const unsubUsers = onSnapshot(usersRef, (snapshot) => {
      if (snapshot.empty && !seededUsers) {
        seededUsers = true;
        defaultUsers.forEach(u => setDoc(doc(usersRef, u.id), u));
      } else {
        const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        setUsers(data);
      }
    }, (err) => console.error(err));

    const unsubLocs = onSnapshot(locsRef, (snapshot) => {
      if (snapshot.empty && !seededLocs) {
        seededLocs = true;
        defaultLocations.forEach(l => setDoc(doc(locsRef, l.id), l));
      } else {
        const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => parseInt(a.id) - parseInt(b.id));
        setLocations(data);
        setIsFirebaseLoaded(true);
      }
    }, (err) => console.error(err));

    return () => {
      unsubUsers();
      unsubLocs();
    };
  }, [firebaseUser]);

  const handleLogin = (e) => {
    e.preventDefault();
    const user = users.find(u => u.email === loginForm.email && u.password === loginForm.password);
    if (user) {
      setCurrentUser(user);
      setLoginError('');
      setActiveTab('dashboard'); 
    } else {
      setLoginError('Email atau password salah!');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setLoginForm({ email: '', password: '' });
  };

  const calculateProgress = (loc) => {
    const stages = [loc.survey, loc.teknis, loc.pln, loc.izin, loc.vendor, loc.pks, loc.instalasi, loc.testing];
    const completed = stages.filter(s => s === 'Selesai').length;
    return Math.round((completed / 8) * 100);
  };

  const getStatusAkhir = (progress) => {
    if (progress === 0) return { text: 'Menunggu', color: 'text-slate-500', dot: 'bg-slate-500' };
    if (progress === 100) return { text: 'Selesai Beroperasi', color: 'text-green-600', dot: 'bg-green-500' };
    return { text: 'Proses', color: 'text-amber-600', dot: 'bg-amber-500' };
  };

  // --- Database Mutators ---
  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!firebaseUser) return;
    if (newUser.name && newUser.email && newUser.password) {
      const newId = Date.now().toString();
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'users', newId), { ...newUser, id: newId });
      setNewUser({ name: '', email: '', role: 'Viewer', password: '' });
    }
  };

  const handleDeleteUser = async (id) => {
    if (!firebaseUser) return;
    await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'users', id.toString()));
  };

  const saveNewPassword = async () => {
    if (!firebaseUser || !resetModal.userId || !resetModal.newPassword) return;
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'users', resetModal.userId.toString()), { 
      password: resetModal.newPassword 
    });
    setResetModal({ isOpen: false, userId: null, newPassword: '' });
  };

  const updateLocationStatus = async (id, field, value) => {
    if (!firebaseUser) return;
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'locations', id.toString()), { 
      [field]: value 
    });
  };

  // --- HANDLERS LOKASI & ARRAY ---
  const handleAddLocation = async () => {
    if (!firebaseUser) return;
    const newId = Date.now().toString();
    const newLocation = {
      id: newId, lokasi: 'Lokasi Baru', chargers: [], pics: [], keterangan: '',
      survey: 'Belum', teknis: 'Belum', pln: 'Belum', izin: 'Belum',
      vendor: 'Belum', pks: 'Belum', instalasi: 'Belum', testing: 'Belum'
    };
    await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'locations', newId), newLocation);
  };

  const handleDeleteLocation = async (id) => {
    if (!firebaseUser) return;
    if (window.confirm("Yakin bray mau ngapus lokasi ini secara permanen?")) {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'locations', id.toString()));
    }
  };

  const handleArrayAdd = async (locId, field, defaultItem) => {
    if (!firebaseUser) return;
    const loc = locations.find(l => l.id === locId);
    const newArray = [...(loc[field] || []), defaultItem];
    await updateLocationStatus(locId, field, newArray);
  };

  const handleArrayRemove = async (locId, field, index) => {
    if (!firebaseUser) return;
    const loc = locations.find(l => l.id === locId);
    const newArray = (loc[field] || []).filter((_, i) => i !== index);
    await updateLocationStatus(locId, field, newArray);
  };

  const handleArrayUpdate = async (locId, field, index, key, value) => {
    if (!firebaseUser) return;
    const loc = locations.find(l => l.id === locId);
    const newArray = [...(loc[field] || [])];
    newArray[index] = { ...newArray[index], [key]: value };
    await updateLocationStatus(locId, field, newArray);
  };

  const handleArrayUpdateString = async (locId, field, index, value) => {
    if (!firebaseUser) return;
    const loc = locations.find(l => l.id === locId);
    const newArray = [...(loc[field] || [])];
    newArray[index] = value;
    await updateLocationStatus(locId, field, newArray);
  };

  if (!isFirebaseLoaded) {
    return <div className="flex h-screen bg-slate-900 items-center justify-center font-sans text-white">Memuat Database...</div>;
  }

  if (!currentUser) {
    return (
      <div className="flex h-screen bg-slate-900 items-center justify-center font-sans">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold tracking-wider text-green-500 mb-2">CAZ<span className="text-slate-900">TRACK</span></h1>
            <p className="text-slate-500 text-sm">Masuk ke Dashboard SPKLU</p>
          </div>
          {loginError && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-medium mb-6 text-center border border-red-100">
              {loginError}
            </div>
          )}
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <div className="relative">
                <Mail className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                <input 
                  type="email" 
                  value={loginForm.email}
                  onChange={e => setLoginForm({...loginForm, email: e.target.value})}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                <input 
                  type="password" 
                  value={loginForm.password}
                  onChange={e => setLoginForm({...loginForm, password: e.target.value})}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>
            </div>
            <button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors mt-2">
              Masuk
            </button>
          </form>
        </div>
      </div>
    );
  }

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Activity },
    { id: 'update', label: 'Update Progress', icon: Home, allowedRoles: ['Admin', 'Editor'] },
    { id: 'calendar', label: 'Kalender', icon: Calendar },
    { id: 'settings', label: 'Pengaturan', icon: Settings, allowedRoles: ['Admin'] },
  ];

  const filteredNavItems = navItems.filter(item => 
    !item.allowedRoles || item.allowedRoles.includes(currentUser?.role)
  );

  const totalTitik = locations.length;
  const selesai = locations.filter(l => calculateProgress(l) === 100).length;
  const proses = locations.filter(l => calculateProgress(l) > 0 && calculateProgress(l) < 100).length;
  const menunggu = locations.filter(l => calculateProgress(l) === 0).length;

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-sm relative">
      {/* Reset Password Modal */}
      {resetModal.isOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Reset Password</h3>
            <div className="mb-5">
              <label className="block text-xs font-bold text-slate-600 mb-1">Password Baru</label>
              <input 
                type="password" 
                value={resetModal.newPassword}
                onChange={(e) => setResetModal({...resetModal, newPassword: e.target.value})}
                className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                placeholder="Masukkan password baru..."
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setResetModal({ isOpen: false, userId: null, newPassword: '' })} className="px-4 py-2 text-slate-500 font-medium hover:bg-slate-100 rounded-lg">Batal</button>
              <button onClick={saveNewPassword} className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700">Simpan</button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <aside className="w-64 bg-[#111827] text-white flex flex-col shadow-xl z-10 shrink-0">
        <div className="p-6 mb-4">
          <h1 className="text-2xl font-bold tracking-wider text-green-400">CAZ<span className="text-white">TRACK</span></h1>
        </div>
        
        <nav className="flex-1 space-y-1 px-3">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive 
                    ? 'bg-blue-600 text-white' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>
        
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center font-bold">
              {currentUser?.name.charAt(0)}
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold">{currentUser?.name}</p>
              <p className="text-xs text-slate-400">{currentUser?.role}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-2 text-red-400 hover:bg-slate-800 rounded-lg transition-colors">
            <LogOut className="w-4 h-4" /> Keluar
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-8">
          
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-3xl font-bold text-slate-800">
                {activeTab === 'dashboard' && 'Dashboard Project SPKLU'}
                {activeTab === 'update' && 'Update Progress SPKLU'}
                {activeTab === 'calendar' && 'Kalender Penjadwalan'}
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

          {activeTab === 'dashboard' && (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
                  <div><p className="text-sm font-medium text-slate-500 mb-1">Total Titik</p><p className="text-3xl font-bold text-slate-800">{totalTitik}</p></div>
                  <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-600"><Home className="w-5 h-5" /></div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
                  <div><p className="text-sm font-medium text-slate-500 mb-1">Selesai Beroperasi</p><p className="text-3xl font-bold text-green-600">{selesai}</p></div>
                  <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center text-green-600"><Activity className="w-5 h-5" /></div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
                  <div><p className="text-sm font-medium text-slate-500 mb-1">Sedang Proses</p><p className="text-3xl font-bold text-amber-500">{proses}</p></div>
                  <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center text-amber-500"><Activity className="w-5 h-5" /></div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
                  <div><p className="text-sm font-medium text-slate-500 mb-1">Menunggu</p><p className="text-3xl font-bold text-slate-600">{menunggu}</p></div>
                  <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-400"><Search className="w-5 h-5" /></div>
                </div>
              </div>

              {/* Data Table Horizontal Scroll */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-x-auto">
                <table className="w-max min-w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100 uppercase tracking-wider">
                    <tr>
                      <th className="py-4 px-4">NO</th>
                      <th className="py-4 px-4">LOKASI</th>
                      <th className="py-4 px-4">JENIS CHARGER</th>
                      <th className="py-4 px-4">BRAND</th>
                      <th className="py-4 px-4">JUMLAH</th>
                      <th className="py-4 px-4">PIC</th>
                      <th className="py-4 px-4 min-w-[150px]">PROGRESS KESELURUHAN</th>
                      <th className="py-4 px-4">EARLY SURVEY</th>
                      <th className="py-4 px-4">SURVEY TEKNIS</th>
                      <th className="py-4 px-4">SURVEY PLN</th>
                      <th className="py-4 px-4">PERIZINAN</th>
                      <th className="py-4 px-4">PENAWARAN VENDOR</th>
                      <th className="py-4 px-4">PKS</th>
                      <th className="py-4 px-4">PROSES INSTALASI</th>
                      <th className="py-4 px-4">TESTING & COMM.</th>
                      <th className="py-4 px-4">STATUS AKHIR</th>
                      <th className="py-4 px-4">KETERANGAN</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {locations.map((item, index) => {
                      const progress = calculateProgress(item);
                      const statusAkhir = getStatusAkhir(progress);
                      return (
                      <tr key={item.id} className="hover:bg-slate-50/50">
                        <td className="py-4 px-4 text-slate-400 align-top">{index + 1}</td>
                        <td className="py-4 px-4 font-bold text-slate-800 align-top">{item.lokasi}</td>
                        <td className="py-4 px-4 space-y-1 align-top">
                          {item.chargers?.map((c, i) => <span key={i} className="block px-2 py-1 bg-slate-100 rounded text-slate-600 border border-slate-200 w-fit">{c.jenis}</span>)}
                        </td>
                        <td className="py-4 px-4 space-y-2 font-semibold align-top">
                          {item.chargers?.map((c, i) => <span key={i} className="block">{c.brand}</span>)}
                        </td>
                        <td className="py-4 px-4 space-y-2 text-slate-500 align-top">
                          {item.chargers?.map((c, i) => <span key={i} className="block">{c.jumlah} Unit</span>)}
                        </td>
                        <td className="py-4 px-4 space-y-1 align-top">
                          {item.pics?.map((p, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500">{p.charAt(0)}</span>
                              <span className="text-slate-600">{p}</span>
                            </div>
                          ))}
                        </td>
                        <td className="py-4 px-4 align-top">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-blue-500 rounded-full" style={{ width: `${progress}%` }}></div>
                            </div>
                            <span className="font-bold text-slate-700">{progress}%</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 align-top"><StatusBadge status={item.survey} /></td>
                        <td className="py-4 px-4 align-top"><StatusBadge status={item.teknis} /></td>
                        <td className="py-4 px-4 align-top"><StatusBadge status={item.pln} /></td>
                        <td className="py-4 px-4 align-top"><StatusBadge status={item.izin} /></td>
                        <td className="py-4 px-4 align-top"><StatusBadge status={item.vendor} /></td>
                        <td className="py-4 px-4 align-top"><StatusBadge status={item.pks} /></td>
                        <td className="py-4 px-4 align-top"><StatusBadge status={item.instalasi} /></td>
                        <td className="py-4 px-4 align-top"><StatusBadge status={item.testing} /></td>
                        <td className="py-4 px-4 align-top">
                          <div className={`flex items-center gap-2 font-bold ${statusAkhir.color}`}>
                            <span className={`w-2 h-2 rounded-full ${statusAkhir.dot}`}></span> {statusAkhir.text}
                          </div>
                        </td>
                        <td className="py-4 px-4 text-slate-500 max-w-[250px] align-top">
                          <p className="whitespace-normal break-words">{item.keterangan}</p>
                        </td>
                      </tr>
                    )})}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {activeTab === 'update' && (
             <div className="space-y-4">
               <div className="flex justify-end mb-4">
                 <button 
                   onClick={handleAddLocation} 
                   className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-sm transition-colors"
                 >
                   <Plus className="w-4 h-4" /> Tambah Lokasi
                 </button>
               </div>

               <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-x-auto p-4 pb-8">
                 <table className="w-max min-w-full text-xs text-left">
                   <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100 uppercase tracking-wider">
                     <tr>
                       <th className="py-3 px-3 min-w-[200px]">LOKASI</th>
                       <th className="py-3 px-3 min-w-[300px]">CHARGERS (JENIS, BRAND, QTY)</th>
                       <th className="py-3 px-3 min-w-[180px]">PIC</th>
                       <th className="py-3 px-3 min-w-[200px]">KETERANGAN</th>
                       <th className="py-3 px-3">EARLY SURVEY</th>
                       <th className="py-3 px-3">SURVEY TEKNIS</th>
                       <th className="py-3 px-3">SURVEY PLN</th>
                       <th className="py-3 px-3">PERIZINAN</th>
                       <th className="py-3 px-3">PENAWARAN VENDOR</th>
                       <th className="py-3 px-3">PKS</th>
                       <th className="py-3 px-3">PROSES INSTALASI</th>
                       <th className="py-3 px-3">TESTING & COMM.</th>
                       <th className="py-3 px-3 text-center">AKSI</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                     {locations.map(item => (
                       <tr key={item.id} className="hover:bg-slate-50 align-top">
                         
                         {/* Edit Lokasi */}
                         <td className="py-3 px-3">
                            <input type="text" value={item.lokasi} onChange={(e) => updateLocationStatus(item.id, 'lokasi', e.target.value)} className="font-bold text-slate-800 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 outline-none w-full pb-1" placeholder="Nama Lokasi..." />
                         </td>

                         {/* BAGIAN YANG DIRUBAH: Edit Chargers dengan Dropdown (Select) */}
                         <td className="py-3 px-3">
                            <div className="space-y-2">
                              {(item.chargers || []).map((chg, idx) => (
                                <div key={idx} className="flex gap-1 items-center">
                                  <select value={chg.jenis || ''} onChange={e => handleArrayUpdate(item.id, 'chargers', idx, 'jenis', e.target.value)} className="w-24 p-1.5 border border-slate-200 rounded outline-none focus:border-blue-500 text-xs bg-white">
                                    <option value="" disabled>- Jenis -</option>
                                    <option value="7kW AC">7kW AC</option>
                                    <option value="22kW AC">22kW AC</option>
                                    <option value="30kW DC">30kW DC</option>
                                    <option value="60kW DC">60kW DC</option>
                                    <option value="120kW DC">120kW DC</option>
                                    <option value="240kW DC">240kW DC</option>
                                  </select>
                                  <select value={chg.brand || ''} onChange={e => handleArrayUpdate(item.id, 'chargers', idx, 'brand', e.target.value)} className="w-24 p-1.5 border border-slate-200 rounded outline-none focus:border-blue-500 text-xs bg-white">
                                    <option value="" disabled>- Brand -</option>
                                    <option value="TIDE">TIDE</option>
                                    <option value="Moderntec">Moderntec</option>
                                    <option value="Teison">Teison</option>
                                    <option value="Starcharge">Starcharge</option>
                                  </select>
                                  <input type="number" placeholder="Qty" value={chg.jumlah || ''} onChange={e => handleArrayUpdate(item.id, 'chargers', idx, 'jumlah', parseInt(e.target.value) || 0)} className="w-12 p-1.5 border border-slate-200 rounded outline-none focus:border-blue-500 text-xs" />
                                  <button onClick={() => handleArrayRemove(item.id, 'chargers', idx)} className="text-slate-400 hover:text-red-500 p-1 rounded transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                                </div>
                              ))}
                              <button onClick={() => handleArrayAdd(item.id, 'chargers', {jenis: '', brand: '', jumlah: 1})} className="text-[10px] font-bold bg-blue-50 text-blue-600 px-2 py-1.5 rounded flex items-center gap-1 hover:bg-blue-100 transition-colors w-max"><Plus className="w-3 h-3"/> Tambah Charger</button>
                            </div>
                         </td>

                         {/* Edit PIC */}
                         <td className="py-3 px-3">
                            <div className="space-y-2">
                              {(item.pics || []).map((pic, idx) => (
                                <div key={idx} className="flex gap-1 items-center">
                                  <input type="text" placeholder="Nama PIC" value={pic || ''} onChange={e => handleArrayUpdateString(item.id, 'pics', idx, e.target.value)} className="flex-1 p-1.5 border border-slate-200 rounded outline-none focus:border-blue-500 text-xs" />
                                  <button onClick={() => handleArrayRemove(item.id, 'pics', idx)} className="text-slate-400 hover:text-red-500 p-1 rounded transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                                </div>
                              ))}
                              <button onClick={() => handleArrayAdd(item.id, 'pics', '')} className="text-[10px] font-bold bg-blue-50 text-blue-600 px-2 py-1.5 rounded flex items-center gap-1 hover:bg-blue-100 transition-colors w-max"><Plus className="w-3 h-3"/> Tambah PIC</button>
                            </div>
                         </td>

                         {/* Edit Keterangan */}
                         <td className="py-3 px-3">
                            <textarea value={item.keterangan || ''} onChange={(e) => updateLocationStatus(item.id, 'keterangan', e.target.value)} className="w-full p-2 border border-slate-200 rounded outline-none focus:border-blue-500 text-xs min-h-[60px]" placeholder="Masukkan keterangan..." />
                         </td>

                         {/* Edit 8 Status Progress */}
                         {['survey', 'teknis', 'pln', 'izin', 'vendor', 'pks', 'instalasi', 'testing'].map(stage => (
                           <td key={stage} className="py-3 px-3 min-w-[140px]">
                              <EditableStatus loc={item} stage={stage} updateLocationStatus={updateLocationStatus} />
                           </td>
                         ))}
                         
                         {/* Hapus Lokasi */}
                         <td className="py-3 px-3 text-center">
                           <button 
                             onClick={() => handleDeleteLocation(item.id)} 
                             className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors" 
                             title="Hapus Lokasi"
                           >
                             <Trash2 className="w-4 h-4" />
                           </button>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
             </div>
          )}

          {activeTab === 'settings' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-100">
                <div className="p-5 border-b border-slate-100"><h3 className="text-lg font-bold text-slate-800">Daftar Pengguna Sistem</h3></div>
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-xs">
                    <tr><th className="py-3 px-5">NAMA PENGGUNA</th><th className="py-3 px-5">EMAIL</th><th className="py-3 px-5">ROLE</th><th className="py-3 px-5 text-center">AKSI</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {users.map(u => (
                      <tr key={u.id} className="hover:bg-slate-50">
                        <td className="py-3 px-5 font-bold flex items-center gap-2">
                           <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs">{u.name.charAt(0)}</span> {u.name}
                        </td>
                        <td className="py-3 px-5 text-slate-500">{u.email}</td>
                        <td className="py-3 px-5">
                          <span className={`px-2.5 py-1 rounded text-xs font-bold ${u.role === 'Admin' ? 'bg-purple-100 text-purple-700' : u.role === 'Editor' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>{u.role}</span>
                        </td>
                        <td className="py-3 px-5 text-center flex items-center justify-center gap-3">
                           <button onClick={() => setResetModal({ isOpen: true, userId: u.id, newPassword: '' })} className="text-slate-400 hover:text-blue-500" title="Reset Password"><Key className="w-4 h-4" /></button>
                           <button onClick={() => handleDeleteUser(u.id)} className="text-slate-400 hover:text-red-500" title="Hapus"><Trash2 className="w-4 h-4" /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div>
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
                  <h3 className="text-lg font-bold text-slate-800 mb-4">Tambah Pengguna Baru</h3>
                  <form onSubmit={handleAddUser} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Nama Lengkap</label>
                      <input type="text" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" required />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Email</label>
                      <input type="email" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" required />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Password Baru</label>
                      <input type="password" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" required />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Role</label>
                      <select value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})} className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm">
                        <option value="Admin">Admin</option>
                        <option value="Editor">Editor</option>
                        <option value="Viewer">Viewer</option>
                      </select>
                    </div>
                    <button type="submit" className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors">Simpan Pengguna</button>
                  </form>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'calendar' && (
            <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100">
               <h3 className="text-xl font-bold text-slate-800 mb-6">Jadwal November 2026</h3>
               <div className="grid grid-cols-7 gap-[1px] bg-slate-200 border border-slate-200 rounded-lg overflow-hidden">
                 {['MINGGU', 'SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU'].map(d => <div key={d} className="bg-white py-2 text-center text-xs font-bold text-slate-600">{d}</div>)}
                 {Array.from({length: 30}).map((_, i) => {
                   const dateNum = i + 1;
                   const fullDateStr = `2026-11-${dateNum.toString().padStart(2, '0')}`;
                   
                   const events = [];
                   locations.forEach(loc => {
                     ['survey', 'teknis', 'pln', 'izin', 'vendor', 'pks', 'instalasi', 'testing'].forEach(stage => {
                        if (loc[stage] && loc[stage].includes(`Jadwal ${fullDateStr}`)) {
                           events.push({ locName: loc.lokasi, stageName: stage });
                        }
                     });
                   });

                   return (
                     <div key={i} className="bg-white min-h-[100px] p-2">
                       <span className="text-xs text-slate-400 font-bold block text-right">{dateNum}</span>
                       <div className="mt-1 space-y-1">
                         {events.map((ev, idx) => (
                           <div key={idx} className="bg-blue-50 border border-blue-100 p-1.5 rounded text-[10px]">
                              <div className="font-bold text-blue-700 capitalize">{ev.stageName}</div>
                              <div className="text-slate-500 truncate">{ev.locName}</div>
                           </div>
                         ))}
                       </div>
                     </div>
                   );
                 })}
               </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function StatusBadge({ status }) {
  if (!status) return null;
  if (status === 'Selesai') return <span className="px-3 py-1 rounded bg-green-100 text-green-700 border border-green-200 block text-center w-full">Selesai</span>;
  if (status === 'Proses') return <span className="px-3 py-1 rounded bg-amber-100 text-amber-700 border border-amber-200 block text-center w-full">Proses</span>;
  if (status === 'Belum') return <span className="px-3 py-1 rounded bg-slate-50 text-slate-400 border border-slate-200 block text-center w-full">Belum</span>;
  if (status.startsWith('Jadwal')) {
    const dateStr = status.replace('Jadwal ', '');
    const day = dateStr.split('-')[2];
    return (
      <div className="flex flex-col w-full text-center">
        <span className="bg-blue-100 text-blue-700 border border-blue-200 border-b-0 rounded-t py-1">Jadwal</span>
        <span className="bg-white text-slate-500 border border-blue-200 rounded-b py-1 flex items-center justify-center gap-1">
          <Calendar className="w-3 h-3" /> {day} Nov
        </span>
      </div>
    );
  }
  return <span>{status}</span>;
}

function EditableStatus({ loc, stage, updateLocationStatus }) {
  const isJadwal = loc[stage]?.startsWith('Jadwal');
  
  return (
    <div className="flex flex-col gap-1 w-full">
      <select 
        value={isJadwal ? 'Jadwal' : loc[stage]} 
        onChange={(e) => updateLocationStatus(loc.id, stage, e.target.value === 'Jadwal' ? 'Jadwal ' : e.target.value)}
        className="w-full p-1.5 border border-slate-200 rounded focus:ring-1 focus:ring-blue-500 outline-none text-slate-600 bg-white"
      >
        <option value="Belum">Belum</option>
        <option value="Proses">Proses</option>
        <option value="Selesai">Selesai</option>
        <option value="Jadwal">Jadwal</option>
      </select>
      
      {isJadwal && (
        <input 
          type="date"
          value={loc[stage].replace('Jadwal ', '')}
          onChange={(e) => updateLocationStatus(loc.id, stage, `Jadwal ${e.target.value}`)}
          className="w-full p-1 border border-slate-200 rounded text-slate-500 [&::-webkit-calendar-picker-indicator]:cursor-pointer bg-white"
        />
      )}
    </div>
  );
}