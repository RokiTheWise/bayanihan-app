import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'



// 1. Setup the connection
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY)
console.log("🇵🇭 Bayanihan Bridge Active!")

async function testConnection() {
    console.log("🇵🇭 Connecting to the Bayanihan Network...");

    // 2. Try to fetch any existing reports
    const { data, error } = await supabase
        .from('reports')
        .select('*')

    if (error) {
        console.error("❌ Connection Failed:", error.message)
    } else {
        console.log("✅ Handshake Success! Database is online in Singapore.")
        console.log(`📊 Current Reports in Database: ${data.length}`)
    }
}

testConnection()