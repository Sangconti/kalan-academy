import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://gchimptswrhchpdtemni.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdjaGltcHRzd3JoY2hwZHRlbW5pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxNjkyMzcsImV4cCI6MjEwMDc0NTIzN30.w3D4qvczOP7A2uhnKmAsaEJzktnlPIshM-aPiLxCbQM'

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY manquant dans .env — mode mock activé')
}

export const supabase = createClient(supabaseUrl || 'http://localhost', supabaseAnonKey || 'dummy')
