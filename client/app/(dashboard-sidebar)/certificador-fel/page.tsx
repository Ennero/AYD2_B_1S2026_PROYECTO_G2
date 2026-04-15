"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { api } from "@/lib/api/client"
import { ENDPOINTS } from "@/lib/api/endpoints"
import { CertifierSummary } from "@/lib/api/types"
import { FileText, CheckCircle, ShieldCheck, ArrowRight } from "lucide-react"

const EASE = [0.16, 1, 0.3, 1] as const

export default function CertificadorFelPage() {
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState<CertifierSummary>({
    pendingInvoices: 0,
    certifiedCount: 0,
  })

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const response = await api.get<{ data: CertifierSummary }>(ENDPOINTS.CERTIFIER.SUMMARY)
        setSummary(response.data.data)
      } catch (error) {
        console.error("Error fetching summary:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchSummary()
  }, [])

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
      }}>CF</div>

      <div className="relative z-10 max-w-5xl mx-auto px-8 py-14">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE }} style={{ marginBottom: "3rem" }}>

          <p style={{ fontSize: "0.55rem", letterSpacing: "0.38em", color: "#C9924B", textTransform: "uppercase", fontWeight: 700, marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ width: "18px", height: "1px", background: "#C9924B", display: "inline-block" }} />
            Portal Tributario
          </p>

          <div style={{ overflow: "hidden" }}>
            <motion.h1 initial={{ y: "105%" }} animate={{ y: 0 }}
              transition={{ delay: 0.1, duration: 0.9, ease: EASE }}
              style={{ fontSize: "clamp(1.9rem, 4vw, 2.8rem)", fontWeight: 900, letterSpacing: "-0.035em", color: "#0C0C0A", lineHeight: 1 }}>
              Certificador FEL
            </motion.h1>
          </div>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ delay: 0.35, duration: 0.7 }}
            style={{ fontSize: "0.85rem", color: "#6B6260", marginTop: "0.75rem", maxWidth: "52ch" }}>
            Sistema de validación y certificación de Documentos Tributarios Electrónicos (DTE) en cumplimiento con SAT.
          </motion.p>

          <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
            transition={{ delay: 0.45, duration: 0.9, ease: EASE }}
            style={{ height: "1px", background: "rgba(12,12,10,0.1)", marginTop: "1.5rem", transformOrigin: "left" }} />
        </motion.div>

        {/* KPI row */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.7, ease: EASE }}
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "24px" }}>

          {/* Pendientes — dark */}
          <div style={{
            background: "#1E1E1B", borderRadius: "6px", padding: "1.75rem 2rem",
            display: "flex", flexDirection: "column", gap: "0.25rem",
          }}>
            <p style={{ fontSize: "0.5rem", letterSpacing: "0.28em", color: "#9A9489", textTransform: "uppercase", fontWeight: 700, marginBottom: "0.5rem" }}>
              Documentos Pendientes
            </p>
            {loading ? (
              <div style={{ height: "52px", background: "rgba(255,255,255,0.06)", borderRadius: "3px" }} />
            ) : (
              <p style={{ fontSize: "clamp(2.8rem, 6vw, 4.5rem)", fontWeight: 900, letterSpacing: "-0.05em", color: "#C9924B", lineHeight: 1 }}>
                {summary.pendingInvoices}
              </p>
            )}
            <p style={{ fontSize: "0.68rem", color: "#6B6260" }}>En cola de revisión</p>
          </div>

          {/* Certificados — white */}
          <div style={{
            background: "#ffffff", border: "1px solid rgba(12,12,10,0.07)",
            borderRadius: "6px", padding: "1.75rem 2rem",
            display: "flex", flexDirection: "column", gap: "0.25rem",
          }}>
            <p style={{ fontSize: "0.5rem", letterSpacing: "0.28em", color: "#9A9489", textTransform: "uppercase", fontWeight: 700, marginBottom: "0.5rem" }}>
              Certificados Hoy
            </p>
            {loading ? (
              <div style={{ height: "52px", background: "rgba(12,12,10,0.04)", borderRadius: "3px" }} />
            ) : (
              <p style={{ fontSize: "clamp(2.8rem, 6vw, 4.5rem)", fontWeight: 900, letterSpacing: "-0.05em", color: "#3A8E2A", lineHeight: 1 }}>
                {summary.certifiedCount}
              </p>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <CheckCircle size={12} style={{ color: "#3A8E2A" }} />
              <p style={{ fontSize: "0.68rem", color: "#6B6260" }}>DTE Emitidos</p>
            </div>
          </div>
        </motion.div>

        {/* Action card */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.7, ease: EASE }}>
          <Link href="/certificador-fel/bandeja" style={{ display: "block", textDecoration: "none" }}>
            <div
              style={{
                background: "#ffffff",
                border: "1px solid rgba(12,12,10,0.07)",
                borderRadius: "6px",
                overflow: "hidden",
                transition: "border-color 0.2s, transform 0.2s",
              }}
              onMouseOver={e => {
                const el = e.currentTarget as HTMLDivElement
                el.style.borderColor = "rgba(201,146,75,0.35)"
                el.style.transform = "translateY(-2px)"
              }}
              onMouseOut={e => {
                const el = e.currentTarget as HTMLDivElement
                el.style.borderColor = "rgba(12,12,10,0.07)"
                el.style.transform = "translateY(0)"
              }}
            >
              <div style={{ height: "2px", background: "#C9924B" }} />
              <div style={{ padding: "2rem 2rem 1.75rem", display: "flex", alignItems: "center", gap: "2rem" }}>
                <div style={{
                  width: "52px", height: "52px", borderRadius: "4px",
                  background: "rgba(201,146,75,0.08)", border: "1px solid rgba(201,146,75,0.2)",
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  <FileText size={22} style={{ color: "#C9924B" }} />
                </div>

                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: "0.5rem", letterSpacing: "0.3em", color: "#9A9489", textTransform: "uppercase", fontWeight: 700, marginBottom: "4px" }}>01</p>
                  <h3 style={{ fontSize: "1.3rem", fontWeight: 900, letterSpacing: "-0.02em", color: "#0C0C0A", marginBottom: "0.4rem", lineHeight: 1.1 }}>
                    Bandeja de Aprobación
                  </h3>
                  <p style={{ fontSize: "0.8rem", color: "#6B6260", lineHeight: 1.6 }}>
                    Documentos fiscales pendientes de validación NIT, certificación y firma electrónica ante SAT.
                  </p>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#C9924B", flexShrink: 0 }}>
                  Validar DTE
                  <ArrowRight size={12} />
                </div>
              </div>
            </div>
          </Link>
        </motion.div>

        {/* Status indicators */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ delay: 0.65, duration: 0.7 }}
          style={{ display: "flex", gap: "12px", marginTop: "2rem", flexWrap: "wrap" }}>

          <div style={{
            display: "flex", alignItems: "center", gap: "8px",
            padding: "0.55rem 1rem",
            background: "#ffffff", border: "1px solid rgba(12,12,10,0.07)",
            borderRadius: "4px",
          }}>
            <span style={{ position: "relative", display: "inline-flex", width: "8px", height: "8px" }}>
              <span style={{
                position: "absolute", inset: 0, borderRadius: "50%",
                background: "#3A8E2A", opacity: 0.6,
                animation: "ping 2s cubic-bezier(0,0,0.2,1) infinite",
              }} />
              <span style={{ position: "relative", display: "inline-flex", width: "8px", height: "8px", borderRadius: "50%", background: "#3A8E2A" }} />
            </span>
            <span style={{ fontSize: "0.55rem", letterSpacing: "0.18em", color: "#6B6260", textTransform: "uppercase", fontWeight: 700 }}>
              Conexión SAT Activa
            </span>
          </div>

          <div style={{
            display: "flex", alignItems: "center", gap: "8px",
            padding: "0.55rem 1rem",
            background: "#ffffff", border: "1px solid rgba(12,12,10,0.07)",
            borderRadius: "4px",
          }}>
            <ShieldCheck size={13} style={{ color: "#9A9489" }} />
            <span style={{ fontSize: "0.55rem", letterSpacing: "0.18em", color: "#6B6260", textTransform: "uppercase", fontWeight: 700 }}>
              Simulador Operativo
            </span>
          </div>
        </motion.div>

      </div>
      <style>{`@keyframes ping { 75%,100%{transform:scale(2);opacity:0} }`}</style>
    </div>
  )
}
