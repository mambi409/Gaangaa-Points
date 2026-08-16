import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Tag,
  Image as ImageIcon,
  Send,
  Eye,
  CheckCircle2,
  Calendar,
  Layers,
  AlertCircle,
  Megaphone,
  Gift,
  FileText,
  Star
} from 'lucide-react';
import { AdminPost, Store } from '../../types';
import { useLanguage } from '../../context/LanguageContext';

interface MerchantPromoModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeStore: Store;
  postToEdit?: AdminPost | null;
  onSavePost: (postData: Partial<AdminPost>) => Promise<boolean>;
}

const PROMO_IMAGE_PRESETS = [
  {
    label: 'Coffee & Cafe',
    url: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1200&q=80'
  },
  {
    label: 'Dining & Food',
    url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80'
  },
  {
    label: 'Fashion & Apparel',
    url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80'
  },
  {
    label: 'Bakery & Pastries',
    url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1200&q=80'
  },
  {
    label: 'Tech & Electronics',
    url: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=1200&q=80'
  },
  {
    label: 'VIP Double Points',
    url: 'https://images.unsplash.com/photo-1556742049-0a67c5574f73?auto=format&fit=crop&w=1200&q=80'
  },
  {
    label: 'Flash Weekend Sale',
    url: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=1200&q=80'
  },
  {
    label: 'Loyalty Gift Box',
    url: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=1200&q=80'
  }
];

