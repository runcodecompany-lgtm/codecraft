// components/user-provider.tsx
"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

interface UserSession {
  id: string
  email: string
  name: string | null
  role: "GUEST" | "STUDENT" | "TEACHER" | "MODERATOR" | "ADMIN" | "SUPER_ADMIN"
  craftCoins: number
  streakCount: number
  referralCode: string
  referredById: string | null
  createdAt: string
  updatedAt: string
}

interface UserContextType {
  user: UserSession | null
  loading: boolean
  refreshUser: () => Promise<void>
}

const UserContext = createContext<UserContextType>({
  user: null,
  loading: true,
  refreshUser: async () => {},
})

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserSession | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.user) {
        setUser(null)
        setLoading(false)
        return
      }

      // Fetch the synchronized database record (with role, coins, etc.)
      const res = await fetch("/api/auth/session")
      if (res.ok) {
        const data = await res.json()
        setUser(data.user)
      } else {
        setUser(null)
      }
    } catch (err) {
      console.error("Error refreshing client user session:", err)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Initial fetch
    refreshUser()

    // Listen for auth state transitions in Supabase
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "SIGNED_OUT") {
        refreshUser()
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return (
    <UserContext.Provider value={{ user, loading, refreshUser }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider")
  }
  return context
}
