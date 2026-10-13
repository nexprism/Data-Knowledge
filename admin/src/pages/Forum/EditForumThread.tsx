import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../hooks/redux";
import { fetchForumThreadById, updateForumThread, createForumThread } from "../../store/slices/forumSlice";
import { RootState } from "../../store";
import { ArrowLeft, Upload, X, Loader2, Save, Paperclip } from "lucide-react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";

const BASE_URL = (import.meta.env.VITE_IMAGE_URL || import.meta.env.VITE_BASE_URL || "https://api.dataknowledge.in").replace(/\/+$/, '');

const EditForumThread: React.FC = () => {
  const { threadId } = useParams<{ threadId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { selectedThread, loading, error } = useAppSelector((state: RootState) => state.forum);
  const isEditMode = !!threadId;
  const token = useAppSelector((state: RootState) => state.auth.token);

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    tags: [] as string[],
  });
  const [tagInput, setTagInput] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  useEffect(() => {
    if (isEditMode && token) {
      dispatch(fetchForumThreadById({ threadId, token }));
    }
  }, [isEditMode, threadId, token, dispatch]);

  useEffect(() => {
    if (isEditMode && selectedThread) {
      setFormData({
        title: selectedThread.title || "",
        content: selectedThread.content || "",
        tags: Array.isArray(selectedThread.tags) ? selectedThread.tags : [],
      });
    } else if (!isEditMode) {
      setFormData({
        title: "",
        content: "",
        tags: [],
      });
    }
  }, [isEditMode, selectedThread]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setUpdating(true);
    setUpdateError(null);

    try {
      if (isEditMode) {
        await dispatch(updateForumThread({
          threadId: threadId!,
          data: {
            title: formData.title,
            content: formData.content,
            tags: formData.tags,
            files: files
          },
          token
        })).unwrap();
      } else {
        await dispatch(createForumThread({
          data: {
            title: formData.title,
            content: formData.content,
            tags: formData.tags,
            files: files
          },
          token
        })).unwrap();
      }

      navigate("/forum");
    } catch (err: any) {
      setUpdateError(err?.message || `Failed to ${isEditMode ? 'update' : 'create'} thread`);
    } finally {
      setUpdating(false);
    }
  };

  if (loading && isEditMode) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (isEditMode && (error || !selectedThread)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error || "Thread not found"}</p>
          <button
            onClick={() => navigate("/forum")}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Back to Forum
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageMeta title={`${isEditMode ? 'Edit' : 'Create'} Forum Thread | LMS Admin`} description={`${isEditMode ? 'Edit' : 'Create'} forum thread`} />
      <PageBreadcrumb pageTitle={`${isEditMode ? 'Edit' : 'Create'} Forum Thread`} />

      <div className="min-h-screen rounded-2xl border border-gray-200 bg-white px-5 py-7 dark:border-gray-800 dark:bg-white/[0.03] xl:px-10 xl:py-12">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate("/forum")}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Forum
          </button>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">{isEditMode ? 'Edit Thread' : 'Create New Thread'}</h1>
        </div>

        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Thread Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              placeholder="Enter thread title"
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Content *
            </label>
            <textarea
              name="content"
              value={formData.content}
              onChange={handleInputChange}
              required
              rows={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              placeholder="Enter thread content"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tags
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                placeholder="Add a tag and press Enter"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-1 text-blue-600 hover:text-blue-800"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Existing Attachments */}
          {isEditMode && selectedThread && selectedThread.attachments && selectedThread.attachments.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Current Attachments
              </label>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <div className="space-y-2">
                  {selectedThread.attachments.map((att: any, idx: number) => {
                    const attachmentUrl = `${BASE_URL}/${att.type}`;
                    return (
                      <div key={idx} className="flex items-center justify-between p-2 bg-white dark:bg-gray-700 rounded border">
                        <a
                          href={attachmentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center text-blue-600 hover:text-blue-800"
                        >
                          <Paperclip className="w-4 h-4 mr-2" />
                          <span className="text-sm">{att.originalName}</span>
                        </a>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {att.fileType}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Note: Adding new files will replace existing attachments
                </p>
              </div>
            </div>
          )}

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {isEditMode && selectedThread && selectedThread.attachments && selectedThread.attachments.length > 0 ? 'Replace Attachments' : 'Add Attachments'}
            </label>
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 dark:hover:bg-gray-800 dark:bg-gray-700 dark:border-gray-600">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400" />
                  <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    PDF, DOC, DOCX, JPG, PNG files
                  </p>
                </div>
                <input
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                />
              </label>
            </div>
          </div>

          {/* Selected Files */}
          {files.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                New Files to Upload:
              </h4>
              <div className="space-y-2">
                {files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                    <span className="text-sm text-gray-700 dark:text-gray-300">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error Display */}
          {updateError && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
              <p className="text-red-800 dark:text-red-200">{updateError}</p>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => navigate("/forum")}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updating}
              className="flex items-center gap-2 px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {updating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {isEditMode ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {isEditMode ? 'Update Thread' : 'Create Thread'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditForumThread;
