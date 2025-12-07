"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Send, CheckCircle2, Circle, Users, Plus, Trash2, X } from "lucide-react"

interface Customer {
  id: string
  name: string
  email: string
  points: number
  unlimited?: boolean
}

interface Group {
  id: string
  name: string
  memberIds: string[]
}

interface Message {
  id: string
  customer_id: string
  customer_name: string
  message: string
  read: boolean
  created_at: string
}

export function AdminMessaging() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<string[]>([])
  const [messageText, setMessageText] = useState("")
  const [sending, setSending] = useState(false)
  const [showCreateGroup, setShowCreateGroup] = useState(false)
  const [newGroupName, setNewGroupName] = useState("")
  const [selectedForGroup, setSelectedForGroup] = useState<string[]>([])

  useEffect(() => {
    loadCustomers()
    loadGroups()
    loadMessages()
    const interval = setInterval(loadMessages, 5000)
    return () => clearInterval(interval)
  }, [])

  const loadCustomers = async () => {
    try {
      const response = await fetch("/api/customers")
      if (response.ok) {
        const data = await response.json()
        setCustomers(data)
      }
    } catch (error) {
      console.error("[v0] Failed to load customers:", error)
    }
  }

  const loadGroups = async () => {
    try {
      const response = await fetch("/api/groups")
      if (response.ok) {
        const data = await response.json()
        setGroups(data)
      }
    } catch (error) {
      console.error("[v0] Failed to load groups:", error)
    }
  }

  const loadMessages = async () => {
    try {
      const response = await fetch("/api/messages")
      if (response.ok) {
        const data = await response.json()
        setMessages(data)
      }
    } catch (error) {
      console.error("[v0] Failed to load messages:", error)
    }
  }

  const toggleCustomerSelection = (customerId: string) => {
    setSelectedCustomerIds((prev) =>
      prev.includes(customerId) ? prev.filter((id) => id !== customerId) : [...prev, customerId],
    )
  }

  const selectGroup = (group: Group) => {
    // Add all group members to selection (without duplicates)
    setSelectedCustomerIds((prev) => {
      const newSet = new Set([...prev, ...group.memberIds])
      return Array.from(newSet)
    })
  }

  const handleSendMessage = async () => {
    if (selectedCustomerIds.length === 0 || !messageText.trim()) return

    setSending(true)
    try {
      const selectedCustomers = customers.filter((c) => selectedCustomerIds.includes(c.id))

      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerIds: selectedCustomerIds,
          customers: selectedCustomers,
          message: messageText.trim(),
        }),
      })

      if (response.ok) {
        setMessageText("")
        setSelectedCustomerIds([])
        loadMessages()
      }
    } catch (error) {
      console.error("[v0] Failed to send message:", error)
    } finally {
      setSending(false)
    }
  }

  const handleCreateGroup = async () => {
    if (!newGroupName.trim() || selectedForGroup.length === 0) return

    try {
      const response = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newGroupName.trim(),
          memberIds: selectedForGroup,
        }),
      })

      if (response.ok) {
        setNewGroupName("")
        setSelectedForGroup([])
        setShowCreateGroup(false)
        loadGroups()
      }
    } catch (error) {
      console.error("[v0] Failed to create group:", error)
    }
  }

  const handleDeleteGroup = async (groupId: string) => {
    try {
      const response = await fetch("/api/groups", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: groupId }),
      })

      if (response.ok) {
        loadGroups()
      }
    } catch (error) {
      console.error("[v0] Failed to delete group:", error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Groups Section */}
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 ring-1 ring-white/15">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5" />
            Groups
          </h2>
          <Button
            onClick={() => setShowCreateGroup(!showCreateGroup)}
            size="sm"
            className="bg-[#f48a4f] hover:brightness-110 text-[#0c2141]"
          >
            <Plus className="w-4 h-4 mr-1" />
            New Group
          </Button>
        </div>

        {showCreateGroup && (
          <div className="bg-white/5 rounded-xl p-4 mb-4 border border-white/10">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-white">Create New Group</h3>
              <button onClick={() => setShowCreateGroup(false)} className="text-white/60 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <Input
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="Group name (e.g., Testers)"
              className="bg-white/10 border-white/20 text-white placeholder:text-white/50 mb-3"
            />
            <div className="text-sm text-white/70 mb-2">Select members:</div>
            <div className="flex flex-wrap gap-2 mb-3 max-h-32 overflow-y-auto">
              {customers.map((customer) => (
                <button
                  key={customer.id}
                  onClick={() =>
                    setSelectedForGroup((prev) =>
                      prev.includes(customer.id) ? prev.filter((id) => id !== customer.id) : [...prev, customer.id],
                    )
                  }
                  className={`px-3 py-1 rounded-full text-sm transition-all ${
                    selectedForGroup.includes(customer.id)
                      ? "bg-[#f48a4f] text-[#0c2141]"
                      : "bg-white/10 text-white/80 hover:bg-white/20"
                  }`}
                >
                  {customer.name}
                </button>
              ))}
            </div>
            <Button
              onClick={handleCreateGroup}
              disabled={!newGroupName.trim() || selectedForGroup.length === 0}
              className="bg-[#f48a4f] hover:brightness-110 text-[#0c2141]"
            >
              Create Group ({selectedForGroup.length} members)
            </Button>
          </div>
        )}

        {groups.length === 0 ? (
          <p className="text-white/60 text-center py-4">No groups created yet</p>
        ) : (
          <div className="space-y-2">
            {groups.map((group) => (
              <div
                key={group.id}
                className="flex items-center justify-between bg-white/5 rounded-xl p-3 border border-white/10"
              >
                <button
                  onClick={() => selectGroup(group)}
                  className="flex-1 text-left hover:bg-white/5 rounded-lg p-2 -m-2 transition-colors"
                >
                  <div className="font-semibold text-white">{group.name}</div>
                  <div className="text-xs text-white/60">
                    {group.memberIds.length} members:{" "}
                    {customers
                      .filter((c) => group.memberIds.includes(c.id))
                      .map((c) => c.name)
                      .join(", ")}
                  </div>
                </button>
                <button onClick={() => handleDeleteGroup(group.id)} className="text-red-400 hover:text-red-300 p-2">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Send Message Form */}
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 ring-1 ring-white/15">
        <h2 className="text-xl font-bold text-white mb-4">Send Message</h2>
        <div className="space-y-4">
          <div>
            <label className="text-white/90 text-sm mb-2 block">
              Select Recipients ({selectedCustomerIds.length} selected)
            </label>

            {groups.length > 0 && (
              <div className="mb-3">
                <div className="text-xs text-white/60 mb-2">Quick select groups:</div>
                <div className="flex flex-wrap gap-2">
                  {groups.map((group) => (
                    <button
                      key={group.id}
                      onClick={() => selectGroup(group)}
                      className="px-3 py-1.5 rounded-full text-sm bg-purple-500/30 text-purple-200 hover:bg-purple-500/50 transition-all flex items-center gap-1"
                    >
                      <Users className="w-3 h-3" />
                      {group.name} ({group.memberIds.length})
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-2 bg-white/5 rounded-xl border border-white/10">
              {customers.map((customer) => (
                <button
                  key={customer.id}
                  onClick={() => toggleCustomerSelection(customer.id)}
                  className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                    selectedCustomerIds.includes(customer.id)
                      ? "bg-[#f48a4f] text-[#0c2141] font-semibold"
                      : "bg-white/10 text-white/80 hover:bg-white/20"
                  }`}
                >
                  {customer.name}
                </button>
              ))}
            </div>

            {selectedCustomerIds.length > 0 && (
              <button
                onClick={() => setSelectedCustomerIds([])}
                className="text-xs text-white/50 hover:text-white/80 mt-2"
              >
                Clear selection
              </button>
            )}
          </div>
          <div>
            <label className="text-white/90 text-sm mb-2 block">Message</label>
            <Textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Type your message here..."
              className="bg-white/10 border-white/20 text-white placeholder:text-white/50 min-h-[100px]"
            />
          </div>
          <Button
            onClick={handleSendMessage}
            disabled={selectedCustomerIds.length === 0 || !messageText.trim() || sending}
            className="bg-[#f48a4f] hover:brightness-110 text-[#0c2141] font-bold"
          >
            <Send className="w-4 h-4 mr-2" />
            {sending
              ? "Sending..."
              : `Send to ${selectedCustomerIds.length} recipient${selectedCustomerIds.length !== 1 ? "s" : ""}`}
          </Button>
        </div>
      </div>

      {/* Message History */}
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 ring-1 ring-white/15">
        <h2 className="text-xl font-bold text-white mb-4">Message History</h2>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {messages.length === 0 ? (
            <p className="text-white/60 text-center py-8">No messages sent yet</p>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className="bg-white/5 rounded-xl p-4 border border-white/10 flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  {msg.read ? (
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                  ) : (
                    <Circle className="w-5 h-5 text-white/40" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-semibold text-white">{msg.customer_name}</span>
                    <span className="text-xs text-white/50">{new Date(msg.created_at).toLocaleString()}</span>
                  </div>
                  <p className="text-white/80 text-sm">{msg.message}</p>
                  <p className="text-xs text-white/50 mt-1">{msg.read ? "Read by customer" : "Unread"}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
