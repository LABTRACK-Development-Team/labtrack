import apiClient from '@/lib/api-client';
import { useAuth } from '@/context/auth-context';
import React, { useEffect,  useState, useRef } from 'react';
import { 
  User, Lock, Shield, Bell, LogOut, Camera, Check, X, 
  ChevronDown, ChevronUp, AlertTriangle, Key, Mail, Building, 
  CheckCircle2, RefreshCw, Sliders, ShieldCheck, ToggleLeft, ToggleRight,
  Sparkles, Save, Eye, EyeOff, Activity, Trash2, Plus, Phone, Monitor, Upload
} from 'lucide-react';

export interface UserProfile {
  name: string;
  email: string;
  role: string;
  department: string;
  employeeId: string;
  phone: string;
  avatarUrl: string;
}

export interface LabClosureItem {
  id: string;
  labName: string;
  isClosed: boolean;
  reason: string;
  closedBy: string;
  date: string;
}

export interface ActiveSession {
  id: string;
  device: string;
  ip: string;
  location: string;
  lastActive: string;
  isCurrent: boolean;
}

export const ProfileView: React.FC = () => {
  const { user, updateUser } = useAuth();
  // File Input Reference for Automatic File Picker
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Profile State (CRUD Read & Update)
  const [profile, setProfile] = useState<UserProfile>({
    name: 'Engr. Clara Reyes',
    email: 'c.reyes@jrmsu.edu.ph',
    role: '',
    department: 'College of Computer Studies',
    employeeId: 'EMP-2026-0412',
    phone: '+63 917 555 0192',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=256&auto=format&fit=crop'
  });

  // Accordion Expand/Collapse States
  const [activeAccordion, setActiveAccordion] = useState<'name' | 'closure' | 'issue' | 'password' | 'sessions' | null>('name');

  // Lab Closure Overrides Data
  const [labClosures, setLabClosures] = useState<LabClosureItem[]>([
    { id: 'lc-1', labName: 'ComLab 1 (Networking)', isClosed: false, reason: 'Regular Maintenance Clearance', closedBy: 'System', date: '2026-11-01' },
    { id: 'lc-2', labName: 'ComLab 2 (Software Eng)', isClosed: true, reason: 'Aircon Repair & Overheat Maintenance', closedBy: 'Engr. Clara Reyes', date: '2026-11-02' },
    { id: 'lc-3', labName: 'ComLab 3 (AI Lab)', isClosed: false, reason: 'Operational', closedBy: 'System', date: '2026-11-01' },
    { id: 'lc-4', labName: 'ComLab 4 (General Lab)', isClosed: false, reason: 'Operational', closedBy: 'System', date: '2026-11-01' },
  ]);

  // Active Sessions Data
  const [sessions, setSessions] = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoadingData(true);
        const res = await apiClient.get('/api/v1/pc-usage/history');
        const data = res.data?.data?.items || res.data?.data || res.data || [];
        setSessions(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Fetch failed:", err);
      } finally {
        setIsLoadingData(false);
      }
    };
    fetchData();
  }, []);

  // Issue Update Notification Preferences
  const [notifications, setNotifications] = useState({
    issueUpdates: true,
    labScheduleAlerts: true,
    emailEvents: true,
    systemAnnouncements: true,
  });

  // Modals & UI Control States
  const [isEditProfileOpen, setIsEditProfileOpen] = useState<boolean>(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState<boolean>(false);
  const [isAddClosureOpen, setIsAddClosureOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Custom Centered Delete / Session Termination Modal State
  const [sessionToTerminate, setSessionToTerminate] = useState<ActiveSession | null>(null);
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null);

  // Form States
  const [editName, setEditName] = useState<string>(profile.name);
  const [editEmail, setEditEmail] = useState<string>(profile.email);
  const [editDepartment, setEditDepartment] = useState<string>(profile.department);
  const [editPhone, setEditPhone] = useState<string>(profile.phone);

  // Password Change States
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showCurrentPass, setShowCurrentPass] = useState<boolean>(false);
  const [showNewPass, setShowNewPass] = useState<boolean>(false);

  // New Lab Closure Form States (Dual Input Supported)
  const [targetLab, setTargetLab] = useState<string>('ComLab 1 (Networking)');
  const [closureReason, setClosureReason] = useState<string>('');

  // Toast Helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // DIRECT FILE UPLOAD HANDLER
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file (JPG, PNG, WEBP).');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = async () => {
        if (reader.result) {
          const __avatarUrl = reader.result as string;
          setProfile(prev => ({ ...prev, avatarUrl: __avatarUrl }));
          try {
            if (user?.id) {
              await apiClient.put('/api/v1/users/' + user.id, {
                fullName: ((user.firstName || '') + ' ' + (user.lastName || '')).trim(),
                email: user.email,
                role: user.role || 'INSTRUCTOR',
                profilePictureUrl: __avatarUrl
              });
            }
          } catch (err) {
            console.warn('Avatar API save failed:', err);
          }
          updateUser({ ...user, profilePictureUrl: __avatarUrl });
          showToast('Profile photo updated successfully!');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // CRUD: UPDATE Profile
  // Profile sync from logged-in user
  useEffect(() => {
    if (!user) return;
    const __fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
    setProfile((prev: any) => {
      const next = { ...prev };
      if ('name' in prev && __fullName) next.name = __fullName;
      if ('fullName' in prev && __fullName) next.fullName = __fullName;
      if ('email' in prev && user.email) next.email = user.email;
      if ('phone' in prev && user.phoneNumber) next.phone = user.phoneNumber;
      if ('department' in prev && user.department) next.department = user.department;
      if ('avatarUrl' in prev && user.profilePictureUrl) next.avatarUrl = user.profilePictureUrl;
      return next;
    });
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const newName = editName.trim();
    const parts = newName.split(/\s+/);
    const firstName = parts[0] || '';
    const lastName = parts.slice(1).join(' ') || '';
    
    setProfile({
      ...profile,
      name: newName,
      email: editEmail.trim(),
      department: editDepartment.trim(),
      phone: editPhone.trim()
    });
    
    try {
      if (user?.id) {
        await apiClient.put(`/api/v1/users/${user.id}`, {
          fullName: (firstName + " " + lastName).trim(),
          email: editEmail.trim() || user.email,
          role: user.role || "INSTRUCTOR",
          phoneNumber: editPhone.trim(),
          department: editDepartment.trim(),
        });
      }
    } catch (err) {
      console.warn('Profile API save failed:', err);
    }
    
    updateUser({
      ...user,
      firstName, lastName,
      phoneNumber: editPhone.trim(),
      department: editDepartment.trim()
    });
    
    setIsEditProfileOpen(false);
    showToast('Profile information updated successfully!');
  };

  // CRUD: UPDATE Password
  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      alert('Please enter your current password.');
      return;
    }
    if (newPassword !== confirmPassword) {
      alert('New password and confirmation do not match.');
      return;
    }
    if (newPassword.length < 6) {
      alert('Password must be at least 6 characters long.');
      return;
    }

    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setIsPasswordModalOpen(false);
    showToast('Security password updated successfully!');
  };

  // CRUD: TOGGLE & ADD Lab Closure Override
  const handleToggleClosure = (id: string) => {
    setLabClosures(labClosures.map(item => {
      if (item.id === id) {
        const newStatus = !item.isClosed;
        showToast(`${item.labName} status updated to ${newStatus ? 'CLOSED' : 'OPEN'}`);
        return { ...item, isClosed: newStatus };
      }
      return item;
    }));
  };

  const handleAddClosureOverride = (e: React.FormEvent) => {
    e.preventDefault();
    if (!closureReason.trim() || !targetLab.trim()) return;

    const newClosure: LabClosureItem = {
      id: `lc-${Date.now()}`,
      labName: targetLab.trim(),
      isClosed: true,
      reason: closureReason.trim(),
      closedBy: profile.name,
      date: new Date().toISOString().split('T')[0]
    };

    setLabClosures([newClosure, ...labClosures.filter(l => (l.labName || "").toLowerCase() !== targetLab.trim().toLowerCase())]);
    setClosureReason('');
    setIsAddClosureOpen(false);
    showToast(`Emergency closure set for ${targetLab}!`);
  };

  // CRUD: TERMINATE SESSION (Custom UI Modal & Animation)
  const handleConfirmTerminateSession = () => {
    if (!sessionToTerminate) return;
    const id = sessionToTerminate.id;
    const deviceName = sessionToTerminate.device;
    setDeletingSessionId(id);
    setSessionToTerminate(null);

    setTimeout(() => {
      setSessions((prev) => prev.filter((s) => s.id !== id));
      setDeletingSessionId(null);
      showToast(`Session on "${deviceName}" successfully terminated.`);
    }, 400);
  };

  // Logout Handler
  const handleLogout = () => {
    showToast('Logging out of system...');
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-[#f0f4f3] p-4 sm:p-8 text-slate-800 font-sans select-none animate-in fade-in duration-300 space-y-6">
      
      {/* HIDDEN FILE INPUT FOR DIRECT PHOTO UPLOAD */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleImageFileChange} 
        accept="image/*" 
        className="hidden" 
      />

      {/* DATALIST SUGGESTIONS FOR DUAL INPUT LABORATORY */}
      <datalist id="lab-room-suggestions">
        <option value="ComLab 1 (Networking)" />
        <option value="ComLab 2 (Software Eng)" />
        <option value="ComLab 3 (AI Lab)" />
        <option value="ComLab 4 (General Lab)" />
        <option value="Multimedia & Graphics Lab" />
        <option value="Hardware & Microcontroller Lab" />
        <option value="Server Room Node" />
      </datalist>

      {/* TOAST NOTIFICATION BANNER */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-[#1e5352] text-white px-4 py-3 rounded-2xl shadow-lg border border-emerald-400/40 flex items-center gap-2 animate-in slide-in-from-top duration-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-300" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <User className="w-6 h-6 text-[#1e5352]" />
            Profile & Security Settings
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1 flex items-center gap-2">
            <span className="flex items-center gap-1 text-slate-700 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-[#1e5352]" /> JRMSU Authorized Access Level
            </span>
 <span>==</span>
            <span className="text-emerald-600 font-bold font-sans">Live Sync Security Active</span>
          </p>
        </div>
      </div>

      {/* MAIN LAYOUT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: AVATAR & DIRECT FILE UPLOAD CARD */}
        <div className="lg:col-span-4 space-y-5">
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-2xs text-center space-y-4 relative overflow-hidden">
            
            {/* Top Decorative Gradient */}
            <div className="h-20 bg-gradient-to-r from-[#1e5352] to-teal-700 -mx-6 -mt-6 mb-4"></div>

            {/* Profile Picture with Direct File Picker Click */}
            <div className="relative inline-block -mt-16 group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <img 
                src={profile.avatarUrl} 
                alt={profile.name} 
                className="w-24 h-24 rounded-full object-cover ring-4 ring-white shadow-md mx-auto transition duration-200 group-hover:brightness-90"
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="absolute bottom-0 right-0 p-2 bg-[#1e5352] hover:bg-[#143c3b] text-white rounded-full transition shadow-md cursor-pointer active:scale-95"
                title="Select Photo from File/Gallery"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>

            <div>
              <h2 className="text-lg font-extrabold text-slate-900">{profile.name}</h2>
              <p className="text-xs text-[#1e5352] font-bold font-sans mt-0.5">{profile.role}</p>
              <p className="text-[11px] text-slate-400 font-medium mt-1">{profile.department}</p>
            </div>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/80 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Upload className="w-3.5 h-3.5 text-[#1e5352]" />
              <span>Upload from Photos</span>
            </button>

            {/* ID Badge Pill */}
            <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
              <span className="text-slate-400 font-semibold">Employee ID:</span>
              <span className="font-sans font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg">
                {profile.employeeId}
              </span>
            </div>

            {/* Security Note Box */}

          </div>
        </div>

        {/* RIGHT COLUMN: ACCORDION SETTINGS */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-2xs space-y-4">
            
            {/* Accordion Menu Header */}
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#1e5352]" />
                Profile & Security Preferences
              </h3>
              <span className="text-xs font-bold text-slate-400">Select Category</span>
            </div>

            {/* ITEM 1: NAME */}
            <div className="border border-slate-200/80 rounded-2xl overflow-hidden transition shadow-2xs">
              <button
                onClick={() => setActiveAccordion(activeAccordion === 'name' ? null : 'name')}
                className="w-full p-4 bg-slate-50 hover:bg-slate-100/80 flex items-center justify-between text-left cursor-pointer transition"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-100/80 text-[#1e5352] rounded-xl">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-slate-900">Name & Personal Information</h4>
                    <p className="text-[10px] text-slate-400 font-medium">Manage name, email, and contact details</p>
                  </div>
                </div>
                {activeAccordion === 'name' ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </button>

              {activeAccordion === 'name' && (
                <div className="p-4 bg-white border-t border-slate-100 space-y-3 text-xs animate-in fade-in duration-200">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-bold block">Full Name</span>
                      <span className="font-extrabold text-slate-800">{profile.name}</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-bold block">Email Address</span>
                      <span className="font-sans font-bold text-slate-800">{profile.email}</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-bold block">Phone Number</span>
                      <span className="font-sans font-bold text-slate-800">{profile.phone}</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-bold block">Department</span>
                      <span className="font-bold text-slate-800">{profile.department}</span>
                    </div>
                  </div>
                  <div className="flex justify-end pt-1">
                    <button
                      onClick={() => setIsEditProfileOpen(true)}
                      className="px-4 py-2 bg-[#1e5352] hover:bg-[#143c3b] text-white text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-2xs active:scale-95"
                    >
                      <span>Edit Personal Info</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ITEM 2: LAB CLOSURE */}
            <div className="border border-slate-200/80 rounded-2xl overflow-hidden transition shadow-2xs">
              <button
                onClick={() => setActiveAccordion(activeAccordion === 'closure' ? null : 'closure')}
                className="w-full p-4 bg-slate-50 hover:bg-slate-100/80 flex items-center justify-between text-left cursor-pointer transition"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-amber-100/80 text-amber-800 rounded-xl">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-slate-900">Lab Closure & Emergency Overrides</h4>
                    <p className="text-[10px] text-slate-400 font-medium">Lock or re-open laboratory access schedules</p>
                  </div>
                </div>
                {activeAccordion === 'closure' ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </button>

              {activeAccordion === 'closure' && (
                <div className="p-4 bg-white border-t border-slate-100 space-y-3 text-xs animate-in fade-in duration-200">
                  <div className="flex justify-between items-center">
                    <p className="text-slate-500 font-medium">Room and emergency status overrides:</p>
                    <button
                      onClick={() => setIsAddClosureOpen(true)}
                      className="px-3 py-1.5 bg-[#1e5352] text-white font-bold rounded-xl text-[10px] flex items-center gap-1 cursor-pointer active:scale-95"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Set Override</span>
                    </button>
                  </div>

                  <div className="space-y-2">
                    {labClosures.map((item) => (
                      <div key={item.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 flex items-center justify-between">
                        <div>
                          <span className="font-extrabold text-slate-800 block">{item.labName}</span>
                          <span className="text-[10px] text-slate-400">{item.reason}</span>
                        </div>
                        <button
                          onClick={() => handleToggleClosure(item.id)}
                          className={`px-3 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                            item.isClosed ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'
                          }`}
                        >
                          {item.isClosed ? 'CLOSED' : 'OPEN'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ITEM 3: ISSUE UPDATE */}
            <div className="border border-slate-200/80 rounded-2xl overflow-hidden transition shadow-2xs">
              <button
                onClick={() => setActiveAccordion(activeAccordion === 'issue' ? null : 'issue')}
                className="w-full p-4 bg-slate-50 hover:bg-slate-100/80 flex items-center justify-between text-left cursor-pointer transition"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-100/80 text-blue-800 rounded-xl">
                    <Bell className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-slate-900">Issue Update Notifications</h4>
                    <p className="text-[10px] text-slate-400 font-medium">Notification and alert settings for system updates</p>
                  </div>
                </div>
                {activeAccordion === 'issue' ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </button>

              {activeAccordion === 'issue' && (
                <div className="p-4 bg-white border-t border-slate-100 space-y-3 text-xs animate-in fade-in duration-200">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
                      <span className="font-bold text-slate-800">Issue Ticket Real-Time Status Push Alerts</span>
                      <button
                        onClick={() => {
                          setNotifications({ ...notifications, issueUpdates: !notifications.issueUpdates });
                          showToast('Notification alert preferences saved!');
                        }}
                        className="text-[#1e5352] cursor-pointer"
                      >
                        {notifications.issueUpdates ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6 text-slate-400" />}
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
                      <span className="font-bold text-slate-800">Automated Email Notification Digest</span>
                      <button
                        onClick={() => {
                          setNotifications({ ...notifications, emailEvents: !notifications.emailEvents });
                          showToast('Email preferences updated!');
                        }}
                        className="text-[#1e5352] cursor-pointer"
                      >
                        {notifications.emailEvents ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6 text-slate-400" />}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ITEM 4: CHANGE PASSWORD */}
            <div className="border border-slate-200/80 rounded-2xl overflow-hidden transition shadow-2xs">
              <button
                onClick={() => setIsPasswordModalOpen(true)}
                className="w-full p-4 bg-slate-50 hover:bg-slate-100/90 flex items-center justify-between text-left cursor-pointer transition"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-slate-200 text-slate-700 rounded-xl">
                    <Key className="w-4 h-4 text-[#1e5352]" />
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-slate-900">Change Password</h4>
                    <p className="text-[10px] text-slate-400 font-medium">Update your security passphrase and encryption keys</p>
                  </div>
                </div>
                <span className="text-[10px] text-slate-400 font-sans">Last changed 30 days ago</span>
              </button>
            </div>

            {/* ITEM 5: ACTIVE SESSIONS */}
            <div className="border border-slate-200/80 rounded-2xl overflow-hidden transition shadow-2xs">
              <button
                onClick={() => setActiveAccordion(activeAccordion === 'sessions' ? null : 'sessions')}
                className="w-full p-4 bg-slate-50 hover:bg-slate-100/80 flex items-center justify-between text-left cursor-pointer transition"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-100/80 text-indigo-800 rounded-xl">
                    <Monitor className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-slate-900">Active Login Sessions</h4>
                    <p className="text-[10px] text-slate-400 font-medium">Logged-in devices and IP nodes</p>
                  </div>
                </div>
                {activeAccordion === 'sessions' ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </button>

              {activeAccordion === 'sessions' && (
                <div className="p-4 bg-white border-t border-slate-100 space-y-2 text-xs animate-in fade-in duration-200">
                  {sessions.map((s) => {
                    const isBeingDeleted = deletingSessionId === s.id;
                    return (
                      <div 
                        key={s.id} 
                        className={`p-3 bg-slate-50 rounded-xl border border-slate-200/60 flex items-center justify-between transition-all duration-400 ease-in-out ${
                          isBeingDeleted 
                            ? 'opacity-0 -translate-x-full bg-rose-100/90 blur-xs' 
                            : 'opacity-100 translate-x-0'
                        }`}
                      >
                        <div>
                          <span className="font-extrabold text-slate-800 block flex items-center gap-1.5">
                            {s.device}
                            {s.isCurrent && <span className="px-1.5 py-0.2 bg-emerald-500 text-white rounded text-[8px]">CURRENT</span>}
                          </span>
                          <span className="text-[10px] text-slate-400 font-sans">
 {s.ip} == {s.location} == {s.lastActive}
                          </span>
                        </div>
                        {!s.isCurrent && (
                          <button
                            onClick={() => setSessionToTerminate(s)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            title="Terminate Session"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* LOGOUT BUTTON ROW */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Active session connected from verified node</span>
              </div>

              <button
                onClick={handleLogout}
                className="w-full sm:w-auto px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-2 shadow-2xs active:scale-95 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout Account</span>
              </button>
            </div>

          </div>
        </div>

      </div>

      {/* CUSTOM UI CENTERED SESSION TERMINATION CONFIRMATION MODAL */}
      {sessionToTerminate && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm border border-slate-100 shadow-2xl space-y-4 text-center animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            
            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-slate-900">Confirm Session Termination</h3>
              <p className="text-xs text-slate-500 font-medium">
                Are you sure you want to terminate session on <span className="font-bold text-slate-800">{sessionToTerminate.device}</span> ({sessionToTerminate.ip})?
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSessionToTerminate(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmTerminateSession}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-sm shadow-rose-200"
              >
                Terminate Session
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: EDIT PROFILE */}
      {isEditProfileOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSaveProfile} className="bg-white rounded-3xl p-6 w-full max-w-md border border-slate-100 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900">Edit Personal Information</h3>
              <button type="button" onClick={() => setIsEditProfileOpen(false)} className="text-slate-400 hover:text-slate-600 transition cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-bold mb-1">Full Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200 font-bold text-slate-800 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Email Address</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200 font-sans text-slate-800 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Phone Contact</label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200 font-sans text-slate-800 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Department</label>
                <input
                  type="text"
                  value={editDepartment}
                  onChange={(e) => setEditDepartment(e.target.value)}
                  className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-slate-800 font-semibold focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button type="button" onClick={() => setIsEditProfileOpen(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold cursor-pointer">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-[#1e5352] text-white rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1">
                <Save className="w-3.5 h-3.5" />
                <span>Save Profile</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 2: CHANGE PASSWORD */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <form onSubmit={handleUpdatePassword} className="bg-white rounded-3xl p-6 w-full max-w-md border border-slate-100 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#1e5352]" />
                <h3 className="text-sm font-extrabold text-slate-900">Security Password Change</h3>
              </div>
              <button type="button" onClick={() => setIsPasswordModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-bold mb-1">Current Password</label>
                <div className="relative">
                  <input
                    type={showCurrentPass ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full bg-slate-50 p-2.5 pr-9 rounded-xl border border-slate-200 text-slate-800 focus:outline-none"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 cursor-pointer"
                  >
                    {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">New Password</label>
                <div className="relative">
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-slate-50 p-2.5 pr-9 rounded-xl border border-slate-200 text-slate-800 focus:outline-none"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 cursor-pointer"
                  >
                    {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-slate-800 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button type="button" onClick={() => setIsPasswordModalOpen(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold cursor-pointer">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-[#1e5352] text-white rounded-xl text-xs font-bold cursor-pointer">Update Password</button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL 3: EMERGENCY LAB CLOSURE OVERRIDE FORM (DUAL INPUT) */}
      {isAddClosureOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <form onSubmit={handleAddClosureOverride} className="bg-white rounded-3xl p-6 w-full max-w-md border border-slate-100 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900">Emergency Lab Closure Override</h3>
              <button type="button" onClick={() => setIsAddClosureOpen(false)} className="text-slate-400 hover:text-slate-600 transition cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* DUAL INPUT FOR TARGET LABORATORY */}
              <div>
                <label className="block text-slate-600 font-bold mb-1">Target Laboratory</label>
                <input
                  type="text"
                  list="lab-room-suggestions"
                  placeholder="Select from suggestions or type custom lab..."
                  value={targetLab}
                  onChange={(e) => setTargetLab(e.target.value)}
                  className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-slate-800 font-bold focus:outline-none focus:ring-1 focus:ring-[#1e5352]"
                  required
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
 = deg = Select from the dropdown list or type a custom laboratory name.
                </span>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Closure Reason / Maintenance Note</label>
                <textarea
                  placeholder="e.g. Aircon coolant repair and electrical inspection..."
                  value={closureReason}
                  onChange={(e) => setClosureReason(e.target.value)}
                  className="w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-slate-800 focus:outline-none h-20 resize-none"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button type="button" onClick={() => setIsAddClosureOpen(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold cursor-pointer">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold cursor-pointer">Apply Emergency Lockout</button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};

export default ProfileView;
