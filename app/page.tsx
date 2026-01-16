"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { CartModal } from "@/components/cart-modal"
import { SignInModal } from "@/components/sign-in-modal"
import { UserNotifications } from "@/components/user-notifications"
import { cloudStorage } from "@/lib/cloud-storage"
import { useRouter } from "next/navigation"

interface Product {
  sku: string
  name: string
  price: number
  desc: string
  status: "in_stock" | "out_of_stock" | "coming_soon"
  imageUrl?: string
}

interface CartItem {
  sku: string
  name: string
  price: number
  qty: number
}

interface Customer {
  id: string
  name: string
  email: string
  points: number
  createdAt: string
  unlimited?: boolean
}

export default function HomePage() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [cartOpen, setCartOpen] = useState(false)
  const [signInOpen, setSignInOpen] = useState(false)
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [loading, setLoading] = useState(true)
  const [checkingAuth, setCheckingAuth] = useState(true)

  useEffect(() => {
    const checkAuth = () => {
      const saved = localStorage.getItem("customer")
      const session = localStorage.getItem("customerSession")

      if (!saved || session !== "active") {
        // Not logged in, redirect to sign-in
        router.replace("/sign-in")
        return
      }

      try {
        const customerData = JSON.parse(saved)
        setCustomer(customerData)
        setCheckingAuth(false)

        // Sync with cloud in background (don't block UI)
        syncCustomerInBackground(customerData.id)
      } catch (error) {
        console.error("[v0] Auth check failed:", error)
        localStorage.removeItem("customer")
        localStorage.removeItem("customerSession")
        router.replace("/sign-in")
      }
    }

    checkAuth()
  }, [router])

  const syncCustomerInBackground = async (customerId: string) => {
    try {
      const response = await fetch("/api/customers")
      if (response.ok) {
        const customers = await response.json()
        const cloudCustomer = customers.find((c: Customer) => c.id === customerId)
        if (cloudCustomer) {
          setCustomer(cloudCustomer)
          localStorage.setItem("customer", JSON.stringify(cloudCustomer))
        }
      }
    } catch (error) {
      // Silently fail - we already have local data
    }
  }

  useEffect(() => {
    if (!checkingAuth && customer) {
      loadProducts()
      loadCart()

      const handleProductsUpdated = (event: any) => {
        setProducts(event.detail)
      }

      window.addEventListener("productsUpdated", handleProductsUpdated)

      return () => {
        window.removeEventListener("productsUpdated", handleProductsUpdated)
      }
    }
  }, [checkingAuth, customer])

  const loadProducts = async () => {
    try {
      const data = await cloudStorage.getProducts()
      const products = (data as any[]).map((p) => ({
        ...p,
        status: p.status || (p.inStock ? "in_stock" : "out_of_stock"),
      }))
      setProducts(products)
    } catch (err) {
      console.error("Failed to load products:", err)
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  const loadCart = () => {
    const saved = localStorage.getItem("cart")
    if (saved) {
      try {
        const cartData = JSON.parse(saved)
        setCart(Array.isArray(cartData) ? cartData : [])
      } catch {
        setCart([])
      }
    }
  }

  const saveCart = (newCart: CartItem[]) => {
    setCart(newCart)
    localStorage.setItem("cart", JSON.stringify(newCart))
    localStorage.setItem("cartLastUpdate", Date.now().toString())
  }

  const handleSignIn = (newCustomer: Customer) => {
    setCustomer(newCustomer)
    localStorage.setItem("customer", JSON.stringify(newCustomer))
    localStorage.setItem("customerSession", "active")

    setTimeout(() => {
      window.dispatchEvent(
        new CustomEvent("customerSignedIn", {
          detail: newCustomer,
        }),
      )
      window.dispatchEvent(new Event("storage"))
    }, 100)
  }

  const handleSignOut = () => {
    setCustomer(null)
    localStorage.removeItem("customer")
    localStorage.removeItem("customerSession")
    setCart([])
    localStorage.removeItem("cart")
    router.replace("/sign-in")
  }

  const addToCart = (product: Product) => {
    if (!customer) {
      setSignInOpen(true)
      return
    }

    const existing = cart.find((item) => item.sku === product.sku)
    if (existing) {
      const newCart = cart.map((item) => (item.sku === product.sku ? { ...item, qty: item.qty + 1 } : item))
      saveCart(newCart)
    } else {
      const newCart = [...cart, { sku: product.sku, name: product.name, price: product.price, qty: 1 }]
      saveCart(newCart)
    }
  }

  const getCartTotal = () => cart.reduce((sum, item) => sum + item.price * item.qty, 0)
  const getCartItemCount = () => cart.reduce((sum, item) => sum + item.qty, 0)

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0c2141] via-[#99074E] to-[#f48a4f] flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0c2141] via-[#99074E] to-[#f48a4f] text-white">
      <UserNotifications />

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
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">QURTUBLOX STORE</h1>
          </div>
          <div className="flex items-center gap-3">
            {customer && (
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="font-semibold">{customer.name}</div>
                  <div className="text-xs text-white/70">{customer.email}</div>
                  <div className="text-sm text-[#f48a4f]">
                    {customer.unlimited || customer.points >= 999999 ? "∞" : customer.points} points
                  </div>
                </div>
                <Button onClick={handleSignOut} className="bg-white/10 text-white/90 hover:bg-white/20 font-semibold">
                  Sign Out
                </Button>
              </div>
            )}
            <Button
              onClick={() => router.push("/admin")}
              className="bg-white/10 text-white/90 hover:bg-white/20 font-semibold"
            >
              Admin
            </Button>
            <Button
              onClick={() => setCartOpen(true)}
              className="inline-flex items-center gap-2 bg-[#f48a4f] hover:brightness-110 active:brightness-95 text-[#0c2141] font-semibold px-4 py-2 rounded-xl shadow-lg shadow-black/20 transition"
            >
              <span>Open Cart</span>
              <div className="min-w-6 h-6 px-1 grid place-items-center text-xs font-bold bg-[#0c2141] text-[#f48a4f] rounded-full">
                {getCartItemCount()}
              </div>
            </Button>
          </div>
        </header>

        {/* Products Grid */}
        <main>
          {loading ? (
            <div className="text-white/90 text-center py-20">Loading products...</div>
          ) : products.length === 0 ? (
            <div className="text-white/90 text-center py-20">No products available yet.</div>
          ) : (
            <div className="grid md:grid-cols-3 gap-6">
              {products.map((product) => (
                <div key={product.sku} className="relative rounded-2xl overflow-hidden group">
                  <div className="relative h-64 bg-gradient-to-br from-[#f48a4f] to-[#99074E] overflow-hidden">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl || "/placeholder.svg"}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white/30 text-sm">
                        No image
                      </div>
                    )}
                    <div className="absolute top-3 right-3">
                      <span
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold backdrop-blur ${
                          product.status === "in_stock"
                            ? "bg-emerald-500/80 text-emerald-50"
                            : product.status === "out_of_stock"
                              ? "bg-rose-500/80 text-rose-50"
                              : "bg-blue-500/80 text-blue-50"
                        }`}
                      >
                        {product.status === "in_stock"
                          ? "In Stock"
                          : product.status === "out_of_stock"
                            ? "Out of Stock"
                            : "Coming Soon"}
                      </span>
                    </div>
                  </div>

                  <div className="p-5 bg-white/10 ring-1 ring-white/15 backdrop-blur">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="font-bold truncate">{product.name || "—"}</h3>
                        {product.desc && (
                          <p className="text-white/90 text-sm md:text-base mt-1 break-words">{product.desc}</p>
                        )}
                        <p className="text-white/70 text-xs mt-1 truncate">SKU: {product.sku || "—"}</p>
                      </div>
                      <span className="text-[#f48a4f] font-extrabold whitespace-nowrap">
                        {Number(product.price || 0)} pts
                      </span>
                    </div>
                    <div className="mt-4 flex items-center justify-end">
                      <Button
                        onClick={() => addToCart(product)}
                        disabled={product.status !== "in_stock"}
                        className={`font-semibold px-4 py-2 rounded-xl transition ${
                          product.status === "in_stock"
                            ? "bg-[#f48a4f] text-[#0c2141] hover:brightness-110"
                            : "bg-white/10 text-white/40 cursor-not-allowed"
                        }`}
                      >
                        {product.status === "in_stock"
                          ? "Add"
                          : product.status === "out_of_stock"
                            ? "Out of Stock"
                            : "Coming Soon"}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Modals */}
      <CartModal
        open={cartOpen}
        onOpenChange={setCartOpen}
        cart={cart}
        onUpdateCart={saveCart}
        cartTotal={getCartTotal()}
        customer={customer}
        onCustomerUpdate={setCustomer}
      />

      <SignInModal open={signInOpen} onOpenChange={setSignInOpen} onSignIn={handleSignIn} />
    </div>
  )
}
