import { createClient } from "@/lib/supabase/server"
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

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: customers, error } = await supabase
      .from("customers")
      .select("*")
      .order("created_at", { ascending: true })

    if (error) {
      console.error("[v0] Supabase error:", error.message)
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
    const supabase = await createClient()

    if (body.adminCreate) {
      const { name, email, password } = body

      if (!name || !email || !password) {
        return NextResponse.json({ error: "Name, email, and password are required" }, { status: 400 })
      }

      const { data: existing } = await supabase.from("customers").select("id").ilike("email", email).maybeSingle()

      if (existing) {
        return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 })
      }

      const hashedPassword = hashPassword(password)

      const newCustomer = {
        id: Date.now().toString(),
        name,
        email,
        password: hashedPassword,
        points: 100,
        unlimited: false,
      }

      const { data: inserted, error } = await supabase.from("customers").insert([newCustomer]).select().single()

      if (error) {
        console.error("[v0] Error creating customer:", error)
        return NextResponse.json({ error: "Failed to create customer" }, { status: 500 })
      }

      return NextResponse.json({
        id: inserted.id,
        name: inserted.name,
        email: inserted.email,
        points: inserted.points,
        unlimited: inserted.unlimited,
        createdAt: inserted.created_at,
      })
    }

    const { name, email, password } = body

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Name, email, and password are required" }, { status: 400 })
    }

    const { data: existingCustomers } = await supabase
      .from("customers")
      .select("id")
      .ilike("email", email)
      .maybeSingle()

    if (existingCustomers) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 })
    }

    const hashedPassword = hashPassword(password)

    const newCustomer = {
      id: Date.now().toString(),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      points: 100,
      unlimited: false,
      password: hashedPassword,
    }

    const { data: insertedCustomer, error: insertError } = await supabase
      .from("customers")
      .insert([newCustomer])
      .select()
      .single()

    if (insertError) {
      console.error("[v0] Error creating customer:", insertError)
      return NextResponse.json({ error: "Failed to create customer" }, { status: 500 })
    }

    const customer: Customer = {
      id: insertedCustomer.id,
      name: insertedCustomer.name,
      email: insertedCustomer.email,
      points: insertedCustomer.points,
      unlimited: insertedCustomer.unlimited,
      createdAt: insertedCustomer.created_at,
    }

    return NextResponse.json(customer)
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

    const supabase = await createClient()

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
      return NextResponse.json({ error: "Failed to update customer" }, { status: 500 })
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

    const supabase = await createClient()

    const { error } = await supabase.from("customers").delete().eq("id", id)

    if (error) {
      console.error("[v0] Error deleting customer:", error)
      return NextResponse.json({ error: "Failed to delete customer" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error deleting customer:", error)
    return NextResponse.json({ error: "Failed to delete customer" }, { status: 500 })
  }
}
