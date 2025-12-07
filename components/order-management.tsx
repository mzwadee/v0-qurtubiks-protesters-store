"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cloudStorage } from "@/lib/cloud-storage"

interface Order {
  id: string
  at: string
  personName: string
  email: string
  note: string
  adminNote: string
  items: Array<{
    sku: string
    name: string
    qty: number
    price: number
  }>
  total: number
  status: "open" | "completed"
}

export function OrderManagement() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [adminNote, setAdminNote] = useState("")
  const [notesDialogOpen, setNotesDialogOpen] = useState(false)

  useEffect(() => {
    loadOrders()
  }, [])

  const loadOrders = async () => {
    try {
      setLoading(true)
      const data = await cloudStorage.getOrders()
      setOrders(data)
    } catch (err) {
      console.error("Failed to load orders:", err)
    } finally {
      setLoading(false)
    }
  }

  const saveOrders = async (updatedOrders: Order[]) => {
    try {
      await cloudStorage.saveOrders(updatedOrders)
      setOrders(updatedOrders)
    } catch (err) {
      console.error("Failed to save orders:", err)
    }
  }

  const toggleOrderStatus = async (orderId: string) => {
    const updatedOrders = orders.map((order) =>
      order.id === orderId ? { ...order, status: order.status === "completed" ? "open" : "completed" } : order,
    )
    await saveOrders(updatedOrders)
  }

  const deleteOrder = async (orderId: string) => {
    const updatedOrders = orders.filter((order) => order.id !== orderId)
    await saveOrders(updatedOrders)
  }

  const openNotesDialog = (order: Order) => {
    setSelectedOrder(order)
    setAdminNote(order.adminNote || "")
    setNotesDialogOpen(true)
  }

  const saveAdminNote = async () => {
    if (!selectedOrder) return

    const updatedOrders = orders.map((order) =>
      order.id === selectedOrder.id ? { ...order, adminNote: adminNote } : order,
    )
    await saveOrders(updatedOrders)
    setNotesDialogOpen(false)
    setSelectedOrder(null)
    setAdminNote("")
  }

  const openOrders = orders.filter((order) => order.status === "open")
  const completedOrders = orders.filter((order) => order.status === "completed")

  const renderOrderTable = (ordersList: Order[]) => (
    <div className="overflow-x-auto rounded-xl ring-1 ring-white/15 bg-white/5">
      <table className="min-w-full text-left">
        <thead className="bg-white/10">
          <tr className="text-sm">
            <th className="px-4 py-3 text-white">Time</th>
            <th className="px-4 py-3 text-white">Customer</th>
            <th className="px-4 py-3 text-white">Email</th>
            <th className="px-4 py-3 text-white">Items</th>
            <th className="px-4 py-3 text-white">Total</th>
            <th className="px-4 py-3 text-white">Note</th>
            <th className="px-4 py-3 text-white">Status</th>
            <th className="px-4 py-3 text-white">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/10">
          {ordersList.length === 0 ? (
            <tr>
              <td colSpan={8} className="px-4 py-4 text-white/80">
                No orders yet.
              </td>
            </tr>
          ) : (
            ordersList.map((order) => {
              const time = new Date(order.at).toLocaleString()
              const itemsText = order.items.map((item) => `${item.name} (${item.qty}×${item.price})`).join(", ")
              const notePreview = order.note.length > 40 ? order.note.slice(0, 37) + "..." : order.note || "—"

              return (
                <tr key={order.id}>
                  <td className="px-4 py-3 text-white/90 align-top whitespace-nowrap">{time}</td>
                  <td className="px-4 py-3 text-white/90 align-top">{order.personName || "—"}</td>
                  <td className="px-4 py-3 text-white/80 align-top">{order.email}</td>
                  <td className="px-4 py-3 text-white/90 align-top">{itemsText}</td>
                  <td className="px-4 py-3 text-white/90 font-bold align-top">{order.total} pts</td>
                  <td className="px-4 py-3 text-white/90 align-top max-w-[220px]">{notePreview}</td>
                  <td className="px-4 py-3 align-top">
                    <span
                      className={`inline-flex items-center gap-2 px-2 py-1 rounded-lg text-xs font-semibold ${
                        order.status === "completed"
                          ? "bg-emerald-500/15 text-emerald-300"
                          : "bg-amber-500/15 text-amber-200"
                      }`}
                    >
                      {order.status === "completed" ? "Completed" : "Open"}
                    </span>
                  </td>
                  <td className="px-4 py-3 flex flex-wrap gap-2 align-top">
                    <Button
                      onClick={() => openNotesDialog(order)}
                      size="sm"
                      className="bg-[#f48a4f] text-[#0c2141] hover:brightness-110 font-semibold"
                    >
                      View notes
                    </Button>
                    <Button
                      onClick={() => toggleOrderStatus(order.id)}
                      size="sm"
                      className={`font-semibold ${
                        order.status === "completed"
                          ? "bg-amber-500/20 text-amber-200 hover:bg-amber-500/30"
                          : "bg-emerald-500/20 text-emerald-200 hover:bg-emerald-500/30"
                      }`}
                    >
                      {order.status === "completed" ? "Undo" : "Complete"}
                    </Button>
                    <Button
                      onClick={() => deleteOrder(order.id)}
                      size="sm"
                      variant="ghost"
                      className="bg-white/10 text-white/90 hover:bg-white/20"
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              )
            })
          )}
        </tbody>
      </table>
    </div>
  )

  if (loading) {
    return <div className="text-white/90">Loading orders...</div>
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-white/10 ring-1 ring-white/15 p-4">
        <Tabs defaultValue="todo" className="w-full">
          <TabsList className="bg-white/10 mb-4">
            <TabsTrigger value="todo" className="data-[state=active]:bg-[#f48a4f] data-[state=active]:text-[#0c2141]">
              To-Do Orders ({openOrders.length})
            </TabsTrigger>
            <TabsTrigger
              value="completed"
              className="data-[state=active]:bg-[#f48a4f] data-[state=active]:text-[#0c2141]"
            >
              Completed Orders ({completedOrders.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="todo">
            <h3 className="font-extrabold mb-3 text-white">To-Do Orders</h3>
            {renderOrderTable(openOrders)}
          </TabsContent>

          <TabsContent value="completed">
            <h3 className="font-extrabold mb-3 text-white">Completed Orders</h3>
            {renderOrderTable(completedOrders)}
          </TabsContent>
        </Tabs>
      </div>

      {/* Order Notes Dialog */}
      <Dialog open={notesDialogOpen} onOpenChange={setNotesDialogOpen}>
        <DialogContent className="bg-white text-[#0c2141] max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-extrabold">Order Notes</DialogTitle>
            <p className="text-sm text-[#0c2141]/70">See customer note and add an admin note.</p>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <div className="text-xs font-semibold text-[#99074E] mb-1">Customer Note</div>
              <div className="rounded-xl border border-black/10 bg-[#0c2141]/5 p-3 text-sm text-[#0c2141]/85 min-h-[52px]">
                {selectedOrder?.note || "—"}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#99074E] mb-1">Admin Note</label>
              <Textarea
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                rows={4}
                placeholder="Write a note for this order..."
                className="w-full rounded-xl border border-black/10 px-4 py-2.5 outline-none focus:ring-4 ring-[#f48a4f]/40"
              />
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 mt-5">
            <Button onClick={saveAdminNote} className="bg-[#f48a4f] text-[#0c2141] hover:brightness-110 font-semibold">
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
