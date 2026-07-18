import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { getServerSession } from "@/lib/auth"
import NewTopicClient from "./new-topic-client"

export const metadata = {
    title: "موضوع جديد | المنتديات",
}

interface Props {
    searchParams: Promise<{ forumId?: string }>
}

export default async function NewTopicPage({ searchParams }: Props) {
    const session = await getServerSession()
    if (!session) redirect("/login")

    const { forumId } = await searchParams

    const forums = await prisma.forum.findMany({
        where: { isActive: true },
        orderBy: { order: "asc" },
        select: { id: true, title: true },
    })

    return <NewTopicClient forums={forums} defaultForumId={forumId} />
}
