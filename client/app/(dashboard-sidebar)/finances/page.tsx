"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { toast } from "sonner"
import { fetchFinanceSummary } from "@/lib/api/finance"
import type { FinanceSummary } from "@/types/finance"
import { Banknote, CheckCircle2, FileClock, CreditCard, RefreshCcw, Clock3 } from "lucide-react"

const EASE = [0.16, 1, 0.3, 1] as const

function formatQ(value: number) {
  return `Q ${value.toLocaleString("es-GT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export default function FinanceDashboardPage() {
  const [summary, setSummary] = useState<FinanceSummary>({
    draftInvoicesPendingReview: 0,
    certifiedInvoicesPendingSend: 0,
    pendingPayments: 0,
    collectedAmount: 0,
  })
  const [loadingSummary, setLoadingSummary] = useState(false)
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const refreshSummary = async () => {
    setLoadingSummary(true)
    try {
      const nextSummary = await fetchFinanceSummary({ period: "MONTHLY" })
      setSummary(nextSummary)
      toast.success("Indicadores actualizados")
    } catch (error) {
      const message = error instanceof Error ? error.message : "No fue posible cargar el resumen financiero"
      toast.error(message)
    } finally {
      setLoadingSummary(false)
    }
  }

  useEffect(() => { void refreshSummary() }, [])

  const kpis = [
    {
      label: "Borradores",
      sub: "Pendientes de revisión",
      value: summary.draftInvoicesPendingReview,
      icon: <FileClock size={16} />,
      dark: true,
      color: "#C9924B",
    },
    {
      label: "Certificadas",
      sub: "Listas para envío",
      value: summary.certifiedInvoicesPendingSend,
      icon: <CheckCircle2 size={16} />,
      dark: false,
      color: "#3A8E2A",
    },
    {
      label: "Pagos por conciliar",
      sub: "Tesorería pendiente",
      value: summary.pendingPayments,
      icon: <CreditCard size={16} />,
      dark: true,
      color: "#C9924B",
    },
    {
      label: "Cobrado",
      sub: "Aprobados del período",
      value: formatQ(summary.collectedAmount),
      icon: <Banknote size={16} />,
      dark: false,
      color: "#3A8E2A",
      isText: true,
    },
  ]

  const actions = [
    {
      href: "/finances/facturacion",
      step: "01",
      icon: <FileClock size={15} />,
      title: "Bandeja de Facturación",
      desc: "Revisa borradores y envía facturas certificadas al cliente.",
    },
    {
      href: "/finances/pagos",
      step: "02",
      icon: <CreditCard size={15} />,
      title: "Conciliar Pagos",
      desc: "Aprueba pagos reportados para liberar crédito disponible.",
    },
    {
      href: "/finances/tarifario",
      step: "03",
      icon: <Banknote size={15} />,
      title: "Tarifario Base",
      desc: "Actualiza la tarifa por tipo de unidad de transporte.",
    },
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
      }}>AF</div>

      <div className="relative z-10 max-w-5xl mx-auto px-8 py-14">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE }} style={{ marginBottom: "3rem" }}>

          <p style={{ fontSize: "0.55rem", letterSpacing: "0.38em", color: "#C9924B", textTransform: "uppercase", fontWeight: 700, marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ width: "18px", height: "1px", background: "#C9924B", display: "inline-block" }} />
            Módulo Financiero
          </p>

          <div style={{ overflow: "hidden" }}>
            <motion.h1 initial={{ y: "105%" }} animate={{ y: 0 }}
              transition={{ delay: 0.1, duration: 0.9, ease: EASE }}
              style={{ fontSize: "clamp(1.9rem, 4vw, 2.8rem)", fontWeight: 900, letterSpacing: "-0.035em", color: "#0C0C0A", lineHeight: 1 }}>
              Panel Financiero
            </motion.h1>
          </div>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ delay: 0.35, duration: 0.7 }}
            style={{ fontSize: "0.85rem", color: "#6B6260", marginTop: "0.75rem", maxWidth: "46ch" }}>
            Control de facturación FEL, tesorería y tarifario base.
          </motion.p>

          <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
            transition={{ delay: 0.45, duration: 0.9, ease: EASE }}
            style={{ height: "1px", background: "rgba(12,12,10,0.1)", marginTop: "1.5rem", transformOrigin: "left" }} />
        </motion.div>

        {/* KPI grid */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.7, ease: EASE }}
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "20px" }}>
          {kpis.map((kpi, i) => (
            <div key={i} style={{
              background: kpi.dark ? "#1E1E1B" : "#ffffff",
              border: kpi.dark ? "none" : "1px solid rgba(12,12,10,0.07)",
              borderRadius: "6px", padding: "1.5rem 1.75rem",
              display: "flex", flexDirection: "column", gap: "0.25rem",
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                <p style={{ fontSize: "0.5rem", letterSpacing: "0.28em", color: kpi.dark ? "#9A9489" : "#9A9489", textTransform: "uppercase", fontWeight: 700 }}>
                  {kpi.label}
                </p>
                <span style={{ color: kpi.color }}>{kpi.icon}</span>
              </div>
              <p style={{
                fontSize: kpi.isText ? "clamp(1.4rem, 3vw, 2.2rem)" : "clamp(2.4rem, 5vw, 3.5rem)",
                fontWeight: 900, letterSpacing: "-0.04em", color: kpi.color, lineHeight: 1,
              }}>
                {loadingSummary ? "—" : kpi.value}
              </p>
              <p style={{ fontSize: "0.68rem", color: kpi.dark ? "#6B6260" : "#9A9489", marginTop: "2px" }}>
                {kpi.sub}
              </p>
            </div>
          ))}
        </motion.div>

        {/* Action cards */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.7, ease: EASE }}
          style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", marginBottom: "20px" }}>
          {actions.map((a) => (
            <Link key={a.href} href={a.href} style={{ display: "block", textDecoration: "none" }}>
              <div
                style={{
                  background: "#ffffff", border: "1px solid rgba(12,12,10,0.07)",
                  borderRadius: "6px", overflow: "hidden",
                  transition: "border-color 0.2s, transform 0.2s", height: "100%",
                }}
                onMouseOver={e => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = "rgba(201,146,75,0.35)"; el.style.transform = "translateY(-2px)" }}
                onMouseOut={e => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = "rgba(12,12,10,0.07)"; el.style.transform = "translateY(0)" }}
              >
                <div style={{ height: "2px", background: "#C9924B" }} />
                <div style={{ padding: "1.5rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                    <span style={{ fontSize: "0.5rem", letterSpacing: "0.25em", color: "#9A9489", textTransform: "uppercase", fontWeight: 700 }}>{a.step}</span>
                    <span style={{ color: "#C9924B" }}>{a.icon}</span>
                  </div>
                  <h3 style={{ fontSize: "0.95rem", fontWeight: 900, letterSpacing: "-0.02em", color: "#0C0C0A", marginBottom: "0.5rem", lineHeight: 1.2 }}>
                    {a.title}
                  </h3>
                  <p style={{ fontSize: "0.72rem", color: "#6B6260", lineHeight: 1.6 }}>{a.desc}</p>
                </div>
              </div>
            </Link>
          ))}
        </motion.div>

        {/* Status panel */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          style={{
            background: "#1E1E1B", borderRadius: "6px",
            padding: "1.25rem 1.5rem",
            display: "flex", alignItems: "center", gap: "1.5rem", flexWrap: "wrap",
          }}>
          {/* Dot */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ position: "relative", display: "inline-flex", width: "8px", height: "8px" }}>
              <span style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "#3A8E2A", opacity: 0.6, animation: "ping 2s cubic-bezier(0,0,0.2,1) infinite" }} />
              <span style={{ position: "relative", display: "inline-flex", width: "8px", height: "8px", borderRadius: "50%", background: "#3A8E2A" }} />
            </span>
            <span style={{ fontSize: "0.55rem", letterSpacing: "0.18em", color: "#9A9489", textTransform: "uppercase", fontWeight: 700 }}>
              Backend financiero conectado
            </span>
          </div>

          {/* Clock */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Clock3 size={12} style={{ color: "#6B6260" }} />
            <span style={{ fontSize: "0.72rem", color: "#6B6260" }}>
              {now.toLocaleDateString("es-GT")} {now.toLocaleTimeString("es-GT", { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>

          <div style={{ flex: 1 }} />

          {/* Refresh */}
          <button
            onClick={() => void refreshSummary()}
            disabled={loadingSummary}
            style={{
              display: "flex", alignItems: "center", gap: "6px",
              padding: "0.45rem 1rem",
              background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "4px", fontSize: "0.55rem", fontWeight: 700,
              letterSpacing: "0.15em", textTransform: "uppercase",
              color: "#9A9489", cursor: loadingSummary ? "not-allowed" : "pointer",
              opacity: loadingSummary ? 0.6 : 1, transition: "background 0.2s",
            }}
            onMouseOver={e => !loadingSummary && (e.currentTarget.style.background = "rgba(255,255,255,0.1)")}
            onMouseOut={e => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
          >
            <RefreshCcw size={11} style={{ animation: loadingSummary ? "spin 1s linear infinite" : "none" }} />
            {loadingSummary ? "Actualizando..." : "Refrescar"}
          </button>
        </motion.div>

      </div>
      <style>{`
        @keyframes ping { 75%,100%{transform:scale(2);opacity:0} }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      `}</style>
    </div>
  )
}
