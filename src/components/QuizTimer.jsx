import { useState, useEffect } from 'react'
import { Timer } from 'lucide-react'

export default function QuizTimer({ duration = 60, onTimeUp }) {
  const [timeLeft, setTimeLeft] = useState(duration)
  useEffect(() => {
    if (timeLeft <= 0) { onTimeUp(); return }
    const timer = setInterval(() => setTimeLeft(t => t - 1), 1000)
    return () => clearInterval(timer)
  }, [timeLeft, onTimeUp])

  const percent = (timeLeft / duration) * 100
  const color = percent > 50 ? 'text-green-600' : percent > 25 ? 'text-yellow-600' : 'text-red-600'
  return (
    <div className={`flex items-center gap-2 font-mono font-bold ${color}`}>
      <Timer size={18} />
      <span>{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</span>
    </div>
  )
}
