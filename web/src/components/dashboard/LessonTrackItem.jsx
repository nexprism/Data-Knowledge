import React from 'react';

const LessonTrackItem = ({ title, progress = 0, isActive, onPlay, unlocked = true, type = 'video' }) => {
    const isCompleted = progress >= 100;

    const getIcon = () => {
        if (isCompleted) {
            return (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-emerald-600">
                    <polyline points="20 6 9 17 4 12" />
                </svg>
            );
        }
        switch (type) {
            case 'quiz':
                return (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-600">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                );
            case 'assignment':
                return (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                    </svg>
                );
            case 'text':
                return (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-cyan-600">
                        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                    </svg>
                );
            default:
                return (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className={isActive ? "text-blue-600" : "text-slate-600"}>
                        <path d="M5 3l14 9-14 9V3z"/>
                    </svg>
                );
        }
    };

    const getTypeBadge = () => {
        switch (type) {
            case 'quiz':
                return <span className="text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200/80 px-2 py-0.5 rounded-md">Quiz</span>;
            case 'assignment':
                return <span className="text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/80 px-2 py-0.5 rounded-md">Assignment</span>;
            case 'text':
                return <span className="text-[11px] font-semibold bg-cyan-50 text-cyan-700 border border-cyan-200/80 px-2 py-0.5 rounded-md">Reading</span>;
            default:
                return <span className="text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/80 px-2 py-0.5 rounded-md">Video</span>;
        }
    };

    const getButtonText = () => {
        switch (type) {
            case 'quiz': return 'Take Quiz';
            case 'assignment': return 'Submit Assignment';
            case 'text': return 'Start Reading';
            default: return 'Play Video';
        }
    };

    return (
        <div
            onClick={unlocked ? onPlay : undefined}
            className={`group flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 transition-all cursor-pointer
                ${isActive
                    ? 'bg-blue-50/70 border-l-4 border-l-blue-600'
                    : 'bg-white hover:bg-slate-50/80 border-l-4 border-l-transparent'
                } ${!unlocked ? 'opacity-60 cursor-not-allowed' : ''}`}
        >
            <div className="flex items-center gap-3.5 flex-1 min-w-0">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors
                    ${isCompleted
                        ? 'bg-emerald-50 border border-emerald-200'
                        : isActive
                            ? 'bg-blue-100 border border-blue-200'
                            : 'bg-slate-100 border border-slate-200 group-hover:bg-slate-200'
                    }`}
                >
                    {getIcon()}
                </div>

                <div className="space-y-1 flex-1 min-w-0 pr-3">
                    <div className="flex flex-wrap items-center gap-2">
                        <h4 className={`text-sm sm:text-[15px] font-medium tracking-tight truncate transition-colors
                            ${isActive ? 'text-blue-900 font-semibold' : 'text-slate-800 group-hover:text-blue-600'}`}>
                            {title}
                        </h4>
                        {getTypeBadge()}
                        {isActive && (
                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-blue-600 text-white flex items-center gap-1 shadow-xs">
                                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                Playing
                            </span>
                        )}
                        {isCompleted && (
                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
                                Completed
                            </span>
                        )}
                    </div>

                    {typeof progress === 'number' && progress > 0 && progress < 100 && (
                        <div className="flex items-center gap-2 max-w-xs pt-0.5">
                            <div className="w-24 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-blue-600 rounded-full"
                                    style={{ width: `${Math.min(100, Math.round(progress))}%` }}
                                />
                            </div>
                            <span className="text-[11px] text-slate-500 font-medium">
                                {Math.round(progress)}%
                            </span>
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-3 sm:mt-0 flex items-center shrink-0 sm:pl-4">
                {unlocked ? (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onPlay();
                        }}
                        className={`inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg transition-all shadow-xs
                            ${isActive
                                ? 'bg-blue-600 text-white hover:bg-blue-700'
                                : 'bg-slate-900 text-white hover:bg-blue-600'
                            }`}
                    >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M5 3l14 9-14 9V3z" />
                        </svg>
                        <span>{isActive ? 'Playing' : getButtonText()}</span>
                    </button>
                ) : (
                    <div className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="11" width="18" height="11" rx="2" />
                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                        <span>Locked</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LessonTrackItem;
