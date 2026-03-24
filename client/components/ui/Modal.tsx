"use client"

import { useEffect } from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils/cn"

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  size?: "sm" | "md" | "lg"
}

const sizeStyles = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-2xl",
}

export default function Modal({ open, onClose, title, children, size = "md" }: ModalProps) {
  useEffect(() => {
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    if (open) document.addEventListener("keydown", handleEsc)
    return () => document.removeEventListener("keydown", handleEsc)
  }, [open, onClose])

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden"
    else document.body.style.overflow = ""
    return () => { document.body.style.overflow = "" }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 backdrop-blur-sm"
        style={{ background: "rgba(12,12,10,0.7)" }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={cn(
          "relative rounded-xl w-full mx-4 overflow-hidden shadow-2xl",
          sizeStyles[size]
        )}
        style={{
          background: "#ffffff",
          border: "1px solid rgba(12,12,10,0.08)",
        }}
      >
        {/* Header */}
        {title && (
          <div
            className="flex items-center justify-between px-6 py-4"
            style={{ borderBottom: "1px solid rgba(12,12,10,0.07)" }}
          >
            <h2
              className="font-semibold"
              style={{ fontSize: "0.95rem", letterSpacing: "-0.01em", color: "#0C0C0A" }}
            >
              {title}
            </h2>
            <button
              onClick={onClose}
              className="p-1 rounded transition-colors cursor-pointer"
              style={{ color: "#9A9489" }}
              onMouseOver={(e) => (e.currentTarget.style.color = "#0C0C0A")}
              onMouseOut={(e) => (e.currentTarget.style.color = "#9A9489")}
            >
              <X size={18} />
            </button>
          </div>
        )}

        {/* Body */}
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  )
}
