import React, { useState, useEffect } from "react";
import { useParams, useLocation } from "react-router-dom";
import { 
  Star, 
  Upload, 
  Loader2, 
  Check, 
  Plus, 
  Save, 
  X, 
  Trash2,
  Trash
} from "lucide-react";
import axiosInstance from "../../services/axiosConfig";

const AddReview = () => {
  const params = useParams();
  const location = useLocation();
  
  // Try both 'id' and 'courseId' (from App.tsx) or extract from URL path as fallback
  const courseId = params.courseId || params.id || location.pathname.split("/").pop() || "";
  
  const [reviews, setReviews] = useState([
    {
      id: "draft-" + Math.random().toString(36).substring(7),
      name: "",
      designation: "",
      image: null,
      rating: 5,
      reviewText: "",
      sequence: 0,
    }
  ]);

  const [existingReviews, setExistingReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const fetchExistingReviews = async () => {
      if (!courseId) return;
      try {
        const response = await axiosInstance.get(`courses/${courseId}`);
        const data = response.data?.data?.course?.reviews || [];
        setExistingReviews(data);
      } catch (err) {
        console.error("AddReview Fetch Error:", err);
      }
    };
    fetchExistingReviews();
  }, [courseId]);

  const addReviewDraft = () => {
    setReviews([
      ...reviews,
      {
        id: "draft-" + Math.random().toString(36).substring(7),
        name: "",
        designation: "",
        image: null,
        rating: 5,
        reviewText: "",
        sequence: 0,
      }
    ]);
  };

  const removeReviewDraft = (id) => {
    if (reviews.length === 1) return;
    setReviews(reviews.filter(r => r.id !== id));
  };

  const updateDraft = (id, field, value) => {
    setReviews(current => current.map(r => (r.id === id ? { ...r, [field]: value } : r)));
  };

  const submitSingleReview = async (review, index) => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const formData = new FormData();
      formData.append("name", review.name);
      formData.append("designation", review.designation);
      if (review.image) formData.append("image", review.image);
      formData.append("rating", String(review.rating));
      formData.append("reviewText", review.reviewText);
      formData.append("sequence", String(review.sequence));

      await axiosInstance.post(`courses/${courseId}/reviews`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setSuccess(`Review saved successfully!`);
      
      setReviews(current => {
        const filtered = current.filter(r => r.id !== review.id);
        return filtered.length > 0 ? filtered : [{
          id: "draft-" + Math.random().toString(36).substring(7),
          name: "",
          designation: "",
          image: null,
          rating: 5,
          reviewText: "",
          sequence: 0,
        }];
      });

      const response = await axiosInstance.get(`courses/${courseId}`);
      setExistingReviews(response.data?.data?.course?.reviews || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save review.");
    } finally {
      setLoading(false);
    }
  };

  const saveAllDrafts = async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      for (const review of reviews) {
        const formData = new FormData();
        formData.append("name", review.name);
        formData.append("designation", review.designation);
        if (review.image) formData.append("image", review.image);
        formData.append("rating", String(review.rating));
        formData.append("reviewText", review.reviewText);
        formData.append("sequence", String(review.sequence));

        await axiosInstance.post(`courses/${courseId}/reviews`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      setSuccess(`All reviews saved!`);
      setReviews([{
        id: "draft-" + Math.random().toString(36).substring(7),
        name: "",
        designation: "",
        image: null,
        rating: 5,
        reviewText: "",
        sequence: 0,
      }]);

      const response = await axiosInstance.get(`courses/${courseId}`);
      setExistingReviews(response.data?.data?.course?.reviews || []);
    } catch (err) {
      setError("Failed to save reviews.");
    } finally {
      setLoading(false);
    }
  };

  const deleteExistingReview = async (reviewId) => {
    if (!window.confirm("Delete this review?")) return;
    setLoading(true);
    try {
      await axiosInstance.delete(`courses/${courseId}/reviews/${reviewId}`);
      setExistingReviews(prev => prev.filter(r => r._id !== reviewId));
      setSuccess("Review deleted.");
    } catch (err) {
      setError("Failed to delete review.");
    } finally {
      setLoading(false);
    }
  };

  const [viewMode, setViewMode] = useState("grid"); // "grid" or "list"

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6 lg:p-8">
      {/* Existing Reviews Grid */}
      <div className="mb-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Star className="w-7 h-7 text-yellow-500 fill-yellow-500" />
            Course Reviews ({existingReviews.filter(r => r != null).length})
          </h3>
          
          {/* View Toggle */}
          <div className="flex items-center bg-gray-100 dark:bg-gray-900 rounded-xl p-1 shadow-inner">
            <button 
              onClick={() => setViewMode("grid")}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === "grid" ? "bg-white dark:bg-gray-800 shadow-sm text-blue-600" : "text-gray-500"}`}
            >
              Grid View
            </button>
            <button 
              onClick={() => setViewMode("list")}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === "list" ? "bg-white dark:bg-gray-800 shadow-sm text-blue-600" : "text-gray-500"}`}
            >
              List View
            </button>
          </div>
        </div>

        {existingReviews && existingReviews.length > 0 ? (
          viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {existingReviews.filter(r => r != null).map((rev) => (
                <div key={rev._id || Math.random()} className="p-5 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 relative group transition-all hover:shadow-md">
                  <button 
                    onClick={() => deleteExistingReview(rev._id)}
                    className="absolute top-3 right-3 p-1.5 bg-white dark:bg-gray-800 text-red-500 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
                    title="Delete Review"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <div className="flex items-center gap-3 mb-4">
                    {rev.image ? (
                      <img src={rev.image} className="w-12 h-12 rounded-full object-cover border-2 border-white dark:border-gray-700 shadow-sm" alt="" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold uppercase">
                        {rev.name?.charAt(0) || "?"}
                      </div>
                    )}
                    <div>
                      <h4 className="font-bold text-sm text-gray-900 dark:text-gray-100">{rev.name || "Anonymous"}</h4>
                      <p className="text-xs text-gray-500">{rev.designation || "Student"}</p>
                    </div>
                  </div>
                  <div className="flex gap-0.5 mb-3">
                    {[1,2,3,4,5].map(s => (
                      <Star key={s} className={`w-3.5 h-3.5 ${s <= (rev.rating || 0) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`} />
                    ))}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 italic">"{rev.reviewText || "No comment."}"</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700">
              <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left">
                <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 text-xs uppercase font-bold">
                  <tr>
                    <th className="px-6 py-4">Student</th>
                    <th className="px-6 py-4">Rating</th>
                    <th className="px-6 py-4">Review</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {existingReviews.filter(r => r != null).map((rev) => (
                    <tr key={rev._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/20 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {rev.image && <img src={rev.image} className="w-8 h-8 rounded-full object-cover" alt="" />}
                          <div>
                            <div className="text-sm font-bold">{rev.name}</div>
                            <div className="text-xs text-gray-500">{rev.designation}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-0.5">
                          {[1,2,3,4,5].map(s => (
                            <Star key={s} className={`w-3 h-3 ${s <= (rev.rating || 0) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`} />
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1 max-w-xs">{rev.reviewText}</div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => deleteExistingReview(rev._id)} className="text-red-500 hover:text-red-700 p-1">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
          )
        ) : (
          <div className="text-center py-10 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700">
            <p className="text-gray-500 italic">No reviews added yet. Start by adding one below.</p>
          </div>
        )}
      </div>

      <hr className="my-12 border-gray-100 dark:border-gray-700" />

      {/* Add New Section */}
      <div className="mb-10 rounded-3xl border border-blue-200 dark:border-blue-900 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="max-w-md">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Add New Reviews</h3>
            <p className="text-gray-600 dark:text-gray-400">Create multiple review cards to showcase student success.</p>
          </div>
          <button 
            onClick={addReviewDraft} 
            className="flex items-center justify-center gap-2 px-6 py-3.5 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 hover:shadow-lg transition-all active:scale-95"
          >
            <Plus className="w-5 h-5" /> Add Another Card
          </button>
        </div>
      </div>

      <div className="space-y-8">
        {reviews.map((review, index) => (
          <div key={review.id} className="p-6 sm:p-8 border border-gray-200 dark:border-gray-700 rounded-3xl space-y-6 shadow-sm bg-white dark:bg-transparent">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white text-xs font-bold">
                  {index + 1}
                </span>
                <h4 className="text-lg font-bold text-gray-900 dark:text-gray-100">Review Draft</h4>
              </div>
              <button 
                onClick={() => removeReviewDraft(review.id)} 
                className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors disabled:hidden"
                disabled={reviews.length === 1}
                title="Remove Card"
              >
                <Trash className="w-5 h-5" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Reviewer Name *</label>
                <input 
                  type="text" 
                  placeholder="Enter student name" 
                  value={review.name} 
                  onChange={e => updateDraft(review.id, "name", e.target.value)}
                  className="w-full px-4 py-3.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-transparent focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Designation *</label>
                <input 
                  type="text" 
                  placeholder="e.g. Software Engineer" 
                  value={review.designation} 
                  onChange={e => updateDraft(review.id, "designation", e.target.value)}
                  className="w-full px-4 py-3.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-transparent focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Student Photo</label>
              <div className="relative group cursor-pointer border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl p-6 text-center hover:border-blue-400 transition-colors">
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={e => updateDraft(review.id, "image", e.target.files?.[0] || null)}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <Upload className="w-10 h-10 mx-auto mb-3 text-gray-400" />
                <p className="text-sm text-gray-500 font-medium">
                  {review.image ? review.image.name : "Click or drag to upload photo"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div className="space-y-3">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Rating *</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      onClick={() => updateDraft(review.id, "rating", s)}
                      className={`w-9 h-9 cursor-pointer transition-all hover:scale-110 ${s <= review.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-200 dark:text-gray-700"}`}
                    />
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Sequence Order</label>
                <input 
                  type="number" 
                  value={review.sequence} 
                  onChange={e => updateDraft(review.id, "sequence", Number(e.target.value))}
                  className="w-full max-w-[200px] px-4 py-3.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-transparent focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Review Text *</label>
              <textarea 
                rows={4} 
                placeholder="Paste the student's review content here..." 
                value={review.reviewText} 
                onChange={e => updateDraft(review.id, "reviewText", e.target.value)}
                className="w-full px-4 py-4 rounded-xl border border-gray-300 dark:border-gray-600 bg-transparent focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="flex justify-end pt-2">
              <button 
                onClick={() => submitSingleReview(review, index)}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-3 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-xl font-bold hover:bg-black dark:hover:bg-white transition-all active:scale-95 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Save This Review
              </button>
            </div>
          </div>
        ))}
      </div>

      {reviews.length > 1 && (
        <div className="mt-12 flex flex-col items-center gap-4">
          <button 
            onClick={saveAllDrafts} 
            disabled={loading} 
            className="group relative px-12 py-5 bg-blue-600 text-white rounded-2xl font-bold text-lg shadow-2xl shadow-blue-600/30 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-3"
          >
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6 group-hover:rotate-12 transition-transform" />}
            Save All {reviews.length} Reviews
          </button>
          <p className="text-xs text-gray-500">This will save all draft cards to the database.</p>
        </div>
      )}

      {error && <p className="mt-8 p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm text-center font-medium border border-red-100 dark:border-red-900/30">{error}</p>}
      {success && <p className="mt-8 p-4 rounded-2xl bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-sm text-center font-medium border border-green-100 dark:border-green-900/30">{success}</p>}
    </div>
  );
};

export default AddReview;