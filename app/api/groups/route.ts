import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()

    // Get all groups with their members
    const { data: groups, error: groupsError } = await supabase
      .from("message_groups")
      .select("*")
      .order("created_at", { ascending: false })

    if (groupsError) {
      console.error("[v0] Error loading groups:", groupsError)
      return NextResponse.json([])
    }

    if (!groups || groups.length === 0) {
      return NextResponse.json([])
    }

    // Get members for each group
    const groupsWithMembers = await Promise.all(
      groups.map(async (group) => {
        const { data: members } = await supabase
          .from("message_group_members")
          .select("customer_id")
          .eq("group_id", group.id)

        return {
          id: group.id,
          name: group.name,
          memberIds: members?.map((m) => m.customer_id) || [],
          createdAt: group.created_at,
        }
      }),
    )

    return NextResponse.json(groupsWithMembers)
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

    const supabase = await createClient()

    const groupId = Date.now().toString()

    // Create the group
    const { error: groupError } = await supabase.from("message_groups").insert([{ id: groupId, name }])

    if (groupError) {
      console.error("[v0] Error creating group:", groupError)
      return NextResponse.json({ error: "Failed to create group" }, { status: 500 })
    }

    // Add members
    const memberInserts = memberIds.map((customerId: string) => ({
      id: `${groupId}_${customerId}`,
      group_id: groupId,
      customer_id: customerId,
    }))

    const { error: membersError } = await supabase.from("message_group_members").insert(memberInserts)

    if (membersError) {
      console.error("[v0] Error adding group members:", membersError)
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

    const supabase = await createClient()

    // Delete group (members will be cascade deleted)
    const { error } = await supabase.from("message_groups").delete().eq("id", id)

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