export const MerchantPromoModal: React.FC<MerchantPromoModalProps> = ({
  isOpen,
  onClose,
  activeStore,
  postToEdit,
  onSavePost
}) => {
  const { language } = useLanguage();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<'Promotion' | 'Reward Alert' | 'Announcement' | 'Update'>('Promotion');
  const [discountTag, setDiscountTag] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [targetAudience, setTargetAudience] = useState<'all' | 'user'>('all');
  const [status, setStatus] = useState<'published' | 'draft'>('published');
  const [featured, setFeatured] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');

  useEffect(() => {
    if (postToEdit) {
      setTitle(postToEdit.title || '');
      setContent(postToEdit.content || '');
      setCategory(postToEdit.category || 'Promotion');
      setDiscountTag(postToEdit.discountTag || '');
      setImageUrl(postToEdit.imageUrl || PROMO_IMAGE_PRESETS[0].url);
      setTargetAudience(postToEdit.targetAudience === 'user' ? 'user' : 'all');
      setStatus(postToEdit.status || 'published');
      setFeatured(!!postToEdit.featured);
    } else {
      setTitle('');
      setContent('');
      setCategory('Promotion');
      setDiscountTag('');
      setImageUrl(activeStore.image || PROMO_IMAGE_PRESETS[0].url);
      setTargetAudience('all');
      setStatus('published');
      setFeatured(false);
    }
    setError(null);
    setActiveTab('edit');
  }, [postToEdit, activeStore, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide a compelling promo post title.');
      return;
    }
    if (!content.trim()) {
      setError('Please provide the promo announcement description.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const postPayload: Partial<AdminPost> = {
      ...(postToEdit ? { id: postToEdit.id } : {}),
      storeId: activeStore.id,
      title: title.trim(),
      content: content.trim(),
      category,
      discountTag: discountTag.trim() || undefined,
      imageUrl: imageUrl.trim() || PROMO_IMAGE_PRESETS[0].url,
      author: activeStore.name,
      targetAudience,
      status,
      featured
    };

    const success = await onSavePost(postPayload);
    setIsSubmitting(false);
    if (success) {
      onClose();
    } else {
      setError('Failed to save promo post. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 bg-blue-950/80 px-2.5 py-0.5 rounded-full border border-blue-800">
                {activeStore.name} • Merchant Hub
              </span>
            </div>
            <h2 className="text-xl font-black text-white mt-1">
              {postToEdit ? 'Edit Promo Post' : 'Create New Store Promo Post'}
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              Publish deals, discount alerts, and updates to the loyalty feed and push center.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer relative z-10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Toggle: Edit Form vs Live Preview */}
        <div className="flex items-center border-b border-slate-200 bg-slate-50 px-6 pt-3 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('edit')}
            className={`px-4 py-2 text-xs font-bold rounded-t-xl transition border-t border-x cursor-pointer flex items-center gap-2 ${
              activeTab === 'edit'
                ? 'bg-white text-slate-900 border-slate-200 -mb-px'
                : 'bg-transparent text-slate-500 border-transparent hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-blue-600" />
            <span>Post Editor</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`px-4 py-2 text-xs font-bold rounded-t-xl transition border-t border-x cursor-pointer flex items-center gap-2 ${
              activeTab === 'preview'
                ? 'bg-white text-slate-900 border-slate-200 -mb-px'
                : 'bg-transparent text-slate-500 border-transparent hover:text-slate-900'
            }`}
          >
            <Eye className="w-3.5 h-3.5 text-purple-600" />
            <span>Customer Feed Preview</span>
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Content Body */}
        {activeTab === 'edit' ? (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <span>Promo Post Title</span>
                <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. 2-for-1 Artisan Cold Brew Weekend Special!"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-bold text-sm focus:bg-white focus:outline-hidden focus:border-blue-500 transition"
                required
              />
            </div>

            {/* Category & Discount Tag */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-semibold text-xs focus:bg-white focus:outline-hidden cursor-pointer"
                >
                  <option value="Promotion">🏷️ Promotion (Special Deal)</option>
                  <option value="Reward Alert">🎁 Reward Alert (Points Deal)</option>
                  <option value="Announcement">📢 Store Announcement</option>
                  <option value="Update">✨ Store Update</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                  <Tag className="w-3 h-3 text-blue-600" />
                  <span>Offer Badge / Tag (Optional)</span>
                </label>
                <input
                  type="text"
                  value={discountTag}
                  onChange={(e) => setDiscountTag(e.target.value)}
                  placeholder="e.g. 20% OFF, Double Points, Free Item"
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-semibold text-xs focus:bg-white focus:outline-hidden"
                />
              </div>
            </div>

            {/* Content Body */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                <span>Promo Description & Details</span>
                <span className="text-[10px] text-slate-400 font-normal">{content.length} chars</span>
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={4}
                placeholder="Describe your promotion, terms, eligible items, or special instructions for loyalty members..."
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-medium text-xs focus:bg-white focus:outline-hidden focus:border-blue-500 transition resize-none"
                required
              />
            </div>

            {/* Cover Banner Image Presets & URL */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Promo Cover Image Banner</span>
                </span>
                <span className="text-[10px] text-slate-400">Select preset or paste custom URL</span>
              </label>

              <div className="grid grid-cols-4 gap-2">
                {PROMO_IMAGE_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setImageUrl(preset.url)}
                    className={`relative rounded-xl overflow-hidden h-14 border text-left group transition cursor-pointer ${
                      imageUrl === preset.url
                        ? 'border-blue-600 ring-2 ring-blue-500/30'
                        : 'border-slate-200 hover:border-slate-400'
                    }`}
                  >
                    <img
                      src={preset.url}
                      alt={preset.label}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-slate-950/40 group-hover:bg-slate-950/20 transition flex items-end p-1">
                      <span className="text-[9px] font-bold text-white leading-tight truncate drop-shadow-xs">
                        {preset.label}
                      </span>
                    </div>
                  </button>
                ))}
              </div>

              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-medium text-xs focus:bg-white focus:outline-hidden"
              />
            </div>

            {/* Publishing Settings: Target Audience, Status & Featured */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                  Target Audience
                </label>
                <select
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value as any)}
                  className="w-full p-2 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-800"
                >
                  <option value="all">All Members & Public</option>
                  <option value="user">App Users Only</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                  Publish Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full p-2 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-800"
                >
                  <option value="published">🟢 Published (Live)</option>
                  <option value="draft">🟡 Draft (Hidden)</option>
                </select>
              </div>

              <div className="flex items-center pt-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={featured}
                    onChange={(e) => setFeatured(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded-md border-slate-300 focus:ring-blue-500"
                  />
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    Feature in Header
                  </span>
                </label>
              </div>
            </div>

            {/* Submit & Cancel Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{isSubmitting ? 'Saving...' : postToEdit ? 'Save Changes' : 'Publish Promo Post'}</span>
              </button>
            </div>
          </form>
        ) : (
          /* Live Customer Feed Preview */
          <div className="p-6 space-y-4">
            <div className="text-xs text-slate-500 font-semibold mb-2">
              Live preview of how this post will appear to members in the OmniLoyalty feed:
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm max-w-md mx-auto">
              <div className="relative h-48 w-full">
                <img
                  src={imageUrl || PROMO_IMAGE_PRESETS[0].url}
                  alt={title || 'Preview'}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 left-3 flex items-center gap-1.5">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-blue-600 text-white shadow-xs">
                    {category}
                  </span>
                  {discountTag && (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-500 text-white shadow-xs">
                      {discountTag}
                    </span>
                  )}
                </div>
                {status === 'draft' && (
                  <span className="absolute top-3 right-3 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                    Draft Mode
                  </span>
                )}
              </div>

              <div className="p-5 space-y-2">
                <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                  <span className="font-bold text-blue-700">{activeStore.name}</span>
                  <span>Today</span>
                </div>
                <h3 className="font-black text-slate-900 text-base leading-tight">
                  {title || 'Untitled Promo Special'}
                </h3>
                <p className="text-xs text-slate-600 line-clamp-3">
                  {content || 'Your promo post description will appear here for loyalty shoppers.'}
                </p>
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                    Valid at {activeStore.name}
                  </span>
                  <span className="text-xs font-extrabold text-blue-600">
                    View Store Perks →
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="button"
                onClick={() => setActiveTab('edit')}
                className="px-5 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition cursor-pointer"
              >
                Back to Edit
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
