import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../store';
import { fetchTestimonials, addTestimonial, resetTestimonialState, deleteTestimonial, updateTestimonial } from '../store/slices/testimonial';
import { fetchCourses } from '../store/slices/course';
import { API_BASE_URL } from '../utils/apiConfig';
import { Star, Plus, X, MessageCircle, User, Briefcase, Loader2, AlertCircle, CheckCircle, Search, Trash2, Edit, BookOpen, Image as ImageIcon, Video, Upload, Film, ChevronLeft, ChevronRight } from 'lucide-react';

interface TestimonialData {
    _id?: string;
    name: string;
    role: string;
    message: string;
    rating: number;
    courseId?: string;
    image?: string;
    screenshot?: string;
    reviewImages?: string[];
    video?: string;
    status?: string;
    createdAt?: string;
    updatedAt?: string;
}

// Confirmation Dialog Component
const ConfirmDialog = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
}: {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[99999] p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-gray-100 dark:border-gray-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">{title}</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6">{message}</p>
                <div className="flex justify-end gap-2">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
};

// Success/Error Popup Component
const Popup = ({
    isVisible,
    onClose,
    message,
    type = "success",
}: {
    isVisible: boolean;
    onClose: () => void;
    message: string;
    type?: "success" | "error";
}) => {
    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[99999] p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 transform transition-all duration-300 scale-100 border border-gray-100 dark:border-gray-700">
                <div className="text-center">
                    <div
                        className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${type === "success" ? "bg-green-100" : "bg-red-100"
                            }`}
                    >
                        {type === "success" ? (
                            <CheckCircle className="w-8 h-8 text-green-600" />
                        ) : (
                            <AlertCircle className="w-8 h-8 text-red-600" />
                        )}
                    </div>
                    <h3
                        className={`text-xl font-semibold mb-2 ${type === "success" ? "text-green-800" : "text-red-800"
                            }`}
                    >
                        {type === "success" ? "Success!" : "Error!"}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-6">{message}</p>
                    <button
                        onClick={onClose}
                        className={`px-6 py-2 rounded-lg font-medium transition-colors ${type === "success"
                            ? "bg-green-600 text-white hover:bg-green-700"
                            : "bg-red-600 text-white hover:bg-red-700"
                            }`}
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

interface Course {
    _id: string;
    title: string;
    slug?: string;
    price?: number;
    thumbnail?: string;
}

const TestimonialsPage: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();

    const [testimonials, setTestimonials] = useState<TestimonialData[]>([]);
    const [coursesList, setCoursesList] = useState<Course[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [coursesLoading, setCoursesLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [showAddForm, setShowAddForm] = useState<boolean>(false);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [showCoursesList, setShowCoursesList] = useState<boolean>(true);
    const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; id: string | null }>({
        show: false,
        id: null
    });

    const [isEditMode, setIsEditMode] = useState<boolean>(false);
    const [editId, setEditId] = useState<string | null>(null);

    const [popup, setPopup] = useState({
        isVisible: false,
        message: '',
        type: 'success' as 'success' | 'error'
    });

    const [formData, setFormData] = useState<TestimonialData>({
        name: '',
        role: '',
        message: '',
        rating: 5,
    });

    const [imageFile, setImageFile] = useState<File | null>(null);
    const [reviewImageFiles, setReviewImageFiles] = useState<File[]>([]);
    const [reviewImagePreviews, setReviewImagePreviews] = useState<string[]>([]);
    const [existingReviewImages, setExistingReviewImages] = useState<string[]>([]);
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [videoPreview, setVideoPreview] = useState<string | null>(null);
    const [activeLightbox, setActiveLightbox] = useState<{
        images: string[];
        currentIndex: number;
        title: string;
    } | null>(null);

    const BASE_URL = API_BASE_URL;
    const getMediaUrl = (path: string) => {
        if (!path) return '';
        if (path.startsWith('http')) return path;
        const normalizedPath = path.startsWith('/') ? path.slice(1) : path;
        return `${BASE_URL}/${normalizedPath}`;
    };

    const getTestimonialReviewImages = (item: TestimonialData): string[] => {
        const list: string[] = [];
        if (Array.isArray(item.reviewImages) && item.reviewImages.length > 0) {
            item.reviewImages.forEach(img => { if (img && !list.includes(img)) list.push(img); });
        }
        if (item.screenshot && !list.includes(item.screenshot)) {
            list.unshift(item.screenshot);
        }
        return list;
    };

    // Fetch all testimonials
    const fetchTestimonialsData = useCallback(async (status: string = 'all') => {
        const token = localStorage.getItem('token') || '';
        setLoading(true);
        try {
            const result = await dispatch(
                fetchTestimonials({
                    token,
                    status: status !== 'all' ? status : undefined,
                })
            ).unwrap();
            setTestimonials(result);
            setLoading(false);
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Failed to fetch testimonials';
            setError(errorMsg);
            setLoading(false);
        }
    }, [dispatch]);

    // Fetch courses
    const fetchCoursesData = useCallback(async () => {
        setCoursesLoading(true);
        try {
            const result = await dispatch(fetchCourses({})).unwrap();
            setCoursesList(result?.courses || []);
            setCoursesLoading(false);
        } catch (err) {
            console.error('Failed to fetch courses:', err);
            setCoursesLoading(false);
        }
    }, [dispatch]);

    // Fetch testimonials and courses on component mount
    useEffect(() => {
        fetchTestimonialsData();
        fetchCoursesData();

        // Cleanup function to reset testimonial state when component unmounts
        return () => {
            dispatch(resetTestimonialState());
        };
    }, [fetchTestimonialsData, fetchCoursesData, dispatch]);

    // Filter testimonials based on search term and status
    const filteredTestimonials = testimonials.filter(testimonial => {
        const matchesSearch =
            testimonial.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            testimonial.role?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            testimonial.message?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === 'all' || testimonial.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value,
        });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, files } = e.target;
        if (files && files[0]) {
            const file = files[0];
            if (name === 'image') {
                setImageFile(file);
                setImagePreview(URL.createObjectURL(file));
            } else if (name === 'video') {
                setVideoFile(file);
                setVideoPreview(URL.createObjectURL(file));
            }
        }
    };

    const handleReviewImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            const file = files[0];
            setReviewImageFiles([file]);
            setReviewImagePreviews([URL.createObjectURL(file)]);
        }
    };

    const handleRemoveNewReviewImage = (index: number) => {
        setReviewImageFiles(prev => prev.filter((_, i) => i !== index));
        setReviewImagePreviews(prev => prev.filter((_, i) => i !== index));
    };

    const handleRemoveExistingReviewImage = (index: number) => {
        setExistingReviewImages(prev => prev.filter((_, i) => i !== index));
    };

    const handleRatingChange = (newRating: number) => {
        setFormData({
            ...formData,
            rating: newRating,
        });
    };

    const handleStatusFilter = (status: string) => {
        setStatusFilter(status);
        fetchTestimonialsData(status);
    };

    const resetForm = () => {
        setFormData({
            name: '',
            role: '',
            message: '',
            rating: 5,
        });
        setImageFile(null);
        setImagePreview(null);
        setReviewImageFiles([]);
        setReviewImagePreviews([]);
        setExistingReviewImages([]);
        setVideoFile(null);
        setVideoPreview(null);
        setEditId(null);
        setIsEditMode(false);
    };

    const handleAddForCourse = (courseId: string) => {
        resetForm();
        setFormData(prev => ({
            ...prev,
            courseId: courseId
        }));
        setShowAddForm(true);
    };

    // Handle edit testimonial
    const handleEditClick = (testimonial: TestimonialData) => {
        if (!testimonial._id) return;

        setFormData({
            name: testimonial.name,
            role: testimonial.role,
            message: testimonial.message,
            rating: testimonial.rating,
            courseId: testimonial.courseId,
            status: testimonial.status,
            image: testimonial.image,
            screenshot: testimonial.screenshot,
            reviewImages: testimonial.reviewImages,
            video: testimonial.video
        });

        setImagePreview(testimonial.image ? getMediaUrl(testimonial.image) : null);
        const existingImgs = getTestimonialReviewImages(testimonial);
        setExistingReviewImages(existingImgs.slice(0, 1));
        setReviewImageFiles([]);
        setReviewImagePreviews([]);

        setVideoPreview(testimonial.video ? getMediaUrl(testimonial.video) : null);
        setImageFile(null);
        setVideoFile(null);

        setEditId(testimonial._id);
        setIsEditMode(true);
        setShowAddForm(true);
    };

    // No need for a separate handleUpdate function as we're handling it in the handleSubmit

    // Handle delete testimonial
    const handleDelete = async (id: string) => {
        if (!id) return;

        const token = localStorage.getItem('token') || '';
        setLoading(true);

        try {
            await dispatch(
                deleteTestimonial({
                    testimonialId: id,
                    token
                })
            ).unwrap();

            // Refresh testimonials list
            await fetchTestimonialsData(statusFilter);

            // Close delete confirmation
            setDeleteConfirm({ show: false, id: null });

            // Show success message
            setPopup({
                isVisible: true,
                message: 'Testimonial deleted successfully!',
                type: 'success'
            });
        } catch (err) {
            console.error('Failed to delete testimonial:', err);

            setPopup({
                isVisible: true,
                message: err instanceof Error ? err.message : 'Failed to delete testimonial',
                type: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        setPopup({
            isVisible: false,
            message: '',
            type: 'success'
        });

        const token = localStorage.getItem('token') || '';
        setLoading(true);

        const formDataToSend = new FormData();
        formDataToSend.append('name', formData.name);
        formDataToSend.append('role', formData.role);
        formDataToSend.append('message', formData.message);
        formDataToSend.append('rating', String(formData.rating));
        if (formData.courseId) formDataToSend.append('courseId', formData.courseId);
        if (imageFile) formDataToSend.append('image', imageFile);

        // Append review images
        if (reviewImageFiles[0]) formDataToSend.append('reviewImages', reviewImageFiles[0]);

        if (videoFile) formDataToSend.append('video', videoFile);

        // If in edit mode, call handleUpdate instead
        if (isEditMode && editId) {
            if (formData.status) formDataToSend.append('status', formData.status);
            formDataToSend.append('existingReviewImages', JSON.stringify(existingReviewImages));

            try {
                await dispatch(
                    updateTestimonial({
                        testimonialId: editId,
                        data: formDataToSend,
                        token
                    })
                ).unwrap();

                // Refresh testimonials list
                await fetchTestimonialsData(statusFilter);

                // Reset form and edit mode
                resetForm();
                setShowAddForm(false);

                // Show success message
                setPopup({
                    isVisible: true,
                    message: 'Testimonial updated successfully!',
                    type: 'success'
                });
            } catch (err) {
                console.error('Failed to update testimonial:', err);

                setPopup({
                    isVisible: true,
                    message: err instanceof Error ? err.message : 'Failed to update testimonial',
                    type: 'error'
                });
            } finally {
                setLoading(false);
            }
            return;
        }

        // Add new testimonial
        try {
            await dispatch(
                addTestimonial({
                    testimonial: formDataToSend,
                    token,
                })
            ).unwrap();

            // Refresh testimonials list
            await fetchTestimonialsData(statusFilter);

            // Reset form data
            resetForm();

            // Close form
            setShowAddForm(false);

            // Show success message
            setPopup({
                isVisible: true,
                message: 'Testimonial added successfully!',
                type: 'success'
            });

        } catch (err) {
            console.error('Failed to add testimonial:', err);

            setPopup({
                isVisible: true,
                message: err instanceof Error ? err.message : 'Failed to add testimonial',
                type: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    const StarRating = ({ rating, onRatingChange }: { rating: number; onRatingChange?: (rating: number) => void }) => {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            stars.push(
                <button
                    key={i}
                    type="button"
                    onClick={() => onRatingChange && onRatingChange(i)}
                    className={`${i <= rating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'
                        } focus:outline-none`}
                >
                    <Star className="w-5 h-5 fill-current" />
                </button>
            );
        }
        return <div className="flex space-x-1">{stars}</div>;
    };

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Success/Error Popup */}
            <Popup
                isVisible={popup.isVisible}
                message={popup.message}
                type={popup.type}
                onClose={() => setPopup({ ...popup, isVisible: false })}
            />

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                isOpen={deleteConfirm.show}
                onClose={() => setDeleteConfirm({ show: false, id: null })}
                onConfirm={() => deleteConfirm.id && handleDelete(deleteConfirm.id)}
                title="Delete Testimonial"
                message="Are you sure you want to delete this testimonial? This action cannot be undone."
            />

            {/* Header Section */}
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4 sm:mb-0">
                    Testimonials Management
                </h1>
                <button
                    onClick={() => setShowAddForm(true)}
                    className="px-5 py-2.5 bg-gradient-to-r from-[#1b6294] to-[#16517a] hover:from-[#16517a] hover:to-[#103a58] text-white rounded-xl shadow-md shadow-[#1b6294]/20 hover:shadow-lg transition-all active:scale-95 font-medium flex items-center gap-2 cursor-pointer"
                >
                    <Plus className="w-4 h-4" />
                    Add Testimonial
                </button>
            </div>

            {/* Filters & Search */}
            <div className="mb-8 p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/80 dark:border-gray-700/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1 max-w-md">
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors">
                            <Search className="w-4 h-4" />
                        </div>
                        <input
                            type="text"
                            className="bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 block w-full pl-10 pr-9 py-2.5 dark:bg-gray-700/60 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white transition-all shadow-2xs"
                            placeholder="Search by student name, role, review message..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                            <button
                                type="button"
                                onClick={() => setSearchTerm('')}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                                title="Clear search"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-medium mr-1 whitespace-nowrap">Status:</span>
                    {[
                        { key: 'all', label: 'All' },
                        { key: 'approved', label: 'Approved' },
                        { key: 'pending', label: 'Pending' },
                        { key: 'rejected', label: 'Rejected' }
                    ].map(({ key, label }) => (
                        <button
                            key={key}
                            className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                                statusFilter === key
                                    ? 'bg-blue-600 text-white shadow-xs shadow-blue-600/20'
                                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200'
                            }`}
                            onClick={() => handleStatusFilter(key)}
                        >
                            {label}
                        </button>
                    ))}
                    
                    {searchTerm && (
                        <span className="text-xs font-medium px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 ml-2 whitespace-nowrap">
                            {filteredTestimonials.length} results
                        </span>
                    )}
                </div>
            </div>



            {/* Error message */}
            {error && (
                <div className="p-4 mb-6 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg text-red-700 dark:text-red-300">
                    {error}
                </div>
            )}

            {/* Loading state */}
            {loading && (
                <div className="flex justify-center p-8">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
            )}

            {/* Empty state */}
            {!loading && filteredTestimonials.length === 0 && (
                <div className="p-6 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-center">
                    <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-400 dark:text-gray-500" />
                    <p className="text-gray-600 dark:text-gray-400">
                        {searchTerm ? 'No testimonials match your search.' : 'No testimonials found.'}
                    </p>
                </div>
            )}

            {/* Testimonials List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTestimonials.map((testimonial) => (
                    <div
                        key={testimonial._id || `testimonial-${Math.random().toString(36).substr(2, 9)}`}
                        className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5 shadow-sm"
                    >
                        <div className="flex justify-between items-start mb-3">
                            <StarRating rating={testimonial.rating || 0} />
                            <div className="flex items-center gap-2">
                                <span className={`text-xs px-2 py-1 rounded-full ${testimonial.status === 'approved'
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                                    : testimonial.status === 'rejected'
                                        ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                                    }`}>
                                    {testimonial.status || 'Pending'}
                                </span>
                                <div className="flex space-x-1">
                                    {/* Edit button will be implemented later */}
                                    <button
                                        onClick={() => handleEditClick(testimonial)}
                                        className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                        title="Edit testimonial"
                                    >
                                        <Edit size={16} />
                                    </button>
                                    {testimonial._id && (
                                        <button
                                            onClick={() => setDeleteConfirm({ show: true, id: testimonial._id || null })}
                                            className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                                            title="Delete testimonial"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 mb-4 italic">"{testimonial.message}"</p>

                        {(() => {
                            const reviewImgs = getTestimonialReviewImages(testimonial);
                            const hasMedia = Boolean(testimonial.image || reviewImgs.length > 0 || testimonial.video);
                            if (!hasMedia) return null;

                            return (
                                <div className="flex gap-4 mb-4 overflow-x-auto pb-2">
                                    {testimonial.image && (
                                        <div className="flex-shrink-0">
                                            <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-1 font-medium">Avatar</p>
                                            <img
                                                src={getMediaUrl(testimonial.image)}
                                                alt="Testimonial Avatar"
                                                className="w-16 h-16 object-cover rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer hover:opacity-90 transition-opacity"
                                                onClick={() => setActiveLightbox({
                                                    images: [getMediaUrl(testimonial.image!)],
                                                    currentIndex: 0,
                                                    title: `${testimonial.name} - Photo`
                                                })}
                                            />
                                        </div>
                                    )}
                                    {reviewImgs.length > 0 && (
                                        <div className="flex-shrink-0">
                                            <div className="flex items-center gap-1.5 mb-1">
                                                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                                                    📷 Review Proof ({reviewImgs.length})
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {reviewImgs.slice(0, 3).map((rImg, rIdx) => (
                                                    <div key={rIdx} className="relative group/thumb">
                                                        <img
                                                            src={getMediaUrl(rImg)}
                                                            alt={`Review Proof ${rIdx + 1}`}
                                                            className="w-20 h-16 object-cover rounded-lg border-2 border-emerald-400 dark:border-emerald-600 cursor-pointer hover:scale-105 transition-transform"
                                                            onClick={() => setActiveLightbox({
                                                                images: reviewImgs.map(img => getMediaUrl(img)),
                                                                currentIndex: rIdx,
                                                                title: `${testimonial.name} - Review Proof`
                                                            })}
                                                        />
                                                        {rIdx === 2 && reviewImgs.length > 3 && (
                                                            <div 
                                                                onClick={() => setActiveLightbox({
                                                                    images: reviewImgs.map(img => getMediaUrl(img)),
                                                                    currentIndex: 2,
                                                                    title: `${testimonial.name} - Review Proof`
                                                                })}
                                                                className="absolute inset-0 bg-black/60 rounded-lg flex items-center justify-center text-white text-xs font-bold cursor-pointer hover:bg-black/70"
                                                            >
                                                                +{reviewImgs.length - 3}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {testimonial.video && (
                                        <div className="flex-shrink-0">
                                            <p className="text-[10px] text-blue-500 mb-1 font-medium">Video</p>
                                            <div className="w-36 h-20 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center border border-gray-200 dark:border-gray-700 overflow-hidden">
                                                <video
                                                    src={getMediaUrl(testimonial.video)}
                                                    controls
                                                    className="w-full h-full object-cover"
                                                >
                                                    Your browser does not support the video tag.
                                                </video>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })()}

                        <div className="flex items-center">
                            <div className="bg-blue-100 dark:bg-blue-900 rounded-full p-2 mr-3">
                                {testimonial.image ? (
                                    <img
                                        src={getMediaUrl(testimonial.image)}
                                        alt={testimonial.name}
                                        className="w-5 h-5 rounded-full object-cover"
                                    />
                                ) : (
                                    <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                )}
                            </div>
                            <div>
                                <p className="font-medium text-gray-900 dark:text-gray-100">{testimonial.name}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                                    <Briefcase className="w-3 h-3 mr-1" />
                                    {testimonial.role}
                                </p>
                                {testimonial.courseId && (
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center">
                                        <BookOpen className="w-3 h-3 mr-1" />
                                        {coursesList.find(c => c._id === testimonial.courseId)?.title || `Course: ${testimonial.courseId}`}
                                    </p>
                                )}
                            </div>
                        </div>
                        {testimonial.createdAt && (
                            <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                                Added on: {new Date(testimonial.createdAt).toLocaleDateString()}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Add Testimonial Modal */}
            {showAddForm && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[99999] p-3 sm:p-5 overflow-y-auto"
                    onClick={() => setShowAddForm(false)}
                >
                    <div
                        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full p-6 sm:p-7 max-h-[90vh] overflow-y-auto border border-gray-100 dark:border-gray-700 my-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                {isEditMode ? 'Edit Testimonial' : 'Add Testimonial'}
                            </h3>
                            <button
                                onClick={() => {
                                    resetForm();
                                    setShowAddForm(false);
                                }}
                                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Name
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                    placeholder="Enter name"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Role/Position
                                </label>
                                <input
                                    type="text"
                                    name="role"
                                    value={formData.role}
                                    onChange={handleInputChange}
                                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                    placeholder="Enter role or position"
                                    required
                                />
                            </div>

                            {isEditMode && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Status
                                    </label>
                                    <div className="relative">
                                        <select
                                            name="status"
                                            value={formData.status || 'pending'}
                                            onChange={handleInputChange}
                                            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white appearance-none"
                                        >
                                            <option value="pending">Pending</option>
                                            <option value="approved">Approved</option>
                                            <option value="rejected">Rejected</option>
                                        </select>
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Course (Optional)
                                </label>
                                <div className="relative">
                                    <select
                                        name="courseId"
                                        value={formData.courseId || ''}
                                        onChange={handleInputChange}
                                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white appearance-none"
                                    >
                                        <option value="">Select a course</option>
                                        {coursesList.map((course) => (
                                            <option key={course._id} value={course._id}>
                                                {course.title}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
                                        <BookOpen className="h-5 w-5" />
                                    </div>
                                </div>
                                {coursesLoading && (
                                    <div className="mt-1 text-sm text-blue-600 dark:text-blue-400 flex items-center">
                                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                        Loading courses...
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Rating
                                </label>
                                <StarRating rating={formData.rating} onRatingChange={handleRatingChange} />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Message
                                </label>
                                <textarea
                                    name="message"
                                    value={formData.message}
                                    onChange={handleInputChange}
                                    rows={4}
                                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                    placeholder="Enter testimonial message"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                        Student Photo (Avatar)
                                    </label>
                                    <div className="relative group overflow-hidden bg-gray-100 dark:bg-gray-700 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-blue-500 transition-colors h-24">
                                        {imagePreview ? (
                                            <div className="relative w-full h-full flex items-center justify-center p-1">
                                                <img src={imagePreview} alt="Preview" className="w-16 h-16 rounded-full object-cover border-2 border-blue-400" />
                                                <button
                                                    type="button"
                                                    onClick={() => { setImageFile(null); setImagePreview(null); }}
                                                    className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ) : (
                                            <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer p-2 text-center">
                                                <ImageIcon className="w-6 h-6 text-gray-400 mb-1" />
                                                <span className="text-[11px] text-gray-600 dark:text-gray-300 font-medium">Upload Student Photo</span>
                                                <input type="file" name="image" accept="image/*" onChange={handleFileChange} className="hidden" />
                                            </label>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                        Video (Optional)
                                    </label>
                                    <div className="relative group overflow-hidden bg-gray-100 dark:bg-gray-700 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-blue-500 transition-colors h-24">
                                        {videoPreview ? (
                                            <div className="relative w-full h-full flex items-center justify-center">
                                                <Film className="w-8 h-8 text-blue-500" />
                                                <button
                                                    type="button"
                                                    onClick={() => { setVideoFile(null); setVideoPreview(null); }}
                                                    className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <X size={14} />
                                                </button>
                                                <div className="absolute bottom-1 left-1 right-1 bg-black/50 text-[9px] text-white px-1 py-0.5 rounded truncate">
                                                    {videoFile ? videoFile.name : 'Video selected'}
                                                </div>
                                            </div>
                                        ) : (
                                            <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer p-2 text-center">
                                                <Video className="w-6 h-6 text-gray-400 mb-1" />
                                                <span className="text-[11px] text-gray-600 dark:text-gray-300 font-medium">Upload Video</span>
                                                <input type="file" name="video" accept="video/*" onChange={handleFileChange} className="hidden" />
                                            </label>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* User Review Image Section */}
                            <div className="border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/30 dark:bg-emerald-950/20 rounded-xl p-3 sm:p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <div>
                                        <label className="block text-xs font-bold text-emerald-800 dark:text-emerald-300">
                                            User Review Images (Chat Proofs / Screenshots)
                                        </label>
                                        <p className="text-[11px] text-gray-500 dark:text-gray-400">
                                            Upload one review screenshot (WhatsApp feedback, LinkedIn, Google review, etc.)
                                        </p>
                                    </div>
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300 font-bold">
                                        {existingReviewImages.length + reviewImageFiles.length} image(s)
                                    </span>
                                </div>

                                {/* Preview Grid & Upload Trigger */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-3">
                                    {/* Existing Images */}
                                    {existingReviewImages.map((imgUrl, idx) => (
                                        <div key={`existing-${idx}`} className="relative group rounded-lg overflow-hidden border-2 border-emerald-400 bg-white dark:bg-gray-700 aspect-video shadow-xs">
                                            <img
                                                src={getMediaUrl(imgUrl)}
                                                alt={`Review image ${idx + 1}`}
                                                className="w-full h-full object-cover"
                                            />
                                            <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[8px] px-1 py-0.5 rounded font-medium">
                                                Saved
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveExistingReviewImage(idx)}
                                                className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                                                title="Remove image"
                                            >
                                                <X size={12} />
                                            </button>
                                        </div>
                                    ))}

                                    {/* Newly Selected Images */}
                                    {reviewImagePreviews.map((previewUrl, idx) => (
                                        <div key={`new-${idx}`} className="relative group rounded-lg overflow-hidden border-2 border-blue-400 bg-white dark:bg-gray-700 aspect-video shadow-xs">
                                            <img
                                                src={previewUrl}
                                                alt={`New upload ${idx + 1}`}
                                                className="w-full h-full object-cover"
                                            />
                                            <span className="absolute bottom-1 left-1 bg-blue-600 text-white text-[8px] px-1 py-0.5 rounded font-medium">
                                                New
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveNewReviewImage(idx)}
                                                className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                                                title="Remove image"
                                            >
                                                <X size={12} />
                                            </button>
                                        </div>
                                    ))}

                                    {/* Add More / Upload Box */}
                                    <label className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-emerald-300 dark:border-emerald-700 hover:border-emerald-500 bg-white dark:bg-gray-800 cursor-pointer p-2 text-center aspect-video transition-colors group">
                                        <Upload className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mb-1 group-hover:scale-110 transition-transform" />
                                        <span className="text-[10px] text-emerald-800 dark:text-emerald-300 font-bold">
                                            + Add Images
                                        </span>
                                        <span className="text-[9px] text-gray-400">Select one image</span>
                                        <input
                                            type="file"
                                            name="reviewImages"
                                            accept="image/*"
                                            onChange={handleReviewImagesChange}
                                            className="hidden"
                                        />
                                    </label>
                                </div>
                            </div>

                            <div className="flex justify-end pt-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        resetForm();
                                        setShowAddForm(false);
                                    }}
                                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg mr-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                >
                                    Cancel
                                </button>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="px-5 py-2.5 bg-gradient-to-r from-[#1b6294] to-[#16517a] hover:from-[#16517a] hover:to-[#103a58] text-white rounded-xl shadow-md shadow-[#1b6294]/20 hover:shadow-lg transition-all active:scale-95 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
                                    >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            {isEditMode ? (
                                                <>
                                                    <Edit className="w-4 h-4" />
                                                    Update Testimonial
                                                </>
                                            ) : (
                                                <>
                                                    <Plus className="w-4 h-4" />
                                                    Add Testimonial
                                                </>
                                            )}
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Fullscreen Lightbox Modal for Screenshots / Media */}
            {activeLightbox && (
                <div
                    className="fixed inset-0 z-[999999] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5"
                    onClick={() => setActiveLightbox(null)}
                >
                    <div
                        className="relative max-w-4xl max-h-[92vh] w-full bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-2xl p-3 flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 dark:border-gray-700">
                            <div className="flex items-center gap-2">
                                <h4 className="text-sm font-bold text-gray-800 dark:text-gray-100 truncate">
                                    {activeLightbox.title}
                                </h4>
                                {activeLightbox.images.length > 1 && (
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300 font-bold">
                                        {activeLightbox.currentIndex + 1} of {activeLightbox.images.length}
                                    </span>
                                )}
                            </div>
                            <button
                                onClick={() => setActiveLightbox(null)}
                                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Main Image View with Prev/Next buttons */}
                        <div className="relative flex-1 overflow-auto p-2 flex items-center justify-center min-h-[350px] max-h-[65vh] bg-slate-950/10 dark:bg-slate-950/40 rounded-xl my-2">
                            {activeLightbox.images.length > 1 && (
                                <>
                                    <button
                                        type="button"
                                        onClick={() => setActiveLightbox(prev => prev ? ({
                                            ...prev,
                                            currentIndex: (prev.currentIndex - 1 + prev.images.length) % prev.images.length
                                        }) : null)}
                                        className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white transition-colors z-10 shadow-lg"
                                        title="Previous image"
                                    >
                                        <ChevronLeft size={20} />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setActiveLightbox(prev => prev ? ({
                                            ...prev,
                                            currentIndex: (prev.currentIndex + 1) % prev.images.length
                                        }) : null)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white transition-colors z-10 shadow-lg"
                                        title="Next image"
                                    >
                                        <ChevronRight size={20} />
                                    </button>
                                </>
                            )}
                            <img
                                src={activeLightbox.images[activeLightbox.currentIndex]}
                                alt={`Image ${activeLightbox.currentIndex + 1}`}
                                className="max-w-full max-h-[62vh] object-contain rounded-lg shadow-sm"
                            />
                        </div>

                        {/* Thumbnail Strip (if multiple images) */}
                        {activeLightbox.images.length > 1 && (
                            <div className="flex gap-2 overflow-x-auto p-1 justify-center border-t border-gray-100 dark:border-gray-700 pt-2">
                                {activeLightbox.images.map((img, idx) => (
                                    <button
                                        key={idx}
                                        type="button"
                                        onClick={() => setActiveLightbox(prev => prev ? ({ ...prev, currentIndex: idx }) : null)}
                                        className={`w-14 h-12 rounded-lg overflow-hidden border-2 transition-all shrink-0 ${
                                            activeLightbox.currentIndex === idx
                                                ? 'border-emerald-500 scale-105 shadow-md'
                                                : 'border-transparent opacity-60 hover:opacity-100'
                                        }`}
                                    >
                                        <img src={img} alt={`Thumb ${idx + 1}`} className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default TestimonialsPage;
