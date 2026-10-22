import React, { useEffect, useRef, useMemo } from "react";
// Editor.js and its tools often have ESM/CJS compatibility issues
import _EditorJS from "@editorjs/editorjs";
import _Header from "@editorjs/header";
import _ImageTool from "@editorjs/image";
import _List from "@editorjs/list";
import _Quote from "@editorjs/quote";
import _Marker from "@editorjs/marker";
import _InlineCode from "@editorjs/inline-code";
import _Checklist from "@editorjs/checklist";
import _Embed from "@editorjs/embed";
import _Table from "@editorjs/table";
import _LinkTool from "@editorjs/link";
import _RawTool from "@editorjs/raw";
import _CodeTool from "@editorjs/code";
import _Delimiter from "@editorjs/delimiter";
import _Underline from "@editorjs/underline";

// Helper to get the actual class from the module
const getTool = (module: any) => (module && module.default) ? module.default : module;

const EditorJS = getTool(_EditorJS);
const Header = getTool(_Header);
const ImageTool = getTool(_ImageTool);
const List = getTool(_List);
const Quote = getTool(_Quote);
const Marker = getTool(_Marker);
const InlineCode = getTool(_InlineCode);
const Checklist = getTool(_Checklist);
const Embed = getTool(_Embed);
const Table = getTool(_Table);
const LinkTool = getTool(_LinkTool);
const RawTool = getTool(_RawTool);
const CodeTool = getTool(_CodeTool);
const Delimiter = getTool(_Delimiter);
const Underline = getTool(_Underline);

const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_BASE_URL || "https://api.dataknowledge.in").replace(/\/$/, "");

import ComparisonTool from "./ComparisonTool";
import SimpleVideo from "./SimpleVideo";
import SimpleAudio from "./SimpleAudio";
import TwitterEmbed from "./TwitterEmbed";
import YoutubeEmbed from "./YoutubeEmbed";
import FacebookEmbed from "./FacebookEmbed";

interface EditorProps {
  data?: any;
  onChange?: (data: any) => void;
  holder?: string;
  uploadEndpoint?: string; // Custom upload endpoint (default: /images for news)
}

const Editor: React.FC<EditorProps> = ({
  data,
  onChange,
  holder = "editorjs",
  uploadEndpoint = "/images",
}) => {
  const editorRef = useRef<EditorJS | null>(null);
  const onChangeRef = useRef(onChange);
  const dataRef = useRef(data);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Generate a stable unique ID for this editor instance based on holder
  const actualHolderId = useMemo(() => `${holder}-${Math.random().toString(36).substr(2, 9)}`, [holder]);

  useEffect(() => {
    let isMounted = true;
    let editorInstance: EditorJS | null = null;

    const initEditor = async () => {
      // 1. Give React StrictMode or DOM mounting a tick to settle
      await new Promise((resolve) => setTimeout(resolve, 50));
      if (!isMounted) return;

      const holderElement = document.getElementById(actualHolderId);
      if (!holderElement) return;

      // 2. Clean out any previous editor DOM nodes to ensure NO duplicate editors can exist
      holderElement.innerHTML = "";

      // 3. Destroy previous editor instance if it existed
      if (editorRef.current) {
        try {
          if (typeof editorRef.current.destroy === 'function') {
            await editorRef.current.isReady;
            editorRef.current.destroy();
          }
        } catch (_) {}
        editorRef.current = null;
      }

      if (!isMounted) return;

      try {
        const editor = new EditorJS({
          holder: actualHolderId,
          data: dataRef.current && typeof dataRef.current === 'object' ? dataRef.current : undefined,
          onReady: () => {
            if (isMounted) {
              // Editor is ready
            }
          },
          onChange: async (api) => {
            const savedData = await api.saver.save();
            if (onChangeRef.current) {
              onChangeRef.current(savedData);
            }
          },
          tools: {
            header: Header,
            list: List,
            checklist: Checklist,
            embed: Embed,
            table: Table,
            link: LinkTool,
            raw: RawTool,
            image: {
              class: ImageTool,
              config: {
                uploader: {
                  async uploadByFile(file: File) {
                    const formData = new FormData();
                    formData.append("image", file);
                    const token = localStorage.getItem("accessToken");
                    const refreshToken = localStorage.getItem("refreshToken");
                    
                    const headers: HeadersInit = {};
                    if (token) {
                      headers["Authorization"] = `Bearer ${token}`;
                      headers["x-access-token"] = token;
                    }
                    if (refreshToken) {
                      headers["x-refresh-token"] = refreshToken;
                    }
                    
                    const res = await fetch(`${API_BASE_URL}${uploadEndpoint}`, {
                      method: "POST",
                      headers: headers,
                      body: formData,
                      credentials: "include",
                    });
                    
                    if (!res.ok) {
                      const errorData = await res.json().catch(() => ({}));
                      console.error("Image upload failed:", errorData);
                      return { success: 0 };
                    }
                    
                    const responseData = await res.json();
                    if (responseData.success === 1 && responseData.file?.url) {
                      // Handle relative URLs by prepending API base URL if needed
                      let imageUrl = responseData.file.url;
                      if (imageUrl.startsWith('/') && !imageUrl.startsWith('//')) {
                        // Relative path - prepend API base URL
                        imageUrl = `${API_BASE_URL}${imageUrl}`;
                      }
                      return {
                        success: 1,
                        file: { url: imageUrl }
                      };
                    }
                    return { success: 0 };
                  },
                },
              },
            },
            quote: Quote,
            marker: Marker,
            inlineCode: InlineCode,
            code: CodeTool,
            delimiter: Delimiter,
            underline: Underline,
            // Custom tools
            comparison: ComparisonTool,
            video: {
              class: SimpleVideo,
              config: {
                uploadEndpoint: uploadEndpoint === '/images' ? '/news/content-video' : '/courses/videos',
              },
            },
            audio: SimpleAudio,
            twitter: TwitterEmbed,
            youtube: YoutubeEmbed,
            facebook: FacebookEmbed,
          },
        });

        editorInstance = editor;
        editorRef.current = editor;

        await editor.isReady;

        // If component unmounted while isReady was resolving, destroy it immediately
        if (!isMounted) {
          try {
            editor.destroy();
          } catch (_) {}
          editorRef.current = null;
          editorInstance = null;
          if (holderElement) holderElement.innerHTML = "";
        }
      } catch (err) {
        console.error("Editor initialization error:", err);
      }
    };

    initEditor();

    return () => {
      isMounted = false;
      const inst = editorInstance || editorRef.current;
      if (inst && typeof inst.destroy === 'function') {
        inst.isReady.then(() => {
          try {
            inst.destroy();
          } catch (_) {}
          const holderEl = document.getElementById(actualHolderId);
          if (holderEl) holderEl.innerHTML = "";
        }).catch(() => {
          const holderEl = document.getElementById(actualHolderId);
          if (holderEl) holderEl.innerHTML = "";
        });
      }
      editorRef.current = null;
      editorInstance = null;
    };
  }, [actualHolderId, uploadEndpoint]);

  return (
    <div className="editor-container" style={{ minHeight: '300px' }}>
      <div id={actualHolderId} className="prose max-w-none dark:prose-invert" />
    </div>
  );
};

export default Editor;


