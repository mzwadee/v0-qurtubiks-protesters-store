"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { User, Mail, Lock, Trash2, Plus, X, Calendar } from "lucide-react"

interface Customer {
  id: string
  name: string
  email: string
  points: number
  unlimited?: boolean
  createdAt: string
}

export function AccountsManagement() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newName, setNewName] = useState("")
  const [newEmail, setNewEmail] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    loadCustomers()
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
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAccount = async () => {
    if (!newName.trim() || !newEmail.trim() || !newPassword.trim()) {
      setError("Please fill in all fields")
      return
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }

    setCreating(true)
    setError("")
    try {
      const response = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminCreate: true,
          name: newName.trim(),
          email: newEmail.trim(),
          password: newPassword.trim(),
        }),
      })

      if (response.ok) {
        setNewName("")
        setNewEmail("")
        setNewPassword("")
        setShowCreateForm(false)
        loadCustomers()
      } else {
        const data = await response.json()
        setError(data.error || "Failed to create account")
      }
    } catch (error) {
      console.error("[v0] Failed to create account:", error)
      setError("Failed to create account")
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteAccount = async (id: string) => {
    if (!confirm("Are you sure you want to delete this account?")) return

    try {
      const response = await fetch("/api/customers", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      })

      if (response.ok) {
        loadCustomers()
      }
    } catch (error) {
      console.error("[v0] Failed to delete account:", error)
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch {
      return "Unknown"
    }
  }

  return (
    <div className="space-y-6">
      {/* Header with Create Button */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">All Accounts ({customers.length})</h2>
        <Button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="bg-[#f48a4f] hover:brightness-110 text-[#0c2141]"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Account
        </Button>
      </div>

      {/* Create Account Form */}
      {showCreateForm && (
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 ring-1 ring-white/15">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white">Create New Account</h3>
            <button onClick={() => setShowCreateForm(false)} className="text-white/60 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-200 text-sm">
              {error}
            </div>
          )}

          <div className="grid gap-4">
            <div>
              <label className="text-white/90 text-sm mb-2 flex items-center gap-2">
                <User className="w-4 h-4" />
                Name
              </label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Enter name"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
              />
            </div>
            <div>
              <label className="text-white/90 text-sm mb-2 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email
              </label>
              <Input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="Enter email"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
              />
            </div>
            <div>
              <label className="text-white/90 text-sm mb-2 flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Password
              </label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Create password (min 6 characters)"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
              />
            </div>
            <Button
              onClick={handleCreateAccount}
              disabled={creating}
              className="bg-[#f48a4f] hover:brightness-110 text-[#0c2141] font-bold"
            >
              {creating ? "Creating..." : "Create Account"}
            </Button>
          </div>
        </div>
      )}

      {/* Accounts List */}
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 ring-1 ring-white/15">
        {loading ? (
          <div className="text-center py-8 text-white/60">Loading accounts...</div>
        ) : customers.length === 0 ? (
          <div className="text-center py-8 text-white/60">No accounts found</div>
        ) : (
          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {customers.map((customer) => (
              <div
                key={customer.id}
                className="flex items-center justify-between bg-white/5 rounded-xl p-4 border border-white/10"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#f48a4f] flex items-center justify-center">
                    <User className="w-6 h-6 text-[#0c2141]" />
                  </div>
                  <div>
                    <div className="font-semibold text-white">{customer.name}</div>
                    <div className="text-sm text-white/60">{customer.email}</div>
                    <div className="flex items-center gap-1 text-xs text-white/40 mt-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(customer.createdAt)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-lg font-bold text-[#f48a4f]">{customer.unlimited ? "∞" : customer.points}</div>
                    <div className="text-xs text-white/50">points</div>
                  </div>
                  <button
                    onClick={() => handleDeleteAccount(customer.id)}
                    className="text-red-400 hover:text-red-300 p-2"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
