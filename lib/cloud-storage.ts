export const cloudStorage = {
  async getProducts() {
    try {
      console.log("[v0] Fetching products from Blob storage via API...")
      const response = await fetch("/api/products")
      if (!response.ok) {
        throw new Error(`Failed to fetch products: ${response.status}`)
      }
      const products = await response.json()
      console.log("[v0] Successfully fetched products from Blob:", products.length)
      return products
    } catch (error) {
      console.error("Failed to fetch products:", error)
      return []
    }
  },

  async saveProducts(products: any[]) {
    try {
      console.log("[v0] Saving products to Blob storage:", products.length)

      const response = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(products),
      })

      if (!response.ok) {
        throw new Error(`Save failed with status: ${response.status}`)
      }

      console.log("[v0] Products saved to Blob successfully")
      return await response.json()
    } catch (error) {
      console.error("Failed to save products:", error)
      throw error
    }
  },

  async getOrders() {
    try {
      console.log("[v0] Fetching orders from Blob storage via API...")
      const response = await fetch("/api/orders")
      if (!response.ok) {
        throw new Error(`Failed to fetch orders: ${response.status}`)
      }
      const orders = await response.json()
      console.log("[v0] Successfully fetched orders from Blob:", orders.length)
      return orders
    } catch (error) {
      console.error("Failed to fetch orders:", error)
      return []
    }
  },

  async saveOrders(orders: any[]) {
    try {
      console.log("[v0] Saving orders to Blob storage:", orders.length)

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orders),
      })

      if (!response.ok) {
        throw new Error(`Save failed with status: ${response.status}`)
      }

      console.log("[v0] Orders saved to Blob successfully")
      return await response.json()
    } catch (error) {
      console.error("Failed to save orders:", error)
      throw error
    }
  },

  async getCustomers() {
    try {
      console.log("[v0] Fetching customers from Blob storage via API...")
      const response = await fetch("/api/customers")
      if (!response.ok) {
        throw new Error(`Failed to fetch customers: ${response.status}`)
      }
      const customers = await response.json()
      console.log("[v0] Successfully fetched customers from Blob:", customers.length)
      return customers || []
    } catch (error) {
      console.error("[v0] Failed to fetch customers:", error)
      return []
    }
  },

  async saveCustomer(customer: any) {
    try {
      console.log("[v0] Saving customer to Blob storage:", customer.name)

      const response = await fetch("/api/customers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(customer),
      })

      if (!response.ok) {
        throw new Error(`Save failed with status: ${response.status}`)
      }

      console.log("[v0] Customer saved to Blob successfully")
      return await response.json()
    } catch (error) {
      console.error("Failed to save customer:", error)
      throw error
    }
  },
}
