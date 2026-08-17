import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard,
  FileText,
  Users,
  ShieldAlert,
  Play,
  RotateCw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Database,
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
  Globe,
  Edit3,
  Trash2,
  Eye,
  UserCheck,
  UserPlus,
  Mail,
  Lock,
  ArrowUpRight,
  ArrowDownLeft,
  Filter,
  Image as ImageIcon,
  CheckSquare,
  LogOut,
  SlidersHorizontal,
  ChevronDown,
  Download,
  FileSpreadsheet,
  Tag,
  Megaphone,
  Newspaper,
  Rss,
  Bell,
  Landmark
} from 'lucide-react';
import {
  AdminTask,
  SystemAuditLog,
  AdminOverviewStats,
  Store,
  UserWallet,
  Transaction,
  AdminPost,
  AdminUserItem,
  UserTier,
  UserRole
} from '../types';
import { useLanguage } from '../context/LanguageContext';
import {
  fetchOrSeedMembers,
  saveMemberAccount,
  updateMemberPoints,
  removeMemberAccount,
  verifyUserEmailDirect
} from '../lib/memberDatabase';

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

  // Primary Sidebar Navigation State (separated into internal promo & external news)
  const [adminMenu, setAdminMenu] = useState<'dashboard' | 'internal-promo' | 'external-news' | 'users' | 'posts'>('dashboard');

  // External Government News subcategory filter and scanning state
  const [govSubcategoryFilter, setGovSubcategoryFilter] = useState<string>('all');
  const [isScanningAllGobiernu, setIsScanningAllGobiernu] = useState<boolean>(false);

  // Secondary sub-tab for dashboard view
  const [dashboardSubTab, setDashboardSubTab] = useState<'overview' | 'tasks' | 'stores' | 'broadcast' | 'audit'>('overview');

  // Core Data State
  const [stats, setStats] = useState<AdminOverviewStats | null>(null);
  const [tasks, setTasks] = useState<AdminTask[]>([]);
  const [auditLogs, setAuditLogs] = useState<SystemAuditLog[]>([]);
  const [registeredUsers, setRegisteredUsers] = useState<AdminUserItem[]>([]);
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Status & Feedback Toast
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Task Running State
  const [runningTaskId, setRunningTaskId] = useState<string | null>(null);
  const [taskFilter, setTaskFilter] = useState<string>('all');

  // ================= USERS MANAGEMENT STATE =================
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<string>('all');
  const [userTierFilter, setUserTierFilter] = useState<string>('all');
  const [userStatusFilter, setUserStatusFilter] = useState<string>('all');
  const [selectedUserForDetails, setSelectedUserForDetails] = useState<AdminUserItem | null>(null);
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<AdminUserItem | null>(null);
  const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false);
  const [isRetrievingUsers, setIsRetrievingUsers] = useState(false);
  const [lastUsersSyncTime, setLastUsersSyncTime] = useState<string | null>(null);
  const [usersViewMode, setUsersViewMode] = useState<'table' | 'cards'>('table');

  // Create User Form
  const [newUsername, setNewUsername] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('user');
  const [newInitialPoints, setNewInitialPoints] = useState('500');
  const [newTier, setNewTier] = useState<UserTier>('Bronze');
  const [newPinCode, setNewPinCode] = useState('12345');
  const [newPassword, setNewPassword] = useState('omniPass2026');
  const [isSubmittingUser, setIsSubmittingUser] = useState(false);

  // Quick Points Adjustment Modal
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [selectedUserForAdjust, setSelectedUserForAdjust] = useState<AdminUserItem | null>(null);
  const [adjustPointsDelta, setAdjustPointsDelta] = useState<string>('100');
  const [adjustNote, setAdjustNote] = useState<string>('Manual loyalty balance adjustment');
  const [isAdjusting, setIsAdjusting] = useState(false);

  // User Deletion State (In-App Custom Confirmation)
  const [userToDelete, setUserToDelete] = useState<AdminUserItem | null>(null);
  const [isDeletingUser, setIsDeletingUser] = useState(false);

  // ================= POSTS MANAGEMENT STATE =================
  const [postSearchQuery, setPostSearchQuery] = useState('');
  const [postCategoryFilter, setPostCategoryFilter] = useState<string>('all');
  const [postStatusFilter, setPostStatusFilter] = useState<string>('all');
  const [isCreatePostModalOpen, setIsCreatePostModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<AdminPost | null>(null);
  const [previewPost, setPreviewPost] = useState<AdminPost | null>(null);

  // Post Form State
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [postCategory, setPostCategory] = useState<'Announcement' | 'Promotion' | 'Update' | 'Reward Alert' | 'Community'>('Promotion');
  const [postImageUrl, setPostImageUrl] = useState('https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1200&q=80');
  const [postAudience, setPostAudience] = useState<'all' | 'user' | 'merchant'>('all');
  const [postStatus, setPostStatus] = useState<'published' | 'draft'>('published');
  const [postFeatured, setPostFeatured] = useState(false);
  const [isSubmittingPost, setIsSubmittingPost] = useState(false);

  // ================= GOBIERNU.CW NEWS SYNC STATE =================
  const [isGobiernuModalOpen, setIsGobiernuModalOpen] = useState(false);
  const [isFetchingGobiernu, setIsFetchingGobiernu] = useState(false);
  const [isImportingGobiernu, setIsImportingGobiernu] = useState(false);
  const [gobiernuNewsList, setGobiernuNewsList] = useState<AdminPost[]>([]);
  const [selectedGobiernuIds, setSelectedGobiernuIds] = useState<string[]>([]);

  // ================= STORES ONBOARDING STATE =================
  const [isAddStoreModalOpen, setIsAddStoreModalOpen] = useState(false);
  const [newStoreName, setNewStoreName] = useState('');
  const [newStoreCategory, setNewStoreCategory] = useState('Coffee');
  const [newStoreAddress, setNewStoreAddress] = useState('');
  const [newStoreCity, setNewStoreCity] = useState('San Francisco, CA');
  const [newStorePointsRate, setNewStorePointsRate] = useState('10');
  const [newStorePhone, setNewStorePhone] = useState('(415) 555-0199');
  const [isSubmittingStore, setIsSubmittingStore] = useState(false);

  // ================= BROADCAST ALERT STATE =================
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastBody, setBroadcastBody] = useState('');
  const [broadcastPriority, setBroadcastPriority] = useState<'normal' | 'high'>('normal');
  const [broadcastAudience, setBroadcastAudience] = useState<'all' | 'user' | 'merchant'>('all');
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Fetch admin dashboard initial data
  const fetchAdminData = async () => {
    try {
      const res = await fetch('/api/admin/overview');
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
        setTasks(data.tasks || []);
        setAuditLogs(data.auditLogs || []);
        if (data.registeredUsers && Array.isArray(data.registeredUsers) && data.registeredUsers.length > 0) {
          setRegisteredUsers(data.registeredUsers);
        } else {
          // Fallback to Firestore / member database auto-sync
          const memberResult = await fetchOrSeedMembers();
          setRegisteredUsers(memberResult.users);
        }
        if (data.posts && Array.isArray(data.posts)) {
          const seen = new Set<string>();
          const uniquePosts = data.posts.filter((p: AdminPost) => {
            const key = (p.id || '') + (p.title || '');
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });
          setPosts(uniquePosts);
        } else {
          setPosts([]);
        }
        setStores(data.stores || []);
        setRecentTransactions(data.recentTransactions || []);
      } else {
        // Fallback for Vercel / serverless deployments without custom proxy
        const memberResult = await fetchOrSeedMembers();
        setRegisteredUsers(memberResult.users);
      }
    } catch (err) {
      console.warn('Failed to load admin overview from API, loading direct member database:', err);
      const memberResult = await fetchOrSeedMembers();
      setRegisteredUsers(memberResult.users);
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

  const handleRetrieveUsers = async () => {
    setIsRetrievingUsers(true);
    try {
      const result = await fetchOrSeedMembers();
      setRegisteredUsers(result.users);
      setLastUsersSyncTime(new Date().toLocaleTimeString());
      showToast(`Retrieved ${result.users.length} member accounts from cloud database`, 'success');
    } catch (err) {
      showToast('Error retrieving member list from database', 'error');
    } finally {
      setIsRetrievingUsers(false);
    }
  };

  const handleExportUsersCSV = () => {
    if (registeredUsers.length === 0) {
      showToast('No users to export', 'info');
      return;
    }
    const headers = ['Username', 'Full Name', 'Email', 'Pass ID', 'Role', 'Tier', 'Points Balance', 'Lifetime Points', 'Status', 'Created At'];
    const rows = registeredUsers.map(u => [
      u.username,
      `"${(u.fullName || '').replace(/"/g, '""')}"`,
      u.email || '',
      u.passId || '',
      u.role || 'user',
      u.currentTier || 'Bronze',
      u.pointsBalance ?? 0,
      u.lifetimePoints ?? 0,
      u.status || 'active',
      u.createdAt || ''
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `omni_members_accounts_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Exported ${registeredUsers.length} member accounts to CSV`, 'success');
  };

  // ================= TASK RUN HANDLER =================
  const handleRunTask = async (taskId: string) => {
    setRunningTaskId(taskId);
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
        showToast(data.message || 'Task completed successfully', 'success');
        fetchAdminData();
      } else {
        showToast('Task execution encountered an error', 'error');
      }
    } catch (err) {
      showToast('Network error while triggering task', 'error');
    } finally {
      setRunningTaskId(null);
    }
  };

  // ================= USER CRUD HANDLERS =================
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newFullName.trim()) {
      showToast('Username and Full Name are required', 'error');
      return;
    }
    setIsSubmittingUser(true);
    const cleanUsername = newUsername.trim().toLowerCase();
    const cleanEmail = newEmail.trim() || `${cleanUsername}@omniloyalty.internal`;
    const initialPts = parseInt(newInitialPoints, 10) || 500;
    const initialLifetime = initialPts + 200;
    const initialPass = newRole === 'admin' ? `ADMIN-${Math.floor(100 + Math.random() * 900)}-SF` : (newRole === 'merchant' ? `MERCHANT-POS-${Math.floor(100 + Math.random() * 900)}` : `PASS-${Math.floor(1000 + Math.random() * 9000)}-SF`);

    const newUserItem: AdminUserItem = {
      username: cleanUsername,
      fullName: newFullName.trim(),
      email: cleanEmail,
      passId: initialPass,
      pinCode: '••••• (Set)',
      role: newRole,
      pointsBalance: initialPts,
      lifetimePoints: initialLifetime,
      currentTier: newTier,
      status: 'active',
      createdAt: new Date().toISOString()
    };

    try {
      // Save directly to Firestore and API
      await saveMemberAccount(newUserItem, newPassword || 'userPass2026', newPinCode || '12345');
      
      // Update local state immediately
      setRegisteredUsers((prev) => {
        const existing = prev.filter((u) => u.username.toLowerCase() !== cleanUsername);
        return [newUserItem, ...existing];
      });

      showToast(`User @${cleanUsername} created and saved to cloud database!`, 'success');
      setIsCreateUserModalOpen(false);
      // Reset form
      setNewUsername('');
      setNewFullName('');
      setNewEmail('');
      setNewInitialPoints('500');
      setNewPinCode('12345');
      fetchAdminData();
    } catch (err) {
      showToast('Error creating user account', 'error');
    } finally {
      setIsSubmittingUser(false);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForEdit) return;
    setIsSubmittingUser(true);
    try {
      await saveMemberAccount(selectedUserForEdit);
      setRegisteredUsers((prev) =>
        prev.map((u) => (u.username.toLowerCase() === selectedUserForEdit.username.toLowerCase() ? selectedUserForEdit : u))
      );
      showToast(`User @${selectedUserForEdit.username} updated successfully!`, 'success');
      setSelectedUserForEdit(null);
      fetchAdminData();
    } catch (err) {
      showToast('Error updating user', 'error');
    } finally {
      setIsSubmittingUser(false);
    }
  };

  const promptDeleteUser = (user: AdminUserItem) => {
    if (user.username.toLowerCase() === 'mambiadmin') {
      showToast('Cannot delete root administrator account', 'error');
      return;
    }
    setUserToDelete(user);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    setIsDeletingUser(true);
    try {
      await removeMemberAccount(userToDelete.username, userToDelete.email);
      setRegisteredUsers((prev) =>
        prev.filter(
          (u) =>
            u.username.toLowerCase() !== userToDelete.username.toLowerCase() &&
            (!u.email || !userToDelete.email || u.email.toLowerCase() !== userToDelete.email.toLowerCase())
        )
      );
      showToast(`User @${userToDelete.username} deleted permanently from database`, 'info');
      if (selectedUserForDetails?.username.toLowerCase() === userToDelete.username.toLowerCase()) {
        setSelectedUserForDetails(null);
      }
      setUserToDelete(null);
      fetchAdminData();
    } catch (err) {
      showToast('Error deleting user account from database', 'error');
    } finally {
      setIsDeletingUser(false);
    }
  };

  const handleAdminVerifyEmail = async (identifier: string) => {
    try {
      const result = await verifyUserEmailDirect(identifier);
      if (result.success) {
        showToast(`Account @${identifier} email verified and activated!`, 'success');
        setRegisteredUsers((prev) =>
          prev.map((u) =>
            u.username.toLowerCase() === identifier.toLowerCase() || u.email?.toLowerCase() === identifier.toLowerCase()
              ? { ...u, emailVerified: true, status: 'active' }
              : u
          )
        );
        if (selectedUserForDetails && (selectedUserForDetails.username.toLowerCase() === identifier.toLowerCase() || selectedUserForDetails.email?.toLowerCase() === identifier.toLowerCase())) {
          setSelectedUserForDetails({
            ...selectedUserForDetails,
            emailVerified: true,
            status: 'active'
          });
        }
        fetchAdminData();
      } else {
        showToast(result.message || 'Failed to verify email', 'error');
      }
    } catch (err) {
      showToast('Error verifying account email', 'error');
    }
  };

  const handleQuickAdjustPoints = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForAdjust) return;
    setIsAdjusting(true);
    try {
      const delta = parseInt(adjustPointsDelta, 10);
      const newPoints = Math.max(0, (selectedUserForAdjust.pointsBalance || 0) + delta);
      const newTier: UserTier = newPoints >= 2500 ? 'Platinum' : newPoints >= 1200 ? 'Gold' : newPoints >= 500 ? 'Silver' : 'Bronze';

      await updateMemberPoints(selectedUserForAdjust.username, newPoints, newTier);

      setRegisteredUsers((prev) =>
        prev.map((u) =>
          u.username.toLowerCase() === selectedUserForAdjust.username.toLowerCase()
            ? { ...u, pointsBalance: newPoints, currentTier: newTier }
            : u
        )
      );

      showToast(`Adjusted points for @${selectedUserForAdjust.username} (${delta > 0 ? `+${delta}` : delta} pts)`, 'success');
      setIsAdjustModalOpen(false);
      if (selectedUserForDetails?.username === selectedUserForAdjust.username) {
        setSelectedUserForDetails({
          ...selectedUserForDetails,
          pointsBalance: newPoints,
          currentTier: newTier
        });
      }
      fetchAdminData();
    } catch (err) {
      showToast('Error adjusting points', 'error');
    } finally {
      setIsAdjusting(false);
    }
  };

  // ================= POST CRUD HANDLERS =================
  const handleOpenCreatePost = () => {
    setEditingPost(null);
    setPostTitle('');
    setPostContent('');
    setPostCategory('Promotion');
    setPostImageUrl('https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1200&q=80');
    setPostAudience('all');
    setPostStatus('published');
    setPostFeatured(false);
    setIsCreatePostModalOpen(true);
  };

  const handleOpenEditPost = (post: AdminPost) => {
    setEditingPost(post);
    setPostTitle(post.title);
    setPostContent(post.content);
    setPostCategory(post.category);
    setPostImageUrl(post.imageUrl || '');
    setPostAudience(post.targetAudience);
    setPostStatus(post.status);
    setPostFeatured(!!post.featured);
    setIsCreatePostModalOpen(true);
  };

  const handleSavePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postTitle.trim() || !postContent.trim()) {
      showToast('Title and content are required', 'error');
      return;
    }
    setIsSubmittingPost(true);
    try {
      if (editingPost) {
        // Update existing post
        const res = await fetch('/api/admin/posts/update', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingPost.id,
            title: postTitle.trim(),
            content: postContent.trim(),
            category: postCategory,
            imageUrl: postImageUrl.trim(),
            targetAudience: postAudience,
            status: postStatus,
            featured: postFeatured
          })
        });
        if (res.ok) {
          showToast('Post updated successfully!', 'success');
          setIsCreatePostModalOpen(false);
          fetchAdminData();
        } else {
          showToast('Failed to update post', 'error');
        }
      } else {
        // Create new post
        const res = await fetch('/api/admin/posts/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: postTitle.trim(),
            content: postContent.trim(),
            category: postCategory,
            imageUrl: postImageUrl.trim(),
            author: adminUser?.name || 'Mambi Administrator',
            targetAudience: postAudience,
            status: postStatus,
            featured: postFeatured
          })
        });
        if (res.ok) {
          showToast('Post published successfully!', 'success');
          setIsCreatePostModalOpen(false);
          fetchAdminData();
        } else {
          showToast('Failed to create post', 'error');
        }
      }
    } catch (err) {
      showToast('Error saving post', 'error');
    } finally {
      setIsSubmittingPost(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    try {
      const res = await fetch(`/api/admin/posts/${encodeURIComponent(postId)}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        showToast('Post deleted', 'info');
        fetchAdminData();
      } else {
        showToast('Failed to delete post', 'error');
      }
    } catch (err) {
      showToast('Error deleting post', 'error');
    }
  };

  const handleTogglePostStatus = async (post: AdminPost) => {
    const newStatus = post.status === 'published' ? 'draft' : 'published';
    try {
      const res = await fetch('/api/admin/posts/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: post.id,
          status: newStatus
        })
      });
      if (res.ok) {
        showToast(`Post marked as ${newStatus}`, 'success');
        fetchAdminData();
      }
    } catch (err) {
      showToast('Error updating post status', 'error');
    }
  };

  // ================= GOBIERNU.CW NEWS HANDLERS =================
  const handleOpenGobiernuNews = async () => {
    setIsGobiernuModalOpen(true);
    setIsFetchingGobiernu(true);
    try {
      const res = await fetch('/api/gobiernu/news?limit=10');
      const data = await res.json();
      if (data.success && Array.isArray(data.posts)) {
        setGobiernuNewsList(data.posts);
        setSelectedGobiernuIds(data.posts.map((p: any) => p.id));
      } else {
        showToast(data.error || 'Failed to fetch Gobiernu.cw news', 'error');
      }
    } catch (err) {
      showToast('Failed to connect to Gobiernu.cw news feed', 'error');
    } finally {
      setIsFetchingGobiernu(false);
    }
  };

  const handleQuickImportGobiernu = async (specificIds?: string[]) => {
    setIsImportingGobiernu(true);
    try {
      const targetIds = specificIds || (selectedGobiernuIds.length > 0 ? selectedGobiernuIds : undefined);
      const res = await fetch('/api/admin/posts/import-gobiernu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postIds: targetIds,
          publishNotifications: true
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`🇨🇼 ${data.message}`, 'success');
        fetchAdminData();
        setIsGobiernuModalOpen(false);
      } else {
        showToast(data.error || 'Failed to import news from Gobiernu.cw', 'error');
      }
    } catch (err) {
      showToast('Error syncing news from Gobiernu.cw', 'error');
    } finally {
      setIsImportingGobiernu(false);
    }
  };

  const handleToggleSelectAllGobiernu = () => {
    if (selectedGobiernuIds.length === gobiernuNewsList.length) {
      setSelectedGobiernuIds([]);
    } else {
      setSelectedGobiernuIds(gobiernuNewsList.map((p) => p.id));
    }
  };

  const handleToggleSelectGobiernuItem = (id: string) => {
    setSelectedGobiernuIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleTriggerScanAllGobiernu = async () => {
    setIsScanningAllGobiernu(true);
    try {
      const res = await fetch('/api/gobiernu/scan-all', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showToast(`Scan complete! Synced ${data.savedCount || 10} latest government news items to Firestore.`, 'success');
        fetchAdminData();
      } else {
        showToast(data.error || 'Failed to scan government news', 'error');
      }
    } catch (err) {
      showToast('Error connecting to government news scanner', 'error');
    } finally {
      setIsScanningAllGobiernu(false);
    }
  };

  // ================= ONBOARD STORE HANDLER =================
  const handleAddStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStoreName.trim() || !newStoreAddress.trim()) {
      showToast('Store name and address are required', 'error');
      return;
    }
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
          phone: newStorePhone
        })
      });
      if (res.ok) {
        showToast(`Store "${newStoreName}" onboarded!`, 'success');
        setIsAddStoreModalOpen(false);
        setNewStoreName('');
        setNewStoreAddress('');
        fetchAdminData();
      } else {
        showToast('Failed to add store', 'error');
      }
    } catch (err) {
      showToast('Error adding partner store', 'error');
    } finally {
      setIsSubmittingStore(false);
    }
  };

  // ================= BROADCAST HANDLER =================
  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastBody.trim()) {
      showToast('Title and message are required', 'error');
      return;
    }
    setIsBroadcasting(true);
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
        showToast('Broadcast alert sent across network!', 'success');
        setBroadcastTitle('');
        setBroadcastBody('');
        fetchAdminData();
      } else {
        showToast('Failed to send broadcast', 'error');
      }
    } catch (err) {
      showToast('Error broadcasting alert', 'error');
    } finally {
      setIsBroadcasting(false);
    }
  };

  // Filtered Users List
  const filteredUsers = registeredUsers.filter((u) => {
    const q = userSearchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      u.fullName.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.passId.toLowerCase().includes(q);
    const matchesRole = userRoleFilter === 'all' || u.role === userRoleFilter;
    const matchesTier = userTierFilter === 'all' || u.currentTier === userTierFilter;
    const isVerified = u.emailVerified !== false && u.status !== 'pending_verification';
    const matchesStatus =
      userStatusFilter === 'all' ||
      (userStatusFilter === 'verified' && isVerified) ||
      (userStatusFilter === 'pending' && !isVerified);
    return matchesSearch && matchesRole && matchesTier && matchesStatus;
  });

  // Separation between Internal Promos/News vs External Government News
  const internalPosts = posts.filter(
    (p) =>
      !p.id.startsWith('gobiernu-') &&
      p.author !== 'Gobiernu di Kòrsou' &&
      !p.author?.toLowerCase().includes('gobiernu') &&
      !p.sourceUrl?.includes('gobiernu.cw')
  );

  const externalGovPosts = posts.filter(
    (p) =>
      p.id.startsWith('gobiernu-') ||
      p.author === 'Gobiernu di Kòrsou' ||
      p.author?.toLowerCase().includes('gobiernu') ||
      p.sourceUrl?.includes('gobiernu.cw')
  );

  // Filtered Internal Promos List
  const filteredInternalPosts = internalPosts.filter((p) => {
    const q = postSearchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      p.title.toLowerCase().includes(q) ||
      p.content.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.author.toLowerCase().includes(q);
    const matchesCategory = postCategoryFilter === 'all' || p.category === postCategoryFilter;
    const matchesStatus = postStatusFilter === 'all' || p.status === postStatusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Filtered External Government News List (Unified under Government news)
  const filteredExternalGovPosts = externalGovPosts.filter((p) => {
    const q = postSearchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      p.title.toLowerCase().includes(q) ||
      p.content.toLowerCase().includes(q) ||
      (p.subCategory && p.subCategory.toLowerCase().includes(q)) ||
      (p.category && p.category.toLowerCase().includes(q));
    return matchesSearch;
  });

  // Generic fallback filtered posts
  const filteredPosts = posts.filter((p) => {
    const q = postSearchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      p.title.toLowerCase().includes(q) ||
      p.content.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q);
    const matchesCategory = postCategoryFilter === 'all' || p.category === postCategoryFilter;
    const matchesStatus = postStatusFilter === 'all' || p.status === postStatusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Tier styling helper
  const getTierBadge = (tier: UserTier = 'Bronze') => {
    switch (tier) {
      case 'Platinum':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'Gold':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'Silver':
        return 'bg-slate-300/20 text-slate-200 border-slate-300/30';
      default:
        return 'bg-amber-900/20 text-amber-400 border-amber-800/30';
    }
  };

  const getRoleBadge = (role: UserRole = 'user') => {
    switch (role) {
      case 'admin':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
      case 'merchant':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      default:
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
    }
  };

  return (
    <div id="admin-root-container" className="w-full min-h-[calc(100vh-64px)] flex flex-col md:flex-row bg-slate-950 text-slate-100 antialiased">
      {/* ============================================================ */}
      {/* 200px LEFT SIDEBAR FOR ADMIN MENU                            */}
      {/* ============================================================ */}
      <aside
        id="admin-sidebar"
        className="w-full md:w-[200px] md:min-w-[200px] md:max-w-[200px] shrink-0 bg-slate-900/95 border-r border-slate-800 flex flex-col justify-between p-3 select-none z-20"
      >
        <div className="space-y-6">
          {/* Admin Header Badge */}
          <div className="px-2 pt-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                <ShieldCheck className="w-4 h-4 text-white" />
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Admin Area</p>
                <p className="text-sm font-semibold text-white truncate">OmniControl</p>
              </div>
            </div>
            <div className="mt-3 px-2 py-1.5 rounded-md bg-slate-800/80 border border-slate-700/60 flex items-center justify-between text-xs text-slate-300">
              <span className="truncate font-mono">@{adminUser?.username || 'mambiadmin'}</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
          </div>

          {/* Sidebar Menu Items */}
          <nav className="space-y-1" aria-label="Admin Navigation">
            {/* 1. DASHBOARD MENU */}
            <button
              id="admin-menu-dashboard"
              onClick={() => setAdminMenu('dashboard')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                adminMenu === 'dashboard'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 shrink-0" />
              <span className="truncate">Dashboard</span>
            </button>

            {/* 2. INTERNAL PROMO & APP NEWS */}
            <button
              id="admin-menu-internal-promo"
              onClick={() => setAdminMenu('internal-promo')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                adminMenu === 'internal-promo' || adminMenu === 'posts'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3 truncate">
                <Tag className="w-4 h-4 shrink-0 text-amber-400" />
                <span className="truncate">Internal Promos</span>
              </div>
              <span className="px-1.5 py-0.5 text-[10px] rounded bg-slate-800 text-slate-300 border border-slate-700">
                {internalPosts.length}
              </span>
            </button>

            {/* 3. EXTERNAL GOVERNMENT NEWS (GOBINERNU.CW) */}
            <button
              id="admin-menu-external-news"
              onClick={() => setAdminMenu('external-news')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                adminMenu === 'external-news'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3 truncate">
                <Globe className="w-4 h-4 shrink-0 text-blue-400" />
                <span className="truncate">External News</span>
              </div>
              <span className="px-1.5 py-0.5 text-[10px] rounded bg-blue-900/60 text-blue-300 border border-blue-700/60 font-bold">
                10 Live
              </span>
            </button>

            {/* 4. MEMBERS ACCOUNTS MENU */}
            <button
              id="admin-menu-users"
              onClick={() => {
                setAdminMenu('users');
                handleRetrieveUsers();
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                adminMenu === 'users'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3 truncate">
                <Users className="w-4 h-4 shrink-0" />
                <span className="truncate">Members</span>
              </div>
              <span className="px-1.5 py-0.5 text-[10px] rounded bg-slate-800 text-slate-300 border border-slate-700">
                {registeredUsers.length}
              </span>
            </button>
          </nav>
        </div>

        {/* Sidebar Footer Controls */}
        <div className="pt-4 border-t border-slate-800/80 space-y-2">
          {/* Firestore Connection status */}
          <div className="px-2 py-1.5 rounded-md bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Database className="w-3 h-3 text-emerald-400" />
              <span>Firestore</span>
            </span>
            <span className="text-emerald-400 font-semibold">Online</span>
          </div>

          {/* Switch Role Quick buttons */}
          {onSwitchRole && (
            <div className="grid grid-cols-2 gap-1 pt-1">
              <button
                onClick={() => onSwitchRole('user')}
                className="px-2 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 font-medium transition text-center truncate"
                title="Switch to Customer Pass"
              >
                Pass App
              </button>
              <button
                onClick={() => onSwitchRole('merchant')}
                className="px-2 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 font-medium transition text-center truncate"
                title="Switch to Merchant POS"
              >
                POS App
              </button>
            </div>
          )}

          {/* Logout */}
          {onLogout && (
            <button
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 text-xs font-medium transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          )}
        </div>
      </aside>

      {/* ============================================================ */}
      {/* MAIN FULLWIDTH CONTENT AREA                                  */}
      {/* ============================================================ */}
      <main className="flex-1 min-w-0 bg-slate-950/40 p-4 sm:p-6 lg:p-8 overflow-y-auto">
        {/* Toast Notification */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div
              initial={{ opacity: 0, y: -16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -16, scale: 0.95 }}
              className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-2xl border flex items-center gap-3 ${
                toastMessage.type === 'error'
                  ? 'bg-rose-950/90 text-rose-200 border-rose-800'
                  : toastMessage.type === 'info'
                  ? 'bg-blue-950/90 text-blue-200 border-blue-800'
                  : 'bg-emerald-950/90 text-emerald-200 border-emerald-800'
              }`}
            >
              {toastMessage.type === 'error' ? (
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              )}
              <span className="text-sm font-medium">{toastMessage.text}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ============================================================ */}
        {/* VIEW 1: DASHBOARD (MAIN ADMIN DASHBOARD)                     */}
        {/* ============================================================ */}
        {adminMenu === 'dashboard' && (
          <div className="space-y-6">
            {/* Dashboard Header Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">Main Admin Dashboard</h1>
                <p className="text-sm text-slate-400 mt-1">
                  Central telemetry, background task orchestrators, and network health overview.
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                  <span>{isRefreshing ? 'Syncing...' : 'Refresh Data'}</span>
                </button>

                <button
                  onClick={() => handleRunTask('all')}
                  disabled={runningTaskId !== null}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 transition"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Run All System Checks</span>
                </button>
              </div>
            </div>

            {/* Quick KPI Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-medium uppercase tracking-wider">Total Users</span>
                  <Users className="w-4 h-4 text-blue-400" />
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-white">{registeredUsers.length}</span>
                  <span className="text-xs text-emerald-400 font-semibold">+100% active</span>
                </div>
                <button
                  onClick={() => setAdminMenu('users')}
                  className="mt-3 text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium"
                >
                  <span>Manage Users</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-medium uppercase tracking-wider">Posts & News</span>
                  <FileText className="w-4 h-4 text-purple-400" />
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-white">{posts.length}</span>
                  <span className="text-xs text-purple-400 font-semibold">{posts.filter(p => p.status === 'published').length} live</span>
                </div>
                <button
                  onClick={() => setAdminMenu('posts')}
                  className="mt-3 text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 font-medium"
                >
                  <span>Create & Edit Posts</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-medium uppercase tracking-wider">Active Stores</span>
                  <StoreIcon className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-white">{stores.length}</span>
                  <span className="text-xs text-emerald-400 font-semibold">POS Online</span>
                </div>
                <button
                  onClick={() => { setDashboardSubTab('stores'); setIsAddStoreModalOpen(true); }}
                  className="mt-3 text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium"
                >
                  <span>+ Onboard Store</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-medium uppercase tracking-wider">Total Points Issued</span>
                  <Sparkles className="w-4 h-4 text-amber-400" />
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-white">
                    {(stats?.totalPointsIssued || 186650).toLocaleString()}
                  </span>
                  <span className="text-xs text-slate-400">pts</span>
                </div>
                <div className="mt-3 text-xs text-slate-400 font-mono">Ledger synchronized</div>
              </div>
            </div>

            {/* Dashboard Sub-Tab Navigation Bar */}
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
              <button
                onClick={() => setDashboardSubTab('overview')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  dashboardSubTab === 'overview'
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                System Tasks & Automation
              </button>
              <button
                onClick={() => setDashboardSubTab('stores')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  dashboardSubTab === 'stores'
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Partner Stores ({stores.length})
              </button>
              <button
                onClick={() => setDashboardSubTab('broadcast')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  dashboardSubTab === 'broadcast'
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Emergency Broadcast
              </button>
              <button
                onClick={() => setDashboardSubTab('audit')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  dashboardSubTab === 'audit'
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Live Audit Trail ({auditLogs.length})
              </button>
            </div>

            {/* SUB-SECTION: System Tasks & Automation */}
            {dashboardSubTab === 'overview' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                    Automated Monitoring & Accounting Tasks
                  </h3>
                  <div className="flex items-center gap-2 text-xs">
                    {['all', 'accounting', 'security', 'maintenance'].map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setTaskFilter(cat)}
                        className={`px-2.5 py-1 rounded capitalize transition ${
                          taskFilter === cat
                            ? 'bg-indigo-600 text-white font-semibold'
                            : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {tasks
                    .filter((t) => taskFilter === 'all' || t.category === taskFilter)
                    .map((t) => {
                      const isRunning = runningTaskId === t.id;
                      return (
                        <div
                          key={t.id}
                          className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between gap-4"
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-indigo-300 border border-slate-700">
                                {t.category}
                              </span>
                              <span className="text-xs text-slate-400 font-mono">{t.frequency}</span>
                            </div>
                            <h4 className="text-sm font-semibold text-white mt-2">{t.name}</h4>
                            <p className="text-xs text-slate-400 mt-1 line-clamp-2">{t.description}</p>
                            {t.successMessage && (
                              <div className="mt-2.5 p-2 rounded-lg bg-emerald-950/40 border border-emerald-800/40 text-[11px] text-emerald-300 flex items-start gap-1.5">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                                <span>{t.successMessage}</span>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                            <span className="text-[11px] text-slate-500 font-mono">
                              Last run: {t.lastRun ? new Date(t.lastRun).toLocaleTimeString() : 'Never'}
                            </span>
                            <button
                              onClick={() => handleRunTask(t.id)}
                              disabled={isRunning}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-medium transition"
                            >
                              <Play className={`w-3 h-3 ${isRunning ? 'animate-spin' : ''}`} />
                              <span>{isRunning ? 'Executing...' : 'Run Now'}</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* SUB-SECTION: Partner Stores */}
            {dashboardSubTab === 'stores' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                    OmniLoyalty Partner Stores Network
                  </h3>
                  <button
                    onClick={() => setIsAddStoreModalOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Onboard New Store</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {stores.map((s) => (
                    <div key={s.id} className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-xs">{s.category}</span>
                          <span className="text-amber-400 font-semibold text-xs">★ {s.rating}</span>
                        </div>
                        <h4 className="text-base font-bold text-white mt-2">{s.name}</h4>
                        <p className="text-xs text-slate-400 mt-1">{s.address}, {s.city}</p>
                        <p className="text-xs text-indigo-400 mt-2 font-medium">{s.pointsRate} points per $1 spent</p>
                      </div>
                      <div className="mt-4 pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                        <span>{s.phone}</span>
                        <span className="text-emerald-400 font-semibold">Active POS</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SUB-SECTION: Emergency Broadcast */}
            {dashboardSubTab === 'broadcast' && (
              <div className="max-w-2xl bg-slate-900 p-6 rounded-xl border border-slate-800 space-y-4">
                <div>
                  <h3 className="text-base font-bold text-white">Broadcast System-Wide Alert</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Send push notification alerts instantly to all customer passes or merchant POS terminals.
                  </p>
                </div>

                <form onSubmit={handleBroadcast} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Alert Title</label>
                    <input
                      type="text"
                      value={broadcastTitle}
                      onChange={(e) => setBroadcastTitle(e.target.value)}
                      placeholder="e.g. Scheduled Network Maintenance at 02:00 UTC"
                      className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:border-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Message Body</label>
                    <textarea
                      rows={3}
                      value={broadcastBody}
                      onChange={(e) => setBroadcastBody(e.target.value)}
                      placeholder="Enter the full message details..."
                      className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:border-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Priority</label>
                      <select
                        value={broadcastPriority}
                        onChange={(e: any) => setBroadcastPriority(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:border-indigo-500 focus:outline-none"
                      >
                        <option value="normal">Normal (Informational)</option>
                        <option value="high">High (Urgent Alert)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Audience</label>
                      <select
                        value={broadcastAudience}
                        onChange={(e: any) => setBroadcastAudience(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:border-indigo-500 focus:outline-none"
                      >
                        <option value="all">All Network Users</option>
                        <option value="user">Customer Pass Holders Only</option>
                        <option value="merchant">Merchant POS Only</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isBroadcasting}
                    className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-lg transition"
                  >
                    <Send className="w-4 h-4" />
                    <span>{isBroadcasting ? 'Broadcasting...' : 'Broadcast Network Notice'}</span>
                  </button>
                </form>
              </div>
            )}

            {/* SUB-SECTION: Live Audit Trail */}
            {dashboardSubTab === 'audit' && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                  System Audit Logs & Security History
                </h3>
                <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden divide-y divide-slate-800">
                  {auditLogs.map((log) => (
                    <div key={log.id} className="p-3.5 flex items-start justify-between gap-4 text-xs">
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                            log.severity === 'error'
                              ? 'bg-rose-400'
                              : log.severity === 'warning'
                              ? 'bg-amber-400'
                              : 'bg-emerald-400'
                          }`}
                        />
                        <div>
                          <p className="font-semibold text-white">{log.title}</p>
                          <p className="text-slate-400 mt-0.5">{log.details}</p>
                          <span className="text-[10px] text-slate-500 font-mono mt-1 inline-block">
                            User: {log.user || 'System'} | Type: {log.type}
                          </span>
                        </div>
                      </div>
                      <span className="text-slate-500 font-mono shrink-0">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* VIEW 2: INTERNAL PROMO & NEWS MANAGER                        */}
        {/* ============================================================ */}
        {(adminMenu === 'internal-promo' || adminMenu === 'posts') && (
          <div className="space-y-6">
            {/* View Switcher Sub-Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <button
                onClick={() => setAdminMenu('internal-promo')}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition"
              >
                <Tag className="w-3.5 h-3.5 text-amber-300" />
                <span>Internal Promos & App News</span>
                <span className="px-1.5 py-0.5 rounded bg-black/30 text-[10px]">{internalPosts.length}</span>
              </button>

              <button
                onClick={() => setAdminMenu('external-news')}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs font-semibold border border-slate-800 transition"
              >
                <Globe className="w-3.5 h-3.5 text-blue-400" />
                <span>External Government News (gobiernu.cw)</span>
                <span className="px-1.5 py-0.5 rounded bg-blue-900/40 text-blue-300 border border-blue-800/50 text-[10px]">10 Live</span>
              </button>
            </div>

            {/* Header Bar */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2">
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-2xl font-bold text-white tracking-tight">Internal Promotions & News</h1>
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[11px] font-semibold flex items-center gap-1">
                    <Tag className="w-3 h-3 text-amber-400" />
                    Network & Merchant Promos
                  </span>
                </div>
                <p className="text-sm text-slate-400 mt-1">
                  Create merchant promotions, store discounts, and loyalty news with automated <span className="text-amber-300 font-mono font-semibold">"PROMO PUSH"</span> alerts.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  id="admin-create-post-btn"
                  onClick={handleOpenCreatePost}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-lg shadow-indigo-600/30 transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create New Promo</span>
                </button>
              </div>
            </div>

            {/* Filter Toolbar */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-slate-900/60 p-3 rounded-xl border border-slate-800">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={postSearchQuery}
                  onChange={(e) => setPostSearchQuery(e.target.value)}
                  placeholder="Search promos by title, merchant, author..."
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
                <select
                  value={postCategoryFilter}
                  onChange={(e) => setPostCategoryFilter(e.target.value)}
                  className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 text-xs focus:border-indigo-500 focus:outline-none"
                >
                  <option value="all">All Categories</option>
                  <option value="Promotion">Promotion</option>
                  <option value="Announcement">Announcement</option>
                  <option value="Update">Update</option>
                  <option value="Reward Alert">Reward Alert</option>
                  <option value="Community">Community</option>
                </select>

                <select
                  value={postStatusFilter}
                  onChange={(e) => setPostStatusFilter(e.target.value)}
                  className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 text-xs focus:border-indigo-500 focus:outline-none"
                >
                  <option value="all">All Statuses</option>
                  <option value="published">Published Only</option>
                  <option value="draft">Drafts Only</option>
                </select>
              </div>
            </div>

            {/* Promos Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredInternalPosts.map((post) => (
                <div
                  key={post.id}
                  className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden flex flex-col justify-between hover:border-slate-700 transition shadow-sm"
                >
                  <div>
                    {post.imageUrl && (
                      <div className="relative h-44 w-full bg-slate-950 overflow-hidden">
                        <img
                          src={post.imageUrl}
                          alt={post.title}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap">
                          <span className="px-2.5 py-1 rounded-md bg-slate-900/90 backdrop-blur text-xs font-semibold text-white border border-slate-700 flex items-center gap-1">
                            <Tag className="w-3 h-3 text-amber-400" />
                            {post.category}
                          </span>
                          {post.featured && (
                            <span className="px-2 py-0.5 rounded-md bg-amber-500 text-slate-950 text-[10px] font-bold uppercase">
                              Pinned
                            </span>
                          )}
                        </div>
                        <span
                          className={`absolute top-3 right-3 px-2 py-0.5 rounded text-[11px] font-semibold uppercase ${
                            post.status === 'published'
                              ? 'bg-emerald-500/90 text-white'
                              : 'bg-amber-500/90 text-slate-950'
                          }`}
                        >
                          {post.status}
                        </span>
                      </div>
                    )}

                    <div className="p-4 space-y-2">
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span className="font-medium text-slate-300">By {post.author}</span>
                        <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                      </div>
                      <h3 className="text-base font-bold text-white line-clamp-2 leading-snug">{post.title}</h3>
                      <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">{post.content}</p>

                      <div className="pt-2 flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-400 border border-slate-700/60">
                          Audience: {post.targetAudience}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setPreviewPost(post)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
                        title="Preview Post"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleOpenEditPost(post)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 transition cursor-pointer"
                        title="Edit Post"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeletePost(post.id)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-rose-400 transition cursor-pointer"
                        title="Delete Post"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <button
                      onClick={() => handleTogglePostStatus(post)}
                      className={`px-2.5 py-1 rounded text-xs font-semibold transition cursor-pointer ${
                        post.status === 'published'
                          ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      }`}
                    >
                      {post.status === 'published' ? 'Move to Draft' : 'Publish'}
                    </button>
                  </div>
                </div>
              ))}

              {filteredInternalPosts.length === 0 && (
                <div className="col-span-full p-12 text-center bg-slate-900/50 rounded-xl border border-slate-800 space-y-3">
                  <Tag className="w-8 h-8 text-slate-500 mx-auto" />
                  <p className="text-sm text-slate-300 font-semibold">No internal promo posts found</p>
                  <p className="text-xs text-slate-500">Create a promotional campaign or customer announcement.</p>
                  <button
                    onClick={handleOpenCreatePost}
                    className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold inline-block cursor-pointer"
                  >
                    + Create Promo
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* VIEW 3: EXTERNAL GOVERNMENT NEWS (GOBINERNU.CW)              */}
        {/* ============================================================ */}
        {adminMenu === 'external-news' && (
          <div className="space-y-6">
            {/* View Switcher Sub-Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <button
                onClick={() => setAdminMenu('internal-promo')}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs font-semibold border border-slate-800 transition"
              >
                <Tag className="w-3.5 h-3.5 text-amber-400" />
                <span>Internal Promos & App News</span>
                <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px]">{internalPosts.length}</span>
              </button>

              <button
                onClick={() => setAdminMenu('external-news')}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold shadow-md shadow-blue-600/30 transition"
              >
                <Globe className="w-3.5 h-3.5 text-blue-200" />
                <span>External Government News (gobiernu.cw)</span>
                <span className="px-1.5 py-0.5 rounded bg-black/30 text-[10px]">10 Live</span>
              </button>
            </div>

            {/* Top Sync & Health Status Banner */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-950/60 via-slate-900 to-indigo-950/40 border border-blue-900/40 space-y-3">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl font-bold text-white tracking-tight">Official Government of Curaçao News</h1>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      30-Min Auto-Sync Active
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1">
                    All subcategories from Gobiernu.cw are aggregated and consolidated into the top 10 latest articles under <span className="text-blue-300 font-mono font-semibold">"Government news"</span> in Firebase Firestore with <span className="text-blue-300 font-mono font-semibold">"NEWS PUSH"</span> notifications for same-day releases.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleTriggerScanAllGobiernu}
                    disabled={isScanningAllGobiernu}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md transition cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isScanningAllGobiernu ? 'animate-spin' : ''}`} />
                    <span>{isScanningAllGobiernu ? 'Syncing Top 10...' : 'Sync Top 10 Now'}</span>
                  </button>

                  <button
                    onClick={handleOpenGobiernuNews}
                    disabled={isImportingGobiernu}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition cursor-pointer"
                  >
                    <Layers className="w-3.5 h-3.5 text-blue-400" />
                    <span>Manage Sync Modal</span>
                  </button>
                </div>
              </div>

              {/* Status Chips */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800/80 text-xs">
                <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
                  <span className="text-slate-400 text-[11px]">Category</span>
                  <span className="font-bold text-white font-mono">Government news</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
                  <span className="text-slate-400 text-[11px]">Firestore Cloud</span>
                  <span className="font-bold text-emerald-400 flex items-center gap-1">
                    <Database className="w-3 h-3" />
                    10 Synced
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
                  <span className="text-slate-400 text-[11px]">Push Policy</span>
                  <span className="font-bold text-blue-300 font-mono text-[10px]">NEWS PUSH (Same Day)</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
                  <span className="text-slate-400 text-[11px]">Source Portal</span>
                  <a
                    href="https://gobiernu.cw"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-blue-400 hover:underline flex items-center gap-1"
                  >
                    <span>gobiernu.cw</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
              </div>
            </div>

            {/* Consolidated Category Indicator */}
            <div className="flex items-center justify-between pb-1 text-xs">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1.5 rounded-lg bg-blue-600 text-white font-bold flex items-center gap-1.5 shadow-sm">
                  <Landmark className="w-3.5 h-3.5" />
                  <span>Category: Government news</span>
                </span>
                <span className="text-slate-400 text-xs">Showing latest {filteredExternalGovPosts.length} aggregated articles</span>
              </div>
            </div>

            {/* External News Grid (Strictly 10 Latest) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredExternalGovPosts.map((post, idx) => {
                const todayYMD = new Date().toISOString().slice(0, 10);
                const postDateYMD = new Date(post.createdAt).toISOString().slice(0, 10);
                const isSameDay = postDateYMD === todayYMD;
                const isGovLogo =
                  !post.imageUrl ||
                  post.imageUrl.includes('gobiernu_2x.png') ||
                  post.imageUrl.includes('gobiernu-logo') ||
                  post.imageUrl.includes('emblem');

                return (
                  <div
                    key={post.id}
                    className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden flex flex-col justify-between hover:border-blue-900/60 transition shadow-sm"
                  >
                    <div>
                      {/* Image Header: Full cover for photos, pure white background for government logo */}
                      <div className={`relative h-44 w-full overflow-hidden ${isGovLogo ? 'bg-white flex items-center justify-center p-6 border-b border-slate-800' : 'bg-slate-950'}`}>
                        <img
                          src={post.imageUrl || '/gobiernu_2x.png'}
                          alt={post.title}
                          className={
                            isGovLogo
                              ? 'max-h-28 max-w-[190px] object-contain mx-auto transition-transform duration-300 group-hover:scale-105'
                              : 'w-full h-full object-cover transition-transform duration-300 group-hover:scale-105'
                          }
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = '/gobiernu_2x.png';
                            (e.currentTarget as HTMLImageElement).className = 'max-h-28 max-w-[190px] object-contain mx-auto';
                          }}
                        />
                        <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap">
                          <span className="px-2 py-0.5 rounded-md bg-blue-900/90 text-blue-200 text-[10px] font-bold border border-blue-700/60">
                            #{idx + 1}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-slate-950/80 backdrop-blur text-[10px] font-bold text-slate-200 border border-slate-700">
                            {post.subCategory || 'Notisia'}
                          </span>
                        </div>

                        {isSameDay && (
                          <span className="absolute top-3 right-3 px-2 py-0.5 rounded-md bg-emerald-500/90 text-white text-[10px] font-black uppercase tracking-wider shadow">
                            🔔 NEWS PUSH
                          </span>
                        )}
                      </div>

                      <div className="p-4 space-y-2">
                        <div className="flex items-center justify-between text-xs text-slate-400">
                          <span className="font-semibold text-blue-400 flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-emerald-400" />
                            Gobiernu di Kòrsou
                          </span>
                          <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                        </div>

                        <h3 className="text-base font-bold text-white line-clamp-2 leading-snug">{post.title}</h3>
                        <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">{post.content || post.excerpt}</p>

                        {post.sourceUrl && (
                          <div className="pt-1">
                            <a
                              href={post.sourceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300 transition font-medium bg-blue-950/40 px-2.5 py-1 rounded-lg border border-blue-900/50"
                            >
                              <Globe className="w-3 h-3" />
                              <span>View on gobiernu.cw</span>
                              <ExternalLink className="w-2.5 h-2.5 ml-0.5 opacity-70" />
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="p-4 pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                      <button
                        onClick={() => setPreviewPost(post)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Read Article</span>
                      </button>

                      <button
                        onClick={() => handleDeletePost(post.id)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-rose-400 transition cursor-pointer"
                        title="Delete from list"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}

              {filteredExternalGovPosts.length === 0 && (
                <div className="col-span-full p-12 text-center bg-slate-900/50 rounded-xl border border-slate-800 space-y-3">
                  <Globe className="w-8 h-8 text-blue-400 mx-auto" />
                  <p className="text-sm text-slate-300 font-semibold">No government news items found in this filter</p>
                  <p className="text-xs text-slate-500">Run a multi-subcategory scan to pull the latest 10 articles.</p>
                  <button
                    onClick={handleTriggerScanAllGobiernu}
                    disabled={isScanningAllGobiernu}
                    className="px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold inline-flex items-center gap-2 cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isScanningAllGobiernu ? 'animate-spin' : ''}`} />
                    <span>Scan Gobiernu.cw Now</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* VIEW 3: MEMBERS ACCOUNTS (RETRIEVE ALL USERS, VIEW & EDIT)  */}
        {/* ============================================================ */}
        {adminMenu === 'users' && (
          <div className="space-y-6">
            {/* Members Accounts Header Bar */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-2xl font-bold text-white tracking-tight">Members Accounts</h1>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {registeredUsers.length} Total
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Cloud DB Synced
                  </span>
                </div>
                <p className="text-sm text-slate-400 mt-1">
                  Retrieve, inspect, and manage all registered customer accounts, merchant POS terminals, and loyalty point balances across Firestore.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                {/* Retrieve / Sync from Cloud Button */}
                {/* Sync Database Button */}
                <button
                  id="admin-sync-users-btn"
                  onClick={handleRetrieveUsers}
                  disabled={isRetrievingUsers}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold shadow transition disabled:opacity-50"
                  title="Retrieve latest list of all members from cloud database"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-indigo-400 ${isRetrievingUsers ? 'animate-spin' : ''}`} />
                  <span>{isRetrievingUsers ? 'Syncing...' : 'Sync Database'}</span>
                </button>

                {/* Export CSV Button */}
                <button
                  id="admin-export-users-csv-btn"
                  onClick={handleExportUsersCSV}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold shadow transition"
                  title="Export all member records to CSV file"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Export CSV</span>
                </button>

                {/* Create New User Modal Button */}
                <button
                  id="admin-create-user-btn"
                  onClick={() => setIsCreateUserModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/25 transition"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>+ Create Member</span>
                </button>
              </div>
            </div>

            {/* Quick Metrics Bar for Members */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
                <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">All Accounts</span>
                <div className="mt-1 text-xl font-bold text-white">{registeredUsers.length}</div>
                <div className="text-[10px] text-indigo-400 mt-0.5">Active Directory</div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
                <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Customer Passes</span>
                <div className="mt-1 text-xl font-bold text-white">
                  {registeredUsers.filter(u => u.role === 'user' || !u.role).length}
                </div>
                <div className="text-[10px] text-emerald-400 mt-0.5">Mobile Pass Wallets</div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
                <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Merchant Terminals</span>
                <div className="mt-1 text-xl font-bold text-white">
                  {registeredUsers.filter(u => u.role === 'merchant').length}
                </div>
                <div className="text-[10px] text-amber-400 mt-0.5">POS Scan Terminals</div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
                <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Total Member Points</span>
                <div className="mt-1 text-xl font-bold text-white">
                  {registeredUsers.reduce((sum, u) => sum + (u.pointsBalance || 0), 0).toLocaleString()}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Points in circulation</div>
              </div>
            </div>

            {/* Filter Toolbar & View Mode Toggle */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  placeholder="Search by name, @username, email, pass ID..."
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white text-xs focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto justify-between sm:justify-end">
                <select
                  value={userRoleFilter}
                  onChange={(e) => setUserRoleFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 text-xs focus:border-indigo-500 focus:outline-none"
                >
                  <option value="all">All Roles ({registeredUsers.length})</option>
                  <option value="user">Customers ({registeredUsers.filter(u => u.role === 'user' || !u.role).length})</option>
                  <option value="merchant">Merchant POS ({registeredUsers.filter(u => u.role === 'merchant').length})</option>
                  <option value="admin">Administrators ({registeredUsers.filter(u => u.role === 'admin').length})</option>
                </select>

                <select
                  value={userTierFilter}
                  onChange={(e) => setUserTierFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 text-xs focus:border-indigo-500 focus:outline-none"
                >
                  <option value="all">All Tiers</option>
                  <option value="Bronze">Bronze Tier</option>
                  <option value="Silver">Silver Tier</option>
                  <option value="Gold">Gold Tier</option>
                  <option value="Platinum">Platinum Tier</option>
                </select>

                <select
                  value={userStatusFilter}
                  onChange={(e) => setUserStatusFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 text-xs focus:border-indigo-500 focus:outline-none"
                >
                  <option value="all">All Verification Status</option>
                  <option value="verified">Verified Only</option>
                  <option value="pending">Pending Verification</option>
                </select>

                {/* Table vs Cards Mode Toggle */}
                <div className="flex items-center rounded-lg bg-slate-900 border border-slate-800 p-0.5 shrink-0">
                  <button
                    onClick={() => setUsersViewMode('table')}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition ${
                      usersViewMode === 'table' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Table
                  </button>
                  <button
                    onClick={() => setUsersViewMode('cards')}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition ${
                      usersViewMode === 'cards' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Cards
                  </button>
                </div>
              </div>
            </div>

            {/* VIEW MODE 1: USERS TABLE */}
            {usersViewMode === 'table' && (
              <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-300">
                    <thead className="bg-slate-950/80 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="px-4 py-3.5">Member / Account</th>
                        <th className="px-4 py-3.5">Pass ID & Email</th>
                        <th className="px-4 py-3.5">Role</th>
                        <th className="px-4 py-3.5">Tier</th>
                        <th className="px-4 py-3.5">Email Status</th>
                        <th className="px-4 py-3.5">Points Balance</th>
                        <th className="px-4 py-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80">
                      {filteredUsers.map((user) => {
                        const isVerified = user.emailVerified !== false && user.status !== 'pending_verification';
                        return (
                          <tr key={user.username} className="hover:bg-slate-800/40 transition">
                            {/* Avatar & Name */}
                            <td className="px-4 py-3.5">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow">
                                  {user.fullName ? user.fullName.charAt(0) : user.username.charAt(0).toUpperCase()}
                                </div>
                                <div className="overflow-hidden">
                                  <p className="font-semibold text-white truncate">{user.fullName || user.username}</p>
                                  <p className="text-xs text-slate-400 font-mono">@{user.username}</p>
                                </div>
                              </div>
                            </td>

                            {/* Pass ID & Email */}
                            <td className="px-4 py-3.5">
                              <p className="text-xs font-mono text-indigo-300 font-semibold">{user.passId}</p>
                              <p className="text-xs text-slate-400 truncate">{user.email}</p>
                            </td>

                            {/* Role Badge */}
                            <td className="px-4 py-3.5">
                              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getRoleBadge(user.role)}`}>
                                {user.role || 'user'}
                              </span>
                            </td>

                            {/* Tier */}
                            <td className="px-4 py-3.5">
                              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getTierBadge(user.currentTier)}`}>
                                {user.currentTier || 'Bronze'}
                              </span>
                            </td>

                            {/* Verification & Status */}
                            <td className="px-4 py-3.5">
                              {isVerified ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                  Verified
                                </span>
                              ) : (
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                                    <Clock className="w-3 h-3 text-amber-400" />
                                    Pending
                                  </span>
                                  <button
                                    onClick={() => handleAdminVerifyEmail(user.username)}
                                    className="px-2 py-0.5 rounded bg-emerald-600/30 hover:bg-emerald-600 text-emerald-200 hover:text-white border border-emerald-500/30 text-[10px] font-bold transition"
                                    title="Verify and Activate Account Immediately"
                                  >
                                    Verify
                                  </button>
                                </div>
                              )}
                            </td>

                            {/* Point Balance */}
                            <td className="px-4 py-3.5">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-white text-base">
                                  {(user.pointsBalance ?? 0).toLocaleString()}
                                </span>
                                <span className="text-xs text-slate-400 font-mono">pts</span>
                              </div>
                              {user.lifetimePoints !== undefined && (
                                <div className="text-[10px] text-slate-500 font-mono">
                                  Lifetime: {user.lifetimePoints.toLocaleString()}
                                </div>
                              )}
                            </td>

                            {/* Actions */}
                            <td className="px-4 py-3.5 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {/* View Details Button */}
                                <button
                                  onClick={() => setSelectedUserForDetails(user)}
                                  className="px-2.5 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold transition"
                                  title="View Account Details & Balances"
                                >
                                  View
                                </button>

                                {/* Edit Button */}
                                <button
                                  onClick={() => setSelectedUserForEdit(user)}
                                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                                  title="Edit Member Account"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>

                                {/* Quick Adjust Points Button */}
                                <button
                                  onClick={() => {
                                    setSelectedUserForAdjust(user);
                                    setIsAdjustModalOpen(true);
                                  }}
                                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 transition"
                                  title="Adjust Points Balance"
                                >
                                  <Sparkles className="w-4 h-4" />
                                </button>

                                {/* Delete User */}
                                {user.username.toLowerCase() !== 'mambiadmin' && (
                                  <button
                                    onClick={() => promptDeleteUser(user)}
                                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-rose-400 transition cursor-pointer"
                                    title="Delete Member Account"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}

                      {filteredUsers.length === 0 && (
                        <tr>
                          <td colSpan={7} className="px-4 py-12 text-center text-slate-400 text-sm">
                            <div className="max-w-md mx-auto space-y-3">
                              <Users className="w-10 h-10 text-slate-600 mx-auto" />
                              <p className="font-semibold text-slate-300">No member accounts found in Firebase</p>
                              <p className="text-xs text-slate-500">
                                {userSearchQuery || userRoleFilter !== 'all' || userTierFilter !== 'all' || userStatusFilter !== 'all'
                                  ? 'No accounts match the current filter criteria.'
                                  : 'No member accounts currently exist in Firebase. You can create accounts with the button above or register new members.'}
                              </p>
                              <div className="flex items-center justify-center gap-2 pt-2">
                                <button
                                  type="button"
                                  onClick={() => setIsCreateUserModalOpen(true)}
                                  className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow transition flex items-center gap-1.5"
                                >
                                  <UserPlus className="w-3.5 h-3.5" />
                                  <span>+ Create Member</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={handleRetrieveUsers}
                                  className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition flex items-center gap-1.5"
                                >
                                  <RefreshCw className="w-3.5 h-3.5" />
                                  <span>Sync Database</span>
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* VIEW MODE 2: MEMBERS CARDS GRID */}
            {usersViewMode === 'cards' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredUsers.map((user) => {
                  const isVerified = user.emailVerified !== false && user.status !== 'pending_verification';
                  return (
                    <div
                      key={user.username}
                      className="p-5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between gap-4 shadow-lg"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-base shadow">
                              {user.fullName ? user.fullName.charAt(0) : user.username.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <h3 className="font-bold text-white text-base leading-snug">{user.fullName || user.username}</h3>
                              <p className="text-xs text-slate-400 font-mono">@{user.username}</p>
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-1">
                            <span className={`px-2 py-0.5 rounded text-[11px] font-semibold uppercase border ${getRoleBadge(user.role)}`}>
                              {user.role || 'user'}
                            </span>
                            {isVerified ? (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
                                <Check className="w-2.5 h-2.5" /> Verified
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-medium text-amber-400 bg-amber-500/10 border border-amber-500/30">
                                <Clock className="w-2.5 h-2.5" /> Pending
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="mt-4 space-y-2 text-xs">
                          <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                            <span className="text-slate-400">Pass ID</span>
                            <span className="font-mono text-indigo-300 font-semibold">{user.passId}</span>
                          </div>
                          <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                            <span className="text-slate-400">Email</span>
                            <span className="text-slate-300 truncate max-w-[170px]">{user.email}</span>
                          </div>
                          <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                            <span className="text-slate-400">Loyalty Tier</span>
                            <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${getTierBadge(user.currentTier)}`}>
                              {user.currentTier || 'Bronze'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                            <span className="text-slate-400">Points Balance</span>
                            <span className="font-bold text-white text-sm">
                              {(user.pointsBalance ?? 0).toLocaleString()} <span className="text-[10px] text-slate-400">pts</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setSelectedUserForDetails(user)}
                            className="px-2.5 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold transition"
                          >
                            View
                          </button>
                          {!isVerified && (
                            <button
                              onClick={() => handleAdminVerifyEmail(user.username)}
                              className="px-2 py-1 rounded-lg bg-emerald-600/30 hover:bg-emerald-600 text-emerald-200 hover:text-white border border-emerald-500/30 text-xs font-semibold transition flex items-center gap-1"
                              title="Activate & Verify Email"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Verify</span>
                            </button>
                          )}
                          <button
                            onClick={() => setSelectedUserForEdit(user)}
                            className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                            title="Edit Account"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedUserForAdjust(user);
                              setIsAdjustModalOpen(true);
                            }}
                            className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 transition"
                            title="Adjust Points"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {user.username.toLowerCase() !== 'mambiadmin' && (
                          <button
                            onClick={() => promptDeleteUser(user)}
                            className="p-1 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-rose-400 transition cursor-pointer"
                            title="Delete Account"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* ============================================================ */}
      {/* MODAL 1: VIEW USER DETAILS & POINT BALANCE                   */}
      {/* ============================================================ */}
      <AnimatePresence>
        {selectedUserForDetails && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 space-y-6 text-slate-100 relative"
            >
              <button
                onClick={() => setSelectedUserForDetails(null)}
                className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Header */}
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-indigo-500/20">
                  {selectedUserForDetails.fullName.charAt(0)}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{selectedUserForDetails.fullName}</h3>
                  <p className="text-sm text-slate-400 font-mono">@{selectedUserForDetails.username}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${getRoleBadge(selectedUserForDetails.role)}`}>
                      {selectedUserForDetails.role}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${getTierBadge(selectedUserForDetails.currentTier)}`}>
                      {selectedUserForDetails.currentTier || 'Bronze'} Tier
                    </span>
                    {selectedUserForDetails.emailVerified !== false && selectedUserForDetails.status !== 'pending_verification' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                        <Clock className="w-3 h-3 text-amber-400" />
                        Pending Verification
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Point Balance Showcase Card */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-slate-950 to-slate-900 border border-indigo-500/30 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3 opacity-10">
                  <Award className="w-24 h-24 text-indigo-400" />
                </div>
                <p className="text-xs font-semibold uppercase tracking-wider text-indigo-300">Current Point Balance</p>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-white">
                    {(selectedUserForDetails.pointsBalance ?? 0).toLocaleString()}
                  </span>
                  <span className="text-sm font-semibold text-indigo-400">OmniPoints</span>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                  <span>Lifetime Earned: {(selectedUserForDetails.lifetimePoints ?? selectedUserForDetails.pointsBalance ?? 0).toLocaleString()} pts</span>
                  <button
                    onClick={() => {
                      setSelectedUserForAdjust(selectedUserForDetails);
                      setIsAdjustModalOpen(true);
                    }}
                    className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Adjust Points</span>
                  </button>
                </div>
              </div>

              {/* Credentials & Info */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                  <span className="text-slate-500 font-medium">Pass ID</span>
                  <p className="font-mono text-slate-200 mt-1 font-semibold">{selectedUserForDetails.passId}</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                  <span className="text-slate-500 font-medium">Security PIN</span>
                  <p className="font-mono text-slate-200 mt-1 font-semibold">{selectedUserForDetails.pinCode || '•••••'}</p>
                </div>
                <div className="col-span-2 p-3 rounded-lg bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-slate-500 font-medium">Email Address</span>
                    <p className="text-slate-200 mt-1">{selectedUserForDetails.email}</p>
                  </div>
                  {selectedUserForDetails.emailVerified === false || selectedUserForDetails.status === 'pending_verification' ? (
                    <button
                      onClick={() => handleAdminVerifyEmail(selectedUserForDetails.username)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow transition"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Verify & Activate</span>
                    </button>
                  ) : null}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => {
                    setSelectedUserForEdit(selectedUserForDetails);
                    setSelectedUserForDetails(null);
                  }}
                  className="flex-1 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition cursor-pointer"
                >
                  Edit Profile
                </button>
                {selectedUserForDetails.username.toLowerCase() !== 'mambiadmin' && (
                  <button
                    onClick={() => {
                      promptDeleteUser(selectedUserForDetails);
                    }}
                    className="px-3.5 py-2.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
                    title="Delete Account"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                )}
                <button
                  onClick={() => setSelectedUserForDetails(null)}
                  className="px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ============================================================ */}
      {/* MODAL 2: CREATE NEW USER MANUALLY                            */}
      {/* ============================================================ */}
      <AnimatePresence>
        {isCreateUserModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 space-y-5 text-slate-100 relative"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <UserPlus className="w-5 h-5 text-indigo-400" />
                  <h3 className="text-lg font-bold text-white">Create New User Account</h3>
                </div>
                <button
                  onClick={() => setIsCreateUserModalOpen(false)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateUser} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Username *</label>
                    <input
                      type="text"
                      required
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      placeholder="e.g. elenag"
                      className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:border-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={newFullName}
                      onChange={(e) => setNewFullName(e.target.value)}
                      placeholder="e.g. Elena Gomez"
                      className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Email Address</label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="elena@example.com"
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Account Role</label>
                    <select
                      value={newRole}
                      onChange={(e: any) => setNewRole(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:border-indigo-500 focus:outline-none"
                    >
                      <option value="user">Customer / Pass Holder</option>
                      <option value="merchant">Merchant POS</option>
                      <option value="admin">Administrator</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Initial Tier</label>
                    <select
                      value={newTier}
                      onChange={(e: any) => setNewTier(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:border-indigo-500 focus:outline-none"
                    >
                      <option value="Bronze">Bronze Tier</option>
                      <option value="Silver">Silver Tier</option>
                      <option value="Gold">Gold Tier</option>
                      <option value="Platinum">Platinum Tier</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Starting Points</label>
                    <input
                      type="number"
                      value={newInitialPoints}
                      onChange={(e) => setNewInitialPoints(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:border-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">5-digit PIN</label>
                    <input
                      type="text"
                      maxLength={5}
                      value={newPinCode}
                      onChange={(e) => setNewPinCode(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm font-mono focus:border-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Password</label>
                    <input
                      type="text"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-3">
                  <button
                    type="submit"
                    disabled={isSubmittingUser}
                    className="flex-1 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/25 transition"
                  >
                    {isSubmittingUser ? 'Creating...' : 'Create User Account'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCreateUserModalOpen(false)}
                    className="px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ============================================================ */}
      {/* MODAL 3: EDIT USER DETAILS                                   */}
      {/* ============================================================ */}
      <AnimatePresence>
        {selectedUserForEdit && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 space-y-5 text-slate-100 relative"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <Edit3 className="w-5 h-5 text-indigo-400" />
                  <h3 className="text-lg font-bold text-white">Edit User: @{selectedUserForEdit.username}</h3>
                </div>
                <button
                  onClick={() => setSelectedUserForEdit(null)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleUpdateUser} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Full Name</label>
                    <input
                      type="text"
                      value={selectedUserForEdit.fullName}
                      onChange={(e) => setSelectedUserForEdit({ ...selectedUserForEdit, fullName: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:border-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Email</label>
                    <input
                      type="email"
                      value={selectedUserForEdit.email}
                      onChange={(e) => setSelectedUserForEdit({ ...selectedUserForEdit, email: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Role</label>
                    <select
                      value={selectedUserForEdit.role}
                      onChange={(e: any) => setSelectedUserForEdit({ ...selectedUserForEdit, role: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:border-indigo-500 focus:outline-none"
                    >
                      <option value="user">Customer</option>
                      <option value="merchant">Merchant POS</option>
                      <option value="admin">Administrator</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Tier</label>
                    <select
                      value={selectedUserForEdit.currentTier}
                      onChange={(e: any) => setSelectedUserForEdit({ ...selectedUserForEdit, currentTier: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:border-indigo-500 focus:outline-none"
                    >
                      <option value="Bronze">Bronze Tier</option>
                      <option value="Silver">Silver Tier</option>
                      <option value="Gold">Gold Tier</option>
                      <option value="Platinum">Platinum Tier</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Points Balance</label>
                    <input
                      type="number"
                      value={selectedUserForEdit.pointsBalance ?? 0}
                      onChange={(e) => setSelectedUserForEdit({ ...selectedUserForEdit, pointsBalance: parseInt(e.target.value, 10) || 0 })}
                      className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:border-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Security PIN</label>
                    <input
                      type="text"
                      value={selectedUserForEdit.pinCode || ''}
                      onChange={(e) => setSelectedUserForEdit({ ...selectedUserForEdit, pinCode: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm font-mono focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-3">
                  <button
                    type="submit"
                    disabled={isSubmittingUser}
                    className="flex-1 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/25 transition"
                  >
                    {isSubmittingUser ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedUserForEdit(null)}
                    className="px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ============================================================ */}
      {/* MODAL 4: QUICK POINTS ADJUSTMENT MODAL                       */}
      {/* ============================================================ */}
      <AnimatePresence>
        {isAdjustModalOpen && selectedUserForAdjust && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 space-y-4 text-slate-100 relative"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  <h3 className="text-base font-bold text-white">Adjust Loyalty Points</h3>
                </div>
                <button
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs">
                <p className="text-slate-400">Target User: <span className="font-bold text-white">{selectedUserForAdjust.fullName}</span> (@{selectedUserForAdjust.username})</p>
                <p className="text-slate-400 mt-1">Current Balance: <span className="font-bold text-indigo-400">{(selectedUserForAdjust.pointsBalance ?? 0).toLocaleString()} pts</span></p>
              </div>

              <form onSubmit={handleQuickAdjustPoints} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Points Delta (+ or -)</label>
                  <input
                    type="number"
                    required
                    value={adjustPointsDelta}
                    onChange={(e) => setAdjustPointsDelta(e.target.value)}
                    placeholder="e.g. +100 or -50"
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm font-bold focus:border-indigo-500 focus:outline-none"
                  />
                  <div className="flex items-center gap-1.5 mt-2">
                    {[50, 100, 250, 500, -100].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setAdjustPointsDelta(String(preset))}
                        className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 font-mono"
                      >
                        {preset > 0 ? `+${preset}` : preset}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Adjustment Reason / Note</label>
                  <input
                    type="text"
                    value={adjustNote}
                    onChange={(e) => setAdjustNote(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={isAdjusting}
                    className="flex-1 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition"
                  >
                    {isAdjusting ? 'Processing...' : 'Apply Points Adjustment'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAdjustModalOpen(false)}
                    className="px-3 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ============================================================ */}
      {/* MODAL 5: CREATE / EDIT POST MODAL                            */}
      {/* ============================================================ */}
      <AnimatePresence>
        {isCreatePostModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 space-y-5 text-slate-100 relative max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <FileText className="w-5 h-5 text-indigo-400" />
                  <h3 className="text-lg font-bold text-white">
                    {editingPost ? 'Edit Post' : 'Create New Post & Announcement'}
                  </h3>
                </div>
                <button
                  onClick={() => setIsCreatePostModalOpen(false)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Photo Presets */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">Preset Banner Images</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: 'Artisan Coffee', url: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1200&q=80' },
                    { label: 'Tier Perks', url: 'https://images.unsplash.com/photo-1556742049-0a67c5574f73?auto=format&fit=crop&w=1200&q=80' },
                    { label: 'Merchant POS', url: 'https://images.unsplash.com/photo-1556740758-90de374c12ad?auto=format&fit=crop&w=1200&q=80' },
                    { label: 'Store Bakery', url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1200&q=80' }
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setPostImageUrl(preset.url)}
                      className={`p-1.5 rounded-lg border text-left text-xs transition ${
                        postImageUrl === preset.url
                          ? 'border-indigo-500 bg-indigo-950/40 text-white'
                          : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <p className="font-semibold truncate">{preset.label}</p>
                    </button>
                  ))}
                </div>
              </div>

              <form onSubmit={handleSavePost} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Post Title *</label>
                  <input
                    type="text"
                    required
                    value={postTitle}
                    onChange={(e) => setPostTitle(e.target.value)}
                    placeholder="e.g. Double Points Weekend across All Artisan Coffee Locations ☕"
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Category</label>
                    <select
                      value={postCategory}
                      onChange={(e: any) => setPostCategory(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs focus:border-indigo-500 focus:outline-none"
                    >
                      <option value="Promotion">Promotion</option>
                      <option value="Announcement">Announcement</option>
                      <option value="Update">Update</option>
                      <option value="Reward Alert">Reward Alert</option>
                      <option value="Community">Community</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Target Audience</label>
                    <select
                      value={postAudience}
                      onChange={(e: any) => setPostAudience(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs focus:border-indigo-500 focus:outline-none"
                    >
                      <option value="all">All Members</option>
                      <option value="user">Customer Pass Only</option>
                      <option value="merchant">Merchant POS Only</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Status</label>
                    <select
                      value={postStatus}
                      onChange={(e: any) => setPostStatus(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs focus:border-indigo-500 focus:outline-none"
                    >
                      <option value="published">Published (Live)</option>
                      <option value="draft">Draft (Private)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Banner Image URL</label>
                  <input
                    type="url"
                    value={postImageUrl}
                    onChange={(e) => setPostImageUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs focus:border-indigo-500 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Post Content *</label>
                  <textarea
                    rows={4}
                    required
                    value={postContent}
                    onChange={(e) => setPostContent(e.target.value)}
                    placeholder="Write detailed announcements, promotion rules, discount codes, or partner notes..."
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:border-indigo-500 focus:outline-none leading-relaxed"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="post-featured-chk"
                    checked={postFeatured}
                    onChange={(e) => setPostFeatured(e.target.checked)}
                    className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-0"
                  />
                  <label htmlFor="post-featured-chk" className="text-xs text-slate-300 font-medium">
                    Pin as Featured Post at Top of Feed
                  </label>
                </div>

                {/* Notification Title Preview */}
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs flex items-start gap-2.5">
                  <Bell className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                  <div className="space-y-0.5">
                    <p className="font-semibold text-slate-200">
                      Automated Push Notification Title:
                    </p>
                    <p className="font-mono text-[11px] text-amber-300">
                      {postCategory === 'Promotion' || postCategory === 'Reward Alert' ? (
                        <span>🏷️ PROMO PUSH: {postTitle || 'Merchant Promotion Title'}</span>
                      ) : (
                        <span>📰 NEWS PUSH: {postTitle || 'News Announcement Title'}</span>
                      )}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      Promotions generate "PROMO PUSH" alerts across all member devices.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-3">
                  <button
                    type="submit"
                    disabled={isSubmittingPost}
                    className="flex-1 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/25 transition"
                  >
                    {isSubmittingPost ? 'Saving...' : editingPost ? 'Update Post' : 'Publish Post'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCreatePostModalOpen(false)}
                    className="px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ============================================================ */}
      {/* MODAL 6: PREVIEW POST MODAL                                  */}
      {/* ============================================================ */}
      <AnimatePresence>
        {previewPost && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden text-slate-100 relative"
            >
              <button
                onClick={() => setPreviewPost(null)}
                className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-slate-950/70 text-slate-300 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>

              {previewPost.imageUrl && (() => {
                const isGov =
                  previewPost.imageUrl.includes('gobiernu_2x.png') ||
                  previewPost.imageUrl.includes('gobiernu-logo') ||
                  previewPost.imageUrl.includes('emblem');
                return (
                  <div className={`relative h-48 w-full bg-slate-950 overflow-hidden ${isGov ? 'flex items-center justify-center p-6' : ''}`}>
                    <img
                      src={previewPost.imageUrl}
                      alt={previewPost.title}
                      className={isGov ? 'max-h-32 max-w-[200px] object-contain mx-auto' : 'w-full h-full object-cover'}
                      referrerPolicy="no-referrer"
                    />
                    {!isGov && (
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
                    )}
                    <span className="absolute bottom-3 left-4 px-2.5 py-1 rounded bg-indigo-600 text-white text-xs font-bold shadow-xs">
                      {previewPost.category}
                    </span>
                  </div>
                );
              })()}

              <div className="p-5 space-y-3">
                <div className="text-xs text-slate-400 flex items-center justify-between">
                  <span>Author: {previewPost.author}</span>
                  <span>{new Date(previewPost.createdAt).toLocaleDateString()}</span>
                </div>
                <h3 className="text-lg font-bold text-white">{previewPost.title}</h3>
                <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">{previewPost.content}</p>

                {previewPost.sourceUrl && (
                  <div className="pt-2">
                    <a
                      href={previewPost.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition"
                    >
                      <Globe className="w-4 h-4" />
                      <span>View Official Source Article (gobiernu.cw)</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                  <span>Target: {previewPost.targetAudience}</span>
                  <span className="text-emerald-400 font-semibold uppercase">{previewPost.status}</span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ============================================================ */}
      {/* MODAL: GOBIERNU.CW LIVE 10 NIEUWS POSTS IMPORTER            */}
      {/* ============================================================ */}
      <AnimatePresence>
        {isGobiernuModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-4xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 space-y-5 text-slate-100 relative max-h-[92vh] flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-800 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-white">Gobiernu di Kòrsou (gobiernu.cw)</h3>
                      <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 text-[10px] font-bold uppercase tracking-wider">
                        WordPress REST API
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Live feed of the latest 10 official news posts & announcements directly from gobiernu.cw
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsGobiernuModalOpen(false)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Action Toolbar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800 shrink-0">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleToggleSelectAllGobiernu}
                    disabled={isFetchingGobiernu || gobiernuNewsList.length === 0}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                  >
                    {selectedGobiernuIds.length === gobiernuNewsList.length && gobiernuNewsList.length > 0
                      ? 'Deselect All'
                      : `Select All (${gobiernuNewsList.length})`}
                  </button>
                  <span className="text-xs text-slate-400">
                    {selectedGobiernuIds.length} of {gobiernuNewsList.length} articles selected
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleOpenGobiernuNews}
                    disabled={isFetchingGobiernu}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isFetchingGobiernu ? 'animate-spin' : ''}`} />
                    <span>Refresh Live Feed</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickImportGobiernu()}
                    disabled={isImportingGobiernu || isFetchingGobiernu || selectedGobiernuIds.length === 0}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-blue-600/20 transition cursor-pointer disabled:opacity-50"
                  >
                    {isImportingGobiernu ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Importing to Posts Feed...</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-3.5 h-3.5" />
                        <span>Import Selected ({selectedGobiernuIds.length}) to Posts</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Feed Content Area */}
              <div className="flex-1 overflow-y-auto pr-1 space-y-3">
                {isFetchingGobiernu ? (
                  <div className="py-16 text-center space-y-3">
                    <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mx-auto" />
                    <p className="text-sm font-semibold text-white">Connecting to https://gobiernu.cw...</p>
                    <p className="text-xs text-slate-400">Fetching the latest 10 ministers & government news items.</p>
                  </div>
                ) : gobiernuNewsList.length === 0 ? (
                  <div className="py-16 text-center space-y-3 bg-slate-950/40 rounded-xl border border-slate-800">
                    <Globe className="w-10 h-10 text-slate-600 mx-auto" />
                    <p className="text-sm font-semibold text-white">No news items returned</p>
                    <button
                      onClick={handleOpenGobiernuNews}
                      className="px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-500 transition"
                    >
                      Retry Connection
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {gobiernuNewsList.map((item, idx) => {
                      const isSelected = selectedGobiernuIds.includes(item.id);
                      return (
                        <div
                          key={item.id}
                          onClick={() => handleToggleSelectGobiernuItem(item.id)}
                          className={`p-4 rounded-xl border transition cursor-pointer flex gap-3.5 ${
                            isSelected
                              ? 'bg-blue-950/30 border-blue-500/60 ring-1 ring-blue-500/40'
                              : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="pt-0.5">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              className="rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-0 cursor-pointer"
                            />
                          </div>

                          <div className="space-y-2 flex-1 min-w-0">
                            <div className="flex items-center justify-between text-[11px] text-slate-400">
                              <div className="flex items-center gap-1.5">
                                <span className="px-1.5 py-0.5 bg-blue-900/40 text-blue-300 font-semibold rounded text-[10px]">
                                  #{idx + 1}
                                </span>
                                <span className="px-2 py-0.5 bg-indigo-900/40 text-indigo-300 font-semibold rounded text-[10px]">
                                  {item.subCategory || item.sourceType || 'Notisia'}
                                </span>
                              </div>
                              <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                            </div>

                            <div className="flex items-start gap-2.5">
                              <img
                                src={item.imageUrl || '/gobiernu_2x.png'}
                                alt=""
                                className="w-12 h-12 rounded-lg bg-white object-contain p-1 shrink-0 border border-slate-700"
                                onError={(e) => {
                                  (e.currentTarget as HTMLImageElement).src = '/gobiernu_2x.png';
                                  (e.currentTarget as HTMLImageElement).className = 'w-12 h-12 rounded-lg bg-white object-contain p-1 shrink-0 border border-slate-700';
                                }}
                              />
                              <div className="min-w-0 flex-1">
                                <h4 className="text-sm font-bold text-white line-clamp-2 leading-snug">
                                  {item.title}
                                </h4>
                              </div>
                            </div>

                            <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                              {item.excerpt || item.content}
                            </p>

                            <div className="pt-1 flex items-center justify-between">
                              {item.sourceUrl && (
                                <a
                                  href={item.sourceUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="inline-flex items-center gap-1 text-[10px] text-blue-400 hover:text-blue-300 underline font-medium"
                                >
                                  <span>View on gobiernu.cw</span>
                                  <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                              )}

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleQuickImportGobiernu([item.id]);
                                }}
                                disabled={isImportingGobiernu}
                                className="px-2 py-1 rounded bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white text-[11px] font-semibold transition cursor-pointer"
                              >
                                Import this post
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 shrink-0">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Direct sync from official Government of Curaçao Portal (gobiernu.cw)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsGobiernuModalOpen(false)}
                    className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ============================================================ */}
      {/* MODAL 7: ONBOARD STORE MODAL                                 */}
      {/* ============================================================ */}
      <AnimatePresence>
        {isAddStoreModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 space-y-4 text-slate-100 relative"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <StoreIcon className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-base font-bold text-white">Onboard Partner Store</h3>
                </div>
                <button
                  onClick={() => setIsAddStoreModalOpen(false)}
                  className="p-1 rounded bg-slate-800 text-slate-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddStore} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Store Name *</label>
                  <input
                    type="text"
                    required
                    value={newStoreName}
                    onChange={(e) => setNewStoreName(e.target.value)}
                    placeholder="e.g. Ritual Coffee Roasters"
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Category</label>
                    <select
                      value={newStoreCategory}
                      onChange={(e) => setNewStoreCategory(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none"
                    >
                      <option value="Coffee">Coffee & Tea</option>
                      <option value="Dining">Dining</option>
                      <option value="Bakery">Bakery</option>
                      <option value="Retail">Retail</option>
                      <option value="Fitness">Fitness</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Points Rate</label>
                    <input
                      type="number"
                      value={newStorePointsRate}
                      onChange={(e) => setNewStorePointsRate(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Street Address *</label>
                  <input
                    type="text"
                    required
                    value={newStoreAddress}
                    onChange={(e) => setNewStoreAddress(e.target.value)}
                    placeholder="e.g. 1026 Valencia St"
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={isSubmittingStore}
                    className="flex-1 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition"
                  >
                    {isSubmittingStore ? 'Adding...' : 'Onboard Partner Store'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddStoreModalOpen(false)}
                    className="px-3 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ============================================================ */}
      {/* MODAL 8: CONFIRM ACCOUNT DELETION MODAL                      */}
      {/* ============================================================ */}
      <AnimatePresence>
        {userToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-2xl bg-slate-900 border border-rose-500/30 shadow-2xl p-6 space-y-5 text-slate-100 relative"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Delete Member Account?</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    This action will permanently delete the account from Firebase Firestore and the system database.
                  </p>
                </div>
              </div>

              {/* Target User Info Summary */}
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2.5 text-xs">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                  <span className="text-slate-400 font-medium">User:</span>
                  <div className="text-right">
                    <span className="font-bold text-white">{userToDelete.fullName}</span>
                    <span className="text-slate-400 font-mono ml-1.5">(@{userToDelete.username})</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-slate-400">
                  <span>Email:</span>
                  <span className="text-slate-200 font-medium">{userToDelete.email}</span>
                </div>

                <div className="flex items-center justify-between text-slate-400">
                  <span>Pass ID / Role:</span>
                  <span className="font-mono text-indigo-300 font-semibold">{userToDelete.passId} ({userToDelete.role})</span>
                </div>

                <div className="flex items-center justify-between text-slate-400">
                  <span>Points Balance:</span>
                  <span className="font-bold text-amber-300">{(userToDelete.pointsBalance ?? 0).toLocaleString()} pts ({userToDelete.currentTier || 'Bronze'})</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-500/20 text-[11px] text-rose-300 leading-relaxed">
                ⚠️ <strong>Warning:</strong> Deleting this account cannot be undone. All reward vouchers, transaction records, and pass credentials will be cleared.
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={confirmDeleteUser}
                  disabled={isDeletingUser}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-rose-600/20 cursor-pointer disabled:opacity-50"
                >
                  {isDeletingUser ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Deleting Account...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Yes, Delete Account</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setUserToDelete(null)}
                  disabled={isDeletingUser}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
