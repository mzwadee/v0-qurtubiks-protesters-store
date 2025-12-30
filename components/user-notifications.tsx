"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { X, Bell } from "lucide-react"

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
  const [expandedMessage, setExpandedMessage] = useState<Message | null>(null)

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
        const text = await response.text()
        try {
          const data = JSON.parse(text)
          const unreadMessages = data.filter((m: Message) => !m.read)
          setMessages(unreadMessages)
        } catch (e) {
          console.error("[v0] Failed to parse messages:", e)
        }
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
        setExpandedMessage(null)
      }
    } catch (error) {
      console.error("[v0] Failed to mark message as read:", error)
    }
  }

  const needsTruncation = (text: string) => text.length > 100

  const getTruncatedText = (text: string) => {
    if (text.length <= 100) return text
    return text.substring(0, 100) + "..."
  }

  if (messages.length === 0) return null

  return (
    <>
      <div className="fixed top-4 right-4 z-50 space-y-3 max-w-sm w-full">
        {messages.map((message) => {
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
                <div className="flex-1 min-w-0 overflow-hidden">
                  <h3 className="font-bold text-sm mb-1">Message from Admin</h3>
                  <p className="text-sm text-white/90 break-words whitespace-pre-wrap">
                    {shouldTruncate ? getTruncatedText(message.message) : message.message}
                  </p>
                  {shouldTruncate && (
                    <button
                      onClick={() => setExpandedMessage(message)}
                      className="text-xs text-[#f48a4f] hover:text-[#f48a4f]/80 mt-2 font-semibold"
                    >
                      View Full
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

      <Dialog open={!!expandedMessage} onOpenChange={() => setExpandedMessage(null)}>
        <DialogContent className="bg-gradient-to-br from-[#0c2141] to-[#99074E] text-white border-white/20 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Bell className="w-5 h-5 text-[#f48a4f]" />
              Message from Admin
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <p className="text-white/90 whitespace-pre-wrap break-words">{expandedMessage?.message}</p>
          </div>
          <div className="mt-6 flex justify-end gap-2">
            <Button
              onClick={() => setExpandedMessage(null)}
              variant="outline"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              Close
            </Button>
            <Button
              onClick={() => expandedMessage && handleMarkAsRead(expandedMessage.id)}
              className="bg-[#f48a4f] hover:brightness-110 text-[#0c2141] font-semibold"
            >
              Mark as Read
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
