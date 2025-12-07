"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { User } from "lucide-react"

interface Customer {
  id: string
  name: string
  email: string
  points: number
  createdAt: string
}

interface SignInModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSignIn: (customer: Customer) => void
}

export function SignInModal({ open, onOpenChange, onSignIn }: SignInModalProps) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [savedAccounts, setSavedAccounts] = useState<Customer[]>([])
  const [showSavedAccounts, setShowSavedAccounts] = useState(true)

  useEffect(() => {
    if (open) {
      const cached = localStorage.getItem("qp_customers")
      if (cached) {
        try {
          const accounts = JSON.parse(cached)
          setSavedAccounts(accounts)
          setShowSavedAccounts(accounts.length > 0)
        } catch (e) {
          console.error("[v0] Failed to load saved accounts:", e)
        }
      }
    }
  }, [open])

  const handleSelectSavedAccount = async (account: Customer) => {
    setLoading(true)
    try {
      console.log("[v0] Signing in with saved account:", account.name)

      // Fetch the latest customer data from the server
      const response = await fetch("/api/customers")
      if (response.ok) {
        const customers = await response.json()
        const latestCustomer = customers.find((c: Customer) => c.id === account.id)

        if (latestCustomer) {
          onSignIn(latestCustomer)
          window.dispatchEvent(new CustomEvent("customerSignedIn", { detail: latestCustomer }))
          console.log("[v0] Signed in with saved account successfully")
        } else {
          // Account not found on server, use cached data
          onSignIn(account)
          window.dispatchEvent(new CustomEvent("customerSignedIn", { detail: account }))
        }

        onOpenChange(false)
      }
    } catch (error) {
      console.error("[v0] Failed to sign in with saved account:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSignIn = async () => {
    if (!name.trim() || !email.trim()) return

    setLoading(true)
    try {
      console.log("[v0] Starting sign-in process for:", name.trim(), email.trim())

      const response = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim() }),
      })

      if (response.ok) {
        const customer = await response.json()
        console.log("[v0] Customer signed in and saved to Supabase:", customer)

        if (typeof window !== "undefined") {
          const cached = localStorage.getItem("qp_customers")
          const customers = cached ? JSON.parse(cached) : []

          const existingIndex = customers.findIndex((c: any) => c.id === customer.id)
          if (existingIndex >= 0) {
            customers[existingIndex] = customer
          } else {
            customers.push(customer)
          }

          localStorage.setItem("qp_customers", JSON.stringify(customers))
          console.log("[v0] Updated localStorage cache with new customer")
        }

        onSignIn(customer)

        window.dispatchEvent(new CustomEvent("customerSignedIn", { detail: customer }))
        console.log("[v0] Dispatched customerSignedIn event")

        onOpenChange(false)
        setName("")
        setEmail("")
      } else {
        console.error("[v0] Sign-in failed with status:", response.status)
      }
    } catch (error) {
      console.error("[v0] Sign in failed:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-[#0c2141] border-white/20 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center">Sign in to QurtubloX Store</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {showSavedAccounts && savedAccounts.length > 0 && (
            <div className="space-y-2">
              <Label className="text-white/90">Your QurtubloX Accounts</Label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {savedAccounts.map((account) => (
                  <button
                    key={account.id}
                    onClick={() => handleSelectSavedAccount(account)}
                    disabled={loading}
                    className="w-full flex items-center gap-3 p-3 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 transition-colors text-left disabled:opacity-50"
                  >
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#f48a4f] flex items-center justify-center">
                      <User className="w-5 h-5 text-[#0c2141]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-white truncate">{account.name}</div>
                      <div className="text-sm text-white/60 truncate">{account.email}</div>
                    </div>
                    <div className="text-sm text-[#f48a4f] font-semibold">
                      {account.points >= 999999 ? "∞" : `${account.points} pts`}
                    </div>
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowSavedAccounts(false)}
                className="text-sm text-white/60 hover:text-white/90 transition-colors"
              >
                Or create a new account
              </button>
            </div>
          )}

          {(!showSavedAccounts || savedAccounts.length === 0) && (
            <>
              <div className="space-y-2">
                <Label htmlFor="name" className="text-white/90">
                  Your Name
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white/90">
                  Your Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  onKeyDown={(e) => e.key === "Enter" && handleSignIn()}
                />
              </div>
              <Button
                onClick={handleSignIn}
                disabled={!name.trim() || !email.trim() || loading}
                className="w-full bg-[#f48a4f] hover:brightness-110 text-[#0c2141] font-semibold"
              >
                {loading ? "Signing In..." : "Sign In"}
              </Button>
              {savedAccounts.length > 0 && (
                <button
                  onClick={() => setShowSavedAccounts(true)}
                  className="text-sm text-white/60 hover:text-white/90 transition-colors w-full text-center"
                >
                  Back to saved accounts
                </button>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
