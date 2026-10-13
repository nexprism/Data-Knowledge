import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import { fetchForumThreadById, fetchThreadReplies, deleteForumThread, deleteForumReply, updateForumReply } from "../../store/slices/forumSlice";
import {
  User,
  Calendar,
  MessageCircle,
  CheckCircle,
  XCircle,
  Heart,
  Tag,
  Paperclip,
  Loader2,
  Trash2,
  Pencil,
} from "lucide-react";
import { RootState } from "../../store";

const BASE_URL = (import.meta.env.VITE_IMAGE_URL || import.meta.env.VITE_BASE_URL || "https://api.dataknowledge.in").replace(/\/+$/, '');

const ForumDetails: React.FC = () => {
  const { threadId } = useParams<{ threadId: string }>();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { threadReplies, repliesLoading, repliesError } = useSelector(
    (state: RootState) => state.forum
  );

  const [thread, setThread] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingReplyId, setEditingReplyId] = useState<string | null>(null);
  const [editReplyContent, setEditReplyContent] = useState("");
  const [isUpdatingReply, setIsUpdatingReply] = useState(false);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  useEffect(() => {
    const fetchData = async () => {
      if (!threadId) return;
      setLoading(true);
      setError(null);

      try {
        const token = localStorage.getItem("accessToken");
        if (!token) throw new Error("No token found");

        const threadRes = await dispatch(fetchForumThreadById({ threadId, token }) as any).unwrap();
        setThread(threadRes);
        await dispatch(fetchThreadReplies({ threadId, token }) as any).unwrap();
      } catch (err: any) {
        setError(err?.message || "Failed to load thread");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [threadId, dispatch]);

  const handleDeleteThread = async () => {
    const token = localStorage.getItem("accessToken");
    if (!thread || !token || !window.confirm("Are you sure you want to delete this thread?")) return;

    setIsDeleting(true);
    try {
      await dispatch(deleteForumThread({ threadId: thread._id, token }) as any).unwrap();
      navigate("/forum");
    } catch (err: any) {
      alert(err?.message || "Failed to delete thread");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteReply = async (replyId: string) => {
    const token = localStorage.getItem("accessToken");
    if (!token || !window.confirm("Are you sure you want to delete this reply?")) return;

    try {
      await dispatch(deleteForumReply({ replyId, token }) as any).unwrap();
    } catch (err: any) {
      alert(err?.message || "Failed to delete reply");
    }
  };

  const handleUpdateReply = async (replyId: string) => {
    const token = localStorage.getItem("accessToken");
    if (!token || !editReplyContent.trim()) return;

    setIsUpdatingReply(true);
    try {
      await dispatch(updateForumReply({ replyId, content: editReplyContent, token }) as any).unwrap();
      setEditingReplyId(null);
    } catch (err: any) {
      alert(err?.message || "Failed to update reply");
    } finally {
      setIsUpdatingReply(false);
    }
  };

  const ReplyItem: React.FC<{ reply: any }> = ({ reply }) => (
    <div className="flex flex-col gap-2">
      <div className="flex items-start bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
        <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
          <User className="w-5 h-5 text-white" />
        </div>
        <div className="ml-3 flex-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900">
                {reply.repliedBy?.fullName || "Unknown"}
              </span>
              <span className="text-xs text-gray-500">
                {new Date(reply.createdAt).toLocaleString()}
              </span>
              {reply.likeCount > 0 && (
                <span className="flex items-center text-xs text-red-500 ml-2">
                  <Heart className="w-3 h-3 mr-1" />
                  {reply.likeCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setEditingReplyId(reply._id);
                  setEditReplyContent(reply.content);
                }}
                className="p-1 text-blue-600 hover:bg-blue-50 rounded transition"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleDeleteReply(reply._id)}
                className="p-1 text-red-600 hover:bg-red-50 rounded transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {editingReplyId === reply._id ? (
            <div className="mt-2 space-y-2">
              <textarea
                value={editReplyContent}
                onChange={(e) => setEditReplyContent(e.target.value)}
                className="w-full p-2 border border-blue-300 rounded-md outline-none text-sm"
                rows={3}
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setEditingReplyId(null)}
                  className="px-3 py-1 text-xs text-gray-600 hover:bg-gray-200 rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleUpdateReply(reply._id)}
                  disabled={isUpdatingReply}
                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded disabled:opacity-50"
                >
                  {isUpdatingReply ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-1 text-gray-700 prose prose-sm max-w-none whitespace-pre-wrap">{reply.content}</div>
          )}

          {reply.attachments?.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {reply.attachments.map((att: any, idx: number) => (
                <a
                  key={idx}
                  href={`${BASE_URL}/${att.type || 'uploads/' + att.originalName}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-xs"
                >
                  <Paperclip className="w-3 h-3 mr-1" />
                  {att.originalName}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      {reply.nestedReplies?.length > 0 && (
        <div className="ml-12 mt-2 space-y-2 border-l-2 border-gray-100 pl-4">
          {reply.nestedReplies.map((nested: any) => (
            <ReplyItem key={nested._id} reply={nested} />
          ))}
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error || !thread) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-900 mb-2">Error</h3>
          <p className="text-gray-600 mb-4">{error || "Thread not found"}</p>
          <button onClick={() => navigate("/forum")} className="text-blue-600 font-medium">Back to Forum</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-8">
            <div className="flex justify-between items-start mb-6">
              <div className="flex gap-4 items-center">
                <div className="h-14 w-14 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                  <MessageCircle className="w-7 h-7" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{thread.title}</h1>
                  <div className="flex gap-4 text-sm text-gray-500 mt-1">
                    <span className="flex items-center gap-1"><User className="w-4 h-4" /> {thread.createdBy?.fullName}</span>
                    <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {formatDate(thread.createdAt)}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => navigate(`/forum/edit/${thread._id}`)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                  <Pencil className="w-5 h-5" />
                </button>
                <button onClick={handleDeleteThread} disabled={isDeleting} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                  {isDeleting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-6 mb-8 border border-gray-100">
              <div className="prose max-w-none text-gray-800 whitespace-pre-wrap">{thread.content}</div>
              {thread.attachments?.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-200 grid gap-2">
                  {thread.attachments.map((att: any, i: number) => (
                    <a key={i} href={`${BASE_URL}/${att.type || 'uploads/' + att.originalName}`} target="_blank" rel="noreferrer" className="flex items-center p-2 text-sm text-blue-600 hover:underline">
                      <Paperclip className="w-4 h-4 mr-2" /> {att.originalName}
                    </a>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-gray-100 pt-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <MessageCircle className="w-6 h-6 text-blue-600" />
                Replies ({threadReplies?.length || 0})
              </h2>

              {repliesLoading ? (
                <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
              ) : threadReplies?.length > 0 ? (
                <div className="space-y-6">
                  {threadReplies.map(reply => <ReplyItem key={reply._id} reply={reply} />)}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-400">No replies yet.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForumDetails;
