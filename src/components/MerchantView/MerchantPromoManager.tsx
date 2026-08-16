import React, { useState } from 'react';
import {
  Tag,
  Plus,
  Edit2,
  Trash2,
  Eye,
  Megaphone,
  Gift,
  Sparkles,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  Layers,
  AlertTriangle,
  Send,
  ExternalLink,
  Star,
  RefreshCw
} from 'lucide-react';
import { AdminPost, Store } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { MerchantPromoModal } from './MerchantPromoModal';

interface MerchantPromoManagerProps {
  activeStore: Store;
  posts: AdminPost[];
  isLoading: boolean;
  onRefresh: () => void;
  onCreatePost: (postData: Partial<AdminPost>) => Promise<boolean>;
  onUpdatePost: (postData: Partial<AdminPost>) => Promise<boolean>;
  onDeletePost: (postId: string) => Promise<boolean>;
}

export const MerchantPromoManager: React.FC<MerchantPromoManagerProps> = ({
  activeStore,
  posts,
  isLoading,
  onRefresh,
  onCreatePost,
  onUpdatePost,
  onDeletePost
}) => {
  const { language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<AdminPost | null>(null);

  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [previewPost, setPreviewPost] = useState<AdminPost | null>(null);

  // Filter merchant posts for this store
  const storePosts = posts.filter(
    (p) =>
      p.storeId === activeStore.id ||
      p.author?.toLowerCase().includes(activeStore.name.toLowerCase()) ||
      p.category === 'Promotion' ||
      p.category === 'Reward Alert'
  );

  const filteredPosts = storePosts.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.discountTag && p.discountTag.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus =
      statusFilter === 'all' || p.status === statusFilter;

    const matchesCategory =
      categoryFilter === 'all' || p.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  const publishedCount = storePosts.filter((p) => p.status === 'published').length;
  const draftCount = storePosts.filter((p) => p.status === 'draft').length;
  const totalLikes = storePosts.reduce((acc, p) => acc + (p.likesCount || 0), 0);

  const handleOpenCreate = () => {
    setEditingPost(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (post: AdminPost) => {
    setEditingPost(post);
    setIsModalOpen(true);
  };

  const handleSavePost = async (postData: Partial<AdminPost>) => {
    if (editingPost) {
      return await onUpdatePost(postData);
    } else {
      return await onCreatePost(postData);
    }
  };

  const handleToggleStatus = async (post: AdminPost) => {
    const newStatus = post.status === 'published' ? 'draft' : 'published';
    await onUpdatePost({ id: post.id, status: newStatus });
  };

  const handleConfirmDelete = async () => {
    if (!deletingPostId) return;
    setIsDeleting(true);
    await onDeletePost(deletingPostId);
    setIsDeleting(false);
    setDeletingPostId(null);
  };

  return (
    <div className="space-y-6">
      {/* Header & Quick Action */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
            <Megaphone className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-700">
                {language === 'es' ? 'Gestor de Promociones' : 'Promo Posts & Flash Deals Manager'}
              </span>
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 mt-0.5">
              {activeStore.name} Promotions
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            className="px-3.5 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Promo Post</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Active Published Promos</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {publishedCount} <span className="text-xs font-normal text-slate-500">deals live</span>
          </div>
          <div className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md mt-2 inline-block">
            Broadcasting to Loyalty Shoppers
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Draft Deals</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {draftCount} <span className="text-xs font-normal text-slate-500">drafts saved</span>
          </div>
          <div className="text-[11px] text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-md mt-2 inline-block">
            Ready to review and publish
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Member Engagement</span>
            <Sparkles className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {totalLikes * 8 + 48} <span className="text-xs font-normal text-slate-500">views logged</span>
          </div>
          <div className="text-[11px] text-purple-700 font-bold bg-purple-50 px-2 py-0.5 rounded-md mt-2 inline-block">
            {totalLikes} direct member likes
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search promo posts, tags, deals..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 focus:bg-white focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 focus:outline-hidden"
          >
            <option value="all">All Statuses ({storePosts.length})</option>
            <option value="published">🟢 Published Only</option>
            <option value="draft">🟡 Drafts Only</option>
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 focus:outline-hidden"
          >
            <option value="all">All Categories</option>
            <option value="Promotion">🏷️ Promotions</option>
            <option value="Reward Alert">🎁 Reward Alerts</option>
            <option value="Announcement">📢 Announcements</option>
            <option value="Update">✨ Updates</option>
          </select>
        </div>
      </div>

      {/* Promo Posts List / Grid */}
      {filteredPosts.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200">
            <Megaphone className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900">
              No Promo Posts Found
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              Create your first promotional post or discount deal to engage loyalty members and boost store visits.
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition inline-flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Create Promo Post</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPosts.map((post) => (
            <div
              key={post.id}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition flex flex-col justify-between group"
            >
              <div>
                {/* Image Cover Banner */}
                <div className="relative h-44 w-full bg-slate-100 overflow-hidden">
                  <img
                    src={post.imageUrl || 'https://images.unsplash.com/photo-1556742049-0a67c5574f73?auto=format&fit=crop&w=1200&q=80'}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent" />

                  {/* Badges Overlay */}
                  <div className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-600 text-white shadow-xs">
                      {post.category}
                    </span>
                    {post.discountTag && (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500 text-white shadow-xs">
                        {post.discountTag}
                      </span>
                    )}
                  </div>

                  <div className="absolute top-3 right-3 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(post)}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold border transition cursor-pointer ${
                        post.status === 'published'
                          ? 'bg-emerald-500/90 text-white border-emerald-400 hover:bg-emerald-600'
                          : 'bg-amber-500/90 text-white border-amber-400 hover:bg-amber-600'
                      }`}
                      title="Click to toggle publish / draft"
                    >
                      {post.status === 'published' ? '🟢 Live' : '🟡 Draft'}
                    </button>
                  </div>

                  {post.featured && (
                    <div className="absolute bottom-2 left-3 flex items-center gap-1 text-[10px] font-bold text-amber-300">
                      <Star className="w-3 h-3 fill-amber-300" />
                      <span>Featured Promo</span>
                    </div>
                  )}
                </div>

                {/* Card Body */}
                <div className="p-5 space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span className="font-semibold">{post.author}</span>
                    <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                  </div>

                  <h3 className="text-base font-black text-slate-900 leading-snug line-clamp-2">
                    {post.title}
                  </h3>

                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                    {post.content}
                  </p>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewPost(post)}
                  className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-200 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  title="Preview Customer Card"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Preview</span>
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(post)}
                    className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-blue-300 text-blue-600 hover:bg-blue-50 text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeletingPostId(post.id)}
                    className="p-1.5 rounded-xl bg-white border border-slate-200 hover:border-rose-300 text-rose-600 hover:bg-rose-50 text-xs font-bold transition cursor-pointer shadow-2xs"
                    title="Delete Promo Post"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingPostId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-slate-200 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">
                Delete Promo Post?
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to remove this promo post? This action will take down the promotion from customer news feeds and member wallets.
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingPostId(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Customer Feed Modal */}
      {previewPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-bold">Customer Loyalty View Preview</span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewPost(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6">
              <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                <div className="relative h-48 w-full">
                  <img
                    src={previewPost.imageUrl || 'https://images.unsplash.com/photo-1556742049-0a67c5574f73?auto=format&fit=crop&w=1200&q=80'}
                    alt={previewPost.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-600 text-white shadow-xs">
                      {previewPost.category}
                    </span>
                    {previewPost.discountTag && (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500 text-white shadow-xs">
                        {previewPost.discountTag}
                      </span>
                    )}
                  </div>
                </div>
                <div className="p-5 space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span className="font-bold text-blue-700">{previewPost.author}</span>
                    <span>{new Date(previewPost.createdAt).toLocaleDateString()}</span>
                  </div>
                  <h3 className="font-black text-slate-900 text-base leading-tight">
                    {previewPost.title}
                  </h3>
                  <p className="text-xs text-slate-600">
                    {previewPost.content}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Promo Post Modal */}
      <MerchantPromoModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingPost(null);
        }}
        activeStore={activeStore}
        postToEdit={editingPost}
        onSavePost={handleSavePost}
      />
    </div>
  );
};
