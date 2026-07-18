"use client"

import { useState, useTransition, useEffect, useRef } from "react"
import {
  sendMessage, markMessageRead, getConversation,
  editMessage, deleteMessage,
} from "@/actions/community"
import {
  Send, MessageCircle, User, Check, CheckCheck,
  Pencil, Trash2, X, Plus, Search,
} from "lucide-react"

interface Props {
  currentUserId: string
  conversations: any[]
  initialMessages: any[]
  allUsers: any[]
  lastMessageMap: Record<string, { content: string; createdAt: Date }>
}

export default function MessagingClient({
  currentUserId, conversations, initialMessages, allUsers, lastMessageMap,
}: Props) {
  const [selectedUser, setSelectedUser] = useState<any>(conversations[0] || null)
  const [messages, setMessages] = useState(initialMessages)
  const [content, setContent] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [showNewChat, setShowNewChat] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState("")
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const editInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus()
    }
  }, [editingId])

  const scrollToBottom = () => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100)
  }

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim() || !selectedUser) return
    startTransition(async () => {
      const result = await sendMessage({ receiverId: selectedUser.id, content: content.trim() })
      if (result.error) {
        setError(result.error)
      } else {
        setError(null)
        setContent("")
        if (result.message) {
          setMessages(prev => [...prev, { ...result.message, sender: { name: "أنت" }, senderId: currentUserId }])
          scrollToBottom()
        }
      }
    })
  }

  const handleSelectUser = (user: any) => {
    setSelectedUser(user)
    setMessages([])
    setError(null)
    setEditingId(null)
    setDeletingId(null)
    setShowNewChat(false)
    startTransition(async () => {
      const msgs = await getConversation(currentUserId, user.id)
      setMessages(msgs)
      scrollToBottom()
      const unread = msgs.filter((m: any) => m.senderId === user.id && !m.isRead)
      for (const msg of unread) {
        await markMessageRead(msg.id)
      }
    })
  }

  const handleStartNewChat = (userId: string) => {
    const user = allUsers.find(u => u.id === userId)
    if (user) {
      setShowNewChat(false)
      setSearchQuery("")
      handleSelectUser(user)
    }
  }

  const handleEdit = (msg: any) => {
    setEditingId(msg.id)
    setEditContent(msg.content)
  }

  const handleSaveEdit = () => {
    if (!editingId || !editContent.trim()) return
    startTransition(async () => {
      const result = await editMessage(editingId, editContent.trim())
      if (result.success) {
        setMessages(prev => prev.map(m =>
          m.id === editingId ? { ...m, content: editContent.trim(), isEdited: true, editedAt: new Date() } : m
        ))
        setEditingId(null)
        setEditContent("")
      } else {
        setError(result.error || null)
      }
    })
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditContent("")
  }

  const handleDelete = (messageId: string) => {
    startTransition(async () => {
      const result = await deleteMessage(messageId)
      if (result.success) {
        setMessages(prev => prev.map(m =>
          m.id === messageId ? { ...m, isDeleted: true, content: "" } : m
        ))
        setDeletingId(null)
      } else {
        setError(result.error || null)
      }
    })
  }

  const filteredUsers = allUsers.filter(
    u => u.id !== currentUserId &&
    (u.name || "").toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getInitials = (name: string) => {
    return (name || "?").split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase()
  }

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat("ar-SA", { hour: "2-digit", minute: "2-digit" }).format(new Date(date))
  }

  const formatDate = (date: Date) => {
    const d = new Date(date)
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    if (days === 0) return formatTime(date)
    if (days === 1) return "أمس"
    if (days < 7) return `${days} أيام`
    return new Intl.DateTimeFormat("ar-SA", { month: "short", day: "numeric" }).format(d)
  }

  return (
    <div
      style={{
        display: "flex",
        height: "calc(100vh - 260px)",
        minHeight: 500,
        borderRadius: "var(--ccc-radius-2xl)",
        background: "#fff",
        boxShadow: "0 1px 4px rgba(30,41,59,0.04), 0 4px 16px rgba(30,41,59,0.04)",
        overflow: "hidden",
      }}
    >
      {/* ─── Sidebar ─── */}
      <div
        style={{
          width: 320,
          flexShrink: 0,
          display: "flex", flexDirection: "column",
          borderLeft: "1px solid var(--ccn-200)",
        }}
      >
        {/* Sidebar Header */}
        <div style={{
          padding: "var(--ccc-space-md) var(--ccc-space-lg)",
          borderBottom: "1px solid var(--ccn-200)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <h3 style={{ font: "var(--ccc-h4)", color: "var(--ccn-900)", margin: 0, fontWeight: 700 }}>
            المحادثات
            <span style={{
              marginRight: 8,
              font: "var(--ccc-caption)", color: "var(--ccn-400)", fontWeight: 500,
            }}>
              {conversations.length}
            </span>
          </h3>
          <button
            onClick={() => setShowNewChat(prev => !prev)}
            style={{
              width: 32, height: 32, borderRadius: "var(--ccc-radius-lg)",
              background: "var(--ccc-500)", color: "#fff", border: "none",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", transition: "all 0.15s",
            }}
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* New Chat Panel */}
        {showNewChat && (
          <div style={{
            padding: "var(--ccc-space-md) var(--ccc-space-lg)",
            borderBottom: "1px solid var(--ccn-200)",
            background: "var(--ccn-50)",
          }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "6px 12px",
              borderRadius: "var(--ccc-radius-lg)",
              background: "#fff",
              border: "1px solid var(--ccn-200)",
              marginBottom: "var(--ccc-space-sm)",
            }}>
              <Search className="w-4 h-4" style={{ color: "var(--ccn-400)", flexShrink: 0 }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث عن مستخدم..."
                style={{
                  flex: 1, border: "none", outline: "none",
                  font: "var(--ccc-caption)", color: "var(--ccn-900)",
                  background: "transparent",
                }}
              />
            </div>
            <div style={{ maxHeight: 160, overflowY: "auto", display: "flex", flexDirection: "column", gap: 2 }}>
              {filteredUsers.length === 0 ? (
                <div style={{ font: "var(--ccc-caption)", color: "var(--ccn-400)", textAlign: "center", padding: 8 }}>
                  لا يوجد مستخدمين
                </div>
              ) : (
                filteredUsers.map((u: any) => (
                  <button
                    key={u.id}
                    onClick={() => handleStartNewChat(u.id)}
                    style={{
                      display: "flex", alignItems: "center", gap: 8,
                      padding: "6px 8px", borderRadius: "var(--ccc-radius-md)",
                      border: "none", background: "transparent", cursor: "pointer",
                      font: "var(--ccc-caption)", color: "var(--ccn-800)",
                      transition: "background 0.1s",
                      textAlign: "right", width: "100%",
                    }}
                  >
                    <div style={{
                      width: 28, height: 28, borderRadius: "50%",
                      background: "var(--ccc-500)", color: "#fff",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      font: "700 11px/1 var(--ccc-font-sans)", flexShrink: 0,
                    }}>
                      {getInitials(u.name)}
                    </div>
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {u.name || "عضو"}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {/* Conversations List */}
        <div style={{ flex: 1, overflowY: "auto", padding: "var(--ccc-space-sm)" }}>
          {conversations.length === 0 && !showNewChat ? (
            <div style={{ textAlign: "center", padding: "var(--ccc-space-2xl) var(--ccc-space-lg)", color: "var(--ccn-400)" }}>
              <MessageCircle className="w-10 h-10" style={{ margin: "0 auto var(--ccc-space-md)", opacity: 0.3 }} />
              <div style={{ font: "var(--ccc-body-sm)", fontWeight: 600, color: "var(--ccn-500)", marginBottom: 4 }}>
                لا توجد محادثات
              </div>
              <div style={{ font: "var(--ccc-caption)", color: "var(--ccn-400)" }}>
                ابدأ محادثة جديدة مع زملائك
              </div>
            </div>
          ) : (
            conversations.map((user: any) => {
              const lastMsg = lastMessageMap[user.id]
              return (
                <button
                  key={user.id}
                  onClick={() => handleSelectUser(user)}
                  style={{
                    width: "100%",
                    display: "flex", alignItems: "center", gap: "var(--ccc-space-sm)",
                    padding: "10px 12px",
                    borderRadius: "var(--ccc-radius-xl)",
                    border: "none", cursor: "pointer",
                    background: selectedUser?.id === user.id
                      ? "color-mix(in srgb, var(--ccc-500) 6%, transparent)"
                      : "transparent",
                    textAlign: "right", transition: "background 0.15s",
                  }}
                >
                  <div style={{
                    width: 40, height: 40, borderRadius: "50%",
                    background: "linear-gradient(135deg, var(--ccc-500), var(--ccc-700))",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#fff", font: "700 14px/1 var(--ccc-font-sans)", flexShrink: 0,
                  }}>
                    {getInitials(user.name)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{
                        font: "var(--ccc-body-sm)", fontWeight: 700, color: "var(--ccn-900)",
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }}>
                        {user.name || "عضو"}
                      </span>
                      {lastMsg && (
                        <span style={{ font: "var(--ccc-micro)", color: "var(--ccn-400)", flexShrink: 0, marginRight: 8 }}>
                          {formatDate(lastMsg.createdAt)}
                        </span>
                      )}
                    </div>
                    <div style={{
                      font: "var(--ccc-caption)", color: "var(--ccn-500)", marginTop: 2,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {lastMsg ? lastMsg.content || "تم حذف الرسالة" : "اضغط للمحادثة"}
                    </div>
                  </div>
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* ─── Messages Area ─── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {selectedUser ? (
          <>
            {/* Header */}
            <div style={{
              display: "flex", alignItems: "center", gap: "var(--ccc-space-sm)",
              padding: "var(--ccc-space-md) var(--ccc-space-lg)",
              borderBottom: "1px solid var(--ccn-200)",
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: "50%",
                background: "linear-gradient(135deg, var(--ccc-500), var(--ccc-700))",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff", font: "700 14px/1 var(--ccc-font-sans)", flexShrink: 0,
              }}>
                {getInitials(selectedUser.name)}
              </div>
              <div>
                <div style={{ font: "var(--ccc-body-sm)", fontWeight: 700, color: "var(--ccn-900)" }}>
                  {selectedUser.name || "عضو"}
                </div>
                <div style={{ font: "var(--ccc-caption)", color: "var(--ccn-400)" }}>
                  {messages.length > 0 ? `${messages.length} رسالة` : "بداية محادثة"}
                </div>
              </div>
            </div>

            {/* Messages */}
            <div style={{
              flex: 1, overflowY: "auto",
              padding: "var(--ccc-space-lg)",
              display: "flex", flexDirection: "column", gap: 8,
            }}>
              {messages.length === 0 && (
                <div style={{
                  textAlign: "center", padding: "var(--ccc-space-2xl) 0",
                  color: "var(--ccn-400)",
                }}>
                  <div style={{ font: "var(--ccc-body-sm)", color: "var(--ccn-500)", fontWeight: 600 }}>
                    ابدأ المحادثة مع {selectedUser.name || "هذا العضو"}
                  </div>
                </div>
              )}
              {messages.map((msg: any) => {
                const isMe = msg.senderId === currentUserId
                const isDeleted = msg.isDeleted
                const isEditing = editingId === msg.id

                if (isDeleted && !isMe) return null

                return (
                  <div
                    key={msg.id}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: isMe ? "flex-start" : "flex-end",
                      alignSelf: isMe ? "flex-end" : "flex-start",
                      maxWidth: "72%",
                      position: "relative",
                    }}
                  >
                    {/* Message bubble */}
                    <div
                      style={{
                        padding: isEditing ? 4 : "10px 16px",
                        borderRadius: isMe
                          ? "var(--ccc-radius-xl) var(--ccc-radius-xl) var(--ccc-radius-sm) var(--ccc-radius-xl)"
                          : "var(--ccc-radius-xl) var(--ccc-radius-xl) var(--ccc-radius-xl) var(--ccc-radius-sm)",
                        background: isDeleted
                          ? "var(--ccn-100)"
                          : isMe
                            ? "var(--ccc-500)"
                            : "var(--ccn-50)",
                        color: isMe && !isDeleted ? "#fff" : "var(--ccn-800)",
                        lineHeight: 1.6,
                        position: "relative",
                        width: isEditing ? "100%" : "auto",
                        minWidth: isEditing ? 200 : 60,
                        transition: "all 0.15s ease",
                      }}
                    >
                      {isDeleted ? (
                        <div style={{ font: "var(--ccc-caption)", color: "var(--ccn-400)", fontStyle: "italic" }}>
                          <Trash2 className="w-3 h-3" style={{ display: "inline", verticalAlign: "middle", marginLeft: 4 }} />
                          تم حذف الرسالة
                        </div>
                      ) : isEditing ? (
                        <div style={{ display: "flex", gap: 4 }}>
                          <input
                            ref={editInputRef}
                            type="text"
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSaveEdit()
                              if (e.key === "Escape") handleCancelEdit()
                            }}
                            style={{
                              flex: 1,
                              padding: "8px 12px",
                              borderRadius: "var(--ccc-radius-md)",
                              border: "2px solid var(--ccc-500)",
                              outline: "none",
                              font: "var(--ccc-body-sm)",
                              color: "var(--ccn-900)",
                              background: "#fff",
                            }}
                          />
                          <button
                            onClick={handleSaveEdit}
                            style={{
                              padding: "8px 10px",
                              borderRadius: "var(--ccc-radius-md)",
                              background: "var(--ccc-500)",
                              color: "#fff",
                              border: "none", cursor: "pointer",
                              font: "var(--ccc-caption)", fontWeight: 700,
                            }}
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            style={{
                              padding: "8px 10px",
                              borderRadius: "var(--ccc-radius-md)",
                              background: "var(--ccn-100)",
                              color: "var(--ccn-600)",
                              border: "none", cursor: "pointer",
                              font: "var(--ccc-caption)", fontWeight: 700,
                            }}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <div style={{ font: "var(--ccc-body-sm)", wordBreak: "break-word" }}>
                            {msg.content}
                          </div>
                        </>
                      )}

                      {/* Meta: time + edited + read */}
                      {!isEditing && !isDeleted && (
                        <div style={{
                          display: "flex", alignItems: "center", gap: 4,
                          marginTop: 4,
                          justifyContent: isMe ? "flex-end" : "flex-start",
                        }}>
                          <span style={{
                            font: "var(--ccc-micro)",
                            color: isMe ? "rgba(255,255,255,0.6)" : "var(--ccn-400)",
                          }}>
                            {formatTime(msg.createdAt)}
                          </span>
                          {msg.isEdited && (
                            <span style={{
                              font: "var(--ccc-micro)",
                              color: isMe ? "rgba(255,255,255,0.5)" : "var(--ccn-400)",
                            }}>
                              (معدلة)
                            </span>
                          )}
                          {isMe && (
                            msg.isRead
                              ? <CheckCheck className="w-3 h-3" style={{ color: "rgba(255,255,255,0.6)" }} />
                              : <Check className="w-3 h-3" style={{ color: "rgba(255,255,255,0.4)" }} />
                          )}
                        </div>
                      )}
                    </div>

                    {/* Action buttons (own messages, not deleted, not editing) */}
                    {isMe && !isDeleted && !isEditing && (
                      <div style={{
                        display: "flex", gap: 2,
                        marginTop: 2,
                        opacity: 0,
                        transition: "opacity 0.15s",
                      }}
                        onMouseEnter={(e) => { const target = e.currentTarget as HTMLElement; target.style.opacity = "1" }}
                        onMouseLeave={(e) => { const target = e.currentTarget as HTMLElement; target.style.opacity = "0" }}
                      >
                        <button
                          onClick={() => handleEdit(msg)}
                          title="تعديل"
                          style={{
                            padding: "3px 6px",
                            borderRadius: "var(--ccc-radius-sm)",
                            border: "none", background: "transparent",
                            color: "var(--ccn-400)", cursor: "pointer",
                            fontSize: 10,
                            transition: "all 0.1s",
                          }}
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                        {deletingId === msg.id ? (
                          <span style={{ display: "flex", gap: 2 }}>
                            <button
                              onClick={() => handleDelete(msg.id)}
                              title="تأكيد الحذف"
                              style={{
                                padding: "3px 6px",
                                borderRadius: "var(--ccc-radius-sm)",
                                border: "none",
                                background: "var(--ccr-500)", color: "#fff", cursor: "pointer",
                                fontSize: 9, fontWeight: 700,
                              }}
                            >
                              حذف
                            </button>
                            <button
                              onClick={() => setDeletingId(null)}
                              title="إلغاء"
                              style={{
                                padding: "3px 6px",
                                borderRadius: "var(--ccc-radius-sm)",
                                border: "none",
                                background: "var(--ccn-100)", color: "var(--ccn-500)", cursor: "pointer",
                                fontSize: 9, fontWeight: 700,
                              }}
                            >
                              إلغاء
                            </button>
                          </span>
                        ) : (
                          <button
                            onClick={() => setDeletingId(msg.id)}
                            title="حذف"
                            style={{
                              padding: "3px 6px",
                              borderRadius: "var(--ccc-radius-sm)",
                              border: "none", background: "transparent",
                              color: "var(--ccn-400)", cursor: "pointer",
                              fontSize: 10,
                              transition: "all 0.1s",
                            }}
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div style={{
              padding: "var(--ccc-space-md) var(--ccc-space-lg)",
              borderTop: "1px solid var(--ccn-200)",
            }}>
              <form onSubmit={handleSend} style={{ display: "flex", alignItems: "center", gap: "var(--ccc-space-sm)" }}>
                <input
                  type="text"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="اكتب رسالة..."
                  style={{
                    flex: 1,
                    padding: "12px 16px",
                    borderRadius: "var(--ccc-radius-xl)",
                    border: "1.5px solid var(--ccn-200)",
                    outline: "none",
                    font: "var(--ccc-body-sm)", color: "var(--ccn-900)",
                    background: "var(--ccn-50)",
                    transition: "border-color 0.15s",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "var(--ccc-500)"
                    e.currentTarget.style.boxShadow = "0 0 0 3px color-mix(in srgb, var(--ccc-500) 12%, transparent)"
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "var(--ccn-200)"
                    e.currentTarget.style.boxShadow = "none"
                  }}
                />
                <button
                  type="submit"
                  disabled={isPending || !content.trim()}
                  style={{
                    width: 44, height: 44,
                    borderRadius: "var(--ccc-radius-xl)",
                    background: content.trim() ? "var(--ccc-500)" : "var(--ccn-200)",
                    color: content.trim() ? "#fff" : "var(--ccn-400)",
                    border: "none", cursor: content.trim() ? "pointer" : "default",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 0.15s",
                    flexShrink: 0,
                  }}
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
              {error && (
                <div style={{ font: "var(--ccc-caption)", color: "var(--ccr-500)", marginTop: 6 }}>
                  {error}
                </div>
              )}
            </div>
          </>
        ) : (
          <div style={{
            flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
            color: "var(--ccn-400)",
          }}>
            <div style={{ textAlign: "center" }}>
              <MessageCircle className="w-16 h-16" style={{ margin: "0 auto 16px", opacity: 0.2 }} />
              <div style={{ font: "var(--ccc-h4)", color: "var(--ccn-500)", fontWeight: 600 }}>
                اختر محادثة أو ابدأ محادثة جديدة
              </div>
              <div style={{ font: "var(--ccc-caption)", color: "var(--ccn-400)", marginTop: 4 }}>
                تواصل مع زملائك في مجتمع Code Craft
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
