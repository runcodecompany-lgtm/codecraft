import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { getServerSession } from "@/lib/auth"
import MessagingClient from "./messaging-client"
import Link from "next/link"
import { ChevronRight } from "lucide-react"

export const dynamic = "force-dynamic"

export const metadata = {
    title: "الرسائل الخاصة | Code Craft Core",
    description: "تواصل مع زملائك وموجهيك في مجتمع البرمجة",
}

export default async function MessagesPage() {
    const session = await getServerSession()
    if (!session?.id) {
        redirect("/login?callbackUrl=/community/messages")
    }

    const userId = session.id

    const userMessages = await prisma.privateMessage.findMany({
        where: {
            OR: [
                { senderId: userId },
                { receiverId: userId },
            ],
        },
        select: {
            senderId: true,
            receiverId: true,
            content: true,
            createdAt: true,
        },
        orderBy: { createdAt: "desc" },
    })

    const contactIds = Array.from(
        new Set(
            userMessages.map(m => m.senderId === userId ? m.receiverId : m.senderId)
        )
    )

    const conversations = await prisma.user.findMany({
        where: { id: { in: contactIds } },
        select: { id: true, name: true, avatar: true },
    })

    let initialMessages: any[] = []
    if (conversations.length > 0) {
        initialMessages = await prisma.privateMessage.findMany({
            where: {
                OR: [
                    { senderId: userId, receiverId: conversations[0].id },
                    { senderId: conversations[0].id, receiverId: userId },
                ],
            },
            orderBy: { createdAt: "asc" },
            take: 100,
        })
    }

    const allUsers = await prisma.user.findMany({
        select: { id: true, name: true, avatar: true },
        take: 100,
    })

    const lastMessageMap: Record<string, { content: string; createdAt: Date }> = {}
    for (const msg of userMessages) {
        const otherId = msg.senderId === userId ? msg.receiverId : msg.senderId
        if (!lastMessageMap[otherId]) {
            lastMessageMap[otherId] = { content: msg.content, createdAt: msg.createdAt }
        }
    }

    return (
        <main className="min-h-screen" style={{ background: "var(--ccn-50)" }} dir="rtl">
            <div style={{
                background: "#141C2F",
                padding: "var(--ccc-space-2xl) 0",
            }}>
                <div style={{ maxWidth: 1120, margin: "0 auto", padding: "0 var(--ccc-space-xl)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: "var(--ccc-space-md)" }}>
                        <Link href="/community" style={{ color: "rgba(255,255,255,0.5)", textDecoration: "none", transition: "color 0.15s" }}>المجتمع</Link>
                        <ChevronRight className="w-3.5 h-3.5" />
                        <span style={{ color: "rgba(255,255,255,0.7)" }}>الرسائل الخاصة</span>
                    </div>
                    <h1 style={{ font: "700 28px/36px var(--ccc-font-sans)", color: "#fff", margin: 0 }}>
                        الرسائل الخاصة
                    </h1>
                    <p style={{ font: "var(--ccc-body-sm)", color: "rgba(255,255,255,0.45)", marginTop: 4 }}>
                        تواصل مباشرة مع المبرمجين الآخرين في مجتمع Code Craft
                    </p>
                </div>
            </div>

            <div style={{ maxWidth: 1120, margin: "0 auto", padding: "var(--ccc-space-xl)" }}>
                <MessagingClient
                    currentUserId={userId}
                    conversations={conversations}
                    initialMessages={initialMessages}
                    allUsers={allUsers}
                    lastMessageMap={lastMessageMap}
                />
            </div>
        </main>
    )
}
