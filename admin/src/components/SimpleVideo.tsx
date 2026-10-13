const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_BASE_URL || "https://api.dataknowledge.in"
).replace(/\/$/, "");

interface VideoData {
  url?: string;
  [key: string]: unknown;
}

export default class SimpleVideo {
  data: VideoData;
  wrapper: HTMLDivElement | null;
  input: HTMLInputElement | null;
  videoEl: HTMLVideoElement | null;
  previewBox: HTMLDivElement | null;
  uploadEndpoint: string;

  static get toolbox() {
    return {
      title: "Video",
      icon: "<svg width='17' height='15'><path d='M16 3l-6 4 6 4V3zM0 2h9v11H0V2z'/></svg>",
    };
  }

  constructor({ data, config }: { data?: Record<string, unknown>; config?: { uploadEndpoint?: string } }) {
    this.data = data || {};
    this.wrapper = null;
    this.input = null;
    this.videoEl = null;
    this.previewBox = null;
    // Use config uploadEndpoint if provided, otherwise default to /news/content-video
    this.uploadEndpoint = config?.uploadEndpoint || '/news/content-video';
  }

  render() {
    this.wrapper = document.createElement("div");
    this.wrapper.style.cssText = `
      border: 2px dashed #d1d5db;
      border-radius: 8px;
      padding: 16px;
      background: #f9fafb;
    `;

    // File input for video upload
    this.input = document.createElement("input");
    this.input.type = "file";
    this.input.accept = "video/*";
    this.input.style.cssText = `
      width: 100%;
      padding: 8px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      background: white;
      cursor: pointer;
      margin-bottom: 8px;
    `;

    // URL input for video (alternative method)
    const urlInput = document.createElement("input");
    urlInput.type = "text";
    urlInput.placeholder = "Or enter video URL (YouTube, Vimeo, or direct video link)";
    urlInput.style.cssText = `
      width: 100%;
      padding: 8px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      background: white;
      font-size: 14px;
    `;

    urlInput.addEventListener("input", () => {
      const url = urlInput.value.trim();
      if (url) {
        this.data = {
          ...this.data,
          url: url,
          name: url.split('/').pop()?.split('?')[0] || "Video"
        };
        this._updateView();
      }
    });

    urlInput.addEventListener("keypress", (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        urlInput.blur();
      }
    });

