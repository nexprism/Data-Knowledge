import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { fetchCourseDetail } from '../redux/slices/courseSlice';
import sanitizeDisplay from '../utils/textSanitize';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import { getImageBaseUrl } from '../utils/apiConfig';

const DashboardReading = () => {
    const { courseId, id } = useParams();
    const dispatch = useDispatch();
    const { currentCourse, detailLoading } = useSelector((state) => state.courses);

    useEffect(() => {
        if (!currentCourse || String(currentCourse._id) !== String(courseId)) {
            dispatch(fetchCourseDetail(courseId));
        }
    }, [courseId, dispatch, currentCourse]);

    // Find the lesson/text content in the loaded course
    let reading = null;
    let lessonData = null;
    if (currentCourse) {
        for (const m of currentCourse.modules || []) {
            for (const l of m.lessons || []) {
                const lid = l._id || l.id;
                if (String(lid) === String(id) && l.type === 'text') {
                    reading = l.textLessons?.[0];
                    lessonData = l;
                    break;
                }
            }
            if (reading) break;
        }
    }

    if (detailLoading) {
        return (
            <div className="min-h-screen bg-dark flex flex-col items-center justify-center space-y-4">
                <div className="w-12 h-12 border-2 border-accent/20 border-t-accent rounded-full animate-spin" />
            </div>
        );
    }

    if (!reading) {
        return (
            <div className="min-h-screen bg-dark text-white flex items-center justify-center p-8">
                <div className="max-w-2xl text-center space-y-6">
                    <div className="w-20 h-20 bg-accent/10 border border-accent/20 rounded-full flex items-center justify-center mx-auto text-accent">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>
                    </div>
                    <h2 className="font-inter text-4xl">Transcript Not Found</h2>
                    <p className="text-description/60 font-jetbrains uppercase tracking-widest text-[10px]">Data Stream Interrupted or Invalid Record ID</p>
                    <Link to="/dashboard/my-courses" className="inline-block px-12 py-4 bg-accent text-dark font-jetbrains font-black uppercase tracking-widest text-[11px] hover:scale-105 transition-all">Return to Command</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-dark text-white selection:bg-accent/40 relative">
            <DashboardHeader />
            
            <main className="pt-20 pb-4 px-6">
                <div className="space-y-16">
                    {/* Header Section */}
                    <div className="space-y-8">
                        <Link to={`/dashboard/course/${courseId}`} className="font-jetbrains text-[8px] text-accent/40 uppercase tracking-[0.4em] hover:text-accent transition-colors flex items-center gap-2">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="m15 18-6-6 6-6"/></svg>
                            Return to Session
                        </Link>
                        
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="px-3 py-1 border border-accent/30 bg-accent/10">
                                    <span className="font-jetbrains text-[8px] text-accent uppercase tracking-widest font-black">Reading Protocol</span>
                                </div>
                            </div>
                            <h1 className="font-inter text-4xl md:text-6xl text-normal font-extralight tracking-tight leading-[0.9] uppercase">
                                {sanitizeDisplay(reading.title || lessonData.title)}
                            </h1>
                            {reading.subTitle && (
                                <p className="font-inter text-2xl md:text-3xl text-accent/60 tracking-tight leading-tight">
                                    {sanitizeDisplay(reading.subTitle)}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="h-[1px] bg-white/5 w-full shadow-[0_1px_0_rgba(255,255,255,0.05)]" />

                    {/* Content Section */}
                    <article className="space-y-16">
                        {reading.summary && (
                            <div className="space-y-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse shadow-[0_0_10px_rgba(139, 92, 246,0.5)]" />
                                    <h3 className="font-jetbrains text-xl text-accent uppercase tracking-widest font-black">Summary</h3>
                                </div>
                                <div className="p-8 bg-white/[0.02] border-l-2 border-accent/40 font-inter text-md text-normal/80 leading-relaxed break-all">
                                    {reading.summary}
                                </div>
                            </div>
                        )}
                        
                        <div className="space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse shadow-[0_0_10px_rgba(139, 92, 246,0.5)]" />
                                <h3 className="font-jetbrains text-xl text-accent uppercase tracking-widest font-black">Intelligence</h3>
                            </div>
                            <div 
                                className="font-inter text-md md:text-md text-normal/70 leading-[1.8] space-y-8 dashboard-reading-content break-all"
                                dangerouslySetInnerHTML={{ __html: reading.content || 'No transcript data recorded for this session.' }}
                            />
                        </div>
                    </article>

                    {/* Resources & Attachments */}
                    {reading.attachments && reading.attachments.length > 0 && (
                        <div className="pt-20 space-y-8">
                            <div className="flex items-center gap-4">
                                <div className="h-[1px] bg-white/10 flex-1" />
                                <h3 className="font-jetbrains text-[10px] text-description/40 uppercase tracking-[0.4em] font-black">Linked Intelligence</h3>
                                <div className="h-[1px] bg-white/10 flex-1" />
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {reading.attachments.map((file, index) => (
                                    <div key={index} className="flex items-center justify-between p-6 bg-white/[0.03] border border-white/10 hover:border-accent/40 transition-all group relative">
                                        <div className="flex items-center gap-4 relative z-10">
                                            <div className="w-12 h-12 bg-white/5 flex items-center justify-center text-accent/50 group-hover:text-accent group-hover:bg-accent/10 transition-all border border-white/5">
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                                            </div>
                                            <div>
                                                <p className="font-jetbrains text-[11px] text-normal uppercase tracking-widest leading-none mb-2 font-bold">{file.fileName || 'Resource Document'}</p>
                                                <p className="font-jetbrains text-[9px] text-normal/50 uppercase tracking-widest leading-none">
                                                    Uploaded: {new Date(file.uploadedAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                        <a 
                                            href={file.file?.startsWith('http') ? file.file : `${getImageBaseUrl()}/${file.file?.replace(/^\/+/, '')}`} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="w-10 h-10 flex items-center text-dark justify-center border border-white/10 hover:bg-accent hover:scale-105 action:scale-105 hover:text-dark transition-all relative z-10 bg-accent"
                                        >
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 13l5 5 5-5M12 18V6"/></svg>
                                        </a>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    
                </div>
            </main>

            <style>{`
                .dashboard-reading-content a { color: var(--accent-color, #8B5CF6); text-decoration: underline; text-underline-offset: 4px; }
                .dashboard-reading-content strong { color: white; font-weight: 600; }
                .dashboard-reading-content ul { list-style: disc; padding-left: 1.5rem; }
                .dashboard-reading-content ol { list-style: decimal; padding-left: 1.5rem; }
            `}</style>
        </div>
    );
};

export default DashboardReading;
