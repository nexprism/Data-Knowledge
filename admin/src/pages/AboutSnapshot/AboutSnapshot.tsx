import React, { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../hooks/redux";
import {
  fetchAboutSnapshotAdmin,
  updateAboutSnapshotAdmin,
  clearAboutSnapshotMessages,
  AboutSnapshotData,
} from "../../store/slices/aboutSnapshot";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import {
  Save,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  X,
  Plus,
  Trash2,
} from "lucide-react";

const ICON_OPTIONS = [
  "activity",
  "trending",
  "users",
  "monitor",
  "globe",
  "star",
  "bars",
  "dashboard",
  "python",
  "excel",
  "ai",
];

const inputCls =
  "w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 text-sm";
const labelCls = "block text-sm font-semibold mb-1";

interface TextFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  textarea?: boolean;
  rows?: number;
  placeholder?: string;
}

const TextField: React.FC<TextFieldProps> = ({
  label,
  value,
  onChange,
  textarea,
  rows = 3,
  placeholder,
}) => (
  <div>
    <label className={labelCls}>{label}</label>
    {textarea ? (
      <textarea
        value={value}
        rows={rows}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={inputCls}
      />
    ) : (
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={inputCls}
      />
    )}
  </div>
);

const SectionHeader: React.FC<{
  title: string;
  onAdd?: () => void;
  addLabel?: string;
}> = ({ title, onAdd, addLabel = "Add" }) => (
  <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-700">
    <h2 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h2>
    {onAdd && (
      <button
        type="button"
        onClick={onAdd}
        className="flex items-center gap-2 bg-blue-100 text-blue-700 hover:bg-blue-200 px-3 py-1.5 rounded-lg text-xs font-bold transition"
      >
        <Plus className="w-4 h-4" /> {addLabel}
      </button>
    )}
  </div>
);

const IconSelect: React.FC<{ value: string; onChange: (value: string) => void }> = ({
  value,
  onChange,
}) => (
  <select value={value} onChange={(e) => onChange(e.target.value)} className={inputCls}>
    {ICON_OPTIONS.map((icon) => (
      <option key={icon} value={icon}>
        {icon}
      </option>
    ))}
  </select>
);

const RemoveButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="text-red-500 hover:text-red-700 transition p-2 bg-red-50 rounded-lg hover:bg-red-100 shrink-0"
    title="Remove"
  >
    <Trash2 className="w-4 h-4" />
  </button>
);

