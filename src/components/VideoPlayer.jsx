import { useRef, useEffect, useState } from 'react'
import { Play, Pause, RotateCcw } from 'lucide-react'

export default function VideoPlayer({ src, lessonId, onProgress }) {
  const videoRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    const saved = localStorage.getItem(`video-pos-${lessonId}`)
    if (saved) video.currentTime = parseFloat(saved)

    const handleTimeUpdate = () => {
      setProgress(video.currentTime)
      localStorage.setItem(`video-pos-${lessonId}`, video.currentTime)
      if (onProgress) onProgress(video.currentTime)
    }
    const handleLoaded = () => setDuration(video.duration)

    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('loadedmetadata', handleLoaded)
    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('loadedmetadata', handleLoaded)
    }
  }, [lessonId, onProgress, src])

  const togglePlay = () => {
    if (videoRef.current.paused) { videoRef.current.play(); setIsPlaying(true) }
    else { videoRef.current.pause(); setIsPlaying(false) }
  }
  const restart = () => { videoRef.current.currentTime = 0; videoRef.current.play(); setIsPlaying(true) }
  const formatTime = (t) => { if (!t) return '0:00'; const m = Math.floor(t / 60); const s = Math.floor(t % 60).toString().padStart(2, '0'); return `${m}:${s}` }

  return (
    <div className="bg-black rounded-xl overflow-hidden shadow-lg">
      <video ref={videoRef} src={src} className="w-full aspect-video" onClick={togglePlay} playsInline />
      <div className="flex items-center gap-3 px-3 py-2 bg-gray-900 text-white">
        <button onClick={togglePlay} className="hover:text-blue-400 transition">{isPlaying ? <Pause size={20} /> : <Play size={20} />}</button>
        <button onClick={restart} className="hover:text-blue-400 transition"><RotateCcw size={18} /></button>
        <div className="flex-1 h-1 bg-gray-700 rounded-full overflow-hidden">
          <div className="h-full bg-blue-500 transition-all" style={{ width: `${duration ? (progress / duration) * 100 : 0}%` }} />
        </div>
        <span className="text-xs text-gray-400">{formatTime(progress)} / {formatTime(duration)}</span>
      </div>
    </div>
  )
}
