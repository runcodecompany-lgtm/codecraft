"use client"

import { useState, useTransition } from "react"
import { toggleFollow } from "@/actions/community"
import { UserPlus, UserMinus } from "lucide-react"

interface Props {
    targetUserId: string
    initialIsFollowing: boolean
}

export default function FollowButton({ targetUserId, initialIsFollowing }: Props) {
    const [isFollowing, setIsFollowing] = useState(initialIsFollowing)
    const [isPending, startTransition] = useTransition()

    const handleFollow = () => {
        startTransition(async () => {
            const result = await toggleFollow(targetUserId)
            if (result.success) {
                setIsFollowing(result.following ?? false)
            }
        })
    }

    return (
        <button
            onClick={handleFollow}
            disabled={isPending}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm ${
                isFollowing
                    ? "bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200"
                    : "bg-indigo-600 hover:bg-indigo-500 text-white hover:shadow-indigo-500/10"
            }`}
        >
            {isFollowing ? (
                <>
                    <UserMinus className="w-4 h-4" />
                    <span>إلغاء المتابعة</span>
                </>
            ) : (
                <>
                    <UserPlus className="w-4 h-4" />
                    <span>متابعة</span>
                </>
            )}
        </button>
    )
}
