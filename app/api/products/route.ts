import { createAdminClient } from "@/lib/supabase/admin"
import { type NextRequest, NextResponse } from "next/server"

export interface Product {
  sku: string
  name: string
  price: number
  desc: string
  status: "in_stock" | "out_of_stock" | "coming_soon"
  imageUrl?: string
}

const DEFAULT_PRODUCTS: Product[] = [
  {
    sku: "QP-SHIRT-001",
    name: "QurtubloX T-Shirt",
    price: 25,
    desc: "Official QurtubloX merchandise - premium cotton t-shirt",
    status: "in_stock",
  },
  {
    sku: "QP-HOODIE-001",
    name: "QurtubloX Hoodie",
    price: 45,
    desc: "Warm and comfortable hoodie with QurtubloX logo",
    status: "in_stock",
  },
  {
    sku: "QP-CAP-001",
    name: "QurtubloX Cap",
    price: 15,
    desc: "Stylish cap representing the movement",
    status: "coming_soon",
  },
]

export async function GET() {
  try {
    const supabase = createAdminClient()

    const { data: products, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: true })

    if (error) {
      console.error("[v0] Error loading products from Supabase:", error.message)
      return NextResponse.json(DEFAULT_PRODUCTS)
    }

    if (!products || products.length === 0) {
      console.log("[v0] No products found, returning defaults")
      return NextResponse.json(DEFAULT_PRODUCTS)
    }

    const apiProducts: Product[] = products.map((p) => ({
      sku: p.id || "",
      name: p.name || "",
      price: Number(p.price) || 0,
      desc: p.description || "",
      status: (p.status || "in_stock") as "in_stock" | "out_of_stock" | "coming_soon",
      imageUrl: p.image_url || p.image,
    }))

    return NextResponse.json(apiProducts)
  } catch (error) {
    console.error("[v0] Error fetching products:", error)
    return NextResponse.json(DEFAULT_PRODUCTS)
  }
}

export async function POST(request: NextRequest) {
  try {
    const products: Product[] = await request.json()
    console.log("[v0] Saving", products.length, "products to Supabase")

    const supabase = createAdminClient()

    const { error: deleteError } = await supabase.from("products").delete().neq("id", "")

    if (deleteError) {
      console.error("[v0] Error deleting products:", deleteError)
      return NextResponse.json({ error: "Failed to delete products" }, { status: 500 })
    }

    const dbProducts = products.map((p) => ({
      id: p.sku,
      name: p.name,
      price: p.price,
      description: p.desc,
      status: p.status,
      image_url: p.imageUrl || "/placeholder.svg?height=400&width=400",
      image: p.imageUrl || "/placeholder.svg?height=400&width=400",
    }))

    const { error: insertError } = await supabase.from("products").insert(dbProducts)

    if (insertError) {
      console.error("[v0] Error inserting products:", insertError)
      return NextResponse.json({ error: "Failed to save products" }, { status: 500 })
    }

    console.log("[v0] Successfully saved", products.length, "products to Supabase")
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error saving products:", error)
    return NextResponse.json({ error: "Failed to save products" }, { status: 500 })
  }
}
