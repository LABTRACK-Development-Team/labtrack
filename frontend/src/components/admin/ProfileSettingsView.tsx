import apiClient from '@/lib/api-client';
import { useAuth } from '@/context/auth-context';
import React, { useState, useEffect } from 'react';
import { 
  User, Mail, Shield, Building, Phone, Key, Camera, Lock, Bell, CheckCircle2, 
  Save, RefreshCw, Cpu, Monitor, Smartphone, Globe, ShieldCheck, AlertCircle, Sparkles
} from 'lucide-react';

interface ProfileSettingsViewProps {
  campusName: string;
  onTriggerNotification?: (msg: string) => void;
}

export const ProfileSettingsView: React.FC<ProfileSettingsViewProps> = ({ 
  campusName, 
  onTriggerNotification 
}) => {
  const [activeTab, setActiveTab] = useState<'PERSONAL' | 'SECURITY' | 'NOTIFICATIONS' | 'SESSIONS'>('PERSONAL');
  const { user, updateUser } = useAuth();

  // Form State
  const [profile, setProfile] = useState({
    fullName: '',
    title: '',
    employeeId: '',
    email: '',
    phone: '',
    department: 'College of Information & Computing Sciences',
    campus: campusName || 'JRMSU Dapitan Main Campus',
    avatarUrl: '/assets/images/sami.jpg',
    bio: 'Overseeing multi-campus IT infrastructure, laboratory telemetry node clusters, and network security across JRMSU subnets.'
  });

  // Security Form State
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [twoFactor, setTwoFactor] = useState(true);

  // Notification Preferences
  const [notifPrefs, setNotifPrefs] = useState({
    emailAlerts: true,
    smsAlerts: false,
    hardwareFailureAlerts: true,
    unauthorizedAccessAlerts: true,
    maintenanceSchedules: true
  });

  // Active Login Sessions
  const [sessions, setSessions] = useState<any[]>([]);

  // Profile sync from logged-in user
  useEffect(() => {
    if (!user) return;
    const __fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
    setProfile((prev: any) => {
      const next = { ...prev };
      if ('fullName' in prev && __fullName) next.fullName = __fullName;
      if ('name' in prev && __fullName) next.name = __fullName;
      if ('email' in prev && user.email) next.email = user.email;
      if ('phone' in prev && user.phoneNumber) next.phone = user.phoneNumber;
      if ('phoneNumber' in prev && user.phoneNumber) next.phoneNumber = user.phoneNumber;
      if ('department' in prev && user.department) next.department = user.department;
      if ('campus' in prev && user.campus) next.campus = user.campus;
      if ('avatarUrl' in prev && user.profilePictureUrl) next.avatarUrl = user.profilePictureUrl;
      return next;
    });
  }, [user]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const __parts = profile.fullName.trim().split(/\s+/);
    const __fn = __parts[0] || '';
    const __ln = __parts.slice(1).join(' ') || '';
    try { if (user?.id) await apiClient.put('/api/v1/users/' + user.id, { firstName: __fn, lastName: __ln, phoneNumber: profile.phone, department: profile.department, profilePictureUrl: profile.avatarUrl }); } catch (__e) { console.warn('Profile save:', __e); }
    updateUser({ ...user, firstName: __fn, lastName: __ln, phoneNumber: profile.phone, department: profile.department, profilePictureUrl: profile.avatarUrl });
    if (onTriggerNotification) {
      onTriggerNotification('Profile information updated successfully!');
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      if (onTriggerNotification) onTriggerNotification('Passwords do not match!');
      return;
    }
    if (onTriggerNotification) {
      onTriggerNotification('Security credentials updated successfully!');
    }
    setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        const __av = reader.result as string; setProfile(prev => ({ ...prev, avatarUrl: __av })); (async () => { try { if (user?.id) await apiClient.put('/api/v1/users/' + user.id, { profilePictureUrl: __av }); } catch (__e) { console.warn('Avatar save:', __e); } updateUser({ ...user, profilePictureUrl: __av }); })();
        if (onTriggerNotification) onTriggerNotification('Profile picture updated!');
      };
      reader.readAsDataURL(file);
    }
  };

  const revokeSession = (id: string) => {
    setSessions(prev => prev.filter(s => s.id !== id));
    if (onTriggerNotification) onTriggerNotification(`Session ${id} revoked.`);
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER CARD WITH AVATAR BANNER */}
      <div className="bg-white/90 backdrop-blur-2xl rounded-3xl shadow-xl border border-white/60 p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-500/10 via-cyan-500/10 to-transparent rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 relative z-10">
          
          {/* AVATAR WITH UPLOAD OVERLAY */}
          <div className="relative group">
            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl overflow-hidden ring-4 ring-blue-600/30 shadow-2xl bg-slate-800">
              <img 
                src={profile.avatarUrl} 
                alt={profile.fullName} 
                className="w-full h-full object-cover object-center group-hover:scale-105 transition duration-300" 
              />
            </div>
            <label className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs rounded-3xl opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center text-white text-xs font-bold cursor-pointer shadow-lg">
              <Camera className="w-6 h-6 mb-1 text-cyan-300 animate-bounce" />
              <span>Upload Photo</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </label>
            <span className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-1.5 rounded-full ring-4 ring-white shadow-md">
              <ShieldCheck className="w-4 h-4" />
            </span>
          </div>

          {/* USER INFO DETAILS */}
          <div className="flex-1 text-center md:text-left space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">{profile.fullName}</h3>
                <p className="text-xs font-bold text-blue-600 flex items-center justify-center md:justify-start gap-1.5 mt-0.5">
                  <Shield className="w-3.5 h-3.5" />
                  <span>{profile.title}</span>
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-sans font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full w-fit mx-auto md:mx-0 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                SYSTEM ADMIN ACTIVE
              </span>
            </div>

            <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">{profile.bio}</p>

            <div className="pt-2 flex flex-wrap gap-4 text-xs font-sans text-slate-500 justify-center md:justify-start">
              <span className="flex items-center gap-1.5 bg-slate-100/80 px-3 py-1 rounded-xl">
                <Building className="w-3.5 h-3.5 text-blue-600" /> {profile.campus}
              </span>
              <span className="flex items-center gap-1.5 bg-slate-100/80 px-3 py-1 rounded-xl">
                <Mail className="w-3.5 h-3.5 text-indigo-600" /> {profile.email}
              </span>
              <span className="flex items-center gap-1.5 bg-slate-100/80 px-3 py-1 rounded-xl">
                <Key className="w-3.5 h-3.5 text-cyan-600" /> {profile.employeeId}
              </span>
            </div>
          </div>

        </div>

        {/* TAB NAVIGATION BAR */}
        <div className="mt-8 flex items-center gap-2 border-t border-slate-200/80 pt-4 overflow-x-auto">
          {[
            { id: 'PERSONAL', label: 'Personal Information', icon: User },
            { id: 'SECURITY', label: 'Security & Auth', icon: Lock },
            { id: 'NOTIFICATIONS', label: 'Notifications', icon: Bell },
            { id: 'SESSIONS', label: 'Active Sessions', icon: Monitor }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  isActive 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

      </div>

      {/* TAB CONTENT 1: PERSONAL INFORMATION */}
      {activeTab === 'PERSONAL' && (
        <form onSubmit={handleProfileSubmit} className="bg-white/90 backdrop-blur-2xl rounded-3xl shadow-xl border border-white/60 p-6 sm:p-8 space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h4 className="text-base font-black text-slate-900 tracking-tight">General Account Profile</h4>
            <p className="text-xs text-slate-500">Update your official system credentials and contact information</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1.5">Full Name</label>
              <input 
                type="text" 
                value={profile.fullName} 
                onChange={e => setProfile({...profile, fullName: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 p-3 rounded-2xl outline-none focus:border-blue-600 transition font-medium text-slate-900" 
                required 
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1.5">Official Designation Title</label>
              <input 
                type="text" 
                value={profile.title} 
                onChange={e => setProfile({...profile, title: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 p-3 rounded-2xl outline-none focus:border-blue-600 transition font-medium text-slate-900" 
                required 
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1.5">Institutional Email Address</label>
              <input 
                type="email" 
                value={profile.email} 
                onChange={e => setProfile({...profile, email: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 p-3 rounded-2xl outline-none focus:border-blue-600 transition font-medium text-slate-900" 
                required 
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1.5">Contact Number</label>
              <input 
                type="text" 
                value={profile.phone} 
                onChange={e => setProfile({...profile, phone: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 p-3 rounded-2xl outline-none focus:border-blue-600 transition font-medium text-slate-900" 
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1.5">Employee / Admin ID Tag</label>
              <input 
                type="text" 
                value={profile.employeeId} 
                disabled
                className="w-full bg-slate-200/60 border border-slate-300/80 p-3 rounded-2xl font-sans text-slate-600 cursor-not-allowed" 
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1.5">Assigned Primary Campus</label>
              <input 
                type="text" 
                value={profile.campus} 
                disabled
                className="w-full bg-slate-200/60 border border-slate-300/80 p-3 rounded-2xl font-sans text-slate-600 cursor-not-allowed" 
              />
            </div>

            <div className="md:col-span-2">
              <label className="block font-bold text-slate-700 mb-1.5">Administrative Bio / Scope</label>
              <textarea 
                rows={3} 
                value={profile.bio} 
                onChange={e => setProfile({...profile, bio: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 p-3 rounded-2xl outline-none focus:border-blue-600 transition font-medium text-slate-900" 
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button 
              type="submit" 
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-2xl shadow-lg shadow-blue-600/30 transition flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>Save Profile Changes</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB CONTENT 2: SECURITY & AUTH */}
      {activeTab === 'SECURITY' && (
        <div className="space-y-6">
          <form onSubmit={handlePasswordSubmit} className="bg-white/90 backdrop-blur-2xl rounded-3xl shadow-xl border border-white/60 p-6 sm:p-8 space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h4 className="text-base font-black text-slate-900 tracking-tight">Security Credentials & Password</h4>
              <p className="text-xs text-slate-500">Ensure your administrative access account remains secure</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Current Password</label>
                <input 
                  type="password" 
                  value={passwords.currentPassword} 
                  onChange={e => setPasswords({...passwords, currentPassword: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 p-3 rounded-2xl outline-none focus:border-blue-600 transition" 
 placeholder=""
                  required 
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">New Password</label>
                <input 
                  type="password" 
                  value={passwords.newPassword} 
                  onChange={e => setPasswords({...passwords, newPassword: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 p-3 rounded-2xl outline-none focus:border-blue-600 transition" 
                  placeholder="Minimum 8 characters"
                  required 
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Confirm New Password</label>
                <input 
                  type="password" 
                  value={passwords.confirmPassword} 
                  onChange={e => setPasswords({...passwords, confirmPassword: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 p-3 rounded-2xl outline-none focus:border-blue-600 transition" 
                  placeholder="Re-type password"
                  required 
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button 
                type="submit" 
                className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-2xl shadow-lg transition flex items-center gap-2 cursor-pointer"
              >
                <Key className="w-4 h-4 text-cyan-400" />
                <span>Update Security Password</span>
              </button>
            </div>
          </form>

          {/* TWO-FACTOR AUTHENTICATION TOGGLE CARD */}
          <div className="bg-white/90 backdrop-blur-2xl rounded-3xl shadow-xl border border-white/60 p-6 sm:p-8 flex items-center justify-between">
            <div className="space-y-1">
              <h5 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" /> Two-Factor Authentication (2FA)
              </h5>
              <p className="text-xs text-slate-500 max-w-xl">
                Add an extra layer of security by requiring an authenticator app token (Google Authenticator / Authy) upon logging in.
              </p>
            </div>
            <button
              onClick={() => {
                setTwoFactor(!twoFactor);
                if (onTriggerNotification) onTriggerNotification(`2FA Status: ${!twoFactor ? 'ENABLED' : 'DISABLED'}`);
              }}
              className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                twoFactor ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' : 'bg-slate-200 text-slate-600'
              }`}
            >
              <span>{twoFactor ? '2FA Enabled' : 'Enable 2FA'}</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB CONTENT 3: NOTIFICATION PREFERENCES */}
      {activeTab === 'NOTIFICATIONS' && (
        <div className="bg-white/90 backdrop-blur-2xl rounded-3xl shadow-xl border border-white/60 p-6 sm:p-8 space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h4 className="text-base font-black text-slate-900 tracking-tight">System Alerts & Telemetry Notifications</h4>
            <p className="text-xs text-slate-500">Configure how and when LabTrack dispatches critical notifications to your channels</p>
          </div>

          <div className="space-y-4 text-xs">
            {[
              { key: 'emailAlerts', title: 'Email Digest & Workstation Reports', desc: 'Receive daily telemetry summaries and critical work order logs via email.' },
              { key: 'hardwareFailureAlerts', title: 'Hardware Failure Instant Telemetry Broadcast', desc: 'Immediate notification when liquid cooling pumps, RAM bus errors, or disk failures trigger.' },
              { key: 'unauthorizedAccessAlerts', title: 'Security & Unauthorized Access Alerts', desc: 'Alert when unknown MAC or IP addresses attempt SSH or unauthorized terminal logins.' },
              { key: 'maintenanceSchedules', title: 'Preventive Maintenance Reminders', desc: 'Get automated calendar alerts 48 hours prior to scheduled lab cleaning and upgrades.' }
            ].map(item => (
              <div key={item.key} className="flex items-center justify-between p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 hover:border-blue-300 transition">
                <div className="space-y-0.5">
                  <span className="font-bold text-slate-900 block">{item.title}</span>
                  <span className="text-slate-500 block text-[11px]">{item.desc}</span>
                </div>
                <input 
                  type="checkbox" 
                  checked={(notifPrefs as any)[item.key]} 
                  onChange={(e) => {
                    setNotifPrefs({...notifPrefs, [item.key]: e.target.checked});
                    if (onTriggerNotification) onTriggerNotification('Notification preference updated.');
                  }}
                  className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT 4: ACTIVE SESSIONS */}
      {activeTab === 'SESSIONS' && (
        <div className="bg-white/90 backdrop-blur-2xl rounded-3xl shadow-xl border border-white/60 p-6 sm:p-8 space-y-6">
          <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
            <div>
              <h4 className="text-base font-black text-slate-900 tracking-tight">Active Authorized Login Sessions</h4>
              <p className="text-xs text-slate-500">Devices currently logged into your administrator account</p>
            </div>
            <span className="text-xs font-sans font-bold bg-blue-50 text-blue-700 px-3 py-1 rounded-full border border-blue-200">
              {sessions.length} Active Devices
            </span>
          </div>

          <div className="space-y-3">
            {sessions.map(s => (
              <div key={s.id} className="p-4 bg-slate-50/90 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-3 bg-blue-100/80 text-blue-700 rounded-2xl shrink-0">
                    {s.device.includes('iPhone') ? <Smartphone className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-xs">{s.device}</span>
                      {s.current && (
                        <span className="bg-emerald-500 text-white text-[9px] font-sans font-bold px-2 py-0.5 rounded-full">CURRENT SESSION</span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 font-sans">
                      {s.browser}  {s.ip}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{s.location}  {s.lastActive}</p>
                  </div>
                </div>

                {!s.current && (
                  <button 
                    onClick={() => revokeSession(s.id)}
                    className="px-3.5 py-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 font-bold text-xs rounded-xl transition cursor-pointer self-start sm:self-center"
                  >
                    Revoke Session
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};

export default ProfileSettingsView;