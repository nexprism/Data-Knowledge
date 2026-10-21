import React, { useState, useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import {
  fetchPlacementStories,
  createPlacementStory,
  updatePlacementStory,
  deletePlacementStory,
  togglePlacementStoryStatus,
  clearMessages,
  PlacementStory,
} from '../../store/slices/placementStory';
import PageBreadcrumb from '../../components/common/PageBreadCrumb';
import PageMeta from '../../components/common/PageMeta';
import { IMAGE_BASE_URL } from '../../utils/apiConfig';
import {
  Plus,
  Search,
  Filter,
  Instagram,
  ExternalLink,
  Pencil,
  Trash2,
  CheckCircle,
  AlertCircle,
  X,
  // Upload, // COMMENTED OUT — banner/thumbnail upload removed (stories are video only)
  Play,
  Heart,
  MessageCircle,
  Bookmark,
  Share2,
  Sparkles,
  Building,
  Award,
  ArrowUpDown,
  Eye,
  EyeOff,
} from 'lucide-react';

const PlacementStoriesPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { stories, loading, actionLoading, error, successMessage } = useAppSelector(
    (state) => state.placementStory
  );

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStory, setEditingStory] = useState<PlacementStory | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    studentName: '',
    role: 'Data Analyst',
    company: '',
    companyBadge: 'Product Base Company',
    badge: 'Data Analyst - In Just 40 Days',
    instagramUrl: '',
    handle: 'learn.with.rushikesh',
    likesCount: '100+ likes',
    caption: '',
    order: 0,
    isActive: true,
  });

  // Banner / thumbnail upload state — COMMENTED OUT (stories are video only, no banner)
  // const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  // const [externalImageUrl, setExternalImageUrl] = useState<string>('');

  const VITE_IMAGE_URL = IMAGE_BASE_URL;

  useEffect(() => {
    dispatch(fetchPlacementStories());
  }, [dispatch]);

  useEffect(() => {
    if (successMessage || error) {
      const timer = setTimeout(() => {
        dispatch(clearMessages());
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, error, dispatch]);

  const getImageUrl = (thumb?: string) => {
    if (!thumb) return '';
    if (thumb.startsWith('http://') || thumb.startsWith('https://')) return thumb;
    if (thumb.startsWith('data:')) return thumb;
    return `${VITE_IMAGE_URL}/uploads/${thumb.replace(/^uploads\//, '')}`;
  };

  const openCreateModal = () => {
    setEditingStory(null);
    setFormData({
      studentName: '',
      role: 'Data Analyst',
      company: '',
      companyBadge: 'Product Base Company',
      badge: 'Data Analyst - In Just 40 Days',
      instagramUrl: '',
      handle: 'learn.with.rushikesh',
      likesCount: '100+ likes',
      caption: '',
      order: stories.length + 1,
      isActive: true,
    });
    setPreviewUrl('');
    // setSelectedFile(null);
    // setExternalImageUrl('');
    setIsModalOpen(true);
  };

  const openEditModal = (story: PlacementStory) => {
    setEditingStory(story);
    setFormData({
      studentName: story.studentName || '',
      role: story.role || 'Data Analyst',
      company: story.company || '',
      companyBadge: story.companyBadge || 'Product Base Company',
      badge: story.badge || 'Data Analyst - In Just 40 Days',
      instagramUrl: story.instagramUrl || '',
      handle: story.handle || 'learn.with.rushikesh',
      likesCount: story.likesCount || '100+ likes',
      caption: story.caption || '',
      order: story.order || 0,
      isActive: story.isActive !== false,
    });
    setPreviewUrl('');
    // setSelectedFile(null);
    // setExternalImageUrl(
    //   story.thumbnail && (story.thumbnail.startsWith('http://') || story.thumbnail.startsWith('https://'))
    //     ? story.thumbnail
    //     : ''
    // );
    setIsModalOpen(true);
  };

  // Banner file picker handler — COMMENTED OUT (no banner upload)
  // const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   if (e.target.files && e.target.files[0]) {
  //     const file = e.target.files[0];
  //     setSelectedFile(file);
  //     setPreviewUrl(URL.createObjectURL(file));
  //     setExternalImageUrl('');
  //   }
  // };

  // Banner external URL handler — COMMENTED OUT (no banner upload)
  // const handleExternalUrlChange = (url: string) => {
  //   setExternalImageUrl(url);
  //   if (url) {
  //     setSelectedFile(null);
  //     setPreviewUrl(url);
  //   }
  // };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const data = new FormData();
    data.append('studentName', formData.studentName);
    data.append('role', formData.role);
    data.append('company', formData.company);
    data.append('companyBadge', formData.companyBadge);
    data.append('badge', formData.badge);
    data.append('instagramUrl', formData.instagramUrl);
    data.append('handle', formData.handle);
    data.append('likesCount', formData.likesCount);
    data.append('caption', formData.caption);
    data.append('order', String(formData.order));
    data.append('isActive', String(formData.isActive));

    // Banner / thumbnail upload — COMMENTED OUT (stories are video only, no banner)
    // if (selectedFile) {
    //   data.append('thumbnail', selectedFile);
    // } else if (externalImageUrl) {
    //   data.append('thumbnail', externalImageUrl);
    // }

    if (editingStory) {
      await dispatch(updatePlacementStory({ id: editingStory._id, formData: data }));
    } else {
      await dispatch(createPlacementStory(data));
    }

    setIsModalOpen(false);
  };

  const handleDeleteConfirm = async () => {
    if (deleteId) {
      await dispatch(deletePlacementStory(deleteId));
      setDeleteId(null);
    }
  };

  const handleToggle = async (id: string) => {
    await dispatch(togglePlacementStoryStatus(id));
  };

  const filteredStories = useMemo(() => {
    return stories.filter((story) => {
      const matchesSearch =
        !search ||
        story.studentName.toLowerCase().includes(search.toLowerCase()) ||
        story.company.toLowerCase().includes(search.toLowerCase()) ||
        story.role.toLowerCase().includes(search.toLowerCase()) ||
        (story.badge && story.badge.toLowerCase().includes(search.toLowerCase()));

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && story.isActive) ||
        (statusFilter === 'inactive' && !story.isActive);

      return matchesSearch && matchesStatus;
    });
  }, [stories, search, statusFilter]);

  const activeCount = stories.filter((s) => s.isActive).length;
  const companyCount = new Set(stories.map((s) => s.company)).size;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <PageMeta
        title="Placement Stories (Instagram Reels) | Admin"
        description="Manage dynamic Instagram placement reels on landing page"
      />
      <PageBreadcrumb pageTitle="Instagram Placement Stories" />

      {/* Top Banner & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Stories Card */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 border border-purple-500/30 shadow-lg flex items-center justify-between relative overflow-hidden group hover:border-purple-500/50 transition-all">
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-purple-500/10 rounded-full blur-xl pointer-events-none" />
          <div className="relative z-10">
            <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30 inline-block">
              Total Stories
            </span>
            <h3 className="text-3xl font-black text-white mt-2 tracking-tight">{stories.length}</h3>
            <p className="text-xs text-gray-300 mt-1">Reels in placement library</p>
          </div>
          <div className="relative z-10 w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 flex items-center justify-center text-white shadow-xl shadow-rose-500/30 group-hover:scale-105 transition-transform shrink-0">
            <Instagram className="w-6 h-6" />
          </div>
        </div>

        {/* Active on Landing Card */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-900 border border-emerald-500/30 shadow-lg flex items-center justify-between relative overflow-hidden group hover:border-emerald-500/50 transition-all">
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />
          <div className="relative z-10">
            <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 inline-block">
              Active on Landing
            </span>
            <h3 className="text-3xl font-black text-white mt-2 tracking-tight">{activeCount}</h3>
            <p className="text-xs text-gray-300 mt-1">Live visible on website</p>
          </div>
          <div className="relative z-10 w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-xl shadow-emerald-500/30 group-hover:scale-105 transition-transform shrink-0">
            <Eye className="w-6 h-6" />
          </div>
        </div>

        {/* Companies Card */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 border border-blue-500/30 shadow-lg flex items-center justify-between relative overflow-hidden group hover:border-blue-500/50 transition-all">
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-blue-500/10 rounded-full blur-xl pointer-events-none" />
          <div className="relative z-10">
            <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/30 inline-block">
              Companies
            </span>
            <h3 className="text-3xl font-black text-white mt-2 tracking-tight">{companyCount}</h3>
            <p className="text-xs text-gray-300 mt-1">Hiring partner brands</p>
          </div>
          <div className="relative z-10 w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-xl shadow-blue-500/30 group-hover:scale-105 transition-transform shrink-0">
            <Building className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Section Header & Search */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900/80 backdrop-blur-xl shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <span className="p-2 rounded-lg bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white inline-flex">
                <Instagram className="w-4 h-4" />
              </span>
              Landing Page Placement Reels
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Add Instagram reel links and student transition stories. Clicking a card on the website opens the reel in Instagram.
            </p>
          </div>

          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#1b6294] to-[#16517a] hover:from-[#16517a] hover:to-[#103a58] text-white font-medium text-sm shadow-md shadow-[#1b6294]/25 hover:shadow-lg transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Instagram Story
          </button>
        </div>

        {/* Notifications */}
        {successMessage && (
          <div className="mb-4 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-sm flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}
        {error && (
          <div className="mb-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Search & Filter Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by student, company, role, or badge..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Stories</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid of Placement Stories */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400">
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filteredStories.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border border-dashed border-gray-300 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/30">
          <Instagram className="w-12 h-12 text-gray-400 mx-auto mb-3 opacity-60" />
          <h3 className="text-base font-semibold text-gray-700 dark:text-gray-300">No Instagram stories found</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            {search ? 'No stories matching your search criteria.' : 'Click "Add Instagram Story" to create your first placement reel!'}
          </p>
          {!search && (
            <button
              onClick={openCreateModal}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#1b6294] to-[#16517a] hover:from-[#16517a] hover:to-[#103a58] text-white text-xs font-medium shadow-md shadow-[#1b6294]/20 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Story
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredStories.map((story) => {
            const img = getImageUrl(story.thumbnail);

            return (
              <div
                key={story._id}
                className="group relative rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden shadow-sm hover:shadow-xl hover:border-purple-500/40 transition-all duration-300 flex flex-col"
              >
                {/* Top IG Header Bar */}
                <div className="px-3.5 py-2.5 bg-gray-50/80 dark:bg-gray-800/80 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-6 h-6 rounded-full p-[1.5px] bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 shrink-0">
                      <div className="w-full h-full rounded-full bg-white dark:bg-gray-900 flex items-center justify-center overflow-hidden">
                        <Instagram className="w-3 h-3 text-pink-500" />
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">
                      @{story.handle || 'learn.with.rushikesh'}
                    </span>
                  </div>

                  {/* Active / Inactive Pill */}
                  <button
                    onClick={() => handleToggle(story._id)}
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors flex items-center gap-1 ${
                      story.isActive
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25'
                        : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 hover:bg-rose-500/25'
                    }`}
                    title="Click to toggle status"
                  >
                    {story.isActive ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                    {story.isActive ? 'Active' : 'Inactive'}
                  </button>
                </div>

                {/* Card Thumbnail / Preview Window (9:14 ratio) */}
                <div className="relative aspect-[9/13] w-full bg-gray-950 overflow-hidden">
                  {img ? (
                    <img
                      src={img}
                      alt={story.studentName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 text-white text-center">
                      <Instagram className="w-12 h-12 text-pink-400 mb-2 opacity-80" />
                      <p className="text-sm font-bold">{story.studentName}</p>
                      <p className="text-xs text-purple-300 mt-0.5">{story.company}</p>
                    </div>
                  )}

                  {/* Dark Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/60 pointer-events-none" />

                  {/* Top Badges */}
                  <div className="absolute top-3 left-3 right-3 flex flex-wrap gap-1.5 z-10">
                    {story.companyBadge && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-500/80 text-white backdrop-blur-md">
                        {story.companyBadge}
                      </span>
                    )}
                    {story.badge && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/80 text-white backdrop-blur-md">
                        {story.badge}
                      </span>
                    )}
                  </div>

                  {/* Play Button Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center z-10">
                    <a
                      href={story.instagramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-14 h-14 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/40 flex items-center justify-center text-white transition-all transform group-hover:scale-110 shadow-lg"
                      title="Open in Instagram"
                    >
                      <Play className="w-6 h-6 fill-white ml-0.5" />
                    </a>
                  </div>

                  {/* Bottom Student Info Overlay */}
                  <div className="absolute bottom-3 left-3 right-3 z-10 text-white">
                    <div className="bg-black/60 backdrop-blur-md rounded-xl p-2.5 border border-white/10">
                      <p className="text-[11px] text-amber-300 font-bold uppercase tracking-wider">
                        {story.company}
                      </p>
                      <h4 className="text-sm font-black text-white leading-tight">
                        {story.studentName}
                      </h4>
                      <p className="text-[11px] text-gray-300">{story.role}</p>
                      {story.caption && (
                        <p className="text-[10px] text-gray-400 mt-1 line-clamp-2">
                          "{story.caption}"
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bottom Action Footer */}
                <div className="p-3.5 bg-white dark:bg-gray-900 mt-auto flex items-center justify-between border-t border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                    <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500/20" />
                    <span>{story.likesCount || '100+'}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <a
                      href={story.instagramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg text-gray-500 hover:text-pink-600 hover:bg-pink-50 dark:hover:bg-pink-950/30 transition-colors"
                      title="Open Instagram Reel"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    <button
                      onClick={() => openEditModal(story)}
                      className="p-1.5 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors"
                      title="Edit"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteId(story._id)}
                      className="p-1.5 rounded-lg text-gray-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-5 md:p-6 bg-black/75 backdrop-blur-md">
          <div className="relative bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-2xl w-full max-w-4xl max-h-[88vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header - Fixed Top */}
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between shrink-0 bg-white dark:bg-gray-900 z-10">
              <div className="flex items-center gap-3">
                <span className="p-2.5 rounded-2xl bg-gradient-to-tr from-yellow-500 via-pink-500 to-purple-600 text-white shadow-md shadow-pink-500/20">
                  <Instagram className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    {editingStory ? 'Edit Placement Story' : 'Add New Placement Story'}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Connect an Instagram Reel to show verified transition proofs on the landing page
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body - Scrollable Form & Preview */}
            <form id="placementStoryForm" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Form Fields Column (7 cols) */}
                <div className="lg:col-span-7 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                      Student Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Jana, Ms Sharada, Aditya"
                      value={formData.studentName}
                      onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                        Target Role *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Data Analyst"
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                        Hired Company *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Tesco, Johnson & Johnson"
                        value={formData.company}
                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                        className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                      Instagram Reel URL *
                    </label>
                    <input
                      type="url"
                      required
                      placeholder="https://www.instagram.com/reel/Cxxxxxx/"
                      value={formData.instagramUrl}
                      onChange={(e) => setFormData({ ...formData, instagramUrl: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                        Highlight Badge
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. In Just 40 Days"
                        value={formData.badge}
                        onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                        className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                        Company Tag
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Product Base Company"
                        value={formData.companyBadge}
                        onChange={(e) => setFormData({ ...formData, companyBadge: e.target.value })}
                        className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                        Instagram Handle
                      </label>
                      <input
                        type="text"
                        placeholder="learn.with.rushikesh"
                        value={formData.handle}
                        onChange={(e) => setFormData({ ...formData, handle: e.target.value })}
                        className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                        Likes Display
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 103 likes"
                        value={formData.likesCount}
                        onChange={(e) => setFormData({ ...formData, likesCount: e.target.value })}
                        className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                      Caption / Quote (Optional)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Congratulations Jana on transitioning to Johnson & Johnson! 💐"
                      value={formData.caption}
                      onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none resize-none transition-all"
                    />
                  </div>

                  {/* Priority Order & Active Toggle */}
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                        Display Order
                      </label>
                      <input
                        type="number"
                        value={formData.order}
                        onChange={(e) => setFormData({ ...formData, order: Number(e.target.value) || 0 })}
                        className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:outline-none transition-all"
                      />
                    </div>

                    <div className="flex flex-col justify-end">
                      <label className="flex items-center gap-2 cursor-pointer p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors">
                        <input
                          type="checkbox"
                          checked={formData.isActive}
                          onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                          className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
                        />
                        <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
                          Active on Landing
                        </span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Live Card Preview & Upload Column (5 cols) */}
                <div className="lg:col-span-5 space-y-4">
                  {/* Banner / Thumbnail Image uploader — COMMENTED OUT (stories are video only, no banner) */}
                  {/*
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                      Thumbnail Image
                    </label>

                    // File Upload Dropzone
                    <div className="p-4 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-center hover:border-purple-500 transition-colors">
                      <input
                        type="file"
                        id="thumbnailUpload"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <label
                        htmlFor="thumbnailUpload"
                        className="cursor-pointer flex flex-col items-center justify-center gap-2"
                      >
                        <Upload className="w-6 h-6 text-purple-500" />
                        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                          {selectedFile ? selectedFile.name : 'Upload thumbnail (JPG, PNG, WebP)'}
                        </span>
                        <span className="text-[10px] text-gray-400">Aspect ratio 9:14 recommended</span>
                      </label>
                    </div>

                    <div className="mt-2">
                      <input
                        type="url"
                        placeholder="Or paste external image URL..."
                        value={externalImageUrl}
                        onChange={(e) => handleExternalUrlChange(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                  */}

                  {/* Live Instagram Card Preview */}
                  <div>
                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      Live Card Preview
                    </p>

                    <div className="max-w-[240px] mx-auto rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 overflow-hidden shadow-xl flex flex-col text-gray-900 dark:text-white">
                      {/* Preview Top IG Bar */}
                      <div className="px-3 py-2 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <div className="w-5 h-5 rounded-full p-[1px] bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 shrink-0">
                            <div className="w-full h-full rounded-full bg-white dark:bg-gray-900 flex items-center justify-center">
                              <Instagram className="w-2.5 h-2.5 text-pink-500" />
                            </div>
                          </div>
                          <span className="text-[10px] font-semibold text-gray-800 dark:text-gray-200 truncate">
                            @{formData.handle || 'learn.with.rushikesh'}
                          </span>
                        </div>
                        <span className="text-[8px] px-2 py-0.5 rounded-full bg-blue-600 text-white font-bold">
                          View profile
                        </span>
                      </div>

                      {/* Preview Picture Area */}
                      <div className="relative aspect-[9/13] w-full bg-slate-900 overflow-hidden">
                        {previewUrl ? (
                          <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950 text-white">
                            <Instagram className="w-8 h-8 text-pink-400 mb-1 opacity-80" />
                            <p className="text-xs font-bold">{formData.studentName || 'Student Name'}</p>
                            <p className="text-[10px] text-purple-300">{formData.company || 'Company'}</p>
                          </div>
                        )}

                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/60 pointer-events-none" />

                        {/* Preview Badges */}
                        <div className="absolute top-2 left-2 right-2 flex flex-wrap gap-1 z-10">
                          {formData.companyBadge && (
                            <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-blue-600/90 text-white">
                              {formData.companyBadge}
                            </span>
                          )}
                          {formData.badge && (
                            <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/95 text-white">
                              {formData.badge}
                            </span>
                          )}
                        </div>

                        {/* Preview Play Icon */}
                        <div className="absolute inset-0 flex items-center justify-center z-10">
                          <div className="w-10 h-10 rounded-full bg-white/25 backdrop-blur-md border border-white/40 flex items-center justify-center text-white">
                            <Play className="w-4 h-4 fill-white ml-0.5" />
                          </div>
                        </div>

                        {/* Preview Bottom Text */}
                        <div className="absolute bottom-2 left-2 right-2 z-10 text-white">
                          <div className="bg-black/65 backdrop-blur-md rounded-lg p-2 border border-white/10">
                            <p className="text-[8px] text-amber-300 font-bold uppercase">
                              {formData.company || 'COMPANY'}
                            </p>
                            <h5 className="text-[10px] font-black text-white leading-tight">
                              {formData.studentName || 'Student Name'}
                            </h5>
                            <p className="text-[8px] text-gray-300">{formData.role || 'Data Analyst'}</p>
                          </div>
                        </div>
                      </div>

                      {/* Preview Bottom Action Bar */}
                      <div className="p-2 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-[9px] text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-2">
                          <Heart className="w-3 h-3 text-rose-500 fill-rose-500/20" />
                          <MessageCircle className="w-3 h-3" />
                          <Share2 className="w-3 h-3" />
                        </div>
                        <Bookmark className="w-3 h-3" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </form>

            {/* Modal Footer - Fixed Bottom */}
            <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/90 flex justify-end gap-3 shrink-0 z-10">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="placementStoryForm"
                disabled={actionLoading}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#1b6294] to-[#16517a] hover:from-[#16517a] hover:to-[#103a58] text-white font-medium text-sm shadow-md shadow-[#1b6294]/25 hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 active:scale-95 cursor-pointer"
              >
                {actionLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    {editingStory ? 'Update Story' : 'Publish Story'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-2xl p-6 max-w-sm w-full text-center space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-500 mx-auto flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-gray-900 dark:text-white">Delete Placement Story?</h4>
              <p className="text-xs text-gray-500 mt-1">
                This will remove the Instagram placement story from the landing page.
              </p>
            </div>
            <div className="flex gap-3 justify-center pt-2">
              <button
                onClick={() => setDeleteId(null)}
                className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-xs font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-md shadow-rose-600/20 transition-all active:scale-95"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlacementStoriesPage;