    // File upload handler - use /news/content-video endpoint
    this.input.addEventListener("change", async (e: Event) => {
      const target = e.target as HTMLInputElement | null;
      const file = target?.files?.[0];
      if (!file) return;

      // Show loading state
      this.wrapper!.style.borderColor = "#3b82f6";
      this.wrapper!.innerHTML = "<p style='text-align: center; color: #6b7280; padding: 20px;'>Uploading video...</p>";

      try {
        const formData = new FormData();
        formData.append("video", file);

        // Get auth tokens from localStorage
        const token = localStorage.getItem("accessToken") || localStorage.getItem("token");
        const refreshToken = localStorage.getItem("refreshToken");
        const headers: HeadersInit = {};
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
          headers["x-access-token"] = token;
        }
        if (refreshToken) {
          headers["x-refresh-token"] = refreshToken;
        }

        // Use the configured upload endpoint
        const endpoint = this.uploadEndpoint.startsWith('/') 
          ? this.uploadEndpoint 
          : `/${this.uploadEndpoint}`;
        
        const res = await fetch(`${API_BASE_URL}${endpoint}`, {
          method: "POST",
          headers: headers,
          body: formData,
          credentials: "include",
        });

        if (!res.ok) {
          const errorText = await res.text();
          let errorMessage = "Upload failed";
          try {
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.message || errorMessage;
          } catch {
            // If response is HTML (error page), extract message
            if (errorText.includes("Cannot POST")) {
              errorMessage = "Video upload endpoint not available. Please use a video URL instead.";
            } else {
              errorMessage = errorText.substring(0, 100) || "Upload failed";
            }
          }
          throw new Error(errorMessage);
        }

        const data = await res.json();
        console.log("Upload response:", data);
        
        if (data.success && data.data) {
          // Get video URL from response
          const videoUrl = data.data.url || data.data.path || "";
          
          if (!videoUrl) {
            console.warn("Upload succeeded but no URL returned");
            this.wrapper!.innerHTML = "<p style='color: #dc2626; text-align: center;'>Upload failed: No URL returned</p>";
            return;
          }

          // Create new data object
          const newData: VideoData = {
            name: data.data.filename || file.name,
            url: videoUrl
          };
          
          // Replace the entire data object
          this.data = newData;
          
          console.log("Video URL saved:", this.data.url);
          
          // Clear wrapper and show preview
          this.wrapper!.innerHTML = "";
          this.wrapper!.appendChild(this.input);
          this.wrapper!.appendChild(urlInput);
          this._updateView();
        } else {
          this.wrapper!.innerHTML = "<p style='color: #dc2626; text-align: center;'>Upload failed: " + (data.message || "Unknown error") + "</p>";
          // Re-add inputs
          this.wrapper!.appendChild(this.input);
          this.wrapper!.appendChild(urlInput);
        }
      } catch (error) {
        console.error("Video upload error:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        this.wrapper!.innerHTML = `
          <p style='color: #dc2626; text-align: center; margin-bottom: 8px;'>Upload error: ${errorMessage}</p>
          <p style='color: #6b7280; text-align: center; font-size: 12px;'>You can also paste a video URL instead</p>
        `;
        // Re-add inputs
        this.wrapper!.appendChild(this.input);
        this.wrapper!.appendChild(urlInput);
      }
    });

    // Add helper text
    const helperText = document.createElement("p");
    helperText.textContent = "💡 Upload a video file or paste a video URL (YouTube, Vimeo, etc.)";
    helperText.style.cssText = `
      margin-top: 8px;
      font-size: 12px;
      color: #6b7280;
      text-align: center;
    `;

    this.wrapper.appendChild(this.input);
    this.wrapper.appendChild(urlInput);
    this.wrapper.appendChild(helperText);

    // Set URL input value if data exists
    if (this.data.url) {
      urlInput.value = this.data.url;
      this._updateView();
    }

    return this.wrapper;
  }

  _getAbsoluteUrl(url: string | undefined): string {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("blob:")) {
      return url;
    }
    // If it's a relative path starting with /, prepend API_BASE_URL
    return url.startsWith("/") ? `${API_BASE_URL}${url}` : `${API_BASE_URL}/${url}`;
  }

  _updateView() {
    // Remove previous preview box if exists
    if (this.previewBox) {
      this.previewBox.remove();
      this.previewBox = null;
    }

    if (this.data.url) {
      // Create preview box
      this.previewBox = document.createElement("div");
      this.previewBox.style.cssText = `
        margin-top: 12px;
        padding: 12px;
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
      `;

      // Video element
      this.videoEl = document.createElement("video");
      this.videoEl.src = this._getAbsoluteUrl(this.data.url);
      this.videoEl.controls = true;
      this.videoEl.style.cssText = `
        width: 100%;
        border-radius: 6px;
        background: #000;
        display: block;
      `;

      // Video info
      const infoText = document.createElement("p");
      infoText.textContent = this.data.name ? `📹 ${this.data.name}` : "📹 Video uploaded";
      infoText.style.cssText = `
        margin: 8px 0 0 0;
        font-size: 13px;
        color: #059669;
        font-weight: 500;
      `;

      this.previewBox.appendChild(this.videoEl);
      this.previewBox.appendChild(infoText);
      this.wrapper?.appendChild(this.previewBox);

      // Update wrapper styling to show success
      this.wrapper!.style.borderColor = "#10b981";
      this.wrapper!.style.background = "#f0fdf4";
    }
  }

  save() {
    // Return saved data; ensure url returned is the normalized full URL so editor can embed it.
    console.log("Saving video data:", this.data);
    return {
      url:
        typeof this.data.url === "string"
          ? this.data.url
          : this.data.url
          ? String(this.data.url)
          : "",
      // keep any other properties if present
      ...this.data,
    };
  }
}

