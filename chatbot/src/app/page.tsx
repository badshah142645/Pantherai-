'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Upload, MessageSquare, Brain, Search, Zap, Globe, Image as ImageIcon, FileText, X } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  files?: File[];
  image?: string;
}

interface ChatMode {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  active: boolean;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [currentDate, setCurrentDate] = useState('');

  const [modes, setModes] = useState<ChatMode[]>([
    {
      id: 'normal',
      name: 'Normal',
      icon: <MessageSquare className="w-4 h-4" />,
      description: 'Standard chat mode',
      active: true
    },
    {
      id: 'think',
      name: 'Think Mode',
      icon: <Brain className="w-4 h-4" />,
      description: 'Deep reasoning and analysis',
      active: false
    },
    {
      id: 'deepsearch',
      name: 'DeepSearch',
      icon: <Search className="w-4 h-4" />,
      description: 'Comprehensive web search',
      active: false
    },
    {
      id: 'deepresearch',
      name: 'DeepResearch',
      icon: <Zap className="w-4 h-4" />,
      description: 'Multi-agent research system',
      active: false
    },
    {
      id: 'browse',
      name: 'Web Search',
      icon: <Globe className="w-4 h-4" />,
      description: 'Real-time web browsing',
      active: false
    },
    {
      id: 'image',
      name: 'Image Gen',
      icon: <ImageIcon className="w-4 h-4" />,
      description: 'Generate images',
      active: false
    }
  ]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    setCurrentDate(new Date().toLocaleDateString());
  }, []);

  const toggleMode = (modeId: string) => {
    setModes(prev => prev.map(mode =>
      mode.id === modeId
        ? { ...mode, active: !mode.active }
        : mode
    ));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setUploadedFiles(prev => [...prev, ...files]);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedImage(file);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const removeImage = () => {
    setUploadedImage(null);
  };

  const sendMessage = async () => {
    if (!input.trim() && uploadedFiles.length === 0 && !uploadedImage) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
      files: uploadedFiles,
      image: uploadedImage ? URL.createObjectURL(uploadedImage) : undefined
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setUploadedFiles([]);
    setUploadedImage(null);
    setIsLoading(true);
    setError(null);

    try {
      const activeModes = modes.filter(m => m.active).map(m => m.id);

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: input,
          modes: activeModes,
          files: uploadedFiles,
          image: uploadedImage
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response || 'Response received',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Save to memory
      await saveToMemory([userMessage, assistantMessage]);

    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message. Please try again.');

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, there was an error processing your request. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const saveToMemory = async (newMessages: Message[]) => {
    try {
      await fetch('/api/memory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: newMessages,
          action: 'save'
        }),
      });
    } catch (error) {
      console.error('Error saving to memory:', error);
    }
  };

  const clearChat = async () => {
    setMessages([]);
    setError(null);

    try {
      await fetch('/api/memory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'clear'
        }),
      });
    } catch (error) {
      console.error('Error clearing memory:', error);
    }
  };

  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-0'} bg-gray-50 border-r border-gray-200 flex flex-col transition-all duration-300 overflow-hidden`}>
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold text-gray-900">Panther AI</h1>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1 hover:bg-gray-200 rounded-md"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 p-2">
          <div className="space-y-1">
            <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
              Chat Modes
            </div>
            {modes.map((mode) => (
              <button
                key={mode.id}
                onClick={() => toggleMode(mode.id)}
                className={`w-full p-3 rounded-md text-left transition-colors flex items-center space-x-3 ${
                  mode.active
                    ? 'bg-gray-200 text-gray-900'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <div className={`p-1 rounded ${mode.active ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}>
                  {mode.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{mode.name}</div>
                  <div className="text-xs text-gray-500 truncate">{mode.description}</div>
                </div>
              </button>
            ))}
          </div>

          <div className="mt-4 px-2">
            <button
              onClick={clearChat}
              className="w-full p-2 text-left text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            >
              🗑️ New Chat
            </button>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 hover:bg-gray-100 rounded-md"
              >
                <MessageSquare className="w-5 h-5" />
              </button>
            )}
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Panther AI</h1>
              <div className="text-sm text-gray-500">
                {modes.filter(m => m.active).map(m => m.name).join(', ') || 'Normal'}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {currentDate && (
              <div className="text-sm text-gray-500">
                {currentDate}
              </div>
            )}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mx-4 mt-4 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <X className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
              <div className="ml-auto pl-3">
                <button
                  onClick={() => setError(null)}
                  className="inline-flex rounded-md p-1.5 text-red-400 hover:bg-red-200 focus:outline-none"
                >
                  <span className="sr-only">Dismiss</span>
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <div className="max-w-4xl mx-auto">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <MessageSquare className="w-6 h-6 text-gray-600" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">How can I help you today?</h2>
                <p className="text-gray-600 max-w-md">
                  Choose a mode from the sidebar and start a conversation with Panther AI.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex max-w-3xl ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                      {/* Avatar */}
                      <div className={`flex-shrink-0 ${message.role === 'user' ? 'ml-3' : 'mr-3'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          message.role === 'user'
                            ? 'bg-blue-600 text-white'
                            : 'bg-green-600 text-white'
                        }`}>
                          {message.role === 'user' ? (
                            <span className="text-sm font-medium">U</span>
                          ) : (
                            <span className="text-sm font-medium">AI</span>
                          )}
                        </div>
                      </div>

                      {/* Message Content */}
                      <div
                        className={`rounded-2xl px-4 py-3 max-w-2xl ${
                          message.role === 'user'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        {message.image && (
                          <div className="mb-3">
                            <img
                              src={message.image}
                              alt="Uploaded"
                              className="max-w-full h-auto rounded-lg"
                            />
                          </div>
                        )}

                        {message.files && message.files.length > 0 && (
                          <div className="mb-3 space-y-2">
                            {message.files.map((file, index) => (
                              <div key={index} className="flex items-center space-x-2 text-sm bg-white bg-opacity-20 p-2 rounded">
                                <FileText className="w-4 h-4" />
                                <span>{file.name}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="whitespace-pre-wrap text-sm leading-relaxed">
                          {message.content}
                        </div>

                        <div className={`text-xs mt-2 ${
                          message.role === 'user' ? 'text-blue-200' : 'text-gray-500'
                        }`}>
                          {message.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex justify-start">
                    <div className="flex max-w-3xl">
                      <div className="flex-shrink-0 mr-3">
                        <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-white">AI</span>
                        </div>
                      </div>
                      <div className="bg-gray-100 rounded-2xl px-4 py-3">
                        <div className="flex items-center space-x-2">
                          <div className="animate-pulse flex space-x-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                          </div>
                          <span className="text-gray-600 text-sm">Panther AI is thinking...</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 bg-white px-4 py-4">
          <div className="max-w-4xl mx-auto">
            {/* File Preview */}
            {(uploadedFiles.length > 0 || uploadedImage) && (
              <div className="mb-4 space-y-2">
                {uploadedImage && (
                  <div className="flex items-center space-x-2 bg-gray-100 p-3 rounded-lg">
                    <ImageIcon className="w-4 h-4 text-gray-600" />
                    <span className="text-sm text-gray-700">{uploadedImage.name}</span>
                    <button
                      onClick={removeImage}
                      className="text-gray-500 hover:text-gray-700 ml-auto"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {uploadedFiles.map((file, index) => (
                  <div key={index} className="flex items-center space-x-2 bg-gray-100 p-3 rounded-lg">
                    <FileText className="w-4 h-4 text-gray-600" />
                    <span className="text-sm text-gray-700">{file.name}</span>
                    <button
                      onClick={() => removeFile(index)}
                      className="text-gray-500 hover:text-gray-700 ml-auto"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-end space-x-3">
              <div className="flex-1">
                <div className="relative">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    placeholder="Message Panther AI..."
                    className="w-full p-3 pr-12 border border-gray-300 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                    rows={1}
                    style={{minHeight: '44px', maxHeight: '200px'}}
                  />
                  <div className="absolute right-3 bottom-3 flex space-x-1">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                      title="Upload files"
                    >
                      <Upload className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => imageInputRef.current?.click()}
                      className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                      title="Upload image"
                    >
                      <ImageIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              <button
                onClick={sendMessage}
                disabled={!input.trim() && uploadedFiles.length === 0 && !uploadedImage}
                className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>

            {/* Hidden file inputs */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.txt,.csv,.log,.md,.mp4,.mov,.avi,.mkv,.jpg,.jpeg,.png,.gif,.bmp,.webp"
              onChange={handleFileUpload}
              className="hidden"
            />
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
