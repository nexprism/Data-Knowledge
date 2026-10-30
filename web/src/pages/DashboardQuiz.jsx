import React, { useState, useEffect, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { fetchCourseDetail } from '../redux/slices/courseSlice'
import sanitizeDisplay from '../utils/textSanitize'
import authorizedFetch from '../utils/apiClient'
import DashboardHeader from '../components/dashboard/DashboardHeader'

const DashboardQuiz = () => {
    const params = useParams()
    const courseId = params.courseId || null
    const id = params.id || params.courseId // If only one ID, it's the lesson ID
    
    const navigate = useNavigate()
    const dispatch = useDispatch()
    const { currentCourse, detailLoading, courses: allCourses } = useSelector((state) => state.courses)
    const { user } = useSelector((state) => state.auth)

    // Quiz State
    const [isStarted, setIsStarted] = useState(false)
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
    const [selections, setSelections] = useState({}) // { questionId: optionLabel }
    const [flagged, setFlagged] = useState({}) // { questionId: boolean }
    const [visited, setVisited] = useState({}) // { questionId: boolean }
    const [timeLeft, setTimeLeft] = useState(null)
    const [isFinished, setIsFinished] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [submitResult, setSubmitResult] = useState(null)
    const [submitError, setSubmitError] = useState(null)
    const [timeTakenFrontend, setTimeTakenFrontend] = useState(0)

    // Result screen state
    const [resultView, setResultView] = useState('overview') // 'overview', 'leaderboard', 'review'
    const [leaderboard, setLeaderboard] = useState([])
    const [leaderboardLoading, setLeaderboardLoading] = useState(false)

    // Modal state
    const [showWarningModal, setShowWarningModal] = useState(false)
    const [showConfirmModal, setShowConfirmModal] = useState(false)

    // Fetch data if missing
    useEffect(() => {
        if (courseId) {
            if (!currentCourse || String(currentCourse._id) !== String(courseId)) {
                dispatch(fetchCourseDetail(courseId))
            }
        } else if (id && !currentCourse) {
            // If only lesson ID is provided, try to find the course it belongs to
            const foundCourse = allCourses?.find(c => 
                c.modules?.some(m => m.lessons?.some(l => (l._id || l.id) === id))
            )
            if (foundCourse) {
                dispatch(fetchCourseDetail(foundCourse._id))
            }
        }
    }, [courseId, id, dispatch, currentCourse, allCourses])

    // Find the quiz in the course data
    let quiz = null
    if (currentCourse) {
        for (const m of currentCourse.modules || []) {
            for (const l of m.lessons || []) {
                const lid = l._id || l.id
                if (String(lid) === String(id) && l.quiz) {
                    quiz = l.quiz
                    break
                }
            }
            if (quiz) break
        }
    }

    // Flatten questions for easier navigation
    const allQuestions = React.useMemo(() => {
        if (!quiz) return []
        const flat = []
        quiz.sections?.forEach((section, sIndex) => {
            section.questions?.forEach((q, qIndex) => {
                flat.push({
                    ...q,
                    sectionTitle: section.sectionTitle,
                    sectionIndex: sIndex,
                    originalIndex: qIndex,
                    id: `${sIndex}-${qIndex}` // Unique ID for state tracking
                })
            })
        })
        return flat
    }, [quiz])

    // Timer Logic
    useEffect(() => {
        if (isStarted && timeLeft > 0 && !isFinished) {
            const timer = setInterval(() => {
                setTimeLeft(prev => prev - 1)
            }, 1000)
            return () => clearInterval(timer)
        } else if (timeLeft === 0 && !isFinished) {
            handleAutoSubmit()
        }
    }, [isStarted, timeLeft, isFinished])

    const startQuiz = async () => {
        if (quiz?.timeLimit) {
            setTimeLeft(quiz.timeLimit * 60)
        }
        setIsStarted(true)
        setVisited({ '0-0': true })

        // Optional: tell backend to record start time
        try {
            await authorizedFetch(`/quiz/start`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ quizId: quiz._id, courseId: courseId })
            })
        } catch (e) {
            console.error("Failed to record start time", e)
        }
    }

    const formatTime = (seconds) => {
        const h = Math.floor(seconds / 3600)
        const m = Math.floor((seconds % 3600) / 60)
        const s = seconds % 60
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    }

    const handleOptionSelect = (qId, label) => {
        setSelections(prev => ({ ...prev, [qId]: label }))
    }

    const toggleFlag = (qId) => {
        setFlagged(prev => ({ ...prev, [qId]: !prev[qId] }))
    }

    const navigateQuestion = (index) => {
        if (index >= 0 && index < allQuestions.length) {
            setCurrentQuestionIndex(index)
            setVisited(prev => ({ ...prev, [allQuestions[index].id]: true }))
        }
    }

    const handleClearResponse = () => {
        const currentQ = allQuestions[currentQuestionIndex]
        if (!currentQ) return
        setSelections(prev => {
            const next = { ...prev }
            delete next[currentQ.id]
            return next
        })
    }

    const handleMarkForReviewAndNext = () => {
        const currentQ = allQuestions[currentQuestionIndex]
        if (!currentQ) return
        setFlagged(prev => ({ ...prev, [currentQ.id]: true }))
        if (currentQuestionIndex < allQuestions.length - 1) {
            navigateQuestion(currentQuestionIndex + 1)
        }
    }

    const handleSaveAndNext = () => {
        if (currentQuestionIndex < allQuestions.length - 1) {
            navigateQuestion(currentQuestionIndex + 1)
        }
    }

    const handlePreSubmit = () => {
        const totalQuestions = allQuestions.length
        const answeredCount = Object.keys(selections).filter(id => selections[id] !== null && selections[id] !== undefined && selections[id] !== '').length
        
        if (answeredCount < totalQuestions) {
            setShowWarningModal(true)
        } else {
            setShowConfirmModal(true)
        }
    }

    const handleWarningContinue = () => {
        setShowWarningModal(false)
        setShowConfirmModal(true)
    }

    const handleAutoSubmit = () => {
        handleSubmit()
    }

    const handleSubmit = async () => {
        if (!quiz) return
        
        const answers = allQuestions.map(q => ({
            question: q.question,
            selectedOption: selections[q.id] || null
        }))

        setSubmitting(true)
        setSubmitError(null)
        
        // Calculate frontend time taken
        let timeTaken = 0
        if (quiz?.timeLimit && timeLeft !== null) {
            timeTaken = (quiz.timeLimit * 60) - timeLeft
        }

        try {
            const res = await authorizedFetch(`/quiz/${quiz._id}/submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ answers, timeTaken })
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data?.message || 'Submission failed')
            setSubmitResult(data)
            setIsFinished(true)
        } catch (e) {
            setSubmitError(e.message || String(e))
        } finally {
            setSubmitting(false)
        }
    }

    const fetchLeaderboard = useCallback(async () => {
        if (!quiz || quiz.showLeaderboard === false) return
        setLeaderboardLoading(true)
        try {
            const res = await authorizedFetch(`/quiz/leaderboard/${courseId}/${quiz._id}`)
            const data = await res.json()
            if (res.ok && data.success) {
                setLeaderboard(data.data || [])
            }
        } catch (e) {
            console.error(e)
        } finally {
            setLeaderboardLoading(false)
        }
    }, [courseId, quiz])

    useEffect(() => {
        if (isFinished && resultView === 'leaderboard' && leaderboard.length === 0) {
            fetchLeaderboard()
        }
    }, [isFinished, resultView, leaderboard.length, fetchLeaderboard])

    const getInitials = (name) => {
        if (!name) return 'C'
        const parts = name.split(' ')
        if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
        return name.slice(0, 2).toUpperCase()
    }

    if (detailLoading) {
        return (
            <div className="min-h-screen bg-[#f4f6fe] flex flex-col items-center justify-center space-y-4">
                <div className="w-12 h-12 border-2 border-accent/20 border-t-accent rounded-full animate-spin" />
            </div>
        )
    }

    if (!quiz) {
        return (
            <div className="min-h-screen bg-[#f4f6fe] text-slate-800 flex items-center justify-center p-8">
                <div className="max-w-2xl text-center space-y-6 bg-white border border-slate-200 p-8 rounded-2xl shadow-sm">
                    <div className="w-20 h-20 bg-blue-50 border border-blue-100 rounded-full flex items-center justify-center mx-auto text-[#011753]">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>
                    </div>
                    <h2 className="font-inter text-4xl">Protocol Not Found</h2>
                    <p className="text-slate-500 font-mono uppercase tracking-widest text-[10px]">Security Clearance Failure or Invalid Mission ID</p>
                    <Link to="/dashboard/my-courses" className="inline-block px-12 py-4 bg-[#011753] hover:bg-[#011447] text-white font-bold uppercase tracking-wider text-xs rounded-xl shadow-md transition-all">Back to dashboard</Link>
                </div>
            </div>
        )
    }

    // --- RENDER: Results Screen ---
    if (isFinished) {
        return (
            <div className="min-h-screen bg-[#f4f6fe] text-slate-900 flex flex-col">
                <header className="bg-white border-b border-slate-200 h-16 px-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link
                            to={`/dashboard/course/${courseId}`}
                            className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 hover:text-slate-900 transition-colors"
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <line x1="19" y1="12" x2="5" y2="12" />
                                <polyline points="12 19 5 12 12 5" />
                            </svg>
                        </Link>
                        <img src="/data_knowlege/logo/logo.png" alt="Data Knowledge Logo" className="h-8 w-auto object-contain rounded" />
                        <div className="h-6 w-[1px] bg-slate-200" />
                        <span className="font-semibold text-slate-800 text-sm">
                            {sanitizeDisplay(quiz.quizTitle)} - Evaluation Results
                        </span>
                    </div>
                </header>
                <main className="flex-grow flex items-center justify-center p-6">
                    <div className="bg-white border border-slate-200 max-w-2xl w-full p-8 md:p-12 rounded-2xl shadow-sm text-center space-y-8">
                        <div className="space-y-3">
                            <p className="font-mono text-xs text-[#011753] uppercase tracking-[0.3em] font-black">Protocol Complete</p>
                            <h1 className="font-inter text-5xl md:text-6xl text-slate-900 font-extralight tracking-tight leading-none uppercase">Evaluation Success</h1>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                            <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                                <p className="font-mono text-[9px] text-slate-400 uppercase tracking-widest">Score Achieved</p>
                                <p className="font-inter text-4xl text-[#011753] font-bold">{submitResult?.data?.score || 0}%</p>
                            </div>
                            <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                                <p className="font-mono text-[9px] text-slate-400 uppercase tracking-widest">Status</p>
                                <p className={`font-inter text-4xl font-bold italic ${submitResult?.data?.score >= quiz.passMark ? 'text-green-600' : 'text-red-500'}`}>
                                    {submitResult?.data?.score >= quiz.passMark ? 'PASSED' : 'FAILED'}
                                </p>
                            </div>
                            <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                                <p className="font-mono text-[9px] text-slate-400 uppercase tracking-widest">Required Pass</p>
                                <p className="font-inter text-4xl text-slate-400 font-bold">{quiz.passMark}%</p>
                            </div>
                        </div>

                        <div className="pt-6 flex flex-wrap justify-center gap-4">
                            <button 
                                onClick={() => setResultView('overview')}
                                className={`px-6 py-3 font-bold uppercase tracking-wider text-xs rounded-xl shadow-sm transition-all ${resultView === 'overview' ? 'bg-[#011753] text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                            >
                                Overview
                            </button>
                            {quiz.showLeaderboard !== false && (
                                <button 
                                    onClick={() => setResultView('leaderboard')}
                                    className={`px-6 py-3 font-bold uppercase tracking-wider text-xs rounded-xl shadow-sm transition-all ${resultView === 'leaderboard' ? 'bg-[#011753] text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                                >
                                    Leaderboard
                                </button>
                            )}
                            <button 
                                onClick={() => setResultView('review')}
                                className={`px-6 py-3 font-bold uppercase tracking-wider text-xs rounded-xl shadow-sm transition-all ${resultView === 'review' ? 'bg-[#011753] text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                            >
                                Review Answers
                            </button>
                            <Link to={`/dashboard/course/${courseId}`} className="inline-block px-6 py-3 border-2 border-[#011753] text-[#011753] font-bold uppercase tracking-wider text-xs rounded-xl hover:bg-[#011753] hover:text-white transition-all">
                                Exit
                            </Link>
                        </div>

                        {/* Additional Result Views */}
                        <div className="text-left mt-8">
                            {resultView === 'leaderboard' && quiz.showLeaderboard !== false && (
                                <div className="space-y-4 animate-fade-in">
                                    <h3 className="text-xl font-bold text-slate-800 border-b pb-2">Course Leaderboard</h3>
                                    {leaderboardLoading ? (
                                        <p className="text-slate-500">Loading rankings...</p>
                                    ) : leaderboard.length === 0 ? (
                                        <p className="text-slate-500">No rankings available yet.</p>
                                    ) : (
                                        <div className="bg-white border rounded-xl overflow-hidden shadow-sm overflow-x-auto">
                                            <table className="w-full min-w-[320px] text-sm text-left">
                                                <thead className="bg-slate-50 text-slate-600 font-mono text-[10px] uppercase tracking-wider">
                                                    <tr>
                                                        <th className="px-4 py-3">Rank</th>
                                                        <th className="px-4 py-3">Student</th>
                                                        <th className="px-4 py-3 text-right">Score</th>
                                                        <th className="px-4 py-3 text-right">Time</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {leaderboard.map((entry, idx) => (
                                                        <tr key={idx} className={entry.userId === user?._id ? "bg-blue-50" : ""}>
                                                            <td className="px-4 py-3 font-bold">#{entry.rank}</td>
                                                            <td className="px-4 py-3 font-medium">
                                                                {entry.firstName} {entry.lastName}
                                                                {entry.userId === user?._id && <span className="ml-2 text-[10px] bg-blue-200 text-blue-800 px-2 py-0.5 rounded-full">You</span>}
                                                            </td>
                                                            <td className="px-4 py-3 text-right font-bold text-[#011753]">{entry.score} / {entry.totalMarks}</td>
                                                            <td className="px-4 py-3 text-right text-slate-500">{entry.timeTaken}s</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            )}

                            {resultView === 'review' && (
                                <div className="space-y-6 animate-fade-in text-left">
                                    <h3 className="text-xl font-bold text-slate-800 border-b pb-2">Answer Review</h3>
                                    {allQuestions.map((q, idx) => {
                                        const userAns = selections[q.id]
                                        const isCorrect = userAns === q.correctAnswer
                                        return (
                                            <div key={q.id} className="p-5 border rounded-xl space-y-3 bg-white shadow-sm">
                                                <div className="flex justify-between items-start">
                                                    <span className="font-bold text-slate-700">Q{idx + 1}. {sanitizeDisplay(q.question)}</span>
                                                    {userAns ? (
                                                        <span className={`px-2 py-1 text-xs font-bold rounded ${isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                            {isCorrect ? 'Correct' : 'Incorrect'}
                                                        </span>
                                                    ) : (
                                                        <span className="px-2 py-1 text-xs font-bold rounded bg-slate-100 text-slate-600">Unanswered</span>
                                                    )}
                                                </div>
                                                
                                                <div className="space-y-2 mt-3 text-sm">
                                                    {q.options.map((opt, oIdx) => {
                                                        const isUserSelection = userAns === opt.label
                                                        const isActualCorrect = q.correctAnswer === opt.label
                                                        
                                                        let optClass = "p-2 border rounded-lg text-slate-600"
                                                        if (isActualCorrect) optClass = "p-2 border-green-500 bg-green-50 text-green-800 font-medium"
                                                        else if (isUserSelection && !isCorrect) optClass = "p-2 border-red-500 bg-red-50 text-red-800"

                                                        return (
                                                            <div key={oIdx} className={optClass}>
                                                                {opt.label}. {sanitizeDisplay(opt.text)}
                                                                {isUserSelection && <span className="ml-2 opacity-75">(Your Answer)</span>}
                                                            </div>
                                                        )
                                                    })}
                                                </div>

                                                {q.explanation && (
                                                    <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-lg text-sm text-[#011753]">
                                                        <strong>Explanation:</strong> {sanitizeDisplay(q.explanation)}
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>
        )
    }

    // --- RENDER: Start / Intro Screen ---
    if (!isStarted) {
        return (
            <div className="min-h-screen bg-[#f4f6fe] text-slate-900 selection:bg-blue-50/60 flex flex-col">
                <DashboardHeader />
                <main className="flex-grow flex items-center justify-center p-6 pt-24">
                    <div className="bg-white border border-slate-200 max-w-4xl w-full p-8 md:p-12 rounded-2xl shadow-sm space-y-8">
                        {/* Header */}
                        <div className="space-y-4">
                            <Link to={`/dashboard/course/${courseId}`} className="font-mono text-[10px] text-[#011753] uppercase tracking-wider hover:underline flex items-center gap-1.5">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m15 18-6-6 6-6"/></svg>
                                Return to Session
                            </Link>
                            
                            <div className="space-y-3">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center text-[#011753]">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>
                                    </div>
                                    <h1 className="font-inter text-3xl md:text-5xl text-slate-900 font-extralight tracking-tight leading-[0.9] uppercase">{sanitizeDisplay(quiz.quizTitle)}</h1>
                                </div>
                                <p className="font-inter text-lg text-slate-600 leading-relaxed max-w-2xl">{sanitizeDisplay(quiz.quizDescription)}</p>
                            </div>
                        </div>

                        {/* Stats Cards */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[
                                { label: 'Questions', value: allQuestions.length, icon: 'target' },
                                { label: 'Time Limit (min)', value: quiz.timeLimit, icon: 'clock' },
                                { label: 'Total Marks', value: quiz.totalMarks, icon: 'award' },
                                { label: 'Pass Marks', value: quiz.passMark, icon: 'check-circle' }
                            ].map((stat, i) => (
                                <div key={i} className="bg-slate-50 border border-slate-200 p-6 rounded-xl space-y-3 text-center group hover:border-[#011753]/30 transition-all">
                                    <div className="flex justify-center text-[#011753]/50 group-hover:text-[#011753] transition-colors">
                                        {stat.icon === 'target' && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>}
                                        {stat.icon === 'clock' && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}
                                        {stat.icon === 'award' && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 15l-2 5L9 9l11 4-5 2zm0 0l2 5 3-11-11 4 5 2z"/><circle cx="12" cy="12" r="10"/></svg>}
                                        {stat.icon === 'check-circle' && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>}
                                    </div>
                                    <div className="space-y-1">
                                        <p className="font-inter text-3xl text-slate-800 font-extralight">{stat.value}</p>
                                        <p className="font-mono text-[9px] text-slate-400 uppercase tracking-widest">{stat.label}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Instructions */}
                        <div className="bg-slate-50 border border-slate-200 p-6 rounded-xl space-y-4">
                            <div className="flex items-center gap-3">
                                <svg className="text-[#011753]" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                                <h3 className="font-mono text-xs text-[#011753] uppercase tracking-wider font-bold">Tactical Instructions</h3>
                            </div>
                            <ul className="space-y-2.5 font-inter text-slate-700 list-disc pl-5 leading-relaxed text-sm">
                                <li>Read each question carefully before selecting your answer.</li>
                                <li>You can navigate between questions using the question palette.</li>
                                <li>Use the flag feature to mark questions for review.</li>
                                <li>Make sure to submit your quiz before the time runs out.</li>
                                <li>You have {quiz.timeLimit} minutes to complete this quiz.</li>
                                <li>Once submitted, you cannot change your answers.</li>
                            </ul>
                        </div>

                        {/* Quiz Sections List */}
                        <div className="space-y-4">
                            <h3 className="font-mono text-xs text-slate-400 uppercase tracking-wider font-bold">Quiz Sections</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {quiz.sections?.map((section, si) => (
                                    <div key={si} className="p-5 bg-slate-50 border border-slate-200 rounded-xl flex justify-between items-center group hover:bg-slate-100/50 transition-all">
                                        <div className="space-y-1">
                                            <h4 className="font-mono text-[10px] text-slate-800 uppercase tracking-wider font-bold">{sanitizeDisplay(section.sectionTitle)}</h4>
                                            <p className="font-inter text-xs text-slate-500 leading-snug">{sanitizeDisplay(section.sectionDescription)}</p>
                                        </div>
                                        <div className="text-right ml-4">
                                            <p className="font-inter text-2xl text-[#011753] font-bold">{section.questions?.length || 0}</p>
                                            <p className="font-mono text-[8px] text-slate-400 uppercase tracking-widest">Questions</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Footer Action */}
                        <div className="flex justify-center pt-4">
                            <button 
                                onClick={startQuiz}
                                className="px-16 py-4 bg-[#011753] hover:bg-[#011447] text-white font-bold uppercase tracking-wider text-xs rounded-xl shadow-md hover:scale-105 active:scale-95 transition-all"
                            >
                                Start Quiz
                            </button>
                        </div>
                    </div>
                </main>
            </div>
        )
    }

    // --- RENDER: Active Quiz Screen ---
    const currentQ = allQuestions[currentQuestionIndex]

    return (
        <div className="min-h-screen bg-[#f4f6fe] text-slate-850 selection:bg-blue-50/60 flex flex-col">
            {/* Custom distraction-free header */}
            <header className="bg-white border-b border-slate-200 h-16 px-6 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                    {/* Back Arrow */}
                    <Link
                        to={`/dashboard/course/${courseId}`}
                        className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 hover:text-slate-900 transition-colors"
                        aria-label="Back to Course player"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <line x1="19" y1="12" x2="5" y2="12" />
                            <polyline points="12 19 5 12 12 5" />
                        </svg>
                    </Link>
                    
                    {/* Logo */}
                    <img src="/data_knowlege/logo/logo.png" alt="Data Knowledge Logo" className="h-8 w-auto object-contain rounded" />

                    {/* Vertical divider */}
                    <div className="h-6 w-[1px] bg-slate-200" />

                    {/* Quiz Title */}
                    <span className="font-semibold text-slate-800 text-sm hidden md:inline-block">
                        {sanitizeDisplay(quiz.quizTitle)}
                    </span>
                </div>

                {/* Section Tabs */}
                <div className="flex items-center gap-2 overflow-x-auto max-w-[50%] no-scrollbar py-1">
                    {quiz.sections?.map((section, si) => {
                        const isCurrentSection = currentQ?.sectionIndex === si
                        return (
                            <button
                                key={si}
                                onClick={() => {
                                    const targetIndex = allQuestions.findIndex(q => q.sectionIndex === si)
                                    if (targetIndex !== -1) {
                                        navigateQuestion(targetIndex)
                                    }
                                }}
                                className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all truncate border ${
                                    isCurrentSection
                                        ? 'bg-[#011753] border-[#011753] text-white shadow-sm'
                                        : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                                }`}
                            >
                                {section.sectionTitle}
                            </button>
                        )
                    })}
                </div>

                {/* Countdown Timer */}
                <div className="flex items-center gap-2 text-slate-700 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-500">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                    </svg>
                    <span className="font-mono text-xs font-bold whitespace-nowrap">
                        Time Left: {formatTime(timeLeft)}
                    </span>
                </div>
            </header>
            
            <div className="flex flex-1 overflow-hidden">
                {/* Left Panel: Active Question Area */}
                <main className="flex-1 overflow-y-auto bg-slate-50 flex flex-col">
                    {/* Question Header Status */}
                    <div className="flex justify-between items-center bg-white border-b border-slate-200 px-6 py-4 shrink-0">
                        <div className="flex items-center gap-3">
                            <span className="font-bold text-slate-800 text-sm">
                                Question No. {currentQ ? currentQ.originalIndex + 1 : 1}
                            </span>
                            <span className="px-3 py-1 bg-green-50 text-green-700 border border-green-200 rounded-full text-[10px] font-bold">
                                Marks: +1
                            </span>
                            <span className="px-3 py-1 bg-red-50 text-red-700 border border-red-200 rounded-full text-[10px] font-bold">
                                Negative: -0.25
                            </span>
                        </div>
                        {currentQ && (
                            <button
                                onClick={() => toggleFlag(currentQ.id)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-xs font-semibold transition-all ${
                                    flagged[currentQ.id]
                                        ? 'bg-purple-600 border-purple-600 text-white'
                                        : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                                    <line x1="4" y1="22" x2="4" y2="15" />
                                </svg>
                                {flagged[currentQ.id] ? 'Marked' : 'Mark for Review'}
                            </button>
                        )}
                    </div>

                    {/* Question Text & Options selection */}
                    <div className="flex-grow overflow-y-auto px-8 py-6 space-y-6">
                        {currentQ && (
                            <div className="space-y-6">
                                {/* Section Description/Directions if present */}
                                {currentQ.directions && (
                                    <div className="bg-white border border-slate-200 p-4 rounded-xl text-slate-700 text-sm shadow-sm leading-relaxed">
                                        {sanitizeDisplay(currentQ.directions)}
                                    </div>
                                )}
                                
                                {/* Question Instruction if present */}
                                {currentQ.instruction && (
                                    <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-amber-900 text-sm shadow-sm leading-relaxed">
                                        <strong className="block mb-1 text-amber-800">Instruction:</strong>
                                        {sanitizeDisplay(currentQ.instruction)}
                                    </div>
                                )}

                                <div className="space-y-6">
                                    <h3 className="text-slate-800 font-medium text-base md:text-lg leading-relaxed bg-white border border-slate-200 p-5 rounded-xl shadow-sm">
                                        {sanitizeDisplay(currentQ.question)}
                                    </h3>

                                    <div className="flex flex-col gap-3 max-w-3xl">
                                        {currentQ.options?.map((opt, i) => {
                                            const isSelected = selections[currentQ.id] === opt.label
                                            return (
                                                <button
                                                    key={i}
                                                    onClick={() => handleOptionSelect(currentQ.id, opt.label)}
                                                    className={`flex items-center gap-4 p-4 rounded-xl border text-left transition-all ${
                                                        isSelected
                                                            ? 'bg-blue-50/50 border-[#011753] text-[#011753] shadow-sm font-semibold'
                                                            : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                                                    }`}
                                                >
                                                    <div
                                                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                                                            isSelected ? 'border-[#011753] bg-white' : 'border-slate-300'
                                                        }`}
                                                    >
                                                        {isSelected && <div className="w-2.5 h-2.5 bg-[#011753] rounded-full" />}
                                                    </div>
                                                    <span className="text-sm font-medium">
                                                        <span className="opacity-50 mr-1.5">{opt.label}.</span> {sanitizeDisplay(opt.text)}
                                                    </span>
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Left Panel Action Footer */}
                    <div className="bg-white border-t border-slate-200 px-6 py-4 flex justify-between items-center shrink-0">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleMarkForReviewAndNext}
                                className="px-5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-750 font-semibold text-xs rounded-lg transition-all"
                            >
                                Mark for Review & Next
                            </button>
                            <button
                                onClick={handleClearResponse}
                                className="px-5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-750 font-semibold text-xs rounded-lg transition-all"
                            >
                                Clear Response
                            </button>
                        </div>
                        <button
                            onClick={handleSaveAndNext}
                            className="px-6 py-2.5 bg-[#011753] hover:bg-[#011447] text-white font-bold text-xs rounded-lg shadow-sm transition-all"
                        >
                            Save & Next
                        </button>
                    </div>
                </main>

                {/* Right Sidebar: Candidate details, status legend & questions grid */}
                <aside className="w-80 border-l border-slate-200 bg-white flex flex-col p-6 space-y-6 overflow-y-auto hidden lg:flex shrink-0">
                    {/* User profile details */}
                    <div className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                        <div className="w-10 h-10 rounded-full bg-[#011753] text-white flex items-center justify-center font-bold text-sm">
                            {getInitials(user?.fullName || user?.name)}
                        </div>
                        <div className="flex flex-col">
                            <span className="font-semibold text-slate-800 text-xs truncate max-w-[160px]">
                                {user?.fullName || user?.name || 'Protocol User'}
                            </span>
                            <span className="text-[9px] text-slate-400 uppercase tracking-widest">Candidate</span>
                        </div>
                    </div>

                    {/* Status legend */}
                    <div className="space-y-2 border-t border-slate-100 pt-4">
                        <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Status Legend</h4>
                        <div className="grid grid-cols-2 gap-2.5">
                            {[
                                { label: 'Answered', color: 'bg-green-600 text-white border-green-600' },
                                { label: 'Not Answered', color: 'bg-red-500 text-white border-red-500' },
                                { label: 'Marked', color: 'bg-purple-600 text-white border-purple-600' },
                                { label: 'Not Visited', color: 'bg-slate-100 border-slate-200 text-slate-400' }
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <div className={`w-5 h-5 rounded border flex items-center justify-center text-[9px] font-bold ${item.color}`}>1</div>
                                    <span className="text-[9px] text-slate-600 font-medium">{item.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Active Section Question Palette Grid */}
                    {currentQ && (
                        <div className="flex-1 space-y-3 border-t border-slate-100 pt-4">
                            <div className="flex flex-col">
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Section Palette</span>
                                <span className="font-bold text-slate-800 text-xs truncate uppercase tracking-wide bg-slate-50 border border-slate-200 p-2 rounded-lg text-center">
                                    {currentQ.sectionTitle}
                                </span>
                            </div>

                            <div className="grid grid-cols-5 gap-1.5 max-h-[220px] overflow-y-auto pr-1">
                                {allQuestions.filter(q => q.sectionIndex === currentQ.sectionIndex).map((q) => {
                                    const idx = allQuestions.findIndex(fq => fq.id === q.id)
                                    const isCurrent = idx === currentQuestionIndex
                                    const isAnswered = selections[q.id]
                                    const isFlagged = flagged[q.id]
                                    const isVisited = visited[q.id]

                                    let statusClass = "bg-slate-100 border-slate-200 text-slate-400 hover:bg-slate-200 hover:text-slate-600" // Not Visited
                                    if (isVisited) statusClass = "bg-red-500 border-red-500 text-white hover:bg-red-600" // Visited but not answered (Red)
                                    if (isAnswered) statusClass = "bg-green-600 border-green-600 text-white hover:bg-green-700" // Answered (Green)
                                    if (isFlagged) statusClass = "bg-purple-600 border-purple-600 text-white hover:bg-purple-700" // Flagged (Purple)
                                    if (isCurrent) statusClass += " ring-2 ring-[#011753] ring-offset-1 scale-105 z-10" // Current Selection Indicator

                                    return (
                                        <button
                                            key={q.id}
                                            onClick={() => navigateQuestion(idx)}
                                            className={`w-10 h-10 flex items-center justify-center font-bold text-xs rounded-lg border transition-all ${statusClass}`}
                                        >
                                            {q.originalIndex + 1}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {/* Finalize Submit Test Button */}
                    <div className="border-t border-slate-100 pt-4">
                        <button
                            onClick={handlePreSubmit}
                            disabled={submitting}
                            className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-md transition-all text-center uppercase tracking-wider"
                        >
                            {submitting ? 'Transmitting...' : 'Submit Test'}
                        </button>
                    </div>
                </aside>
            </div>

            {/* Warning Modal (Unattempted Questions Alert) */}
            {showWarningModal && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4">
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 max-w-md w-full shadow-xl space-y-6">
                        <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                                <line x1="12" y1="9" x2="12" y2="13" />
                                <line x1="12" y1="17" x2="12.01" y2="17" />
                            </svg>
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-lg font-bold text-slate-900">Unattempted Questions</h3>
                            <p className="text-sm text-slate-600 leading-relaxed">
                                Hey, you left some questions. Would you like to attempt them or would you like to continue to submit?
                            </p>
                        </div>
                        <div className="flex gap-3 justify-end pt-2">
                            <button
                                onClick={() => setShowWarningModal(false)}
                                className="px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl transition-all"
                            >
                                Go Back and Attempt
                            </button>
                            <button
                                onClick={handleWarningContinue}
                                className="px-4 py-2.5 bg-[#011753] hover:bg-[#011447] text-white font-bold text-xs rounded-xl transition-all"
                            >
                                Continue to Submit
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirmation Modal */}
            {showConfirmModal && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4">
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 max-w-md w-full shadow-xl space-y-6">
                        <div className="w-12 h-12 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                                <line x1="12" y1="17" x2="12.01" y2="17" />
                            </svg>
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-lg font-bold text-slate-900">Confirm Submission</h3>
                            <p className="text-sm text-slate-600 leading-relaxed">
                                Are you sure you want to submit your response?
                            </p>
                        </div>
                        <div className="flex gap-3 justify-end pt-2">
                            <button
                                onClick={() => setShowConfirmModal(false)}
                                className="px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    setShowConfirmModal(false)
                                    handleSubmit()
                                }}
                                className="px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold text-xs rounded-xl transition-all"
                            >
                                Yes, Submit
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default DashboardQuiz
