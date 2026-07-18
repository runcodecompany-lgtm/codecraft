// components/video-player.tsx
"use client"

import React, { useRef, useState, useEffect } from "react"
import { Play, Pause, RotateCcw, Volume2, Maximize, PlayCircle, Loader2 } from "lucide-react"

interface VideoPlayerProps {
  lessonId: string
  videoUrl: string
  initialWatchedSeconds?: number
}

export default function VideoPlayer({
  lessonId,
  videoUrl,
  initialWatchedSeconds = 0,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0)
  const [isPromptingResume, setIsPromptingResume] = useState(initialWatchedSeconds > 3)
  const [syncing, setSyncing] = useState(false)

  const isYouTube = videoUrl.includes("youtube.com") || videoUrl.includes("youtu.be")
  const embedUrl = isYouTube
    ? videoUrl
        .replace("watch?v=", "embed/")
        .replace("youtu.be/", "youtube.com/embed/") +
      `?enablejsapi=1&origin=${typeof window !== "undefined" ? window.location.origin : ""}`
    : videoUrl

  // Handle HTML5 Video progress reporting
  const lastSavedTime = useRef(0)

  const reportProgress = async (secs: number, dur: number) => {
    try {
      setSyncing(true)
      const res = await fetch("/api/lessons/video-progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lessonId,
          seconds: Math.floor(secs),
          duration: Math.floor(dur || 600), // Fallback if duration is 0
        }),
      })
      if (res.ok) {
        lastSavedTime.current = secs
      }
    } catch (err) {
      console.error("Failed to sync video progress:", err)
    } finally {
      setSyncing(false)
    }
  }

  // Periodic reporting for HTML5
  const handleTimeUpdate = () => {
    if (!videoRef.current) return
    const current = videoRef.current.currentTime
    const dur = videoRef.current.duration
    setCurrentTime(current)

    // Save every 10 seconds or when finished
    if (Math.abs(current - lastSavedTime.current) >= 10 || current === dur) {
      reportProgress(current, dur)
    }
  }

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return
    setDuration(videoRef.current.duration)
  }

  const handlePlayPause = () => {
    if (!videoRef.current) return
    if (videoRef.current.paused) {
      videoRef.current.play()
      setIsPlaying(true)
    } else {
      videoRef.current.pause()
      setIsPlaying(false)
      reportProgress(videoRef.current.currentTime, videoRef.current.duration)
    }
  }

  const changeSpeed = (speed: number) => {
    if (!videoRef.current) return
    videoRef.current.playbackRate = speed
    setPlaybackSpeed(speed)
  }

  const toggleFullscreen = () => {
    if (!containerRef.current) return
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch((err) => {
        console.error("Error attempting to enable full-screen mode:", err.message)
      })
    } else {
      document.exitFullscreen()
    }
  }

  const resumeFromLast = () => {
    setIsPromptingResume(false)
    if (videoRef.current) {
      videoRef.current.currentTime = initialWatchedSeconds
      videoRef.current.play()
      setIsPlaying(true)
    }
  }

  // YouTube Iframe API Integration
  useEffect(() => {
    if (!isYouTube) return

    let player: any = null
    const iframeId = `yt-player-${lessonId}`
    
    // Load YouTube API script
    let tag = document.getElementById("yt-iframe-api")
    if (!tag) {
      tag = document.createElement("script")
      tag.id = "yt-iframe-api"
      ;(tag as HTMLScriptElement).src = "https://www.youtube.com/iframe_api"
      const firstScriptTag = document.getElementsByTagName("script")[0]
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag)
    }

    // Set up check interval to bind player once API is ready
    let bindInterval = setInterval(() => {
      if ((window as any).YT && (window as any).YT.Player) {
        clearInterval(bindInterval)
        try {
          player = new (window as any).YT.Player(iframeId, {
            events: {
              onStateChange: (event: any) => {
                // event.data states: 1 = playing, 2 = paused, 0 = ended
                if (event.data === 1) {
                  setIsPlaying(true)
                } else if (event.data === 2) {
                  setIsPlaying(false)
                  const time = player.getCurrentTime()
                  const dur = player.getDuration()
                  reportProgress(time, dur)
                } else if (event.data === 0) {
                  setIsPlaying(false)
                  const dur = player.getDuration()
                  reportProgress(dur, dur)
                }
              },
            },
          })
        } catch (e) {
          console.error("Error binding YouTube player:", e)
        }
      }
    }, 1000)

    // Periodically save progress for YouTube while playing
    const ytProgressInterval = setInterval(() => {
      if (player && typeof player.getCurrentTime === "function" && isPlaying) {
        const time = player.getCurrentTime()
        const dur = player.getDuration()
        reportProgress(time, dur)
      }
    }, 10000)

    return () => {
      clearInterval(bindInterval)
      clearInterval(ytProgressInterval)
    }
  }, [isYouTube, lessonId, isPlaying])

  return (
    <div
      ref={containerRef}
      className="relative rounded-2xl overflow-hidden border border-slate-800 bg-black aspect-video group flex flex-col justify-end"
    >
      {/* Resume Prompt Overlay */}
      {isPromptingResume && (
        <div className="absolute inset-0 bg-slate-950/90 z-20 flex flex-col items-center justify-center p-6 text-center gap-4 animate-fade-in">
          <PlayCircle className="w-16 h-16 text-indigo-500 animate-pulse" />
          <div>
            <h3 className="text-lg font-bold text-white">استكمال المشاهدة؟</h3>
            <p className="text-xs text-slate-400 mt-1">
              لقد توقفت عند الدقيقة {Math.floor(initialWatchedSeconds / 60)}:
              {(initialWatchedSeconds % 60).toString().padStart(2, "0")}.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={resumeFromLast}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-sm text-white shadow-md shadow-indigo-500/20 transition-all"
            >
              استئناف من حيث توقفت
            </button>
            <button
              onClick={() => setIsPromptingResume(false)}
              className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm font-bold text-slate-300 transition-all"
            >
              البدء من الأول
            </button>
          </div>
        </div>
      )}

      {/* Sync Status Badge */}
      {syncing && (
        <div className="absolute top-4 right-4 bg-slate-900/80 border border-slate-800 px-3 py-1 rounded-full flex items-center gap-1.5 z-10 text-[10px] text-slate-400 font-bold">
          <Loader2 className="w-3 h-3 animate-spin text-indigo-400" />
          <span>جاري المزامنة...</span>
        </div>
      )}

      {/* Iframe for YouTube or Video Tag */}
      {isYouTube ? (
        <iframe
          id={`yt-player-${lessonId}`}
          src={embedUrl}
          className="w-full h-full absolute inset-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      ) : (
        <video
          ref={videoRef}
          src={videoUrl}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          className="w-full h-full object-contain"
          onClick={handlePlayPause}
        />
      )}

      {/* Custom HTML5 Video Controls Overlays (Only for native video) */}
      {!isYouTube && !isPromptingResume && (
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-between gap-4 z-10">
          <button
            onClick={handlePlayPause}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-all"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>

          {/* Speed Selector */}
          <div className="flex items-center gap-1">
            {[0.5, 1.0, 1.5, 2.0].map((speed) => (
              <button
                key={speed}
                onClick={() => changeSpeed(speed)}
                className={`text-[10px] font-bold px-2 py-1 rounded transition-all ${
                  playbackSpeed === speed
                    ? "bg-indigo-600 text-white"
                    : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
                }`}
              >
                {speed}x
              </button>
            ))}
          </div>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-all mr-auto"
          >
            <Maximize className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}
