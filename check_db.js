import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://iixomkwkclvutdxvqtko.supabase.co'
const supabaseAnonKey = 'sb_publishable_Fsz2EeXDKbLniZ-S-Z20vQ_O8rerIvk'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function check() {
    const { data: reports, error: rErr } = await supabase.from('led_reports').select('*').order('generated_at', { ascending: false }).limit(5)
    console.log('Reports count:', reports?.length, 'Error:', rErr?.message)
    if (reports?.length) {
        reports.forEach(r => console.log(`Report Date: ${r.date}, Avg Price: ${r.overall_avg_price}, Total Prods: ${r.total_products}`))
    }

    const { count, error: pErr } = await supabase.from('led_products').select('*', { count: 'exact', head: true })
    console.log('Products count:', count, 'Error:', pErr?.message)
}

check()
