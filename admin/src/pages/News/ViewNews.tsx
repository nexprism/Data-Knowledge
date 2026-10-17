import React, { useEffect } from "react";
import DOMPurify from "dompurify";
import { useParams, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../hooks/redux";
import { fetchNewsById } from "../../store/slices/news";
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Eye,
  Tag,
  MapPin,
  Edit3,
  Share2,
  Bookmark,
  MessageCircle,
  FileText,
  Globe,
} from "lucide-react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";

const IMAGE_BASE_URL =
  import.meta.env.VITE_IMAGE_URL || import.meta.env.VITE_BASE_URL || "";

const getImageUrl = (url?: string | null) => {
  if (!url) return "";
  if (/^https?:\/\//.test(url)) return url;
  return `${IMAGE_BASE_URL}/${url}`;
};

// Helper to safely extract text from possibly structured values
const extractText = (val: any): string => {
  if (val == null) return "";
  if (typeof val === "string") return val;
  if (typeof val === "number") return String(val);
  if (typeof val === "object") {
    if (typeof val.text === "string") return val.text;
    if (typeof val.content === "string") return val.content;
    if (Array.isArray(val.items)) {
      return val.items
        .map((i: any) => extractText(i))
        .filter(Boolean)
        .join(", ");
    }
    if (Array.isArray(val.content)) {
      return val.content
        .map((c: any) => extractText(c))
        .filter(Boolean)
        .join(" ");
    }
    return JSON.stringify(val);
  }
  return String(val);
};

// Helper to escape HTML
const escapeHtml = (text: string): string => {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
};

// Helper to render EditorJS content blocks to HTML
const renderEditorJSContent = (content: any): string => {
  if (!content) return "";

  // If content is already a string (HTML), return it
  if (typeof content === "string") {
    // Check if it's JSON string
    try {
      const parsed = JSON.parse(content);
      if (parsed.blocks) {
        return renderEditorJSBlocks(parsed.blocks);
      }
    } catch {
      // Not JSON, return as HTML
      return content;
    }
  }

  // If content is an object with blocks
  if (typeof content === "object" && content.blocks && Array.isArray(content.blocks)) {
    return renderEditorJSBlocks(content.blocks);
  }

  return "";
};

// Render EditorJS blocks to HTML
const renderEditorJSBlocks = (blocks: any[]): string => {
  if (!Array.isArray(blocks)) return "";

  return blocks
    .map((block) => {
      switch (block.type) {
        case "paragraph":
          const text = block.data?.text || "";
          // Allow basic HTML in paragraphs (from EditorJS inline formatting)
          return `<p class="mb-4 text-gray-700 dark:text-gray-300 leading-relaxed">${text}</p>`;

        case "header":
          const level = block.data?.level || 2;
          const headerText = block.data?.text || "";
          const HeaderTag = `h${level}`;
          // Allow basic HTML in headers
          return `<${HeaderTag} class="mb-4 mt-6 font-bold text-gray-900 dark:text-white">${headerText}</${HeaderTag}>`;

        case "list":
          const items = block.data?.items || [];
          const style = block.data?.style || "unordered";
          const listTag = style === "ordered" ? "ol" : "ul";
          const listClass = style === "ordered" ? "list-decimal ml-6 mb-4" : "list-disc ml-6 mb-4";
          const listItems = items
            .map((item: string) => `<li class="mb-2 text-gray-700 dark:text-gray-300">${item}</li>`)
            .join("");
          return `<${listTag} class="${listClass}">${listItems}</${listTag}>`;

        case "quote":
          const quoteText = block.data?.text || "";
          const quoteCaption = block.data?.caption || "";
          return `
            <blockquote class="border-l-4 border-blue-500 pl-4 py-2 my-4 italic text-gray-700 dark:text-gray-300 bg-blue-50 dark:bg-blue-900/20 rounded-r">
              <p class="mb-2">${quoteText}</p>
              ${quoteCaption ? `<cite class="text-sm text-gray-500 dark:text-gray-400">— ${escapeHtml(quoteCaption)}</cite>` : ""}
            </blockquote>
          `;

        case "image":
          const imageUrl = block.data?.file?.url || block.data?.url || "";
          const imageCaption = block.data?.caption || "";
          const imageAlt = block.data?.alt || imageCaption || "Image";
          if (!imageUrl) return "";
          // Handle both full URLs and relative paths
          const finalImageUrl = imageUrl.startsWith("http://") || imageUrl.startsWith("https://")
            ? imageUrl
            : getImageUrl(imageUrl);
          return `
            <figure class="my-6">
              <img 
                src="${finalImageUrl}" 
                alt="${imageAlt.replace(/"/g, '&quot;')}" 
                class="w-full h-auto rounded-lg shadow-lg"
                loading="lazy"
              />
              ${imageCaption ? `<figcaption class="mt-2 text-sm text-center text-gray-600 dark:text-gray-400 italic">${imageCaption.replace(/"/g, '&quot;')}</figcaption>` : ""}
            </figure>
          `;

        case "video":
          const videoUrl = block.data?.url || block.data?.file?.url || "";
          if (!videoUrl) return "";
          const finalVideoUrl = videoUrl.startsWith("http://") || videoUrl.startsWith("https://")
            ? videoUrl
            : getImageUrl(videoUrl);
          return `
            <div class="my-6 relative w-full" style="padding-bottom: 56.25%;">
              <video 
                src="${finalVideoUrl}" 
                controls 
                class="absolute top-0 left-0 w-full h-full rounded-lg"
              >
                Your browser does not support the video tag.
              </video>
            </div>
          `;

        case "audio":
          const audioUrl = block.data?.url || block.data?.file?.url || "";
          if (!audioUrl) return "";
          const finalAudioUrl = audioUrl.startsWith("http://") || audioUrl.startsWith("https://")
            ? audioUrl
            : getImageUrl(audioUrl);
          return `
            <div class="my-6">
              <audio 
                src="${finalAudioUrl}" 
                controls 
                class="w-full"
              >
                Your browser does not support the audio tag.
              </audio>
            </div>
          `;

        case "youtube":
          const youtubeId = block.data?.videoId || "";
          if (!youtubeId) return "";
          return `
            <div class="my-6 relative w-full" style="padding-bottom: 56.25%;">
              <iframe 
                src="https://www.youtube.com/embed/${youtubeId}" 
                frameborder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowfullscreen
                class="absolute top-0 left-0 w-full h-full rounded-lg"
              ></iframe>
            </div>
          `;

        case "twitter":
        case "facebook":
          const embedUrl = block.data?.url || "";
          if (!embedUrl) return "";
          return `
            <div class="my-6">
              <iframe 
                src="${embedUrl}" 
                class="w-full min-h-[400px] rounded-lg"
                frameborder="0"
              ></iframe>
            </div>
          `;

        default:
          // For unknown block types, try to render as JSON
          return `<pre class="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg text-xs overflow-x-auto mb-4"><code>${JSON.stringify(block, null, 2)}</code></pre>`;
      }
    })
    .join("");
};

// Helper to format scheduled publication datetime
const formatSchedule = (dateStr?: string | null) => {
  if (!dateStr) return "-";
  try {
    return new Date(dateStr).toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "-";
  }
};

export default function ViewNews() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const {
    currentNews: news,
    loading,
    error,
  } = useAppSelector((state) => state.news);

  useEffect(() => {
    if (id) {
      dispatch(fetchNewsById(id));
    }
  }, [id, dispatch]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Loading news...
          </p>
        </div>
      </div>
    );
  }

  if (error || !news) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-10 h-10 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Blog Not Found
          </h2>
          <p className="text-red-600 dark:text-red-400 mb-6">
            {error || "The blog you're looking for doesn't exist."}
          </p>
          <button
            onClick={() => navigate("/blogs")}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Back to All Blogs
          </button>
        </div>
      </div>
    );
  }

  const categoryName = Array.isArray(news.categories) && news.categories.length > 0
    ? news.categories[0]
    : typeof news.categories === "string"
      ? news.categories
      : "";

  return (
    <>
      <PageMeta title={`${news.title} | LMS Admin`} description={news.summary || news.title} />
      <PageBreadcrumb pageTitle="View News" />
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header Navigation */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => navigate("/news")}
                className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors group"
              >
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                <span className="font-medium">Back to News</span>
              </button>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate(`/news/edit/${news._id}`)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm hover:shadow-md"
                >
                  <Edit3 className="w-4 h-4" />
                  <span className="hidden sm:inline">Edit News</span>
                  <span className="sm:hidden">Edit</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main News Content - 2 columns */}
            <div className="lg:col-span-2 space-y-6">
              {/* News Header */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
                {/* Cover Image */}
                {news.imageUrl && (
                  <div className="relative h-96 overflow-hidden">
                    <img
                      src={getImageUrl(news.imageUrl)}
                      alt={news.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>

                    {/* Badges on Image */}
                    <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                      {news.isBreaking && (
                        <span className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg font-bold text-sm shadow-lg backdrop-blur-sm">
                          <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                          BREAKING
                        </span>
                      )}
                      {news.isPremium && (
                        <span className="px-4 py-2 bg-purple-600 text-white rounded-lg font-bold text-sm shadow-lg backdrop-blur-sm">
                          ⭐ Premium
                        </span>
                      )}
                      <span
                        className={`px-4 py-2 rounded-lg font-bold text-sm text-white shadow-lg backdrop-blur-sm ${news.status === "active"
                          ? "bg-green-600"
                          : news.status === "blocked"
                            ? "bg-yellow-600"
                            : "bg-red-600"
                          }`}
                      >
                        {(news.status || "active").toUpperCase()}
                      </span>
                    </div>
                  </div>
                )}

                {/* Title & Meta */}
                <div className="p-6 sm:p-8">
                  {categoryName && (
                    <div className="mb-4">
                      <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold text-gray-900 dark:text-white shadow-md hover:shadow-lg transition-shadow bg-blue-100 dark:bg-blue-900/30">
                        <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                        {categoryName}
                      </span>
                    </div>
                  )}

                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
                    {news.title || "Untitled"}
                  </h1>

                  {news.summary && (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 mb-6 border-l-4 border-blue-500">
                      <p className="text-lg sm:text-xl text-gray-700 dark:text-gray-300 leading-relaxed italic">
                        {news.summary}
                      </p>
                    </div>
                  )}

                  {/* Meta Info */}
                  <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-sm text-gray-600 dark:text-gray-400 pb-6 border-b border-gray-200 dark:border-gray-700">
                    {news.author && (
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-blue-600" />
                        </div>
                        <span className="font-medium">
                          {(news.author as any)?.name || news.author || "Unknown"}
                        </span>
                      </div>
                    )}
                    <span className="text-gray-300 hidden sm:inline">•</span>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {news.publishedAt
                          ? new Date(news.publishedAt).toLocaleString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                          : "-"}
                      </span>
                    </div>
                    <span className="text-gray-300 hidden sm:inline">•</span>
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4" />
                      <span className="font-semibold">
                        {news.stats?.views?.toLocaleString() || 0} views
                      </span>
                    </div>
                  </div>

                  {/* Tags */}
                  {news.tags && news.tags.length > 0 && (
                    <div className="pt-6">
                      <div className="flex items-center gap-2 mb-3">
                        <Tag className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                        <span className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                          Tags
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {news.tags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg text-sm font-medium hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors cursor-pointer"
                          >
                            #{extractText(tag)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* News Content */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 sm:p-8 overflow-hidden">
                <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                  <MessageCircle className="w-6 h-6 text-blue-600" />
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    News Content
                  </h2>
                </div>

                <div className="prose prose-lg dark:prose-invert max-w-none overflow-wrap break-words">
                  <style>{`
                    .news-content {
                      word-wrap: break-word;
                      overflow-wrap: break-word;
                      word-break: break-word;
                    }
                    .news-content img {
                      max-width: 100%;
                      height: auto;
                    }
                    .news-content iframe {
                      max-width: 100%;
                    }
                    .news-content pre {
                      white-space: pre-wrap;
                      word-wrap: break-word;
                      overflow-wrap: break-word;
                    }
                  `}</style>
                  {news.content ? (
                    (() => {
                      const renderedContent = renderEditorJSContent(news.content);
                      return renderedContent ? (
                        <div
                          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(renderedContent) }}
                          className="news-content"
                        />
                      ) : (
                        <div className="text-center py-12">
                          <FileText className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                          <p className="text-gray-500 dark:text-gray-400">
                            Content format not recognized
                          </p>
                        </div>
                      );
                    })()
                  ) : (
                    <div className="text-center py-12">
                      <FileText className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-500 dark:text-gray-400">
                        No content available
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Video */}
              {news.videoUrl && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 sm:p-8">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Video</h3>
                  <div className="relative w-full overflow-hidden rounded-xl shadow-lg" style={{ paddingBottom: '56.25%' }}>
                    <iframe
                      src={news.videoUrl}
                      className="absolute top-0 left-0 w-full h-full border-0"
                      allowFullScreen
                      loading="lazy"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar - 1 column */}
            <div className="lg:col-span-1 space-y-6">
              {/* Location Info */}
              {news.country && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-blue-600" />
                    Location
                  </h3>

                  <div className="space-y-3">
                    {news.country && (
                      <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-100 dark:border-green-800">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          Country
                        </span>
                        <span className="font-bold text-gray-900 dark:text-white">
                          {news.country}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* News Stats */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                  Statistics
                </h3>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Total Views
                      </span>
                    </div>
                    <span className="font-bold text-lg text-gray-900 dark:text-white">
                      {news.stats?.views?.toLocaleString() || 0}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-100 dark:border-green-800">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Published
                      </span>
                    </div>
                    <span className="font-medium text-sm text-gray-900 dark:text-white">
                      {news.publishedAt
                        ? new Date(news.publishedAt).toLocaleDateString()
                        : "-"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-700 dark:to-slate-700 rounded-lg border border-gray-200 dark:border-gray-600">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-600" />
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Last Updated
                      </span>
                    </div>
                    <span className="font-medium text-sm text-gray-900 dark:text-white">
                      {news.updatedAt
                        ? new Date(news.updatedAt).toLocaleString()
                        : "-"}
                    </span>
                  </div>

                  {news.stats?.likes !== undefined && (
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 rounded-lg border border-red-100 dark:border-red-800">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          ❤️ Likes
                        </span>
                      </div>
                      <span className="font-bold text-lg text-gray-900 dark:text-white">
                        {news.stats.likes || 0}
                      </span>
                    </div>
                  )}

                  {news.stats?.shares !== undefined && (
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border border-purple-100 dark:border-purple-800">
                      <div className="flex items-center gap-2">
                        <Share2 className="w-4 h-4 text-purple-600" />
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          Shares
                        </span>
                      </div>
                      <span className="font-bold text-lg text-gray-900 dark:text-white">
                        {news.stats.shares || 0}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Source Info */}
              {news.source && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 overflow-hidden">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Globe className="w-5 h-5 text-blue-600" />
                    Source
                  </h3>
                  <div className="space-y-2">
                    {(news.source as any)?.name && (
                      <p className="text-sm font-medium text-gray-900 dark:text-white break-words">
                        {(news.source as any).name}
                      </p>
                    )}
                    {(news.source as any)?.url && (
                      <div className="break-all">
                        <a
                          href={(news.source as any).url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 dark:text-blue-400 hover:underline break-all word-break break-words inline-block max-w-full"
                          title={(news.source as any).url}
                        >
                          <span className="break-all">
                            {(news.source as any).url}
                          </span>
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Language */}
              {news.language && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                    Language
                  </h3>
                  <p className="text-sm font-medium text-gray-900 dark:text-white uppercase">
                    {news.language}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
