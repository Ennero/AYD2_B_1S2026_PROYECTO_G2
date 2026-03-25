"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { BarChart2, ArrowRight, AlertTriangle, RotateCcw } from "lucide-react"
import { api } from "@/lib/api/client"
import { ENDPOINTS } from "@/lib/api/endpoints"

const EASE = [0.16, 1, 0.3, 1] as const

/* ─── Types ─────────────────────────────────────────────────────────────── */

interface AccountStatement {
  creditLimit: number
  totalOwed: number
  availableCredit: number
  aging: {
    current: number
    overdue30: number
    critical: number
  }
}

/* ─── Helpers ───────────────────────────────────────────────────────────── */

function formatQ(amount: number) {
  return `Q ${amount.toLocaleString("es-GT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

/* ─── Aging Bar ──────────────────────────────────────────────────────────── */

function AgingBar({ aging }: { aging: AccountStatement["aging"] }) {
  const total = aging.current + aging.overdue30 + aging.critical
  if (total === 0) return (
    <p style={{ fontSize: "0.78rem", color: "#9A9489" }}>Sin datos de vencimiento.</p>
  )

  const pCurrent  = (aging.current   / total) * 100
  const pOverdue  = (aging.overdue30 / total) * 100
  const pCritical = (aging.critical  / total) * 100

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {/* Bar */}
      <div style={{ display: "flex", height: "36px", borderRadius: "4px", overflow: "hidden", gap: "2px" }}>
        {aging.current > 0 && (
          <div style={{
            width: `${pCurrent}%`, background: "#3A8E2A",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "width 0.5s ease",
          }}>
            {pCurrent > 18 && (
              <span style={{ fontSize: "0.6rem", fontWeight: 700, color: "#ffffff", letterSpacing: "0.05em" }}>
                {pCurrent.toFixed(0)}%
              </span>
            )}
          </div>
        )}
        {aging.overdue30 > 0 && (
          <div style={{
            width: `${pOverdue}%`, background: "#C9924B",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "width 0.5s ease",
          }}>
            {pOverdue > 12 && (
              <span style={{ fontSize: "0.6rem", fontWeight: 700, color: "#ffffff" }}>
                {pOverdue.toFixed(0)}%
              </span>
            )}
          </div>
        )}
        {aging.critical > 0 && (
          <div style={{
            width: `${pCritical}%`, background: "#E53E3E",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "width 0.5s ease",
          }}>
            {pCritical > 10 && (
              <span style={{ fontSize: "0.6rem", fontWeight: 700, color: "#ffffff" }}>
                {pCritical.toFixed(0)}%
              </span>
            )}
          </div>
        )}
      </div>

      {/* Legend */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}>
        {[
          { color: "#3A8E2A", label: "Al día", value: aging.current },
          { color: "#C9924B", label: "Vencido a 30 días", value: aging.overdue30 },
          { color: "#E53E3E", label: "Crítico (+60 días)", value: aging.critical },
        ].filter((item) => item.value > 0).map((item) => (
          <div key={item.label} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ width: "10px", height: "10px", borderRadius: "2px", background: item.color, flexShrink: 0 }} />
            <span style={{ fontSize: "0.72rem", color: "#9A9489" }}>{item.label} —</span>
            <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#0C0C0A" }}>{formatQ(item.value)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── Main Page ──────────────────────────────────────────────────────────── */

export default function EstadoCuentaPage() {
  const [data, setData] = useState<AccountStatement | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    setError(false)
    try {
      const res = await api.get<{ data: AccountStatement }>(ENDPOINTS.CLIENT.ACCOUNT_STATEMENT)
      setData(res.data.data)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void fetchData() }, [])

  const availableColor = data
    ? data.availableCredit > 0 ? "#3A8E2A" : "#E53E3E"
    : "#0C0C0A"

  return (
    <div className="min-h-screen" style={{ background: "#F5F2EC" }}>
      <div aria-hidden className="fixed inset-0 pointer-events-none" style={{
        backgroundImage: `linear-gradient(rgba(12,12,10,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(12,12,10,0.03) 1px,transparent 1px)`,
        backgroundSize: "72px 72px",
      }} />
      <div aria-hidden style={{
        position: "fixed", top: "50%", right: "-2rem", transform: "translateY(-50%)",
        fontSize: "clamp(18rem,30vw,28rem)", fontWeight: 900, letterSpacing: "-0.06em",
        color: "rgba(12,12,10,0.03)", lineHeight: 1, userSelect: "none", pointerEvents: "none",
      }}>EC</div>

      <div className="relative z-10 max-w-4xl mx-auto px-8 py-14">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE }} style={{ marginBottom: "2.5rem" }}>
          <p style={{ fontSize: "0.55rem", letterSpacing: "0.38em", color: "#C9924B", textTransform: "uppercase", fontWeight: 700, marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ width: "18px", height: "1px", background: "#C9924B", display: "inline-block" }} />
            Portal Cliente
          </p>
          <div style={{ overflow: "hidden" }}>
            <motion.h1 initial={{ y: "105%" }} animate={{ y: 0 }}
              transition={{ delay: 0.1, duration: 0.9, ease: EASE }}
              style={{ fontSize: "clamp(1.9rem,4vw,2.8rem)", fontWeight: 900, letterSpacing: "-0.035em", color: "#0C0C0A", lineHeight: 1 }}>
              Estado de Cuenta
            </motion.h1>
          </div>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
            style={{ fontSize: "0.85rem", color: "#6B6260", marginTop: "0.75rem", maxWidth: "44ch" }}>
            Resumen de crédito, saldos y reporte de vencimientos.
          </motion.p>
          <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
            transition={{ delay: 0.4, duration: 0.9, ease: EASE }}
            style={{ height: "1px", background: "rgba(12,12,10,0.1)", marginTop: "1.25rem", transformOrigin: "left" }} />
        </motion.div>

        {/* Loading skeletons */}
        {loading && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
              {[0, 1, 2].map((i) => (
                <div key={i} style={{ height: "112px", borderRadius: "6px", background: "rgba(12,12,10,0.05)" }} />
              ))}
            </div>
            <div style={{ height: "160px", borderRadius: "6px", background: "rgba(12,12,10,0.05)" }} />
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div style={{
            background: "#ffffff", border: "1px solid rgba(12,12,10,0.07)",
            borderRadius: "6px", padding: "3rem 2rem", textAlign: "center",
          }}>
            <AlertTriangle size={32} style={{ color: "#C9924B", margin: "0 auto 1rem" }} />
            <p style={{ fontSize: "0.85rem", color: "#6B6260", marginBottom: "1rem" }}>
              No se pudo cargar el estado de cuenta.
            </p>
            <button
              onClick={() => void fetchData()}
              style={{
                display: "inline-flex", alignItems: "center", gap: "6px",
                padding: "0.55rem 1.1rem", background: "none",
                border: "1px solid rgba(12,12,10,0.12)", borderRadius: "4px",
                fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em",
                textTransform: "uppercase", color: "#6B6260", cursor: "pointer",
                transition: "border-color 0.15s",
              }}
              onMouseOver={e => (e.currentTarget.style.borderColor = "rgba(12,12,10,0.25)")}
              onMouseOut={e => (e.currentTarget.style.borderColor = "rgba(12,12,10,0.12)")}
            >
              <RotateCcw size={12} />
              Reintentar
            </button>
          </div>
        )}

        {/* Content */}
        {!loading && !error && data && (
          <>
            {/* KPI cards */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6, ease: EASE }}
              style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginBottom: "10px" }}>
              {/* Límite de crédito — dark */}
              <div style={{
                background: "#1E1E1B", borderRadius: "6px", padding: "1.5rem 1.75rem",
                display: "flex", flexDirection: "column", gap: "0.25rem",
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                  <p style={{ fontSize: "0.48rem", letterSpacing: "0.28em", color: "#9A9489", textTransform: "uppercase", fontWeight: 700 }}>
                    Límite de Crédito
                  </p>
                  <BarChart2 size={15} style={{ color: "#C9924B" }} />
                </div>
                <p style={{ fontSize: "clamp(1.2rem,3vw,1.8rem)", fontWeight: 900, letterSpacing: "-0.04em", color: "#C9924B", lineHeight: 1 }}>
                  {formatQ(data.creditLimit)}
                </p>
                <p style={{ fontSize: "0.65rem", color: "#6B6260", marginTop: "2px" }}>crédito total asignado</p>
              </div>

              {/* Total adeudado — white */}
              <div style={{
                background: "#ffffff", border: "1px solid rgba(12,12,10,0.07)",
                borderRadius: "6px", padding: "1.5rem 1.75rem",
                display: "flex", flexDirection: "column", gap: "0.25rem",
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                  <p style={{ fontSize: "0.48rem", letterSpacing: "0.28em", color: "#9A9489", textTransform: "uppercase", fontWeight: 700 }}>
                    Total Adeudado
                  </p>
                </div>
                <p style={{ fontSize: "clamp(1.2rem,3vw,1.8rem)", fontWeight: 900, letterSpacing: "-0.04em", color: "#0C0C0A", lineHeight: 1 }}>
                  {formatQ(data.totalOwed)}
                </p>
                <p style={{ fontSize: "0.65rem", color: "#9A9489", marginTop: "2px" }}>saldo pendiente</p>
              </div>

              {/* Crédito disponible — white */}
              <div style={{
                background: "#ffffff", border: "1px solid rgba(12,12,10,0.07)",
                borderRadius: "6px", padding: "1.5rem 1.75rem",
                display: "flex", flexDirection: "column", gap: "0.25rem",
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                  <p style={{ fontSize: "0.48rem", letterSpacing: "0.28em", color: "#9A9489", textTransform: "uppercase", fontWeight: 700 }}>
                    Crédito Disponible
                  </p>
                </div>
                <p style={{ fontSize: "clamp(1.2rem,3vw,1.8rem)", fontWeight: 900, letterSpacing: "-0.04em", color: availableColor, lineHeight: 1 }}>
                  {formatQ(data.availableCredit)}
                </p>
                <p style={{ fontSize: "0.65rem", color: "#9A9489", marginTop: "2px" }}>para nuevos servicios</p>
              </div>
            </motion.div>

            {/* Aging report */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45, duration: 0.6, ease: EASE }}
              style={{
                background: "#ffffff", border: "1px solid rgba(12,12,10,0.07)",
                borderRadius: "6px", overflow: "hidden", marginBottom: "1.5rem",
              }}>
              <div style={{ height: "2px", background: "rgba(12,12,10,0.08)" }} />
              <div style={{ padding: "1.5rem 1.75rem" }}>
                <p style={{ fontSize: "0.48rem", letterSpacing: "0.28em", color: "#9A9489", textTransform: "uppercase", fontWeight: 700, marginBottom: "1.25rem" }}>
                  Reporte de Vencimientos
                </p>
                <AgingBar aging={data.aging} />
              </div>
            </motion.div>

            {/* CTA */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
              style={{ display: "flex", justifyContent: "center" }}>
              <Link href="/cliente/facturas" style={{
                display: "inline-flex", alignItems: "center", gap: "8px",
                padding: "0.75rem 2rem", background: "#C9924B", border: "none",
                borderRadius: "4px", fontSize: "0.65rem", fontWeight: 700,
                letterSpacing: "0.12em", textTransform: "uppercase", color: "#ffffff",
                textDecoration: "none", transition: "background 0.15s",
              }}
                onMouseOver={(e) => ((e.currentTarget as HTMLAnchorElement).style.background = "#b5833f")}
                onMouseOut={(e) => ((e.currentTarget as HTMLAnchorElement).style.background = "#C9924B")}
              >
                Ver Mis Facturas
                <ArrowRight size={14} />
              </Link>
            </motion.div>
          </>
        )}

      </div>
    </div>
  )
}
