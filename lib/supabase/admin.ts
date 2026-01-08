import { createClient } from "@supabase/supabase-js"

// Admin client for database operations that need elevated privileges
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

// Initialize database tables if they don't exist
export async function initializeDatabaseTables() {
  const supabase = createAdminClient()

  // Check if customers table exists by trying a simple query
  const { error: checkError } = await supabase.from("customers").select("id").limit(1)

  // If error contains "relation" or "does not exist", tables need to be created
  if (checkError && (checkError.message.includes("relation") || checkError.message.includes("does not exist"))) {
    console.log("[v0] Creating database tables...")

    // Create tables using raw SQL
    const { error: sqlError } = await supabase.rpc("exec_sql", {
      sql: `
        CREATE TABLE IF NOT EXISTS customers (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT NOT NULL,
          password TEXT,
          points INTEGER DEFAULT 100,
          unlimited BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        CREATE TABLE IF NOT EXISTS products (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          price DECIMAL(10,2) NOT NULL,
          image TEXT,
          description TEXT,
          stock INTEGER DEFAULT 0,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        CREATE TABLE IF NOT EXISTS orders (
          id TEXT PRIMARY KEY,
          customer_id TEXT NOT NULL,
          customer_name TEXT NOT NULL,
          customer_email TEXT,
          items JSONB NOT NULL,
          total DECIMAL(10,2) NOT NULL,
          status TEXT DEFAULT 'pending',
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        CREATE TABLE IF NOT EXISTS messages (
          id TEXT PRIMARY KEY,
          customer_id TEXT NOT NULL,
          customer_name TEXT,
          message TEXT NOT NULL,
          read BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        CREATE TABLE IF NOT EXISTS groups (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          member_ids JSONB DEFAULT '[]',
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
      `,
    })

    if (sqlError) {
      console.error("[v0] Failed to create tables via RPC:", sqlError)
    }
  }

  return supabase
}
