import { createClient } from '@supabase/supabase-js'

// TODO: replace with your osfcspan Supabase project URL + publishable (anon) key
// Settings -> API in your Supabase project dashboard
const supabaseUrl = 'YOUR_SUPABASE_PROJECT_URL'
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY'

export const supabase = createClient(supabaseUrl, supabaseKey)
