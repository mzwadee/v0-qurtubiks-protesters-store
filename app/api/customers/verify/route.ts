import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

function hashPassword(password: string): string {
  const normalized = password.trim()
  return "qxpw_" + Buffer.from(normalized).toString("base64")
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, email, password } = body

    if (!password) {
      return NextResponse.json({ error: "Missing password" }, { status: 400 })
    }

    if (!id && !email) {
      return NextResponse.json({ error: "Missing id or email" }, { status: 400 })
    }

    const supabase = createAdminClient()

    let customer
    let error

    if (email) {
      const result = await supabase.from("customers").select("*").ilike("email", email.trim()).single()
      customer = result.data
      error = result.error
    } else {
      const result = await supabase.from("customers").select("*").eq("id", id).single()
      customer = result.data
      error = result.error
    }

    if (error || !customer) {
      if (error?.message?.includes("relation") || error?.code === "42P01") {
        return NextResponse.json({ error: "Database not initialized. Please try again." }, { status: 503 })
      }
      console.error("[v0] Customer not found:", error?.message)
      return NextResponse.json({ error: "Account not found. Please check your email or sign up." }, { status: 404 })
    }

    // If no password set, set it now
    if (!customer.password) {
      const hashedInput = hashPassword(password)
      const { error: updateError } = await supabase
        .from("customers")
        .update({ password: hashedInput })
        .eq("id", customer.id)

      if (updateError) {
        console.error("[v0] Error setting password:", updateError)
        return NextResponse.json({ error: "Failed to set password" }, { status: 500 })
      }

      return NextResponse.json({
        id: customer.id,
        name: customer.name,
        email: customer.email,
        points: customer.points,
        unlimited: customer.unlimited,
        createdAt: customer.created_at,
      })
    }

    const hashedInput = hashPassword(password)

    if (customer.password !== hashedInput) {
      return NextResponse.json({ error: "Invalid password. Please try again." }, { status: 401 })
    }

    return NextResponse.json({
      id: customer.id,
      name: customer.name,
      email: customer.email,
      points: customer.points,
      unlimited: customer.unlimited,
      createdAt: customer.created_at,
    })
  } catch (error) {
    console.error("[v0] Error verifying password:", error)
    return NextResponse.json({ error: "Failed to verify password" }, { status: 500 })
  }
}
