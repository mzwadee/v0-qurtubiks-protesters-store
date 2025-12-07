"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { cloudStorage } from "@/lib/cloud-storage"

interface Customer {
  id: string
  name: string
  email: string
  points: number
  createdAt: string
  unlimited?: boolean
}

const BUILT_IN_UNLIMITED = new Set([
  "QP MEMBER",
  "Umar Badat",
  "Zaeem Kathrada",
  "Rayyan Turky",
  "Nuuh Dawood",
  "Muhammad Ilyaas Khan",
  "Saad Kajee",
  "Zuhayr Hattia",
  "Hanzalah Arbee",
])

export function CustomerPointsManagement() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)

  // Form state
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    email: "",
    points: 0,
    unlimited: false,
  })

  useEffect(() => {
    loadCustomers()

    const handleCustomerSignIn = (event: any) => {
      console.log("[v0] Customer signed in event received, refreshing points list...")
      setTimeout(() => loadCustomers(), 500)
    }

    const handleStorageChange = () => {
      console.log("[v0] Storage changed, refreshing customer list...")
      loadCustomers()
    }

    window.addEventListener("customerSignedIn", handleCustomerSignIn)
    window.addEventListener("storage", handleStorageChange)

    return () => {
      window.removeEventListener("customerSignedIn", handleCustomerSignIn)
      window.removeEventListener("storage", handleStorageChange)
    }
  }, [])

  const loadCustomers = async () => {
    try {
      console.log("[v0] Loading customers for points management...")
      const data = await cloudStorage.getCustomers()
      console.log("[v0] Loaded customers for points management:", data)
      setCustomers(data || [])
      setError("")
    } catch (err) {
      console.error("[v0] Failed to load customers:", err)
      setError("Failed to load customers. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const saveCustomers = async (updatedCustomers: Customer[]) => {
    try {
      setSaving(true)
      console.log("[v0] Saving customers:", updatedCustomers)

      setCustomers(updatedCustomers)

      const response = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedCustomers),
      })

      if (!response.ok) {
        throw new Error(`Save failed with status: ${response.status}`)
      }

      const result = await response.json()
      console.log("[v0] Save result:", result)

      localStorage.setItem("customersLastUpdate", Date.now().toString())
      window.dispatchEvent(new Event("storage"))

      setError("")
      console.log("[v0] Customers saved successfully to cloud")
    } catch (err) {
      console.error("[v0] Failed to save customers:", err)
      setError("Failed to save changes. Please try again.")
      await loadCustomers()
    } finally {
      setSaving(false)
    }
  }

  const addCustomer = async () => {
    setError("")

    if (!newCustomer.name || !newCustomer.email || (!newCustomer.unlimited && isNaN(newCustomer.points))) {
      setError("Please enter name, email and valid points (or tick Unlimited).")
      return
    }

    const newCustomerObj: Customer = {
      id: Date.now().toString(),
      name: newCustomer.name,
      email: newCustomer.email,
      points: newCustomer.unlimited ? 999999 : Math.max(0, newCustomer.points),
      unlimited: newCustomer.unlimited,
      createdAt: new Date().toISOString(),
    }

    const updatedCustomers = [...customers, newCustomerObj]
    await saveCustomers(updatedCustomers)

    setNewCustomer({ name: "", email: "", points: 0, unlimited: false })
  }

  const updateCustomer = async (index: number, field: keyof Customer, value: any) => {
    const updatedCustomers = [...customers]

    if (field === "unlimited") {
      if (value) {
        console.log("[v0] Setting customer to unlimited:", updatedCustomers[index].name)
        updatedCustomers[index] = { ...updatedCustomers[index], unlimited: true, points: 999999 }
      } else {
        console.log("[v0] Removing unlimited from customer:", updatedCustomers[index].name)
        updatedCustomers[index] = { ...updatedCustomers[index], unlimited: false, points: 100 }
      }
      // Immediately save to ensure state persists
      await saveCustomers(updatedCustomers)
    } else {
      updatedCustomers[index] = { ...updatedCustomers[index], [field]: value }
      // For other fields, save immediately too
      await saveCustomers(updatedCustomers)
    }
  }

  const deleteCustomer = async (index: number) => {
    const customerToDelete = customers[index]
    console.log("[v0] Deleting customer:", customerToDelete)

    const updatedCustomers = customers.filter((_, i) => i !== index)
    await saveCustomers(updatedCustomers)
  }

  const isUnlimited = (customer: Customer) => {
    return customer.unlimited || BUILT_IN_UNLIMITED.has(customer.name) || customer.points >= 999999
  }

  const isBuiltInUnlimited = (customer: Customer) => {
    return BUILT_IN_UNLIMITED.has(customer.name)
  }

  const canToggleUnlimited = (customer: Customer) => {
    return !BUILT_IN_UNLIMITED.has(customer.name)
  }

  if (loading) {
    return <div className="text-white/90">Loading customer points...</div>
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-2xl bg-rose-500/20 ring-1 ring-rose-500/30 p-4 mb-4">
          <p className="text-rose-200 text-sm">{error}</p>
        </div>
      )}

      {saving && (
        <div className="rounded-2xl bg-emerald-500/20 ring-1 ring-emerald-500/30 p-4 mb-4">
          <p className="text-emerald-200 text-sm">✅ Saving changes to cloud...</p>
        </div>
      )}

      {/* Add Customer Form */}
      <div className="rounded-2xl bg-white/10 ring-1 ring-white/15 p-4">
        <h3 className="font-extrabold mb-3 text-white">Customer Points Management</h3>
        <div className="grid md:grid-cols-6 gap-3">
          <Input
            placeholder="Name"
            value={newCustomer.name}
            onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
            className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
          />
          <Input
            placeholder="Email"
            type="email"
            value={newCustomer.email}
            onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
            className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
          />
          <Input
            type="number"
            min="0"
            placeholder="Points"
            value={newCustomer.points}
            onChange={(e) => setNewCustomer({ ...newCustomer, points: Number(e.target.value) })}
            className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
            disabled={newCustomer.unlimited}
          />
          <div className="flex items-center gap-2 text-white/90">
            <Checkbox
              checked={newCustomer.unlimited}
              onCheckedChange={(checked) => setNewCustomer({ ...newCustomer, unlimited: !!checked })}
              className="border-white/30"
            />
            <span className="text-sm">Unlimited</span>
          </div>
          <Button
            onClick={addCustomer}
            className="bg-[#f48a4f] text-[#0c2141] hover:brightness-110 font-semibold"
            disabled={saving}
          >
            Add Customer
          </Button>
        </div>
      </div>

      {/* Customers Table */}
      <div className="overflow-x-auto rounded-xl ring-1 ring-white/15 bg-white/10">
        <table className="min-w-full text-left">
          <thead className="bg-white/10">
            <tr className="text-sm">
              <th className="px-4 py-3 text-white">Name</th>
              <th className="px-4 py-3 text-white">Email</th>
              <th className="px-4 py-3 text-white">Points</th>
              <th className="px-4 py-3 text-white">Unlimited</th>
              <th className="px-4 py-3 text-white">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {customers.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-4 text-white/80">
                  No customers yet.
                </td>
              </tr>
            ) : (
              customers.map((customer, index) => (
                <tr key={`${customer.id}-${index}`}>
                  <td className="px-4 py-3">
                    <Input
                      value={customer.name}
                      onChange={(e) => updateCustomer(index, "name", e.target.value)}
                      className="bg-white/10 border-white/20 text-white w-48"
                      disabled={saving}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Input
                      value={customer.email}
                      onChange={(e) => updateCustomer(index, "email", e.target.value)}
                      className="bg-white/10 border-white/20 text-white w-48"
                      disabled={saving}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Input
                      type="number"
                      min="0"
                      value={isUnlimited(customer) ? "∞" : customer.points}
                      onChange={(e) => updateCustomer(index, "points", Number(e.target.value))}
                      className="bg-white/10 border-white/20 text-white w-28"
                      disabled={isUnlimited(customer) || saving}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={isUnlimited(customer)}
                        onCheckedChange={(checked) => updateCustomer(index, "unlimited", !!checked)}
                        className="border-white/30"
                        disabled={!canToggleUnlimited(customer) || saving}
                      />
                      <span className="text-sm text-white">
                        {isBuiltInUnlimited(customer) ? "Built-in" : isUnlimited(customer) ? "Yes" : "No"}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => deleteCustomer(index)}
                        variant="ghost"
                        size="sm"
                        className="bg-rose-500/20 text-rose-200 hover:bg-rose-500/30"
                        disabled={saving}
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
