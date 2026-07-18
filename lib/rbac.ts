// lib/rbac.ts
import prisma from "@/lib/prisma"
import { UserRole } from "@prisma/client"

// Permissions enum list
export const Permissions = {
  MANAGE_USERS: "manage_users",
  MANAGE_COURSES: "manage_courses",
  MANAGE_LESSONS: "manage_lessons",
  MANAGE_TESTS: "manage_tests",
  MANAGE_ARTICLES: "manage_articles",
  MANAGE_GAMES: "manage_games",
  MANAGE_SETTINGS: "manage_settings",
} as const

export type PermissionKey = typeof Permissions[keyof typeof Permissions]

/**
 * Seed initial roles and permissions into the database.
 */
export async function seedRolesAndPermissions() {
  const roles = [
    { name: UserRole.STUDENT, desc: "طالب يتعلم على المنصة" },
    { name: UserRole.TEACHER, desc: "معلم ينشئ المقررات والمقالات" },
    { name: UserRole.MODERATOR, desc: "مشرف مجتمع ومحتوى" },
    { name: UserRole.ADMIN, desc: "مدير النظام" },
    { name: UserRole.SUPER_ADMIN, desc: "المدير العام للنظام بصلاحيات كاملة" },
  ]

  const permissions = [
    { name: Permissions.MANAGE_USERS, desc: "إدارة المستخدمين وحالتهم وصلاحياتهم" },
    { name: Permissions.MANAGE_COURSES, desc: "إدارة المقررات الدراسية بالكامل" },
    { name: Permissions.MANAGE_LESSONS, desc: "إدارة الدروس والمحتوى" },
    { name: Permissions.MANAGE_TESTS, desc: "إدارة الاختبارات والأسئلة" },
    { name: Permissions.MANAGE_ARTICLES, desc: "إدارة المقالات والمدونة" },
    { name: Permissions.MANAGE_GAMES, desc: "إدارة التحديات البرمجية والألعاب" },
    { name: Permissions.MANAGE_SETTINGS, desc: "إدارة إعدادات المنصة العامة" },
  ]

  // Create roles
  for (const r of roles) {
    await prisma.role.upsert({
      where: { name: r.name as string },
      update: { description: r.desc },
      create: { name: r.name as string, description: r.desc },
    })
  }

  // Create permissions
  for (const p of permissions) {
    await prisma.permission.upsert({
      where: { name: p.name },
      update: { description: p.desc },
      create: { name: p.name, description: p.desc },
    })
  }

  // Assign permissions to roles
  const superAdminRole = await prisma.role.findUnique({ where: { name: UserRole.SUPER_ADMIN as string } })
  const adminRole = await prisma.role.findUnique({ where: { name: UserRole.ADMIN as string } })
  const teacherRole = await prisma.role.findUnique({ where: { name: UserRole.TEACHER as string } })

  const dbPermissions = await prisma.permission.findMany()

  if (superAdminRole) {
    // Super Admin gets all permissions
    for (const perm of dbPermissions) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: superAdminRole.id,
            permissionId: perm.id,
          },
        },
        update: {},
        create: {
          roleId: superAdminRole.id,
          permissionId: perm.id,
        },
      })
    }
  }

  if (adminRole) {
    // Admin gets all except settings maybe, but let's give it most
    for (const perm of dbPermissions) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: adminRole.id,
            permissionId: perm.id,
          },
        },
        update: {},
        create: {
          roleId: adminRole.id,
          permissionId: perm.id,
        },
      })
    }
  }

  if (teacherRole) {
    // Teacher gets courses, lessons, tests, articles, games
    const teacherPerms = [
      Permissions.MANAGE_COURSES,
      Permissions.MANAGE_LESSONS,
      Permissions.MANAGE_TESTS,
      Permissions.MANAGE_ARTICLES,
      Permissions.MANAGE_GAMES,
    ]
    for (const permName of teacherPerms) {
      const dbPerm = dbPermissions.find((p) => p.name === permName)
      if (dbPerm) {
        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: teacherRole.id,
              permissionId: dbPerm.id,
            },
          },
          update: {},
          create: {
            roleId: teacherRole.id,
            permissionId: dbPerm.id,
          },
        })
      }
    }
  }
}

/**
 * Check if a user has a specific permission based on their role
 */
export async function hasPermission(userId: string, permissionName: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, status: true, teacherProfile: { select: { applicationStatus: true } } },
  })

  if (!user || user.status !== "ACTIVE") {
    return false
  }

  if (user.role === UserRole.TEACHER && user.teacherProfile?.applicationStatus !== "APPROVED") {
    return false
  }

  // Super Admin bypass
  if (user.role === UserRole.SUPER_ADMIN) {
    return true
  }

  const role = await prisma.role.findUnique({
    where: { name: user.role as string },
  })

  if (!role) return false

  const permission = await prisma.permission.findUnique({
    where: { name: permissionName },
  })

  if (!permission) return false

  const rolePermission = await prisma.rolePermission.findUnique({
    where: {
      roleId_permissionId: {
        roleId: role.id,
        permissionId: permission.id,
      },
    },
  })

  return !!rolePermission
}

/**
 * Check if a user has a specific role
 */
export async function hasRole(userId: string, role: UserRole): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, status: true, teacherProfile: { select: { applicationStatus: true } } },
  })

  if (!user || user.status !== "ACTIVE") return false
  if (user.role === UserRole.TEACHER && user.teacherProfile?.applicationStatus !== "APPROVED") return false

  // SUPER_ADMIN has access to everything ADMIN has
  if (user.role === UserRole.SUPER_ADMIN) return true
  if (user.role === UserRole.ADMIN && role !== UserRole.SUPER_ADMIN) return true
  if (user.role === role) return true

  return false
}

/**
 * Check permission or throw unauthorized error
 */
export async function checkPermissionOrThrow(userId: string, permissionName: string) {
  const allowed = await hasPermission(userId, permissionName)
  if (!allowed) {
    throw new Error("غير مصرح لك بإجراء هذه العملية.")
  }
}
