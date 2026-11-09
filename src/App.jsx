import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, updateDoc, deleteDoc, onSnapshot, collection } from 'firebase/firestore';

// --- Custom Icons ---
const Activity = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>;
const Home = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>;
const Calendar = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="18" height="18" x="3" y="4" rx="2" ry="2"></rect><line x1="16" x2="16" y1="2" y2="6"></line><line x1="8" x2="8" y1="2" y2="6"></line><line x1="3" x2="21" y1="10" y2="10"></line></svg>;
const Settings = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73-.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg>;
const Search = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg>;
const Trash2 = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path><line x1="10" x2="10" y1="11" y2="17"></line><line x1="14" x2="14" y1="11" y2="17"></line></svg>;
const Plus = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M5 12h14"></path><path d="M12 5v14"></path></svg>;
const LogOut = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" x2="9" y1="12" y2="12"></line></svg>;
const Lock = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>;
const Mail = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="20" height="16" x="2" y="4" rx="2"></rect><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path></svg>;
const Key = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="7.5" cy="15.5" r="5.5"></circle><path d="m21 2-9.6 9.6"></path><path d="m15.5 7.5 3 3L22 7l-3-3"></path></svg>;
const Edit2 = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>;
const Check = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="20 6 9 17 4 12"></polyline></svg>;
const ChevronLeft = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m15 18-6-6 6-6"></path></svg>;
const ChevronRight = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m9 18 6-6-6-6"></path></svg>;
const Info = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>;
const X = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;
const Clock = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>;
const ArrowUpDown = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m21 16-4 4-4-4"/><path d="M17 20V4"/><path d="m3 8 4-4 4 4"/><path d="M7 4v16"/></svg>;
const ArrowUp = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m5 12 7-7 7 7"/><path d="M12 19V5"/></svg>;
const ArrowDown = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m19 12-7 7-7-7"/><path d="M12 5v14"/></svg>;
const ExternalLink = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" x2="21" y1="14" y2="3"/></svg>;
const ImageIcon = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>;
const Folder = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></svg>;
const Save = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>;

// --- KONFIGURASI CHECKLIST & STAGES ---
const DOKUMEN_ITEMS = [
  { key: 'sld', label: 'SLD' },
  { key: 'panel', label: 'Diagram Panel' },
  { key: 'layout', label: 'Layout' },
  { key: 'slo', label: 'SLO & NIDI' },
  { key: 'proyeksi3d', label: 'Gambar Proyeksi 3D' }
];

const IZIN_ITEMS = [
  { key: 'suratPemrakarsa', label: 'Surat Pemrakarsa' },
  { key: 'petaTapak', label: 'Peta Tapak Proyek' },
  { key: 'shp', label: 'SHP Polygon' },
  { key: 'perjanjianSewa', label: 'Perjanjian Sewa / Pinjam Pakai Lahan' },
  { key: 'ossDasar', label: 'Persyaratan Dasar (OSS)' },
  { key: 'amdalnet', label: 'AMDALNET' },
  { key: 'ossBerusaha', label: 'Perizinan Berusaha (OSS)' },
  { key: 'iuptl', label: 'IUPTL' }
];

