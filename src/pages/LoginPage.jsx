import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { BookOpen, Mail, Lock, LogIn, UserPlus } from 'lucide-react'

export default function LoginPage() {
  const navigate = useNavigate()
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        alert('Inscription réussie ! Connecte-toi maintenant.')
        setIsSignUp(false)
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        navigate('/')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-700 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="flex flex-col items-center mb-6">
          <div className="bg-blue-100 p-3 rounded-full mb-3"><BookOpen size={32} className="text-blue-600" /></div>
          <h1 className="text-2xl font-bold text-gray-800">Kalan Academy</h1>
          <p className="text-gray-500 text-sm mt-1">Apprends partout, même hors-ligne</p>
        </div>
        <h2 className="text-xl font-semibold text-center mb-4">{isSignUp ? "Créer un compte" : "Se connecter"}</h2>
        {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Mail size={18} className="absolute left-3 top-3 text-gray-400" />
            <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required />
          </div>
          <div className="relative">
            <Lock size={18} className="absolute left-3 top-3 text-gray-400" />
            <input type="password" placeholder="Mot de passe" value={password} onChange={e => setPassword(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required minLength={6} />
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50">
            {isSignUp ? <UserPlus size={18} /> : <LogIn size={18} />}
            {loading ? 'Chargement...' : isSignUp ? "S'inscrire" : "Se connecter"}
          </button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-4">
          {isSignUp ? "Déjà un compte ?" : "Pas encore de compte ?"}{' '}
          <button onClick={() => setIsSignUp(!isSignUp)} className="text-blue-600 font-medium hover:underline">
            {isSignUp ? "Se connecter" : "S'inscrire"}
          </button>
        </p>
      </div>
    </div>
  )
}
