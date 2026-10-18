import React, { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../hooks/redux";
import {
  fetchHeroSectionAdmin,
  updateHeroSectionAdmin,
  clearHeroMessages,
  HeroSectionData,
} from "../../store/slices/heroSection";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import { API_BASE_URL, IMAGE_BASE_URL } from "../../utils/apiConfig";
import {
  Sparkles,
  Save,
  Upload,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Eye,
  Layers,
  Image as ImageIcon,
  ExternalLink,
  Calendar,
  X,
} from "lucide-react";

const HeroSection: React.FC = () => {
  const dispatch = useAppDispatch();
  const { hero, loading, saving, error, successMessage } = useAppSelector(
    (state) => state.heroSection
  );

  const VITE_IMAGE = `${IMAGE_BASE_URL}/uploads`;
  const VITE_BASE_URL = API_BASE_URL;

  // Form State
  const [headlinePrefix, setHeadlinePrefix] = useState("");
  const [headlineHighlight, setHeadlineHighlight] = useState("");
  const [description, setDescription] = useState("");
  const [badgeText, setBadgeText] = useState("");
  const [primaryButtonText, setPrimaryButtonText] = useState("");
  const [primaryButtonLink, setPrimaryButtonLink] = useState("");
  const [showPrimaryButton, setShowPrimaryButton] = useState(true);
  const [secondaryButtonText, setSecondaryButtonText] = useState("");
  const [secondaryButtonAction, setSecondaryButtonAction] = useState<"consultation_modal" | "custom_link">("consultation_modal");
  const [secondaryButtonLink, setSecondaryButtonLink] = useState("");
  const [showSecondaryButton, setShowSecondaryButton] = useState(true);
  const [mentorImage, setMentorImage] = useState("");
  const [mentorImageAlt, setMentorImageAlt] = useState("");
  const [isActive, setIsActive] = useState(true);

  // Image Upload State
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");

  useEffect(() => {
    dispatch(fetchHeroSectionAdmin());
  }, [dispatch]);

  // Sync state when hero data is loaded
  useEffect(() => {
    if (hero) {
      setHeadlinePrefix(hero.headlinePrefix || "");
      setHeadlineHighlight(hero.headlineHighlight || "");
      setDescription(hero.description || "");
      setBadgeText(hero.badgeText || "");
      setPrimaryButtonText(hero.primaryButtonText || "");
      setPrimaryButtonLink(hero.primaryButtonLink || "");
      setShowPrimaryButton(hero.showPrimaryButton !== false);
      setSecondaryButtonText(hero.secondaryButtonText || "");
      setSecondaryButtonAction(hero.secondaryButtonAction || "consultation_modal");
      setSecondaryButtonLink(hero.secondaryButtonLink || "");
      setShowSecondaryButton(hero.showSecondaryButton !== false);
      setMentorImage(hero.mentorImage || "");
      setMentorImageAlt(hero.mentorImageAlt || "");
      setIsActive(hero.isActive !== false);

      if (hero.mentorImage) {
        if (hero.mentorImage.startsWith("http") || hero.mentorImage.startsWith("/")) {
          setImagePreview(hero.mentorImage);
        } else {
          setImagePreview(`${VITE_BASE_URL}/${hero.mentorImage}`);
        }
      } else {
        setImagePreview("/data_knowlege/mentor/mentore_2.png");
      }
    }
  }, [hero, VITE_BASE_URL]);

  // Clear notifications after 5 seconds
  useEffect(() => {
    if (successMessage || error) {
      const timer = setTimeout(() => {
        dispatch(clearHeroMessages());
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, error, dispatch]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResetImage = () => {
    setImageFile(null);
    setMentorImage("/data_knowlege/mentor/mentore_2.png");
    setImagePreview("/data_knowlege/mentor/mentore_2.png");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("headlinePrefix", headlinePrefix);
    formData.append("headlineHighlight", headlineHighlight);
    formData.append("description", description);
    formData.append("badgeText", badgeText);
    formData.append("primaryButtonText", primaryButtonText);
    formData.append("primaryButtonLink", primaryButtonLink);
    formData.append("showPrimaryButton", String(showPrimaryButton));
    formData.append("secondaryButtonText", secondaryButtonText);
    formData.append("secondaryButtonAction", secondaryButtonAction);
    formData.append("secondaryButtonLink", secondaryButtonLink);
    formData.append("showSecondaryButton", String(showSecondaryButton));
    formData.append("mentorImageAlt", mentorImageAlt);
    formData.append("isActive", String(isActive));

    if (imageFile) {
      formData.append("mentorImage", imageFile);
    } else {
      formData.append("mentorImage", mentorImage);
    }

    await dispatch(updateHeroSectionAdmin(formData));
  };

  return (
    <>
      <PageMeta
        title="Hero Section Management | Admin Dashboard"
        description="Manage dynamic landing page hero banner typography, buttons, and mentors."
      />
      <PageBreadcrumb pageTitle="Hero Section Configuration" />

      {/* Notifications */}
      {successMessage && (
        <div className="mb-6 flex items-center justify-between rounded-xl bg-green-50 p-4 border border-green-200 text-green-800 dark:bg-green-900/30 dark:border-green-800 dark:text-green-300 transition-all shadow-sm">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            <span className="font-medium text-sm">{successMessage}</span>
          </div>
          <button
            onClick={() => dispatch(clearHeroMessages())}
            className="text-green-600 hover:text-green-800 dark:text-green-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="mb-6 flex items-center justify-between rounded-xl bg-red-50 p-4 border border-red-200 text-red-800 dark:bg-red-900/30 dark:border-red-800 dark:text-red-300 transition-all shadow-sm">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            <span className="font-medium text-sm">{error}</span>
          </div>
          <button
            onClick={() => dispatch(clearHeroMessages())}
            className="text-red-600 hover:text-red-800 dark:text-red-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        {/* Left Column: Form Configuration (7 cols) */}
        <div className="xl:col-span-7 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/80 dark:border-gray-700/80 shadow-sm p-6 sm:p-8">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100 dark:border-gray-700">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#3498db]" />
                Hero Section Content
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Customize the main banner text, CTA buttons, and mentor visual.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[#3498db]"></div>
                <span className="ml-2 text-xs font-semibold text-gray-600 dark:text-gray-300">
                  {isActive ? "Active" : "Inactive"}
                </span>
              </label>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Optional Badge */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                Top Badge / Tagline (Optional)
              </label>
              <input
                type="text"
                value={badgeText}
                onChange={(e) => setBadgeText(e.target.value)}
                placeholder="e.g. Practical & Industry-Focused Training"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-[#3498db] focus:border-transparent transition-all"
              />
            </div>

            {/* Headline Group */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                  Headline Prefix (Plain Text) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={headlinePrefix}
                  onChange={(e) => setHeadlinePrefix(e.target.value)}
                  placeholder="Master Practical Data Analytics,"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-[#3498db] focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                  Headline Highlight (Gradient Text) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={headlineHighlight}
                  onChange={(e) => setHeadlineHighlight(e.target.value)}
                  placeholder="Data Science, ML & AI"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-[#3498db] focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                Description / Subtitle <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="At Data Knowledge, our mission is to provide..."
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-[#3498db] focus:border-transparent transition-all leading-relaxed"
              />
            </div>

            {/* Primary CTA Button Config */}
            <div className="p-4 rounded-xl border border-blue-100 dark:border-gray-700 bg-blue-50/30 dark:bg-gray-900/40 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
                  <ExternalLink className="w-3.5 h-3.5" /> Primary CTA Button
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showPrimaryButton}
                    onChange={(e) => setShowPrimaryButton(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-8 h-4 bg-gray-300 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-[#3498db]"></div>
                </label>
              </div>

              {showPrimaryButton && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1">
                      Button Text
                    </label>
                    <input
                      type="text"
                      value={primaryButtonText}
                      onChange={(e) => setPrimaryButtonText(e.target.value)}
                      placeholder="Explore Programs"
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:ring-1 focus:ring-[#3498db]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1">
                      Target URL / Route
                    </label>
                    <input
                      type="text"
                      value={primaryButtonLink}
                      onChange={(e) => setPrimaryButtonLink(e.target.value)}
                      placeholder="/courses"
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:ring-1 focus:ring-[#3498db]"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Secondary CTA Button Config */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-gray-700 bg-slate-50/50 dark:bg-gray-900/40 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-gray-300 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> Secondary CTA Button
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showSecondaryButton}
                    onChange={(e) => setShowSecondaryButton(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-8 h-4 bg-gray-300 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-slate-900 dark:peer-checked:bg-[#3498db]"></div>
                </label>
              </div>

              {showSecondaryButton && (
                <div className="space-y-3 pt-1">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1">
                        Button Text
                      </label>
                      <input
                        type="text"
                        value={secondaryButtonText}
                        onChange={(e) => setSecondaryButtonText(e.target.value)}
                        placeholder="Book Consultation"
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:ring-1 focus:ring-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1">
                        Action Type
                      </label>
                      <select
                        value={secondaryButtonAction}
                        onChange={(e) =>
                          setSecondaryButtonAction(e.target.value as "consultation_modal" | "custom_link")
                        }
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:ring-1 focus:ring-slate-900"
                      >
                        <option value="consultation_modal">Open Consultation Booking Modal</option>
                        <option value="custom_link">Navigate to Custom URL</option>
                      </select>
                    </div>
                  </div>

                  {secondaryButtonAction === "custom_link" && (
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1">
                        Custom Link URL
                      </label>
                      <input
                        type="text"
                        value={secondaryButtonLink}
                        onChange={(e) => setSecondaryButtonLink(e.target.value)}
                        placeholder="https://... or /contact"
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Mentor / Subject Image Upload */}
            <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/30 space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 flex items-center justify-between">
                <span>Mentor / Visual Image</span>
                {mentorImage && (
                  <button
                    type="button"
                    onClick={handleResetImage}
                    className="text-[11px] font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" /> Reset to Default
                  </button>
                )}
              </label>

              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="relative w-24 h-24 rounded-xl bg-slate-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center overflow-hidden shrink-0">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Hero Mentor Preview"
                      className="w-full h-full object-contain p-1"
                    />
                  ) : (
                    <ImageIcon className="w-8 h-8 text-gray-400" />
                  )}
                </div>

                <div className="flex-1 w-full space-y-2">
                  <input
                    type="file"
                    accept="image/*"
                    id="mentor-image-upload"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="mentor-image-upload"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 text-xs font-semibold cursor-pointer shadow-sm transition-all"
                  >
                    <Upload className="w-4 h-4 text-[#3498db]" />
                    Upload New Mentor Image
                  </label>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    PNG with transparent background recommended (e.g. 800x800px).
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1">
                  Image Alt Text
                </label>
                <input
                  type="text"
                  value={mentorImageAlt}
                  onChange={(e) => setMentorImageAlt(e.target.value)}
                  placeholder="Data Knowledge Mentors"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="submit"
                disabled={saving}
                className="bg-[#3498db] hover:bg-[#2980b9] text-white font-bold px-8 py-3 rounded-xl text-sm transition-all shadow-md shadow-[#3498db]/30 flex items-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed hover:scale-[1.01] active:scale-98"
              >
                {saving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Saving Changes...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Hero Section</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Live Real-Time Preview (5 cols) */}
        <div className="xl:col-span-5 sticky top-24 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-[#3498db]" /> Live Desktop Preview
            </span>
            <span className="text-[11px] text-gray-400">Updates dynamically</span>
          </div>

          <div className="relative rounded-2xl border border-gray-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-900 p-6 overflow-hidden shadow-lg">
            {/* Mesh Ambient Glow */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="absolute -top-10 -left-10 w-48 h-48 bg-[#3498db]/15 rounded-full blur-3xl" />
              <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-sky-200/40 rounded-full blur-3xl" />
            </div>

            <div className="relative z-10 flex flex-col space-y-4">
              {badgeText && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#3498db] text-[10px] font-bold w-fit">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#3498db] animate-pulse" />
                  <span>{badgeText}</span>
                </div>
              )}

              <h3 className="font-extrabold text-gray-900 dark:text-white text-xl leading-snug">
                {headlinePrefix || "Master Practical Data Analytics,"}{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#3498db] via-blue-600 to-[#1a5276]">
                  {headlineHighlight || "Data Science, ML & AI"}
                </span>
              </h3>

              <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed line-clamp-4">
                {description ||
                  "At Data Knowledge, our mission is to provide practical and industry-focused training..."}
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {showPrimaryButton && (
                  <span className="bg-[#3498db] text-white text-[10px] font-bold px-4 py-2 rounded-full uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                    {primaryButtonText || "Explore Programs"} &rarr;
                  </span>
                )}
                {showSecondaryButton && (
                  <span className="bg-slate-900 text-white text-[10px] font-bold px-4 py-2 rounded-full uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                    <Calendar className="w-3 h-3" />
                    {secondaryButtonText || "Book Consultation"}
                  </span>
                )}
              </div>

              {/* Mentor Image Preview */}
              <div className="pt-2 flex justify-center">
                <div className="relative">
                  <div className="absolute inset-0 bg-[#3498db]/20 rounded-full blur-xl pointer-events-none" />
                  <img
                    src={imagePreview || "/data_knowlege/mentor/mentore_2.png"}
                    alt={mentorImageAlt || "Mentor Preview"}
                    className="relative z-10 h-44 object-contain drop-shadow-xl"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default HeroSection;
