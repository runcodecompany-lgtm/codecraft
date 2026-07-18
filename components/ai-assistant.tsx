// components/ai-assistant.tsx
'use client'

import React, { useState, useEffect, useRef } from 'react'
import { 
  Sparkles, 
  X, 
  Send, 
  Bot, 
  User, 
  Loader2, 
  Trash2, 
  ChevronLeft, 
  History, 
  Plus, 
  MessageSquare,
  ChevronDown
} from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  createdAt?: string
}

interface Conversation {
  id: string
  title: string
  createdAt: string
  messages?: Message[]
}

interface AIAssistantProps {
  initialLessonId?: string
  initialCourseId?: string
  inline?: boolean
}

export default function AIAssistant({ initialLessonId, initialCourseId, inline = false }: AIAssistantProps) {
  const [isOpen, setIsOpen] = useState(inline)
  const [showHistory, setShowHistory] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatInputRef = useRef<HTMLTextAreaElement>(null)

  const suggestionChips = [
    { label: 'شرح مفهوم برمجي صعب', prompt: 'هل يمكنك شرح مفهوم الـ Promises والـ Async/Await في جافا سكريبت بطريقة مبسطة مع مثال؟' },
    { label: 'ساعدني في مراجعة الكود', prompt: 'كيف يمكنني تحسين جودة هذا الكود وتقليل تعقيده؟' },
    { label: 'نصائح للمذاكرة الفعالة', prompt: 'ما هي أفضل طريقة لجدولة وقتي لتعلم البرمجة بفعالية؟' },
    { label: 'اكتب لي مثال عملي', prompt: 'اكتب مثالاً عملياً لاستخدام كائن Map في JavaScript وشرح الفرق بينه وبين Object.' },
  ]

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (isOpen) {
      scrollToBottom()
      loadConversations()
    }
  }, [messages, isOpen])

  // Load conversations
  const loadConversations = async () => {
    try {
      const res = await fetch('/api/ai/conversations')
      if (res.ok) {
        const data = await res.json()
        setConversations(data)
      }
    } catch (error) {
      console.error('Error loading conversations:', error)
    }
  }

  // Handle selecting a conversation
  const selectConversation = async (conv: Conversation) => {
    setActiveConversationId(conv.id)
    setShowHistory(false)
    setIsLoading(true)
    try {
      // We will reload conversation messages by fetching conversation details
      const res = await fetch(`/api/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'RELOAD_HISTORY_DUMMY', conversationId: conv.id })
      })
      // The dummy response doesn't execute but we can fetch messages via DB or api if we had a retrieve endpoint.
      // Wait, let's create a route for fetching messages if needed, or we can just fetch the messages of that conversation.
      // Let's check: in GET /api/ai/conversations we didn't return all messages.
      // Let's modify our GET /api/ai/conversations or fetch from database.
      // Let's build a quick fetch endpoint in conversations route, or load it.
      // Ah! Let's make sure we can fetch details. Let's create an API endpoint: GET /api/ai/conversations/[id] or query param GET /api/ai/conversations?id=xxx
      const detailsRes = await fetch(`/api/ai/conversations?id=${conv.id}`)
      if (detailsRes.ok) {
        const data = await detailsRes.json()
        setMessages(data.messages || [])
      }
    } catch (error) {
      console.error('Error loading conversation details:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Create new conversation
  const startNewConversation = () => {
    setActiveConversationId(null)
    setMessages([])
    setShowHistory(false)
    if (chatInputRef.current) {
      chatInputRef.current.focus()
    }
  }

  // Delete conversation
  const deleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('هل تريد بالتأكيد حذف هذه المحادثة؟')) return

    try {
      const res = await fetch(`/api/ai/conversations?id=${id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        setConversations(conversations.filter(c => c.id !== id))
        if (activeConversationId === id) {
          startNewConversation()
        }
      }
    } catch (error) {
      console.error('Error deleting conversation:', error)
    }
  }

  // Send message
  const handleSend = async (textToSend?: string) => {
    const messageContent = textToSend || input
    if (!messageContent.trim() || isLoading) return

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageContent,
    }

    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsLoading(true)

    // Temp bot message for streaming
    const botMsgId = (Date.now() + 1).toString()
    const botMsg: Message = {
      id: botMsgId,
      role: 'assistant',
      content: '',
    }
    setMessages(prev => [...prev, botMsg])

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageContent,
          conversationId: activeConversationId || undefined,
          context: (initialLessonId || initialCourseId) ? {
            lessonId: initialLessonId,
            courseId: initialCourseId,
            pageType: initialLessonId ? 'LESSON' : 'COURSE'
          } : undefined
        })
      })

      if (!response.ok) {
        throw new Error('حدث خطأ في الاتصال بالخادم')
      }

      // Check for conversation ID header
      const convId = response.headers.get('X-Conversation-Id')
      if (convId && !activeConversationId) {
        setActiveConversationId(convId)
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let done = false
      let streamedContent = ''

      while (!done) {
        const { value, done: doneReading } = await reader!.read()
        done = doneReading
        const chunk = decoder.decode(value)
        streamedContent += chunk

        setMessages(prev => 
          prev.map(m => m.id === botMsgId ? { ...m, content: streamedContent } : m)
        )
      }

      // Reload conversations list in background to update title/last msg
      loadConversations()

    } catch (error: any) {
      console.error('Error sending message:', error)
      setMessages(prev => 
        prev.map(m => m.id === botMsgId ? { ...m, content: `عذراً، حدث خطأ أثناء الاتصال بالذكاء الاصطناعي: ${error.message || error}` } : m)
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Simple Markdown Formatter
  const renderFormattedContent = (text: string) => {
    if (!text) return null
    const parts = text.split(/(```[\s\S]*?```)/g)
    
    return parts.map((part, index) => {
      if (part.startsWith('```')) {
        const match = part.match(/```(\w*)\n([\s\S]*?)```/)
        const lang = match ? match[1] : ''
        const code = match ? match[2] : part.slice(3, -3)
        
        return (
          <div key={index} className="my-3 font-mono text-xs overflow-x-auto rounded-xl bg-slate-950 text-slate-100 border border-slate-800 text-left" style={{ direction: 'ltr' }}>
            <div className="bg-slate-900 px-3 py-1.5 border-b border-slate-800 text-slate-400 select-none flex justify-between items-center text-[10px]">
              <span>{lang || 'code'}</span>
              <button 
                onClick={() => navigator.clipboard.writeText(code.trim())}
                className="hover:text-white transition-colors bg-slate-850 px-2 py-0.5 rounded cursor-pointer"
              >
                نسخ
              </button>
            </div>
            <pre className="p-3 overflow-x-auto"><code>{code.trim()}</code></pre>
          </div>
        )
      }
      
      let renderedText = part
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/`(.*?)`/g, '<code class="bg-gray-150 dark:bg-slate-800 text-pink-500 dark:text-pink-400 px-1 py-0.5 rounded font-mono text-xs font-bold">$1</code>')
        .replace(/^- (.*?)$/gm, '<li>$1</li>')
      
      if (renderedText.includes('<li>')) {
        renderedText = `<ul class="list-disc pr-5 my-2 space-y-1">${renderedText}</ul>`
      }
      
      return (
        <div 
          key={index} 
          className="whitespace-pre-line leading-relaxed text-sm"
          dangerouslySetInnerHTML={{ __html: renderedText }}
        />
      )
    })
  }

  return (
    <>
      {/* Floating Trigger Button */}
      {!inline && (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`fixed bottom-6 left-6 z-50 p-4 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-xl hover:shadow-indigo-500/30 transform hover:scale-105 active:scale-95 transition-all duration-300 group flex items-center justify-center`}
          aria-label="المساعد الذكي"
        >
          {isOpen ? (
            <X className="w-6 h-6 animate-pulse" />
          ) : (
            <div className="relative">
              <Bot className="w-6 h-6 group-hover:rotate-12 transition-transform duration-300" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 border-2 border-indigo-600 rounded-full animate-ping" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 border-2 border-indigo-600 rounded-full" />
            </div>
          )}
        </button>
      )}

      {/* Chat Window Dialog */}
      {isOpen && (
        <div 
          className={inline
            ? "relative w-full h-[620px] bg-white dark:bg-slate-900 border border-gray-200/80 dark:border-slate-800/80 rounded-2xl shadow-xl overflow-hidden flex flex-col transition-all duration-300"
            : "fixed bottom-24 left-6 z-50 w-full sm:w-[390px] h-[580px] max-h-[82vh] bg-white dark:bg-slate-900 border border-gray-200/80 dark:border-slate-800/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col transition-all duration-300 animate-in fade-in slide-in-from-bottom-8"
          }
          style={{ direction: 'rtl' }}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-4 py-3 flex items-center justify-between shadow-md">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-white/10 rounded-xl">
                <Sparkles className="w-5 h-5 text-yellow-300" />
              </div>
              <div>
                <h3 className="font-bold text-sm leading-tight">المساعد الذكي Core AI</h3>
                <span className="text-[10px] text-indigo-100 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" /> متصل ومستعد للمساعدة
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button 
                onClick={() => setShowHistory(!showHistory)}
                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                title="تاريخ المحادثات"
              >
                <History className="w-4 h-4 text-white" />
              </button>
              <button 
                onClick={startNewConversation}
                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                title="محادثة جديدة"
              >
                <Plus className="w-4 h-4 text-white" />
              </button>
              {!inline && (
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                >
                  <ChevronDown className="w-4 h-4 text-white" />
                </button>
              )}
            </div>
          </div>

          {/* Conversations Drawer/History */}
          {showHistory ? (
            <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 p-4 flex flex-col gap-2">
              <div className="flex items-center justify-between pb-2 border-b border-gray-200 dark:border-slate-800 mb-2">
                <span className="font-bold text-xs text-gray-500 dark:text-slate-400">محادثاتك السابقة</span>
                <button 
                  onClick={() => setShowHistory(false)}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer flex items-center"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> العودة للدردشة
                </button>
              </div>

              {conversations.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-gray-400 dark:text-slate-500">
                  <MessageSquare className="w-8 h-8 mb-2 opacity-50" />
                  <p className="text-xs">لا يوجد محادثات سابقة</p>
                </div>
              ) : (
                conversations.map((conv) => (
                  <div 
                    key={conv.id}
                    onClick={() => selectConversation(conv)}
                    className={`flex items-center justify-between p-3 rounded-xl border text-right transition-all cursor-pointer ${
                      activeConversationId === conv.id 
                        ? 'bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-900/50' 
                        : 'bg-white dark:bg-slate-900 border-gray-100 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/55'
                    }`}
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <MessageSquare className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                      <div className="overflow-hidden">
                        <p className="font-bold text-xs truncate text-gray-700 dark:text-slate-350">{conv.title}</p>
                        <span className="text-[10px] text-gray-400 dark:text-slate-500">
                          {new Date(conv.createdAt).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    </div>
                    <button 
                      onClick={(e) => deleteConversation(conv.id, e)}
                      className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          ) : (
            /* Message Area */
            <div className="flex-1 overflow-y-auto p-4 bg-slate-50 dark:bg-slate-950/40 space-y-4">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col justify-center items-center text-center p-6 space-y-5">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/10">
                    <Sparkles className="w-8 h-8 text-yellow-200 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800 dark:text-slate-100 text-sm">مرحباً بك في المساعد التعليمي الذكي!</h4>
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 max-w-[280px] leading-relaxed">
                      أنا هنا لمساعدتك في فهم لغات البرمجة، شرح الأكواد، وحل أي مشاكل تواجهك في دراستك.
                    </p>
                  </div>

                  <div className="w-full space-y-2 mt-2">
                    <p className="text-[10px] text-right font-bold text-gray-400 dark:text-slate-500">اسألني عن:</p>
                    <div className="grid grid-cols-1 gap-2">
                      {suggestionChips.map((chip, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSend(chip.prompt)}
                          className="w-full text-right p-2.5 text-xs text-gray-600 dark:text-slate-350 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-900 hover:bg-indigo-50/20 dark:hover:bg-indigo-950/10 rounded-xl transition-all cursor-pointer shadow-sm"
                        >
                          {chip.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                messages.map((msg, index) => {
                  const isBot = msg.role === 'assistant'
                  return (
                    <div 
                      key={msg.id || index}
                      className={`flex gap-3 max-w-[85%] ${isBot ? 'ml-auto text-right' : 'mr-auto flex-row-reverse text-right'}`}
                    >
                      {/* Avatar */}
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm ${
                        isBot 
                          ? 'bg-indigo-600 text-white' 
                          : 'bg-white dark:bg-slate-800 border border-gray-150 dark:border-slate-700 text-indigo-500'
                      }`}>
                        {isBot ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                      </div>

                      {/* Bubble */}
                      <div className={`p-3.5 rounded-2xl shadow-sm ${
                        isBot 
                          ? 'bg-white dark:bg-slate-900 border border-gray-250/20 dark:border-slate-800 text-gray-800 dark:text-slate-200 rounded-tr-none' 
                          : 'bg-gradient-to-tr from-indigo-600 to-violet-600 text-white rounded-tl-none'
                      }`}>
                        {isBot ? (
                          msg.content === '' ? (
                            <div className="flex items-center gap-1.5 py-1 px-2">
                              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                          ) : (
                            renderFormattedContent(msg.content)
                          )
                        ) : (
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={messagesEndRef} />
            </div>
          )}

          {/* Input Area */}
          <div className="p-3 bg-white dark:bg-slate-900 border-t border-gray-150 dark:border-slate-800 flex gap-2 items-center">
            <textarea
              ref={chatInputRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              disabled={isLoading || showHistory}
              placeholder={showHistory ? "اختر محادثة للبدء..." : "اكتب سؤالك هنا..."}
              className="flex-1 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-850 hover:border-gray-300 focus:border-indigo-500 dark:focus:border-indigo-800 rounded-xl px-3 py-2.5 text-xs outline-none resize-none overflow-y-auto max-h-24 dark:text-white transition-all"
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading || showHistory}
              className="p-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-md hover:shadow-indigo-500/20 active:scale-95 disabled:opacity-50 disabled:shadow-none transition-all cursor-pointer flex-shrink-0"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4 transform rotate-180" />
              )}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
