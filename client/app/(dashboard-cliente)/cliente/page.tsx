"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import {
  Package, BarChart2, ArrowRight, AlertTriangle,
  CheckCircle, RefreshCw, Plus,
} from "lucide-react"
import { api } from "@/lib/api/client"
import { ENDPOINTS } from "@/lib/api/endpoints"

const EASE = [0.16, 1, 0.3, 1] as const

/* ─── Types ─────────────────────────────────────── */
type OrderStatus =
  | "REGISTRADA" | "ASIGNADA" | "LISTA_PARA_DESPACHO"
  | "EN_TRANSITO" | "ENTREGADA" | "BLOQUEADA" | "CANCELADA"

interface RecentOrder {
  orderId: string
  orderNumber: string
  destination: string
  status: OrderStatus
  requestedAt: string
}

interface DashboardAlert {
  type: "INVOICE_PENDING"
  invoiceNumber: string
  message: string
  dueDate: string
  amount: number
}

interface DashboardSummary {
  clientName: string
  displayName?: string
  isBlocked: boolean
  creditLimit: number
  totalOwed: number
  availableCredit: number
  activeOrdersCount: number
  recentOrders: RecentOrder[]
  alerts: DashboardAlert[]
}

/* ─── Helpers ────────────────────────────────────── */
function formatQ(n: number) {
  return `Q ${n.toLocaleString("es-GT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
function formatQShort(n: number) {
  if (n >= 1_000_000) return `Q${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `Q${(n / 1_000).toFixed(0)}k`
  return `Q${n}`
}

const STATUS_META: Record<OrderStatus, { label: string; color: string; bg: string }> = {
  REGISTRADA:          { label: "Registrada",        color: "#9A9489", bg: "rgba(154,148,137,0.08)" },
  ASIGNADA:            { label: "Asignada",           color: "#C9924B", bg: "rgba(201,146,75,0.08)" },
  LISTA_PARA_DESPACHO: { label: "Lista p/ Despacho",  color: "#C9924B", bg: "rgba(201,146,75,0.1)" },
  EN_TRANSITO:         { label: "En Tránsito",        color: "#3A8E2A", bg: "rgba(58,142,42,0.08)" },
  ENTREGADA:           { label: "Entregada",          color: "#6B6260", bg: "rgba(107,98,96,0.06)" },
  BLOQUEADA:           { label: "Bloqueada",          color: "#E53E3E", bg: "rgba(229,62,62,0.08)" },
  CANCELADA:           { label: "Cancelada",          color: "#6B6260", bg: "rgba(107,98,96,0.06)" },
}

type Tab = "resumen" | "ordenes" | "alertas"

/* ─── Tab: Resumen ───────────────────────────────── */
function TabResumen({ data, onSwitchTab }: { data: DashboardSummary; onSwitchTab: (t: Tab) => void }) {
  const pct = data.creditLimit > 0 ? Math.min((data.totalOwed / data.creditLimit) * 100, 100) : 0
  const barColor = pct > 80 ? "#E53E3E" : pct > 50 ? "#C9924B" : "#3A8E2A"

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "12px" }}>
      {/* Órdenes Activas */}
      <button onClick={() => onSwitchTab("ordenes")} style={{ all: "unset", cursor: "pointer", display: "block" }}>
        <div style={{
          background: "#1E1E1B", borderRadius: "6px", padding: "1.5rem",
          display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem",
          transition: "transform 0.15s",
        }}
          onMouseOver={e => (e.currentTarget.style.transform = "translateY(-2px)")}
          onMouseOut={e => (e.currentTarget.style.transform = "translateY(0)")}
        >
          <p style={{ fontSize: "0.5rem", letterSpacing: "0.25em", color: "#9A9489", textTransform: "uppercase", fontWeight: 700, textAlign: "center" }}>
            Órdenes Activas
          </p>
          <p style={{ fontSize: "clamp(3rem, 6vw, 4.5rem)", fontWeight: 900, letterSpacing: "-0.05em", color: data.activeOrdersCount === 0 ? "#6B6260" : "#C9924B", lineHeight: 1 }}>
            {data.activeOrdersCount}
          </p>
          <p style={{ fontSize: "0.65rem", color: "#6B6260" }}>
            {data.activeOrdersCount === 1 ? "orden en curso" : "órdenes en curso"}
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.6rem", color: "#C9924B", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", marginTop: "4px" }}>
            Ver órdenes <ArrowRight size={10} />
          </div>
        </div>
      </button>

      {/* Límite de crédito */}
      <div style={{
        background: "#ffffff", border: "1px solid rgba(12,12,10,0.07)", borderRadius: "6px",
        padding: "1.5rem", display: "flex", flexDirection: "column", gap: "0.75rem",
      }}>
        <p style={{ fontSize: "0.5rem", letterSpacing: "0.25em", color: "#9A9489", textTransform: "uppercase", fontWeight: 700 }}>Límite de Crédito</p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1 }}>
          <BarChart2 size={28} style={{ color: "#C9924B" }} />
        </div>
        <div style={{ background: "rgba(12,12,10,0.06)", borderRadius: "2px", height: "4px", overflow: "hidden" }}>
          <div style={{ height: "4px", background: barColor, width: `${pct}%`, transition: "width 1s ease", borderRadius: "2px" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div>
            <p style={{ fontSize: "0.48rem", letterSpacing: "0.15em", color: "#9A9489", textTransform: "uppercase", fontWeight: 700 }}>Consumido</p>
            <p style={{ fontSize: "0.72rem", fontWeight: 700, color: "#E53E3E" }}>{formatQ(data.totalOwed)}</p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ fontSize: "0.48rem", letterSpacing: "0.15em", color: "#9A9489", textTransform: "uppercase", fontWeight: 700 }}>Total</p>
            <p style={{ fontSize: "0.72rem", fontWeight: 700, color: "#3A8E2A" }}>{formatQ(data.creditLimit)}</p>
          </div>
        </div>
      </div>

      {/* Saldo restante */}
      <Link href="/cliente/estado-cuenta" style={{ display: "block", textDecoration: "none" }}>
        <div style={{
          background: "#ffffff", border: "1px solid rgba(12,12,10,0.07)", borderRadius: "6px",
          padding: "1.5rem", display: "flex", flexDirection: "column", gap: "0.5rem",
          transition: "transform 0.15s, border-color 0.15s", height: "100%", boxSizing: "border-box",
        }}
          onMouseOver={e => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = "rgba(201,146,75,0.3)"; el.style.transform = "translateY(-2px)" }}
          onMouseOut={e => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = "rgba(12,12,10,0.07)"; el.style.transform = "translateY(0)" }}
        >
          <p style={{ fontSize: "0.5rem", letterSpacing: "0.25em", color: "#9A9489", textTransform: "uppercase", fontWeight: 700 }}>Saldo Restante</p>
          <p style={{ fontSize: "clamp(1.6rem, 3vw, 2.5rem)", fontWeight: 900, letterSpacing: "-0.04em", color: "#0C0C0A", lineHeight: 1 }}>
            {formatQShort(Math.max(data.availableCredit, 0))}
          </p>
          <div style={{ flex: 1, display: "flex", alignItems: "flex-end" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "0.6rem", color: "#C9924B", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>
              Ver estado de cuenta <ArrowRight size={10} />
            </div>
          </div>
        </div>
      </Link>
    </div>
  )
}

