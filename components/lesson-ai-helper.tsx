// components/lesson-ai-helper.tsx
'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Sparkles, Send, Bot, User, Loader2, RefreshCw } from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

interface LessonAIHelperProps {
  lessonId: string
  courseId: string
  lessonTitle: string
}

export default function LessonAIHelper({ lessonId, courseId, lessonTitle }: LessonAIHelperProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  
  const chatEndRef = useRef<HTMLDivElement>(null)

  const quickPrompts = [
    { label: '📝 لخص الدرس', text: 'هل يمكنك تلخيص هذا الدرس بالنقاط الرئيسية والفرعية المهمة؟' },
    { label: '💡 الفكرة الأساسية', text: 'ما هي الفكرة الجوهرية والمهارات الأساسية التي يجب أن أتعلمها من هذا الدرس؟' },
    { label: '💻 كود تجريبي', text: 'هل يمكنك تزويدي بكود تجريبي بسيط يشرح المفهوم الأساسي في هذا الدرس؟' },
  ]

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || input
    if (!text.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    // Placeholder for stream
    const botMessageId = (Date.now() + 1).toString()
    const botMsg: Message = {
      id: botMessageId,
      role: 'assistant',
      content: '',
    }
    setMessages(prev => [...prev, botMsg])

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          conversationId: conversationId || undefined,
          context: {
            lessonId,
            courseId,
            pageType: 'LESSON',
          }
        })
      })

      if (!response.ok) {
        throw new Error('فشل الاتصال بالذكاء الاصطناعي')
      }

      const returnedConvId = response.headers.get('X-Conversation-Id')
      if (returnedConvId && !conversationId) {
        setConversationId(returnedConvId)
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let done = false
      let fullResponse = ''

      while (!done) {
        const { value, done: doneReading } = await reader!.read()
        done = doneReading
        const chunk = decoder.decode(value)
        fullResponse += chunk

        setMessages(prev => 
          prev.map(m => m.id === botMessageId ? { ...m, content: fullResponse } : m)
        )
      }

    } catch (error: any) {
      console.error('Lesson AI helper error:', error)
      setMessages(prev => 
        prev.map(m => m.id === botMessageId ? { ...m, content: `حدث خطأ: ${error.message || error}` } : m)
      )
    } finally {
      setIsLoading(false)
    }
  }

  const resetChat = () => {
    setMessages([])
    setConversationId(null)
  }

  // Simple formatting for code and bold
  const formatContent = (text: string) => {
    if (!text) return null
    const parts = text.split(/(```[\s\S]*?```)/g)
    
    return parts.map((part, index) => {
      if (part.startsWith('```')) {
        const match = part.match(/```(\w*)\n([\s\S]*?)```/)
        const lang = match ? match[1] : ''
        const code = match ? match[2] : part.slice(3, -3)
        
        return (
          <div key={index} className="my-2 font-mono text-[11px] overflow-x-auto rounded-lg bg-slate-950 text-slate-200 border border-slate-800 text-left" style={{ direction: 'ltr' }}>
            <div className="bg-slate-900 px-2.5 py-1 border-b border-slate-800 text-slate-400 select-none flex justify-between items-center text-[9px]">
              <span>{lang || 'code'}</span>
              <button 
                onClick={() => navigator.clipboard.writeText(code.trim())}
                className="hover:text-white transition-colors bg-slate-800 px-1.5 py-0.5 rounded cursor-pointer"
              >
                نسخ
              </button>
            </div>
            <pre className="p-2.5 overflow-x-auto"><code>{code.trim()}</code></pre>
          </div>
        )
      }
      
      let renderedText = part
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/`(.*?)`/g, '<code class="bg-slate-800 text-indigo-300 px-1 py-0.5 rounded font-mono text-xs font-bold">$1</code>')
        .replace(/^- (.*?)$/gm, '<li>$1</li>')
      
      if (renderedText.includes('<li>')) {
        renderedText = `<ul class="list-disc pr-4 my-1.5 space-y-1">${renderedText}</ul>`
      }
      
      return (
        <div 
          key={index} 
          className="whitespace-pre-line leading-relaxed text-xs"
          dangerouslySetInnerHTML={{ __html: renderedText }}
        />
      )
    })
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden flex flex-col h-[480px]">
      {/* Header */}
      <div className="px-4 py-3.5 border-b border-slate-800 bg-slate-800/40 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
          <h3 className="font-bold text-xs">مساعد الدرس الذكي</h3>
        </div>
        {messages.length > 0 && (
          <button 
            onClick={resetChat}
            className="text-[10px] text-slate-400 hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            بدء جديد
          </button>
        )}
      </div>

      {/* Messages / Prompts Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col justify-center items-center text-center space-y-4">
            <Bot className="w-10 h-10 text-indigo-400 opacity-80" />
            <div>
              <p className="font-bold text-xs text-slate-200">هل لديك سؤال حول درس "{lessonTitle}"؟</p>
              <p className="text-[10px] text-slate-500 mt-1 max-w-[200px]">
                اسألني عن محتوى الدرس أو الأكواد المذكورة وسأقوم بشرحها لك فوراً.
              </p>
            </div>
            
            <div className="w-full space-y-1.5 pt-2">
              {quickPrompts.map((p, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(p.text)}
                  className="w-full text-right p-2 text-xs text-slate-350 bg-slate-950/40 border border-slate-850 hover:border-indigo-900 hover:bg-indigo-950/20 rounded-xl transition-all cursor-pointer text-ellipsis overflow-hidden"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m, idx) => {
            const isBot = m.role === 'assistant'
            return (
              <div 
                key={m.id || idx} 
                className={`flex gap-2.5 max-w-[90%] ${isBot ? 'ml-auto' : 'mr-auto flex-row-reverse'}`}
              >
                {/* Mini Avatar */}
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 text-white ${isBot ? 'bg-indigo-600' : 'bg-slate-700'}`}>
                  {isBot ? <Bot className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                </div>

                {/* Content Bubble */}
                <div className={`p-2.5 rounded-xl text-slate-200 text-xs ${isBot ? 'bg-slate-950/50 border border-slate-800 rounded-tr-none' : 'bg-indigo-600 text-white rounded-tl-none'}`}>
                  {isBot && m.content === '' ? (
                    <div className="flex items-center gap-1 py-1 px-1">
                      <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  ) : (
                    isBot ? formatContent(m.content) : <p className="leading-relaxed whitespace-pre-wrap">{m.content}</p>
                  )}
                </div>
              </div>
            )
          })
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <form 
        onSubmit={(e) => { e.preventDefault(); handleSend() }}
        className="p-2.5 border-t border-slate-800 bg-slate-950/40 flex gap-2 items-center"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isLoading}
          placeholder="اسأل عن الدرس..."
          className="flex-1 bg-slate-900 border border-slate-800 hover:border-slate-750 focus:border-indigo-700 rounded-xl px-3 py-2 text-xs outline-none text-white transition-all"
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-md hover:shadow-indigo-500/10 active:scale-95 disabled:opacity-50 disabled:shadow-none transition-all cursor-pointer"
        >
          {isLoading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Send className="w-3.5 h-3.5 transform rotate-180" />
          )}
        </button>
      </form>
    </div>
  )
}
