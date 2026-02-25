// Check Supabase schema
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
    const { data, error } = await supabase.from('channels').select('*').limit(1);
    console.log("Error:", error);
    console.log("Data structure:", data && data.length > 0 ? Object.keys(data[0]) : "No data, but query succeeded");

    if (!data || data.length === 0) {
        // Force a small error to get the hint
        const res = await fetch(`${process.env.VITE_SUPABASE_URL}/rest/v1/channels?limit=1`, {
            headers: {
                "apikey": process.env.VITE_SUPABASE_ANON_KEY,
                "Authorization": `Bearer ${process.env.VITE_SUPABASE_ANON_KEY}`
            }
        })
        console.log(await res.json());
    }
}

check();
