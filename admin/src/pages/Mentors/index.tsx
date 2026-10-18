import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../../store';
import { fetchMentors, addMentor, resetMentorState, deleteMentor, updateMentor, Mentor } from '../../store/slices/mentor';
import { API_BASE_URL } from '../../utils/apiConfig';
import { Star, Plus, X, User, Briefcase, Loader2, AlertCircle, CheckCircle, Search, Trash2, Edit, Image as ImageIcon } from 'lucide-react';

// Confirmation Dialog Component
const ConfirmDialog = ({ isOpen, onClose, onConfirm, title, message }: any) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[99999] p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-gray-100 dark:border-gray-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">{title}</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6">{message}</p>
                <div className="flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">Cancel</button>
                    <button onClick={onConfirm} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">Delete</button>
                </div>
            </div>
        </div>
    );
};

// Success/Error Popup Component
const Popup = ({ isVisible, onClose, message, type = "success" }: any) => {
    if (!isVisible) return null;
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[99999] p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 transform transition-all duration-300 scale-100 border border-gray-100 dark:border-gray-700">
                <div className="text-center">
                    <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${type === "success" ? "bg-green-100" : "bg-red-100"}`}>
                        {type === "success" ? <CheckCircle className="w-8 h-8 text-green-600" /> : <AlertCircle className="w-8 h-8 text-red-600" />}
                    </div>
                    <h3 className={`text-xl font-semibold mb-2 ${type === "success" ? "text-green-800" : "text-red-800"}`}>
                        {type === "success" ? "Success!" : "Error!"}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-6">{message}</p>
                    <button onClick={onClose} className={`px-6 py-2 rounded-lg font-medium transition-colors ${type === "success" ? "bg-green-600 text-white hover:bg-green-700" : "bg-red-600 text-white hover:bg-red-700"}`}>Close</button>
                </div>
            </div>
        </div>
    );
};

const MentorsPage: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();

    const [mentors, setMentors] = useState<Mentor[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [showAddForm, setShowAddForm] = useState<boolean>(false);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; id: string | null }>({ show: false, id: null });
    const [isEditMode, setIsEditMode] = useState<boolean>(false);
    const [editId, setEditId] = useState<string | null>(null);

    const [popup, setPopup] = useState({ isVisible: false, message: '', type: 'success' as 'success' | 'error' });

    const initialFormState = {
        name: '',
        role: '',
        exCompanies: '',
        experienceBadge: '',
        stats: '',
        bio: '',
        skills: '',
        accentGradient: '',
        glowColor: '',
        borderColor: '',
        status: 'active'
    };

    const [formData, setFormData] = useState(initialFormState);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const BASE_URL = API_BASE_URL;
    const getMediaUrl = (path: string) => {
        if (!path) return '';
        if (path.startsWith('http')) return path;
        const normalizedPath = path.startsWith('/') ? path.slice(1) : path;
        return `${BASE_URL}/${normalizedPath}`;
    };

    const fetchMentorsData = useCallback(async (status: string = 'all') => {
        const token = localStorage.getItem('token') || '';
        setLoading(true);
        try {
            const result = await dispatch(fetchMentors({ token, status: status !== 'all' ? status : undefined })).unwrap();
            setMentors(result);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch mentors');
        } finally {
            setLoading(false);
        }
    }, [dispatch]);

    useEffect(() => {
        fetchMentorsData();
        return () => { dispatch(resetMentorState()); };
    }, [fetchMentorsData, dispatch]);

    const filteredMentors = mentors.filter(mentor => {
        const matchesSearch = mentor.name?.toLowerCase().includes(searchTerm.toLowerCase()) || mentor.role?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || mentor.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { files } = e.target;
        if (files && files[0]) {
            setImageFile(files[0]);
            setImagePreview(URL.createObjectURL(files[0]));
        }
    };

    const resetForm = () => {
        setFormData(initialFormState);
        setImageFile(null);
        setImagePreview(null);
        setEditId(null);
        setIsEditMode(false);
    };

    const handleEditClick = (mentor: Mentor) => {
        if (!mentor._id) return;
        setFormData({
            name: mentor.name || '',
            role: mentor.role || '',
            exCompanies: mentor.exCompanies ? mentor.exCompanies.join(', ') : '',
            experienceBadge: mentor.experienceBadge || '',
            stats: mentor.stats ? JSON.stringify(mentor.stats) : '',
            bio: mentor.bio ? mentor.bio.join('\n\n') : '',
            skills: mentor.skills ? mentor.skills.join(', ') : '',
            accentGradient: mentor.accentGradient || '',
            glowColor: mentor.glowColor || '',
            borderColor: mentor.borderColor || '',
            status: mentor.status || 'active'
        });
        setImagePreview(mentor.image ? getMediaUrl(mentor.image) : null);
        setImageFile(null);
        setEditId(mentor._id);
        setIsEditMode(true);
        setShowAddForm(true);
    };

    const handleDelete = async (id: string) => {
        if (!id) return;
        const token = localStorage.getItem('token') || '';
        setLoading(true);
        try {
            await dispatch(deleteMentor({ mentorId: id, token })).unwrap();
            await fetchMentorsData(statusFilter);
            setDeleteConfirm({ show: false, id: null });
            setPopup({ isVisible: true, message: 'Mentor deleted successfully!', type: 'success' });
        } catch (err: any) {
            setPopup({ isVisible: true, message: err.message || 'Failed to delete mentor', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setPopup({ isVisible: false, message: '', type: 'success' });
        const token = localStorage.getItem('token') || '';
        setLoading(true);

        const formDataToSend = new FormData();
        formDataToSend.append('name', formData.name);
        formDataToSend.append('role', formData.role);
        formDataToSend.append('experienceBadge', formData.experienceBadge);
        
        // Convert comma separated strings to arrays/json for backend
        const exCompaniesArr = formData.exCompanies.split(',').map(s => s.trim()).filter(Boolean);
        formDataToSend.append('exCompanies', JSON.stringify(exCompaniesArr));
        
        const skillsArr = formData.skills.split(',').map(s => s.trim()).filter(Boolean);
        formDataToSend.append('skills', JSON.stringify(skillsArr));

        const bioArr = formData.bio.split('\n').map(s => s.trim()).filter(Boolean);
        formDataToSend.append('bio', JSON.stringify(bioArr));

        try {
            if (formData.stats) {
                const parsed = JSON.parse(formData.stats);
                formDataToSend.append('stats', JSON.stringify(parsed));
            }
        } catch (e) {
            setPopup({ isVisible: true, message: 'Invalid JSON for Stats', type: 'error' });
            setLoading(false);
            return;
        }

        formDataToSend.append('accentGradient', formData.accentGradient);
        formDataToSend.append('glowColor', formData.glowColor);
        formDataToSend.append('borderColor', formData.borderColor);
        formDataToSend.append('status', formData.status);

        if (imageFile) formDataToSend.append('image', imageFile);

        try {
            if (isEditMode && editId) {
                await dispatch(updateMentor({ mentorId: editId, data: formDataToSend, token })).unwrap();
                setPopup({ isVisible: true, message: 'Mentor updated successfully!', type: 'success' });
            } else {
                await dispatch(addMentor({ mentor: formDataToSend, token })).unwrap();
                setPopup({ isVisible: true, message: 'Mentor added successfully!', type: 'success' });
            }
            await fetchMentorsData(statusFilter);
            resetForm();
            setShowAddForm(false);
        } catch (err: any) {
            setPopup({ isVisible: true, message: err.message || 'Failed to save mentor', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <Popup isVisible={popup.isVisible} message={popup.message} type={popup.type} onClose={() => setPopup({ ...popup, isVisible: false })} />
            <ConfirmDialog isOpen={deleteConfirm.show} onClose={() => setDeleteConfirm({ show: false, id: null })} onConfirm={() => deleteConfirm.id && handleDelete(deleteConfirm.id)} title="Delete Mentor" message="Are you sure you want to delete this mentor?" />

            <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4 sm:mb-0">Mentors Management</h1>
                <button onClick={() => { resetForm(); setShowAddForm(true); }} className="px-5 py-2.5 bg-gradient-to-r from-[#1b6294] to-[#16517a] hover:from-[#16517a] hover:to-[#103a58] text-white rounded-xl shadow-md flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Add Mentor
                </button>
            </div>

            <div className="mb-8 p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1 max-w-md relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400"><Search className="w-4 h-4" /></div>
                    <input type="text" className="bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl block w-full pl-10 pr-9 py-2.5 dark:bg-gray-700/60 dark:text-white" placeholder="Search mentors..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
            </div>

            {loading && <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>}
            
            {!loading && filteredMentors.length === 0 && (
                <div className="p-6 bg-gray-50 border border-gray-200 rounded-lg text-center">
                    <User className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p className="text-gray-600">No mentors found.</p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredMentors.map((mentor) => (
                    <div key={mentor._id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5 shadow-sm">
                        <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-3">
                                {mentor.image ? (
                                    <img src={getMediaUrl(mentor.image)} alt={mentor.name} className="w-12 h-12 rounded-full object-cover border" />
                                ) : (
                                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600"><User /></div>
                                )}
                                <div>
                                    <h3 className="font-bold text-lg dark:text-white">{mentor.name}</h3>
                                    <p className="text-sm text-gray-500">{mentor.role}</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => handleEditClick(mentor)} className="p-1 text-blue-600 hover:text-blue-800"><Edit size={16} /></button>
                                <button onClick={() => setDeleteConfirm({ show: true, id: mentor._id || null })} className="p-1 text-red-600 hover:text-red-800"><Trash2 size={16} /></button>
                            </div>
                        </div>
                        <div className="text-xs text-gray-600 mt-2">
                            <strong>Skills:</strong> {mentor.skills?.join(', ')}
                        </div>
                    </div>
                ))}
            </div>

            {showAddForm && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[99999] p-3 sm:p-5 overflow-y-auto" onClick={() => setShowAddForm(false)}>
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full p-6 sm:p-7 max-h-[90vh] overflow-y-auto my-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold dark:text-white">{isEditMode ? 'Edit Mentor' : 'Add Mentor'}</h3>
                            <button onClick={() => setShowAddForm(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                                    <input type="text" name="name" required value={formData.name} onChange={handleInputChange} className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm dark:bg-gray-700 dark:text-white" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
                                    <input type="text" name="role" required value={formData.role} onChange={handleInputChange} className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm dark:bg-gray-700 dark:text-white" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Experience Badge</label>
                                <input type="text" name="experienceBadge" value={formData.experienceBadge} onChange={handleInputChange} placeholder="e.g. 4+ Years Industry Experience" className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm dark:bg-gray-700 dark:text-white" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ex Companies (comma separated)</label>
                                <input type="text" name="exCompanies" value={formData.exCompanies} onChange={handleInputChange} placeholder="Ex-Cognizant, Ex-PwC" className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm dark:bg-gray-700 dark:text-white" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Skills (comma separated)</label>
                                <input type="text" name="skills" value={formData.skills} onChange={handleInputChange} placeholder="Python, SQL, Data Analytics" className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm dark:bg-gray-700 dark:text-white" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Stats (JSON array)</label>
                                <textarea name="stats" rows={3} value={formData.stats} onChange={handleInputChange} placeholder='[{"label": "Industry Exp", "value": "4+ Yrs"}]' className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm dark:bg-gray-700 dark:text-white"></textarea>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bio (Line separated paragraphs)</label>
                                <textarea name="bio" rows={4} value={formData.bio} onChange={handleInputChange} className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm dark:bg-gray-700 dark:text-white"></textarea>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Accent Gradient</label>
                                    <input type="text" name="accentGradient" value={formData.accentGradient} onChange={handleInputChange} placeholder="from-blue-500/10 via-[#3498db]/15 to-transparent" className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm dark:bg-gray-700 dark:text-white" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Glow Color</label>
                                    <input type="text" name="glowColor" value={formData.glowColor} onChange={handleInputChange} placeholder="shadow-blue-500/15" className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm dark:bg-gray-700 dark:text-white" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Border Color</label>
                                    <input type="text" name="borderColor" value={formData.borderColor} onChange={handleInputChange} placeholder="hover:border-[#3498db]" className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm dark:bg-gray-700 dark:text-white" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mentor Image</label>
                                <input type="file" name="image" accept="image/*" onChange={handleFileChange} className="w-full text-sm dark:text-white" />
                                {imagePreview && <img src={imagePreview} alt="Preview" className="mt-2 w-20 h-20 object-cover rounded" />}
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                                <select name="status" value={formData.status} onChange={handleInputChange} className="w-full rounded-lg border-gray-300 border px-3 py-2 text-sm dark:bg-gray-700 dark:text-white">
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>

                            <div className="flex justify-end gap-3 mt-6">
                                <button type="button" onClick={() => setShowAddForm(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm dark:text-white hover:bg-gray-50">Cancel</button>
                                <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
                                    {loading ? 'Saving...' : isEditMode ? 'Update Mentor' : 'Add Mentor'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MentorsPage;
