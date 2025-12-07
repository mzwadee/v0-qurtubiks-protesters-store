"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { X, Bell, ChevronDown, ChevronUp } from "lucide-react"

interface Message {
  id: string
  customer_id: string
  customer_name: string
  message: string
  read: boolean
  created_at: string
}

export function UserNotifications() {
  const [messages, setMessages] = useState<Message[]>([])
  const [customerId, setCustomerId] = useState<string | null>(null)
  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(new Set())

  useEffect(() => {
    const customerData = localStorage.getItem("customer")
    if (customerData) {
      try {
        const customer = JSON.parse(customerData)
        setCustomerId(customer.id)
      } catch (e) {
        console.error("[v0] Failed to parse customer data")
      }
    }
  }, [])

  useEffect(() => {
    if (!customerId) return

    loadMessages()
    const interval = setInterval(loadMessages, 5000)
    return () => clearInterval(interval)
  }, [customerId])

  const loadMessages = async () => {
    if (!customerId) return

    try {
      const response = await fetch(`/api/messages?customerId=${customerId}`)
      if (response.ok) {
        const data = await response.json()
        const unreadMessages = data.filter((m: Message) => !m.read)
        setMessages(unreadMessages)
      }
    } catch (error) {
      console.error("[v0] Failed to load messages:", error)
    }
  }

  const handleMarkAsRead = async (messageId: string) => {
    try {
      const response = await fetch("/api/messages", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: messageId, read: true }),
      })

      if (response.ok) {
        setMessages((prev) => prev.filter((m) => m.id !== messageId))
        setExpandedMessages((prev) => {
          const next = new Set(prev)
          next.delete(messageId)
          return next
        })
      }
    } catch (error) {
      console.error("[v0] Failed to mark message as read:", error)
    }
  }

  const toggleExpand = (messageId: string) => {
    setExpandedMessages((prev) => {
      const next = new Set(prev)
      if (next.has(messageId)) {
        next.delete(messageId)
      } else {
        next.add(messageId)
      }
      return next
    })
  }

  const needsTruncation = (text: string) => text.length > 100

  const getTruncatedText = (text: string) => {
    if (text.length <= 100) return text
    return text.substring(0, 100) + "..."
  }

  if (messages.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 max-w-sm w-full">
      {messages.map((message) => {
        const isExpanded = expandedMessages.has(message.id)
        const shouldTruncate = needsTruncation(message.message)

        return (
          <div
            key={message.id}
            className="bg-gradient-to-br from-[#0c2141] to-[#99074E] text-white rounded-xl p-4 shadow-2xl ring-1 ring-white/20 animate-in slide-in-from-top-5"
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#f48a4f] flex items-center justify-center">
                <Bell className="w-5 h-5 text-[#0c2141]" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-sm mb-1">Message from Admin</h3>
                <p className="text-sm text-white/90">
                  {isExpanded || !shouldTruncate ? message.message : getTruncatedText(message.message)}
                </p>
                {shouldTruncate && (
                  <button
                    onClick={() => toggleExpand(message.id)}
                    className="flex items-center gap-1 text-xs text-[#f48a4f] hover:text-[#f48a4f]/80 mt-2 font-semibold"
                  >
                    {isExpanded ? (
                      <>
                        <ChevronUp className="w-3 h-3" />
                        Show Less
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-3 h-3" />
                        View Full
                      </>
                    )}
                  </button>
                )}
              </div>
              <button
                onClick={() => handleMarkAsRead(message.id)}
                className="flex-shrink-0 text-white/60 hover:text-white/90 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <Button
                onClick={() => handleMarkAsRead(message.id)}
                size="sm"
                className="bg-[#f48a4f] hover:brightness-110 text-[#0c2141] font-semibold text-xs"
              >
                Mark as Read
              </Button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