const AboutSnapshot: React.FC = () => {
  const dispatch = useAppDispatch();
  const { aboutSnapshot, loading, saving, error, successMessage } = useAppSelector(
    (state) => state.aboutSnapshot
  );

  const [formData, setFormData] = useState<AboutSnapshotData | null>(null);

  useEffect(() => {
    dispatch(fetchAboutSnapshotAdmin());
  }, [dispatch]);

  useEffect(() => {
    if (aboutSnapshot) {
      setFormData(JSON.parse(JSON.stringify(aboutSnapshot)));
    }
  }, [aboutSnapshot]);

  useEffect(() => {
    if (successMessage || error) {
      const timer = setTimeout(() => {
        dispatch(clearAboutSnapshotMessages());
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, error, dispatch]);

  if (loading && !formData) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  if (!formData) {
    return null;
  }

  const handleInputChange = (field: keyof AboutSnapshotData, value: any) => {
    setFormData((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const handleBulletChange = (index: number, value: string) => {
    setFormData((prev) => {
      if (!prev) return prev;
      const newBullets = [...prev.bulletPoints];
      newBullets[index] = value;
      return { ...prev, bulletPoints: newBullets };
    });
  };

  const addBullet = () => {
    setFormData((prev) =>
      prev ? { ...prev, bulletPoints: [...prev.bulletPoints, "New point..."] } : prev
    );
  };

  const removeBullet = (index: number) => {
    setFormData((prev) =>
      prev
        ? { ...prev, bulletPoints: prev.bulletPoints.filter((_, i) => i !== index) }
        : prev
    );
  };

  // ---- About Us page helpers ----
  const updateNested = (section: string, field: string, value: any) => {
    setFormData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        aboutUs: {
          ...prev.aboutUs,
          [section]: { ...(prev.aboutUs as any)[section], [field]: value },
        },
      };
    });
  };

  const updateList = (section: string, listKey: string, updater: (arr: any[]) => any[]) => {
    setFormData((prev) => {
      if (!prev) return prev;
      const aboutUs: any = JSON.parse(JSON.stringify(prev.aboutUs));
      aboutUs[section][listKey] = updater(aboutUs[section][listKey] || []);
      return { ...prev, aboutUs };
    });
  };

  const updateListItem = (
    section: string,
    listKey: string,
    index: number,
    field: string,
    value: any
  ) => {
    updateList(section, listKey, (arr) => {
      const next = [...arr];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const updateStringItem = (section: string, listKey: string, index: number, value: string) => {
    updateList(section, listKey, (arr) => {
      const next = [...arr];
      next[index] = value;
      return next;
    });
  };

  const addItem = (section: string, listKey: string, item: any) =>
    updateList(section, listKey, (arr) => [...arr, item]);

  const removeItem = (section: string, listKey: string, index: number) =>
    updateList(section, listKey, (arr) => arr.filter((_, i) => i !== index));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData) {
      await dispatch(updateAboutSnapshotAdmin(formData));
    }
  };

  const aboutUs = formData.aboutUs;

  return (
    <>
      <PageMeta
        title="About Us Page | Admin Dashboard"
        description="Manage the About Us page and About Data Knowledge section content."
      />
      <PageBreadcrumb pageTitle="About Us Page Configuration" />

      {successMessage && (
        <div className="mb-6 flex items-center justify-between rounded-xl bg-green-50 p-4 border border-green-200 text-green-800 transition-all shadow-sm">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="font-medium text-sm">{successMessage}</span>
          </div>
          <button onClick={() => dispatch(clearAboutSnapshotMessages())} className="text-green-600 hover:text-green-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="mb-6 flex items-center justify-between rounded-xl bg-red-50 p-4 border border-red-200 text-red-800 transition-all shadow-sm">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="font-medium text-sm">{error}</span>
          </div>
          <button onClick={() => dispatch(clearAboutSnapshotMessages())} className="text-red-600 hover:text-red-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* ---------------- HOME SNAPSHOT ---------------- */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/80 dark:border-gray-700/80 shadow-sm p-6 sm:p-8 space-y-8">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Home Page Snapshot &amp; Visibility
              </h2>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => handleInputChange("isActive", e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                <span className="ml-2 text-xs font-semibold text-gray-600 dark:text-gray-300">
                  {formData.isActive ? "Section Visible" : "Section Hidden"}
                </span>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <TextField label="Badge Text" value={formData.badgeText} onChange={(v) => handleInputChange("badgeText", v)} />
              <TextField label="Image URL" value={formData.image} onChange={(v) => handleInputChange("image", v)} />
              <TextField label="Headline Prefix" value={formData.headlinePrefix} onChange={(v) => handleInputChange("headlinePrefix", v)} />
              <TextField label="Headline Highlight (Blue Text)" value={formData.headlineHighlight} onChange={(v) => handleInputChange("headlineHighlight", v)} />
              <div className="md:col-span-2">
                <TextField label="Paragraph 1" textarea value={formData.paragraph1} onChange={(v) => handleInputChange("paragraph1", v)} />
              </div>
              <div className="md:col-span-2">
                <TextField label="Paragraph 2" textarea value={formData.paragraph2} onChange={(v) => handleInputChange("paragraph2", v)} />
              </div>
            </div>

            <SectionHeader title="Bullet Points" onAdd={addBullet} addLabel="Add Bullet" />
            <div className="space-y-3">
              {formData.bulletPoints.map((bullet, index) => (
                <div key={index} className="flex gap-3 items-center">
                  <input
                    type="text"
                    value={bullet}
                    onChange={(e) => handleBulletChange(index, e.target.value)}
                    className={`flex-1 ${inputCls}`}
                  />
                  <RemoveButton onClick={() => removeBullet(index)} />
                </div>
              ))}
            </div>

            <div className="pb-1 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Buttons Settings</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4 p-4 border rounded-xl bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold">Primary Button</h3>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.showPrimaryButton}
                      onChange={(e) => handleInputChange("showPrimaryButton", e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                <TextField label="Text" value={formData.primaryButtonText} onChange={(v) => handleInputChange("primaryButtonText", v)} />
                <TextField label="Link" value={formData.primaryButtonLink} onChange={(v) => handleInputChange("primaryButtonLink", v)} />
              </div>

              <div className="space-y-4 p-4 border rounded-xl bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold">Secondary Button</h3>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.showSecondaryButton}
                      onChange={(e) => handleInputChange("showSecondaryButton", e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                <TextField label="Text" value={formData.secondaryButtonText} onChange={(v) => handleInputChange("secondaryButtonText", v)} />
                <TextField label="Link" value={formData.secondaryButtonLink} onChange={(v) => handleInputChange("secondaryButtonLink", v)} />
              </div>
            </div>
          </div>

          {/* ---------------- ABOUT US PAGE ---------------- */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-blue-200 dark:border-gray-700 shadow-sm p-6 sm:p-8 space-y-8">
            <div className="pb-4 border-b-2 border-blue-100 dark:border-gray-700">
              <h1 className="text-2xl font-black text-gray-900 dark:text-white">
                About Us Page Content
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Manage every section shown on the /about-us page.
              </p>
            </div>

            {/* HERO */}
            <div className="space-y-5">
              <SectionHeader
                title="1. Hero Section"
                onAdd={() => addItem("hero", "stats", { value: "", label: "" })}
                addLabel="Add Stat"
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <TextField label="Badge Text" value={aboutUs.hero.badgeText} onChange={(v) => updateNested("hero", "badgeText", v)} />
                <TextField label="Title Line 1" value={aboutUs.hero.titleLine1} onChange={(v) => updateNested("hero", "titleLine1", v)} />
                <TextField label="Title Line 2 (Gradient)" value={aboutUs.hero.titleLine2} onChange={(v) => updateNested("hero", "titleLine2", v)} />
              </div>
              <TextField label="Description" textarea value={aboutUs.hero.description} onChange={(v) => updateNested("hero", "description", v)} />
              <div className="space-y-3">
                <label className={labelCls}>Highlight / Stat Cards</label>
                {aboutUs.hero.stats.map((stat, index) => (
                  <div key={index} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-3 items-center">
                    <input type="text" value={stat.value} placeholder="Value" onChange={(e) => updateListItem("hero", "stats", index, "value", e.target.value)} className={inputCls} />
                    <input type="text" value={stat.label} placeholder="Label" onChange={(e) => updateListItem("hero", "stats", index, "label", e.target.value)} className={inputCls} />
                    <RemoveButton onClick={() => removeItem("hero", "stats", index)} />
                  </div>
                ))}
              </div>
            </div>

            {/* PHILOSOPHY */}
            <div className="space-y-5 pt-4 border-t border-gray-100 dark:border-gray-700">
              <SectionHeader title="2. Core Philosophy / Overview" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <TextField label="Badge Text" value={aboutUs.philosophy.badgeText} onChange={(v) => updateNested("philosophy", "badgeText", v)} />
                <TextField label="Heading Prefix" value={aboutUs.philosophy.headingPrefix} onChange={(v) => updateNested("philosophy", "headingPrefix", v)} />
                <TextField label="Heading Highlight 1" value={aboutUs.philosophy.headingHighlightOne} onChange={(v) => updateNested("philosophy", "headingHighlightOne", v)} />
                <TextField label="Heading Connector (e.g. 'and')" value={aboutUs.philosophy.headingConnector} onChange={(v) => updateNested("philosophy", "headingConnector", v)} />
                <TextField label="Heading Highlight 2" value={aboutUs.philosophy.headingHighlightTwo} onChange={(v) => updateNested("philosophy", "headingHighlightTwo", v)} />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className={labelCls}>Paragraphs</label>
                  <button
                    type="button"
                    onClick={() => addItem("philosophy", "paragraphs", "")}
                    className="flex items-center gap-1.5 text-blue-700 text-xs font-bold"
                  >
                    <Plus className="w-4 h-4" /> Add Paragraph
                  </button>
                </div>
                {aboutUs.philosophy.paragraphs.map((paragraph, index) => (
                  <div key={index} className="flex gap-3 items-start">
                    <textarea
                      rows={2}
                      value={paragraph}
                      onChange={(e) => updateStringItem("philosophy", "paragraphs", index, e.target.value)}
                      className={`flex-1 ${inputCls}`}
                    />
                    <RemoveButton onClick={() => removeItem("philosophy", "paragraphs", index)} />
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <TextField label="Card Title" value={aboutUs.philosophy.cardTitle} onChange={(v) => updateNested("philosophy", "cardTitle", v)} />
                <TextField label="Card Subtitle" value={aboutUs.philosophy.cardSubtitle} onChange={(v) => updateNested("philosophy", "cardSubtitle", v)} />
                <TextField label="Card Image URL" value={aboutUs.philosophy.cardImage} onChange={(v) => updateNested("philosophy", "cardImage", v)} />
                <TextField label="Card Image Alt" value={aboutUs.philosophy.cardImageAlt} onChange={(v) => updateNested("philosophy", "cardImageAlt", v)} />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className={labelCls}>Value Badges (right card)</label>
                  <button
                    type="button"
                    onClick={() => addItem("philosophy", "valueBadges", { title: "", description: "" })}
                    className="flex items-center gap-1.5 text-blue-700 text-xs font-bold"
                  >
                    <Plus className="w-4 h-4" /> Add Badge
                  </button>
                </div>
                {aboutUs.philosophy.valueBadges.map((badge, index) => (
                  <div key={index} className="grid grid-cols-1 sm:grid-cols-[1fr_1.4fr_auto] gap-3 items-center">
                    <input type="text" value={badge.title} placeholder="Title" onChange={(e) => updateListItem("philosophy", "valueBadges", index, "title", e.target.value)} className={inputCls} />
                    <input type="text" value={badge.description} placeholder="Description" onChange={(e) => updateListItem("philosophy", "valueBadges", index, "description", e.target.value)} className={inputCls} />
                    <RemoveButton onClick={() => removeItem("philosophy", "valueBadges", index)} />
                  </div>
                ))}
              </div>
            </div>

            {/* VISION */}
            <div className="space-y-5 pt-4 border-t border-gray-100 dark:border-gray-700">
              <SectionHeader title="3. Vision &amp; Mission" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <TextField label="Badge Text" value={aboutUs.vision.badgeText} onChange={(v) => updateNested("vision", "badgeText", v)} />
                <TextField label="Heading" value={aboutUs.vision.heading} onChange={(v) => updateNested("vision", "heading", v)} />
              </div>
              <TextField label="Quote" textarea rows={4} value={aboutUs.vision.quote} onChange={(v) => updateNested("vision", "quote", v)} />
            </div>

            {/* PILLARS */}
            <div className="space-y-5 pt-4 border-t border-gray-100 dark:border-gray-700">
              <SectionHeader
                title="4. Mission &amp; Strategic Pillars"
                onAdd={() => addItem("pillars", "items", { icon: "trending", badge: "", title: "", description: "" })}
                addLabel="Add Pillar"
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <TextField label="Badge Text" value={aboutUs.pillars.badgeText} onChange={(v) => updateNested("pillars", "badgeText", v)} />
                <TextField label="Heading" value={aboutUs.pillars.heading} onChange={(v) => updateNested("pillars", "heading", v)} />
              </div>
              <TextField label="Description" textarea value={aboutUs.pillars.description} onChange={(v) => updateNested("pillars", "description", v)} />
              <div className="space-y-4">
                {aboutUs.pillars.items.map((pillar, index) => (
                  <div key={index} className="p-4 rounded-xl border bg-gray-50 dark:bg-gray-900 dark:border-gray-700 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-400">Pillar #{index + 1}</span>
                      <RemoveButton onClick={() => removeItem("pillars", "items", index)} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className={labelCls}>Icon</label>
                        <IconSelect value={pillar.icon} onChange={(v) => updateListItem("pillars", "items", index, "icon", v)} />
                      </div>
                      <TextField label="Badge" value={pillar.badge} onChange={(v) => updateListItem("pillars", "items", index, "badge", v)} />
                      <TextField label="Title" value={pillar.title} onChange={(v) => updateListItem("pillars", "items", index, "title", v)} />
                    </div>
                    <TextField label="Description" textarea rows={2} value={pillar.description} onChange={(v) => updateListItem("pillars", "items", index, "description", v)} />
                  </div>
                ))}
              </div>
            </div>

            {/* TOOLS */}
            <div className="space-y-5 pt-4 border-t border-gray-100 dark:border-gray-700">
              <SectionHeader
                title="5. Tools &amp; Technologies"
                onAdd={() => addItem("tools", "items", { icon: "activity", title: "", description: "" })}
                addLabel="Add Tool"
              />
              <TextField label="Heading" value={aboutUs.tools.heading} onChange={(v) => updateNested("tools", "heading", v)} />
              <TextField label="Description" textarea value={aboutUs.tools.description} onChange={(v) => updateNested("tools", "description", v)} />
              <div className="space-y-4">
                {aboutUs.tools.items.map((tool, index) => (
                  <div key={index} className="p-4 rounded-xl border bg-gray-50 dark:bg-gray-900 dark:border-gray-700 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-400">Tool #{index + 1}</span>
                      <RemoveButton onClick={() => removeItem("tools", "items", index)} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className={labelCls}>Icon</label>
                        <IconSelect value={tool.icon} onChange={(v) => updateListItem("tools", "items", index, "icon", v)} />
                      </div>
                      <div className="md:col-span-2">
                        <TextField label="Title" value={tool.title} onChange={(v) => updateListItem("tools", "items", index, "title", v)} />
                      </div>
                    </div>
                    <TextField label="Description" textarea rows={2} value={tool.description} onChange={(v) => updateListItem("tools", "items", index, "description", v)} />
                  </div>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div className="space-y-5 pt-4 border-t border-gray-100 dark:border-gray-700">
              <SectionHeader title="6. Call To Action" />
              <TextField label="Heading" value={aboutUs.cta.heading} onChange={(v) => updateNested("cta", "heading", v)} />
              <TextField label="Description" textarea value={aboutUs.cta.description} onChange={(v) => updateNested("cta", "description", v)} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <TextField label="Primary Button Text" value={aboutUs.cta.primaryButtonText} onChange={(v) => updateNested("cta", "primaryButtonText", v)} />
                <TextField label="Primary Button Link" value={aboutUs.cta.primaryButtonLink} onChange={(v) => updateNested("cta", "primaryButtonLink", v)} />
                <TextField label="Secondary Button Text" value={aboutUs.cta.secondaryButtonText} onChange={(v) => updateNested("cta", "secondaryButtonText", v)} />
                <TextField label="Secondary Button Link" value={aboutUs.cta.secondaryButtonLink} onChange={(v) => updateNested("cta", "secondaryButtonLink", v)} />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-3 rounded-xl transition flex items-center gap-2 shadow-md disabled:opacity-70"
            >
              {saving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" /> Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default AboutSnapshot;
