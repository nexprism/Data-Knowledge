import React, { useState } from "react";
import type { Resource, ResourcePayload, ResourceType } from "../../store/slices/resource";
import {
  FIELD_GROUPS_BY_TYPE,
  LANGUAGES,
  LEVELS,
  VISIBILITIES,
  splitTags,
  joinTags,
  type FieldGroup,
} from "./resourceFieldConfig";
import QuillEditor from "../../components/QuillEditor";

const IMAGE_BASE_URL = (import.meta.env.VITE_BASE_URL || "https://api.dataknowledge.in/").replace(/\/+$/, '') + '/';

export const resolveUrl = (url?: string): string => {
  if (!url) return "";
  return url.startsWith("http") ? url : `${IMAGE_BASE_URL}${url.replace(/^\/+/, "")}`;
};

const toDateInput = (value?: string): string => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const inputCls =
  "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500";
const labelCls = "block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1";

interface ResourceFormProps {
  initial?: Resource | null;
  submitLabel: string;
  submittingLabel: string;
  onSubmit: (payload: ResourcePayload) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  error?: string | null;
}

const ResourceForm: React.FC<ResourceFormProps> = ({
  initial,
  submitLabel,
  submittingLabel,
  onSubmit,
  onCancel,
  loading,
  error,
}) => {
  const [form, setForm] = useState(() => ({
    title: initial?.title || "",
    shortDescription: initial?.shortDescription || "",
    description: initial?.description || "",
    resourceType: (initial?.resourceType as ResourceType) || "",
    category: initial?.category || "",
    subCategory: initial?.subCategory || "",
    tags: joinTags(initial?.tags),
    language: initial?.language || "English",
    level: initial?.level || "Beginner",
    author: initial?.author || "",
    publisher: initial?.publisher || "",
    version: initial?.version || "1.0",
    publishedDate: toDateInput(initial?.publishedDate),
    lastReviewedDate: toDateInput(initial?.lastReviewedDate),
    estimatedReadTime: initial?.estimatedReadTime ? String(initial.estimatedReadTime) : "",
    pageCount: initial?.pageCount ? String(initial.pageCount) : "",
    seoTitle: initial?.seoTitle || "",
    seoDescription: initial?.seoDescription || "",
    seoKeywords: joinTags(initial?.seoKeywords),
    visibility: initial?.visibility || "PUBLIC",
    isFeatured: initial?.isFeatured ?? false,
    isTrending: initial?.isTrending ?? false,
    isRecommended: initial?.isRecommended ?? false,
    isDownloadable: initial?.isDownloadable ?? true,
    isPrintable: initial?.isPrintable ?? true,
    // SOP
    purpose: initial?.content?.purpose || "",
    scope: initial?.content?.scope || "",
    responsibilities: joinTags(initial?.content?.responsibilities),
    // Checklist
    checklistItems: initial?.content?.checklistItems
      ?.map((item) => ({ text: item.text, checked: item.checked, order: item.order }))
      || [{ text: "", checked: false, order: 0 }],
    // Format
    templateSections: initial?.content?.templateSections
      ?.map((s) => ({ label: s.label, placeholder: s.placeholder, order: s.order }))
      || [{ label: "", placeholder: "", order: 0 }],
    // Literature
    body: initial?.content?.body || "",
    references: joinTags(initial?.content?.references?.map((r) => r.text)),
    citations: joinTags(initial?.content?.citations),
  }));

  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [resourceFile, setResourceFile] = useState<File | null>(null);
  const [previewImages, setPreviewImages] = useState<File[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);

  const set = (field: string, value: string | boolean | number) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const setItem = (field: string, index: number, key: string, value: string | boolean | number) => {
    setForm((prev) => {
      const arr = [...((prev as any)[field] || [])];
      arr[index] = { ...arr[index], [key]: value };
      return { ...prev, [field]: arr };
    });
  };

  const addItem = (field: string) => {
    setForm((prev) => {
      const arr = [...(prev[field as keyof typeof prev] as any[])];
      arr.push(field === "checklistItems" ? { text: "", checked: false, order: arr.length } : { label: "", placeholder: "", order: arr.length });
      return { ...prev, [field]: arr };
    });
  };

  const removeItem = (field: string, index: number) => {
    setForm((prev) => {
      const arr = [...(prev[field as keyof typeof prev] as any[])];
      arr.splice(index, 1);
      arr.forEach((item: any, i: number) => (item.order = i));
      return { ...prev, [field]: arr };
    });
  };

  const groups: FieldGroup[] = form.resourceType
    ? FIELD_GROUPS_BY_TYPE[form.resourceType as ResourceType]
    : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return setValidationError("Title is required");
    if (!form.resourceType) return setValidationError("Resource type is required");
    if (!form.category.trim()) return setValidationError("Category is required");

    const payload: ResourcePayload = {
      title: form.title.trim(),
      shortDescription: form.shortDescription || undefined,
      description: form.description || undefined,
      resourceType: form.resourceType as ResourceType,
      category: form.category.trim(),
      subCategory: form.subCategory || undefined,
      tags: splitTags(form.tags),
      language: form.language || undefined,
      level: form.level || undefined,
      author: form.author || undefined,
      publisher: form.publisher || undefined,
      version: form.version || undefined,
      publishedDate: form.publishedDate || undefined,
      lastReviewedDate: form.lastReviewedDate || undefined,
      estimatedReadTime: form.estimatedReadTime ? Number(form.estimatedReadTime) : undefined,
      pageCount: form.pageCount ? Number(form.pageCount) : undefined,
      seoTitle: form.seoTitle || undefined,
      seoDescription: form.seoDescription || undefined,
      seoKeywords: splitTags(form.seoKeywords),
      visibility: form.visibility,
      isFeatured: form.isFeatured,
      isTrending: form.isTrending,
      isRecommended: form.isRecommended,
      isDownloadable: form.isDownloadable,
      isPrintable: form.isPrintable,
      thumbnail: thumbnail || undefined,
      resourceFile: resourceFile || undefined,
      previewImages: previewImages.length ? previewImages : undefined,
      // SOP
      purpose: form.purpose || undefined,
      scope: form.scope || undefined,
      responsibilities: splitTags(form.responsibilities),
      steps: (form as any).steps || undefined,
      revisionHistory: (form as any).revisionHistory || undefined,
      // Checklist
      checklistItems: (form as any).checklistItems || undefined,
      // Format
      templateSections: (form as any).templateSections || undefined,
      // Literature
      body: form.body || undefined,
      references: (form as any).references || undefined,
      citations: splitTags(form.citations),
    };
    setValidationError(null);
    await onSubmit(payload);
  };

  const showGroup = (group: FieldGroup) => groups.includes(group);

  const input = (
    name: string,
    label: string,
    opts: { type?: string; placeholder?: string; required?: boolean; maxLength?: number } = {}
  ) => (
    <div>
      <label className={labelCls}>{label}</label>
      <input
        type={opts.type || "text"}
        value={String((form as any)[name] || "")}
        onChange={(e) => set(name, e.target.value)}
        placeholder={opts.placeholder}
        required={opts.required}
        maxLength={opts.maxLength}
        className={inputCls}
      />
    </div>
  );

  const textarea = (name: string, label: string, rows = 4, placeholder = "") => (
    <div>
      <label className={labelCls}>{label}</label>
      <QuillEditor
        value={String((form as any)[name] || "")}
        onChange={(e) => set(name, e.target.value)}
        rows={rows}
        placeholder={placeholder}
        className={inputCls} />
    </div>
  );

  const select = (name: string, label: string, options: string[], required = false) => (
    <div>
      <label className={labelCls}>{label}</label>
      <select
        value={String((form as any)[name] || "")}
        onChange={(e) => set(name, e.target.value)}
        required={required}
        className={inputCls}
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  );

  const toggle = (name: string, label: string) => (
    <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
      <input
        type="checkbox"
        checked={Boolean((form as any)[name])}
        onChange={(e) => set(name, e.target.checked)}
        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
      />
      {label}
    </label>
  );

  const section = (title: string, children: React.ReactNode) => (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">{title}</h3>
      {children}
    </div>
  );

  const renderSOP = () => (
    <div className="space-y-4">
      <div>
        <label className={labelCls}>Purpose</label>
        <QuillEditor
          value={(form as any).purpose || ""}
          onChange={(val: string) => set("purpose", val)}
          placeholder="Describe the purpose of this SOP..."
          height="150px"
          toolbar="basic"
        />
      </div>
      <div>
        <label className={labelCls}>Scope</label>
        <QuillEditor
          value={(form as any).scope || ""}
          onChange={(val: string) => set("scope", val)}
          placeholder="Describe the scope of this SOP..."
          height="150px"
          toolbar="basic"
        />
      </div>
      {textarea("responsibilities", "Responsibilities (comma separated)")}
      {textarea("estimatedReadTime", "Estimated Read Time (minutes)", 3, "e.g. 15")}
      <div>
        <label className={labelCls}>Steps</label>
        {(form as any).steps?.map((step: any, i: number) => (
          <div key={i} className="flex gap-2 items-start mb-2">
            <input
              type="number"
              value={step.order}
              onChange={(e) => {
                const s = [...(form as any).steps];
                s[i].order = Number(e.target.value);
                setForm((prev) => ({ ...prev, steps: s }));
              }}
              className="w-16 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
              placeholder="#"
            />
            <input
              type="text"
              value={step.title}
              onChange={(e) => setItem("steps", i, "title", e.target.value)}
              placeholder={`Step ${i + 1} title`}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <QuillEditor
              value={step.description || ""}
              onChange={(val: string) => setItem("steps", i, "description", val)}
              placeholder="Description"
              height="100px"
              toolbar="basic"
            />
            <button
              type="button"
              onClick={() => removeItem("steps", i)}
              className="p-1 text-red-500 hover:text-red-700 text-sm self-center"
            >
              ✕
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => {
            setForm((prev) => ({
              ...prev,
               steps: [...(((prev as any).steps || [])), { title: "", description: "", order: (((prev as any).steps || [])).length }],
            }));
          }}
          className="text-sm text-blue-600 hover:underline"
        >
          + Add Step
        </button>
      </div>
      <div>
        <label className={labelCls}>Revision History (JSON array)</label>
        <QuillEditor
          value={JSON.stringify((form as any).revisionHistory || [], null, 2)}
          onChange={(e) => {
            try {
              const parsed = JSON.parse(e.target.value);
              setForm((prev) => ({ ...prev, revisionHistory: Array.isArray(parsed) ? parsed : [] }));
            } catch {
              /* ignore invalid JSON */
            }
          }}
          rows={4}
          placeholder='[{"version":"1.0","date":"2025-01-01","changes":"Initial release"}]'
          className={inputCls} />
      </div>
    </div>
  );

  const renderChecklist = () => (
    <div className="space-y-4">
      {textarea("estimatedReadTime", "Estimated Read Time (minutes)", 3, "e.g. 5")}
      <div>
        <label className={labelCls}>Checklist Items</label>
        {(form as any).checklistItems?.map((item: any, i: number) => (
          <div key={i} className="flex gap-2 items-center mb-2">
            <input
              type="number"
              value={item.order}
              onChange={(e) => setItem("checklistItems", i, "order", Number(e.target.value))}
              className="w-14 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
              placeholder="#"
            />
            <input
              type="text"
              value={item.text}
              onChange={(e) => setItem("checklistItems", i, "text", e.target.value)}
              placeholder={`Item ${i + 1}`}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <label className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
              <input
                type="checkbox"
                checked={item.checked}
                onChange={(e) => setItem("checklistItems", i, "checked", e.target.checked)}
                className="h-3 w-3"
              />
              Done
            </label>
            <button
              type="button"
              onClick={() => removeItem("checklistItems", i)}
              className="p-1 text-red-500 hover:text-red-700 text-sm"
            >
              ✕
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => {
            setForm((prev) => ({
              ...prev,
              checklistItems: [...(prev.checklistItems || []), { text: "", checked: false, order: (prev.checklistItems || []).length }],
            }));
          }}
          className="text-sm text-blue-600 hover:underline"
        >
          + Add Item
        </button>
      </div>
    </div>
  );

  const renderFormat = () => (
    <div className="space-y-4">
      {textarea("estimatedReadTime", "Estimated Read Time (minutes)", 3, "e.g. 10")}
      <div>
        <label className={labelCls}>Template Sections</label>
        {(form as any).templateSections?.map((sec: any, i: number) => (
          <div key={i} className="flex gap-2 items-center mb-2">
            <input
              type="number"
              value={sec.order}
              onChange={(e) => setItem("templateSections", i, "order", Number(e.target.value))}
              className="w-14 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
              placeholder="#"
            />
            <input
              type="text"
              value={sec.label}
              onChange={(e) => setItem("templateSections", i, "label", e.target.value)}
              placeholder={`Section ${i + 1} label`}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              value={sec.placeholder}
              onChange={(e) => setItem("templateSections", i, "placeholder", e.target.value)}
              placeholder="Placeholder text"
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={() => removeItem("templateSections", i)}
              className="p-1 text-red-500 hover:text-red-700 text-sm"
            >
              ✕
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => {
            setForm((prev) => ({
              ...prev,
              templateSections: [...(prev.templateSections || []), { label: "", placeholder: "", order: (prev.templateSections || []).length }],
            }));
          }}
          className="text-sm text-blue-600 hover:underline"
        >
          + Add Section
        </button>
      </div>
    </div>
  );

  const renderEbook = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {input("pageCount", "Page Count", { type: "number" })}
      {input("isbn", "ISBN")}
      {input("edition", "Edition")}
    </div>
  );

  const renderLiterature = () => (
    <div className="space-y-4">
      <div>
        <label className={labelCls}>Article Body</label>
        <QuillEditor
          value={(form as any).body || ""}
          onChange={(val: string) => set("body", val)}
          placeholder="Write the full article content here..."
          height="300px"
          toolbar="full"
        />
      </div>
      {textarea("references", "References (comma separated)")}
      {textarea("citations", "Citations (comma separated)")}
      {textarea("estimatedReadTime", "Estimated Read Time (minutes)", 3, "e.g. 12")}
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {(validationError || error) && (
        <div className="bg-red-50 dark:bg-red-900/50 border-l-4 border-red-500 p-4 rounded">
          <p className="text-red-700 dark:text-red-200">{validationError || error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {input("title", "Title *", { placeholder: "Enter resource title", required: true })}
        {select(
          "resourceType",
          "Resource Type *",
          ["", "SOP", "FORMAT", "CHECKLIST", "EBOOK", "LITERATURE"],
          true
        )}
        {input("category", "Category *", { placeholder: "e.g. Human Resources, IT" })}
        {input("subCategory", "Sub-Category", { placeholder: "e.g. Onboarding" })}
      </div>

      {showGroup("basics") && (
        <div className="space-y-4">
          {select("language", "Language", LANGUAGES)}
          {select("level", "Level", [...LEVELS])}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {input("shortDescription", "Short Description (max 300)", { maxLength: 300 })}
            {input("tags", "Tags (comma separated)", { placeholder: "onboarding, hr, sop" })}
          </div>
          {textarea("description", "Description", 4)}
        </div>
      )}

      {showGroup("content") && (
        <div>
          <label className={labelCls}>Content</label>
          <QuillEditor
            value={(form as any).body || ""}
            onChange={(e) => set("body", e.target.value)}
            rows={8}
            placeholder="Write the content here. For SOPs, checklists, and formats this is where the main content goes."
            className={inputCls} />
        </div>
      )}

      {form.resourceType === "SOP" && showGroup("content") && renderSOP()}
      {form.resourceType === "CHECKLIST" && showGroup("content") && renderChecklist()}
      {form.resourceType === "FORMAT" && showGroup("content") && renderFormat()}
      {form.resourceType === "EBOOK" && showGroup("bookDetails") && renderEbook()}
      {form.resourceType === "LITERATURE" && showGroup("content") && renderLiterature()}

      {showGroup("media") && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Media</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Thumbnail</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setThumbnail(e.target.files?.[0] || null)}
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border file:text-sm file:font-medium file:border-gray-300 file:text-gray-700 dark:file:text-gray-200 dark:file:border-gray-600 dark:file:bg-gray-700 hover:file:bg-gray-100 dark:hover:file:bg-gray-600"
              />
              {initial?.thumbnail?.url && !thumbnail && (
                <img src={resolveUrl(initial.thumbnail.url)} alt="Thumbnail" className="w-32 h-20 object-cover rounded-md border border-gray-300 dark:border-gray-600 mt-2" />
              )}
              {thumbnail && (
                <img src={URL.createObjectURL(thumbnail)} alt="New thumbnail" className="w-32 h-20 object-cover rounded-md border border-gray-300 dark:border-gray-600 mt-2" />
              )}
            </div>
            <div>
              <label className={labelCls}>Resource File</label>
              <input
                type="file"
                onChange={(e) => setResourceFile(e.target.files?.[0] || null)}
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border file:text-sm file:font-medium file:border-gray-300 file:text-gray-700 dark:file:text-gray-200 dark:file:border-gray-600 dark:file:bg-gray-700 hover:file:bg-gray-100 dark:hover:file:bg-gray-600"
              />
              {resourceFile ? (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">New file: {resourceFile.name}</p>
              ) : initial?.resourceFile?.originalName ? (
                <a href={resolveUrl(initial.resourceFile.url)} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline text-sm break-all mt-2 inline-block">
                  {initial.resourceFile.originalName}
                </a>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">No resource file uploaded.</p>
              )}
            </div>
          </div>
          <div>
            <label className={labelCls}>Preview Images (max 5)</label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => setPreviewImages(Array.from(e.target.files || []).slice(0, 5))}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border file:text-sm file:font-medium file:border-gray-300 file:text-gray-700 dark:file:text-gray-200 dark:file:border-gray-600 dark:file:bg-gray-700 hover:file:bg-gray-100 dark:hover:file:bg-gray-600"
            />
            {previewImages.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {previewImages.map((file, i) => (
                  <img key={i} src={URL.createObjectURL(file)} alt={`Preview ${i + 1}`} className="w-24 h-16 object-cover rounded-md border border-gray-300 dark:border-gray-600" />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {showGroup("seo") && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">SEO</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {input("seoTitle", "SEO Title")}
            {input("seoKeywords", "SEO Keywords (comma separated)")}
          </div>
          {textarea("seoDescription", "SEO Description", 3)}
        </div>
      )}

      {showGroup("flags") && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Settings</h3>
          {select("visibility", "Visibility", [...VISIBILITIES])}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {toggle("isFeatured", "Featured")}
            {toggle("isTrending", "Trending")}
            {toggle("isRecommended", "Recommended")}
            {toggle("isDownloadable", "Downloadable")}
            {toggle("isPrintable", "Printable")}
          </div>
        </div>
      )}

      <div className="flex justify-between pt-6 mt-6 border-t border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? submittingLabel : submitLabel}
        </button>
      </div>
    </form>
  );
};

export default ResourceForm;