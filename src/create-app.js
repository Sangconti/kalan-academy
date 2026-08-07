const fs = require('fs');
const content = `import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { supabase } from './lib/supabase'
import { useAppStore } from './stores/useAppStore'
import HomePage from './pages/HomePage'
import SubjectsPage from './pages/SubjectsPage'
import LessonsPage from './pages/LessonsPage'
import VideoPage from './pages/VideoPage'
import ProfilePage from './pages/ProfilePage'
import BottomNav from './components/BottomNav'

function App() {
  const { setUser, setProfile } = useAppStore()

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user)
        const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
        if (data) setProfile(data)
      } else {
        setUser(null)
        setProfile(null)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-white max-w-md mx-auto border-x border-gray-100 relative">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/subjects" element={<SubjectsPage />} />
          <Route path="/lessons" element={<LessonsPage />} />
          <Route path="/video/:lessonId" element={<VideoPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
        <BottomNav />
      </div>
    </BrowserRouter>
  )
}

export default App
`;
fs.writeFileSync('App.jsx', content, 'utf8');
console.log('Fichier App.jsx cree avec succes !');