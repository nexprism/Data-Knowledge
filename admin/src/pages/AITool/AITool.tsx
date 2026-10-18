import React, { useState, useEffect, useRef } from 'react';
import { Bot, Settings, BookOpen, Send, X, Plus, Trash2, Upload, FileText, Link as LinkIcon } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import axiosInstance from '../../services/axiosConfig';
import { API_BASE_URL } from '../../utils/apiConfig';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
}

interface ChatRoom {
  _id: string;
  title: string;
  lastMessageAt: string;
}

interface AISettings {
  creativity: number;
  systemPrompt: string;
  about: string;
  avoidWords: string;
  responseLength: 'short' | 'medium' | 'long';
  tone: 'professional' | 'friendly' | 'casual' | 'humorous' | 'authoritative' | 'neutral';
  gender: 'male' | 'female' | 'neutral';
  languages: string[];
  useEmojis: boolean;
  useBulletPoints: boolean;
  dos: string[];
  donts: string[];
}

interface KnowledgeBaseItem {
  _id: string;
  type: 'text' | 'url' | 'pdf' | 'docx' | 'xlsx';
  title: string;
  content?: string;
  source: string;
  metadata?: any;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
  createdAt: string;
}

const AITool: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'chat' | 'settings' | 'knowledge'>('chat');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [settings, setSettings] = useState<AISettings | null>(null);
  const [knowledgeItems, setKnowledgeItems] = useState<KnowledgeBaseItem[]>([]);
  const [showAddKnowledge, setShowAddKnowledge] = useState(false);
  const [newKnowledge, setNewKnowledge] = useState({
    type: 'file' as 'text' | 'url' | 'file',
    title: '',
    content: '',
    url: '',
    files: null as FileList | null,
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Fetch chat history
  const fetchChatHistory = async () => {
    try {
      const response = await axiosInstance.get('/ai/history');
      if (response.data.rooms) {
        setChatRooms(response.data.rooms);
      }
    } catch (error) {
      console.error('Error fetching chat history:', error);
    }
  };

  // Fetch messages for a room
  const fetchMessages = async (roomId: string) => {
    try {
      const response = await axiosInstance.get(`/ai/messages/${roomId}`);
      if (response.data.messages) {
        setMessages(response.data.messages.map((msg: any) => ({
          role: msg.role,
          content: msg.content,
          timestamp: new Date(msg.createdAt),
        })));
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  // Send message
  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = inputMessage;
    setInputMessage('');
    setIsLoading(true);

    try {
      const token = localStorage.getItem('accessToken');
      const baseUrl = API_BASE_URL;
      // Remove trailing slash if present, then add /ai/chat
      const apiUrl = `${baseUrl.replace(/\/$/, '')}/ai/chat`;
      const response = await fetch(
        apiUrl,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            message: currentInput,
            roomId: selectedRoomId || undefined,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to send message: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body reader available');
      }

      const decoder = new TextDecoder();
      let assistantMessage = '';
      let currentRoomId = selectedRoomId;
      let buffer = '';
      let currentEventType = '';

      // Add placeholder for assistant message
      setMessages((prev) => [...prev, { role: 'assistant', content: '', timestamp: new Date() }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          if (line.trim() === '') continue;

          // Handle event type declarations
          if (line.startsWith('event: ')) {
            currentEventType = line.slice(7).trim();
            continue;
          }

          // Handle data lines
          if (line.startsWith('data: ')) {
            try {
              const jsonStr = line.slice(6).trim();
              if (jsonStr) {
                const data = JSON.parse(jsonStr);

                // Handle event: meta - Contains chatRoomId and initial message data
                if (currentEventType === 'meta') {
                  if (data.chatRoomId) {
                    currentRoomId = data.chatRoomId;
                    setSelectedRoomId(currentRoomId);
                    console.log('Chat room ID set:', currentRoomId);
                  }
                  // Reset event type after processing
                  currentEventType = '';
                  continue;
                }

                // Handle event: error
                if (currentEventType === 'error') {
                  if (data.message) {
                    console.error('AI Chat Error:', data.message);
                    setMessages((prev) => {
                      const newMessages = [...prev];
                      // Remove the empty assistant message
                      if (newMessages[newMessages.length - 1]?.role === 'assistant' &&
                        newMessages[newMessages.length - 1]?.content === '') {
                        newMessages.pop();
                      }
                      // Add error message
                      newMessages.push({
                        role: 'assistant',
                        content: `❌ Error: ${data.message}`,
                        timestamp: new Date(),
                      });
                      return newMessages;
                    });
                    currentEventType = '';
                    throw new Error(data.message);
                  }
                }

                // Handle regular data events with content chunks (no event type or empty event type)
                // Format: {"content": "next part of response"}
                if (currentEventType === '' || !currentEventType) {
                  if (data.content) {
                    assistantMessage += data.content;
                    setMessages((prev) => {
                      const newMessages = [...prev];
                      const lastMsgIndex = newMessages.length - 1;
                      if (lastMsgIndex >= 0 && newMessages[lastMsgIndex].role === 'assistant') {
                        // Create a new object for the last message to avoid mutation
                        newMessages[lastMsgIndex] = {
                          ...newMessages[lastMsgIndex],
                          content: assistantMessage
                        };
                      }
                      return newMessages;
                    });
                  }
                }

                // Reset event type after processing (except for content chunks which don't have event type)
                if (currentEventType !== '' && currentEventType !== undefined) {
                  currentEventType = '';
                }
              }
            } catch (e) {
              // If it's an error we threw, re-throw it to stop processing
              if (e instanceof Error && currentEventType === 'error') {
                throw e;
              }
              console.warn('Failed to parse SSE data:', e, line);
            }
          }
        }
      }

      // Process any remaining buffer
      if (buffer.trim()) {
        if (buffer.startsWith('data: ')) {
          try {
            const jsonStr = buffer.slice(6).trim();
            if (jsonStr) {
              const data = JSON.parse(jsonStr);
              if (data.content) {
                assistantMessage += data.content;
                setMessages((prev) => {
                  const newMessages = [...prev];
                  const lastMsgIndex = newMessages.length - 1;
                  if (lastMsgIndex >= 0 && newMessages[lastMsgIndex].role === 'assistant') {
                    // Create a new object for the last message
                    newMessages[lastMsgIndex] = {
                      ...newMessages[lastMsgIndex],
                      content: assistantMessage
                    };
                  }
                  return newMessages;
                });
              }
            }
          } catch (e) {
            console.warn('Failed to parse remaining buffer:', e);
          }
        }
      }

      // Refresh chat history after message
      await fetchChatHistory();
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((prev) => {
        const newMessages = [...prev];
        // Remove the empty assistant message on error
        if (newMessages[newMessages.length - 1]?.role === 'assistant' &&
          newMessages[newMessages.length - 1]?.content === '') {
          return newMessages.slice(0, -1);
        }
        return newMessages;
      });
      alert('Failed to send message. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch AI Settings
  const fetchSettings = async () => {
    try {
      const response = await axiosInstance.get('/ai/settings');
      if (response.data.success && response.data.settings) {
        setSettings(response.data.settings);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  // Update AI Settings
  const updateSettings = async () => {
    if (!settings) return;
    try {
      // Only send fields that are defined (partial update support)
      const settingsToUpdate: Partial<AISettings> = {};

      if (settings.creativity !== undefined) settingsToUpdate.creativity = settings.creativity;
      if (settings.systemPrompt !== undefined) settingsToUpdate.systemPrompt = settings.systemPrompt;
      if (settings.about !== undefined) settingsToUpdate.about = settings.about;
      if (settings.avoidWords !== undefined) settingsToUpdate.avoidWords = settings.avoidWords;
      if (settings.responseLength !== undefined) settingsToUpdate.responseLength = settings.responseLength;
      if (settings.tone !== undefined) settingsToUpdate.tone = settings.tone;
      if (settings.gender !== undefined) settingsToUpdate.gender = settings.gender;
      if (settings.languages !== undefined) settingsToUpdate.languages = settings.languages;
      if (settings.useEmojis !== undefined) settingsToUpdate.useEmojis = settings.useEmojis;
      if (settings.useBulletPoints !== undefined) settingsToUpdate.useBulletPoints = settings.useBulletPoints;
      if (settings.dos !== undefined) settingsToUpdate.dos = settings.dos;
      if (settings.donts !== undefined) settingsToUpdate.donts = settings.donts;

      const response = await axiosInstance.put('/ai/settings', settingsToUpdate);
      if (response.data.success) {
        alert('Settings updated successfully!');
        // Refresh settings to get updated values
        await fetchSettings();
      }
    } catch (error: any) {
      console.error('Error updating settings:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update settings';
      alert(errorMessage);
    }
  };

  // Fetch Knowledge Base Items
  const fetchKnowledgeItems = async () => {
    try {
      const response = await axiosInstance.get('/ai/knowledge');
      if (response.data.success && response.data.items) {
        setKnowledgeItems(response.data.items);
      }
    } catch (error) {
      console.error('Error fetching knowledge items:', error);
    }
  };

  // Poll status for a knowledge base item
  const pollItemStatus = async (itemId: string) => {
    try {
      const { data } = await axiosInstance.get(`/ai/knowledge/${itemId}`);
      const status = data.item.status;

      if (status === 'completed' || status === 'failed') {
        // Update the item in the list
        setKnowledgeItems((prev) =>
          prev.map((item) =>
            item._id === itemId ? { ...item, ...data.item } : item
          )
        );
      } else {
        // Still pending or processing, poll again in 2 seconds
        setTimeout(() => pollItemStatus(itemId), 2000);
      }
    } catch (error) {
      console.error('Polling error for item', itemId, error);
    }
  };

  // Add Knowledge Base Item
  const addKnowledgeItem = async () => {
    try {
      // Validation
      if (!newKnowledge.title.trim() && newKnowledge.type !== 'file') {
        alert('Title is required');
        return;
      }

      if (newKnowledge.type === 'text' && !newKnowledge.content.trim()) {
        alert('Content is required for text type');
        return;
      }

      if (newKnowledge.type === 'url' && !newKnowledge.url.trim()) {
        alert('URL is required for url type');
        return;
      }

      if (newKnowledge.type === 'file' && (!newKnowledge.files || newKnowledge.files.length === 0)) {
        alert('At least one file is required');
        return;
      }

      const formData = new FormData();

      if (newKnowledge.type === 'text') {
        formData.append('type', 'text');
        formData.append('title', newKnowledge.title);
        formData.append('content', newKnowledge.content);
      } else if (newKnowledge.type === 'url') {
        formData.append('type', 'url');
        formData.append('title', newKnowledge.title);
        formData.append('url', newKnowledge.url);
      } else if (newKnowledge.type === 'file' && newKnowledge.files) {
        // Append multiple files with same field name 'files'
        Array.from(newKnowledge.files).forEach((file) => {
          formData.append('files', file);
        });
      }

      const response = await axiosInstance.post('/ai/knowledge', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success && response.data.items) {
        setShowAddKnowledge(false);
        setNewKnowledge({ type: 'file', title: '', content: '', url: '', files: null });

        // Add new items to the list immediately
        setKnowledgeItems((prev) => [...response.data.items, ...prev]);

        // Start polling for each item with pending status
        response.data.items.forEach((item: KnowledgeBaseItem) => {
          if (item.status === 'pending' || item.status === 'processing') {
            pollItemStatus(item._id);
          }
        });

        alert(`${response.data.items.length} item(s) added successfully!`);
      }
    } catch (error: any) {
      console.error('Error adding knowledge item:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to add knowledge item';
      alert(errorMessage);
    }
  };


  // Delete Knowledge Base Item
  const deleteKnowledgeItem = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    try {
      const response = await axiosInstance.delete(`/ai/knowledge/${id}`);
      if (response.data.success) {
        await fetchKnowledgeItems();
      }
    } catch (error) {
      console.error('Error deleting knowledge item:', error);
      alert('Failed to delete knowledge item');
    }
  };

  // Load data on mount and tab change
  useEffect(() => {
    if (activeTab === 'chat') {
      fetchChatHistory();
      if (selectedRoomId) {
        fetchMessages(selectedRoomId);
      }
    } else if (activeTab === 'settings') {
      fetchSettings();
    } else if (activeTab === 'knowledge') {
      fetchKnowledgeItems();
    }
  }, [activeTab, selectedRoomId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const startNewChat = () => {
    setSelectedRoomId(null);
    setMessages([]);
  };

  const selectRoom = (roomId: string) => {
    setSelectedRoomId(roomId);
    fetchMessages(roomId);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">AI Tool</h1>
      </div>

      {/* Tabs */}
      <div className="flex space-x-4 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('chat')}
          className={`px-4 py-2 font-medium transition-colors ${activeTab === 'chat'
            ? 'border-b-2 border-blue-600 text-blue-600'
            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
        >
          <Bot className="inline-block w-4 h-4 mr-2" />
          Chat
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2 font-medium transition-colors ${activeTab === 'settings'
            ? 'border-b-2 border-blue-600 text-blue-600'
            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
        >
          <Settings className="inline-block w-4 h-4 mr-2" />
          Settings
        </button>
        <button
          onClick={() => setActiveTab('knowledge')}
          className={`px-4 py-2 font-medium transition-colors ${activeTab === 'knowledge'
            ? 'border-b-2 border-blue-600 text-blue-600'
            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
        >
          <BookOpen className="inline-block w-4 h-4 mr-2" />
          Knowledge Base
        </button>
      </div>

      {/* Chat Tab */}
      {activeTab === 'chat' && (
        <div className="flex h-[calc(100vh-250px)] gap-4">
          {/* Chat Rooms Sidebar */}
          <div className="w-64 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <button
              onClick={startNewChat}
              className="w-full mb-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Chat
            </button>
            <div className="space-y-2 overflow-y-auto max-h-[calc(100vh-350px)]">
              {chatRooms.map((room) => (
                <button
                  key={room._id}
                  onClick={() => selectRoom(room._id)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${selectedRoomId === room._id
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100'
                    : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
                    }`}
                >
                  <div className="font-medium truncate">{room.title}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {new Date(room.lastMessageAt).toLocaleDateString()}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 flex flex-col">
            <div
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto p-4 space-y-4"
            >
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                  <div className="text-center">
                    <Bot className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <p>Start a conversation with AI</p>
                  </div>
                </div>
              ) : (
                messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-4 ${msg.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                        }`}
                    >
                      {msg.role === 'assistant' ? (
                        <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:text-gray-900 dark:prose-headings:text-gray-100 prose-p:text-gray-800 dark:prose-p:text-gray-200 prose-strong:text-gray-900 dark:prose-strong:text-gray-100 prose-code:text-blue-600 dark:prose-code:text-blue-400 prose-pre:bg-gray-800 dark:prose-pre:bg-gray-900 prose-pre:text-gray-100">
                          <ReactMarkdown
                            components={{
                              code: ({ node, inline, className, children, ...props }: any) => {
                                const match = /language-(\w+)/.exec(className || '');
                                return !inline && match ? (
                                  <pre className="bg-gray-800 dark:bg-gray-900 rounded-lg p-4 overflow-x-auto">
                                    <code className={className} {...props}>
                                      {children}
                                    </code>
                                  </pre>
                                ) : (
                                  <code className="bg-gray-200 dark:bg-gray-800 px-1.5 py-0.5 rounded text-sm" {...props}>
                                    {children}
                                  </code>
                                );
                              },
                              p: ({ children }: any) => <p className="mb-2 last:mb-0">{children}</p>,
                              ul: ({ children }: any) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                              ol: ({ children }: any) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                              li: ({ children }: any) => <li className="ml-4">{children}</li>,
                              h1: ({ children }: any) => <h1 className="text-2xl font-bold mb-2 mt-4 first:mt-0">{children}</h1>,
                              h2: ({ children }: any) => <h2 className="text-xl font-bold mb-2 mt-3 first:mt-0">{children}</h2>,
                              h3: ({ children }: any) => <h3 className="text-lg font-bold mb-2 mt-2 first:mt-0">{children}</h3>,
                              blockquote: ({ children }: any) => (
                                <blockquote className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 italic my-2">
                                  {children}
                                </blockquote>
                              ),
                              a: ({ children, href }: any) => (
                                <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">
                                  {children}
                                </a>
                              ),
                            }}
                          >
                            {msg.content}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <div className="whitespace-pre-wrap">{msg.content}</div>
                      )}
                    </div>
                  </div>
                ))
              )}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                  placeholder="Type your message..."
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={sendMessage}
                  disabled={isLoading || !inputMessage.trim()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && settings && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">Creativity (0-10)</label>
              <input
                type="number"
                min="0"
                max="10"
                step="0.1"
                value={settings.creativity}
                onChange={(e) => setSettings({ ...settings, creativity: Number(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              />
              <p className="text-xs text-gray-500 mt-1">Backend converts this to 0.0-1.0 scale</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Response Length</label>
              <select
                value={settings.responseLength}
                onChange={(e) => setSettings({ ...settings, responseLength: e.target.value as any })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              >
                <option value="short">Short</option>
                <option value="medium">Medium</option>
                <option value="long">Long</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Tone</label>
              <select
                value={settings.tone}
                onChange={(e) => setSettings({ ...settings, tone: e.target.value as any })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              >
                <option value="professional">Professional</option>
                <option value="friendly">Friendly</option>
                <option value="casual">Casual</option>
                <option value="humorous">Humorous</option>
                <option value="authoritative">Authoritative</option>
                <option value="neutral">Neutral</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Gender</label>
              <select
                value={settings.gender}
                onChange={(e) => setSettings({ ...settings, gender: e.target.value as any })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="neutral">Neutral</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2">System Prompt</label>
              <textarea
                value={settings.systemPrompt}
                onChange={(e) => setSettings({ ...settings, systemPrompt: e.target.value })}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2">About</label>
              <textarea
                value={settings.about}
                onChange={(e) => setSettings({ ...settings, about: e.target.value })}
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2">Avoid Words</label>
              <input
                type="text"
                value={settings.avoidWords}
                onChange={(e) => setSettings({ ...settings, avoidWords: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                placeholder="Comma-separated words to avoid"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2">Languages (comma-separated, e.g., English, Hindi)</label>
              <input
                type="text"
                value={settings.languages.join(', ')}
                onChange={(e) => setSettings({ ...settings, languages: e.target.value.split(',').map(l => l.trim()).filter(l => l) })}
                placeholder="English, Hindi, Spanish"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2">Dos (one per line)</label>
              <textarea
                value={settings.dos.join('\n')}
                onChange={(e) => setSettings({ ...settings, dos: e.target.value.split('\n').filter(d => d.trim()) })}
                rows={3}
                placeholder="Be polite&#10;Explain concepts clearly"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2">Don'ts (one per line)</label>
              <textarea
                value={settings.donts.join('\n')}
                onChange={(e) => setSettings({ ...settings, donts: e.target.value.split('\n').filter(d => d.trim()) })}
                rows={3}
                placeholder="Mention competitors&#10;Use offensive language"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              />
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.useEmojis}
                  onChange={(e) => setSettings({ ...settings, useEmojis: e.target.checked })}
                  className="w-4 h-4"
                />
                <span>Use Emojis</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.useBulletPoints}
                  onChange={(e) => setSettings({ ...settings, useBulletPoints: e.target.checked })}
                  className="w-4 h-4"
                />
                <span>Use Bullet Points</span>
              </label>
            </div>
          </div>
          <button
            onClick={updateSettings}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Save Settings
          </button>
        </div>
      )}

      {/* Knowledge Base Tab */}
      {activeTab === 'knowledge' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Knowledge Base Items</h2>
            <button
              onClick={() => setShowAddKnowledge(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Items
            </button>
          </div>

          {showAddKnowledge && (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Add Knowledge Base Item</h3>
                <button
                  onClick={() => setShowAddKnowledge(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Type</label>
                  <select
                    value={newKnowledge.type}
                    onChange={(e) => setNewKnowledge({ ...newKnowledge, type: e.target.value as any })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  >
                    <option value="file">PDF</option>
                    {/* <option value="text">Text</option> */}
                    <option value="url">URL</option>
                  </select>
                </div>
                {newKnowledge.type !== 'file' && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Title</label>
                    <input
                      type="text"
                      value={newKnowledge.title}
                      onChange={(e) => setNewKnowledge({ ...newKnowledge, title: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                    />
                  </div>
                )}
                {newKnowledge.type === 'text' && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Content</label>
                    <textarea
                      value={newKnowledge.content}
                      onChange={(e) => setNewKnowledge({ ...newKnowledge, content: e.target.value })}
                      rows={6}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                    />
                  </div>
                )}
                {newKnowledge.type === 'url' && (
                  <div>
                    <label className="block text-sm font-medium mb-2">URL</label>
                    <input
                      type="url"
                      value={newKnowledge.url}
                      onChange={(e) => setNewKnowledge({ ...newKnowledge, url: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                    />
                  </div>
                )}
                {newKnowledge.type === 'file' && (
                  <div>
                    <label className="block text-sm font-medium mb-2">Files (PDF, DOCX, XLSX, TXT)</label>
                    <input
                      type="file"
                      accept=".pdf,.docx,.xlsx,.txt"
                      multiple
                      onChange={(e) => setNewKnowledge({ ...newKnowledge, files: e.target.files })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                    />
                    {newKnowledge.files && newKnowledge.files.length > 0 && (
                      <p className="text-sm text-gray-500 mt-2">
                        {newKnowledge.files.length} file(s) selected
                      </p>
                    )}
                  </div>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={addKnowledgeItem}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Add
                  </button>
                  <button
                    onClick={() => setShowAddKnowledge(false)}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {knowledgeItems.map((item) => (
              <div
                key={item._id}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2 flex-1">
                    {item.type === 'text' && <FileText className="w-5 h-5 text-blue-600" />}
                    {item.type === 'url' && <LinkIcon className="w-5 h-5 text-green-600" />}
                    {item.type === 'pdf' && <Upload className="w-5 h-5 text-red-600" />}
                    {item.type === 'docx' && <FileText className="w-5 h-5 text-blue-500" />}
                    {item.type === 'xlsx' && <FileText className="w-5 h-5 text-green-500" />}
                    <h3 className="font-semibold truncate">{item.title}</h3>
                  </div>
                  <button
                    onClick={() => deleteKnowledgeItem(item._id)}
                    className="text-red-600 hover:text-red-700 ml-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Status Badge */}
                <div className="mb-2">
                  {item.status === 'pending' && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                      ⏳ Pending
                    </span>
                  )}
                  {item.status === 'processing' && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      🔄 Processing
                    </span>
                  )}
                  {item.status === 'completed' && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      ✅ Completed
                    </span>
                  )}
                  {item.status === 'failed' && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                      ❌ Failed
                    </span>
                  )}
                </div>

                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{item.source}</p>
                {item.error && (
                  <p className="text-sm text-red-600 dark:text-red-400 mb-2">
                    Error: {item.error}
                  </p>
                )}
                {item.content && item.status === 'completed' && (
                  <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3">
                    {item.content.substring(0, 150)}...
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-2">
                  {new Date(item.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AITool;

