"use server"

import prisma from "@/lib/prisma"
import { cookies } from "next/headers"

const CART_COOKIE_NAME = "ccc_cart_items"

/**
 * Get current courses in the cart
 */
export async function getCartItems() {
  try {
    const cookieStore = await cookies()
    const cartCookie = cookieStore.get(CART_COOKIE_NAME)?.value

    if (!cartCookie) {
      return { success: true, items: [] }
    }

    const courseIds: string[] = JSON.parse(cartCookie)

    if (courseIds.length === 0) {
      return { success: true, items: [] }
    }

    const courses = await prisma.course.findMany({
      where: {
        id: { in: courseIds }
      },
      select: {
        id: true,
        title: true,
        slug: true,
        coverImage: true,
        price: true,
        priceInCoins: true,
        level: true,
        teacher: {
          select: {
            name: true
          }
        }
      }
    })

    return { success: true, items: courses }
  } catch (error) {
    console.error("Error in getCartItems:", error)
    return { success: false, error: "فشل استرجاع عناصر السلة.", items: [] }
  }
}

/**
 * Add a course to the shopping cart
 */
export async function addToCart(courseId: string) {
  try {
    const cookieStore = await cookies()
    const cartCookie = cookieStore.get(CART_COOKIE_NAME)?.value

    let courseIds: string[] = []
    if (cartCookie) {
      courseIds = JSON.parse(cartCookie)
    }

    if (courseIds.includes(courseId)) {
      return { success: false, error: "هذه الدورة مضافة بالفعل في السلة." }
    }

    // Verify course exists
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true }
    })

    if (!course) {
      return { success: false, error: "الدورة التدريبية غير موجودة." }
    }

    courseIds.push(courseId)

    // Save cookie valid for 7 days
    cookieStore.set(CART_COOKIE_NAME, JSON.stringify(courseIds), {
      maxAge: 7 * 24 * 60 * 60,
      path: "/"
    })

    return { success: true }
  } catch (error) {
    console.error("Error in addToCart:", error)
    return { success: false, error: "فشل إضافة العنصر إلى السلة." }
  }
}

/**
 * Remove a course from the shopping cart
 */
export async function removeFromCart(courseId: string) {
  try {
    const cookieStore = await cookies()
    const cartCookie = cookieStore.get(CART_COOKIE_NAME)?.value

    if (!cartCookie) {
      return { success: true }
    }

    let courseIds: string[] = JSON.parse(cartCookie)
    courseIds = courseIds.filter(id => id !== courseId)

    cookieStore.set(CART_COOKIE_NAME, JSON.stringify(courseIds), {
      maxAge: 7 * 24 * 60 * 60,
      path: "/"
    })

    return { success: true }
  } catch (error) {
    console.error("Error in removeFromCart:", error)
    return { success: false, error: "فشل إزالة العنصر من السلة." }
  }
}

/**
 * Clear all items in the shopping cart
 */
export async function clearCart() {
  try {
    const cookieStore = await cookies()
    cookieStore.delete(CART_COOKIE_NAME)
    return { success: true }
  } catch (error) {
    console.error("Error in clearCart:", error)
    return { success: false, error: "فشل إفراغ السلة." }
  }
}
