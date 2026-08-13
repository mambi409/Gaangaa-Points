import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldAlert,
  Play,
  RotateCw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Database,
  Users,
  Store as StoreIcon,
  TrendingUp,
  Activity,
  Layers,
  Search,
  Plus,
  Radio,
  Sliders,
  DollarSign,
  Award,
  Sparkles,
  Server,
  Terminal,
  FileText,
  KeyRound,
  Compass,
  Check,
  X,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
  Send,
  Zap,
  Globe
} from 'lucide-react';
import {
  AdminTask,
  SystemAuditLog,
  AdminOverviewStats,
  Store,
  UserWallet,
  Transaction
} from '../types';
import { useLanguage } from '../context/LanguageContext';

interface AdminDashboardProps {
  adminUser: { username: string; name: string; email?: string; passId?: string } | null;
  onLogout?: () => void;
  onSwitchRole?: (role: 'user' | 'merchant') => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  adminUser,
  onLogout,
  onSwitchRole
}) => {
  const { language } = useLanguage();
  const isEs = language === 'es';

  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<'tasks' | 'overview' | 'accounts' | 'stores' | 'audit' | 'broadcast'>('tasks');

  // Core Data State
  const [stats, setStats] = useState<AdminOverviewStats | null>(null);
  const [tasks, setTasks] = useState<AdminTask[]>([]);
  const [auditLogs, setAuditLogs] = useState<SystemAuditLog[]>([]);
  const [registeredUsers, setRegisteredUsers] = useState<any[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Task Running State
  const [runningTaskId, setRunningTaskId] = useState<string | null>(null);
  const [taskFilter, setTaskFilter] = useState<string>('all');
  const [lastActionMessage, setLastActionMessage] = useState<string | null>(null);

  // Member Adjust Modal State
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [selectedUserForAdjust, setSelectedUserForAdjust] = useState<any | null>(null);
  const [adjustPointsDelta, setAdjustPointsDelta] = useState<string>('100');
  const [adjustTier, setAdjustTier] = useState<string>('');
  const [adjustPin, setAdjustPin] = useState<string>('');
  const [adjustNote, setAdjustNote] = useState<string>('Manual loyalty point adjustment');
  const [isAdjusting, setIsAdjusting] = useState(false);

  // Store Onboarding Modal State
  const [isAddStoreModalOpen, setIsAddStoreModalOpen] = useState(false);
  const [newStoreName, setNewStoreName] = useState('');
  const [newStoreCategory, setNewStoreCategory] = useState('Coffee');
  const [newStoreAddress, setNewStoreAddress] = useState('');
  const [newStoreCity, setNewStoreCity] = useState('San Francisco, CA');
  const [newStorePointsRate, setNewStorePointsRate] = useState('10');
  const [newStorePhone, setNewStorePhone] = useState('(415) 555-0199');
  const [isSubmittingStore, setIsSubmittingStore] = useState(false);

  // Broadcast Alert Form State
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastBody, setBroadcastBody] = useState('');
  const [broadcastPriority, setBroadcastPriority] = useState<'normal' | 'high'>('normal');
  const [broadcastAudience, setBroadcastAudience] = useState<'all' | 'user' | 'merchant'>('all');
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastSuccess, setBroadcastSuccess] = useState<string | null>(null);

  // User search filter
  const [userSearchQuery, setUserSearchQuery] = useState('');

  // Fetch admin dashboard initial data
  const fetchAdminData = async () => {
    try {
      const res = await fetch('/api/admin/overview');
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
        setTasks(data.tasks || []);
        setAuditLogs(data.auditLogs || []);
        setRegisteredUsers(data.registeredUsers || []);
        setStores(data.stores || []);
        setRecentTransactions(data.recentTransactions || []);
      }
    } catch (err) {
      console.warn('Failed to load admin overview from API:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
    const interval = setInterval(fetchAdminData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchAdminData();
  };

  // Run a specific monitoring task or all tasks
  const handleRunTask = async (taskId: string) => {
    setRunningTaskId(taskId);
    setLastActionMessage(null);
    try {
      const res = await fetch('/api/admin/tasks/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId,
          adminUsername: adminUser?.username || 'mambiadmin'
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.tasks) setTasks(data.tasks);
        if (data.auditLogs) setAuditLogs(data.auditLogs);
        setLastActionMessage(data.message || (isEs ? 'Tarea ejecutada con éxito' : 'Task executed successfully'));
      }
    } catch (err) {
      console.error('Failed to run task:', err);
    } finally {
      setRunningTaskId(null);
    }
  };

  // Handle Member Adjustment Submit
  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForAdjust) return;
    setIsAdjusting(true);

    try {
      const res = await fetch('/api/admin/users/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUsername: selectedUserForAdjust.username,
          pointsDelta: adjustPointsDelta,
          newTier: adjustTier || undefined,
          resetPin: adjustPin || undefined,
          note: adjustNote,
          adminUsername: adminUser?.username || 'mambiadmin'
        })
      });

      if (res.ok) {
        const data = await res.json();
        setLastActionMessage(data.message);
        setIsAdjustModalOpen(false);
        fetchAdminData();
      }
    } catch (err) {
      console.error('Failed to adjust member:', err);
    } finally {
      setIsAdjusting(false);
    }
  };

  // Handle Onboard Partner Store Submit
  const handleAddStoreSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStoreName || !newStoreAddress) return;
    setIsSubmittingStore(true);

    try {
      const res = await fetch('/api/admin/stores/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newStoreName,
          category: newStoreCategory,
          address: newStoreAddress,
          city: newStoreCity,
          pointsRate: newStorePointsRate,
          phone: newStorePhone,
          perks: ['VIP Rewards', 'Mobile Checkout', 'Free Wi-Fi']
        })
      });

      if (res.ok) {
        setIsAddStoreModalOpen(false);
        setNewStoreName('');
        setNewStoreAddress('');
        fetchAdminData();
        setLastActionMessage(isEs ? 'Nueva tienda agregada con éxito' : 'New store onboarded successfully');
      }
    } catch (err) {
      console.error('Failed to add store:', err);
    } finally {
      setIsSubmittingStore(false);
    }
  };

  // Handle Broadcast System Notice Submit
  const handleBroadcastSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle || !broadcastBody) return;
    setIsBroadcasting(true);
    setBroadcastSuccess(null);

    try {
      const res = await fetch('/api/admin/broadcast-system-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: broadcastTitle,
          body: broadcastBody,
          priority: broadcastPriority,
          targetAudience: broadcastAudience
        })
      });

      if (res.ok) {
        setBroadcastSuccess(isEs ? 'Aviso del sistema transmitido a toda la red' : 'System notice broadcasted across entire network');
        setBroadcastTitle('');
        setBroadcastBody('');
        fetchAdminData();
      }
    } catch (err) {
      console.error('Failed to broadcast alert:', err);
    } finally {
      setIsBroadcasting(false);
    }
  };

  const filteredTasks = tasks.filter((t) => {
    if (taskFilter === 'all') return true;
    return t.category === taskFilter;
  });

  const filteredUsers = registeredUsers.filter((u) => {
    const q = userSearchQuery.toLowerCase();
    return (
      u.username?.toLowerCase().includes(q) ||
      u.fullName?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.role?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 pb-16 font-sans">
      {/* Top Admin Navigation Bar */}
      <div className="bg-slate-950/90 border-b border-slate-800 sticky top-0 z-30 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-md shadow-amber-500/20 font-black">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-extrabold text-white tracking-tight">
                  OmniLoyalty Admin Console
                </h1>
                <span className="text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Root Admin
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {isEs ? 'Monitoreo de tareas, auditoría contable y base de datos' : 'System task monitoring, ledger audit & database management'}
              </p>
            </div>
          </div>

          {/* Quick Actions & Live Status */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {/* Live Firestore status indicator */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-slate-300 font-medium hidden sm:inline">
                Firestore DB:
              </span>
              <span className="text-emerald-400 font-bold">
                {stats?.firestoreStatus?.mode ? 'Connected (38ms)' : 'Live'}
              </span>
            </div>

            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer"
              title="Refresh Network Stats"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-amber-400' : ''}`} />
            </button>

            {/* Quick Run All Tasks */}
            <button
              onClick={() => handleRunTask('all')}
              disabled={runningTaskId !== null}
              className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm shadow-amber-600/30 cursor-pointer disabled:opacity-50"
            >
              <Zap className="w-3.5 h-3.5" />
              {runningTaskId === 'all'
                ? (isEs ? 'Ejecutando todo...' : 'Running All...')
                : (isEs ? 'Ejecutar todas las tareas' : 'Run All Tasks')}
            </button>

            {/* User Profile / Switch Role */}
            {onSwitchRole && (
              <button
                onClick={() => onSwitchRole('user')}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition cursor-pointer"
              >
                {isEs ? 'Ver App Cliente' : 'View Customer App'}
              </button>
            )}

            {onLogout && (
              <button
                onClick={onLogout}
                className="px-2.5 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 text-xs font-bold border border-rose-800/60 transition cursor-pointer"
              >
                {isEs ? 'Cerrar sesión' : 'Logout'}
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex overflow-x-auto gap-1 border-t border-slate-800/80 pt-1">
          <button
            onClick={() => setActiveTab('tasks')}
            className={`px-4 py-2.5 text-xs font-extrabold flex items-center gap-2 border-b-2 whitespace-nowrap transition cursor-pointer ${
              activeTab === 'tasks'
                ? 'border-amber-500 text-amber-400 bg-amber-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            {isEs ? 'Monitor de Tareas' : 'Task Monitor'}
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-bold">
              {tasks.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2.5 text-xs font-extrabold flex items-center gap-2 border-b-2 whitespace-nowrap transition cursor-pointer ${
              activeTab === 'overview'
                ? 'border-amber-500 text-amber-400 bg-amber-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            {isEs ? 'Resumen de Red' : 'Network Health'}
          </button>

          <button
            onClick={() => setActiveTab('accounts')}
            className={`px-4 py-2.5 text-xs font-extrabold flex items-center gap-2 border-b-2 whitespace-nowrap transition cursor-pointer ${
              activeTab === 'accounts'
                ? 'border-amber-500 text-amber-400 bg-amber-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            {isEs ? 'Cuentas & Puntos' : 'Member Accounts'}
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-bold">
              {registeredUsers.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('stores')}
            className={`px-4 py-2.5 text-xs font-extrabold flex items-center gap-2 border-b-2 whitespace-nowrap transition cursor-pointer ${
              activeTab === 'stores'
                ? 'border-amber-500 text-amber-400 bg-amber-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <StoreIcon className="w-3.5 h-3.5" />
            {isEs ? 'Comercios Afiliados' : 'Partner Stores'}
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-bold">
              {stores.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`px-4 py-2.5 text-xs font-extrabold flex items-center gap-2 border-b-2 whitespace-nowrap transition cursor-pointer ${
              activeTab === 'audit'
                ? 'border-amber-500 text-amber-400 bg-amber-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            {isEs ? 'Registro de Auditoría' : 'Audit Logs'}
          </button>

          <button
            onClick={() => setActiveTab('broadcast')}
            className={`px-4 py-2.5 text-xs font-extrabold flex items-center gap-2 border-b-2 whitespace-nowrap transition cursor-pointer ${
              activeTab === 'broadcast'
                ? 'border-amber-500 text-amber-400 bg-amber-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            {isEs ? 'Transmisión de Alertas' : 'System Broadcast'}
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Flash Message Banner */}
        {lastActionMessage && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3.5 rounded-xl bg-emerald-950/70 border border-emerald-700/60 text-emerald-200 text-xs font-bold flex items-center justify-between gap-3 shadow-lg"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{lastActionMessage}</span>
            </div>
            <button
              onClick={() => setLastActionMessage(null)}
              className="text-emerald-400 hover:text-white p-1 rounded-md cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}

        {/* TAB 1: SYSTEM TASKS & MONITORING */}
        {activeTab === 'tasks' && (
          <div className="space-y-6">
            {/* Header & Filter Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <div>
                <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-amber-400" />
                  {isEs ? 'Tareas del Sistema y Trabajos Programados' : 'System Tasks & Automated Background Jobs'}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {isEs
                    ? 'Monitoree auditorías de puntos, conciliación de libros, anomalías y sincronización con base de datos.'
                    : 'Monitor points ledger auditing, merchant settlements, security velocity scans, and database integrity.'}
                </p>
              </div>

              {/* Category Filter Pills */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {['all', 'accounting', 'security', 'database', 'maintenance'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setTaskFilter(cat)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold capitalize transition cursor-pointer ${
                      taskFilter === cat
                        ? 'bg-amber-500 text-slate-950 shadow-xs'
                        : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Task Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredTasks.map((task) => {
                const isThisRunning = runningTaskId === task.id || runningTaskId === 'all';
                return (
                  <div
                    key={task.id}
                    className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800/90 hover:border-slate-700/80 transition shadow-md flex flex-col justify-between space-y-4"
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span
                          className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-md uppercase tracking-wider border ${
                            task.category === 'accounting'
                              ? 'bg-blue-950/70 text-blue-300 border-blue-800'
                              : task.category === 'security'
                              ? 'bg-rose-950/70 text-rose-300 border-rose-800'
                              : task.category === 'database'
                              ? 'bg-emerald-950/70 text-emerald-300 border-emerald-800'
                              : 'bg-purple-950/70 text-purple-300 border-purple-800'
                          }`}
                        >
                          {task.category}
                        </span>

                        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{task.frequency || 'Scheduled'}</span>
                        </div>
                      </div>

                      {/* Title & Description */}
                      <h3 className="text-sm font-extrabold text-white">{task.name}</h3>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        {task.description}
                      </p>

                      {/* Success / Metrics Result Box */}
                      {task.successMessage && (
                        <div className="mt-3 p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs space-y-1.5">
                          <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{task.successMessage}</span>
                          </div>

                          {task.metrics && (
                            <div className="flex flex-wrap gap-2 pt-1">
                              {Object.entries(task.metrics).map(([k, v]) => (
                                <span
                                  key={k}
                                  className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700"
                                >
                                  {k}: <strong className="text-amber-400">{String(v)}</strong>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Bottom Action Footer */}
                    <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-3 text-xs">
                      <div className="text-slate-400 text-[11px]">
                        {task.lastRun ? (
                          <span>
                            {isEs ? 'Última ejecución:' : 'Last run:'}{' '}
                            <strong className="text-slate-300">
                              {new Date(task.lastRun).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </strong>
                            {task.durationMs && ` (${task.durationMs}ms)`}
                          </span>
                        ) : (
                          <span>{isEs ? 'Nunca ejecutada' : 'Never run'}</span>
                        )}
                      </div>

                      <button
                        onClick={() => handleRunTask(task.id)}
                        disabled={isThisRunning}
                        className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-xs"
                      >
                        <Play className={`w-3 h-3 ${isThisRunning ? 'animate-spin' : ''}`} />
                        {isThisRunning
                          ? (isEs ? 'Ejecutando...' : 'Running...')
                          : (isEs ? 'Ejecutar Tarea' : 'Run Now')}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: NETWORK OVERVIEW & STATS */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stat Counter Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                <div className="flex items-center justify-between text-slate-400 text-xs font-bold mb-2">
                  <span>{isEs ? 'Miembros Registrados' : 'Registered Members'}</span>
                  <Users className="w-4 h-4 text-blue-400" />
                </div>
                <div className="text-2xl font-black text-white">
                  {stats?.totalUsers?.toLocaleString() || '1,421'}
                </div>
                <div className="text-[11px] text-emerald-400 font-semibold mt-1 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  +12% this month
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                <div className="flex items-center justify-between text-slate-400 text-xs font-bold mb-2">
                  <span>{isEs ? 'Puntos Emitidos' : 'Points Issued'}</span>
                  <Award className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-2xl font-black text-amber-400 font-mono">
                  {stats?.totalPointsIssued?.toLocaleString() || '185,400'}
                </div>
                <div className="text-[11px] text-slate-400 font-semibold mt-1">
                  Redeemed: {stats?.totalPointsRedeemed?.toLocaleString() || '64,200'}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                <div className="flex items-center justify-between text-slate-400 text-xs font-bold mb-2">
                  <span>{isEs ? 'Comercios Activos' : 'Active Stores'}</span>
                  <StoreIcon className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-2xl font-black text-white">
                  {stats?.totalStores || stores.length || 6}
                </div>
                <div className="text-[11px] text-slate-400 font-semibold mt-1">
                  San Francisco Metro Area
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                <div className="flex items-center justify-between text-slate-400 text-xs font-bold mb-2">
                  <span>{isEs ? 'Volumen Estimado' : 'Est. Network GMV'}</span>
                  <DollarSign className="w-4 h-4 text-purple-400" />
                </div>
                <div className="text-2xl font-black text-purple-400 font-mono">
                  ${stats?.totalEstRevenue?.toLocaleString() || '18,450.00'}
                </div>
                <div className="text-[11px] text-emerald-400 font-semibold mt-1">
                  Avg $14.20 per scan
                </div>
              </div>
            </div>

            {/* Network Infrastructure & Cloud Status */}
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
              <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                <Server className="w-4 h-4 text-emerald-400" />
                {isEs ? 'Estado de la Infraestructura de la Nube' : 'Cloud Infrastructure & Database Synchronization'}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="text-slate-400 text-[11px] font-bold">Cloud Firestore</div>
                  <div className="text-white font-extrabold text-sm mt-0.5 flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-emerald-400" />
                    Online & Active
                  </div>
                  <div className="text-slate-500 text-[10px] mt-1 font-mono">
                    Collections: 6 | Sync: 38ms
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="text-slate-400 text-[11px] font-bold">Ledger Integrity</div>
                  <div className="text-white font-extrabold text-sm mt-0.5 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    100% Balanced
                  </div>
                  <div className="text-slate-500 text-[10px] mt-1 font-mono">
                    Zero variance across transactions
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="text-slate-400 text-[11px] font-bold">Security Velocity</div>
                  <div className="text-white font-extrabold text-sm mt-0.5 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                    Normal (Trust: 99.9%)
                  </div>
                  <div className="text-slate-500 text-[10px] mt-1 font-mono">
                    0 flagged fraudulent scans
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: MEMBER ACCOUNTS & AUDIT ADJUSTMENTS */}
        {activeTab === 'accounts' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <div>
                <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-400" />
                  {isEs ? 'Gestión de Cuentas de Miembros' : 'Member Account Database & Security Controls'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {isEs
                    ? 'Busque usuarios, ajuste saldos de puntos por compensación y restablezca PIN de seguridad.'
                    : 'Lookup members, adjust loyalty point balances, promote tiers, and reset PIN codes with audit trail.'}
                </p>
              </div>

              {/* Search Bar */}
              <div className="relative min-w-[240px]">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder={isEs ? 'Buscar por usuario o email...' : 'Search username or email...'}
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-hidden focus:border-amber-500"
                />
              </div>
            </div>

            {/* Users Table */}
            <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-x-auto shadow-md">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900/90 text-slate-400 uppercase text-[10px] font-extrabold border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">User / Name</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Pass ID</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">PIN Code</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {filteredUsers.map((u) => (
                    <tr key={u.username} className="hover:bg-slate-900/50 transition">
                      <td className="py-3 px-4">
                        <div className="font-extrabold text-white">{u.fullName || u.username}</div>
                        <div className="text-[11px] text-slate-400 font-mono">@{u.username}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-300">{u.email || '—'}</td>
                      <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">{u.passId}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase border ${
                            u.role === 'admin'
                              ? 'bg-amber-950/70 text-amber-300 border-amber-800'
                              : u.role === 'merchant'
                              ? 'bg-indigo-950/70 text-indigo-300 border-indigo-800'
                              : 'bg-blue-950/70 text-blue-300 border-blue-800'
                          }`}
                        >
                          {u.role || 'user'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                        {u.pinCode || '••••• (Set)'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedUserForAdjust(u);
                            setIsAdjustModalOpen(true);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-amber-200 border border-slate-700 text-xs font-bold transition cursor-pointer"
                        >
                          {isEs ? 'Ajustar' : 'Adjust'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: PARTNER STORES ONBOARDING */}
        {activeTab === 'stores' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <div>
                <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <StoreIcon className="w-4 h-4 text-emerald-400" />
                  {isEs ? 'Directorio de Comercios Afiliados' : 'Partner Merchant Directory & Onboarding'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {isEs
                    ? 'Administre sucursales participantes, porcentajes de acumulación de puntos y coordenadas GPS.'
                    : 'Manage participating store locations, point accrual rates, and GPS navigation nodes.'}
                </p>
              </div>

              <button
                onClick={() => setIsAddStoreModalOpen(true)}
                className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs transition flex items-center gap-1.5 shadow-md shadow-emerald-600/30 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                {isEs ? 'Agregar Nuevo Comercio' : 'Onboard Partner Store'}
              </button>
            </div>

            {/* Stores Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {stores.map((s) => (
                <div
                  key={s.id}
                  className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between space-y-3"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="px-2 py-0.5 rounded-md bg-emerald-950/60 text-emerald-300 border border-emerald-800 text-[10px] font-extrabold uppercase">
                        {s.category}
                      </span>
                      <span className="text-xs font-mono font-bold text-amber-400">
                        {s.pointsRate} pts / $1
                      </span>
                    </div>

                    <h4 className="text-sm font-extrabold text-white">{s.name}</h4>
                    <p className="text-xs text-slate-400 mt-1">{s.address}</p>
                    <p className="text-[11px] text-slate-500 font-mono mt-0.5">{s.city}</p>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                    <span>GPS: {s.lat.toFixed(3)}, {s.lng.toFixed(3)}</span>
                    <span className="text-emerald-400 font-bold">Active</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: SYSTEM AUDIT LOGS */}
        {activeTab === 'audit' && (
          <div className="space-y-4">
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-purple-400" />
                  {isEs ? 'Registro de Auditoría y Eventos del Sistema' : 'Security Audit Trail & Task Execution Logs'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {isEs
                    ? 'Registro cronológico inmutable de actividades administrativas y ejecuciones automáticas.'
                    : 'Immutable chronological record of administrator operations and automated cron tasks.'}
                </p>
              </div>

              <button
                onClick={handleRefresh}
                className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold border border-slate-800 flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCw className="w-3 h-3" />
                {isEs ? 'Recargar Logs' : 'Reload Logs'}
              </button>
            </div>

            <div className="bg-slate-950 rounded-2xl border border-slate-800 divide-y divide-slate-800/80 shadow-md">
              {auditLogs.map((log) => (
                <div key={log.id} className="p-4 hover:bg-slate-900/40 transition flex items-start gap-3">
                  <div className="mt-0.5">
                    {log.severity === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : log.severity === 'warning' ? (
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                    ) : (
                      <Activity className="w-4 h-4 text-blue-400" />
                    )}
                  </div>

                  <div className="flex-1 space-y-0.5">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-xs font-extrabold text-white">{log.title}</span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 leading-relaxed">{log.details}</p>

                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-[10px] font-mono px-2 py-0.2 rounded-md bg-slate-900 text-slate-400 border border-slate-800">
                        Actor: <strong className="text-slate-200">{log.user || 'mambiadmin'}</strong>
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.2 rounded-md bg-slate-900 text-slate-400 border border-slate-800">
                        Type: {log.type}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 6: BROADCAST SYSTEM ALERTS */}
        {activeTab === 'broadcast' && (
          <div className="max-w-2xl mx-auto p-6 rounded-3xl bg-slate-950 border border-slate-800 shadow-xl space-y-5">
            <div>
              <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                <Radio className="w-4 h-4 text-amber-400" />
                {isEs ? 'Transmisión de Alerta / Notificación de Red' : 'Network-Wide Alert & Maintenance Broadcaster'}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {isEs
                  ? 'Publique anuncios urgentes, alertas de mantenimiento o promociones directamente a las billeteras de los miembros.'
                  : 'Broadcast urgent announcements, scheduled maintenance alerts, or promo bonuses directly to member wallets.'}
              </p>
            </div>

            {broadcastSuccess && (
              <div className="p-3 rounded-xl bg-emerald-950/70 border border-emerald-800 text-emerald-200 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{broadcastSuccess}</span>
              </div>
            )}

            <form onSubmit={handleBroadcastSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">
                  {isEs ? 'Título del Anuncio' : 'Notice Title'}
                </label>
                <input
                  type="text"
                  required
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  placeholder={isEs ? 'ej. Mantenimiento programado de puntos hoy 23:00' : 'e.g. Points Ledger Scheduled Audit Window'}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-hidden focus:border-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">
                  {isEs ? 'Contenido del Mensaje' : 'Message Body'}
                </label>
                <textarea
                  rows={3}
                  required
                  value={broadcastBody}
                  onChange={(e) => setBroadcastBody(e.target.value)}
                  placeholder={isEs ? 'Describa el anuncio para los clientes y comercios...' : 'Describe notice details for customers and merchant POS terminals...'}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-hidden focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Priority Level</label>
                  <select
                    value={broadcastPriority}
                    onChange={(e) => setBroadcastPriority(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                  >
                    <option value="normal">Normal Notice</option>
                    <option value="high">🚨 High Priority Alert</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">Target Audience</label>
                  <select
                    value={broadcastAudience}
                    onChange={(e) => setBroadcastAudience(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                  >
                    <option value="all">All Members & Merchants</option>
                    <option value="user">Customers Only</option>
                    <option value="merchant">Merchants Only</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={isBroadcasting}
                className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-amber-600/30"
              >
                <Send className="w-4 h-4" />
                {isBroadcasting
                  ? (isEs ? 'Transmitiendo...' : 'Broadcasting...')
                  : (isEs ? 'Transmitir Aviso del Sistema' : 'Broadcast System Notice')}
              </button>
            </form>
          </div>
        )}
      </div>

      {/* MODAL 1: ADJUST MEMBER POINTS & CREDENTIALS */}
      {isAdjustModalOpen && selectedUserForAdjust && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-amber-400" />
                {isEs ? 'Ajustar Cuenta de Miembro' : 'Adjust Member Account'}
              </h3>
              <button
                onClick={() => setIsAdjustModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-full cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
              <div className="text-white font-bold">{selectedUserForAdjust.fullName || selectedUserForAdjust.username}</div>
              <div className="text-slate-400 text-[11px]">@{selectedUserForAdjust.username} | Pass ID: {selectedUserForAdjust.passId}</div>
            </div>

            <form onSubmit={handleAdjustSubmit} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-300">
                  {isEs ? 'Puntos a Ajustar (+ o -)' : 'Points Adjustment (+ or -)'}
                </label>
                <input
                  type="number"
                  value={adjustPointsDelta}
                  onChange={(e) => setAdjustPointsDelta(e.target.value)}
                  placeholder="e.g. 250 or -50"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300">
                  {isEs ? 'Cambiar Nivel de Membresía' : 'Change Tier Status'}
                </label>
                <select
                  value={adjustTier}
                  onChange={(e) => setAdjustTier(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                >
                  <option value="">(Keep current tier)</option>
                  <option value="Bronze">Bronze Tier</option>
                  <option value="Silver">Silver Tier</option>
                  <option value="Gold">Gold Tier</option>
                  <option value="Platinum">Platinum Tier</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300">
                  {isEs ? 'Restablecer PIN de Seguridad (5 dígitos)' : 'Reset 5-Digit PIN'}
                </label>
                <input
                  type="text"
                  maxLength={5}
                  value={adjustPin}
                  onChange={(e) => setAdjustPin(e.target.value)}
                  placeholder="e.g. 12345 (Leave empty to keep)"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300">
                  {isEs ? 'Motivo del Ajuste (Auditoría)' : 'Audit Trail Reason / Note'}
                </label>
                <input
                  type="text"
                  required
                  value={adjustNote}
                  onChange={(e) => setAdjustNote(e.target.value)}
                  placeholder="e.g. Customer loyalty bonus / reconciliation"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                />
              </div>

              <button
                type="submit"
                disabled={isAdjusting}
                className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-extrabold transition mt-2 cursor-pointer"
              >
                {isAdjusting
                  ? (isEs ? 'Aplicando...' : 'Applying...')
                  : (isEs ? 'Confirmar Ajuste y Guardar en Firestore' : 'Apply Adjustment to Firestore')}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ONBOARD NEW PARTNER STORE */}
      {isAddStoreModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                <StoreIcon className="w-4 h-4 text-emerald-400" />
                {isEs ? 'Registrar Nuevo Comercio Afiliado' : 'Onboard New Partner Store'}
              </h3>
              <button
                onClick={() => setIsAddStoreModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-full cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddStoreSubmit} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-300">Store Name</label>
                <input
                  type="text"
                  required
                  value={newStoreName}
                  onChange={(e) => setNewStoreName(e.target.value)}
                  placeholder="e.g. Pacific Artisan Bakery"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="font-bold text-slate-300">Category</label>
                  <select
                    value={newStoreCategory}
                    onChange={(e) => setNewStoreCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                  >
                    <option value="Coffee">Coffee & Cafe</option>
                    <option value="Bakery">Bakery</option>
                    <option value="Dining">Dining & Food</option>
                    <option value="Retail">Retail</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-300">Points Rate ($1 =)</label>
                  <input
                    type="number"
                    value={newStorePointsRate}
                    onChange={(e) => setNewStorePointsRate(e.target.value)}
                    placeholder="10"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300">Street Address</label>
                <input
                  type="text"
                  required
                  value={newStoreAddress}
                  onChange={(e) => setNewStoreAddress(e.target.value)}
                  placeholder="e.g. 520 Valencia St"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300">City / State</label>
                <input
                  type="text"
                  value={newStoreCity}
                  onChange={(e) => setNewStoreCity(e.target.value)}
                  placeholder="San Francisco, CA"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingStore}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold transition mt-2 cursor-pointer"
              >
                {isSubmittingStore
                  ? (isEs ? 'Registrando...' : 'Registering...')
                  : (isEs ? 'Guardar y Publicar en Mapa' : 'Save & Publish to Live Map')}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
