import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Users,
  Flag,
  FileText,
  Activity,
  LogOut,
  UserX,
  UserCheck,
  RotateCcw,
  CheckCircle,
  XCircle,
  Search,
  Zap,
  Radio,
  Trash2,
  Cpu,
  Server,
  Send,
  MessageSquare,
} from 'lucide-react';
import { adminService } from '../services/adminService';

export const AdminDashboard = () => {
  const [admin, setAdmin] = useState(() => {
    const saved = localStorage.getItem('securechat_admin_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'powers' | 'users' | 'reports' | 'audit'

  // Admin login credentials configured for Shubham Mishra
  const [email, setEmail] = useState('shubhammishra23082004@gmail.com');
  const [password, setPassword] = useState('Shubham@080605');
  const [twoFactorCode, setTwoFactorCode] = useState('999888');
  const [loginError, setLoginError] = useState('');
  const [loading, setLoading] = useState(false);

  // Dashboard Data states
  const [metrics, setMetrics] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [reportsList, setReportsList] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [searchUser, setSearchUser] = useState('');

  // Special Powers Data states
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastSuccess, setBroadcastSuccess] = useState('');
  const [groupsList, setGroupsList] = useState([]);
  const [systemHealth, setSystemHealth] = useState(null);

  // Handle Admin Login
  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoading(true);
    try {
      const res = await adminService.login({ email, password, twoFactorCode });
      if (res.success && res.admin) {
        setAdmin(res.admin);
      }
    } catch (err) {
      setLoginError(err.response?.data?.message || 'Invalid admin credentials or 2FA token.');
    } finally {
      setLoading(false);
    }
  };

  // Load Dashboard Data
  useEffect(() => {
    if (!admin) return;

    const loadData = async () => {
      try {
        if (activeTab === 'overview') {
          const res = await adminService.getOverview();
          if (res.success) setMetrics(res.metrics);
        } else if (activeTab === 'powers') {
          const healthRes = await adminService.getSystemHealth();
          if (healthRes.success) setSystemHealth(healthRes.telemetry);
          const groupsRes = await adminService.getConversations();
          if (groupsRes.success) setGroupsList(groupsRes.conversations || []);
        } else if (activeTab === 'users') {
          const res = await adminService.getUsers(searchUser);
          if (res.success) setUsersList(res.users || []);
        } else if (activeTab === 'reports') {
          const res = await adminService.getReports();
          if (res.success) setReportsList(res.reports || []);
        } else if (activeTab === 'audit') {
          const res = await adminService.getAuditLogs();
          if (res.success) setAuditLogs(res.logs || []);
        }
      } catch (err) {
        console.error('Error loading admin tab data', err);
      }
    };

    loadData();
  }, [admin, activeTab, searchUser]);

  // Special Power: Send Global Broadcast
  const handleSendBroadcast = async (e) => {
    e.preventDefault();
    if (!broadcastTitle || !broadcastMessage) return;

    try {
      const res = await adminService.sendBroadcast(broadcastTitle, broadcastMessage);
      if (res.success) {
        setBroadcastSuccess(res.message);
        setBroadcastTitle('');
        setBroadcastMessage('');
        setTimeout(() => setBroadcastSuccess(''), 4000);
      }
    } catch (e) {
      alert('Failed to send broadcast.');
    }
  };

  // Special Power: Delete Conversation
  const handleDeleteGroup = async (convId, name) => {
    if (!confirm(`Are you sure you want to delete "${name}" permanently?`)) return;
    try {
      await adminService.deleteConversation(convId);
      setGroupsList((prev) => prev.filter((c) => c._id !== convId));
    } catch (e) {
      alert('Failed to delete group.');
    }
  };

  // Special Power: Force Delete User Account
  const handleDeleteUser = async (userId, username) => {
    if (!confirm(`DANGER: Are you sure you want to permanently delete user @${username}? This cannot be undone.`)) return;
    try {
      await adminService.deleteUserAccount(userId);
      setUsersList((prev) => prev.filter((u) => u._id !== userId));
      alert(`User @${username} deleted.`);
    } catch (e) {
      alert('Failed to delete user.');
    }
  };

  // Suspend / Unsuspend user
  const handleToggleSuspend = async (userObj) => {
    const reason = prompt(`Reason for ${userObj.isSuspended ? 'unsuspending' : 'suspending'} ${userObj.username}:`);
    if (reason === null) return;

    try {
      await adminService.toggleSuspendUser(userObj._id, !userObj.isSuspended, reason);
      const res = await adminService.getUsers(searchUser);
      if (res.success) setUsersList(res.users);
    } catch (e) {
      alert('Operation failed.');
    }
  };

  // Reset user security
  const handleResetSecurity = async (userId) => {
    if (!confirm('Are you sure you want to revoke all active sessions and reset 2FA for this user?')) return;
    try {
      await adminService.resetUserSecurity(userId);
      alert('User security reset successfully.');
    } catch (e) {
      alert('Operation failed.');
    }
  };

  // Resolve report
  const handleResolveReport = async (reportId, status, actionTaken) => {
    const notes = prompt('Resolution notes:');
    try {
      await adminService.resolveReport(reportId, { status, actionTaken, resolutionNotes: notes || '' });
      const res = await adminService.getReports();
      if (res.success) setReportsList(res.reports);
    } catch (e) {
      alert('Failed to update report.');
    }
  };

  // Render Login if not authenticated as Admin
  if (!admin) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center p-4 bg-slate-950">
        <div className="w-full max-w-md bg-slate-900 border border-red-500/20 rounded-3xl p-8 shadow-2xl animate-fade-in">
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-center justify-center mx-auto mb-3 shadow-lg">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-black text-white">Super Admin Portal</h2>
            <p className="text-xs text-slate-400 mt-1">Authorized Access for Shubham Mishra</p>
          </div>

          {loginError && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold">
              {loginError}
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-3.5">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Super Admin Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-800 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-red-500 font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-800 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-indigo-300 block mb-1">
                2FA Security Master Code (Demo: 999888)
              </label>
              <input
                type="text"
                required
                value={twoFactorCode}
                onChange={(e) => setTwoFactorCode(e.target.value)}
                className="w-full bg-slate-800 border border-indigo-500/40 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold text-xs shadow-lg transition-all mt-2"
            >
              {loading ? 'Verifying Super Admin...' : 'Authorize Super Admin Access'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <a href="/" className="text-xs text-slate-400 hover:text-white underline">
              Return to Chat Application
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navbar */}
      <header className="h-16 border-b border-white/10 px-6 flex items-center justify-between bg-slate-900/60 backdrop-blur-md">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-red-500/20 text-red-400 rounded-xl border border-red-500/30 shadow">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-black text-white">Super Admin Command Center</h2>
            <p className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
              <Zap className="w-3 h-3" /> Special Super Admin Powers Active ({admin.email})
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              adminService.logout();
              setAdmin(null);
            }}
            className="px-3 py-1.5 bg-slate-800 hover:bg-red-500/20 text-slate-300 hover:text-red-400 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
          >
            <LogOut className="w-3.5 h-3.5" /> Logout
          </button>
          <a
            href="/"
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow"
          >
            Open Chat
          </a>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Navigation Sidebar */}
        <nav className="w-full md:w-64 bg-slate-900/40 p-4 border-b md:border-b-0 md:border-r border-white/10 flex md:flex-col space-x-2 md:space-x-0 md:space-y-1.5 overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all ${
              activeTab === 'overview' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Activity className="w-4 h-4" /> Overview & Telemetry
          </button>

          <button
            onClick={() => setActiveTab('powers')}
            className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all ${
              activeTab === 'powers' ? 'bg-gradient-to-r from-red-600 to-amber-600 text-white shadow-lg' : 'text-amber-400 hover:bg-amber-500/10'
            }`}
          >
            <Zap className="w-4 h-4" /> Super Admin Powers ⚡
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all ${
              activeTab === 'users' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" /> User Management
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all ${
              activeTab === 'reports' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Flag className="w-4 h-4" /> Abuse Reports Queue
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all ${
              activeTab === 'audit' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" /> Security Audit Logs
          </button>
        </nav>

        {/* Tab Viewport */}
        <main className="flex-1 p-6 overflow-y-auto">
          {/* 1. Overview */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-fade-in">
              <h3 className="text-lg font-black text-white">Platform Health & Telemetry</h3>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl bg-slate-900 border border-white/10 shadow-sm">
                  <span className="text-xs font-semibold text-slate-400">Total Users</span>
                  <h4 className="text-2xl font-black text-white mt-1">{metrics?.totalUsers || 0}</h4>
                </div>
                <div className="p-5 rounded-2xl bg-slate-900 border border-white/10 shadow-sm">
                  <span className="text-xs font-semibold text-slate-400">Online Users</span>
                  <h4 className="text-2xl font-black text-emerald-400 mt-1">{metrics?.onlineUsers || 0}</h4>
                </div>
                <div className="p-5 rounded-2xl bg-slate-900 border border-white/10 shadow-sm">
                  <span className="text-xs font-semibold text-slate-400">Total Messages</span>
                  <h4 className="text-2xl font-black text-indigo-400 mt-1">{metrics?.totalMessages || 0}</h4>
                </div>
                <div className="p-5 rounded-2xl bg-slate-900 border border-white/10 shadow-sm">
                  <span className="text-xs font-semibold text-slate-400">Pending Reports</span>
                  <h4 className="text-2xl font-black text-amber-400 mt-1">{metrics?.pendingReports || 0}</h4>
                </div>
              </div>
            </div>
          )}

          {/* 2. SPECIAL POWERS TAB ⚡ */}
          {activeTab === 'powers' && (
            <div className="space-y-6 animate-fade-in">
              {/* Special Power 1: Global System Broadcast */}
              <div className="p-6 rounded-3xl bg-slate-900 border border-indigo-500/30 shadow-2xl">
                <h3 className="font-bold text-base text-white flex items-center gap-2 mb-2">
                  <Radio className="w-5 h-5 text-indigo-400" /> Global System-Wide Announcement Broadcast
                </h3>
                <p className="text-xs text-slate-400 mb-4">
                  Send high-priority real-time announcements to all channels, groups, and active users simultaneously.
                </p>

                {broadcastSuccess && (
                  <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold rounded-xl flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" /> {broadcastSuccess}
                  </div>
                )}

                <form onSubmit={handleSendBroadcast} className="space-y-3">
                  <input
                    type="text"
                    placeholder="Broadcast Title (e.g., Scheduled Maintenance / Security Advisory)"
                    value={broadcastTitle}
                    onChange={(e) => setBroadcastTitle(e.target.value)}
                    required
                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                  <textarea
                    placeholder="Enter announcement message text..."
                    value={broadcastMessage}
                    onChange={(e) => setBroadcastMessage(e.target.value)}
                    required
                    rows={3}
                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
                  />
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white rounded-xl text-xs font-bold shadow flex items-center gap-2"
                  >
                    <Send className="w-3.5 h-3.5" /> Dispatch Global Broadcast
                  </button>
                </form>
              </div>

              {/* Special Power 2: Live Server & Memory Monitor */}
              <div className="p-6 rounded-3xl bg-slate-900 border border-white/10 shadow-xl">
                <h3 className="font-bold text-base text-white flex items-center gap-2 mb-4">
                  <Server className="w-5 h-5 text-emerald-400" /> Live Server & Memory Telemetry
                </h3>
                {systemHealth ? (
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 bg-slate-800/80 rounded-2xl border border-white/5">
                      <span className="text-[11px] text-slate-400 block">Node.js Heap Used</span>
                      <span className="text-xl font-bold text-white mt-1 block">{systemHealth.heapUsedMB} MB</span>
                    </div>
                    <div className="p-4 bg-slate-800/80 rounded-2xl border border-white/5">
                      <span className="text-[11px] text-slate-400 block">System Free RAM</span>
                      <span className="text-xl font-bold text-emerald-400 mt-1 block">{systemHealth.systemFreeMemMB} MB</span>
                    </div>
                    <div className="p-4 bg-slate-800/80 rounded-2xl border border-white/5">
                      <span className="text-[11px] text-slate-400 block">CPU Cores</span>
                      <span className="text-xl font-bold text-indigo-400 mt-1 block">{systemHealth.cpuCores} Cores</span>
                    </div>
                    <div className="p-4 bg-slate-800/80 rounded-2xl border border-white/5">
                      <span className="text-[11px] text-slate-400 block">Server Uptime</span>
                      <span className="text-xl font-bold text-cyan-400 mt-1 block">{systemHealth.uptimeSeconds}s</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">Loading telemetry...</p>
                )}
              </div>

              {/* Special Power 3: Master Groups & Channels Inspector */}
              <div className="p-6 rounded-3xl bg-slate-900 border border-white/10 shadow-xl">
                <h3 className="font-bold text-base text-white flex items-center gap-2 mb-4">
                  <Users className="w-5 h-5 text-cyan-400" /> All Groups & Channels ({groupsList.length})
                </h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {groupsList.map((g) => (
                    <div key={g._id} className="p-3 bg-slate-800/60 rounded-xl flex items-center justify-between border border-white/5">
                      <div>
                        <span className="font-bold text-xs text-white block">
                          {g.groupInfo?.name || g.channelInfo?.name || 'Group'} ({g.type?.toUpperCase()})
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {g.participants?.length || 0} Members | Created by {g.groupInfo?.createdBy?.name || 'User'}
                        </span>
                      </div>
                      <button
                        onClick={() => handleDeleteGroup(g._id, g.groupInfo?.name || 'Group')}
                        className="px-3 py-1.5 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Force Delete
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 3. User Management */}
          {activeTab === 'users' && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-black text-white">User Accounts</h3>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search accounts..."
                    value={searchUser}
                    onChange={(e) => setSearchUser(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 overflow-hidden bg-slate-900/60 shadow">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 text-slate-400 border-b border-white/10">
                    <tr>
                      <th className="p-3.5 font-bold">User</th>
                      <th className="p-3.5 font-bold">Headline</th>
                      <th className="p-3.5 font-bold">Status</th>
                      <th className="p-3.5 font-bold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {usersList.map((u) => (
                      <tr key={u._id} className="hover:bg-white/5 transition-colors">
                        <td className="p-3.5">
                          <span className="font-bold text-white block">{u.name}</span>
                          <span className="text-[11px] text-slate-400">@{u.username} ({u.email})</span>
                        </td>
                        <td className="p-3.5 text-slate-300 text-[11px] truncate max-w-xs">
                          {u.headline || '—'}
                        </td>
                        <td className="p-3.5">
                          {u.isSuspended ? (
                            <span className="px-2 py-0.5 bg-red-500/20 text-red-400 border border-red-500/30 rounded-full font-bold text-[10px]">
                              Suspended
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full font-bold text-[10px]">
                              Active
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 flex items-center gap-1.5">
                          <button
                            onClick={() => handleToggleSuspend(u)}
                            className={`px-2.5 py-1 rounded-lg font-bold text-[11px] flex items-center gap-1 ${
                              u.isSuspended ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-red-600 hover:bg-red-500 text-white'
                            }`}
                          >
                            {u.isSuspended ? <UserCheck className="w-3 h-3" /> : <UserX className="w-3 h-3" />}
                            {u.isSuspended ? 'Unsuspend' : 'Suspend'}
                          </button>
                          <button
                            onClick={() => handleResetSecurity(u._id)}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-semibold text-[11px] flex items-center gap-1"
                          >
                            <RotateCcw className="w-3 h-3" /> Reset
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u._id, u.username)}
                            className="px-2 py-1 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white rounded-lg text-[11px] font-bold"
                            title="Force Delete Account"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 4. Reports Queue */}
          {activeTab === 'reports' && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="text-lg font-black text-white">Abuse & Spam Moderation Queue</h3>
              {reportsList.length > 0 ? (
                <div className="space-y-3">
                  {reportsList.map((r) => (
                    <div key={r._id} className="p-4 rounded-2xl bg-slate-900 border border-white/10 shadow-sm flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold rounded-full uppercase">
                            {r.reason}
                          </span>
                          <span className="text-xs text-slate-400">
                            Reported by: <strong className="text-white">{r.reporter?.name}</strong>
                          </span>
                        </div>
                        <p className="text-xs text-slate-300">
                          Target User: <strong>{r.reportedUser?.name}</strong> (@{r.reportedUser?.username})
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleResolveReport(r._id, 'resolved', 'warning_sent')}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow"
                        >
                          <CheckCircle className="w-3.5 h-3.5" /> Resolve
                        </button>
                        <button
                          onClick={() => handleResolveReport(r._id, 'dismissed', 'dismissed')}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Dismiss
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center text-xs text-slate-400 bg-slate-900 rounded-2xl border border-white/10">
                  <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
                  <p className="font-bold text-white">Report Queue is Clean</p>
                  <p className="text-[11px] text-slate-400 mt-1">No pending reports to investigate.</p>
                </div>
              )}
            </div>
          )}

          {/* 5. Security Audit Logs */}
          {activeTab === 'audit' && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="text-lg font-black text-white">Tamper-Evident Security Audit Logs</h3>
              <div className="rounded-2xl border border-white/10 overflow-hidden bg-slate-900 shadow">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 border-b border-white/10">
                    <tr>
                      <th className="p-3 font-bold">Timestamp</th>
                      <th className="p-3 font-bold">Admin</th>
                      <th className="p-3 font-bold">Action</th>
                      <th className="p-3 font-bold">Target</th>
                      <th className="p-3 font-bold">Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {auditLogs.map((log) => (
                      <tr key={log._id} className="hover:bg-white/5">
                        <td className="p-3 text-slate-400 font-mono text-[11px]">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td className="p-3 text-slate-200">{log.adminEmail}</td>
                        <td className="p-3">
                          <span className="font-mono text-indigo-400 font-bold">{log.action}</span>
                        </td>
                        <td className="p-3 text-slate-300 font-mono text-[11px]">{log.targetType}</td>
                        <td className="p-3 text-slate-300">{log.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
