const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_BASE_URL || "https://api.dataknowledge.in").replace(/\/$/, "");

export default class SimpleAudio {
  data: any;
  wrapper: HTMLDivElement | null;

  static get toolbox() {
    return {
      title: "Audio",
      icon: "<svg width='17' height='15'><path d='M0 0h17v15H0z'/></svg>",
    };
  }

  constructor({ data }: { data?: any }) {
    this.data = data || {};
    this.wrapper = null;
  }

  render() {
    this.wrapper = document.createElement("div");

    // FILE UPLOAD BUTTON
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "audio/*";
    fileInput.style.marginBottom = "8px";

    fileInput.addEventListener("change", async (e: Event) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      if (!file) return;

      const formData = new FormData();
      formData.append("audio", file);

      const res = await fetch(`${API_BASE_URL}/audios`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        this.data.url = data.url;
        this.data.name = data.filename || file.name;
        this._updateView();
      }
    });

    this.wrapper.appendChild(fileInput);

    // URL INPUT
    const urlInput = document.createElement("input");
    urlInput.type = "text";
    urlInput.placeholder = "Or paste audio URL here...";
    urlInput.style.marginBottom = "8px";
    urlInput.style.width = "100%";

    urlInput.addEventListener("change", (e: Event) => {
      const target = e.target as HTMLInputElement;
      const url = target.value;
      if (url) {
        this.data.url = url;
        this._updateView();
      }
    });

    this.wrapper.appendChild(urlInput);

    // Show audio if data.url exists
    if (this.data.url) this._updateView();

    return this.wrapper;
  }

  _updateView() {
    // Clear previous audio player
    const existingAudio = this.wrapper?.querySelector("audio");
    if (existingAudio) existingAudio.remove();

    if (!this.data.url) return;

    const audio = document.createElement("audio");
    audio.src = this.data.url;
    audio.controls = true;
    audio.style.width = "100%";
    audio.style.marginTop = "8px";
    this.wrapper?.appendChild(audio);
  }

  save() {
    return this.data;
  }
}