/* ─── Tab: Órdenes ───────────────────────────────── */
function TabOrdenes({ orders }: { orders: RecentOrder[] }) {
  if (orders.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "3rem 0" }}>
        <Package size={28} style={{ color: "#9A9489", margin: "0 auto 0.75rem" }} />
        <p style={{ fontSize: "0.55rem", letterSpacing: "0.22em", color: "#9A9489", textTransform: "uppercase", fontWeight: 700, marginBottom: "4px" }}>Sin órdenes</p>
        <p style={{ fontSize: "0.78rem", color: "#6B6260" }}>Crea tu primer servicio con el botón de arriba.</p>
      </div>
    )
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "4px" }}>
        <Link href="/cliente/ordenes" style={{
          display: "flex", alignItems: "center", gap: "5px", textDecoration: "none",
          fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#C9924B",
        }}>
          Ver historial completo <ArrowRight size={10} />
        </Link>
      </div>
      {orders.map((order) => {
        const meta = STATUS_META[order.status] ?? STATUS_META.REGISTRADA
        const fecha = new Date(order.requestedAt).toLocaleDateString("es-GT", { day: "2-digit", month: "2-digit", year: "2-digit" })
        return (
          <div key={order.orderId} style={{
            background: "#ffffff", border: "1px solid rgba(12,12,10,0.07)",
            borderLeft: `3px solid ${meta.color}`, borderRadius: "4px",
            padding: "0.9rem 1.25rem", display: "flex", alignItems: "center", gap: "1.25rem",
          }}>
            <div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "4px", background: meta.bg, borderRadius: "3px", padding: "1px 6px", marginBottom: "3px" }}>
                <span style={{ width: "4px", height: "4px", borderRadius: "50%", background: meta.color }} />
                <span style={{ fontSize: "0.48rem", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: meta.color }}>{meta.label}</span>
              </div>
              <p style={{ fontSize: "0.75rem", fontWeight: 700, color: "#0C0C0A" }}>{order.orderNumber}</p>
            </div>
            <div style={{ width: "1px", alignSelf: "stretch", background: "rgba(12,12,10,0.07)" }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: "0.5rem", letterSpacing: "0.18em", color: "#9A9489", textTransform: "uppercase", fontWeight: 700, marginBottom: "2px" }}>Destino</p>
              <p style={{ fontSize: "0.78rem", color: "#0C0C0A", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {order.destination ?? "—"}
              </p>
            </div>
            <p style={{ fontSize: "0.7rem", color: "#9A9489", flexShrink: 0 }}>{fecha}</p>
          </div>
        )
      })}
    </div>
  )
}

