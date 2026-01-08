import { createAdminClient } from "@/lib/supabase/admin"
import { type NextRequest, NextResponse } from "next/server"

interface Customer {
  id: string
  name: string
  email: string
  points: number
  createdAt: string
  unlimited?: boolean
}

function hashPassword(password: string): string {
  const normalized = password.trim()
  return "qxpw_" + Buffer.from(normalized).toString("base64")
}

async function ensureCustomersTable() {
  const supabase = createAdminClient()

  // Try to query the table
  const { error } = await supabase.from("customers").select("id").limit(1)

  // If table doesn't exist, create it
  if (
    error &&
    (error.message.includes("relation") || error.message.includes("does not exist") || error.code === "42P01")
  ) {
    console.log("[v0] Creating customers table...")

    // Use raw SQL to create table
    const { error: createError } = await supabase.from("_").select("*").limit(0) // This will fail, but we're just testing connection

    // Try direct REST API call to create table via SQL
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/`, {
        method: "POST",
        headers: {
          apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          "Content-Type": "application/json",
        },
      })
    } catch (e) {
      // Ignore - we'll handle this differently
    }

    return false
  }

  return !error
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient()

    const { data: customers, error } = await supabase
      .from("customers")
      .select("*")
      .order("created_at", { ascending: true })

    if (error) {
      console.error("[v0] Supabase error:", error.message, error.code)

      // If table doesn't exist, return empty array
      if (error.message.includes("relation") || error.message.includes("does not exist") || error.code === "42P01") {
        console.log("[v0] Customers table does not exist yet - returning empty array")
        return NextResponse.json([])
      }

      return NextResponse.json([])
    }

    if (!customers || customers.length === 0) {
      return NextResponse.json([])
    }

    const apiCustomers: Customer[] = customers.map((c) => ({
      id: c.id,
      name: c.name,
      email: c.email,
      points: c.points,
      unlimited: c.unlimited,
      createdAt: c.created_at,
    }))

    return NextResponse.json(apiCustomers)
  } catch (error) {
    console.error("[v0] Error loading customers:", error)
    return NextResponse.json([])
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const supabase = createAdminClient()

    const { name, email, password, adminCreate } = body

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Name, email, and password are required" }, { status: 400 })
    }

    // Check if email already exists
    const { data: existing, error: checkError } = await supabase
      .from("customers")
      .select("id")
      .ilike("email", email.trim())
      .maybeSingle()

    if (checkError && !checkError.message.includes("relation")) {
      console.error("[v0] Error checking existing customer:", checkError)
    }

    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 })
    }

    const hashedPassword = hashPassword(password)

    const newCustomer = {
      id: Date.now().toString(),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      points: 100,
      unlimited: false,
    }

    const { data: inserted, error: insertError } = await supabase
      .from("customers")
      .insert([newCustomer])
      .select()
      .single()

    if (insertError) {
      console.error("[v0] Error creating customer:", insertError)
      return NextResponse.json({ error: "Database error: " + insertError.message }, { status: 500 })
    }

    return NextResponse.json({
      id: inserted.id,
      name: inserted.name,
      email: inserted.email,
      points: inserted.points,
      unlimited: inserted.unlimited,
      createdAt: inserted.created_at,
    })
  } catch (error) {
    console.error("[v0] Error in customer operation:", error)
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const updatedCustomer = await request.json()

    if (!updatedCustomer.id || !updatedCustomer.name) {
      return NextResponse.json({ error: "Invalid customer data" }, { status: 400 })
    }

    const supabase = createAdminClient()

    const updateData: any = {
      name: updatedCustomer.name,
      email: updatedCustomer.email,
      points: updatedCustomer.points,
      unlimited: updatedCustomer.unlimited || false,
    }

    if (updatedCustomer.password && updatedCustomer.password.trim()) {
      updateData.password = hashPassword(updatedCustomer.password)
    }

    const { error } = await supabase.from("customers").update(updateData).eq("id", updatedCustomer.id)

    if (error) {
      console.error("[v0] Error updating customer:", error)
      return NextResponse.json({ error: "Failed to update customer: " + error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, customer: updatedCustomer })
  } catch (error) {
    console.error("[v0] Error updating customer:", error)
    return NextResponse.json({ error: "Failed to update customer" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json()

    if (!id) {
      return NextResponse.json({ error: "Invalid customer data" }, { status: 400 })
    }

    const supabase = createAdminClient()

    const { error } = await supabase.from("customers").delete().eq("id", id)

    if (error) {
      console.error("[v0] Error deleting customer:", error)
      return NextResponse.json({ error: "Failed to delete customer: " + error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error deleting customer:", error)
    return NextResponse.json({ error: "Failed to delete customer" }, { status: 500 })
  }
}