const STAGE_NAME_MAP = {
  survey: 'Early Survey', teknis: 'Survey Teknis', dokumen: 'Dokumen Teknis', 
  pln: 'Survey PLN', izin: 'Perizinan', vendor: 'Penawaran Vendor', 
  pks: 'PKS', instalasi: 'Proses Instalasi', testing: 'Testing & Comm.'
};

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
const appId = 'caztrack-v1';

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
  const [historyModal, setHistoryModal] = useState({ isOpen: false, location: null }); 
  
  // STATE BARU: DEDICATED FORM DRAFT (Menggantikan inline editing)
  const [formDraft, setFormDraft] = useState(null);
  
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  
  const [sortConfig, setSortConfig] = useState({ key: 'no', direction: 'asc' });

  const getFormattedTime = () => {
    return new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
  };

  // --- SESI & AUTO LOGOUT LOGIC ---
  useEffect(() => {
    const INACTIVITY_LIMIT = 30 * 60 * 1000;
    const storedUser = localStorage.getItem('caztrack_user');
    const lastActivity = localStorage.getItem('caztrack_lastActivity');

    if (storedUser && lastActivity) {
      if (Date.now() - parseInt(lastActivity) < INACTIVITY_LIMIT) {
        setCurrentUser(JSON.parse(storedUser));
        localStorage.setItem('caztrack_lastActivity', Date.now().toString());
      } else {
        localStorage.removeItem('caztrack_user');
        localStorage.removeItem('caztrack_lastActivity');
      }
    }

    let throttleTimer;
    const handleUserActivity = () => {
      if (throttleTimer) return;
      throttleTimer = setTimeout(() => {
        localStorage.setItem('caztrack_lastActivity', Date.now().toString());
        throttleTimer = null;
      }, 1000);
    };

    window.addEventListener('mousemove', handleUserActivity);
    window.addEventListener('keydown', handleUserActivity);
    window.addEventListener('click', handleUserActivity);
    window.addEventListener('scroll', handleUserActivity);

    const interval = setInterval(() => {
      const currentLastActivity = localStorage.getItem('caztrack_lastActivity');
      if (currentLastActivity && (Date.now() - parseInt(currentLastActivity) >= INACTIVITY_LIMIT)) {
        setCurrentUser(null);
        localStorage.removeItem('caztrack_user');
        localStorage.removeItem('caztrack_lastActivity');
      }
    }, 60000);

    return () => {
      window.removeEventListener('mousemove', handleUserActivity);
      window.removeEventListener('keydown', handleUserActivity);
      window.removeEventListener('click', handleUserActivity);
      window.removeEventListener('scroll', handleUserActivity);
      clearInterval(interval);
    };
  }, []);

  // --- FIREBASE INIT & FETCH DATA ---
  useEffect(() => {
    const initAuth = async () => {
      try { await signInAnonymously(auth); } catch (err) { console.error("Auth init error:", err); }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => { setFirebaseUser(user); });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!firebaseUser) return;
    const usersRef = collection(db, 'artifacts', appId, 'public', 'data', 'users');
    const locsRef = collection(db, 'artifacts', appId, 'public', 'data', 'locations');
    let seededUsers = false;

    const unsubUsers = onSnapshot(usersRef, (snapshot) => {
      if (snapshot.empty && !seededUsers) {
        seededUsers = true;
        const defaultUsers = [
          { id: '1', name: 'Admin EV', email: 'admin@cazgo.id', role: 'Admin', password: 'admin' },
          { id: '2', name: 'Budi P.', email: 'budi@cazgo.id', role: 'Editor', password: 'budi' },
          { id: '3', name: 'Siti A.', email: 'siti@cazgo.id', role: 'Viewer', password: 'siti' }
        ];
        defaultUsers.forEach(u => setDoc(doc(usersRef, u.id), u));
      } else {
        setUsers(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      }
    });

    const unsubLocs = onSnapshot(locsRef, (snapshot) => {
      setLocations(snapshot.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => parseInt(a.id) - parseInt(b.id)));
      setIsFirebaseLoaded(true);
    });

    return () => { unsubUsers(); unsubLocs(); };
  }, [firebaseUser]);

  const handleLogin = (e) => {
    e.preventDefault();
    const user = users.find(u => u.email === loginForm.email && u.password === loginForm.password);
    if (user) {
      setCurrentUser(user);
      localStorage.setItem('caztrack_user', JSON.stringify(user));
      localStorage.setItem('caztrack_lastActivity', Date.now().toString());
      setLoginError('');
      setActiveTab('dashboard'); 
    } else {
      setLoginError('Email atau password salah!');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setLoginForm({ email: '', password: '' });
    localStorage.removeItem('caztrack_user');
    localStorage.removeItem('caztrack_lastActivity');
  };

  const calculateProgress = (loc) => {
    const stages = [loc.survey, loc.teknis, loc.dokumen, loc.pln, loc.izin, loc.vendor, loc.pks, loc.instalasi, loc.testing];
    const completed = stages.filter(s => s === 'Selesai' || s === 'Non PLN').length;
    return Math.round((completed / 9) * 100);
  };

  const getStatusAkhir = (progress) => {
    if (progress === 0) return { text: 'Menunggu', color: 'text-slate-500', dot: 'bg-slate-500' };
    if (progress === 100) return { text: 'Selesai Beroperasi', color: 'text-green-600', dot: 'bg-green-500' };
    return { text: 'Proses', color: 'text-amber-600', dot: 'bg-amber-500' };
  };

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
    if (firebaseUser) await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'users', id.toString()));
  };

  const saveNewPassword = async () => {
    if (!firebaseUser || !resetModal.userId || !resetModal.newPassword) return;
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'users', resetModal.userId.toString()), { password: resetModal.newPassword });
    setResetModal({ isOpen: false, userId: null, newPassword: '' });
  };

  const handleDeleteLocation = async (id) => {
    if (firebaseUser && window.confirm("Yakin bray mau ngapus lokasi ini secara permanen?")) {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'locations', id.toString()));
    }
  };

  // --- DEDICATED FORM LOGIC ---
  const handleOpenAddForm = () => {
    setFormDraft({
      isNew: true,
      id: Date.now().toString(), 
      lokasi: '', gmapsLink: '', chargers: [], pics: [], keterangan: '',
      survey: 'Belum', teknis: 'Belum', dokumen: 'Belum', pln: 'Belum', izin: 'Belum', 
      vendor: 'Belum', pks: 'Belum', instalasi: 'Belum', testing: 'Belum',
      dokumenChecklist: DOKUMEN_ITEMS.reduce((acc, curr) => ({ ...acc, [curr.key]: { checked: false, link: '' } }), {}),
      izinChecklist: IZIN_ITEMS.reduce((acc, curr) => ({ ...acc, [curr.key]: { checked: false, link: '' } }), {}),
      logs: []
    });
  };

  const handleOpenEditForm = (loc) => {
    setFormDraft(JSON.parse(JSON.stringify(loc)));
  };

  const updateDraftField = (field, value) => {
    setFormDraft(prev => ({ ...prev, [field]: value }));
  };

  const handleDraftArrayAdd = (field, defaultItem) => {
    setFormDraft(prev => ({ ...prev, [field]: [...(prev[field] || []), defaultItem] }));
  };

  const handleDraftArrayRemove = (field, index) => {
    setFormDraft(prev => {
      const newArr = [...(prev[field] || [])];
      newArr.splice(index, 1);
      return { ...prev, [field]: newArr };
    });
  };

  const handleDraftArrayUpdate = (field, index, key, value) => {
    setFormDraft(prev => {
      const newArr = [...(prev[field] || [])];
      newArr[index] = { ...newArr[index], [key]: value };
      return { ...prev, [field]: newArr };
    });
  };

  const handleDraftArrayUpdateString = (field, index, value) => {
    setFormDraft(prev => {
      const newArr = [...(prev[field] || [])];
      newArr[index] = value;
      return { ...prev, [field]: newArr };
    });
  };

  const handleSaveForm = async () => {
    if (!firebaseUser || !formDraft) return;

    if (formDraft.isNew) {
      // Simpan data baru
      const newLog = { user: currentUser.name, action: "Membuat data lokasi baru", time: getFormattedTime() };
      const locationToSave = { ...formDraft, logs: [newLog] };
      delete locationToSave.isNew;
      
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'locations', locationToSave.id), locationToSave);
    } else {
      // Update data lama (Diffing)
      const originalLoc = locations.find(l => l.id === formDraft.id);
      if (!originalLoc) return;

      const updates = {};
      const newLogs = [];

      if (originalLoc.keterangan !== formDraft.keterangan) {
        updates.keterangan = formDraft.keterangan;
        newLogs.push({ user: currentUser.name, action: `Mengubah Keterangan dari "${originalLoc.keterangan || 'Kosong'}" menjadi "${formDraft.keterangan || 'Kosong'}"`, time: getFormattedTime() });
      }

      if (originalLoc.lokasi !== formDraft.lokasi) {
        updates.lokasi = formDraft.lokasi;
        newLogs.push({ user: currentUser.name, action: `Mengubah Nama Lokasi dari "${originalLoc.lokasi}" menjadi "${formDraft.lokasi}"`, time: getFormattedTime() });
      }
      
      if (originalLoc.gmapsLink !== formDraft.gmapsLink) {
        updates.gmapsLink = formDraft.gmapsLink;
        newLogs.push({ user: currentUser.name, action: `Memperbarui Link Google Maps`, time: getFormattedTime() });
      }

      if (JSON.stringify(originalLoc.chargers) !== JSON.stringify(formDraft.chargers)) {
        updates.chargers = formDraft.chargers;
        const oldStr = (originalLoc.chargers || []).map(c => `${c.jenis||'-'} ${c.brand||'-'} (${c.jumlah||0} Unit)`).join(', ') || 'Kosong';
        const newStr = (formDraft.chargers || []).map(c => `${c.jenis||'-'} ${c.brand||'-'} (${c.jumlah||0} Unit)`).join(', ') || 'Kosong';
        newLogs.push({ user: currentUser.name, action: `Mengubah daftar Charger dari "${oldStr}" menjadi "${newStr}"`, time: getFormattedTime() });
      }

      if (JSON.stringify(originalLoc.pics) !== JSON.stringify(formDraft.pics)) {
        updates.pics = formDraft.pics;
        const oldStr = (originalLoc.pics || []).join(', ') || 'Kosong';
        const newStr = (formDraft.pics || []).join(', ') || 'Kosong';
        newLogs.push({ user: currentUser.name, action: `Mengubah daftar tim PIC dari "${oldStr}" menjadi "${newStr}"`, time: getFormattedTime() });
      }

      if (JSON.stringify(originalLoc.dokumenChecklist) !== JSON.stringify(formDraft.dokumenChecklist)) {
        updates.dokumenChecklist = formDraft.dokumenChecklist;
        newLogs.push({ user: currentUser.name, action: `Memperbarui checklist Dokumen Teknis`, time: getFormattedTime() });
      }
      
      if (JSON.stringify(originalLoc.izinChecklist) !== JSON.stringify(formDraft.izinChecklist)) {
        updates.izinChecklist = formDraft.izinChecklist;
        newLogs.push({ user: currentUser.name, action: `Memperbarui checklist Perizinan`, time: getFormattedTime() });
      }

      const mediaStages = ['survey', 'teknis', 'pln', 'instalasi', 'testing'];
      mediaStages.forEach(stg => {
        const linkF = stg + 'Links';
        const foldF = stg + 'FolderLink';
        if (JSON.stringify(originalLoc[linkF]) !== JSON.stringify(formDraft[linkF])) {
          updates[linkF] = formDraft[linkF];
          newLogs.push({ user: currentUser.name, action: `Memperbarui lampiran foto/video ${STAGE_NAME_MAP[stg]}`, time: getFormattedTime() });
        }
        if (originalLoc[foldF] !== formDraft[foldF]) {
          updates[foldF] = formDraft[foldF];
          newLogs.push({ user: currentUser.name, action: `Memperbarui Link Folder GDrive ${STAGE_NAME_MAP[stg]}`, time: getFormattedTime() });
        }
      });

      const folderStages = ['vendor', 'pks'];
      folderStages.forEach(stg => {
        const foldF = stg + 'FolderLink';
        if (originalLoc[foldF] !== formDraft[foldF]) {
          updates[foldF] = formDraft[foldF];
          newLogs.push({ user: currentUser.name, action: `Memperbarui Link Folder GDrive ${STAGE_NAME_MAP[stg]}`, time: getFormattedTime() });
        }
      });

      ['survey', 'teknis', 'dokumen', 'pln', 'izin', 'vendor', 'pks', 'instalasi', 'testing'].forEach(stage => {
        if (originalLoc[stage] !== formDraft[stage]) {
          updates[stage] = formDraft[stage];
          newLogs.push({ user: currentUser.name, action: `Mengubah status ${STAGE_NAME_MAP[stage]} dari "${originalLoc[stage] || 'Kosong'}" menjadi "${formDraft[stage]}"`, time: getFormattedTime() });
        }
      });

      if (Object.keys(updates).length > 0) {
        updates.logs = [...(originalLoc.logs || []), ...newLogs];
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'locations', originalLoc.id.toString()), updates);
      }
    }
    
    // Tutup form setelah save
    setFormDraft(null);
  };

  const handlePrevMonth = () => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1));
  const handleNextMonth = () => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1));

  const filteredLocations = locations.filter(loc => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const matchLokasi = loc.lokasi?.toLowerCase().includes(query) || false;
    const matchPic = loc.pics?.some(pic => pic.toLowerCase().includes(query)) || false;
    return matchLokasi || matchPic;
  });

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const getSortedLocations = () => {
    let sortableItems = filteredLocations.map((loc, idx) => ({ ...loc, originalNo: idx + 1 }));

    sortableItems.sort((a, b) => {
      if (sortConfig.key === 'no') {
        return sortConfig.direction === 'asc' ? a.originalNo - b.originalNo : b.originalNo - a.originalNo;
      } 
      if (sortConfig.key === 'lokasi') {
        const locA = (a.lokasi || '').toString().toLowerCase();
        const locB = (b.lokasi || '').toString().toLowerCase();
        const comparison = locA.localeCompare(locB);
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      } 
      if (sortConfig.key === 'jumlah') {
        const sumA = (a.chargers || []).reduce((sum, c) => sum + (parseInt(c.jumlah) || 0), 0);
        const sumB = (b.chargers || []).reduce((sum, c) => sum + (parseInt(c.jumlah) || 0), 0);
        return sortConfig.direction === 'asc' ? sumA - sumB : sumB - sumA;
      } 
      if (sortConfig.key === 'progress') {
        const progA = calculateProgress(a);
        const progB = calculateProgress(b);
        return sortConfig.direction === 'asc' ? progA - progB : progB - progA;
      }
      return 0;
    });
    return sortableItems;
  };

  const sortedDashboardLocations = getSortedLocations();

  const SortHeader = ({ label, sortKey, className = "" }) => {
    const isActive = sortConfig.key === sortKey;
    return (
      <th className={`py-4 px-4 cursor-pointer hover:bg-slate-200 transition-colors select-none group sticky top-0 bg-slate-50 ${className || 'z-20'}`} onClick={() => requestSort(sortKey)}>
        <div className="flex items-center gap-1">
          {label}
          <div className="flex items-center justify-center w-4 h-4">
            {isActive ? (
              sortConfig.direction === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-blue-600" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-600" />
            ) : (
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
          </div>
        </div>
      </th>
    );
  };

  if (!isFirebaseLoaded) return <div className="flex h-screen bg-slate-900 items-center justify-center font-sans text-white">Memuat Database...</div>;

  if (!currentUser) {
    return (
      <div className="flex h-screen bg-slate-900 items-center justify-center font-sans">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold tracking-wider text-green-500 mb-2">CAZ<span className="text-slate-900">TRACK</span></h1>
            <p className="text-slate-500 text-sm">Masuk ke Dashboard SPKLU</p>
          </div>
          {loginError && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-medium mb-6 text-center border border-red-100">{loginError}</div>}
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <div className="relative">
                <Mail className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                <input type="email" value={loginForm.email} onChange={e => setLoginForm({...loginForm, email: e.target.value})} className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" required />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                <input type="password" value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" required />
              </div>
            </div>
            <button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors mt-2">Masuk</button>
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

  const totalTitik = filteredLocations.length;
  const selesai = filteredLocations.filter(l => calculateProgress(l) === 100).length;
  const proses = filteredLocations.filter(l => calculateProgress(l) > 0 && calculateProgress(l) < 100).length;
  const menunggu = filteredLocations.filter(l => calculateProgress(l) === 0).length;

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-sm relative">
      {resetModal.isOpen && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Reset Password</h3>
            <div className="mb-5">
              <label className="block text-xs font-bold text-slate-600 mb-1">Password Baru</label>
              <input type="password" value={resetModal.newPassword} onChange={(e) => setResetModal({...resetModal, newPassword: e.target.value})} className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Masukkan password baru..." autoFocus />
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setResetModal({ isOpen: false, userId: null, newPassword: '' })} className="px-4 py-2 text-slate-500 font-medium hover:bg-slate-100 rounded-lg">Batal</button>
              <button onClick={saveNewPassword} className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700">Simpan</button>
            </div>
          </div>
        </div>
      )}

      {historyModal.isOpen && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="text-lg font-bold text-slate-800">History Perubahan</h3>
                <p className="text-xs text-slate-500 mt-1">Audit Trail untuk lokasi: <span className="font-bold text-blue-600">{historyModal.location?.lokasi}</span></p>
              </div>
              <button onClick={() => setHistoryModal({ isOpen: false, location: null })} className="p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-600 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 overflow-y-auto flex-1 space-y-3">
              {historyModal.location?.logs && historyModal.location.logs.length > 0 ? (
                [...historyModal.location.logs].reverse().map((log, idx) => (
                  <div key={idx} className="flex gap-4 p-3 bg-slate-50 border border-slate-100 rounded-lg">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0">
                      {log.user?.charAt(0) || '?'}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-700">{log.user}</p>
                      <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{log.action}</p>
                      <p className="text-[10px] text-slate-400 mt-1.5 flex items-center gap-1"><Clock className="w-3 h-3" /> {log.time}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-500 text-sm">Belum ada catatan aktivitas untuk lokasi ini.</div>
              )}
            </div>
          </div>
        </div>
      )}

      <aside className="w-64 bg-[#111827] text-white flex flex-col shadow-xl z-40 shrink-0">
        <div className="p-6 mb-4"><h1 className="text-2xl font-bold tracking-wider text-green-400">CAZ<span className="text-white">TRACK</span></h1></div>
        <nav className="flex-1 space-y-1 px-3">
          {navItems.filter(i => !i.allowedRoles || i.allowedRoles.includes(currentUser.role)).map((item) => (
            <button key={item.id} onClick={() => { setActiveTab(item.id); setFormDraft(null); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${activeTab === item.id ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
              <item.icon className="w-5 h-5" /> <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center font-bold">{currentUser?.name.charAt(0)}</div>
            <div className="text-left"><p className="text-sm font-semibold">{currentUser?.name}</p><p className="text-xs text-slate-400">{currentUser?.role}</p></div>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-2 text-red-400 hover:bg-slate-800 rounded-lg"><LogOut className="w-4 h-4" /> Keluar</button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto relative z-10">
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-3xl font-bold text-slate-800">
                {activeTab === 'dashboard' ? 'Dashboard Project SPKLU' : activeTab === 'update' ? 'Update Progress SPKLU' : activeTab === 'calendar' ? 'Kalender Penjadwalan' : 'Pengaturan Sistem'}
              </h2>
              <p className="text-slate-500 mt-1">Pantau progres deployment titik charging station.</p>
            </div>
            
            {activeTab !== 'settings' && !formDraft && (
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari lokasi atau PIC..." 
                  className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-full w-64 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                />
              </div>
            )}
          </div>

          {activeTab === 'dashboard' && (
            <>
              <div className="grid grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between"><div><p className="text-sm font-medium text-slate-500 mb-1">Total Titik</p><p className="text-3xl font-bold text-slate-800">{totalTitik}</p></div><div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-600"><Home className="w-5 h-5" /></div></div>
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between"><div><p className="text-sm font-medium text-slate-500 mb-1">Selesai Beroperasi</p><p className="text-3xl font-bold text-green-600">{selesai}</p></div><div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center text-green-600"><Activity className="w-5 h-5" /></div></div>
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between"><div><p className="text-sm font-medium text-slate-500 mb-1">Sedang Proses</p><p className="text-3xl font-bold text-amber-500">{proses}</p></div><div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center text-amber-500"><Activity className="w-5 h-5" /></div></div>
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between"><div><p className="text-sm font-medium text-slate-500 mb-1">Menunggu</p><p className="text-3xl font-bold text-slate-600">{menunggu}</p></div><div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-400"><Search className="w-5 h-5" /></div></div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-auto max-h-[calc(100vh-240px)]">
                <table className="w-max min-w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider">
                    <tr>
                      <SortHeader label="NO" sortKey="no" className="left-0 z-50 w-[60px] min-w-[60px] max-w-[60px]" />
                      <SortHeader label="LOKASI" sortKey="lokasi" className="left-[60px] z-50 min-w-[250px] max-w-[250px] shadow-[8px_0_10px_-5px_rgba(0,0,0,0.05)] border-r border-slate-100" />
                      <th className="py-4 px-4 sticky top-0 bg-slate-50 z-20">JENIS CHARGER</th>
                      <th className="py-4 px-4 sticky top-0 bg-slate-50 z-20">BRAND</th>
                      <SortHeader label="JUMLAH" sortKey="jumlah" className="z-20" />
                      <th className="py-4 px-4 sticky top-0 bg-slate-50 z-20">PIC</th>
                      <SortHeader label="PROGRESS KESELURUHAN" sortKey="progress" className="z-20" />
                      <th className="py-4 px-4 sticky top-0 bg-slate-50 z-20">EARLY SURVEY</th>
                      <th className="py-4 px-4 sticky top-0 bg-slate-50 z-20">SURVEY TEKNIS</th>
                      <th className="py-4 px-4 sticky top-0 bg-slate-50 z-20">DOKUMEN TEKNIS</th>
                      <th className="py-4 px-4 sticky top-0 bg-slate-50 z-20">SURVEY PLN</th>
                      <th className="py-4 px-4 sticky top-0 bg-slate-50 z-20">PERIZINAN</th>
                      <th className="py-4 px-4 sticky top-0 bg-slate-50 z-20">PENAWARAN VENDOR</th>
                      <th className="py-4 px-4 sticky top-0 bg-slate-50 z-20">PKS</th>
                      <th className="py-4 px-4 sticky top-0 bg-slate-50 z-20">PROSES INSTALASI</th>
                      <th className="py-4 px-4 sticky top-0 bg-slate-50 z-20">TESTING & COMM.</th>
                      <th className="py-4 px-4 sticky top-0 bg-slate-50 z-20">STATUS AKHIR</th>
                      <th className="py-4 px-4 sticky top-0 bg-slate-50 z-20">KETERANGAN</th>
                      <th className="py-4 px-4 text-center sticky right-0 top-0 bg-slate-50 border-l border-slate-100 shadow-[-8px_0_10px_-5px_rgba(0,0,0,0.05)] z-50">HISTORY</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {sortedDashboardLocations.map((item) => {
                      const progress = calculateProgress(item);
                      const statusAkhir = getStatusAkhir(progress);
                      return (
                      <tr key={item.id} className="hover:bg-slate-50/50 group">
                        <td className="py-4 px-4 text-slate-400 align-top font-bold sticky left-0 z-40 bg-white group-hover:bg-slate-50 w-[60px] min-w-[60px] max-w-[60px]">{item.originalNo}</td>
                        <td className="py-4 px-4 font-bold text-slate-800 align-top sticky left-[60px] z-40 bg-white group-hover:bg-slate-50 min-w-[250px] max-w-[250px] shadow-[8px_0_10px_-5px_rgba(0,0,0,0.05)] border-r border-slate-100">
                          {item.gmapsLink ? (
                            <a href={item.gmapsLink.startsWith('http') ? item.gmapsLink : `https://${item.gmapsLink}`} target="_blank" rel="noreferrer" className="flex items-start gap-1.5 hover:text-blue-600 transition-colors group/link">
                              <span className="group-hover/link:underline">{item.lokasi}</span>
                              <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover/link:text-blue-500 mt-0.5 shrink-0" />
                            </a>
                          ) : (
                            item.lokasi
                          )}
                        </td>
                        <td className="py-4 px-4 space-y-1 align-top">{item.chargers?.map((c, i) => <span key={i} className="block px-2 py-1 bg-slate-100 rounded text-slate-600 border border-slate-200 w-fit">{c.jenis}</span>)}</td>
                        <td className="py-4 px-4 space-y-2 font-semibold align-top">{item.chargers?.map((c, i) => <span key={i} className="block">{c.brand}</span>)}</td>
                        <td className="py-4 px-4 space-y-2 text-slate-500 align-top">{item.chargers?.map((c, i) => <span key={i} className="block">{c.jumlah} Unit</span>)}</td>
                        <td className="py-4 px-4 space-y-1 align-top">
                          {item.pics?.map((p, i) => (
                            <div key={i} className="flex items-center gap-2"><span className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500">{p.charAt(0)}</span><span className="text-slate-600">{p}</span></div>
                          ))}
                        </td>
                        <td className="py-4 px-4 align-top"><div className="flex items-center gap-2"><div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-blue-500 rounded-full" style={{ width: `${progress}%` }}></div></div><span className="font-bold text-slate-700">{progress}%</span></div></td>
                        
                        {['survey', 'teknis', 'dokumen', 'pln', 'izin', 'vendor', 'pks', 'instalasi', 'testing'].map(stage => (
                           <td key={stage} className="py-4 px-4 align-top min-w-[140px] relative hover:z-30">
                             {stage === 'dokumen' || stage === 'izin' ? (
                               <ChecklistBadge status={item[stage]} checklist={stage === 'dokumen' ? item.dokumenChecklist : item.izinChecklist} type={stage} />
                             ) : ['survey', 'teknis', 'pln', 'instalasi', 'testing'].includes(stage) ? (
                               <MediaBadge status={item[stage]} links={item[`${stage}Links`]} folderLink={item[`${stage}FolderLink`]} title={STAGE_NAME_MAP[stage]} />
                             ) : ['vendor', 'pks'].includes(stage) ? (
                               <FolderBadge status={item[stage]} folderLink={item[`${stage}FolderLink`]} />
                             ) : (
                               <StatusBadge status={item[stage]} />
                             )}
                           </td>
                        ))}

                        <td className="py-4 px-4 align-top"><div className={`flex items-center gap-2 font-bold ${statusAkhir.color}`}><span className={`w-2 h-2 rounded-full ${statusAkhir.dot}`}></span> {statusAkhir.text}</div></td>
                        <td className="py-4 px-4 text-slate-500 max-w-[250px] align-top"><p className="whitespace-normal break-words">{item.keterangan}</p></td>
                        
                        <td className="py-4 px-4 text-center sticky right-0 z-40 bg-white group-hover:bg-slate-50 border-l border-slate-100 shadow-[-8px_0_10px_-5px_rgba(0,0,0,0.05)] transition-colors align-top">
                           <button onClick={() => setHistoryModal({ isOpen: true, location: item })} className="p-2 text-blue-500 hover:bg-blue-100 rounded-full transition-colors mt-1" title="Lihat History Audit Trail">
                             <Info className="w-5 h-5" />
                           </button>
                        </td>
                      </tr>
                    )})}
                    {filteredLocations.length === 0 && (
                      <tr><td colSpan="19" className="py-8 text-center text-slate-500">Pencarian "{searchQuery}" tidak ditemukan bray.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {activeTab === 'update' && (
             <div className="space-y-4">
               
               {/* KONDISI 1: JIKA LAGI GAK ADA YANG DIEDIT, TAMPILIN LIST LOKASI */}
               {!formDraft && (
                 <>
                   <div className="flex justify-end mb-4">
                     <button onClick={handleOpenAddForm} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-sm transition-colors">
                       <Plus className="w-4 h-4" /> Tambah Lokasi
                     </button>
                   </div>

                   <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-auto max-h-[calc(100vh-240px)]">
                     <table className="w-max min-w-full text-xs text-left relative">
                       <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider">
                         <tr>
                           <th className="py-3 px-3 sticky top-0 left-0 z-50 bg-slate-50 border-b border-slate-100 w-[60px] min-w-[60px] max-w-[60px]">NO</th>
                           <th className="py-3 px-3 sticky top-0 left-[60px] z-50 bg-slate-50 border-b border-r border-slate-100 min-w-[250px] max-w-[250px] shadow-[8px_0_10px_-5px_rgba(0,0,0,0.05)]">LOKASI</th>
                           <th className="py-3 px-3 sticky top-0 bg-slate-50 z-20 border-b border-slate-100 min-w-[300px]">CHARGERS (JENIS, BRAND, QTY)</th>
                           <th className="py-3 px-3 sticky top-0 bg-slate-50 z-20 border-b border-slate-100 min-w-[180px]">PIC</th>
                           <th className="py-3 px-3 sticky top-0 bg-slate-50 z-20 border-b border-slate-100">PROGRESS KESELURUHAN</th>
                           <th className="py-3 px-3 sticky top-0 bg-slate-50 z-20 border-b border-slate-100 min-w-[200px]">KETERANGAN</th>
                           <th className="py-3 px-3 text-center sticky right-0 top-0 bg-slate-50 z-50 border-b border-l border-slate-200 shadow-[-8px_0_10px_-5px_rgba(0,0,0,0.05)]">AKSI EDIT</th>
                         </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-100">
                         {filteredLocations.map((item, index) => {
                           const progress = calculateProgress(item);
                           return (
                           <tr key={item.id} className="group hover:bg-slate-50 align-top">
                             <td className="py-3 px-3 text-slate-400 align-top font-bold sticky left-0 z-40 bg-white group-hover:bg-slate-50 w-[60px] min-w-[60px] max-w-[60px]">{index + 1}</td>
                             <td className="py-3 px-3 align-top font-bold text-slate-800 sticky left-[60px] z-40 bg-white group-hover:bg-slate-50 min-w-[250px] max-w-[250px] shadow-[8px_0_10px_-5px_rgba(0,0,0,0.05)] border-r border-slate-100">{item.lokasi}</td>
                             <td className="py-3 px-3">
                                <div className="space-y-1">
                                   {(item.chargers || []).map((c, i) => <span key={i} className="block px-2 py-1 bg-slate-100 rounded text-slate-600 border border-slate-200 w-fit">{c.jenis} | {c.brand} | {c.jumlah} Unit</span>)}
                                   {(!item.chargers || item.chargers.length === 0) && <span className="text-slate-400 italic">Kosong</span>}
                                </div>
                             </td>
                             <td className="py-3 px-3">
                               <div className="space-y-1">
                                 {(item.pics || []).map((p, i) => <div key={i} className="flex items-center gap-2"><span className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500">{p.charAt(0)}</span><span className="text-slate-600">{p}</span></div>)}
                                 {(!item.pics || item.pics.length === 0) && <span className="text-slate-400 italic">Kosong</span>}
                               </div>
                             </td>
                             <td className="py-3 px-3"><div className="flex items-center gap-2"><div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-blue-500 rounded-full" style={{ width: `${progress}%` }}></div></div><span className="font-bold text-slate-700">{progress}%</span></div></td>
                             <td className="py-3 px-3"><p className="whitespace-normal break-words max-w-[200px] text-slate-600">{item.keterangan || <span className="italic text-slate-400">Kosong</span>}</p></td>
                             
                             <td className="py-3 px-3 text-center sticky right-0 z-40 bg-white group-hover:bg-slate-50 border-l border-slate-200 shadow-[-8px_0_10px_-5px_rgba(0,0,0,0.05)] transition-colors align-middle">
                               <div className="flex gap-2 justify-center items-center h-full">
                                 <button onClick={() => handleOpenEditForm(item)} className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded font-bold flex items-center gap-1 transition-colors" title="Edit Lokasi"><Edit2 className="w-4 h-4" /> Edit</button>
                                 <button onClick={() => handleDeleteLocation(item.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors" title="Hapus Lokasi"><Trash2 className="w-4 h-4" /></button>
                               </div>
                             </td>
                           </tr>
                         )})}
                         {filteredLocations.length === 0 && (
                           <tr><td colSpan="7" className="py-8 text-center text-slate-500">Pencarian "{searchQuery}" tidak ditemukan bray.</td></tr>
                         )}
                       </tbody>
                     </table>
                   </div>
                 </>
               )}

               {/* KONDISI 2: JIKA LAGI NGEDIT (MUNCUL HALAMAN FORM PENUH) */}
               {formDraft && (
                 <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 animate-fade-in pb-12">
                   {/* HEADER FORM */}
                   <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
                     <div className="flex items-center gap-4">
                       <button onClick={() => setFormDraft(null)} className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full transition-colors" title="Kembali"><ChevronLeft className="w-5 h-5"/></button>
                       <div>
                          <h3 className="text-xl font-bold text-slate-800">{formDraft.isNew ? 'Tambah Lokasi Baru' : 'Edit Progress Lokasi'}</h3>
                          <p className="text-xs text-slate-500 mt-1">{formDraft.isNew ? 'Isi data awal lokasi baru' : `Update progres pengerjaan untuk ${formDraft.lokasi}`}</p>
                       </div>
                     </div>
                     <div className="flex gap-3">
                       <button onClick={() => setFormDraft(null)} className="px-4 py-2 text-slate-500 font-bold hover:bg-slate-100 rounded-lg transition-colors">Batal</button>
                       <button onClick={handleSaveForm} className="px-5 py-2 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg flex items-center gap-2 shadow-sm transition-colors"><Save className="w-4 h-4"/> Simpan Perubahan</button>
                     </div>
                   </div>

                   <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                     
                     {/* KOLOM KIRI: INFO UTAMA & HARDWARE */}
                     <div className="lg:col-span-1 space-y-6">
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                           <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2"><Home className="w-4 h-4 text-blue-500"/> Profil Lokasi</h4>
                           <div className="space-y-4">
                              <div>
                                 <label className="block text-xs font-bold text-slate-600 mb-1">Nama Lokasi</label>
                                 <input type="text" value={formDraft.lokasi} onChange={(e) => updateDraftField('lokasi', e.target.value)} className="w-full p-2 border border-slate-300 rounded focus:border-blue-500 outline-none" placeholder="Masukkan nama lokasi..." />
                              </div>
                              <div>
                                 <label className="block text-xs font-bold text-slate-600 mb-1">Link Google Maps (Opsional)</label>
                                 <input type="text" value={formDraft.gmapsLink || ''} onChange={(e) => updateDraftField('gmapsLink', e.target.value)} className="w-full p-2 border border-slate-300 rounded focus:border-blue-500 outline-none text-xs" placeholder="https://maps.google.com/..." />
                              </div>
                              <div>
                                 <label className="block text-xs font-bold text-slate-600 mb-1">Keterangan / Catatan Tambahan</label>
                                 <textarea value={formDraft.keterangan} onChange={(e) => updateDraftField('keterangan', e.target.value)} className="w-full p-2 border border-slate-300 rounded focus:border-blue-500 outline-none text-xs min-h-[80px]" placeholder="Keterangan kondisi lapangan..."></textarea>
                              </div>
                           </div>
                        </div>

                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                           <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2"><Activity className="w-4 h-4 text-blue-500"/> Hardware & Tim</h4>
                           
                           <div className="mb-5">
                              <label className="block text-xs font-bold text-slate-600 mb-2">Daftar Charger</label>
                              <div className="space-y-2">
                                {(formDraft.chargers || []).map((chg, idx) => (
                                  <div key={idx} className="flex gap-1.5 items-center">
                                    <select value={chg.jenis || ''} onChange={e => handleDraftArrayUpdate('chargers', idx, 'jenis', e.target.value)} className="flex-1 p-1.5 border border-slate-300 rounded outline-none focus:border-blue-500 text-[11px] bg-white">
                                      <option value="" disabled>Jenis</option><option value="7kW AC">7kW AC</option><option value="22kW AC">22kW AC</option><option value="30kW DC">30kW DC</option><option value="60kW DC">60kW DC</option><option value="120kW DC">120kW DC</option><option value="240kW DC">240kW DC</option>
                                    </select>
                                    <select value={chg.brand || ''} onChange={e => handleDraftArrayUpdate('chargers', idx, 'brand', e.target.value)} className="flex-1 p-1.5 border border-slate-300 rounded outline-none focus:border-blue-500 text-[11px] bg-white">
                                      <option value="" disabled>Brand</option><option value="TIDE">TIDE</option><option value="Moderntec">Moderntec</option><option value="Teison">Teison</option><option value="Starcharge">Starcharge</option>
                                    </select>
                                    <input type="number" placeholder="Qty" value={chg.jumlah || ''} onChange={e => handleDraftArrayUpdate('chargers', idx, 'jumlah', parseInt(e.target.value) || 0)} className="w-14 p-1.5 border border-slate-300 rounded outline-none focus:border-blue-500 text-[11px] bg-white" />
                                    <button onClick={() => handleDraftArrayRemove('chargers', idx)} className="text-slate-400 hover:text-red-500 p-1.5 rounded transition-colors bg-white border border-slate-300"><Trash2 className="w-3.5 h-3.5" /></button>
                                  </div>
                                ))}
                                <button onClick={() => handleDraftArrayAdd('chargers', {jenis: '', brand: '', jumlah: 1})} className="text-[11px] font-bold bg-blue-100 text-blue-700 px-3 py-2 rounded flex items-center justify-center gap-1 hover:bg-blue-200 transition-colors w-full"><Plus className="w-3 h-3"/> Tambah Mesin Charger</button>
                              </div>
                           </div>

                           <div>
                              <label className="block text-xs font-bold text-slate-600 mb-2">Tim PIC Lapangan</label>
                              <div className="space-y-2">
                                {(formDraft.pics || []).map((pic, idx) => (
                                  <div key={idx} className="flex gap-1.5 items-center">
                                    <input type="text" placeholder="Nama PIC..." value={pic || ''} onChange={e => handleDraftArrayUpdateString('pics', idx, e.target.value)} className="flex-1 p-2 border border-slate-300 rounded outline-none focus:border-blue-500 text-xs bg-white" />
                                    <button onClick={() => handleDraftArrayRemove('pics', idx)} className="text-slate-400 hover:text-red-500 p-2 rounded transition-colors bg-white border border-slate-300"><Trash2 className="w-4 h-4" /></button>
                                  </div>
                                ))}
                                <button onClick={() => handleDraftArrayAdd('pics', '')} className="text-[11px] font-bold bg-blue-100 text-blue-700 px-3 py-2 rounded flex items-center justify-center gap-1 hover:bg-blue-200 transition-colors w-full"><Plus className="w-3 h-3"/> Tambah PIC Baru</button>
                              </div>
                           </div>
                        </div>
                     </div>

                     {/* KOLOM KANAN: 9 STAGES PROGRESS (DIBIKIN GRID 2 KOLOM BIAR RAPI) */}
                     <div className="lg:col-span-2">
                        <h4 className="text-sm font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2"><Check className="w-4 h-4 text-green-500"/> Update Status Pengerjaan</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           {['survey', 'teknis', 'dokumen', 'pln', 'izin', 'vendor', 'pks', 'instalasi', 'testing'].map(stage => (
                             <div key={stage} className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm hover:border-blue-200 transition-colors">
                               <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">{STAGE_NAME_MAP[stage]}</label>
                               <FormEditableStatus draft={formDraft} stage={stage} updateDraftField={updateDraftField} />
                             </div>
                           ))}
                        </div>
                     </div>

                   </div>
                 </div>
               )}
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

          {activeTab === 'calendar' && (() => {
            const year = calendarMonth.getFullYear();
            const month = calendarMonth.getMonth();
            const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            const firstDayOfMonth = new Date(year, month, 1).getDay();

            return (
              <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100">
                 <div className="flex justify-between items-center mb-6">
                   <h3 className="text-xl font-bold text-slate-800">
                     Jadwal {monthNames[month]} {year}
                   </h3>
                   <div className="flex gap-2">
                     <button onClick={handlePrevMonth} className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded transition-colors" title="Bulan Sebelumnya"><ChevronLeft className="w-5 h-5" /></button>
                     <button onClick={handleNextMonth} className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded transition-colors" title="Bulan Selanjutnya"><ChevronRight className="w-5 h-5" /></button>
                   </div>
                 </div>

                 <div className="grid grid-cols-7 gap-[1px] bg-slate-200 border border-slate-200 rounded-lg overflow-hidden">
                   {['MINGGU', 'SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU'].map(d => (
                     <div key={d} className="bg-white py-2 text-center text-xs font-bold text-slate-600">{d}</div>
                   ))}

                   {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`empty-${i}`} className="bg-slate-50 min-h-[100px]"></div>)}

                   {Array.from({ length: daysInMonth }).map((_, i) => {
                     const dateNum = i + 1;
                     const fullDateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${dateNum.toString().padStart(2, '0')}`;
                     
                     const events = [];
                     filteredLocations.forEach(loc => {
                       ['survey', 'teknis', 'dokumen', 'pln', 'izin', 'vendor', 'pks', 'instalasi', 'testing'].forEach(stage => {
                          if (loc[stage] && loc[stage].includes(`Jadwal ${fullDateStr}`)) {
                             events.push({ locName: loc.lokasi, stageName: stage });
                          }
                       });
                     });

                     return (
                       <div key={i} className="bg-white min-h-[100px] p-2">
                         <span className={`text-xs font-bold block text-right ${new Date().getDate() === dateNum && new Date().getMonth() === month && new Date().getFullYear() === year ? 'text-blue-600 bg-blue-100 w-fit ml-auto px-1.5 rounded' : 'text-slate-400'}`}>
                           {dateNum}
                         </span>
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
            );
          })()}
        </div>
      </main>
    </div>
  );
}

// --- KOMPONEN BANTUAN ---

function StatusBadge({ status }) {
  if (!status) return null;
  if (status === 'Selesai') return <span className="px-3 py-1 rounded bg-green-100 text-green-700 border border-green-200 block text-center w-full shadow-sm">Selesai</span>;
  if (status === 'Non PLN') return <span className="px-3 py-1 rounded bg-teal-100 text-teal-700 border border-teal-200 block text-center w-full shadow-sm">Non PLN</span>;
  if (status === 'Proses') return <span className="px-3 py-1 rounded bg-amber-100 text-amber-700 border border-amber-200 block text-center w-full shadow-sm">Proses</span>;
  if (status === 'Belum') return <span className="px-3 py-1 rounded bg-slate-100 text-slate-500 border border-slate-200 block text-center w-full">Belum</span>;
  if (status.startsWith('Jadwal')) {
    const dateStr = status.replace('Jadwal ', '');
    const [year, month, day] = dateStr.split('-');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
    const displayDate = `${day} ${monthNames[parseInt(month, 10) - 1]} ${year}`;
    
    return (
      <div className="flex flex-col w-full text-center shadow-sm">
        <span className="bg-blue-100 text-blue-700 border border-blue-200 border-b-0 rounded-t py-1">Jadwal</span>
        <span className="bg-white text-slate-600 border border-blue-200 rounded-b py-1 flex items-center justify-center gap-1 font-medium whitespace-nowrap px-1 text-[11px]"><Calendar className="w-3 h-3 shrink-0" /> {displayDate}</span>
      </div>
    );
  }
  return <span>{status}</span>;
}

function FolderBadge({ status, folderLink }) {
  const handleClick = () => {
    if (folderLink) {
      const url = folderLink.startsWith('http') ? folderLink : `https://${folderLink}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };
  return (
    <div onClick={handleClick} className={`w-full text-center ${folderLink ? 'cursor-pointer hover:brightness-95 transition-all' : ''}`}>
      <StatusBadge status={status} />
    </div>
  );
}

function ChecklistBadge({ status, checklist, type }) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState('bottom');
  const badgeRef = useRef(null);
  const timeoutRef = useRef(null);
  
  const ITEMS = type === 'dokumen' ? DOKUMEN_ITEMS : IZIN_ITEMS;
  const safeChecklist = checklist || {};

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (badgeRef.current) {
      const rect = badgeRef.current.getBoundingClientRect();
      if (window.innerHeight - rect.bottom < 300) {
        setPosition('top');
      } else {
        setPosition('bottom');
      }
    }
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    setIsOpen(false); 
  };

  useEffect(() => {
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); }
  }, []);

  return (
    <div 
      ref={badgeRef}
      className="relative flex flex-col w-full text-center cursor-pointer group" 
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="relative z-10 w-full hover:brightness-95 transition-all">
        <StatusBadge status={status} />
      </div>
      
      {isOpen && (
        <div className={`absolute left-1/2 -translate-x-1/2 w-max max-w-xs z-50 ${position === 'top' ? 'bottom-full pb-2' : 'top-full pt-2'}`}>
          <div className="bg-white border border-slate-200 rounded-lg shadow-xl p-4 text-left cursor-default">
            <p className="text-xs font-bold text-slate-700 mb-3 border-b border-slate-100 pb-2 whitespace-nowrap">
              {type === 'dokumen' ? 'Detail Dokumen Teknis' : 'Detail Perizinan'}
            </p>
            <div className="space-y-2.5">
              {ITEMS.map(item => {
                const isChecked = typeof safeChecklist[item.key] === 'object' ? safeChecklist[item.key]?.checked : safeChecklist[item.key];
                const link = typeof safeChecklist[item.key] === 'object' ? safeChecklist[item.key]?.link : '';
                
                const content = (
                  <div className="flex items-start gap-2 text-xs group/link">
                    {isChecked ? <Check className="w-4 h-4 text-green-500 shrink-0 mt-px" /> : <X className="w-4 h-4 text-red-400 shrink-0 mt-px" />}
                    <span className={`whitespace-normal leading-tight ${isChecked ? 'text-slate-700 font-medium' : 'text-slate-400'} ${link ? 'group-hover/link:underline group-hover/link:text-blue-600 transition-colors' : ''}`}>
                      {item.label}
                    </span>
                    {link && <ExternalLink className="w-3 h-3 text-slate-400 group-hover/link:text-blue-500 shrink-0 mt-0.5" />}
                  </div>
                );

                return link ? (
                  <a key={item.key} href={link.startsWith('http') ? link : `https://${link}`} target="_blank" rel="noreferrer" className="block">
                    {content}
                  </a>
                ) : (
                  <div key={item.key} className="block">{content}</div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MediaBadge({ status, links, folderLink, title }) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState('bottom');
  const badgeRef = useRef(null);
  const timeoutRef = useRef(null); 
  const safeLinks = links || [];

  const getGDriveThumbnailUrl = (url) => {
    if (!url) return '';
    const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w400-h400`; 
    }
    return url;
  };

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (badgeRef.current) {
      const rect = badgeRef.current.getBoundingClientRect();
      if (window.innerHeight - rect.bottom < 250) {
        setPosition('top');
      } else {
        setPosition('bottom');
      }
    }
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    setIsOpen(false);
  };

  useEffect(() => {
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); }
  }, []);

  const handleClick = (e) => {
    if (folderLink) {
      const url = folderLink.startsWith('http') ? folderLink : `https://${folderLink}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div 
      ref={badgeRef}
      className={`relative flex flex-col w-full text-center ${folderLink ? 'cursor-pointer' : 'cursor-default'} group`} 
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      <div className="relative z-10 w-full hover:brightness-95 transition-all">
        <StatusBadge status={status} />
      </div>
      
      {isOpen && (
        <div 
          onClick={(e) => e.stopPropagation()} 
          className={`absolute left-1/2 -translate-x-1/2 w-max max-w-[280px] z-50 ${position === 'top' ? 'bottom-full pb-2' : 'top-full pt-2'}`}
        >
          <div className="bg-white border border-slate-200 rounded-lg shadow-xl p-3 text-left cursor-default">
            <p className="text-xs font-bold text-slate-700 mb-3 border-b border-slate-100 pb-2 flex items-center gap-1.5 whitespace-nowrap">
              <ImageIcon className="w-4 h-4 text-blue-500" /> Lampiran {title}
            </p>
            {safeLinks.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {safeLinks.map((link, idx) => (
                  <a 
                    key={idx} 
                    href={link.startsWith('http') ? link : `https://${link}`} 
                    target="_blank" 
                    rel="noreferrer" 
                    onClick={(e) => e.stopPropagation()} 
                    className="block relative group/img overflow-hidden rounded border border-slate-200 aspect-square bg-slate-50"
                  >
                    <img 
                      src={getGDriveThumbnailUrl(link)} 
                      alt={`Bukti ${idx+1}`} 
                      className="w-full h-full object-cover group-hover/img:scale-110 transition-transform duration-300" 
                      onError={(e) => { 
                        e.target.onerror = null; 
                        e.target.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdib3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjY2JkNWUxIiBzdHJva2Utd2lkdGg9IjEiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHJlY3QgeD0iMyIgeT0iMyIgd2lkdGg9IjE4IiBoZWlnaHQ9IjE4IiByeD0iMiIgcnk9IjIiPjwvcmVjdD48Y2lyY2xlIGN4PSI4LjUiIGN5PSI4LjUiIHI9IjEuNSI+PC9jaXJjbGU+PHBvbHlsaW5lIHBvaW50cz0iMjEgMTUgMTYgMTAgNSAyMSI+PC9wb2x5bGluZT48L3N2Zz4='; 
                        e.target.className = "w-full h-full p-4 object-contain opacity-50 group-hover/img:scale-100 transition-none";
                      }} 
                    />
                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-opacity">
                      <ExternalLink className="w-5 h-5 text-white" />
                    </div>
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic text-center py-3">Belum ada lampiran foto/video.</p>
            )}
            {folderLink && (
               <div className="mt-3 pt-2 border-t border-slate-100 text-[10px] text-slate-400 text-center flex items-center justify-center gap-1">
                 <Folder className="w-3 h-3"/> Klik status untuk buka folder GDrive
               </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// KOMPONEN BARU: FORM FIELD SPESIFIK BUAT HALAMAN EDIT/TAMBAH
function FormEditableStatus({ draft, stage, updateDraftField }) {
  // --- TIPE 1: CHECKLIST SMART LINK (DOKUMEN & IZIN) ---
  if (stage === 'dokumen' || stage === 'izin') {
    const isDokumen = stage === 'dokumen';
    const checklistField = isDokumen ? 'dokumenChecklist' : 'izinChecklist';
    const ITEMS = isDokumen ? DOKUMEN_ITEMS : IZIN_ITEMS;
    
    const defaultChecklist = ITEMS.reduce((acc, curr) => ({ ...acc, [curr.key]: { checked: false, link: '' } }), {});
    const checklist = draft[checklistField] || defaultChecklist;
    
    const handleSelectChange = (e) => {
      const val = e.target.value;
      updateDraftField(stage, val);
      if (val === 'Belum') {
        updateDraftField(checklistField, defaultChecklist);
      }
    };

    const handleCheck = (key, checked) => {
      const currentVal = checklist[key] || { checked: false, link: '' };
      const currentLink = typeof currentVal === 'object' ? currentVal.link : '';
      
      const newChecklist = { ...checklist, [key]: { checked, link: currentLink } };
      
      const isAllChecked = ITEMS.every(item => {
        const val = newChecklist[item.key];
        return typeof val === 'object' ? val?.checked : val;
      });
      
      updateDraftField(checklistField, newChecklist);
      updateDraftField(stage, isAllChecked ? 'Selesai' : 'Proses');
    };

    const handleLinkChange = (key, link) => {
      const currentVal = checklist[key] || { checked: false, link: '' };
      const isChecked = typeof currentVal === 'object' ? currentVal.checked : currentVal;
      
      const newChecklist = { ...checklist, [key]: { checked: isChecked, link } };
      updateDraftField(checklistField, newChecklist);
    };

    return (
      <div className="flex flex-col gap-2 w-full">
        <select value={draft[stage]} onChange={handleSelectChange} className="w-full p-2 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 outline-none text-slate-700 text-xs font-bold bg-white">
          <option value="Belum">Belum</option>
          <option value="Proses">Proses</option>
          {draft[stage] === 'Selesai' && <option value="Selesai" disabled>Selesai</option>}
        </select>
        
        {(draft[stage] === 'Proses' || draft[stage] === 'Selesai') && (
          <div className="flex flex-col gap-3 mt-2 p-3 bg-slate-50 border border-slate-200 rounded text-xs">
            {ITEMS.map(item => {
              const currentVal = checklist[item.key];
              const isChecked = typeof currentVal === 'object' ? currentVal?.checked : currentVal || false;
              const link = typeof currentVal === 'object' ? currentVal?.link : '';

              return (
                <div key={item.key} className="flex flex-col gap-2 border-b border-slate-200 pb-3 last:border-0 last:pb-0">
                  <label className="flex items-start gap-2 cursor-pointer hover:text-blue-600 transition-colors group">
                    <input type="checkbox" checked={isChecked} onChange={(e) => handleCheck(item.key, e.target.checked)} className="accent-blue-600 w-4 h-4 cursor-pointer shrink-0" /> 
                    <span className="font-bold text-slate-700 whitespace-normal leading-tight group-hover:text-blue-600 transition-colors pt-0.5">{item.label}</span>
                  </label>
                  <input 
                    type="text" 
                    value={link} 
                    onChange={(e) => handleLinkChange(item.key, e.target.value)} 
                    placeholder="Link GDrive dokumen..." 
                    className="w-[calc(100%-24px)] ml-[24px] p-2 border border-slate-200 rounded outline-none focus:border-blue-500 text-xs bg-white" 
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // --- TIPE 2: MEDIA VIEWER (SURVEY, TEKNIS, PLN, INSTALASI, TESTING) ---
  if (['survey', 'teknis', 'pln', 'instalasi', 'testing'].includes(stage)) {
    const linksField = stage + 'Links';
    const folderField = stage + 'FolderLink';
    
    const links = draft[linksField] || [];
    const folderLink = draft[folderField] || '';
    
    // Khusus Opsi Jadwal
    const isJadwal = draft[stage]?.startsWith('Jadwal');
    const allowJadwal = true; 
    
    return (
      <div className="flex flex-col gap-2 w-full">
        <select value={isJadwal ? 'Jadwal' : draft[stage]} onChange={(e) => updateDraftField(stage, e.target.value === 'Jadwal' ? 'Jadwal ' : e.target.value)} className="w-full p-2 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 outline-none text-slate-700 text-xs font-bold bg-white">
          <option value="Belum">Belum</option>
          <option value="Proses">Proses</option>
          <option value="Selesai">Selesai</option>
          {stage === 'pln' && <option value="Non PLN">Non PLN</option>}
          {allowJadwal && <option value="Jadwal">Jadwal Penentuan</option>}
        </select>
        
        {isJadwal && (
          <input type="date" value={draft[stage].replace('Jadwal ', '')} onChange={(e) => updateDraftField(stage, `Jadwal ${e.target.value}`)} className="w-full p-2 border border-slate-300 rounded text-slate-700 text-xs font-bold bg-white" />
        )}

        {(draft[stage] === 'Proses' || draft[stage] === 'Selesai' || draft[stage] === 'Non PLN') && (
          <div className="flex flex-col gap-3 mt-2 p-3 bg-slate-50 border border-slate-200 rounded text-xs">
            <div className="border-b border-slate-200 pb-3">
               <span className="font-bold text-slate-700 flex items-center gap-1.5 mb-2"><Folder className="w-3.5 h-3.5 text-blue-500"/> Folder Master GDrive</span>
               <input 
                 type="text" 
                 value={folderLink} 
                 onChange={(e) => updateDraftField(folderField, e.target.value)} 
                 className="w-full p-2 border border-slate-200 rounded outline-none focus:border-blue-500 text-xs bg-white" 
                 placeholder="Link folder Google Drive..." 
               />
            </div>

            <div>
               <span className="font-bold text-slate-700 flex items-center gap-1.5 mb-2"><ImageIcon className="w-3.5 h-3.5 text-blue-500"/> Lampiran Gambar (Thumbnail)</span>
               <div className="space-y-2">
                 {links.map((link, idx) => (
                   <div key={idx} className="flex items-center gap-2">
                     <input 
                       type="text" 
                       value={link} 
                       onChange={(e) => {
                         const newLinks = [...links];
                         newLinks[idx] = e.target.value;
                         updateDraftField(linksField, newLinks);
                       }} 
                       className="flex-1 p-2 border border-slate-200 rounded outline-none focus:border-blue-500 text-xs bg-white" 
                       placeholder="Paste link file GDrive..." 
                     />
                     <button onClick={() => {
                       const newLinks = [...links];
                       newLinks.splice(idx, 1);
                       updateDraftField(linksField, newLinks);
                     }} className="text-slate-400 hover:text-red-500 transition-colors p-2 bg-white border border-slate-200 rounded"><Trash2 className="w-4 h-4"/></button>
                   </div>
                 ))}
                 <button onClick={() => updateDraftField(linksField, [...links, ''])} className="text-xs font-bold bg-blue-100 text-blue-700 px-3 py-2 rounded flex items-center justify-center gap-1 hover:bg-blue-200 transition-colors w-full mt-2"><Plus className="w-3.5 h-3.5"/> Tambah Thumbnail File</button>
               </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- TIPE 3: FOLDER ONLY (VENDOR & PKS) ---
  if (['vendor', 'pks'].includes(stage)) {
    const folderField = stage + 'FolderLink';
    const folderLink = draft[folderField] || '';

    return (
      <div className="flex flex-col gap-2 w-full">
        <select value={draft[stage]} onChange={(e) => updateDraftField(stage, e.target.value)} className="w-full p-2 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 outline-none text-slate-700 text-xs font-bold bg-white">
          <option value="Belum">Belum</option>
          <option value="Proses">Proses</option>
          <option value="Selesai">Selesai</option>
        </select>
        
        {(draft[stage] === 'Proses' || draft[stage] === 'Selesai') && (
          <div className="flex flex-col gap-2 mt-2 p-3 bg-slate-50 border border-slate-200 rounded text-xs">
             <span className="font-bold text-slate-700 flex items-center gap-1.5"><Folder className="w-3.5 h-3.5 text-blue-500"/> Link GDrive</span>
             <input 
               type="text" 
               value={folderLink} 
               onChange={(e) => updateDraftField(folderField, e.target.value)} 
               className="w-full p-2 border border-slate-200 rounded outline-none focus:border-blue-500 text-xs bg-white mt-1" 
               placeholder="Link folder Google Drive..." 
             />
          </div>
        )}
      </div>
    );
  }

  // Jaga-jaga Fallback
  return (
     <select value={draft[stage]} onChange={(e) => updateDraftField(stage, e.target.value)} className="w-full p-2 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 outline-none text-slate-700 text-xs font-bold bg-white">
       <option value="Belum">Belum</option>
       <option value="Proses">Proses</option>
       <option value="Selesai">Selesai</option>
     </select>
  );
}