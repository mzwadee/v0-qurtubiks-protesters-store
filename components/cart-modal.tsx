"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertTriangle } from "lucide-react"
import { cloudStorage } from "@/lib/cloud-storage"

interface CartItem {
  sku: string
  name: string
  price: number
  qty: number
}

interface Customer {
  id: string
  name: string
  points: number
  createdAt: string
  unlimited?: boolean
}

interface CartModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  cart: CartItem[]
  onUpdateCart: (cart: CartItem[]) => void
  cartTotal: number
  customer: Customer | null
  onCustomerUpdate: (customer: Customer) => void
}

export function CartModal({
  open,
  onOpenChange,
  cart,
  onUpdateCart,
  cartTotal,
  customer,
  onCustomerUpdate,
}: CartModalProps) {
  const [orderNote, setOrderNote] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const updateCartItem = (sku: string, action: "inc" | "dec" | "remove") => {
    const newCart = [...cart]
    const itemIndex = newCart.findIndex((item) => item.sku === sku)

    if (itemIndex >= 0) {
      if (action === "inc") {
        newCart[itemIndex].qty += 1
      } else if (action === "dec") {
        newCart[itemIndex].qty = Math.max(1, newCart[itemIndex].qty - 1)
      } else if (action === "remove") {
        newCart.splice(itemIndex, 1)
      }
    }

    onUpdateCart(newCart)
  }

  const clearCart = () => {
    onUpdateCart([])
  }

  const canAffordOrder = () => {
    if (!customer) return false
    return customer.unlimited || customer.points >= 999999 || customer.points >= cartTotal
  }

  const placeOrder = async () => {
    if (!customer || !canAffordOrder() || cart.length === 0) return

    setLoading(true)
    setError("")

    try {
      console.log("[v0] Placing order for customer:", customer.name, "Unlimited:", customer.unlimited)

      const updatedCustomer = {
        ...customer,
        points: customer.unlimited || customer.points >= 999999 ? customer.points : customer.points - cartTotal,
      }

      console.log("[v0] Updated customer after order:", updatedCustomer)

      // Update customer points in cloud storage
      const response = await fetch("/api/customers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedCustomer),
      })

      if (!response.ok) {
        throw new Error("Failed to update customer points")
      }

      // Create order
      const order = {
        id: "ORD-" + Math.random().toString(36).slice(2, 8).toUpperCase(),
        at: new Date().toISOString(),
        personName: customer.name,
        customerId: customer.id,
        note: orderNote,
        adminNote: "",
        items: cart.map((item) => ({
          sku: item.sku,
          name: item.name,
          qty: item.qty,
          price: item.price,
        })),
        total: cartTotal,
        status: "open" as const,
      }

      console.log("[v0] Creating order:", order)

      // Save order to cloud
      const orders = await cloudStorage.getOrders()
      orders.unshift(order)
      await cloudStorage.saveOrders(orders)

      console.log("[v0] Order saved successfully")

      // Update local customer state
      onCustomerUpdate(updatedCustomer)

      // Update customer in localStorage
      localStorage.setItem("customer", JSON.stringify(updatedCustomer))

      window.dispatchEvent(new CustomEvent("orderPlaced", { detail: order }))

      // Clear cart and form
      onUpdateCart([])
      setOrderNote("")
      onOpenChange(false)

      alert("✅ Order placed successfully!")
    } catch (err) {
      console.error("[v0] Failed to place order:", err)
      setError("Failed to place order. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white text-[#0c2141] max-w-2xl w-[92%] md:w-[720px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-extrabold tracking-tight">Your Cart</DialogTitle>
          {customer ? (
            <div className="flex items-center justify-between">
              <p className="text-[#0c2141]/70 text-sm">Welcome, {customer.name}</p>
              <p className="text-[#f48a4f] font-semibold">
                {customer.unlimited || customer.points >= 999999
                  ? "∞ Unlimited Points"
                  : `${customer.points} points available`}
              </p>
            </div>
          ) : (
            <p className="text-[#0c2141]/70 text-sm">Please sign in to place an order</p>
          )}
        </DialogHeader>

        <div className="space-y-6">
          {/* Order Note */}
          <div>
            <label className="block text-sm font-semibold text-[#99074E] mb-1">Order Note (optional)</label>
            <Textarea
              rows={3}
              placeholder="Add any note or special request..."
              value={orderNote}
              onChange={(e) => setOrderNote(e.target.value)}
              className="w-full rounded-xl border border-black/10 px-4 py-2.5 outline-none focus:ring-4 ring-[#f48a4f]/40"
            />
          </div>

          {/* Cart Total */}
          <div className="rounded-xl border border-black/10 p-4 bg-[#0c2141]/5">
            <div className="text-right">
              <div className="text-sm text-[#0c2141]/70">Cart Total</div>
              <div className="text-2xl font-extrabold">{cartTotal} pts</div>
              {customer && (
                <div className={`text-sm mt-1 ${canAffordOrder() ? "text-emerald-600" : "text-rose-600"}`}>
                  {customer.unlimited || customer.points >= 999999
                    ? "✅ Unlimited points - you can order anything!"
                    : canAffordOrder()
                      ? "✅ You can afford this order"
                      : "❌ Not enough points"}
                </div>
              )}
            </div>
          </div>

          {/* Cart Items */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-[#0c2141]">Items</h4>
              <Button
                onClick={clearCart}
                variant="ghost"
                size="sm"
                className="text-[#99074E] hover:text-[#0c2141] hover:bg-[#99074E]/10"
              >
                Clear cart
              </Button>
            </div>
            {cart.length === 0 ? (
              <p className="text-[#0c2141]/60 text-sm">Your cart is empty.</p>
            ) : (
              <div className="space-y-3">
                {cart.map((item) => (
                  <div
                    key={item.sku}
                    className="rounded-xl border border-black/10 bg-white p-3 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="font-semibold text-[#0c2141] truncate">{item.name}</div>
                      <div className="text-[#0c2141]/70 text-sm">
                        {item.qty} × {item.price} pts
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => updateCartItem(item.sku, "dec")}
                        size="sm"
                        variant="ghost"
                        className="bg-[#0c2141]/5 text-[#0c2141] hover:bg-[#0c2141]/10"
                      >
                        -
                      </Button>
                      <Button
                        onClick={() => updateCartItem(item.sku, "inc")}
                        size="sm"
                        className="bg-[#99074E] text-white hover:brightness-110"
                      >
                        +
                      </Button>
                      <Button
                        onClick={() => updateCartItem(item.sku, "remove")}
                        size="sm"
                        variant="ghost"
                        className="bg-rose-50 text-rose-600 hover:bg-rose-100"
                      >
                        🗑️
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="text-rose-600 text-sm flex items-center gap-1">
              <AlertTriangle className="w-4 h-4" />
              {error}
            </div>
          )}

          {/* Place Order */}
          <div className="rounded-xl border border-black/10 p-4 bg-[#0c2141]/5">
            <div className="flex flex-wrap items-center gap-3">
              <Button
                onClick={placeOrder}
                disabled={loading || cart.length === 0 || !customer || !canAffordOrder()}
                className="inline-flex items-center gap-2 bg-[#f48a4f] hover:brightness-110 text-[#0c2141] font-semibold px-4 py-2 rounded-xl transition disabled:opacity-50"
              >
                <span>Place Order</span> ✅
              </Button>
              {loading && <span className="text-[#99074E] text-sm">Processing…</span>}
              {!customer && <span className="text-[#0c2141]/70 text-sm">Sign in required</span>}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
