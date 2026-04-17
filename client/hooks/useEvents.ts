"use client"

import { useEffect } from "react"
import { io, Socket } from "socket.io-client"
import { toast } from "sonner"

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3006"

export const useEvents = (scope: string, onRefresh: () => void) => {
  useEffect(() => {
    // Connect to the /events namespace defined in NestJS
    const socket: Socket = io(`${SOCKET_URL}/events`, {
      transports: ["websocket"],
      reconnectionAttempts: 5,
    })

    socket.on("connect", () => {
      console.log(`[WebSocket] Connected to /events scope: ${scope}`)
    })

    // Listen for the generic refresh signal
    socket.on("dashboard.refresh", (data: { scope: string }) => {
      if (data.scope === scope || data.scope === "all") {
        console.log(`[WebSocket] Refresh signal received for scope: ${scope}`)
        onRefresh()
        
        // Visual feedback
        toast.info("Actualización en tiempo real recibida", {
          description: "Los datos del dashboard se han sincronizado.",
          duration: 3000,
        })
      }
    })

    // Listen for specific business events to show notifications
    socket.on("orden.entregada", (data: any) => {
      if (scope === "gerencia" || scope === "logistics") {
        toast.success(`Orden ${data.orderNumber} entregada`, {
          description: "Se ha generado un borrador de factura automáticamente.",
        })
      }
    })

    socket.on("pago.aprobado", (data: any) => {
      toast.success("Pago conciliado", {
        description: `Factura por ${data.currency} ${data.amount} aprobada.`,
      })
    })

    socket.on("disconnect", () => {
      console.log("[WebSocket] Disconnected")
    })

    return () => {
      socket.disconnect()
    }
  }, [scope, onRefresh])
}
