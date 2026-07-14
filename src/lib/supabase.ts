import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://eynpooewvzcbhajgzlro.supabase.co'
const supabaseKey = 'sb_publishable_InblwSuEZICXdoO1el5abA_dyLA97u4'

export const supabase = createClient(supabaseUrl, supabaseKey)
