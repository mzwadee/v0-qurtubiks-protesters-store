"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"

interface Customer {
  id: string
  name: string
  email: string
  points: number
  createdAt: string
  unlimited?: boolean
}

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

    const handleCustomerSignIn = () => {
      setTimeout(() => loadCustomers(), 500)
    }

    const handleStorageChange = () => {
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
      const response = await fetch("/api/customers")
      if (response.ok) {
        const text = await response.text()
        try {
          const data = JSON.parse(text)
          setCustomers(data || [])
          setError("")
        } catch (e) {
          console.error("[v0] Failed to parse customers:", e)
          setCustomers([])
        }
      }
    } catch (err) {
      console.error("[v0] Failed to load customers:", err)
      setError("Failed to load customers. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const updateCustomer = async (customer: Customer) => {
    try {
      setSaving(true)
      const response = await fetch("/api/customers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(customer),
      })

      if (!response.ok) {
        const text = await response.text()
        console.error("[v0] Failed to update customer:", text)
        throw new Error("Failed to update")
      }

      setError("")
      return true
    } catch (err) {
      console.error("[v0] Failed to save customer:", err)
      setError("Failed to save changes. Please try again.")
      return false
    } finally {
      setSaving(false)
    }
  }

  const addCustomer = async () => {
    setError("")

    if (!newCustomer.name || !newCustomer.email) {
      setError("Please enter name and email.")
      return
    }

    try {
      setSaving(true)
      const response = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminCreate: true,
          name: newCustomer.name,
          email: newCustomer.email,
          password: "temp123", // Default password for admin-created accounts
        }),
      })

      if (response.ok) {
        const customer = await response.json()

        // Now update with points and unlimited status
        const updatedCustomer = {
          ...customer,
          points: newCustomer.unlimited ? 999999 : Math.max(0, newCustomer.points),
          unlimited: newCustomer.unlimited,
        }

        await updateCustomer(updatedCustomer)
        await loadCustomers()
        setNewCustomer({ name: "", email: "", points: 0, unlimited: false })
      } else {
        const data = await response.json()
        setError(data.error || "Failed to add customer")
      }
    } catch (err) {
      setError("Failed to add customer. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  const handleUnlimitedChange = async (index: number, checked: boolean) => {
    const customer = customers[index]
    const updatedCustomer = {
      ...customer,
      unlimited: checked,
      points: checked ? 999999 : 100,
    }

    // Update local state immediately for responsiveness
    const updatedCustomers = [...customers]
    updatedCustomers[index] = updatedCustomer
    setCustomers(updatedCustomers)

    // Save to database
    const success = await updateCustomer(updatedCustomer)
    if (!success) {
      // Revert on failure
      await loadCustomers()
    }
  }

  const handleFieldChange = async (index: number, field: keyof Customer, value: any) => {
    const customer = customers[index]
    const updatedCustomer = { ...customer, [field]: value }

    // Update local state
    const updatedCustomers = [...customers]
    updatedCustomers[index] = updatedCustomer
    setCustomers(updatedCustomers)
  }

  const handleFieldBlur = async (index: number) => {
    const customer = customers[index]
    await updateCustomer(customer)
  }

  const deleteCustomer = async (index: number) => {
    const customer = customers[index]

    try {
      setSaving(true)
      const response = await fetch("/api/customers", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: customer.id }),
      })

      if (response.ok) {
        await loadCustomers()
      } else {
        setError("Failed to delete customer")
      }
    } catch (err) {
      setError("Failed to delete customer. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  const isUnlimited = (customer: Customer) => {
    return customer.unlimited || customer.points >= 999999
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
          <p className="text-emerald-200 text-sm">Saving changes...</p>
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
                <tr key={customer.id}>
                  <td className="px-4 py-3">
                    <Input
                      value={customer.name}
                      onChange={(e) => handleFieldChange(index, "name", e.target.value)}
                      onBlur={() => handleFieldBlur(index)}
                      className="bg-white/10 border-white/20 text-white w-48"
                      disabled={saving}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Input
                      value={customer.email}
                      onChange={(e) => handleFieldChange(index, "email", e.target.value)}
                      onBlur={() => handleFieldBlur(index)}
                      className="bg-white/10 border-white/20 text-white w-48"
                      disabled={saving}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Input
                      type="number"
                      min="0"
                      value={isUnlimited(customer) ? "" : customer.points}
                      placeholder={isUnlimited(customer) ? "∞" : "0"}
                      onChange={(e) => handleFieldChange(index, "points", Number(e.target.value))}
                      onBlur={() => handleFieldBlur(index)}
                      className="bg-white/10 border-white/20 text-white w-28"
                      disabled={isUnlimited(customer) || saving}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={isUnlimited(customer)}
                        onCheckedChange={(checked) => handleUnlimitedChange(index, !!checked)}
                        className="border-white/30"
                        disabled={saving}
                      />
                      <span className="text-sm text-white">{isUnlimited(customer) ? "Yes" : "No"}</span>
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
