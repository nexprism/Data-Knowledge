import React, { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../hooks/redux";
import {
  fetchSupportTicketById,
  updateSupportTicketStatus,
  addSupportTicketMessage,
  deleteMessage,
} from "../../store/slices/support";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Download,
  FileText,
  Image,
  File,
  Trash2,
  Send,
  Paperclip,
} from "lucide-react";
import PopupAlert from "../../components/popUpAlert";

interface Message {
  _id: string;
  ticketId: string;
  userId: { _id: string; fullName: string; email: string } | string;
  message: string;
  attachments: string[];
  createdAt: string;
}

interface SupportTicket {
  _id: string;
  userId: { _id: string; fullName: string; email: string };
  subject: string;
  category: string;
  description: string;
  priority: string;
  status: string;
  attachments: string[];
  messages?: Message[];
  createdAt: string;
  updatedAt: string;
}

const TicketDetails: React.FC<{ isEditMode: boolean }> = ({ isEditMode }) => {
  const { ticketId } = useParams<{ ticketId: string }>();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { tickets, loading, error } = useAppSelector((state) => state.support);

  const ticket = tickets.find((t) => t._id === ticketId);
  const [status, setStatus] = useState(ticket?.status || "open");
  const [newMessage, setNewMessage] = useState("");
  const [messageFiles, setMessageFiles] = useState<File[]>([]);
  const [showConfirmDelete, setShowConfirmDelete] = useState<string | null>(
    null
  );
  const [sendingMessage, setSendingMessage] = useState(false);
  const [messageError, setMessageError] = useState<string | null>(null);
  const [popup, setPopup] = useState({
    isVisible: false,
    message: "",
    type: "",
  });
  const ImageUrl =
    ((import.meta.env.VITE_IMAGE_URL || import.meta.env.VITE_BASE_URL || "https://api.dataknowledge.in").replace(/\/+$/, '')) + "/uploads/";

  useEffect(() => {
    if (ticketId && !ticket) {
      dispatch(fetchSupportTicketById(ticketId));
    }
  }, [dispatch, ticketId, ticket]);

  useEffect(() => {
    if (ticket) {
      setStatus(ticket.status);
    }
  }, [ticket]);

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatus(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (ticketId) {
      await dispatch(updateSupportTicketStatus({ ticketId, status }));
      navigate("/requests");
    }
  };

  const getFileIcon = (filename: string) => {
    const ext = filename.split(".").pop()?.toLowerCase();
    if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext || "")) {
      return <Image className="w-4 h-4" />;
    } else if (["pdf", "doc", "docx", "txt"].includes(ext || "")) {
      return <FileText className="w-4 h-4" />;
    }
    return <File className="w-4 h-4" />;
  };

  const getFileName = (filePath: string) => {
    return filePath.split("\\").pop() || filePath.split("/").pop() || filePath;
  };

  // Remove duplicate "uploads" in the URL if present
  const normalizeUrl = (url: string) => {
    return url.replace(/\/uploads\/uploads\//g, "/uploads/");
  };

  const handleFileDownload = (filePath: string) => {
    let fileUrl = `${ImageUrl}/${getFileName(filePath)}`;
    fileUrl = normalizeUrl(fileUrl);
    const link = document.createElement("a");
    link.href = fileUrl;
    link.download = getFileName(filePath);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileView = (filePath: string) => {
    let fileUrl = `${ImageUrl}/${getFileName(filePath)}`;
    fileUrl = normalizeUrl(fileUrl);
    window.open(fileUrl, "_blank");
  };

  const handleMessageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (ticketId && (newMessage.trim() || messageFiles.length > 0)) {
      try {
        setMessageError(null);
        setSendingMessage(true);
        const result = await dispatch(
          addSupportTicketMessage({
            ticketId,
            message: newMessage,
            attachments: messageFiles.length > 0 ? messageFiles : undefined,
          })
        );

        if (addSupportTicketMessage.fulfilled.match(result)) {
          // Message sent successfully
          setNewMessage("");
          setMessageFiles([]);
          setPopup({
            isVisible: true,
            message: "Message sent successfully!",
            type: "success",
          });
        } else {
          setPopup({
            isVisible: true,
            message: "Failed to send message. Please try again.",
            type: "error",
          });
          //   setMessageError("Failed to send message. Please try again.");
        }
      } catch (error) {
        console.error("Failed to send message:", error);
        setMessageError("An unexpected error occurred. Please try again.");
        setPopup({
          isVisible: true,
          message: "An unexpected error occurred. Please try again.",
          type: "error",
        });
      } finally {
        setSendingMessage(false);
        setNewMessage("");
        setMessageFiles([]);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setMessageFiles([...messageFiles, ...filesArray]);
    }
  };

  const removeSelectedFile = (index: number) => {
    setMessageFiles(messageFiles.filter((_, i) => i !== index));
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (ticketId) {
      await dispatch(deleteMessage({ ticketId, messageId }));
      setShowConfirmDelete(null);
    }
  };

  return (
    <>
      <PopupAlert
        isVisible={popup.isVisible}
        message={popup.message}
        type={popup.type}
        onClose={() => {
          setPopup({ isVisible: false, message: "", type: "" });
          if (popup.type === "success") {
            navigate("/requests");
          }
        }}
      />
      <div className="min-h-screen rounded-2xl border border-gray-200 bg-white px-5 py-7 dark:border-gray-800 dark:bg-white/[0.03] xl:px-10 xl:py-12">
        <button
          onClick={() => navigate("/requests")}
          className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Tickets
        </button>

        <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90 mb-6">
          {isEditMode ? "Update Support Ticket Status" : "View Support Ticket"}
        </h1>

        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4 mb-6">
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        ) : !ticket ? (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">
              Ticket not found.
            </p>
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Subject
                </label>
                <input
                  type="text"
                  name="subject"
                  value={ticket.subject}
                  disabled
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2 dark:border-gray-700 dark:bg-gray-900 dark:text-white opacity-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Category
                </label>
                <input
                  type="text"
                  name="category"
                  value={ticket.category}
                  disabled
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2 dark:border-gray-700 dark:bg-gray-900 dark:text-white opacity-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Description
                </label>
                <textarea
                  name="description"
                  value={ticket.description}
                  disabled
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2 dark:border-gray-700 dark:bg-gray-900 dark:text-white opacity-50"
                  rows={5}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Priority
                </label>
                <input
                  type="text"
                  name="priority"
                  value={ticket.priority}
                  disabled
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2 dark:border-gray-700 dark:bg-gray-900 dark:text-white opacity-50"
                />
              </div>
              {ticket.attachments && ticket.attachments.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Attachments ({ticket.attachments.length})
                  </label>
                  <div className="space-y-2">
                    {ticket.attachments.map((attachment, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-3 border border-gray-200 rounded-md bg-gray-50 dark:border-gray-700 dark:bg-gray-800"
                      >
                        {getFileIcon(attachment)}
                        <span className="flex-1 text-sm text-gray-700 dark:text-gray-300 truncate">
                          {getFileName(attachment)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleFileView(attachment)}
                          className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800
                                            dark:text-indigo-400 dark:hover:text-indigo-300 text-sm"
                        >
                          {getFileIcon(attachment)}
                          View
                        </button>

                        <button
                          type="button"
                          onClick={() => handleFileDownload(attachment)}
                          className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 text-sm"
                        >
                          <Download className="w-4 h-4" />
                          Download
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Status
                </label>
                <select
                  name="status"
                  value={status}
                  onChange={handleStatusChange}
                  disabled={!isEditMode}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                >
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
              {isEditMode && (
                <div className="flex gap-4">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                  >
                    Save Status
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate("/requests")}
                    className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:hover:bg-gray-800"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </form>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mt-8">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90 mb-4">
                Messages
              </h2>

              {/* Message List */}
              <div className="space-y-4 mb-6">
                {ticket.messages && ticket.messages.length > 0 ? (
                  ticket.messages.map((msg) => (
                    <div
                      key={msg._id}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            {typeof msg.userId === "object"
                              ? msg.userId.fullName
                              : "User"}
                          </h3>
                          {/* <p className="text-sm text-gray-500 dark:text-gray-400">
                            {new Date(msg.createdAt).toLocaleString()}
                          </p> */}
                        </div>
                        <div>
                          <button
                            type="button"
                            onClick={() => setShowConfirmDelete(msg._id)}
                            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>

                          {/* Confirm Delete Dialog */}
                          {showConfirmDelete === msg._id && (
                            <div className="absolute right-0 mt-2 bg-white dark:bg-gray-900 shadow-lg border border-gray-200 dark:border-gray-700 rounded-md p-3 z-10">
                              <p className="text-sm mb-2">
                                Delete this message?
                              </p>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleDeleteMessage(msg._id)}
                                  className="px-2 py-1 bg-red-600 text-white text-xs rounded"
                                >
                                  Yes
                                </button>
                                <button
                                  onClick={() => setShowConfirmDelete(null)}
                                  className="px-2 py-1 bg-gray-200 dark:bg-gray-700 text-xs rounded"
                                >
                                  No
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
                        {msg.message}
                      </p>

                      {/* Message Attachments */}
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="mt-3 space-y-2">
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Attachments:
                          </p>
                          <div className="space-y-2">
                            {msg.attachments.map((attachment, index) => (
                              <div
                                key={index}
                                className="flex items-center gap-3 p-2 border border-gray-200 rounded-md bg-white dark:border-gray-700 dark:bg-gray-700"
                              >
                                {getFileIcon(attachment)}
                                <span className="flex-1 text-sm text-gray-700 dark:text-gray-300 truncate">
                                  {getFileName(attachment)}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleFileView(attachment)}
                                  className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 text-xs"
                                >
                                  View
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleFileDownload(attachment)}
                                  className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 text-xs"
                                >
                                  Download
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 italic">
                    No messages yet.
                  </p>
                )}
              </div>

              {/* Add Message Form */}
              <form
                onSubmit={handleMessageSubmit}
                className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-4"
              >
                <h3 className="font-medium text-gray-800 dark:text-white/90">
                  Add Reply
                </h3>

                {/* Message Error Alert */}
                {messageError && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3">
                    <p className="text-sm text-red-800 dark:text-red-200">
                      {messageError}
                    </p>
                  </div>
                )}

                <div>
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="w-full border border-gray-300 rounded-md p-3 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                    rows={4}
                    placeholder="Type your message here..."
                  ></textarea>
                </div>

                {/* File Attachments */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Attachments
                  </label>
                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Paperclip className="w-8 h-8 mb-3 text-gray-500 dark:text-gray-400" />
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Click to upload files
                        </p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        multiple
                        onChange={handleFileChange}
                      />
                    </label>
                  </div>

                  {/* Selected Files */}
                  {messageFiles.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Selected files:
                      </p>
                      <div className="space-y-2">
                        {messageFiles.map((file, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md"
                          >
                            <div className="flex items-center gap-2">
                              {getFileIcon(file.name)}
                              <span className="text-sm text-gray-700 dark:text-gray-300 truncate max-w-xs">
                                {file.name}
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                ({(file.size / 1024).toFixed(1)} KB)
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeSelectedFile(index)}
                              className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                    disabled={
                      sendingMessage ||
                      (!newMessage.trim() && messageFiles.length === 0)
                    }
                  >
                    {sendingMessage ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    {sendingMessage ? "Sending..." : "Send Message"}
                  </button>
                </div>
              </form>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default TicketDetails;
