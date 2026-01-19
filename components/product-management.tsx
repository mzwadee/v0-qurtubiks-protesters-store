"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { put } from "@vercel/blob"

interface Product {
  sku: string
  name: string
  price: number
  desc: string
  status: "in_stock" | "out_of_stock" | "coming_soon"
  imageUrl?: string
}

export function ProductManagement() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null)

  const [newProduct, setNewProduct] = useState({
    sku: "",
    name: "",
    price: 0,
    desc: "",
    status: "in_stock" as const,
    imageUrl: "",
    imageFile: null as File | null,
  })

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/products", { method: "GET" })
      if (!response.ok) throw new Error("Failed to load products")
      const data = await response.json()
      const products = (data as any[]).map((p) => ({
        ...p,
        status: p.status || (p.inStock ? "in_stock" : "out_of_stock"),
      }))
      setProducts(products)
      setError("")
    } catch (err) {
      console.error("Failed to load products:", err)
      setError("Failed to load products")
    } finally {
      setLoading(false)
    }
  }

  const saveProducts = async (updatedProducts: Product[]) => {
    try {
      setSaving(true)
      setProducts(updatedProducts)
      const response = await fetch("/api/products", { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedProducts)
      })
      if (!response.ok) throw new Error("Failed to save products")
      window.dispatchEvent(new CustomEvent("productsUpdated", { detail: updatedProducts }))
      setError("")
    } catch (err) {
      console.error("Failed to save products:", err)
      setError("Failed to save products")
      await loadProducts()
    } finally {
      setSaving(false)
    }
  }

  const handleImageUpload = async (index: number, file: File) => {
    try {
      setUploadingIndex(index)
      console.log("[v0] Uploading image:", file.name)
      const blob = await put(`products/${Date.now()}-${file.name}`, file, { access: "public" })
      console.log("[v0] Image uploaded:", blob.url)
      const updatedProducts = [...products]
      updatedProducts[index].imageUrl = blob.url
      setProducts(updatedProducts)
      await saveProducts(updatedProducts)
    } catch (err) {
      console.error("[v0] Failed to upload image:", err)
      setError("Failed to upload image")
    } finally {
      setUploadingIndex(null)
    }
  }

  const addProduct = async () => {
    setError("")

    if (!newProduct.sku || !newProduct.name || newProduct.price < 0) {
      setError("Please fill SKU, Name and a valid Price.")
      return
    }

    const normalizedSku = newProduct.sku.trim().toLowerCase()
    if (products.some((p) => p.sku.trim().toLowerCase() === normalizedSku)) {
      setError("SKU must be unique.")
      return
    }

    let imageUrl = ""
    
    // Upload image if provided
    if (newProduct.imageFile) {
      try {
        setUploadingIndex(-1) // Indicate uploading
        console.log("[v0] Uploading new product image:", newProduct.imageFile.name)
        const blob = await put(`products/${Date.now()}-${newProduct.imageFile.name}`, newProduct.imageFile, { access: "public" })
        imageUrl = blob.url
        console.log("[v0] New product image uploaded:", imageUrl)
      } catch (err) {
        console.error("[v0] Failed to upload new product image:", err)
        setError("Failed to upload image. Product may be saved without image.")
        setUploadingIndex(null)
      }
    }

    const productToAdd: Product = {
      sku: newProduct.sku.trim(),
      name: newProduct.name.trim(),
      price: Math.max(0, newProduct.price),
      desc: newProduct.desc.trim(),
      status: newProduct.status,
      imageUrl: imageUrl,
    }

    const updatedProducts = [...products, productToAdd]
    await saveProducts(updatedProducts)
    setNewProduct({ sku: "", name: "", price: 0, desc: "", status: "in_stock", imageUrl: "", imageFile: null })
    setUploadingIndex(null)
  }

  const updateProduct = async (index: number, field: keyof Product, value: any) => {
    const updatedProducts = [...products]
    updatedProducts[index] = { ...updatedProducts[index], [field]: value }
    setProducts(updatedProducts)
    await saveProducts(updatedProducts)
  }

  const deleteProduct = async (index: number) => {
    const updatedProducts = products.filter((_, i) => i !== index)
    await saveProducts(updatedProducts)
  }

  if (loading) {
    return <div className="text-white/90">Loading products...</div>
  }

  const statusOptions = ["in_stock", "out_of_stock", "coming_soon"] as const
  const statusLabels = { in_stock: "In Stock", out_of_stock: "Out of Stock", coming_soon: "Coming Soon" }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-2xl bg-rose-500/20 ring-1 ring-rose-500/30 p-4 mb-4">
          <p className="text-rose-200 text-sm">{error}</p>
        </div>
      )}

      {saving && (
        <div className="rounded-xl bg-emerald-500/15 border border-emerald-500/30 px-4 py-2 text-emerald-200 text-sm">
          ✓ Auto-saving changes...
        </div>
      )}

      <div className="rounded-2xl bg-white/10 ring-1 ring-white/15 p-4">
        <h3 className="font-extrabold mb-3 text-white">Add Product</h3>
        <div className="grid md:grid-cols-7 gap-3">
          <Input
            placeholder="SKU"
            value={newProduct.sku}
            onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })}
            className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
          />
          <Input
            placeholder="Name"
            value={newProduct.name}
            onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
            className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
          />
          <Input
            type="number"
            min="0"
            placeholder="Price"
            value={newProduct.price}
            onChange={(e) => setNewProduct({ ...newProduct, price: Number(e.target.value) })}
            className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
          />
          <Input
            placeholder="Description"
            value={newProduct.desc}
            onChange={(e) => setNewProduct({ ...newProduct, desc: e.target.value })}
            className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
          />
          <select
            value={newProduct.status}
            onChange={(e) => setNewProduct({ ...newProduct, status: e.target.value as any })}
            className="bg-white/10 border border-white/20 text-white rounded-lg px-3 py-2"
          >
            {statusOptions.map((s) => (
              <option key={s} value={s} className="bg-[#0c2141]">
                {statusLabels[s]}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 bg-white/10 border border-white/20 rounded-lg px-3 py-2 cursor-pointer text-white/90 hover:bg-white/20">
            <span className="text-sm">Image</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  const file = e.target.files[0]
                  setNewProduct({ 
                    ...newProduct, 
                    imageFile: file,
                    imageUrl: URL.createObjectURL(file)
                  })
                }
              }}
            />
          </label>
          <Button onClick={addProduct} className="bg-[#f48a4f] text-[#0c2141] hover:brightness-110 font-semibold">
            Add
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl ring-1 ring-white/15 bg-white/10">
        <table className="min-w-full text-left">
          <thead className="bg-white/10">
            <tr className="text-sm">
              <th className="px-4 py-3 text-white">Image</th>
              <th className="px-4 py-3 text-white">SKU</th>
              <th className="px-4 py-3 text-white">Name</th>
              <th className="px-4 py-3 text-white">Price</th>
              <th className="px-4 py-3 text-white">Status</th>
              <th className="px-4 py-3 text-white">Description</th>
              <th className="px-4 py-3 text-white">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {products.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-4 text-white/80">
                  No products yet.
                </td>
              </tr>
            ) : (
              products.map((product, index) => (
                <tr key={`${product.sku}-${index}`}>
                  <td className="px-4 py-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#f48a4f] to-[#99074E] overflow-hidden">
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl || "/placeholder.svg"}
                            alt="Product"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-white/60">
                            No img
                          </div>
                        )}
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files?.[0]) {
                            handleImageUpload(index, e.target.files[0])
                          }
                        }}
                        disabled={uploadingIndex === index}
                      />
                      {uploadingIndex === index && <span className="text-xs text-white/60">Uploading...</span>}
                    </label>
                  </td>
                  <td className="px-4 py-3">
                    <Input
                      value={product.sku}
                      onChange={(e) => updateProduct(index, "sku", e.target.value)}
                      className="bg-white/10 border-white/20 text-white w-32"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Input
                      value={product.name}
                      onChange={(e) => updateProduct(index, "name", e.target.value)}
                      className="bg-white/10 border-white/20 text-white w-40"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Input
                      type="number"
                      min="0"
                      value={product.price}
                      onChange={(e) => updateProduct(index, "price", Number(e.target.value))}
                      className="bg-white/10 border-white/20 text-white w-24"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={product.status}
                      onChange={(e) => updateProduct(index, "status", e.target.value)}
                      className="bg-white/10 border border-white/20 text-white rounded px-2 py-1 text-sm"
                    >
                      {statusOptions.map((s) => (
                        <option key={s} value={s} className="bg-[#0c2141]">
                          {statusLabels[s]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <Input
                      value={product.desc}
                      onChange={(e) => updateProduct(index, "desc", e.target.value)}
                      className="bg-white/10 border-white/20 text-white w-48"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Button
                      onClick={() => deleteProduct(index)}
                      variant="ghost"
                      size="sm"
                      className="bg-rose-500/20 text-rose-200 hover:bg-rose-500/30"
                    >
                      Delete
                    </Button>
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
