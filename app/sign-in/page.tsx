"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { User, Mail, Lock, ArrowRight, Eye, EyeOff, ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"

interface Customer {
  id: string
  name: string
  email: string
  points: number
  unlimited?: boolean
  createdAt: string
}

export default function SignInPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [localAccounts, setLocalAccounts] = useState<Customer[]>([])
  const [selectedAccount, setSelectedAccount] = useState<Customer | null>(null)
  const [error, setError] = useState("")
  const [viewMode, setViewMode] = useState<"welcome" | "signin" | "signup" | "login-email">("welcome")
  const [initialLoading, setInitialLoading] = useState(true)
  const [saveToDevice, setSaveToDevice] = useState(true)

  useEffect(() => {
    const customer = localStorage.getItem("customer")
    const session = localStorage.getItem("customerSession")
    if (customer && session === "active") {
      router.replace("/")
      return
    }

    loadLocalAccounts()
  }, [router])

  const loadLocalAccounts = async () => {
    try {
      const localAccountIds = localStorage.getItem("qp_local_accounts")
      if (!localAccountIds) {
        setInitialLoading(false)
        return
      }

      const accountIds: string[] = JSON.parse(localAccountIds)

      try {
        const response = await fetch("/api/customers")
        if (response.ok) {
          const text = await response.text()
          try {
            const allCustomers = JSON.parse(text)
            if (Array.isArray(allCustomers)) {
              const localCustomers = allCustomers.filter((c: Customer) => accountIds.includes(c.id))
              setLocalAccounts(localCustomers)
            }
          } catch (e) {
            console.error("[v0] Failed to parse customers JSON:", e)
          }
        }
      } catch (fetchError) {
        console.error("[v0] Failed to fetch customers:", fetchError)
      }
    } catch (error) {
      console.error("[v0] Failed to load local accounts:", error)
    } finally {
      setInitialLoading(false)
    }
  }

  const handleSelectAccount = (account: Customer) => {
    setSelectedAccount(account)
    setPassword("")
    setError("")
  }

  const handleSignIn = async () => {
    if (!selectedAccount || !password.trim()) {
      setError("Please enter your password")
      return
    }

    setLoading(true)
    setError("")
    try {
      const response = await fetch("/api/customers/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedAccount.id,
          password: password.trim(),
        }),
      })

      const text = await response.text()
      let data
      try {
        data = JSON.parse(text)
      } catch (e) {
        setError("Server error. Please try again.")
        setLoading(false)
        return
      }

      if (response.ok) {
        localStorage.setItem("customer", JSON.stringify(data))
        localStorage.setItem("customerSession", "active")

        window.dispatchEvent(new CustomEvent("customerSignedIn", { detail: data }))
        router.replace("/")
      } else {
        setError(data.error || "Invalid password. Please try again.")
      }
    } catch (error) {
      console.error("[v0] Sign-in failed:", error)
      setError("An error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleEmailLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError("Please enter your email and password")
      return
    }

    setLoading(true)
    setError("")
    try {
      const response = await fetch("/api/customers/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password: password.trim(),
        }),
      })

      const text = await response.text()
      let data
      try {
        data = JSON.parse(text)
      } catch (e) {
        setError("Server error. Please try again.")
        setLoading(false)
        return
      }

      if (response.ok) {
        // Save to device if checkbox is checked
        if (saveToDevice) {
          const localAccountIds = localStorage.getItem("qp_local_accounts")
          const accountIds: string[] = localAccountIds ? JSON.parse(localAccountIds) : []
          if (!accountIds.includes(data.id)) {
            accountIds.push(data.id)
            localStorage.setItem("qp_local_accounts", JSON.stringify(accountIds))
          }
        }

        localStorage.setItem("customer", JSON.stringify(data))
        localStorage.setItem("customerSession", "active")

        window.dispatchEvent(new CustomEvent("customerSignedIn", { detail: data }))
        router.replace("/")
      } else {
        setError(data.error || "Invalid email or password. Please try again.")
      }
    } catch (error) {
      console.error("[v0] Sign-in failed:", error)
      setError("An error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAccount = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError("Please fill in all fields")
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      setError("Please enter a valid email address")
      return
    }

    if (password.trim().length < 6) {
      setError("Password must be at least 6 characters long")
      return
    }

    setLoading(true)
    setError("")
    try {
      const response = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password: password.trim(),
        }),
      })

      const text = await response.text()
      let customer
      try {
        customer = JSON.parse(text)
      } catch (e) {
        setError("Server error. Please try again.")
        setLoading(false)
        return
      }

      if (response.ok) {
        if (saveToDevice) {
          const localAccountIds = localStorage.getItem("qp_local_accounts")
          const accountIds: string[] = localAccountIds ? JSON.parse(localAccountIds) : []
          if (!accountIds.includes(customer.id)) {
            accountIds.push(customer.id)
            localStorage.setItem("qp_local_accounts", JSON.stringify(accountIds))
          }
        }

        localStorage.setItem("customer", JSON.stringify(customer))
        localStorage.setItem("customerSession", "active")

        window.dispatchEvent(new CustomEvent("customerSignedIn", { detail: customer }))
        router.replace("/")
      } else {
        setError(customer.error || "Failed to create account. Please try again.")
      }
    } catch (error) {
      console.error("[v0] Account creation failed:", error)
      setError("An error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0c2141] via-[#99074E] to-[#f48a4f] flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0c2141] via-[#99074E] to-[#f48a4f] flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 ring-1 ring-white/15 mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-10 h-10 text-[#f48a4f]"
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
          <h1 className="text-3xl font-extrabold text-white mb-2">
            {viewMode === "signup" ? "Create Account" : "Sign in to QurtubloX Store"}
          </h1>
          <p className="text-white/70">
            {viewMode === "signup" ? "Join the QurtubloX Store community" : "Access your account to continue shopping"}
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 ring-1 ring-white/15 shadow-2xl">
          {viewMode === "welcome" && !selectedAccount && (
            <>
              <h2 className="text-xl font-bold text-white mb-4 text-center">Welcome to QurtubloX Store</h2>
              <p className="text-white/70 text-center mb-6">Choose an option to get started</p>

              {/* Show accounts on this device if any */}
              {localAccounts.length > 0 && (
                <div className="mb-6">
                  <p className="text-white/80 text-sm mb-3">Your accounts on this device:</p>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {localAccounts.map((account) => (
                      <button
                        key={account.id}
                        onClick={() => handleSelectAccount(account)}
                        className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 transition-all text-left group"
                      >
                        <div className="w-10 h-10 rounded-full bg-[#f48a4f] flex items-center justify-center">
                          <User className="w-5 h-5 text-[#0c2141]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-white truncate">{account.name}</div>
                          <div className="text-xs text-white/60 truncate">{account.email}</div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-white/40 group-hover:text-white" />
                      </button>
                    ))}
                  </div>
                  <div className="my-4 flex items-center gap-3">
                    <div className="flex-1 h-px bg-white/20"></div>
                    <span className="text-white/50 text-sm">or</span>
                    <div className="flex-1 h-px bg-white/20"></div>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <Button
                  onClick={() => setViewMode("signup")}
                  className="w-full bg-[#f48a4f] hover:brightness-110 text-[#0c2141] font-bold text-lg py-6"
                >
                  <User className="w-5 h-5 mr-2" />
                  Sign Up
                </Button>
                <Button
                  onClick={() => setViewMode("login-email")}
                  variant="outline"
                  className="w-full bg-white/5 border-white/20 text-white hover:bg-white/10 font-semibold text-lg py-6"
                >
                  <Mail className="w-5 h-5 mr-2" />
                  Log In
                </Button>
              </div>
            </>
          )}

          {viewMode === "login-email" && !selectedAccount && (
            <>
              <button
                onClick={() => setViewMode("welcome")}
                className="flex items-center gap-2 text-white/60 hover:text-white/90 mb-4 text-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <h2 className="text-xl font-bold text-white mb-4">Log In with Email</h2>
              {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-200 text-sm">
                  {error}
                </div>
              )}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email" className="text-white/90 flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email
                  </Label>
                  <Input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-[#f48a4f] focus:ring-[#f48a4f]"
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password" className="text-white/90 flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-[#f48a4f] focus:ring-[#f48a4f] pr-10"
                      onKeyDown={(e) => e.key === "Enter" && handleEmailLogin()}
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white/80"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="save-device-login"
                    checked={saveToDevice}
                    onCheckedChange={(checked) => setSaveToDevice(!!checked)}
                    className="border-white/30"
                  />
                  <Label htmlFor="save-device-login" className="text-white/70 text-sm cursor-pointer">
                    Save account to this device
                  </Label>
                </div>
                <Button
                  onClick={handleEmailLogin}
                  disabled={!email.trim() || !password.trim() || loading}
                  className="w-full bg-[#f48a4f] hover:brightness-110 text-[#0c2141] font-bold text-lg py-6"
                >
                  {loading ? "Logging In..." : "Log In"}
                </Button>
                <Button
                  onClick={() => setViewMode("signup")}
                  variant="ghost"
                  className="w-full text-white/70 hover:text-white hover:bg-white/10"
                >
                  Don't have an account? Sign Up
                </Button>
              </div>
            </>
          )}

          {viewMode === "signin" && !selectedAccount && (
            <>
              <button
                onClick={() => setViewMode("welcome")}
                className="flex items-center gap-2 text-white/60 hover:text-white/90 mb-4 text-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <h2 className="text-xl font-bold text-white mb-4">Sign In</h2>

              {localAccounts.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-white/70 mb-4">No accounts found on this device.</p>
                  <Button
                    onClick={() => setViewMode("signup")}
                    className="bg-[#f48a4f] hover:brightness-110 text-[#0c2141] font-bold"
                  >
                    Create an Account
                  </Button>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {localAccounts.map((account) => (
                    <button
                      key={account.id}
                      onClick={() => handleSelectAccount(account)}
                      disabled={loading}
                      className="w-full flex items-center gap-3 p-4 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 transition-all text-left disabled:opacity-50 group"
                    >
                      <div className="w-12 h-12 rounded-full bg-[#f48a4f] flex items-center justify-center group-hover:scale-110 transition-transform">
                        <User className="w-6 h-6 text-[#0c2141]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-white truncate">{account.name}</div>
                        <div className="text-sm text-white/60 truncate">{account.email}</div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <div className="text-sm text-[#f48a4f] font-bold">
                          {account.unlimited ? "∞" : `${account.points}`}
                        </div>
                        <div className="text-xs text-white/50">points</div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-white/40 group-hover:text-white/80 transition-colors" />
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Password entry for selected account */}
          {selectedAccount && (
            <>
              <button
                onClick={() => {
                  setSelectedAccount(null)
                  setPassword("")
                  setError("")
                }}
                className="flex items-center gap-2 text-white/60 hover:text-white/90 mb-4 text-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to accounts
              </button>
              <div className="flex items-center gap-3 p-4 rounded-xl bg-white/10 border border-white/20 mb-4">
                <div className="w-12 h-12 rounded-full bg-[#f48a4f] flex items-center justify-center">
                  <User className="w-6 h-6 text-[#0c2141]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-white truncate">{selectedAccount.name}</div>
                  <div className="text-sm text-white/60 truncate">{selectedAccount.email}</div>
                </div>
              </div>
              {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-200 text-sm">
                  {error}
                </div>
              )}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-white/90 flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-[#f48a4f] focus:ring-[#f48a4f] pr-10"
                      onKeyDown={(e) => e.key === "Enter" && handleSignIn()}
                      disabled={loading}
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white/80"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <Button
                  onClick={handleSignIn}
                  disabled={!password.trim() || loading}
                  className="w-full bg-[#f48a4f] hover:brightness-110 text-[#0c2141] font-bold text-lg py-6"
                >
                  {loading ? "Signing In..." : "Sign In"}
                </Button>
              </div>
            </>
          )}

          {viewMode === "signup" && !selectedAccount && (
            <>
              <button
                onClick={() => setViewMode("welcome")}
                className="flex items-center gap-2 text-white/60 hover:text-white/90 mb-4 text-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <h2 className="text-xl font-bold text-white mb-4">Create Your Account</h2>
              {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-200 text-sm">
                  {error}
                </div>
              )}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-white/90 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Your Name
                  </Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-[#f48a4f] focus:ring-[#f48a4f]"
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white/90 flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Your Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-[#f48a4f] focus:ring-[#f48a4f]"
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password" className="text-white/90 flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="new-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Create a password (min 6 characters)"
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-[#f48a4f] focus:ring-[#f48a4f] pr-10"
                      onKeyDown={(e) => e.key === "Enter" && handleCreateAccount()}
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white/80"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="save-device"
                    checked={saveToDevice}
                    onCheckedChange={(checked) => setSaveToDevice(!!checked)}
                    className="border-white/30"
                  />
                  <Label htmlFor="save-device" className="text-white/70 text-sm cursor-pointer">
                    Save account to this device
                  </Label>
                </div>
                <Button
                  onClick={handleCreateAccount}
                  disabled={!name.trim() || !email.trim() || !password.trim() || loading}
                  className="w-full bg-[#f48a4f] hover:brightness-110 text-[#0c2141] font-bold text-lg py-6"
                >
                  {loading ? "Creating Account..." : "Create Account & Sign In"}
                </Button>
                <Button
                  onClick={() => setViewMode("login-email")}
                  variant="ghost"
                  className="w-full text-white/70 hover:text-white hover:bg-white/10"
                >
                  Already have an account? Log In
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
