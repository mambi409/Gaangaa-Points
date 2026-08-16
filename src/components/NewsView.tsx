import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Globe,
  RefreshCw,
  Search,
  ExternalLink,
  Calendar,
  User,
  Share2,
  X,
  ChevronRight,
  BookOpen,
  Sparkles,
  ShieldCheck,
  Radio,
  Check,
  Building2,
  FileText,
  Landmark,
  Megaphone,
  Scale,
  Award,
  Newspaper
} from 'lucide-react';
import { AdminPost } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { db, collection, getDocs, doc, setDoc } from '../lib/firebase';

interface NewsViewProps {
  onOpenStoreExplore?: () => void;
}

// Client-side strict deduplicator
function deduplicateClientPosts(posts: AdminPost[]): AdminPost[] {
  const seenIds = new Set<string>();
  const seenExtIds = new Set<string | number>();
  const seenUrls = new Set<string>();
  const seenTitles = new Set<string>();
  const result: AdminPost[] = [];

  for (const post of posts) {
    if (!post || !post.title) continue;

    const normTitle = post.title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '')
      .trim();

    const normUrl = (post.sourceUrl || '')
      .toLowerCase()
      .replace(/^https?:\/\/(www\.)?/, '')
      .replace(/\/+$/, '')
      .split('?')[0]
      .split('#')[0]
      .trim();

    const extId = post.externalId;

    if (post.id && seenIds.has(post.id)) continue;
    if (extId !== undefined && extId !== null && seenExtIds.has(extId)) continue;
    if (normUrl && normUrl.length > 8 && seenUrls.has(normUrl)) continue;
    if (normTitle && normTitle.length > 6 && seenTitles.has(normTitle)) continue;

    if (post.id) seenIds.add(post.id);
    if (extId !== undefined && extId !== null) seenExtIds.add(extId);
    if (normUrl && normUrl.length > 8) seenUrls.add(normUrl);
    if (normTitle && normTitle.length > 6) seenTitles.add(normTitle);

    result.push(post);
  }

  return result;
}