/* ─── Tab: Alertas ───────────────────────────────── */
function TabAlertas({ alerts }: { alerts: DashboardAlert[] }) {
  if (alerts.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "3rem 0" }}>
        <CheckCircle size={28} style={{ color: "#3A8E2A", margin: "0 auto 0.75rem" }} />
        <p style={{ fontSize: "0.55rem", letterSpacing: "0.22em", color: "#9A9489", textTransform: "uppercase", fontWeight: 700, marginBottom: "4px" }}>Sin alertas</p>
        <p style={{ fontSize: "0.78rem", color: "#6B6260" }}>Todas tus facturas están al día.</p>
      </div>
    )
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      {alerts.map((alert) => (
        <div key={alert.invoiceNumber} style={{
          background: "#ffffff", border: "1px solid rgba(201,146,75,0.15)",
          borderLeft: "3px solid #C9924B", borderRadius: "4px",
          padding: "1rem 1.25rem", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem",
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
            <AlertTriangle size={14} style={{ color: "#C9924B", flexShrink: 0, marginTop: "2px" }} />
            <div>
              <p style={{ fontSize: "0.55rem", letterSpacing: "0.18em", color: "#C9924B", textTransform: "uppercase", fontWeight: 700, marginBottom: "3px" }}>
                Factura pendiente · {alert.invoiceNumber}
              </p>
              <p style={{ fontSize: "0.78rem", color: "#0C0C0A", fontWeight: 600, marginBottom: "2px" }}>{alert.message}</p>
              <p style={{ fontSize: "0.68rem", color: "#9A9489" }}>
                {formatQ(alert.amount)} · Venció: {alert.dueDate}
              </p>
            </div>
          </div>
          <Link href="/cliente/estado-cuenta" style={{
            display: "flex", alignItems: "center", gap: "4px", textDecoration: "none",
            fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
            color: "#C9924B", flexShrink: 0, marginTop: "2px",
          }}>
            Ver cuenta <ArrowRight size={10} />
          </Link>
        </div>
      ))}
    </div>
  )
}

