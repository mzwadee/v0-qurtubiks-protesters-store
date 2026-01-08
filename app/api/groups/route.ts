import { createAdminClient } from "@/lib/supabase/admin"
import { type NextRequest, NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = createAdminClient()

    const { data: groups, error } = await supabase.from("groups").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Error loading groups:", error.message)
      return NextResponse.json([])
    }

    if (!groups || groups.length === 0) {
      return NextResponse.json([])
    }

    const formattedGroups = groups.map((group) => ({
      id: group.id,
      name: group.name,
      memberIds: group.member_ids || [],
      createdAt: group.created_at,
    }))

    return NextResponse.json(formattedGroups)
  } catch (error) {
    console.error("[v0] Error loading groups:", error)
    return NextResponse.json([])
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, memberIds } = await request.json()

    if (!name || !memberIds || memberIds.length === 0) {
      return NextResponse.json({ error: "Name and members are required" }, { status: 400 })
    }

    const supabase = createAdminClient()

    const groupId = Date.now().toString()

    const { error } = await supabase.from("groups").insert([
      {
        id: groupId,
        name,
        member_ids: memberIds,
      },
    ])

    if (error) {
      console.error("[v0] Error creating group:", error)
      return NextResponse.json({ error: "Failed to create group" }, { status: 500 })
    }

    return NextResponse.json({ id: groupId, name, memberIds })
  } catch (error) {
    console.error("[v0] Error creating group:", error)
    return NextResponse.json({ error: "Failed to create group" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json()

    if (!id) {
      return NextResponse.json({ error: "Group ID is required" }, { status: 400 })
    }

    const supabase = createAdminClient()

    const { error } = await supabase.from("groups").delete().eq("id", id)

    if (error) {
      console.error("[v0] Error deleting group:", error)
      return NextResponse.json({ error: "Failed to delete group" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error deleting group:", error)
    return NextResponse.json({ error: "Failed to delete group" }, { status: 500 })
  }
}
