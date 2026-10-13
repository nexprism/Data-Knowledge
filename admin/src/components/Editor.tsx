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
  const isInitializedRef = useRef(false);
  const holderRef = useRef<string>(holder);
  // Generate a stable unique ID for this editor instance
  const actualHolderId = useMemo(() => `${holder}-${Math.random().toString(36).substr(2, 9)}`, []);

  // Use a ref for onChange to avoid re-initializing editor when it changes
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    let isMounted = true;

    const initEditor = async () => {
      // Check if editor already exists for this holder
      const holderElement = document.getElementById(actualHolderId);
      
      // Prevent double initialization
      if (isInitializedRef.current || !isMounted) {
        return;
      }
      
      // Check if editor already exists in DOM
      if (holderElement) {
        const existingEditor = holderElement.querySelector('.codex-editor');
        if (existingEditor) {
          console.warn(`Editor already exists for holder: ${actualHolderId}`);
          return;
        }
      }

      // Mark as initializing to prevent concurrent initialization
      isInitializedRef.current = true;
      holderRef.current = holder;

      try {
        const editor = new EditorJS({
          holder: actualHolderId,
          data: data && typeof data === 'object' ? data : undefined,
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

        editorRef.current = editor;
      } catch (err) {
        console.error("Editor initialization error:", err);
        // Reset flag on error so it can retry
        if (isMounted) {
          isInitializedRef.current = false;
        }
      }
    };

    // Only initialize if holder matches and not already initialized
    if (holderRef.current === holder && !isInitializedRef.current) {
      initEditor();
    } else if (holderRef.current !== holder) {
      // Holder changed, reset and reinitialize
      isInitializedRef.current = false;
      holderRef.current = holder;
      initEditor();
    }

    return () => {
      isMounted = false;
      if (editorRef.current && typeof editorRef.current.destroy === 'function') {
        editorRef.current.isReady.then(() => {
          if (editorRef.current) {
            try {
              editorRef.current.destroy();
            } catch (e) {
              console.warn("Error destroying editor:", e);
            }
            editorRef.current = null;
          }
          isInitializedRef.current = false;
        }).catch(e => {
          console.warn("Editor cleanup error:", e);
          isInitializedRef.current = false;
        });
      } else {
        isInitializedRef.current = false;
      }
    };
  }, [holder]);

  return (
    <div className="editor-container" style={{ minHeight: '300px' }}>
      <div id={actualHolderId} className="prose max-w-none dark:prose-invert" />
    </div>
  );
};

export default Editor;


