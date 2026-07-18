// app/dashboard/student/roadmap/page.tsx
import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import prisma from "@/lib/prisma"
import RoadmapClient from "./roadmap-client"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "خريطة التعلم | Code Craft Core",
  description: "استعرض خريطتك التعليمية التفاعلية وتابع تقدمك في مساراتك المختارة.",
}

export default async function RoadmapPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true, name: true },
  })
  if (!dbUser) redirect("/login")

  // Get all user tracks with full pathway info and courses
  const userTracks = await prisma.userTrack.findMany({
    where: { userId: user.id },
    include: {
      track: {
        include: {
          parent: { select: { id: true, name: true, icon: true } },
          courses: {
            where: { isPublished: true },
            orderBy: [{ level: "asc" }, { createdAt: "asc" }],
            select: {
              id: true,
              title: true,
              slug: true,
              description: true,
              level: true,
              coverImage: true,
              priceInCoins: true,
              _count: { select: { enrollments: true, modules: true } },
              enrollments: {
                where: { userId: user.id },
                select: { id: true, progress: true, isCompleted: true },
              },
            },
          },
          learningPaths: {
            orderBy: { level: "asc" },
            include: {
              courses: {
                orderBy: { order: "asc" },
                include: {
                  course: {
                    select: {
                      id: true,
                      title: true,
                      slug: true,
                      description: true,
                      level: true,
                      coverImage: true,
                      priceInCoins: true,
                      _count: { select: { enrollments: true, modules: true } },
                      enrollments: {
                        where: { userId: user.id },
                        select: { id: true, progress: true, isCompleted: true },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
  })

  const serialized = userTracks.map((ut) => ({
    id: ut.id,
    level: ut.level,
    progress: ut.progress,
    isPrimary: ut.isPrimary,
    track: {
      id: ut.track.id,
      name: ut.track.name,
      description: ut.track.description,
      icon: ut.track.icon,
      parent: ut.track.parent,
      courses: ut.track.courses.map((c) => ({
        id: c.id,
        title: c.title,
        slug: c.slug,
        description: c.description,
        level: c.level,
        coverImage: c.coverImage,
        priceInCoins: c.priceInCoins,
        moduleCount: c._count.modules,
        enrollmentCount: c._count.enrollments,
        enrollment: c.enrollments[0] ?? null,
      })),
      learningPaths: ut.track.learningPaths.map((lp) => ({
        id: lp.id,
        level: lp.level,
        title: lp.title,
        description: lp.description,
        courses: lp.courses.map((lpc) => ({
          order: lpc.order,
          course: {
            id: lpc.course.id,
            title: lpc.course.title,
            slug: lpc.course.slug,
            description: lpc.course.description,
            level: lpc.course.level,
            coverImage: lpc.course.coverImage,
            priceInCoins: lpc.course.priceInCoins,
            moduleCount: lpc.course._count.modules,
            enrollmentCount: lpc.course._count.enrollments,
            enrollment: lpc.course.enrollments[0] ?? null,
          },
        })),
      })),
    },
  }))

  return <RoadmapClient userTracks={serialized} userName={dbUser.name ?? ""} />
}
