import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://iixomkwkclvutdxvqtko.supabase.co'
const supabaseAnonKey = 'sb_publishable_Fsz2EeXDKbLniZ-S-Z20vQ_O8rerIvk'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