export const NewsView: React.FC<NewsViewProps> = ({ onOpenStoreExplore }) => {
  const { t, language } = useLanguage();
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('All');
  const [selectedArticle, setSelectedArticle] = useState<AdminPost | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  // Helper to fetch directly from Gobiernu endpoints on client-side if API fails or for Vercel direct execution
  const fetchGobiernuDirectClient = async (): Promise<AdminPost[]> => {
    const endpoints = [
      'nieuw',
      'ministers_nieuw',
      'konseho_niews',
      'landing-page',
      'breaking-news',
      'optima_forma',
      'landscourant',
      'posts'
    ];

    const rawCollected: any[] = [];
    await Promise.allSettled(
      endpoints.map(async (key) => {
        // Attempt 1: Fetch with _embed
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 6000);
          const res = await fetch(`https://gobiernu.cw/wp-json/wp/v2/${key}?per_page=15&_embed`, {
            signal: controller.signal
          });
          clearTimeout(timeout);
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data)) {
              for (const item of data) {
                if (item && item.id && item.title?.rendered) {
                  rawCollected.push(item);
                }
              }
              return;
            }
          }
        } catch (_e) {}

        // Attempt 2: Fallback without _embed (super fast)
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 6000);
          const res = await fetch(`https://gobiernu.cw/wp-json/wp/v2/${key}?per_page=15`, {
            signal: controller.signal
          });
          clearTimeout(timeout);
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data)) {
              for (const item of data) {
                if (item && item.id && item.title?.rendered) {
                  rawCollected.push(item);
                }
              }
            }
          }
        } catch (_e) {}
      })
    );

    // Deduplicate by ID, title, and link
    const seenExtIds = new Set<string | number>();
    const seenTitles = new Set<string>();
    const uniqueRaw: any[] = [];

    for (const item of rawCollected) {
      const cleanTitle = (item.title?.rendered || '')
        .replace(/&#8211;/g, '–')
        .replace(/&#8217;/g, "'")
        .replace(/&#8220;/g, '"')
        .replace(/&#8221;/g, '"')
        .replace(/&amp;/g, '&')
        .replace(/<[^>]+>/g, ' ')
        .trim();

      const normTitle = cleanTitle.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (item.id && seenExtIds.has(item.id)) continue;
      if (normTitle && normTitle.length > 6 && seenTitles.has(normTitle)) continue;

      if (item.id) seenExtIds.add(item.id);
      if (normTitle && normTitle.length > 6) seenTitles.add(normTitle);
      uniqueRaw.push(item);
    }

    // Sort descending by date
    uniqueRaw.sort((a, b) => {
      const dateA = new Date(a.date || a.modified || 0).getTime();
      const dateB = new Date(b.date || b.modified || 0).getTime();
      return dateB - dateA;
    });

    // Take strictly the top 10 latest items across all subcategories
    const top10 = uniqueRaw.slice(0, 10);

    const aggregated: AdminPost[] = top10.map((item, idx) => {
      const title = (item.title?.rendered || '')
        .replace(/&#8211;/g, '–')
        .replace(/&#8217;/g, "'")
        .replace(/&#8220;/g, '"')
        .replace(/&#8221;/g, '"')
        .replace(/&amp;/g, '&')
        .replace(/<[^>]+>/g, ' ')
        .trim();

      const content = (item.content?.rendered || item.excerpt?.rendered || '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      const excerpt = (item.excerpt?.rendered || content.slice(0, 180) + '...')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      let media = item._embedded?.['wp:featuredmedia']?.[0]?.source_url;
      if (!media && item.content?.rendered) {
        const match = item.content.rendered.match(/<img[^>]+src="([^">]+)"/i);
        if (match && match[1] && match[1].startsWith('http')) {
          media = match[1];
        }
      }
      if (!media || typeof media !== 'string' || !media.startsWith('http')) {
        media = 'https://gobiernu.cw/wp-content/uploads/2019/04/gobiernu_2x.png';
      }

      const postObj: AdminPost = {
        id: `gobiernu-${item.id}`,
        externalId: item.id,
        title: title || 'Notisia di Gobiernu di Kòrsou',
        content: content || excerpt,
        excerpt,
        category: 'Announcement',
        subCategory: 'Government news',
        sourceType: 'Government news',
        imageUrl: media,
        author: 'Gobiernu di Kòrsou',
        targetAudience: 'all',
        status: 'published',
        createdAt: item.date ? new Date(item.date).toISOString() : new Date().toISOString(),
        likesCount: 0,
        featured: idx === 0,
        sourceUrl: item.link || 'https://gobiernu.cw'
      };

      // Persist to Firestore directly from client if db is available
      if (db) {
        setDoc(doc(db, 'posts', postObj.id), postObj).catch(() => {});
      }

      return postObj;
    });

    return aggregated;
  };

  // Fetch posts from API with automatic Firestore & Direct sync fallback (essential for live & Vercel)
  const loadPosts = async (forceSync = false) => {
    if (forceSync) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setSyncStatus(null);

    let loadedPosts: AdminPost[] = [];

    // 1. Attempt API fetch (triggers multi-subcategory scan across all WordPress categories)
    try {
      const url = forceSync ? '/api/posts?refresh=true' : '/api/posts';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.posts) && data.posts.length > 0) {
          loadedPosts = data.posts;
        }
      }
    } catch (apiErr) {
      console.warn('[NewsView] API fetch notice, falling back to direct Firestore:', apiErr);
    }

    // 2. Direct Firestore query fallback (guarantees Vercel reads all posts stored in Firebase)
    if (loadedPosts.length === 0 && db) {
      try {
        const snap = await getDocs(collection(db, 'posts'));
        if (!snap.empty) {
          const fsPosts: AdminPost[] = [];
          snap.forEach((doc) => {
            fsPosts.push(doc.data() as AdminPost);
          });
          loadedPosts = fsPosts;
        }
      } catch (fsErr) {
        console.warn('[NewsView] Firestore direct fetch notice:', fsErr);
      }
    }

    // 3. If forceSync is requested or no posts found, scan directly from Gobiernu.cw
    if (forceSync || loadedPosts.length === 0) {
      try {
        const directPosts = await fetchGobiernuDirectClient();
        if (directPosts.length > 0) {
          const nonGovPosts = loadedPosts.filter(
            (p) =>
              !p.id?.startsWith('gobiernu-') &&
              p.author !== 'Gobiernu di Kòrsou' &&
              !p.author?.toLowerCase().includes('gobiernu') &&
              !p.sourceUrl?.includes('gobiernu.cw')
          );
          loadedPosts = [...directPosts, ...nonGovPosts];
        }
      } catch (directErr) {
        console.warn('[NewsView] Direct client sync notice:', directErr);
      }
    }

    // Deduplicate and sort newest first
    const uniquePosts = deduplicateClientPosts(loadedPosts);
    if (uniquePosts.length > 0) {
      uniquePosts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setPosts(uniquePosts);
      if (forceSync) {
        setSyncStatus(
          language === 'es'
            ? `¡Noticias del Gobierno sincronizadas! Las 10 últimas noticias guardadas en Firebase.`
            : `Government news synced! Top 10 latest articles saved in Firebase.`
        );
      }
    }

    setIsLoading(false);
    setIsRefreshing(false);
  };

  useEffect(() => {
    loadPosts();
  }, []);

  // Determine category display icon and label
  const getCategoryMeta = (post: AdminPost) => {
    const isGov =
      post.category === 'Government news' ||
      post.subCategory === 'Government news' ||
      post.id?.startsWith('gobiernu-') ||
      post.author?.toLowerCase().includes('gobiernu') ||
      post.sourceUrl?.includes('gobiernu.cw');

    if (isGov) {
      return {
        label: 'Government news',
        icon: Landmark,
        color: 'bg-blue-600 text-white',
        border: 'border-blue-500/30'
      };
    }

    return {
      label: post.category || 'Promotion',
      icon: Sparkles,
      color: 'bg-teal-600 text-white',
      border: 'border-teal-500/30'
    };
  };

  // Filter posts across all feed categories
  const filteredPosts = posts.filter((post) => {
    const isGov =
      post.category === 'Government news' ||
      post.subCategory === 'Government news' ||
      post.id?.startsWith('gobiernu-') ||
      post.author?.toLowerCase().includes('gobiernu') ||
      post.sourceUrl?.includes('gobiernu.cw');

    if (selectedSubCategory === 'Government news') {
      if (!isGov) return false;
    } else if (selectedSubCategory === 'promotions') {
      if (isGov) return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const titleMatch = post.title?.toLowerCase().includes(q);
      const contentMatch = post.content?.toLowerCase().includes(q);
      const excerptMatch = post.excerpt?.toLowerCase().includes(q);
      const authorMatch = post.author?.toLowerCase().includes(q);
      return titleMatch || contentMatch || excerptMatch || authorMatch;
    }

    return true;
  });

  const featuredPost = filteredPosts[0];
  const listPosts = featuredPost ? filteredPosts.slice(1) : [];

  const handleCopyLink = (post: AdminPost) => {
    const url = post.sourceUrl || window.location.href;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="space-y-8 pb-16 max-w-7xl mx-auto px-2 sm:px-4">
      {/* Top Hero Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-slate-950 text-white p-6 sm:p-10 border border-slate-800 shadow-xl">
        {/* Background photo & overlay */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <img
            src="/curacao-handelskade-wide.jpg"
            alt="Curaçao"
            className="w-full h-full object-cover object-center transform scale-105 opacity-20 blur-[1px]"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/90 to-blue-950/40" />
        </div>

        <div className="relative z-10 space-y-4 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <a
              href="https://gobiernu.cw/nieuw/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/30 text-blue-300 text-xs font-bold transition"
            >
              <Globe className="w-3.5 h-3.5 text-blue-400" />
              <span>gobiernu.cw/nieuw/</span>
              <ExternalLink className="w-3 h-3 text-blue-400" />
            </a>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold">
              <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
              <span>Live Feed • Synced with Firestore</span>
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
            {language === 'es' ? 'Noticias y Comunicados Oficiales' : 'Official News & Announcements'}
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            {language === 'es'
              ? 'Últimas 10 noticias oficiales consolidadas bajo "Government news", extraídas de todas las secciones de Gobiernu.cw y sincronizadas con Firebase.'
              : 'Top 10 latest official announcements unified under "Government news", aggregated across all government news sources and synchronized with Firebase.'}
          </p>

          {/* Search & Actions Bar */}
          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  language === 'es'
                    ? 'Buscar en noticias, ministros, decretos...'
                    : 'Search in government news, announcements...'
                }
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <button
              onClick={() => loadPosts(true)}
              disabled={isRefreshing}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-md shadow-blue-600/30 cursor-pointer disabled:opacity-60 shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>
                {isRefreshing
                  ? language === 'es'
                    ? 'Sincronizando Noticias...'
                    : 'Syncing News...'
                  : language === 'es'
                  ? 'Sincronizar Top 10'
                  : 'Sync Top 10'}
              </span>
            </button>
          </div>

          {syncStatus && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 text-xs font-medium border border-emerald-500/30">
              <Check className="w-3.5 h-3.5 shrink-0" />
              <span>{syncStatus}</span>
            </div>
          )}
        </div>
      </section>

      {/* Category Filter Tabs: Consolidated Government News & Community */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => setSelectedSubCategory('All')}
          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
            selectedSubCategory === 'All'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
          }`}
        >
          {language === 'es' ? 'Todas las Noticias' : 'All News'} ({posts.length})
        </button>

        <button
          onClick={() => setSelectedSubCategory('Government news')}
          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 cursor-pointer ${
            selectedSubCategory === 'Government news'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <Landmark className="w-3.5 h-3.5 text-blue-400" />
          <span>Government news (Top 10)</span>
        </button>

        <button
          onClick={() => setSelectedSubCategory('promotions')}
          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 cursor-pointer ${
            selectedSubCategory === 'promotions'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-teal-400" />
          <span>{language === 'es' ? 'Comunidad y Recompensas' : 'Community & Rewards'}</span>
        </button>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="py-20 text-center space-y-3 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
          <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mx-auto" />
          <p className="text-sm font-bold text-slate-900 dark:text-white">
            {language === 'es' ? 'Obteniendo el Top 10 de noticias oficiales...' : 'Fetching Top 10 Government news from Gobiernu.cw & Firebase...'}
          </p>
          <p className="text-xs text-slate-400">
            {language === 'es' ? 'Consolidando noticias oficiales en la categoría Government news.' : 'Consolidating official announcements into Government news category.'}
          </p>
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="py-20 text-center space-y-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
          <Globe className="w-12 h-12 text-slate-400 mx-auto" />
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {language === 'es' ? 'No se encontraron publicaciones' : 'No news articles found in this category'}
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              {language === 'es'
                ? 'Presiona sincronizar para actualizar el Top 10 de noticias oficiales.'
                : 'Press sync to fetch and synchronize the top 10 government news articles.'}
            </p>
          </div>
          <button
            onClick={() => loadPosts(true)}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-md shadow-blue-600/25 cursor-pointer"
          >
            {language === 'es' ? 'Sincronizar Top 10 Ahora' : 'Sync Top 10 Now'}
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Featured Hero Article */}
          {featuredPost && (() => {
            const meta = getCategoryMeta(featuredPost);
            const CategoryIcon = meta.icon;
            const isGovLogo =
              !featuredPost.imageUrl ||
              featuredPost.imageUrl.includes('gobiernu_2x.png') ||
              featuredPost.imageUrl.includes('gobiernu-logo') ||
              featuredPost.imageUrl.includes('emblem');

            return (
              <div
                onClick={() => setSelectedArticle(featuredPost)}
                className="group relative bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer grid grid-cols-1 lg:grid-cols-12 gap-0"
              >
                {/* Header: White background for government logo, dark background for cover photos */}
                <div className={`lg:col-span-6 relative h-64 lg:h-auto min-h-[280px] ${isGovLogo ? 'bg-white flex items-center justify-center p-8 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800' : 'bg-slate-950'} overflow-hidden`}>
                  <img
                    src={featuredPost.imageUrl || '/gobiernu_2x.png'}
                    alt={featuredPost.title}
                    className={
                      isGovLogo
                        ? 'max-h-40 max-w-[240px] object-contain mx-auto transition-transform duration-500 group-hover:scale-105'
                        : 'w-full h-full object-cover group-hover:scale-105 transition-transform duration-500'
                    }
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = '/gobiernu_2x.png';
                      (e.currentTarget as HTMLImageElement).className = 'max-h-40 max-w-[240px] object-contain mx-auto';
                    }}
                  />
                  <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                    <span className={`px-2.5 py-1 rounded-lg ${meta.color} text-[11px] font-black uppercase tracking-wider shadow-sm flex items-center gap-1`}>
                      <CategoryIcon className="w-3 h-3" />
                      <span>{meta.label}</span>
                    </span>
                    {featuredPost.sourceUrl && (
                      <span className="px-2.5 py-1 rounded-lg bg-slate-900/90 text-blue-300 text-[11px] font-bold border border-blue-500/30 backdrop-blur-md">
                        gobiernu.cw
                      </span>
                    )}
                  </div>
                </div>

                <div className="lg:col-span-6 p-6 sm:p-8 flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1 font-semibold text-blue-600 dark:text-blue-400">
                        <User className="w-3.5 h-3.5" />
                        <span>{featuredPost.author || 'Gobiernu di Kòrsou'}</span>
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{new Date(featuredPost.createdAt).toLocaleDateString()}</span>
                      </span>
                    </div>

                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {featuredPost.title}
                    </h2>

                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed">
                      {featuredPost.excerpt || featuredPost.content}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400">
                      <BookOpen className="w-4 h-4" />
                      <span>{language === 'es' ? 'Leer Artículo Completo' : 'Read Full Article'}</span>
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>

                    {featuredPost.sourceUrl && (
                      <a
                        href={featuredPost.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400 hover:text-blue-500 transition px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                      >
                        <Globe className="w-3 h-3 text-blue-400" />
                        <span>gobiernu.cw</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Grid of Other Articles */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {listPosts.map((post) => {
              const meta = getCategoryMeta(post);
              const CategoryIcon = meta.icon;
              const isGovLogo =
                !post.imageUrl ||
                post.imageUrl.includes('gobiernu_2x.png') ||
                post.imageUrl.includes('gobiernu-logo') ||
                post.imageUrl.includes('emblem');

              return (
                <div
                  key={post.id}
                  onClick={() => setSelectedArticle(post)}
                  className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs hover:shadow-lg transition-all duration-200 cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    {/* Image Header: Full cover for photos, pure white background with neat margin for government logo */}
                    <div className={`relative h-44 overflow-hidden ${isGovLogo ? 'bg-white flex items-center justify-center p-6 border-b border-slate-200 dark:border-slate-800' : 'bg-slate-950'}`}>
                      <img
                        src={post.imageUrl || '/gobiernu_2x.png'}
                        alt={post.title}
                        className={
                          isGovLogo
                            ? 'max-h-28 max-w-[190px] object-contain mx-auto transition-transform duration-300 group-hover:scale-105'
                            : 'w-full h-full object-cover group-hover:scale-105 transition-transform duration-300'
                        }
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = '/gobiernu_2x.png';
                          (e.currentTarget as HTMLImageElement).className = 'max-h-28 max-w-[190px] object-contain mx-auto';
                        }}
                      />
                      <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${meta.color} shadow-sm flex items-center gap-1`}>
                          <CategoryIcon className="w-2.5 h-2.5" />
                          <span>{meta.label}</span>
                        </span>
                      </div>
                      <div className="absolute top-2.5 right-2.5 bg-slate-900/80 backdrop-blur-md px-2 py-0.5 rounded-md text-[10px] font-semibold text-slate-200">
                        {new Date(post.createdAt).toLocaleDateString()}
                      </div>
                    </div>

                    {/* Body */}
                    <div className="p-5 space-y-2.5">
                      <div className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                        <User className="w-3 h-3" />
                        <span>{post.author}</span>
                      </div>

                      <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {post.title}
                      </h3>

                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed">
                        {post.excerpt || post.content}
                      </p>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    <span className="font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                      <span>{language === 'es' ? 'Leer artículo' : 'Read article'}</span>
                      <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </span>

                    {post.sourceUrl && (
                      <a
                        href={post.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500 hover:text-blue-500 transition"
                      >
                        <Globe className="w-3 h-3 text-blue-400" />
                        <span>gobiernu.cw</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* FULL ARTICLE READER MODAL                                    */}
      {/* ============================================================ */}
      <AnimatePresence>
        {selectedArticle && (() => {
          const modalMeta = getCategoryMeta(selectedArticle);
          const ModalIcon = modalMeta.icon;
          const isGovLogo =
            !selectedArticle.imageUrl ||
            selectedArticle.imageUrl.includes('gobiernu_2x.png') ||
            selectedArticle.imageUrl.includes('gobiernu-logo');

          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="w-full max-w-3xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
              >
                {/* Header Image: Pure white background for government logo, dark cover style for photos */}
                <div className={`relative h-56 sm:h-72 overflow-hidden shrink-0 ${isGovLogo ? 'bg-white flex items-center justify-center p-8 border-b border-slate-200 dark:border-slate-800' : 'bg-slate-950'}`}>
                  <img
                    src={selectedArticle.imageUrl || '/gobiernu_2x.png'}
                    alt={selectedArticle.title}
                    className={
                      isGovLogo
                        ? 'max-h-44 max-w-[260px] object-contain mx-auto'
                        : 'w-full h-full object-cover'
                    }
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = '/gobiernu_2x.png';
                      (e.currentTarget as HTMLImageElement).className = 'max-h-44 max-w-[260px] object-contain mx-auto';
                    }}
                  />
                  {!isGovLogo && (
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent" />
                  )}

                  <button
                    onClick={() => setSelectedArticle(null)}
                    className="absolute top-4 right-4 p-2 rounded-full bg-slate-950/70 hover:bg-slate-900 text-white backdrop-blur-md transition shadow-md cursor-pointer z-10"
                  >
                    <X className="w-5 h-5" />
                  </button>

                  <div className={`absolute bottom-4 left-6 right-6 space-y-1 z-10 ${isGovLogo ? 'hidden' : 'text-white'}`}>
                    <div className="flex items-center gap-2 text-xs font-semibold text-blue-300">
                      <span className={`px-2.5 py-0.5 rounded-full ${modalMeta.color} backdrop-blur-md text-white text-[10px] font-black uppercase flex items-center gap-1`}>
                        <ModalIcon className="w-2.5 h-2.5" />
                        <span>{modalMeta.label}</span>
                      </span>
                      <span>•</span>
                      <span>{new Date(selectedArticle.createdAt).toLocaleDateString()}</span>
                    </div>
                    <h2 className="text-lg sm:text-2xl font-black text-white leading-snug drop-shadow-md">
                      {selectedArticle.title}
                    </h2>
                  </div>
                </div>

                {/* Body Content */}
                <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 text-slate-800 dark:text-slate-200">
                  {isGovLogo && (
                    <div className="space-y-2 pb-2">
                      <div className="flex items-center gap-2 text-xs font-semibold">
                        <span className={`px-2.5 py-0.5 rounded-full ${modalMeta.color} text-white text-[10px] font-black uppercase flex items-center gap-1`}>
                          <ModalIcon className="w-2.5 h-2.5" />
                          <span>{modalMeta.label}</span>
                        </span>
                        <span className="text-slate-400">•</span>
                        <span className="text-slate-500 dark:text-slate-400">{new Date(selectedArticle.createdAt).toLocaleDateString()}</span>
                      </div>
                      <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-snug">
                        {selectedArticle.title}
                      </h2>
                    </div>
                  )}

                  <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">{selectedArticle.author}</div>
                        <div className="text-[11px]">{selectedArticle.subCategory || 'Gobiernu di Kòrsou Official Stream'}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopyLink(selectedArticle)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition cursor-pointer"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>{copiedLink ? (language === 'es' ? '¡Copiado!' : 'Copied!') : (language === 'es' ? 'Compartir' : 'Share')}</span>
                      </button>
                    </div>
                  </div>

                  <div className="prose dark:prose-invert max-w-none text-sm sm:text-base leading-relaxed space-y-4">
                    {selectedArticle.content.split('\n\n').map((para, idx) => (
                      <p key={idx} className="leading-relaxed">
                        {para}
                      </p>
                    ))}
                  </div>

                  {selectedArticle.sourceUrl && (
                    <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <Globe className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
                        <div>
                          <div className="text-xs font-bold text-slate-900 dark:text-white">
                            Gobiernu di Kòrsou Official Source
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">
                            {selectedArticle.sourceUrl}
                          </div>
                        </div>
                      </div>

                      <a
                        href={selectedArticle.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-sm cursor-pointer shrink-0"
                      >
                        <span>{language === 'es' ? 'Ver en Gobiernu.cw' : 'View on Gobiernu.cw'}</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <span>Verified Multi-Subcategory Feed</span>
                  </span>
                  <button
                    onClick={() => setSelectedArticle(null)}
                    className="px-5 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-white text-xs font-bold transition cursor-pointer"
                  >
                    {language === 'es' ? 'Cerrar' : 'Close'}
                  </button>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
};
