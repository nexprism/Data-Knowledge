import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../store';
import { fetchTestimonials, addTestimonial, resetTestimonialState, deleteTestimonial, updateTestimonial, reorderTestimonials } from '../store/slices/testimonial';
import { fetchCourses } from '../store/slices/course';
import { API_BASE_URL } from '../utils/apiConfig';
import { Star, Plus, X, MessageCircle, User, Camera, Crop, Briefcase, Loader2, AlertCircle, CheckCircle, Search, Trash2, Edit, BookOpen, Image as ImageIcon, Video, Upload, Film, ChevronLeft, ChevronRight, GripVertical, Sparkles, ArrowUpDown, ChevronUp, ChevronDown, ChevronsUp, ChevronsDown, RotateCcw, Check } from 'lucide-react';
import AvatarCropModal from '../components/common/AvatarCropModal';

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
    order?: number;
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
        order: 1,
    });

    const [imageFile, setImageFile] = useState<File | null>(null);
    const [reviewImageFiles, setReviewImageFiles] = useState<File[]>([]);
    const [reviewImagePreviews, setReviewImagePreviews] = useState<string[]>([]);
    const [existingReviewImages, setExistingReviewImages] = useState<string[]>([]);
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [avatarLoadError, setAvatarLoadError] = useState<boolean>(false);
    const [rawCropImage, setRawCropImage] = useState<string | null>(null);
    const [isCropModalOpen, setIsCropModalOpen] = useState<boolean>(false);
    const [videoPreview, setVideoPreview] = useState<string | null>(null);
    const [activeLightbox, setActiveLightbox] = useState<{
        images: string[];
        currentIndex: number;
        title: string;
    } | null>(null);

    // Drag-and-Drop Reordering State
    const [draggedItem, setDraggedItem] = useState<TestimonialData | null>(null);
    const [dragOverItemId, setDragOverItemId] = useState<string | null>(null);
    const [isReordering, setIsReordering] = useState<boolean>(false);

    // Reorder Modal State
    const [isReorderModalOpen, setIsReorderModalOpen] = useState<boolean>(false);
    const [modalTestimonials, setModalTestimonials] = useState<TestimonialData[]>([]);
    const [modalFilter, setModalFilter] = useState<string>('all');
    const [modalDraggedItem, setModalDraggedItem] = useState<TestimonialData | null>(null);
    const [modalDragOverItemId, setModalDragOverItemId] = useState<string | null>(null);
    const [isSavingModalOrder, setIsSavingModalOrder] = useState<boolean>(false);

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

    // Drag and Drop Handlers
    const handleDragStart = (e: React.DragEvent, item: TestimonialData) => {
        setDraggedItem(item);
        e.dataTransfer.setData('text/plain', item._id || '');
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragEnd = () => {
        setDraggedItem(null);
        setDragOverItemId(null);
    };

    const handleDragOverItem = (e: React.DragEvent, itemId: string) => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'move';
        if (dragOverItemId !== itemId) {
            setDragOverItemId(itemId);
        }
    };

    const persistStatusOrOrder = async (items: { id: string; order?: number; status?: string }[]) => {
        const token = localStorage.getItem('token') || '';
        try {
            setIsReordering(true);
            await dispatch(reorderTestimonials({ items, token })).unwrap();
        } catch (err) {
            console.error('Failed to persist order:', err);
            fetchTestimonialsData(statusFilter);
        } finally {
            setIsReordering(false);
        }
    };

    const handleDropOnItem = async (e: React.DragEvent, targetItem: TestimonialData, targetStatus?: string) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOverItemId(null);

        if (!draggedItem || !draggedItem._id || draggedItem._id === targetItem._id) {
            setDraggedItem(null);
            return;
        }

        const currentList = [...testimonials];
        const fromIndex = currentList.findIndex(t => t._id === draggedItem._id);
        const toIndex = currentList.findIndex(t => t._id === targetItem._id);

        if (fromIndex === -1 || toIndex === -1) {
            setDraggedItem(null);
            return;
        }

        const effectiveStatus = targetStatus || targetItem.status || draggedItem.status || 'pending';

        // Move item to new position
        const [removed] = currentList.splice(fromIndex, 1);
        const moved = { ...removed, status: effectiveStatus };
        currentList.splice(toIndex, 0, moved);

        // Assign clean sequential order index
        const updatedWithOrder = currentList.map((item, idx) => ({
            ...item,
            order: idx
        }));

        setTestimonials(updatedWithOrder);
        setDraggedItem(null);

        setPopup({
            isVisible: true,
            message: `Updated position for "${draggedItem.name || 'testimonial'}"!`,
            type: 'success'
        });

        const itemsToPersist = updatedWithOrder.map((item, idx) => ({
            id: item._id!,
            order: idx,
            status: item.status
        }));

        await persistStatusOrOrder(itemsToPersist);
    };

    // Reorder Modal Actions & Handlers
    const openReorderModal = () => {
        const sorted = [...testimonials].sort((a, b) => {
            const orderA = typeof a.order === 'number' ? a.order : 0;
            const orderB = typeof b.order === 'number' ? b.order : 0;
            if (orderA !== orderB) return orderA - orderB;
            const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return timeB - timeA;
        });
        setModalTestimonials(sorted);
        setModalFilter('all');
        setIsReorderModalOpen(true);
    };

    const handleModalMoveItem = (itemId: string, direction: 'up' | 'down') => {
        const index = modalTestimonials.findIndex(t => t._id === itemId);
        if (index === -1) return;
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= modalTestimonials.length) return;

        const updated = [...modalTestimonials];
        const [moved] = updated.splice(index, 1);
        updated.splice(targetIndex, 0, moved);

        const reindexed = updated.map((item, idx) => ({ ...item, order: idx }));
        setModalTestimonials(reindexed);
    };

    const handleModalMoveExtreme = (itemId: string, position: 'top' | 'bottom') => {
        const index = modalTestimonials.findIndex(t => t._id === itemId);
        if (index === -1) return;
        const targetIndex = position === 'top' ? 0 : modalTestimonials.length - 1;
        if (index === targetIndex) return;

        const updated = [...modalTestimonials];
        const [moved] = updated.splice(index, 1);
        updated.splice(targetIndex, 0, moved);

        const reindexed = updated.map((item, idx) => ({ ...item, order: idx }));
        setModalTestimonials(reindexed);
    };

    const handleModalDragStart = (e: React.DragEvent, item: TestimonialData) => {
        setModalDraggedItem(item);
        e.dataTransfer.setData('text/plain', item._id || '');
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleModalDragEnd = () => {
        setModalDraggedItem(null);
        setModalDragOverItemId(null);
    };

    const handleModalDragOver = (e: React.DragEvent, itemId: string) => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'move';
        if (modalDragOverItemId !== itemId) {
            setModalDragOverItemId(itemId);
        }
    };

    const handleModalDrop = (e: React.DragEvent, targetItem: TestimonialData) => {
        e.preventDefault();
        e.stopPropagation();
        setModalDragOverItemId(null);

        if (!modalDraggedItem || !modalDraggedItem._id || modalDraggedItem._id === targetItem._id) {
            setModalDraggedItem(null);
            return;
        }

        const currentList = [...modalTestimonials];
        const fromIndex = currentList.findIndex(t => t._id === modalDraggedItem._id);
        const toIndex = currentList.findIndex(t => t._id === targetItem._id);

        if (fromIndex === -1 || toIndex === -1) {
            setModalDraggedItem(null);
            return;
        }

        const [removed] = currentList.splice(fromIndex, 1);
        currentList.splice(toIndex, 0, removed);

        const reindexed = currentList.map((item, idx) => ({
            ...item,
            order: idx
        }));

        setModalTestimonials(reindexed);
        setModalDraggedItem(null);
    };

    const handleModalQuickSort = (preset: 'newest' | 'rating' | 'reset') => {
        if (preset === 'reset') {
            const sorted = [...testimonials].sort((a, b) => {
                const orderA = typeof a.order === 'number' ? a.order : 0;
                const orderB = typeof b.order === 'number' ? b.order : 0;
                if (orderA !== orderB) return orderA - orderB;
                const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                return timeB - timeA;
            });
            setModalTestimonials(sorted);
            return;
        }

        const list = [...modalTestimonials];
        if (preset === 'newest') {
            list.sort((a, b) => {
                const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                return dateB - dateA;
            });
        } else if (preset === 'rating') {
            list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        }

        const reindexed = list.map((item, idx) => ({ ...item, order: idx }));
        setModalTestimonials(reindexed);
    };

    const handleSaveModalOrder = async () => {
        const token = localStorage.getItem('token') || '';
        try {
            setIsSavingModalOrder(true);
            const itemsToPersist = modalTestimonials.map((item, idx) => ({
                id: item._id!,
                order: idx,
                status: item.status
            }));

            await dispatch(reorderTestimonials({ items: itemsToPersist, token })).unwrap();

            setTestimonials(modalTestimonials);
            setIsReorderModalOpen(false);

            setPopup({
                isVisible: true,
                message: 'Testimonials order successfully updated and saved!',
                type: 'success'
            });
        } catch (err: any) {
            console.error('Failed to save order from modal:', err);
            setPopup({
                isVisible: true,
                message: err?.message || 'Failed to save order. Please try again.',
                type: 'error'
            });
        } finally {
            setIsSavingModalOrder(false);
        }
    };

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
                const rawUrl = URL.createObjectURL(file);
                setRawCropImage(rawUrl);
                setAvatarLoadError(false);
                setIsCropModalOpen(true);
                // Reset input so selecting the same file triggers onChange again
                e.target.value = '';
            } else if (name === 'video') {
                setVideoFile(file);
                setVideoPreview(URL.createObjectURL(file));
            }
        }
    };

    const handleCropComplete = (croppedFile: File, croppedPreviewUrl: string) => {
        setImageFile(croppedFile);
        setImagePreview(croppedPreviewUrl);
        setAvatarLoadError(false);
        setRawCropImage(null);
        setIsCropModalOpen(false);
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
            order: 1,
        });
        setImageFile(null);
        setImagePreview(null);
        setAvatarLoadError(false);
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
            video: testimonial.video,
            order: typeof testimonial.order === 'number' ? testimonial.order + 1 : 1
        });

        setImagePreview(testimonial.image ? getMediaUrl(testimonial.image) : null);
        setAvatarLoadError(false);
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
        if (formData.order !== undefined) {
            formDataToSend.append('order', String(Math.max(0, formData.order - 1)));
        }
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
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2.5">
                        Testimonials Management
                        {isReordering && (
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 animate-pulse">
                                <Loader2 className="w-3 h-3 animate-spin" /> Saving position...
                            </span>
                        )}
                    </h1>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-blue-500" />
                        Drag & drop cards to reorder display position on the website
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowAddForm(true)}
                        className="px-5 py-2.5 bg-gradient-to-r from-[#1b6294] to-[#16517a] hover:from-[#16517a] hover:to-[#103a58] text-white rounded-xl shadow-md shadow-[#1b6294]/20 hover:shadow-lg transition-all active:scale-95 font-medium flex items-center gap-2 cursor-pointer"
                    >
                        <Plus className="w-4 h-4" />
                        Add Testimonial
                    </button>
                </div>
            </div>

            {/* Filters & Search */}
            <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/80 dark:border-gray-700/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
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
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-medium mr-1 whitespace-nowrap">Filter Status:</span>
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

                    <div className="h-5 w-px bg-gray-200 dark:bg-gray-700 mx-1 hidden sm:block" />

                    <button
                        type="button"
                        onClick={openReorderModal}
                        className="px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 text-blue-700 border border-blue-200/90 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800 flex items-center gap-1.5 shadow-2xs shrink-0 active:scale-95"
                        title="Open modal to arrange testimonials display order"
                    >
                        <ArrowUpDown className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        <span>Change Order</span>
                    </button>
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

            {/* Reusable Testimonial Card Component */}
            {(() => {
                const renderCard = (testimonial: TestimonialData, index?: number) => {
                    const isBeingDragged = draggedItem?._id === testimonial._id;
                    const isDropTarget = dragOverItemId === testimonial._id;
                    const reviewImgs = getTestimonialReviewImages(testimonial);

                    return (
                        <div
                            key={testimonial._id || `testimonial-${Math.random().toString(36).substr(2, 9)}`}
                            draggable={true}
                            onDragStart={(e) => handleDragStart(e, testimonial)}
                            onDragEnd={handleDragEnd}
                            onDragOver={(e) => handleDragOverItem(e, testimonial._id || '')}
                            onDrop={(e) => handleDropOnItem(e, testimonial, testimonial.status)}
                            className={`group/card relative bg-white dark:bg-gray-800 border rounded-2xl p-4 sm:p-5 shadow-xs transition-all duration-150 select-none ${
                                isBeingDragged
                                    ? 'opacity-40 border-dashed border-2 border-blue-500 scale-[0.98] shadow-2xl'
                                    : isDropTarget
                                        ? 'border-t-4 border-t-blue-500 border-gray-300 dark:border-gray-600 shadow-md ring-2 ring-blue-500/20'
                                        : 'border-gray-200/90 dark:border-gray-700 hover:border-blue-400/80 hover:shadow-md'
                            }`}
                        >
                            {/* Top row: Drag Grip Handle, Order Index, Star Rating, Status pill & Actions */}
                            <div className="flex justify-between items-start mb-3 gap-2">
                                <div className="flex items-center gap-1.5">
                                    {/* Drag Handle */}
                                    <div 
                                        className="p-1 rounded-lg text-gray-400 group-hover/card:text-blue-500 hover:bg-blue-50 dark:hover:bg-gray-700 cursor-grab active:cursor-grabbing transition-colors"
                                        title="Click & drag to reorder display position"
                                    >
                                        <GripVertical className="w-4 h-4" />
                                    </div>

                                    {typeof index === 'number' && (
                                        <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-gray-700 text-slate-500 dark:text-gray-300 font-mono">
                                            #{index + 1}
                                        </span>
                                    )}

                                    <StarRating rating={testimonial.rating || 0} />
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full capitalize border ${
                                        testimonial.status === 'approved'
                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                                            : testimonial.status === 'rejected'
                                                ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800'
                                                : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
                                    }`}>
                                        {testimonial.status || 'pending'}
                                    </span>

                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleEditClick(testimonial);
                                        }}
                                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                                        title="Edit testimonial"
                                    >
                                        <Edit size={14} />
                                    </button>
                                    {testimonial._id && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setDeleteConfirm({ show: true, id: testimonial._id || null });
                                            }}
                                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                                            title="Delete testimonial"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Message Content */}
                            <p className="text-sm text-gray-700 dark:text-gray-300 mb-3.5 italic line-clamp-3 leading-relaxed">
                                "{testimonial.message}"
                            </p>

                            {/* Media Row: Avatar, Screenshot Proofs, Video */}
                            {(() => {
                                const hasMedia = Boolean(testimonial.image || reviewImgs.length > 0 || testimonial.video);
                                if (!hasMedia) return null;

                                return (
                                    <div className="flex gap-2.5 mb-3.5 overflow-x-auto pb-1">
                                        {testimonial.image && (
                                            <div className="shrink-0">
                                                <span className="text-[9px] text-gray-400 block mb-0.5 font-bold uppercase tracking-wider">Avatar</span>
                                                <img
                                                    src={getMediaUrl(testimonial.image)}
                                                    alt="Testimonial Avatar"
                                                    className="w-12 h-12 object-cover rounded-xl border border-gray-200 dark:border-gray-700 cursor-pointer hover:opacity-90 hover:scale-105 transition-all shadow-2xs"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setActiveLightbox({
                                                            images: [getMediaUrl(testimonial.image!)],
                                                            currentIndex: 0,
                                                            title: `${testimonial.name} - Photo`
                                                        });
                                                    }}
                                                />
                                            </div>
                                        )}
                                        {reviewImgs.length > 0 && (
                                            <div className="shrink-0">
                                                <span className="text-[9px] text-emerald-600 dark:text-emerald-400 block mb-0.5 font-bold uppercase tracking-wider">
                                                    Proof ({reviewImgs.length})
                                                </span>
                                                <div className="flex items-center gap-1.5">
                                                    {reviewImgs.slice(0, 2).map((rImg, rIdx) => (
                                                        <div key={rIdx} className="relative group/thumb">
                                                            <img
                                                                src={getMediaUrl(rImg)}
                                                                alt={`Review Proof ${rIdx + 1}`}
                                                                className="w-14 h-12 object-cover rounded-xl border-2 border-emerald-400/90 dark:border-emerald-600 cursor-pointer hover:scale-105 transition-transform shadow-2xs"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setActiveLightbox({
                                                                        images: reviewImgs.map(img => getMediaUrl(img)),
                                                                        currentIndex: rIdx,
                                                                        title: `${testimonial.name} - Review Proof`
                                                                    });
                                                                }}
                                                            />
                                                            {rIdx === 1 && reviewImgs.length > 2 && (
                                                                <div 
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setActiveLightbox({
                                                                            images: reviewImgs.map(img => getMediaUrl(img)),
                                                                            currentIndex: 1,
                                                                            title: `${testimonial.name} - Review Proof`
                                                                        });
                                                                    }}
                                                                    className="absolute inset-0 bg-black/60 rounded-xl flex items-center justify-center text-white text-[10px] font-bold cursor-pointer hover:bg-black/70"
                                                                >
                                                                    +{reviewImgs.length - 2}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {testimonial.video && (
                                            <div className="shrink-0">
                                                <span className="text-[9px] text-blue-500 block mb-0.5 font-bold uppercase tracking-wider">Video</span>
                                                <div className="w-24 h-12 bg-gray-900 rounded-xl flex items-center justify-center overflow-hidden border border-gray-700">
                                                    <video
                                                        src={getMediaUrl(testimonial.video)}
                                                        controls
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}

                            {/* Bottom row: Student details */}
                            <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-750 text-xs">
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/60 flex items-center justify-center shrink-0 border border-blue-200 dark:border-blue-700 overflow-hidden">
                                        {testimonial.image ? (
                                            <img
                                                src={getMediaUrl(testimonial.image)}
                                                alt={testimonial.name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-bold text-gray-900 dark:text-gray-100 truncate text-xs">
                                            {testimonial.name}
                                        </p>
                                        <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                                            {testimonial.role || 'Student'}
                                        </p>
                                    </div>
                                </div>

                                {testimonial.courseId && (
                                    <span 
                                        className="text-[10px] text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/40 px-2 py-0.5 rounded-md font-medium truncate max-w-[120px]"
                                        title={coursesList.find(c => c._id === testimonial.courseId)?.title}
                                    >
                                        {coursesList.find(c => c._id === testimonial.courseId)?.title || 'Course'}
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                };

                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredTestimonials.map((testimonial, idx) => renderCard(testimonial, idx))}
                    </div>
                );
            })()}

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

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Rating
                                    </label>
                                    <StarRating rating={formData.rating} onRatingChange={handleRatingChange} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Display Order (#1 = Top Priority)
                                    </label>
                                    <input
                                        type="number"
                                        name="order"
                                        min="1"
                                        value={formData.order || 1}
                                        onChange={(e) => setFormData({ ...formData, order: Math.max(1, parseInt(e.target.value) || 1) })}
                                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                        placeholder="1"
                                    />
                                </div>
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
                                    <div className="flex items-center justify-between mb-1">
                                        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                                            Student Photo (Avatar)
                                        </label>
                                        {imagePreview && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setRawCropImage(imagePreview);
                                                    setIsCropModalOpen(true);
                                                }}
                                                className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                                                title="Re-crop or center face"
                                            >
                                                <Crop className="w-3 h-3" /> Re-center / Crop
                                            </button>
                                        )}
                                    </div>
                                    <div className="relative group overflow-hidden bg-gray-100 dark:bg-gray-700 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-blue-500 transition-colors h-24">
                                        <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer p-2 text-center select-none">
                                            <input
                                                type="file"
                                                name="image"
                                                accept="image/*"
                                                onChange={handleFileChange}
                                                className="hidden"
                                            />
                                            {imagePreview && !avatarLoadError ? (
                                                <div className="relative flex items-center justify-center group/avatar">
                                                    <img
                                                        src={imagePreview}
                                                        alt="Preview"
                                                        onError={() => setAvatarLoadError(true)}
                                                        className="w-16 h-16 rounded-full object-cover border-2 border-blue-400 shadow-sm"
                                                    />
                                                    <div className="absolute inset-0 rounded-full bg-black/50 text-white flex flex-col items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity text-[10px] font-bold">
                                                        <Camera className="w-4 h-4 mb-0.5" />
                                                        Change
                                                    </div>
                                                </div>
                                            ) : imagePreview && avatarLoadError ? (
                                                <div className="relative flex items-center justify-center group/avatar">
                                                    <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/50 border-2 border-blue-400 flex items-center justify-center text-blue-600 dark:text-blue-300 font-bold text-lg">
                                                        <User className="w-8 h-8" />
                                                    </div>
                                                    <div className="absolute inset-0 rounded-full bg-black/50 text-white flex flex-col items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity text-[10px] font-bold">
                                                        <Camera className="w-4 h-4 mb-0.5" />
                                                        Change
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    <ImageIcon className="w-6 h-6 text-gray-400 mb-1" />
                                                    <span className="text-[11px] text-gray-600 dark:text-gray-300 font-medium">Upload Student Photo</span>
                                                </>
                                            )}
                                        </label>
                                        {imagePreview && (
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    setImageFile(null);
                                                    setImagePreview(null);
                                                    setAvatarLoadError(false);
                                                    setFormData(prev => ({ ...prev, image: undefined }));
                                                }}
                                                className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white p-1 rounded-full opacity-80 group-hover:opacity-100 transition-opacity z-10 cursor-pointer shadow-xs"
                                                title="Remove photo"
                                            >
                                                <X size={14} />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                        Video (Optional)
                                    </label>
                                    <div className="relative group overflow-hidden bg-gray-100 dark:bg-gray-700 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-blue-500 transition-colors h-24">
                                        <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer p-2 text-center select-none">
                                            <input type="file" name="video" accept="video/*" onChange={handleFileChange} className="hidden" />
                                            {videoPreview ? (
                                                <div className="relative flex flex-col items-center justify-center w-full">
                                                    <Film className="w-8 h-8 text-blue-500 mb-1" />
                                                    <div className="bg-black/50 text-[9px] text-white px-2 py-0.5 rounded truncate max-w-[85%]">
                                                        {videoFile ? videoFile.name : 'Video selected (Click to change)'}
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    <Video className="w-6 h-6 text-gray-400 mb-1" />
                                                    <span className="text-[11px] text-gray-600 dark:text-gray-300 font-medium">Upload Video</span>
                                                </>
                                            )}
                                        </label>
                                        {videoPreview && (
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    setVideoFile(null);
                                                    setVideoPreview(null);
                                                    setFormData(prev => ({ ...prev, video: undefined }));
                                                }}
                                                className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white p-1 rounded-full opacity-80 group-hover:opacity-100 transition-opacity z-10 cursor-pointer shadow-xs"
                                                title="Remove video"
                                            >
                                                <X size={14} />
                                            </button>
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
            {/* Change Testimonials Order Modal */}
            {isReorderModalOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[99999] p-3 sm:p-5 overflow-y-auto"
                    onClick={() => setIsReorderModalOpen(false)}
                >
                    <div
                        className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-2xl w-full p-5 sm:p-6 max-h-[90vh] flex flex-col border border-gray-100 dark:border-gray-700 my-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-700 shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                                    <ArrowUpDown className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                        Change Testimonials Order
                                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                                            {modalTestimonials.length} items
                                        </span>
                                    </h2>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                        Drag rows or click arrows to rearrange sequence. #1 is shown first on your website.
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsReorderModalOpen(false)}
                                className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Toolbar: Scope filter & Quick Sorts */}
                        <div className="flex flex-wrap items-center justify-between gap-2.5 py-2.5 px-3 bg-gray-50/80 dark:bg-gray-750/50 rounded-2xl my-3 border border-gray-100 dark:border-gray-700 shrink-0">
                            <div className="flex items-center gap-1">
                                <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 mr-1">Show:</span>
                                {(['all', 'approved', 'pending', 'rejected'] as const).map(tab => (
                                    <button
                                        key={tab}
                                        type="button"
                                        onClick={() => setModalFilter(tab)}
                                        className={`px-2.5 py-1 text-[11px] font-bold rounded-lg capitalize transition-colors cursor-pointer ${
                                            modalFilter === tab
                                                ? 'bg-blue-600 text-white shadow-2xs'
                                                : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600'
                                        }`}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>

                            <div className="flex items-center gap-1.5">
                                <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 mr-1">Sort:</span>
                                <button
                                    type="button"
                                    onClick={() => handleModalQuickSort('newest')}
                                    className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600 transition-colors cursor-pointer"
                                    title="Newest first"
                                >
                                    Newest
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleModalQuickSort('rating')}
                                    className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600 transition-colors cursor-pointer"
                                    title="Highest rating first"
                                >
                                    ★ 5-Star First
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleModalQuickSort('reset')}
                                    className="px-2 py-1 text-[11px] font-medium rounded-lg text-slate-500 hover:text-slate-800 dark:text-gray-400 dark:hover:text-gray-200 transition-colors flex items-center gap-1 cursor-pointer"
                                    title="Reset order"
                                >
                                    <RotateCcw className="w-3 h-3" /> Reset
                                </button>
                            </div>
                        </div>

                        {/* Draggable List */}
                        <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[50vh]">
                            {modalTestimonials
                                .filter(t => modalFilter === 'all' || (t.status || 'pending') === modalFilter)
                                .map((item) => {
                                    const actualGlobalIndex = modalTestimonials.findIndex(t => t._id === item._id);
                                    const isBeingDragged = modalDraggedItem?._id === item._id;
                                    const isDropTarget = modalDragOverItemId === item._id;

                                    return (
                                        <div
                                            key={item._id}
                                            draggable={true}
                                            onDragStart={(e) => handleModalDragStart(e, item)}
                                            onDragEnd={handleModalDragEnd}
                                            onDragOver={(e) => handleModalDragOver(e, item._id || '')}
                                            onDrop={(e) => handleModalDrop(e, item)}
                                            className={`flex items-center gap-2.5 p-2.5 rounded-2xl border transition-all duration-150 select-none ${
                                                isBeingDragged
                                                    ? 'opacity-40 border-dashed border-2 border-blue-500 bg-blue-50/20'
                                                    : isDropTarget
                                                        ? 'border-t-4 border-t-blue-500 bg-blue-50/40 dark:bg-blue-900/20 ring-2 ring-blue-500/20'
                                                        : 'border-gray-200/80 dark:border-gray-700/80 bg-white dark:bg-gray-800 hover:border-blue-300 dark:hover:border-blue-700 shadow-2xs'
                                            }`}
                                        >
                                            {/* Drag Handle */}
                                            <div
                                                className="p-1 rounded-md text-gray-400 hover:text-blue-600 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-grab active:cursor-grabbing transition-colors shrink-0"
                                                title="Drag to reorder"
                                            >
                                                <GripVertical className="w-4 h-4" />
                                            </div>

                                            {/* Position Badge */}
                                            <div className="shrink-0">
                                                <span className={`text-xs font-black px-2 py-1 rounded-lg font-mono min-w-[34px] inline-block text-center ${
                                                    actualGlobalIndex === 0
                                                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200 ring-1 ring-amber-300'
                                                        : actualGlobalIndex === 1
                                                            ? 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200 ring-1 ring-slate-300'
                                                            : actualGlobalIndex === 2
                                                                ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/60 dark:text-orange-200 ring-1 ring-orange-300'
                                                                : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                                                }`}>
                                                    #{actualGlobalIndex + 1}
                                                </span>
                                            </div>

                                            {/* Avatar */}
                                            <div className="w-9 h-9 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-700 shrink-0 border border-gray-200 dark:border-gray-600">
                                                {item.image ? (
                                                    <img src={getMediaUrl(item.image)} alt={item.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                        <User className="w-4 h-4" />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Details */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <h4 className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate">
                                                        {item.name}
                                                    </h4>
                                                    <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full capitalize border ${
                                                        item.status === 'approved'
                                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                                                            : item.status === 'rejected'
                                                                ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800'
                                                                : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
                                                    }`}>
                                                        {item.status || 'pending'}
                                                    </span>
                                                </div>
                                                <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                                                    {item.role || 'Student'} • <span className="text-amber-500 font-semibold">★ {item.rating || 5}</span>
                                                    {item.message ? ` — "${item.message.slice(0, 45)}..."` : ''}
                                                </p>
                                            </div>

                                            {/* Quick Step Buttons: Move to Top, Up, Down, Move to Bottom */}
                                            <div className="flex items-center gap-1 shrink-0">
                                                <button
                                                    type="button"
                                                    onClick={() => handleModalMoveExtreme(item._id!, 'top')}
                                                    disabled={actualGlobalIndex === 0}
                                                    className="p-1 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-20 disabled:hover:bg-transparent disabled:cursor-not-allowed"
                                                    title="Move to top (#1 position)"
                                                >
                                                    <ChevronsUp className="w-4 h-4" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleModalMoveItem(item._id!, 'up')}
                                                    disabled={actualGlobalIndex === 0}
                                                    className="p-1 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-20 disabled:hover:bg-transparent disabled:cursor-not-allowed"
                                                    title="Move up one position"
                                                >
                                                    <ChevronUp className="w-4 h-4" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleModalMoveItem(item._id!, 'down')}
                                                    disabled={actualGlobalIndex === modalTestimonials.length - 1}
                                                    className="p-1 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-20 disabled:hover:bg-transparent disabled:cursor-not-allowed"
                                                    title="Move down one position"
                                                >
                                                    <ChevronDown className="w-4 h-4" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleModalMoveExtreme(item._id!, 'bottom')}
                                                    disabled={actualGlobalIndex === modalTestimonials.length - 1}
                                                    className="p-1 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-20 disabled:hover:bg-transparent disabled:cursor-not-allowed"
                                                    title="Move to bottom"
                                                >
                                                    <ChevronsDown className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>

                        {/* Modal Footer */}
                        <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-100 dark:border-gray-700 shrink-0">
                            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                                {modalTestimonials.length} items ordered
                            </span>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setIsReorderModalOpen(false)}
                                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-medium text-xs cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSaveModalOrder}
                                    disabled={isSavingModalOrder}
                                    className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl shadow-md shadow-blue-500/20 font-medium text-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer disabled:opacity-60"
                                >
                                    {isSavingModalOrder ? (
                                        <>
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            Saving Order...
                                        </>
                                    ) : (
                                        <>
                                            <Check className="w-3.5 h-3.5" />
                                            Save & Apply Order
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Avatar Cropper Modal */}
            <AvatarCropModal
                isOpen={isCropModalOpen}
                imageSrc={rawCropImage}
                studentName={formData.name || 'Student'}
                onCropComplete={handleCropComplete}
                onClose={() => {
                    setIsCropModalOpen(false);
                    setRawCropImage(null);
                }}
            />
        </div>
    );
};

export default TestimonialsPage;
