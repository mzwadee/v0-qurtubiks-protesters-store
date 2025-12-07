"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { OrderManagement } from "@/components/order-management"
import { ProductManagement } from "@/components/product-management"
import { CustomerPointsManagement } from "@/components/customer-points"
import { AdminMessaging } from "@/components/admin-messaging"
import { AccountsManagement } from "@/components/accounts-management"

type TabType = "orders" | "products" | "points" | "messages" | "accounts"

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [adminCode, setAdminCode] = useState("")
  const [error, setError] = useState("")
  const [activeTab, setActiveTab] = useState<TabType>("orders")
  const [authDialogOpen, setAuthDialogOpen] = useState(true)

  useEffect(() => {
    // This ensures admin code is required every time
  }, [])

  const handleAuth = () => {
    if (adminCode.trim() === "5197") {
      setIsAuthenticated(true)
      setAuthDialogOpen(false)
      setError("")
    } else {
      setError("Wrong code. Please try again.")
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAuth()
    }
    if (e.key === "Escape") {
      window.location.href = "/"
    }
  }

  const handleCancel = () => {
    window.location.href = "/"
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0c2141] via-[#99074E] to-[#f48a4f] flex items-center justify-center p-6">
        <Dialog open={authDialogOpen} onOpenChange={setAuthDialogOpen}>
          <DialogContent className="bg-white text-[#0c2141] max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-lg font-extrabold">Admin Access</DialogTitle>
              <p className="text-sm text-[#0c2141]/70">Enter the admin code to continue.</p>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                type="text"
                inputMode="numeric"
                placeholder="Enter code"
                value={adminCode}
                onChange={(e) => setAdminCode(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full rounded-xl border border-black/10 px-4 py-2.5 outline-none focus:ring-4 ring-[#f48a4f]/40"
                autoFocus
              />
              {error && <p className="text-rose-600 text-sm">{error}</p>}
              <div className="flex items-center justify-end gap-2">
                <Button
                  onClick={handleCancel}
                  variant="ghost"
                  className="bg-[#0c2141]/5 text-[#0c2141] hover:bg-[#0c2141]/10"
                >
                  Cancel
                </Button>
                <Button onClick={handleAuth} className="bg-[#f48a4f] text-[#0c2141] hover:brightness-110 font-semibold">
                  Unlock
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0c2141] via-[#99074E] to-[#f48a4f] text-white">
      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Header */}
        <header className="flex items-center justify-between gap-4 mb-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 grid place-items-center ring-1 ring-white/15">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-6 h-6 text-[#f48a4f]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                  d="M6 7l1.2 12.1A2 2 0 009.2 21h5.6a2 2 0 002-1.9L18 7M8 7a4 4 0 118 0M8 7h8M9 11h.01M15 11h.01"
                />
              </svg>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">QURTUBLOX STORE — Admin</h1>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={() => {
                localStorage.removeItem("adminSession")
                setIsAuthenticated(false)
                setAuthDialogOpen(true)
              }}
              className="bg-white/10 text-white/90 hover:bg-white/20 font-semibold"
            >
              Sign Out
            </Button>
            <Button
              onClick={() => (window.location.href = "/")}
              className="bg-white/10 text-white/90 hover:bg-white/20 font-semibold"
            >
              Back to Shop
            </Button>
          </div>
        </header>

        {/* Tabs */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <Button
            onClick={() => setActiveTab("orders")}
            className={`font-semibold ${
              activeTab === "orders" ? "bg-[#f48a4f] text-[#0c2141]" : "bg-white/10 text-white/90 hover:bg-white/20"
            }`}
          >
            Orders
          </Button>
          <Button
            onClick={() => setActiveTab("products")}
            className={`font-semibold ${
              activeTab === "products" ? "bg-[#f48a4f] text-[#0c2141]" : "bg-white/10 text-white/90 hover:bg-white/20"
            }`}
          >
            Products
          </Button>
          <Button
            onClick={() => setActiveTab("points")}
            className={`font-semibold ${
              activeTab === "points" ? "bg-[#f48a4f] text-[#0c2141]" : "bg-white/10 text-white/90 hover:bg-white/20"
            }`}
          >
            Points
          </Button>
          <Button
            onClick={() => setActiveTab("accounts")}
            className={`font-semibold ${
              activeTab === "accounts" ? "bg-[#f48a4f] text-[#0c2141]" : "bg-white/10 text-white/90 hover:bg-white/20"
            }`}
          >
            Accounts
          </Button>
          <Button
            onClick={() => setActiveTab("messages")}
            className={`font-semibold ${
              activeTab === "messages" ? "bg-[#f48a4f] text-[#0c2141]" : "bg-white/10 text-white/90 hover:bg-white/20"
            }`}
          >
            Messages
          </Button>
        </div>

        {/* Tab Content */}
        <div className="mt-10">
          {activeTab === "orders" && <OrderManagement />}
          {activeTab === "products" && <ProductManagement />}
          {activeTab === "points" && <CustomerPointsManagement />}
          {activeTab === "accounts" && <AccountsManagement />}
          {activeTab === "messages" && <AdminMessaging />}
        </div>
      </div>
    </div>
  )
}
