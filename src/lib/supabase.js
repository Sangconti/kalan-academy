import { createClient } from '@supabase/supabase-js'

const supabaseUrl =
  'https://gchimptswrhchpdtemni.supabase.co'

const supabasePublishableKey =
  'sb_publishable_SvjiopVeTVmrlMY0fGCQcA_9Te4Voq6'

if (!supabaseUrl || !supabasePublishableKey) {
  console.warn(
    '⚠️ Configuration Supabase manquante.'
  )
}

export const supabase = createClient(
  supabaseUrl,
  supabasePublishableKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  }
)