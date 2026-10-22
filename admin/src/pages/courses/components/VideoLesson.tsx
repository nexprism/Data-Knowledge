import React, { useState, useEffect, ChangeEvent } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  UploadCloud,
  FileVideo,
  Loader2,
  CheckCircle2,
  X,
  Clock,
  AlertCircle,
  Play,
  Upload,
  Video,
  MonitorPlay,
  Sparkles,
  Check,
  XCircle,
  Info
} from "lucide-react";
import {
  uploadVideo,
  updateVideo,
} from "../../../store/slices/vedio";
import axiosInstance from "../../../services/axiosConfig";

// Fixed interface to match your store structure
interface RootState {
  vedio: {
    loading: boolean;
    error: string | null;
    data: any;
  };
}

// Fixed props interface to include fileId and videoData
type VideoLessonProps = {
  lessonId: string;
  videoId?: string;
  fileId?: string; // Added this missing prop
  videoData?: any;
  onClose: () => void;
  onSaveSuccess?: (data: any) => void;
};

const sourcePlatforms = [
  { value: "videocypher", label: "VdoCipher", icon: MonitorPlay },
  { value: "youtube", label: "YouTube", icon: Play },
];

// Enhanced popup component with better animations
const EnhancedPopup: React.FC<{
  isVisible: boolean;
  message: string;
  type: string;
  onClose: () => void;
  autoClose?: boolean;
}> = ({ isVisible, message, type, onClose, autoClose = true }) => {
  useEffect(() => {
    if (isVisible && autoClose && type === "success") {
      const timer = setTimeout(() => {
        onClose();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, autoClose, type, onClose]);

  if (!isVisible) return null;

  const getTypeStyles = () => {
    switch (type) {
      case "success":
        return "bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 text-green-800";
      case "error":
        return "bg-gradient-to-r from-red-50 to-rose-50 border-red-200 text-red-800";
      case "warning":
        return "bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200 text-amber-800";
      case "info":
        return "bg-gradient-to-r from-blue-50 to-sky-50 border-blue-200 text-blue-800";
      default:
        return "bg-gray-50 border-gray-200 text-gray-800";
    }
  };

  const getIcon = () => {
    switch (type) {
      case "success":
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case "error":
        return <XCircle className="w-5 h-5 text-red-600" />;
      case "warning":
        return <AlertCircle className="w-5 h-5 text-amber-600" />;
      case "info":
        return <Info className="w-5 h-5 text-blue-600" />;
      default:
        return <Info className="w-5 h-5 text-gray-600" />;
    }
  };

  return (
    <div className="fixed inset-0  bg-transparent backdrop-blur-xs transition-opacity flex items-center justify-center z-50 p-4">
      <div className={`max-w-md w-full rounded-xl border-2 p-6 max-h-[700px] overflow-scroll shadow-xl transform transition-all duration-300 scale-100 ${getTypeStyles()}`}>
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            {getIcon()}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium leading-relaxed">
              {message}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        {type === "success" && (
          <div className="mt-4 bg-white bg-opacity-60 rounded-lg p-3">
            <div className="flex items-center gap-2 text-xs text-green-700">
              <Clock className="w-4 h-4" />
              <span>Processing will continue in the background</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Upload progress component
const UploadProgress: React.FC<{
  isVisible: boolean;
  progress: number;
  fileName: string;
  stage: string;
}> = ({ isVisible, progress, fileName, stage }) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-transparent backdrop-blur-xs transition-opacity flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-8 max-w-md w-full shadow-2xl">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-6">
            <Upload className="w-8 h-8 text-white animate-pulse" />
          </div>
          
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Uploading to VdoCipher
          </h3>
          
          <p className="text-sm text-gray-600 mb-6">
            {fileName}
          </p>
          
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          
          <div className="flex justify-between text-sm text-gray-500 mb-4">
            <span>{stage}</span>
            <span>{progress}%</span>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center gap-2 text-sm text-blue-700">
              <Sparkles className="w-4 h-4" />
              <span>This may take a few minutes depending on file size</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const VideoLesson: React.FC<VideoLessonProps> = ({
  lessonId,
  videoId,
  fileId,
  videoData,
  onClose,
  onSaveSuccess,
}) => {
  const dispatch = useDispatch();

  const { data, loading, error } = useSelector(
    (state: RootState) => state.vedio
  );

  const [form, setForm] = useState({
    title: "",
    description: "",
    sourcePlatform: "",
    file: null as File | null,
    videoId: "",
    secureUrl: "",
    embedUrl: "",
    originalUrl: "",
    youtubeUrl: "",
    vdocipherVideoId: "", // Added for existing VdoCipher videos
    uploadMethod: "file", // Added to track upload method: "file" or "videoId"
    thumbnail: "",
    quality: "auto",
    status: "",
  });
  
  const [isEditMode, setIsEditMode] = useState(false);
  const [popup, setPopup] = useState({
    isVisible: false,
    message: "",
    type: "",
  });

  const getYouTubeVideoId = (url: string): string => {
    const match = url?.match(
      /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/
    );
    return match ? match[1] : "";
  };

  useEffect(() => {
    if (videoData) {
      setIsEditMode(true);
      const isYt =
        videoData.youtubeUrl ||
        videoData.url?.includes("youtube") ||
        videoData.url?.includes("youtu.be");
      setForm((prev) => ({
        ...prev,
        title: videoData.title || videoData.name || prev.title,
        description: videoData.description || prev.description,
        sourcePlatform:
          videoData.sourcePlatform || (isYt ? "youtube" : prev.sourcePlatform || "videocypher"),
        youtubeUrl:
          videoData.youtubeUrl || (isYt ? videoData.url : prev.youtubeUrl),
        secureUrl: videoData.secureUrl || videoData.url || prev.secureUrl,
        videoId: videoData.videoId || prev.videoId,
        vdocipherVideoId: videoData.videoId || prev.vdocipherVideoId,
        quality: videoData.quality || prev.quality,
      }));
    }
  }, [videoData]);

  const [uploadProgress, setUploadProgress] = useState({
    isVisible: false,
    progress: 0,
    fileName: "",
    stage: "Preparing upload...",
  });

  // Mock upload progress simulation
  const uploadInChunks = async (file: File) => {
    const CHUNK_SIZE = 100 * 1024 * 1024; // 100MB
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    const fileId = `${file.name}-${Date.now()}`;

    for (let i = 0; i < totalChunks; i++) {
      const start = i * CHUNK_SIZE;
      const end = Math.min(file.size, start + CHUNK_SIZE);
      const chunk = file.slice(start, end);

      const formData = new FormData();
      formData.append("chunk", chunk);

      await axiosInstance.post("/chunk/upload-chunk", formData, {
        headers: {
          "content-type": "multipart/form-data",
          "fileid": fileId,
          "chunkindex": i.toString(),
          "totalchunks": totalChunks.toString(),
        },
        onUploadProgress: (e) => {
          const progress = Math.round(((i + e.loaded / e.total!) / totalChunks) * 100);
          setUploadProgress({
            isVisible: true,
            progress,
            fileName: file.name,
            stage: `Uploading chunk ${i + 1}/${totalChunks} (est. ${Math.ceil((totalChunks - i) * 2)} min left)...`,
          });
        },
        timeout: 3600000, // Increased timeout to 60 seconds for large chunks
      });
    }

    // Merge chunks
    const { data } = await axiosInstance.post("/chunk/merge-chunks", {
      fileId,
      fileName: file.name,
      totalChunks,
    }, {
      timeout: 3600000, // 1 hour timeout for merging large files
    });

    setUploadProgress({
      isVisible: false,
      progress: 100,
      fileName: file.name,
      stage: "Done",
    });

    showSuccessMessage();
    console?.log("data", data)

    return data.filePath; // <--- Return merged file path
  };

  const showSuccessMessage = () => {
    setPopup({
      isVisible: true,
      message: "Video uploaded successfully! 🎉 Your video is now being processed by VdoCipher. You can check back in a few minutes to see the processed video with optimized streaming quality.",
      type: "success",
    });
  };

  // Enhanced getData function to handle VdoCipher data structure
  const getData = async () => {
    try {
      setIsEditMode(true);
      const response = await axiosInstance.get(`/video/${fileId}`);
      const fetchedData = response.data?.data || response.data?.video || response.data;
      
      if (fetchedData) {
        setForm({
          title: fetchedData.title || "",
          description: fetchedData.description || "",
          sourcePlatform:
            fetchedData.sourcePlatform ||
            (fetchedData.youtubeUrl ? "youtube" : "videocypher"),
          file: null,
          videoId: fetchedData.videoId || "", // VdoCipher video ID
          secureUrl: fetchedData.secureUrl || "",
          embedUrl: fetchedData.secureUrl || "", // Use secureUrl for embed
          originalUrl: fetchedData.secureUrl || "",
          youtubeUrl: fetchedData.youtubeUrl || "",
          vdocipherVideoId: fetchedData.videoId || "", // Set for existing video ID mode
          uploadMethod:
            fetchedData.uploadMethod === "existing_video_id" ||
            (!fetchedData.secureUrl && fetchedData.videoId)
              ? "videoId"
              : "file",
          thumbnail: fetchedData.thumbnail || "",
          quality: fetchedData.quality || "auto",
          status: fetchedData.status || "",
        });
      }
      
      console.log("Fetched VdoCipher video data:", fetchedData);
    } catch (error) {
      console.error("Error fetching video data:", error);
      if (!videoData) {
        setPopup({
          isVisible: true,
          message: "Failed to fetch video data",
          type: "error",
        });
      }
    }
  };

  useEffect(() => {
    if (fileId) {
      getData();
    }
  }, [fileId]);

  useEffect(() => {
    if (isEditMode && data && !loading && !error) {
      setForm({
        title: data.title || "",
        description: data.description || "",
        sourcePlatform: data.sourcePlatform || "",
        file: null,
        videoId: data.videoId || "",
        secureUrl: data.secureUrl || "",
        embedUrl: data.embedUrl || data.secureUrl || "",
        originalUrl: data.originalUrl || data.secureUrl || "",
        youtubeUrl: data.youtubeUrl || "",
        vdocipherVideoId: data.videoId || "",
        uploadMethod: data.uploadMethod === "existing_video_id" ? "videoId" : "file",
        thumbnail: data.thumbnail || "",
        quality: data.quality || "auto",
        status: data.status || "",
      });
    }
  }, [data, isEditMode, loading, error]);

  useEffect(() => {
    if (!loading && (data || error)) {
      if (data && !error) {
        if (onSaveSuccess) onSaveSuccess(data);
      } else if (error) {
        setPopup({
          isVisible: true,
          message: `Failed to ${isEditMode ? "update" : "upload"} video: ${error}`,
          type: "error",
        });
      }
    }
  }, [data, error, loading, isEditMode, onSaveSuccess]);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, files } = e.target as any;
    if (name === "file") {
      setForm((prev) => ({ ...prev, file: files?.[0] || null }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const isValidYouTubeUrl = (url: string): boolean => {
    const youtubeRegex =
      /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/)|youtu\.be\/)[\w-]+/;
    return youtubeRegex.test(url);
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      setPopup({
        isVisible: true,
        message: "Please enter a video title.",
        type: "error",
      });
      return;
    }
    
    if (!form.sourcePlatform) {
      setPopup({
        isVisible: true,
        message: "Please select a source platform.",
        type: "error",
      });
      return;
    }

    // Enhanced validation for VdoCipher and YouTube
    if (form.sourcePlatform === "youtube") {
      if (!form.youtubeUrl.trim()) {
        setPopup({
          isVisible: true,
          message: "Please enter a YouTube URL.",
          type: "error",
        });
        return;
      }
      if (!isValidYouTubeUrl(form.youtubeUrl)) {
        setPopup({
          isVisible: true,
          message: "Please enter a valid YouTube URL.",
          type: "error",
        });
        return;
      }
    } else if (form.sourcePlatform === "videocypher") {
      if (form.uploadMethod === "file") {
        // For new uploads, file is required
        if (!isEditMode && !form.file) {
          setPopup({
            isVisible: true,
            message: "Please select a video file to upload.",
            type: "error",
          });
          return;
        }
      } else if (form.uploadMethod === "videoId") {
        // For existing video ID, validate the ID
        if (!form.vdocipherVideoId.trim()) {
          setPopup({
            isVisible: true,
            message: "Please enter a VdoCipher Video ID.",
            type: "error",
          });
          return;
        }
        // Basic validation for video ID format (alphanumeric)
        const videoIdPattern = /^[a-zA-Z0-9]+$/;
        if (!videoIdPattern.test(form.vdocipherVideoId.trim())) {
          setPopup({
            isVisible: true,
            message: "Please enter a valid VdoCipher Video ID (alphanumeric characters only).",
            type: "error",
          });
          return;
        }
      }
    }

    try {
      let response;
      
      // Handle VdoCipher video ID linking (no file upload needed)
      if (form.sourcePlatform == "videocypher" && form.uploadMethod == "videoId") {
        const videoData = {
          lessonId,
          sourcePlatform: form.sourcePlatform,
          title: form.title,
          description: form.description,
          videoId: form.vdocipherVideoId.trim(),
          uploadMethod: "existing_video_id",
          quality: form.quality || "auto",
        };

        if (isEditMode && (fileId || videoId)) {
          response = await dispatch(
            updateVideo({
              videoId: (fileId || videoId)!,
              lessonId,
              sourcePlatform: form.sourcePlatform,
              title: form.title,
              description: form.description,
              uploadMethod: "existing_video_id",
              quality: form.quality || "auto",
              vdocipherVideoId: form.vdocipherVideoId.trim(),
              filePath: "", // No file path needed for video ID linking
              accessToken: "",
              refreshToken: "",
            }) as any
          );
        } else {
          response = await dispatch(
            uploadVideo({
              lessonId,
              sourcePlatform: form.sourcePlatform,
              title: form.title,
              description: form.description,
              uploadMethod: "existing_video_id",
              quality: form.quality || "auto",
              videoId: form.vdocipherVideoId.trim(),
              filePath: "", // No file path needed for video ID linking
              accessToken: "",
              refreshToken: "",
            }) as any
          );
        }

        if (response.payload?.success) {
          if (onSaveSuccess) onSaveSuccess(response.payload.data || response.payload);
          setPopup({
            isVisible: true,
            message: "VdoCipher video linked successfully! 🎬 Your existing video is now available for streaming.",
            type: "success",
          });
          setTimeout(() => {
            handleClose();
          }, 1500);
        } else {
          setPopup({
            isVisible: true,
            message: `Failed to link VdoCipher video: ${
              response.payload?.message || "Please verify the Video ID is correct and the video is in ready state."
            }`,
            type: "error",
          });
        }
        return;
      }
      
      if (isEditMode && (fileId || videoId)) {
        // For VdoCipher updates, we need to use the correct ID
        const updateId = fileId || videoId;
        
        // Show confirmation if replacing video file
        if (form.file && form.sourcePlatform === "videocypher") {
          const confirmReplace = window.confirm(
            `Are you sure you want to replace the current video with "${form.file.name}"? This action cannot be undone.`
          );
          if (!confirmReplace) {
            return;
          }
        }

        let finalPath = "";
        
        // Only upload chunks for VdoCipher file uploads in edit mode
        if (form.sourcePlatform === "videocypher" && form.uploadMethod === "file" && form.file) {
          console.log("Starting chunked upload for file:", form.file.name);
          finalPath = await uploadInChunks(form.file);
          console?.log("finalPath", finalPath);
        }

        response = await dispatch(
          updateVideo({
            videoId: updateId!, // Use fileId for VdoCipher updates
            ...(form.file && { file: form.file }),
            lessonId,
            sourcePlatform: form.sourcePlatform,
            title: form.title,
            description: form.description,
            uploadMethod: form.uploadMethod === "videoId" ? "existing_video_id" : "file",
            filePath: finalPath,
            youtubeUrl: form.sourcePlatform === "youtube" ? form.youtubeUrl : undefined,
            // Include VdoCipher specific fields if updating VdoCipher video
            ...(form.sourcePlatform === "videocypher" && {
              quality: form.quality,
              thumbnail: form.thumbnail,
              replaceVideo: !!form.file, // Flag to indicate video replacement
              ...(form.uploadMethod === "videoId" && {
                vdocipherVideoId: form.vdocipherVideoId.trim(),
              }),
            }),
            accessToken: "",
            refreshToken: "",
          }) as any
        );
      } else {
        let finalPath = "";
        
        // Only upload chunks for VdoCipher file uploads
        if (form.sourcePlatform === "videocypher" && form.uploadMethod === "file" && form.file) {
          finalPath = await uploadInChunks(form.file);
        }
        
        response = await dispatch(
          uploadVideo({
            ...(form.file && { file: form.file }),
            lessonId,
            sourcePlatform: form.sourcePlatform,
            title: form.title,
            description: form.description,
            filePath: finalPath,
            uploadMethod: form.uploadMethod === "videoId" ? "existing_video_id" : "file",
            youtubeUrl: form.sourcePlatform === "youtube" ? form.youtubeUrl : undefined,
            // Include VdoCipher specific fields if uploading to VdoCipher
            ...(form.sourcePlatform === "videocypher" && {
              quality: form.quality || "auto",
              ...(form.uploadMethod === "videoId" && {
                videoId: form.vdocipherVideoId.trim(),
              }),
            }),
            accessToken: "",
            refreshToken: "",
          }) as any
        );
      }
      
      console.log("Video operation response:", response);
      
      // For YouTube, show immediate success without progress
      if (form.sourcePlatform === "youtube") {
        if (response.payload?.success) {
          if (onSaveSuccess) onSaveSuccess(response.payload.data || response.payload);
          setPopup({
            isVisible: true,
            message: "YouTube video linked successfully! 🎬 Your video is now available for streaming.",
            type: "success",
          });
          // Close after a short delay to show success message
          setTimeout(() => {
            handleClose();
          }, 1500);
        } else {
          setPopup({
            isVisible: true,
            message: `Failed to ${isEditMode ? "update" : "link"} YouTube video: ${
              response.payload?.message || "Unknown error"
            }`,
            type: "error",
          });
        }
      } else {
        if (form.sourcePlatform === "videocypher") {
          if (response.payload?.success) {
            if (onSaveSuccess) onSaveSuccess(response.payload.data || response.payload);
            showSuccessMessage();
            setTimeout(() => {
              handleClose();
            }, 1500);
          } else {
            setUploadProgress(prev => ({ ...prev, isVisible: false }));
            setPopup({
              isVisible: true,
              message: `Failed to ${isEditMode ? "update" : "upload"} video: ${
                response.payload?.error || response.payload?.message || "Unknown error"
              }`,
              type: "error",
            });
          }
        } else {
          if (response.payload?.success) {
            if (onSaveSuccess) onSaveSuccess(response.payload.data || response.payload);
            setPopup({
              isVisible: true,
              message: "Video saved successfully!",
              type: "success",
            });
            setTimeout(() => {
              handleClose();
            }, 1500);
          } else {
            setUploadProgress(prev => ({ ...prev, isVisible: false }));
            setPopup({
              isVisible: true,
              message: `Failed to ${isEditMode ? "update" : "upload"} video: ${
                response.payload?.error || response.payload?.message || "Unknown error"
              }`,
              type: "error",
            });
          }
        }
      }
    } catch (error: unknown) {
      console.error("Error saving video:", error);
      setUploadProgress(prev => ({ ...prev, isVisible: false }));
      setPopup({
        isVisible: true,
        message: `Failed to ${isEditMode ? "update" : "upload"} video: ${
          error instanceof Error ? error.message : "Network error"
        }`,
        type: "error",
      });
    }
  };

  const handleClose = () => {
    setPopup({ isVisible: false, message: "", type: "" });
    onClose();
  };

  // Enhanced render function to show VdoCipher status
  const renderVdoCipherInfo = () => {
    if (form.sourcePlatform === "videocypher" && isEditMode) {
      return (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 p-5 rounded-xl">
          <div className="flex items-center gap-2 mb-3">
            <MonitorPlay className="w-5 h-5 text-blue-600" />
            <h4 className="font-semibold text-blue-900">VdoCipher Video Details</h4>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Video ID</p>
              <p className="font-mono text-blue-800">{form.videoId || "N/A"}</p>
            </div>
            <div>
              <p className="text-gray-600">Status</p>
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                form.status === 'ready' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {form.status === 'ready' ? (
                  <>
                    <Check className="w-3 h-3 mr-1" />
                    Ready
                  </>
                ) : (
                  <>
                    <Clock className="w-3 h-3 mr-1" />
                    Processing
                  </>
                )}
              </span>
            </div>
            <div>
              <p className="text-gray-600">Quality</p>
              <p className="text-blue-800 capitalize">{form.quality}</p>
            </div>
            <div>
              <p className="text-gray-600">Secure Streaming</p>
              <p className="text-green-600 font-medium">
                {form.secureUrl ? "✓ Enabled" : "Setting up..."}
              </p>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const renderSourceInput = () => {
    if (form.sourcePlatform === "youtube") {
      return (
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-gray-700">
            YouTube URL *
          </label>
          <div className="relative">
            <input
              type="url"
              name="youtubeUrl"
              value={form.youtubeUrl}
              onChange={handleChange}
              className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200"
              placeholder="https://www.youtube.com/watch?v=..."
              required
            />
            <Play className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-red-500" />
          </div>
          {form.youtubeUrl && !isValidYouTubeUrl(form.youtubeUrl) && (
            <div className="flex items-center gap-2 text-red-600 text-sm">
              <AlertCircle className="w-4 h-4" />
              Please enter a valid YouTube URL
            </div>
          )}
          {form.youtubeUrl && isValidYouTubeUrl(form.youtubeUrl) && (
            <>
              <div className="flex items-center gap-2 text-green-600 text-sm">
                <CheckCircle2 className="w-4 h-4" />
                Valid YouTube URL detected
              </div>
              <div className="mt-3 rounded-xl overflow-hidden border border-gray-200 shadow-sm aspect-video bg-black">
                <iframe
                  src={`https://www.youtube.com/embed/${getYouTubeVideoId(form.youtubeUrl)}`}
                  title={form.title || "YouTube Preview"}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </>
          )}
        </div>
      );
    } else if (form.sourcePlatform === "videocypher") {
      return (
        <div className="space-y-4">
          {/* Upload Method Tabs */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-gray-700">
              Upload Method *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div
                className={`relative border-2 rounded-xl p-3 cursor-pointer transition-all ${
                  form.uploadMethod === "file"
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
                onClick={() => setForm(prev => ({ ...prev, uploadMethod: "file", vdocipherVideoId: "" }))}
              >
                <div className="flex items-center gap-2">
                  <Upload className={`w-5 h-5 ${
                    form.uploadMethod === "file" ? "text-blue-600" : "text-gray-400"
                  }`} />
                  <span className={`font-medium text-sm ${
                    form.uploadMethod === "file" ? "text-blue-900" : "text-gray-700"
                  }`}>
                    Upload New File
                  </span>
                </div>
                {form.uploadMethod === "file" && (
                  <div className="absolute top-2 right-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  </div>
                )}
              </div>
              
              <div
                className={`relative border-2 rounded-xl p-3 cursor-pointer transition-all ${
                  form.uploadMethod === "videoId"
                    ? "border-green-500 bg-green-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
                onClick={() => setForm(prev => ({ ...prev, uploadMethod: "videoId", file: null }))}
              >
                <div className="flex items-center gap-2">
                  <MonitorPlay className={`w-5 h-5 ${
                    form.uploadMethod === "videoId" ? "text-green-600" : "text-gray-400"
                  }`} />
                  <span className={`font-medium text-sm ${
                    form.uploadMethod === "videoId" ? "text-green-900" : "text-gray-700"
                  }`}>
                    Use Existing Video
                  </span>
                </div>
                {form.uploadMethod === "videoId" && (
                  <div className="absolute top-2 right-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* File Upload Section */}
          {form.uploadMethod === "file" && (
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-700">
                Video File {!isEditMode ? '*' : ''}
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-blue-400 transition-colors">
                <input
                  type="file"
                  name="file"
                  accept="video/*"
                  onChange={handleChange}
                  className="hidden"
                  id="video-file"
                  required={!isEditMode}
                />
                <label htmlFor="video-file" className="cursor-pointer">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <Video className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">
                        {form.file ? form.file.name : "Click to select video file"}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        MP4, AVI, MOV up to 2GB
                      </p>
                    </div>
                  </div>
                </label>
              </div>
              
              {form.file && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-green-700">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="text-sm font-medium">Selected: {form.file.name}</span>
                  </div>
                </div>
              )}
              
              {isEditMode && !form.file && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-700">
                    💡 Leave empty to keep current video, or select a new file to replace it
                  </p>
                </div>
              )}
              
              {isEditMode && form.file && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-amber-800">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      This will replace the current video with: {form.file.name}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Video ID Section */}
          {form.uploadMethod === "videoId" && (
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-700">
                VdoCipher Video ID *
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="vdocipherVideoId"
                  value={form.vdocipherVideoId}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 font-mono"
                  placeholder="e.g., 1a2b3c4d5e6f7g8h9i0j"
                  required
                />
                <MonitorPlay className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-green-500" />
              </div>
              
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Info className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold text-green-900 text-sm">Using Existing VdoCipher Video</h4>
                    <ul className="text-xs text-green-700 space-y-1">
                      <li>• Video must already be uploaded and in "ready" state in VdoCipher</li>
                      <li>• Enter the exact Video ID from your VdoCipher dashboard</li>
                      <li>• This will link the video to your lesson without re-uploading</li>
                      <li>• Make sure the video ID is correct to avoid playback issues</li>
                    </ul>
                  </div>
                </div>
              </div>

              {form.vdocipherVideoId && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-green-700">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="text-sm font-medium">Video ID: {form.vdocipherVideoId}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <>
      <div className="bg-white rounded-2xl max-w-4xl w-full mx-auto shadow-2xl max-h-[85vh] overflow-y-auto relative flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#1b6294] to-[#16517a] p-6 text-white sticky top-0 z-20">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                <FileVideo className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold">
                  {isEditMode ? "Video Lesson Details" : "Upload Video Lesson"}
                </h2>
                <p className="text-blue-100 text-sm">
                  {isEditMode ? "View or update your video content" : "Add a new video to your lesson"}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="w-8 h-8 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg flex items-center justify-center transition-all text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Video Title *
            </label>
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              placeholder="Enter an engaging title for your video"
              required
            />
          </div>
          
          {/* Description */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Description
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none"
              placeholder="Describe what students will learn from this video..."
            />
          </div>
          
          {/* Source Platform */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-gray-700">
              Source Platform *
            </label>
            <div className="grid grid-cols-2 gap-4">
              {sourcePlatforms.map((platform) => {
                const Icon = platform.icon;
                return (
                  <div
                    key={platform.value}
                    className={`relative border-2 rounded-xl p-4 cursor-pointer transition-all ${
                      form.sourcePlatform === platform.value
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => setForm(prev => ({ ...prev, sourcePlatform: platform.value }))}
                  >
                    <input
                      type="radio"
                      name="sourcePlatform"
                      value={platform.value}
                      checked={form.sourcePlatform === platform.value}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <div className="flex items-center gap-3">
                      <Icon className={`w-6 h-6 ${
                        form.sourcePlatform === platform.value 
                          ? "text-blue-600" 
                          : "text-gray-400"
                      }`} />
                      <span className={`font-medium ${
                        form.sourcePlatform === platform.value 
                          ? "text-blue-900" 
                          : "text-gray-700"
                      }`}>
                        {platform.label}
                      </span>
                    </div>
                    {form.sourcePlatform === platform.value && (
                      <div className="absolute top-2 right-2">
                        <CheckCircle2 className="w-5 h-5 text-blue-600" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {isEditMode && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <div className="flex items-center gap-2 text-amber-800 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span>Changing platform will replace the current video</span>
                </div>
              </div>
            )}
          </div>

          {/* Platform-specific inputs */}
          {form.sourcePlatform && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
              {renderSourceInput()}
            </div>
          )}
          
          {/* VdoCipher info */}
          {renderVdoCipherInfo()}
        </div>
        
        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex flex-col sm:flex-row items-center justify-between w-full sticky bottom-0 z-20 mt-auto">
          <div className="text-sm text-gray-600 mb-2 sm:mb-0">
            * Required fields
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              className="px-6 py-2 rounded-xl font-semibold text-gray-700 border-2 border-gray-300 hover:bg-gray-100 transition-all duration-200"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading || uploadProgress.isVisible}
              className={`px-6 py-2 rounded-xl font-semibold flex items-center gap-2 transition-all duration-200 ${
                loading || uploadProgress.isVisible
                  ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                  : "bg-gradient-to-r from-[#1b6294] to-[#16517a] hover:from-[#16517a] hover:to-[#103a58] text-white shadow-md shadow-[#1b6294]/20 hover:shadow-lg active:scale-95 cursor-pointer"
              }`}
            >
              {loading || uploadProgress.isVisible ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {isEditMode ? "Updating..." : "Processing..."}
                </>
              ) : (
                <>
                  {form.sourcePlatform === "youtube" ? (
                    <Play className="w-5 h-5" />
                  ) : (
                    <UploadCloud className="w-5 h-5" />
                  )}
                  {isEditMode
                    ? "Update Video"
                    : form.sourcePlatform === "youtube"
                    ? "Link Video"
                    : "Upload Video"}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Upload Progress Modal */}
      <UploadProgress
        isVisible={uploadProgress.isVisible}
        progress={uploadProgress.progress}
        fileName={uploadProgress.fileName}
        stage={uploadProgress.stage}
      />
      
      {/* Enhanced Popup */}
      <EnhancedPopup
        message={popup.message}
        type={popup.type}
        isVisible={popup.isVisible}
        onClose={() => setPopup({ isVisible: false, message: "", type: "" })}
      />
    </>
  );
};

export default VideoLesson;