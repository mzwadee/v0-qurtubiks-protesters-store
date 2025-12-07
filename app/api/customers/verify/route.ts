import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

function hashPassword(password: string): string {
  const normalized = password.trim()
  return "qxpw_" + Buffer.from(normalized).toString("base64")
}

export async function POST(request: NextRequest) {
  try {
    const { id, password } = await request.json()

    if (!id || !password) {
      return NextResponse.json({ error: "Missing id or password" }, { status: 400 })
    }

    const supabase = await createClient()

    const { data: customer, error } = await supabase.from("customers").select("*").eq("id", id).single()

    if (error || !customer) {
      console.error("[v0] Customer not found:", error?.message)
      return NextResponse.json({ error: "Customer not found" }, { status: 404 })
    }

    if (!customer.password) {
      const hashedInput = hashPassword(password)
      const { error: updateError } = await supabase.from("customers").update({ password: hashedInput }).eq("id", id)

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
      return NextResponse.json({ error: "Invalid password" }, { status: 401 })
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
