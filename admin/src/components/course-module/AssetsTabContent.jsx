import React, { useEffect, useState } from "react";
import {
  FileText,
  Video,
  Download,
  CheckSquare,
  Search,
  BookOpen,
  Clock,
  CalendarDays,
  XCircle,
  Eye,
  Play,
} from "lucide-react";
import axiosInstance from "../../services/axiosConfig";
import Quiz from "../../pages/courses/components/Quiz";
import Assignment from "../../pages/courses/components/Assignment";
import Files from "../../pages/courses/components/Files";
import TextLesson from "../../pages/courses/components/TextLesson";
import VedioLesson from "../../pages/courses/components/VideoLesson";

const AssetsTabContent = ({ courseID }) => {
  const [activeFilter, setActiveFilter] = useState("quizzes");
  const [searchTerm, setSearchTerm] = useState("");
  const [data, setData] = useState({});
  const [openQuiz, setOpenQuiz] = useState(null);
  const [openAssignment, setOpenAssignment] = useState(null);
  const [openFile, setOpenFile] = useState(null);
  const [openVideoLesson, setOpenVideoLesson] = useState(null);
  const [openTextLesson, setOpenTextLesson] = useState(null);

  const getData = async () => {
    try {
      const response = await axiosInstance.get(
        `courses/${courseID}/all-attachments`
      );
      setData(response.data.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    getData();
  }, [courseID]);

  const filterOptions = [
    {
      id: "quizzes",
      label: "Quizzes",
      icon: CheckSquare,
      count: data?.quizzes?.length || 0,
    },
    {
      id: "files",
      label: "Files",
      icon: Download,
      count: data?.files?.length || 0,
    },
    {
      id: "assignments",
      label: "Assignments",
      icon: FileText,
      count: data?.assignments?.length || 0,
    },
    {
      id: "videos",
      label: "Video Lessons",
      icon: Video,
      count: data?.videos?.length || 0,
    },
    {
      id: "texts",
      label: "Text Lessons",
      icon: BookOpen,
      count: data?.texts?.length || 0,
    },
  ];

  const filteredData =
    data[activeFilter]?.filter((item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

  const getAssetTypeStyles = (type) => {
    const styles = {
      quizzes: {
        iconBg: "bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400",
        badge: "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
      },
      files: {
        iconBg: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400",
        badge: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
      },
      assignments: {
        iconBg: "bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400",
        badge: "bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800",
      },
      videos: {
        iconBg: "bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400",
        badge: "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
      },
      texts: {
        iconBg: "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400",
        badge: "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800",
      },
    };
    return styles[type] || styles.texts;
  };

  const getAssetTypeColor = (type) => {
    const colors = {
      quizzes: "bg-blue-100 text-blue-800 border-blue-200",
      files: "bg-green-100 text-green-800 border-green-200",
      assignments: "bg-purple-100 text-purple-800 border-purple-200",
      videos: "bg-orange-100 text-orange-800 border-orange-200",
      texts: "bg-gray-100 text-gray-800 border-gray-200",
    };
    return colors[type] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const getAssetIcon = (type) => {
    const icons = {
      quizzes: CheckSquare,
      files: Download,
      assignments: FileText,
      videos: Video,
      texts: BookOpen,
    };
    const IconComponent = icons[type] || FileText;
    return <IconComponent className="w-5 h-5" />;
  };

  const getActionButton = (type) => {
    const actions = {
      quizzes: {
        text: "View Quiz",
        color: "bg-blue-600 hover:bg-blue-700",
        icon: Eye,
      },
      files: {
        text: "View File",
        color: "bg-emerald-600 hover:bg-emerald-700",
        icon: Download,
      },
      assignments: {
        text: "View Assignment",
        color: "bg-[#1b6294] hover:bg-[#16517a]",
        icon: FileText,
      },
      videos: {
        text: "View Video Lesson",
        color: "bg-amber-600 hover:bg-amber-700",
        icon: Play,
      },
      texts: {
        text: "View Text Lesson",
        color: "bg-indigo-600 hover:bg-indigo-700",
        icon: BookOpen,
      },
    };
    return (
      actions[type] || {
        text: "Access Asset",
        color: "bg-indigo-600 hover:bg-indigo-700",
        icon: Eye,
      }
    );
  };

  return (
    <>
      {/* Modals */}
      {openQuiz && (
        <div className="fixed inset-0 bg-black/40  backdrop-blur-sm z-[99999] flex items-center justify-center p-4">
          <div className="relative  bg-white dark:bg-white/[0.03] rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-95 animate-fade-in-up">
            <button
              onClick={() => setOpenQuiz(null)}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 transition-colors"
              aria-label="Close Quiz"
            >
              <XCircle className="w-7 h-7" />
            </button>
            <Quiz
              sectionId={courseID}
              lesson={openQuiz?.lessonId}
              onChange={() => {}}
              courseId={openQuiz?.courseID}
              lessonId={openQuiz?.lessonId}
              moduleId={openQuiz?.moduleId}
              contentId={openQuiz?.contentId}
              isEdit={true}
              quizId={openQuiz?.id}
              quizData={openQuiz}
              onClose={() => setOpenQuiz(null)}
            />
          </div>
        </div>
      )}
      {openAssignment && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[99999] flex items-center justify-center p-4">
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-95 animate-fade-in-up">
            <button
              onClick={() => setOpenAssignment(null)}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 transition-colors"
              aria-label="Close Assignment"
            >
              <XCircle className="w-7 h-7" />
            </button>
            <Assignment
              sectionId={courseID}
              lesson={openAssignment?.lessonId}
              onChange={() => {}}
              courseId={courseID}
              lessonId={openAssignment?.lessonId}
              moduleId={openAssignment?.moduleId}
              contentId={openAssignment?.contentId}
              isEdit={true}
              assignmentId={openAssignment?.id}
              assignmentData={openAssignment}
              onClose={() => setOpenAssignment(null)}
            />
          </div>
        </div>
      )}
      {openFile && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[99999] flex items-center justify-center p-4">
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-95 animate-fade-in-up">
            <button
              onClick={() => setOpenFile(null)}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 transition-colors"
              aria-label="Close File"
            >
              <XCircle className="w-7 h-7" />
            </button>
            <Files
              courseId={courseID}
              lessonId={openFile?.lessonId}
              fileId={openFile?.id}
              videoData={openFile}
              onClose={() => setOpenFile(null)}
            />
          </div>
        </div>
      )}
      {openTextLesson && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[99999] flex items-center justify-center p-4">
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-95 animate-fade-in-up">
            <button
              onClick={() => setOpenTextLesson(null)}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 transition-colors"
              aria-label="Close Text Lesson"
            >
              <XCircle className="w-7 h-7" />
            </button>
            <TextLesson
              courseId={courseID}
              lessonId={openTextLesson?.lessonId}
              textLessonId={openTextLesson?.id}
              onClose={() => setOpenTextLesson(null)}
            />
          </div>
        </div>
      )}
      {openVideoLesson && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99999] flex items-center justify-center p-4 overflow-y-auto">
          <VedioLesson
            lessonId={openVideoLesson?.lessonId}
            videoId={openVideoLesson?.id}
            fileId={openVideoLesson?.id}
            videoData={openVideoLesson}
            onClose={() => {
              setOpenVideoLesson(null);
              getData();
            }}
          />
        </div>
      )}

      <div className="w-full">
        {/* Header */}
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white/90 mb-2 leading-tight">
            Explore Course Assets
          </h2>
          <p className="text-sm sm:text-base text-gray-600 dark:text-white/70 max-w-2xl mx-auto">
            Dive into all your course materials, neatly organized for seamless learning.
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-6 flex justify-center">
          <div className="relative w-full max-w-lg">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search quizzes, files, videos, and more..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white dark:bg-white/[0.04] text-gray-900 dark:text-white pl-11 pr-5 py-2.5 border border-gray-300 dark:border-white/10 rounded-full focus:outline-none focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/40 focus:border-blue-500 transition-all duration-300 shadow-sm text-sm"
            />
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="mb-8 flex justify-center">
          <div className="flex flex-wrap justify-center gap-2 bg-white dark:bg-white/[0.04] p-1.5 rounded-2xl shadow-sm border border-gray-200 dark:border-white/10">
            {filterOptions.map((option) => {
              const IconComponent = option.icon;
              const isActive = activeFilter === option.id;
              return (
                <button
                  type="button"
                  key={option.id}
                  onClick={() => setActiveFilter(option.id)}
                  className={`
                    flex items-center gap-2 px-3.5 py-2 rounded-xl font-medium text-sm transition-all duration-200 ease-in-out whitespace-nowrap
                    ${
                      isActive
                        ? "bg-blue-600 text-white shadow-sm"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/[0.08]"
                    }
                  `}
                >
                  <IconComponent className="w-4 h-4" />
                  <span>{option.label}</span>
                  <span
                    className={`
                      px-2 py-0.5 rounded-full text-xs font-semibold
                      ${
                        isActive
                          ? "bg-blue-500 text-white"
                          : "bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400"
                      }
                    `}
                  >
                    {option.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Grid of Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredData.map((item, index) => {
            const styles = getAssetTypeStyles(activeFilter);
            const actionBtn = getActionButton(activeFilter);
            const ActionIcon = actionBtn.icon;

            return (
              <div
                key={item?.id || index}
                className="bg-white dark:bg-gray-800/90 border border-gray-200 dark:border-gray-700/60 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between"
                style={{
                  animationDelay: `${index * 60}ms`,
                  animation: "fadeInUp 0.5s ease-out forwards",
                  opacity: 0,
                }}
              >
                <div>
                  <div className="flex items-center justify-between gap-3 mb-3.5">
                    <div className={`p-2.5 rounded-xl ${styles.iconBg} flex-shrink-0`}>
                      {getAssetIcon(activeFilter)}
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold border whitespace-nowrap flex-shrink-0 ${styles.badge}`}
                    >
                      {activeFilter === "quizzes" && "Quiz"}
                      {activeFilter === "files" && "File"}
                      {activeFilter === "assignments" && "Assignment"}
                      {activeFilter === "videos" && "Video Lesson"}
                      {activeFilter === "texts" && "Text Lesson"}
                    </span>
                  </div>

                  <h3 className="font-bold text-base sm:text-lg text-gray-900 dark:text-white mb-2 leading-snug line-clamp-2">
                    {item?.name}
                  </h3>

                  <div className="text-xs text-gray-600 dark:text-gray-300 space-y-1.5 mb-4">
                    <span className="flex items-center gap-2">
                      <CalendarDays className="w-3.5 h-3.5 text-gray-400" />
                      <span className="font-medium">
                        Date: {new Date(item?.date).toLocaleDateString()}
                      </span>
                    </span>

                    {item?.duration && (
                      <span className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        <span className="font-medium">
                          Duration: {item?.duration}
                        </span>
                      </span>
                    )}
                    {item?.qsize && (
                      <span className="flex items-center gap-2">
                        <span className="font-medium">
                          Questions: {item?.qsize}
                        </span>
                      </span>
                    )}
                    {item?.totalMarks && (
                      <span className="flex items-center gap-2">
                        <span className="font-medium">
                          Total Marks: {item?.totalMarks}
                        </span>
                      </span>
                    )}
                    {item?.passMark && (
                      <span className="flex items-center gap-2">
                        <span className="font-medium">
                          Pass Mark: {item?.passMark}
                        </span>
                      </span>
                    )}

                    {item?.readTime && (
                      <span className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        <span className="font-medium">
                          Read Time: {item?.readTime}
                        </span>
                      </span>
                    )}
                    {item?.difficulty && (
                      <div>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            item?.difficulty === "Easy"
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                              : item?.difficulty === "Medium"
                              ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300"
                              : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                          }`}
                        >
                          Difficulty: {item?.difficulty}
                        </span>
                      </div>
                    )}
                    {item?.fileType && (
                      <span className="font-medium block truncate">
                        File Type: {item?.fileType}
                      </span>
                    )}
                    {item?.quality && (
                      <span className="font-medium block">
                        Quality: {item?.quality}
                      </span>
                    )}
                    {item?.language && (
                      <span className="font-medium block">
                        Language: {item?.language}
                      </span>
                    )}
                    {item?.subject && (
                      <span className="font-medium block">
                        Subject: {item?.subject}
                      </span>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100 dark:border-gray-700/60 mt-auto">
                  <button
                    type="button"
                    onClick={() => {
                      if (activeFilter === "quizzes") {
                        setOpenQuiz(item);
                      } else if (activeFilter === "files") {
                        setOpenFile(item);
                      } else if (activeFilter === "assignments") {
                        setOpenAssignment(item);
                      } else if (activeFilter === "videos") {
                        setOpenVideoLesson(item);
                      } else if (activeFilter === "texts") {
                        setOpenTextLesson(item);
                      }
                    }}
                    className={`w-full text-white py-2.5 px-4 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all duration-200 shadow-sm hover:shadow active:scale-[0.99] whitespace-nowrap cursor-pointer ${actionBtn.color}`}
                  >
                    <ActionIcon className="w-4 h-4" />
                    <span>{actionBtn.text}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredData.length === 0 && (
          <div className="text-center py-16 bg-white dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm mt-6">
            <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-10 h-10 text-blue-500" />
            </div>
            <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              No Assets Found
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-6 max-w-md mx-auto leading-relaxed">
              We couldn't find any assets matching your current filter or search term. Please try adjusting your criteria.
            </p>
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-medium text-sm shadow-sm"
              >
                Clear Search
              </button>
            )}
          </div>
        )}
      </div>

      {/* Keyframe for fadeInUp animation */}
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
};

export default AssetsTabContent;
