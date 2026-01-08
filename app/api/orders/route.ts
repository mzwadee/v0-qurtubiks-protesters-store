import { createAdminClient } from "@/lib/supabase/admin"
import { type NextRequest, NextResponse } from "next/server"

export interface Order {
  id: string
  at: string
  personName: string
  customerId?: string
  email?: string
  note: string
  adminNote: string
  items: Array<{
    sku: string
    name: string
    qty: number
    price: number
  }>
  total: number
  status: "open" | "completed"
}

export async function GET() {
  try {
    const supabase = createAdminClient()

    const { data: orders, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Error loading orders from Supabase:", error.message)
      return NextResponse.json([])
    }

    const apiOrders: Order[] = (orders || []).map((o) => ({
      id: o.id,
      at: o.created_at,
      personName: o.customer_name,
      customerId: o.customer_id,
      email: "",
      note: "",
      adminNote: "",
      items: o.items,
      total: Number(o.total),
      status: o.status as "open" | "completed",
    }))

    return NextResponse.json(apiOrders)
  } catch (error) {
    console.error("[v0] Error fetching orders:", error)
    return NextResponse.json([])
  }
}

export async function POST(request: NextRequest) {
  try {
    const orders: Order[] = await request.json()
    console.log("[v0] Saving", orders.length, "orders to Supabase")

    const supabase = createAdminClient()

    const { error: deleteError } = await supabase.from("orders").delete().neq("id", "")

    if (deleteError) {
      console.error("[v0] Error deleting orders:", deleteError)
      return NextResponse.json({ error: "Failed to delete orders" }, { status: 500 })
    }

    const dbOrders = orders.map((o) => ({
      id: o.id,
      customer_id: o.customerId || "",
      customer_name: o.personName,
      items: o.items,
      total: o.total,
      status: o.status,
    }))

    const { error: insertError } = await supabase.from("orders").insert(dbOrders)

    if (insertError) {
      console.error("[v0] Error inserting orders:", insertError)
      return NextResponse.json({ error: "Failed to save orders" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error saving orders:", error)
    return NextResponse.json({ error: "Failed to save orders" }, { status: 500 })
  }
}