/* ═══════════════════════════════════════════════════
   Main Page
══════════════════════════════════════════════════ */
export default function ClienteDashboardPage() {
  const [data, setData] = useState<DashboardSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>("resumen")

  const fetchData = async () => {
    setLoading(true); setError(false)
    try {
      const res = await api.get<{ data: DashboardSummary }>(ENDPOINTS.CLIENT.DASHBOARD_SUMMARY)
      setData(res.data.data)
    } catch { setError(true) }
    finally { setLoading(false) }
  }

  useEffect(() => { void fetchData() }, [])

  const TABS: { id: Tab; label: string; badge?: number }[] = [
    { id: "resumen",  label: "Resumen" },
    { id: "ordenes",  label: "Órdenes recientes" },
    { id: "alertas",  label: "Alertas", badge: data?.alerts.length ?? 0 },
  ]

  return (
    <div className="min-h-screen" style={{ background: "#F5F2EC" }}>
      {/* Grid overlay */}
      <div aria-hidden className="fixed inset-0 pointer-events-none" style={{
        backgroundImage: `linear-gradient(rgba(12,12,10,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(12,12,10,0.03) 1px,transparent 1px)`,
        backgroundSize: "72px 72px",
      }} />

      {/* Ghost letters */}
      <div aria-hidden style={{
        position: "fixed", top: "50%", right: "-2rem", transform: "translateY(-50%)",
        fontSize: "clamp(18rem, 30vw, 28rem)", fontWeight: 900, letterSpacing: "-0.06em",
        color: "rgba(12,12,10,0.03)", lineHeight: 1, userSelect: "none", pointerEvents: "none",
      }}>CL</div>

      <div className="relative z-10 max-w-5xl mx-auto px-8 py-14">

        {/* Header row */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE }}
          style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", marginBottom: "3rem" }}>

          <div>
            <p style={{ fontSize: "0.55rem", letterSpacing: "0.38em", color: "#C9924B", textTransform: "uppercase", fontWeight: 700, marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ width: "18px", height: "1px", background: "#C9924B", display: "inline-block" }} />
              Portal Cliente
            </p>
            <div style={{ overflow: "hidden" }}>
              <motion.h1 initial={{ y: "105%" }} animate={{ y: 0 }}
                transition={{ delay: 0.1, duration: 0.9, ease: EASE }}
                style={{ fontSize: "clamp(1.9rem, 4vw, 2.8rem)", fontWeight: 900, letterSpacing: "-0.035em", color: "#0C0C0A", lineHeight: 1 }}>
                {loading
                  ? "Bienvenido."
                  : data
                    ? `Bienvenido, ${(data.displayName || data.clientName).split(" ")[0]}.`
                    : "Dashboard"}
              </motion.h1>
            </div>
            {data?.isBlocked && (
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "0.5rem" }}>
                <div style={{ width: "4px", height: "4px", borderRadius: "50%", background: "#E53E3E" }} />
                <p style={{ fontSize: "0.65rem", color: "#E53E3E", fontWeight: 700, letterSpacing: "0.05em" }}>
                  Cuenta bloqueada — contacta a tu agente operativo
                </p>
              </div>
            )}
            <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
              transition={{ delay: 0.45, duration: 0.9, ease: EASE }}
              style={{ height: "1px", background: "rgba(12,12,10,0.1)", marginTop: "1.5rem", transformOrigin: "left" }} />
          </div>

          <motion.div initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.7, ease: EASE }} style={{ flexShrink: 0, paddingTop: "2rem" }}>
            <Link href="/cliente/nuevo-servicio" style={{ textDecoration: "none" }}>
              <button style={{
                display: "flex", alignItems: "center", gap: "7px", padding: "0.65rem 1.25rem",
                background: "#C9924B", border: "none", borderRadius: "4px",
                fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em",
                textTransform: "uppercase", color: "#ffffff", cursor: "pointer",
                transition: "background 0.2s", whiteSpace: "nowrap",
              }}
                onMouseOver={e => (e.currentTarget.style.background = "#b5833f")}
                onMouseOut={e => (e.currentTarget.style.background = "#C9924B")}
              >
                <Plus size={13} /> Nuevo Servicio
              </button>
            </Link>
          </motion.div>
        </motion.div>

        {/* States */}
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {[120, 80].map((h, i) => (
              <div key={i} style={{
                background: "#ffffff", border: "1px solid rgba(12,12,10,0.07)",
                borderRadius: "6px", height: `${h}px`,
                animation: "pulse 1.5s ease-in-out infinite",
              }} />
            ))}
          </div>
        ) : error ? (
          <div style={{ background: "#ffffff", border: "1px solid rgba(12,12,10,0.07)", borderRadius: "6px", padding: "3rem", textAlign: "center" }}>
            <AlertTriangle size={28} style={{ color: "#C9924B", margin: "0 auto 1rem" }} />
            <p style={{ fontSize: "0.78rem", color: "#6B6260", marginBottom: "1rem" }}>No se pudo cargar el dashboard.</p>
            <button onClick={() => void fetchData()} style={{
              display: "inline-flex", alignItems: "center", gap: "6px",
              fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
              color: "#C9924B", background: "none", border: "none", cursor: "pointer",
            }}>
              <RefreshCw size={11} /> Reintentar
            </button>
          </div>
        ) : data ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.7, ease: EASE }}>

            {/* Tab bar */}
            <div style={{ display: "flex", borderBottom: "1px solid rgba(12,12,10,0.1)", marginBottom: "1.5rem" }}>
              {TABS.map((tab) => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                  padding: "0.65rem 1.25rem", background: "none", border: "none",
                  borderBottom: activeTab === tab.id ? "2px solid #C9924B" : "2px solid transparent",
                  marginBottom: "-1px",
                  fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase",
                  color: activeTab === tab.id ? "#C9924B" : "#9A9489",
                  cursor: "pointer", transition: "color 0.15s",
                  display: "flex", alignItems: "center", gap: "6px",
                }}>
                  {tab.label}
                  {tab.badge != null && tab.badge > 0 && (
                    <span style={{
                      background: "#E53E3E", color: "#ffffff",
                      fontSize: "0.48rem", fontWeight: 900,
                      width: "14px", height: "14px", borderRadius: "50%",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>{tab.badge}</span>
                  )}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <AnimatePresence mode="wait">
              <motion.div key={activeTab}
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.25, ease: EASE }}>
                {activeTab === "resumen" && <TabResumen data={data} onSwitchTab={setActiveTab} />}
                {activeTab === "ordenes" && <TabOrdenes orders={data.recentOrders} />}
                {activeTab === "alertas" && <TabAlertas alerts={data.alerts} />}
              </motion.div>
            </AnimatePresence>

          </motion.div>
        ) : null}

      </div>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
    </div>
  )
}
