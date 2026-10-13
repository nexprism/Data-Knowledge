import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { fetchCourseDetail } from '../redux/slices/courseSlice';
import sanitizeDisplay from '../utils/textSanitize';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import authorizedFetch from '../utils/apiClient';

const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
};

const getFileUrl = (file) => {
    if (!file) return '#';
    if (file.startsWith('http')) return file;
    const rawBase = import.meta.env.VITE_BASE_URL || import.meta.env.VITE_API_BASE || 'https://api.dataknowledge.in';
    const baseUrl = rawBase.replace(/\/api\/v1\/?$/, '');
    return `${baseUrl}${file.startsWith('/') ? '' : '/'}${file}`;
};

const DashboardAssignment = () => {
    const { courseId, id } = useParams();
    const dispatch = useDispatch();
    const { currentCourse, detailLoading } = useSelector((state) => state.courses);

    const [activeTab, setActiveTab] = useState('instructions'); // 'instructions', 'submission', 'my_submissions'
    const [writtenResponse, setWrittenResponse] = useState('');
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submissions, setSubmissions] = useState([]);
    const [submissionsLoading, setSubmissionsLoading] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (!currentCourse || String(currentCourse._id) !== String(courseId)) {
            dispatch(fetchCourseDetail(courseId));
        }
    }, [courseId, dispatch, currentCourse]);

    // Find the lesson/assignment in the loaded course
    let assignment = null;
    let lessonTitle = '';
    if (currentCourse) {
        for (const m of currentCourse.modules || []) {
            for (const l of m.lessons || []) {
                const lid = l._id || l.id;
                if (String(lid) === String(id) && l.assignment) {
                    assignment = l.assignment;
                    lessonTitle = l.title;
                    break;
                }
            }
            if (assignment) break;
        }
    }

    useEffect(() => {
        if (assignment?._id) {
            fetchUserSubmissions();
        }
    }, [assignment?._id]);

    const fetchUserSubmissions = async () => {
        if (!assignment?._id) return;
        setSubmissionsLoading(true);
        try {
            const response = await authorizedFetch(`/assignment-submissions/my`);
            if (response.ok) {
                const data = await response.json();
                const filtered = (data.data || []).filter(sub => {
                    const subAssignmentId = typeof sub.assignmentId === 'object' ? sub.assignmentId?._id : sub.assignmentId;
                    return String(subAssignmentId) === String(assignment._id);
                });
                setSubmissions(filtered);
            }
        } catch (error) {
            console.error('Failed to fetch submissions:', error);
        } finally {
            setSubmissionsLoading(false);
        }
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files || []);
        setSelectedFiles(prev => [...prev, ...files]);
    };

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const files = Array.from(e.dataTransfer.files);
            setSelectedFiles(prev => [...prev, ...files]);
        }
    };

    const removeFile = (index) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        if (!writtenResponse.trim() && selectedFiles.length === 0) {
            alert('Please provide a written response or attach at least one file before submitting.');
            return;
        }

        setIsSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('submissionText', writtenResponse.trim());
            if (selectedFiles[0]) {
                formData.append('submissionFile', selectedFiles[0]);
            }
            formData.append('courseId', courseId);
            formData.append('lessonId', id);
            formData.append('assignmentId', assignment._id);

            const response = await authorizedFetch(`/assignment-submissions/`, {
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                setWrittenResponse('');
                setSelectedFiles([]);
                setShowSuccessModal(true);
                fetchUserSubmissions();
            } else {
                const err = await response.json();
                alert(err.message || 'Submission failed. Please try again.');
            }
        } catch (error) {
            console.error('Submission error:', error);
            alert('An error occurred during submission. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (detailLoading) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center space-y-4">
                <div className="w-12 h-12 border-3 border-amber-200 border-t-amber-600 rounded-full animate-spin" />
                <p className="font-inter text-sm text-slate-500 font-medium">Loading assignment details...</p>
            </div>
        );
    }

    if (!assignment) {
        return (
            <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center p-6">
                <div className="max-w-md w-full bg-white border border-slate-200 rounded-3xl p-8 text-center space-y-5 shadow-sm">
                    <div className="w-16 h-16 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-center mx-auto text-amber-600">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    </div>
                    <div className="space-y-2">
                        <h2 className="font-inter text-2xl font-bold text-slate-900">Assignment Not Found</h2>
                        <p className="font-inter text-xs text-slate-500 leading-relaxed">
                            This assignment may have been removed or you may not be enrolled in this course module.
                        </p>
                    </div>
                    <Link 
                        to={`/dashboard/course/${courseId}`} 
                        className="inline-block px-6 py-3 bg-amber-400 text-slate-900 hover:bg-amber-500 text-white font-inter font-bold text-xs rounded-xl shadow-sm transition-all"
                    >
                        Back to Course Modules
                    </Link>
                </div>
            </div>
        );
    }

    const latestSubmission = submissions[0];
    const isSubmitted = submissions.length > 0;

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-amber-100 selection:text-amber-900">
            <DashboardHeader />
            
            <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                <div className="space-y-6">
                    {/* Top Navigation & Breadcrumbs */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <Link 
                            to={`/dashboard/course/${courseId}`} 
                            className="inline-flex items-center gap-2 font-inter text-xs text-slate-600 hover:text-amber-600 font-semibold transition-colors group"
                        >
                            <span className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center group-hover:border-amber-400 group-hover:bg-amber-50 transition-all shadow-2xs">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m15 18-6-6 6-6"/></svg>
                            </span>
                            Back to Course Modules
                        </Link>

                        {/* Status Badge */}
                        <div className="flex items-center gap-2">
                            {isSubmitted ? (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-inter text-xs font-semibold">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    Submitted ({submissions.length})
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 font-inter text-xs font-semibold">
                                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                                    Pending Submission
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Header Banner Card */}
                    <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs relative overflow-hidden">
                        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-amber-50/50 to-transparent pointer-events-none" />
                        <div className="relative z-10 space-y-3">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 font-jetbrains text-[10px] font-bold uppercase tracking-wider">
                                    Course Assignment
                                </span>
                                {currentCourse?.title && (
                                    <span className="font-inter text-xs text-slate-500 font-medium truncate max-w-md">
                                        · {currentCourse.title}
                                    </span>
                                )}
                            </div>
                            <h1 className="font-inter text-2xl sm:text-3xl md:text-4xl text-slate-900 font-extrabold tracking-tight">
                                {sanitizeDisplay(assignment.title || lessonTitle)}
                            </h1>
                            <p className="font-inter text-xs sm:text-sm text-slate-600 max-w-3xl leading-relaxed">
                                Review the instructions, download the attached resources, and submit your solution before the evaluation period.
                            </p>
                        </div>
                    </div>

                    {/* Navigation Tabs Bar */}
                    <div className="flex items-center gap-2 p-1.5 bg-slate-200/60 rounded-2xl max-w-fit border border-slate-200 shadow-2xs">
                        {[
                            { id: 'instructions', label: 'Instructions & Resources', count: null },
                            { id: 'submission', label: 'Submit Work', count: null },
                            { id: 'my_submissions', label: 'My Submissions', count: submissions.length > 0 ? submissions.length : null }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-4 sm:px-6 py-2.5 rounded-xl font-inter text-xs sm:text-sm font-semibold transition-all flex items-center gap-2
                                    ${activeTab === tab.id 
                                        ? 'bg-white text-amber-700 shadow-xs border border-amber-200 font-bold' 
                                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'}`}
                            >
                                <span>{tab.label}</span>
                                {tab.count !== null && (
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${activeTab === tab.id ? 'bg-amber-100 text-amber-700' : 'bg-slate-300/80 text-slate-700'}`}>
                                        {tab.count}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Main Layout Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                        {/* Left Column: Contextual Content (8 cols) */}
                        <div className="lg:col-span-8 space-y-6">
                            
                            {/* TAB 1: Instructions & Resources */}
                            {activeTab === 'instructions' && (
                                <div className="space-y-6 animate-in fade-in duration-300">
                                    {/* Instructions Box */}
                                    <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-5">
                                        <div className="flex items-center gap-3 pb-4 border-b border-slate-200/80">
                                            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                                            </div>
                                            <div>
                                                <h3 className="font-inter text-lg sm:text-xl font-bold text-slate-900">Assignment Briefing</h3>
                                                <p className="font-inter text-xs text-slate-500">Read instructions thoroughly before preparing your response</p>
                                            </div>
                                        </div>

                                        <div className="font-inter text-sm sm:text-base text-slate-600 leading-relaxed space-y-4 break-words">
                                            {(assignment.description || 'Complete this assignment using the instructions provided by your instructor. Submit your answer or attach required documents in the submission tab.').split('\n').map((para, i) => (
                                                <p key={i}>{para}</p>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Attached Resources & Documents */}
                                    {(assignment.documentFile || assignment.attachmentFile) && (
                                        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-5">
                                            <div className="flex items-center gap-3 pb-4 border-b border-slate-200/80">
                                                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                                                </div>
                                                <div>
                                                    <h3 className="font-inter text-lg sm:text-xl font-bold text-slate-900">Reference Materials & Attachments</h3>
                                                    <p className="font-inter text-xs text-slate-500">Provided by instructor for your research and tasks</p>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 gap-3">
                                                {assignment.documentFile && (
                                                    <div className="p-4 sm:p-5 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 rounded-2xl flex items-center justify-between gap-4 transition-all group">
                                                        <div className="flex items-center gap-3.5 min-w-0">
                                                            <div className="w-11 h-11 bg-red-50 border border-red-200 rounded-xl flex items-center justify-center text-red-600 flex-shrink-0 group-hover:scale-105 transition-transform">
                                                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="font-inter text-sm text-slate-900 font-bold truncate">Assignment Document</p>
                                                                <p className="font-inter text-xs text-slate-500">Official task sheet & guidelines (PDF)</p>
                                                            </div>
                                                        </div>
                                                        <a 
                                                            href={getFileUrl(assignment.documentFile)} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer"
                                                            className="px-5 py-2.5 bg-amber-400 text-slate-900 hover:bg-amber-500 text-white rounded-xl font-inter text-xs font-bold transition-all flex items-center gap-2 shadow-xs flex-shrink-0"
                                                        >
                                                            <span>View PDF</span>
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                                                        </a>
                                                    </div>
                                                )}

                                                {assignment.attachmentFile && (
                                                    <div className="p-4 sm:p-5 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 rounded-2xl flex items-center justify-between gap-4 transition-all group">
                                                        <div className="flex items-center gap-3.5 min-w-0">
                                                            <div className="w-11 h-11 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-center text-amber-600 flex-shrink-0 group-hover:scale-105 transition-transform">
                                                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="font-inter text-sm text-slate-900 font-bold truncate">Supporting Reference File</p>
                                                                <p className="font-inter text-xs text-slate-500">Additional template / dataset</p>
                                                            </div>
                                                        </div>
                                                        <a 
                                                            href={getFileUrl(assignment.attachmentFile)} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer"
                                                            className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-inter text-xs font-bold transition-all flex items-center gap-2 flex-shrink-0"
                                                        >
                                                            <span>Download</span>
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                                                        </a>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Action prompt banner */}
                                    <div className="bg-slate-50 border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
                                        <div className="space-y-1 text-center sm:text-left">
                                            <h4 className="font-inter text-lg sm:text-xl font-bold text-slate-900">Ready to submit your solution?</h4>
                                            <p className="font-inter text-xs sm:text-sm text-slate-500">
                                                Upload your project files or write your responses directly in our editor.
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => setActiveTab('submission')}
                                            className="px-6 py-3 bg-amber-400 text-slate-900 hover:bg-amber-500 text-white font-inter font-bold text-xs sm:text-sm rounded-xl shadow-sm transition-all flex-shrink-0"
                                        >
                                            Go to Submission Tab →
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* TAB 2: Submission Form */}
                            {activeTab === 'submission' && (
                                <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-8 animate-in fade-in duration-300">
                                    <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
                                        <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                        </div>
                                        <div>
                                            <h3 className="font-inter text-lg sm:text-xl font-bold text-slate-900">Submit Your Work</h3>
                                            <p className="font-inter text-xs text-slate-500">Provide written explanations and attach your completed deliverables</p>
                                        </div>
                                    </div>

                                    {/* Written Response Field */}
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <label className="font-inter text-xs font-bold text-slate-800 uppercase tracking-wider">
                                                Written Response / Solution Summary
                                            </label>
                                            <span className="font-inter text-xs text-slate-400">
                                                {writtenResponse.length} characters
                                            </span>
                                        </div>
                                        <textarea 
                                            value={writtenResponse}
                                            onChange={(e) => setWrittenResponse(e.target.value)}
                                            placeholder="Write your explanation, answers, method, or links to repositories here..."
                                            rows={6}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-inter text-sm text-slate-800 placeholder-slate-400 focus:border-amber-500 focus:bg-white focus:ring-3 focus:ring-amber-100 transition-all outline-none resize-y"
                                        />
                                    </div>

                                    {/* Drag-and-Drop File Upload Area */}
                                    <div className="space-y-3">
                                        <label className="font-inter text-xs font-bold text-slate-800 uppercase tracking-wider block">
                                            Upload Files & Documents
                                        </label>

                                        <div 
                                            onDragEnter={handleDrag}
                                            onDragLeave={handleDrag}
                                            onDragOver={handleDrag}
                                            onDrop={handleDrop}
                                            onClick={() => fileInputRef.current?.click()}
                                            className={`w-full py-10 px-6 border-2 border-dashed rounded-2xl text-center cursor-pointer transition-all
                                                ${dragActive 
                                                    ? 'border-amber-500 bg-amber-50/50' 
                                                    : 'border-slate-300 hover:border-amber-400 bg-slate-50/60 hover:bg-amber-50/20'}`}
                                        >
                                            <input 
                                                type="file" 
                                                multiple 
                                                ref={fileInputRef} 
                                                onChange={handleFileChange}
                                                className="hidden" 
                                            />
                                            <div className="space-y-3 max-w-sm mx-auto">
                                                <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center mx-auto text-amber-600 shadow-2xs">
                                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                                                </div>
                                                <div>
                                                    <p className="font-inter text-sm font-bold text-slate-800">
                                                        Click to browse or drag and drop files
                                                    </p>
                                                    <p className="font-inter text-xs text-slate-500 mt-1">
                                                        Supports PDF, DOCX, ZIP, PNG, JPG (up to 15MB each)
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Selected Files List */}
                                        {selectedFiles.length > 0 && (
                                            <div className="space-y-2 pt-2">
                                                <p className="font-inter text-xs font-bold text-slate-600">Selected Files ({selectedFiles.length}):</p>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                                    {selectedFiles.map((file, i) => (
                                                        <div key={i} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl group">
                                                            <div className="flex items-center gap-2.5 min-w-0">
                                                                <div className="w-8 h-8 rounded-lg bg-amber-100/60 text-amber-700 flex items-center justify-center flex-shrink-0">
                                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <p className="font-inter text-xs font-semibold text-slate-900 truncate">{file.name}</p>
                                                                    <p className="font-inter text-[10px] text-slate-500">{formatFileSize(file.size)}</p>
                                                                </div>
                                                            </div>
                                                            <button 
                                                                type="button"
                                                                onClick={(e) => { e.stopPropagation(); removeFile(i); }} 
                                                                className="w-7 h-7 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 flex items-center justify-center transition-colors flex-shrink-0"
                                                                title="Remove file"
                                                            >
                                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Submit Action Button */}
                                    <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                                        <p className="font-inter text-xs text-slate-500 text-center sm:text-left">
                                            Please verify all answers and attachments before submitting.
                                        </p>
                                        <button 
                                            onClick={handleSubmit}
                                            disabled={isSubmitting}
                                            className="w-full sm:w-auto px-8 py-3.5 bg-amber-400 text-slate-900 hover:bg-amber-500 active:scale-95 text-white font-inter font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                                    <span>Submitting...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polyline points="22 2 15 22 11 13 2 9 22 2"/></svg>
                                                    <span>Submit Assignment</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* TAB 3: My Submissions */}
                            {activeTab === 'my_submissions' && (
                                <div className="space-y-6 animate-in fade-in duration-300">
                                    <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
                                        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><polyline points="9 15 11 17 15 13"/></svg>
                                                </div>
                                                <div>
                                                    <h3 className="font-inter text-lg sm:text-xl font-bold text-slate-900">Your Submissions History</h3>
                                                    <p className="font-inter text-xs text-slate-500">Track status, grading, and teacher comments</p>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={fetchUserSubmissions}
                                                className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-inter text-xs font-semibold flex items-center gap-1.5 transition-colors"
                                            >
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
                                                Refresh
                                            </button>
                                        </div>

                                        {submissionsLoading ? (
                                            <div className="py-16 text-center space-y-3">
                                                <div className="w-8 h-8 border-2 border-amber-200 border-t-amber-600 rounded-full animate-spin mx-auto" />
                                                <p className="font-inter text-xs text-slate-500">Retrieving submission history...</p>
                                            </div>
                                        ) : submissions.length === 0 ? (
                                            <div className="py-16 text-center space-y-4">
                                                <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                                                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="font-inter text-base font-bold text-slate-800">No submissions yet</p>
                                                    <p className="font-inter text-xs text-slate-500 max-w-sm mx-auto">
                                                        You haven't submitted your work for this assignment yet. Go to the Submit tab when ready.
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => setActiveTab('submission')}
                                                    className="px-6 py-2.5 bg-amber-400 text-slate-900 hover:bg-amber-500 text-white rounded-xl font-inter text-xs font-bold transition-all"
                                                >
                                                    Submit Work Now
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                {submissions.map((sub, i) => {
                                                    const status = sub.status || 'submitted';
                                                    return (
                                                        <div key={sub._id || i} className="p-5 sm:p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-4 transition-all">
                                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80">
                                                                <div className="space-y-0.5">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="font-inter text-xs font-bold text-white">
                                                                            Submission #{submissions.length - i}
                                                                        </span>
                                                                        <span className="font-inter text-[11px] text-slate-400">·</span>
                                                                        <span className="font-inter text-xs text-slate-500">
                                                                            {new Date(sub.createdAt || sub.submittedAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })} at {new Date(sub.createdAt || sub.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                        </span>
                                                                    </div>
                                                                </div>

                                                                {/* Status Pill */}
                                                                <div>
                                                                    {status === 'approved' ? (
                                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100/80 text-emerald-800 border border-emerald-300 font-inter text-xs font-bold">
                                                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                                                                            Approved & Graded
                                                                        </span>
                                                                    ) : status === 'rejected' ? (
                                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100/80 text-rose-800 border border-rose-300 font-inter text-xs font-bold">
                                                                            <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                                                                            Revision Requested
                                                                        </span>
                                                                    ) : (
                                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100/80 text-amber-800 border border-amber-300 font-inter text-xs font-bold">
                                                                            <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                                                                            Under Review
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {/* Submission Text Content */}
                                                            {sub.submissionText && (
                                                                <div className="bg-white p-4 rounded-xl border border-slate-200/80 space-y-1">
                                                                    <p className="font-inter text-[11px] font-bold text-slate-500 uppercase tracking-wider">Your Written Response</p>
                                                                    <p className="font-inter text-sm text-slate-800 whitespace-pre-wrap">{sub.submissionText}</p>
                                                                </div>
                                                            )}

                                                            {/* Attached File */}
                                                            {sub.submissionFile && (
                                                                <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200/80">
                                                                    <div className="flex items-center gap-2.5 min-w-0">
                                                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-600"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                                                                        <span className="font-inter text-xs text-slate-800 font-semibold truncate">Attached Submission Document</span>
                                                                    </div>
                                                                    <a 
                                                                        href={getFileUrl(sub.submissionFile)} 
                                                                        target="_blank" 
                                                                        rel="noopener noreferrer"
                                                                        className="font-inter text-xs text-amber-600 hover:text-amber-800 font-bold flex items-center gap-1"
                                                                    >
                                                                        Download File ↗
                                                                    </a>
                                                                </div>
                                                            )}

                                                            {/* Feedback Box */}
                                                            {sub.feedback && (
                                                                <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl space-y-1">
                                                                    <p className="font-inter text-xs font-bold text-amber-900 uppercase tracking-wider">Instructor Feedback</p>
                                                                    <p className="font-inter text-sm text-amber-950">{sub.feedback}</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Right Column: Parameters & Metadata Sidebar (4 cols) */}
                        <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-6">
                            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-7 shadow-xs space-y-6">
                                <h3 className="font-inter text-lg font-bold text-slate-900 pb-3 border-b border-slate-200/80 flex items-center justify-between">
                                    <span>Assignment Info</span>
                                    <span className="w-2 h-2 rounded-full bg-amber-600" />
                                </h3>
                                
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center py-2 border-b border-slate-200/80">
                                        <div className="flex items-center gap-2 text-slate-500">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                                            <span className="font-inter text-xs font-medium">Estimated Time</span>
                                        </div>
                                        <span className="font-inter text-xs font-bold text-slate-800">
                                            {assignment.duration ? `${assignment.duration} Minutes` : 'Self-Paced'}
                                        </span>
                                    </div>

                                    <div className="flex justify-between items-center py-2 border-b border-slate-200/80">
                                        <div className="flex items-center gap-2 text-slate-500">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                                            <span className="font-inter text-xs font-medium">Total Points</span>
                                        </div>
                                        <span className="font-inter text-xs font-bold text-amber-600">
                                            {assignment.score || 0} / {assignment.maxScore || 100} PTS
                                        </span>
                                    </div>

                                    <div className="flex justify-between items-center py-2 border-b border-slate-200/80">
                                        <div className="flex items-center gap-2 text-slate-500">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                                            <span className="font-inter text-xs font-medium">Language</span>
                                        </div>
                                        <span className="font-inter text-xs font-bold text-slate-800">
                                            {assignment.language || 'English'}
                                        </span>
                                    </div>

                                    <div className="flex justify-between items-center py-2 border-b border-slate-200/80">
                                        <div className="flex items-center gap-2 text-slate-500">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
                                            <span className="font-inter text-xs font-medium">Status</span>
                                        </div>
                                        <span className={`font-inter text-xs font-bold ${isSubmitted ? 'text-emerald-600' : 'text-amber-600'}`}>
                                            {isSubmitted ? 'Submitted' : 'Pending'}
                                        </span>
                                    </div>
                                </div>

                                {/* Primary Call To Action Button */}
                                <button 
                                    onClick={() => {
                                        if (activeTab === 'submission') {
                                            handleSubmit();
                                        } else {
                                            setActiveTab('submission');
                                        }
                                    }}
                                    disabled={isSubmitting}
                                    className="w-full py-4 bg-amber-400 text-slate-900 hover:bg-amber-500 active:scale-98  rounded-2xl font-inter font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                            <span>Submitting...</span>
                                        </>
                                    ) : activeTab === 'submission' ? (
                                        <>
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                                            <span>Confirm & Submit</span>
                                        </>
                                    ) : (
                                        <>
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                            <span>{isSubmitted ? 'Submit Another Revision' : 'Start Submission'}</span>
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* Helpful Tips Card */}
                            <div className="bg-slate-100/80 border border-slate-200 rounded-3xl p-5 space-y-3">
                                <div className="flex items-center gap-2 text-slate-800 font-inter text-xs font-bold">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-600"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                                    <span>Submission Guidelines</span>
                                </div>
                                <ul className="space-y-1.5 font-inter text-xs text-slate-600 list-disc list-inside">
                                    <li>Double-check calculations and project requirements.</li>
                                    <li>Attach clear files with proper file extensions (.pdf, .docx, .zip).</li>
                                    <li>You can re-submit if updates or revisions are needed.</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Success Modal */}
            {showSuccessModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
                    <div className="max-w-md w-full bg-white border border-slate-200 p-8 rounded-3xl shadow-xl space-y-6 text-center animate-in zoom-in-95 duration-200">
                        <div className="w-16 h-16 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-center mx-auto text-emerald-600">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                        </div>
                        
                        <div className="space-y-2">
                            <h2 className="font-inter text-2xl font-bold text-slate-900">Assignment Submitted!</h2>
                            <p className="font-inter text-xs text-slate-500 leading-relaxed">
                                Your work has been successfully delivered to your instructor. Feedback and evaluation will appear under your submissions history.
                            </p>
                        </div>

                        <div className="pt-2 flex flex-col gap-2.5">
                            <button 
                                onClick={() => {
                                    setShowSuccessModal(false);
                                    setActiveTab('my_submissions');
                                }}
                                className="w-full py-3 bg-amber-400 text-slate-900 hover:bg-amber-500 text-white font-inter font-bold text-xs rounded-xl shadow-xs transition-all"
                            >
                                View My Submissions
                            </button>
                            <button 
                                onClick={() => setShowSuccessModal(false)}
                                className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-inter font-semibold text-xs rounded-xl transition-all"
                            >
                                Back to Assignment
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DashboardAssignment;


