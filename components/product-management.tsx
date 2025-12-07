"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { cloudStorage } from "@/lib/cloud-storage"

interface Product {
  sku: string
  name: string
  price: number
  desc: string
  inStock: boolean
}

export function ProductManagement() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)
  const [editingProduct, setEditingProduct] = useState<{ index: number; field: string; value: any } | null>(null)

  // Form state
  const [newProduct, setNewProduct] = useState({
    sku: "",
    name: "",
    price: 0,
    desc: "",
    inStock: true,
  })

  useEffect(() => {
    loadProducts()
  }, [])

  useEffect(() => {
    if (editingProduct) {
      const timer = setTimeout(() => {
        const { index, field, value } = editingProduct
        performUpdate(index, field, value)
        setEditingProduct(null)
      }, 1000)

      return () => clearTimeout(timer)
    }
  }, [editingProduct])

  const loadProducts = async () => {
    try {
      setLoading(true)
      const data = await cloudStorage.getProducts()
      console.log("[v0] Loaded products:", data)
      setProducts(data)
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
      console.log("[v0] Saving products:", updatedProducts)

      setProducts(updatedProducts)

      await cloudStorage.saveProducts(updatedProducts)

      window.dispatchEvent(new CustomEvent("productsUpdated", { detail: updatedProducts }))

      setError("")
      console.log("[v0] Products saved successfully to cloud")
    } catch (err) {
      console.error("Failed to save products:", err)
      setError("Failed to save products")
      await loadProducts()
    } finally {
      setSaving(false)
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

    const productToAdd: Product = {
      sku: newProduct.sku.trim(),
      name: newProduct.name.trim(),
      price: Math.max(0, newProduct.price),
      desc: newProduct.desc.trim(),
      inStock: newProduct.inStock,
    }

    const updatedProducts = [...products, productToAdd]
    console.log("[v0] Adding new product to existing list:", productToAdd)
    console.log("[v0] Updated products list:", updatedProducts)

    await saveProducts(updatedProducts)

    setNewProduct({ sku: "", name: "", price: 0, desc: "", inStock: true })
  }

  const updateProduct = (index: number, field: keyof Product, value: any) => {
    // Update UI immediately
    const updatedProducts = [...products]
    updatedProducts[index] = { ...updatedProducts[index], [field]: value }
    setProducts(updatedProducts)

    // Set up debounced save
    setEditingProduct({ index, field, value })
  }

  const performUpdate = async (index: number, field: keyof Product, value: any) => {
    const updatedProducts = [...products]
    updatedProducts[index] = { ...updatedProducts[index], [field]: value }
    await saveProducts(updatedProducts)
  }

  const deleteProduct = async (index: number) => {
    console.log("[v0] Deleting product at index:", index)
    console.log("[v0] Current products before delete:", products)

    const updatedProducts = products.filter((_, i) => i !== index)
    console.log("[v0] Products after delete:", updatedProducts)

    await saveProducts(updatedProducts)
    console.log("[v0] Delete operation completed, products saved to cloud")
  }

  if (loading) {
    return <div className="text-white/90">Loading products...</div>
  }

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
        <div className="grid md:grid-cols-6 gap-3">
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
          <div className="flex items-center gap-2 text-white/90">
            <Checkbox
              checked={newProduct.inStock}
              onCheckedChange={(checked) => setNewProduct({ ...newProduct, inStock: !!checked })}
              className="border-white/30"
            />
            <span className="text-sm">In Stock</span>
          </div>
          <Button onClick={addProduct} className="bg-[#f48a4f] text-[#0c2141] hover:brightness-110 font-semibold">
            Add
          </Button>
        </div>
        {error && <p className="text-rose-200 text-sm mt-2">{error}</p>}
      </div>

      <div className="overflow-x-auto rounded-xl ring-1 ring-white/15 bg-white/10">
        <table className="min-w-full text-left">
          <thead className="bg-white/10">
            <tr className="text-sm">
              <th className="px-4 py-3 text-white">SKU</th>
              <th className="px-4 py-3 text-white">Name</th>
              <th className="px-4 py-3 text-white">Price (pts)</th>
              <th className="px-4 py-3 text-white">Description</th>
              <th className="px-4 py-3 text-white">In stock</th>
              <th className="px-4 py-3 text-white">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {products.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-4 text-white/80">
                  No products yet.
                </td>
              </tr>
            ) : (
              products.map((product, index) => (
                <tr key={`${product.sku}-${index}`}>
                  <td className="px-4 py-3">
                    <Input
                      value={product.sku}
                      onChange={(e) => updateProduct(index, "sku", e.target.value)}
                      className="bg-white/10 border-white/20 text-white w-40"
                      disabled={saving}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Input
                      value={product.name}
                      onChange={(e) => updateProduct(index, "name", e.target.value)}
                      className="bg-white/10 border-white/20 text-white w-64"
                      disabled={saving}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Input
                      type="number"
                      min="0"
                      value={product.price}
                      onChange={(e) => updateProduct(index, "price", Number(e.target.value))}
                      className="bg-white/10 border-white/20 text-white w-28"
                      disabled={saving}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Input
                      value={product.desc}
                      onChange={(e) => updateProduct(index, "desc", e.target.value)}
                      className="bg-white/10 border-white/20 text-white w-64"
                      disabled={saving}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={product.inStock}
                        onCheckedChange={(checked) => updateProduct(index, "inStock", !!checked)}
                        className="border-white/30"
                        disabled={saving}
                      />
                      <span className="text-sm text-white">{product.inStock ? "In Stock" : "Out of Stock"}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Button
                      onClick={() => deleteProduct(index)}
                      variant="ghost"
                      size="sm"
                      className="bg-rose-500/20 text-rose-200 hover:bg-rose-500/30"
                      disabled={saving}
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
