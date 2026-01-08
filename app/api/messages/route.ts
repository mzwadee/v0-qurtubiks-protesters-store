import { createAdminClient } from "@/lib/supabase/admin"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get("customerId")

    const supabase = createAdminClient()

    if (customerId) {
      const { data: messages, error } = await supabase
        .from("messages")
        .select("*")
        .eq("customer_id", customerId)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("[v0] Error loading messages:", error.message)
        return NextResponse.json([])
      }

      return NextResponse.json(messages || [])
    } else {
      const { data: messages, error } = await supabase
        .from("messages")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) {
        console.error("[v0] Error loading all messages:", error.message)
        return NextResponse.json([])
      }

      return NextResponse.json(messages || [])
    }
  } catch (error) {
    console.error("[v0] Error in messages GET:", error)
    return NextResponse.json([])
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { customerIds, customers, message } = body

    if (!customerIds || customerIds.length === 0 || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = createAdminClient()

    const messages = customerIds.map((customerId: string, index: number) => ({
      id: `${Date.now()}_${index}`,
      customer_id: customerId,
      customer_name: customers[index]?.name || "Customer",
      message: message,
      read: false,
    }))

    const { data, error } = await supabase.from("messages").insert(messages).select()

    if (error) {
      console.error("[v0] Error creating messages:", error)
      return NextResponse.json({ error: "Failed to create messages" }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Error in messages POST:", error)
    return NextResponse.json({ error: "Failed to create messages" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, read } = body

    if (!id) {
      return NextResponse.json({ error: "Missing message ID" }, { status: 400 })
    }

    const supabase = createAdminClient()

    const { data, error } = await supabase.from("messages").update({ read }).eq("id", id).select().single()

    if (error) {
      console.error("[v0] Error updating message:", error)
      return NextResponse.json({ error: "Failed to update message" }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Error in messages PUT:", error)
    return NextResponse.json({ error: "Failed to update message" }, { status: 500 })
  }
}
