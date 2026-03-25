"use client"

import { useCallback, useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Save, RotateCcw } from "lucide-react"
import { toast } from "sonner"
import { fetchFinanceRates, updateFinanceRate } from "@/lib/api/finance"
import type { FinanceRate } from "@/types/finance"

const EASE = [0.16, 1, 0.3, 1] as const

function formatRange(rate: FinanceRate): string {
  if (rate.maxCapacityTon === null) return `${rate.minCapacityTon}+ Ton`
  return `${rate.minCapacityTon} – ${rate.maxCapacityTon} Ton`
}

export default function FinanceRatesPage() {
  const [rates, setRates] = useState<FinanceRate[]>([])
  const [editedRates, setEditedRates] = useState<Record<number, string>>({})
  const [loadingRates, setLoadingRates] = useState(false)
  const [savingRateId, setSavingRateId] = useState<number | null>(null)

  const hydrateRates = (current: FinanceRate[]) => {
    setRates(current)
    setEditedRates(
      current.reduce<Record<number, string>>((acc, r) => {
        acc[r.vehicleTypeId] = r.ratePerKm.toFixed(2)
        return acc
      }, {}),
    )
  }

  const refreshRates = useCallback(async () => {
    setLoadingRates(true)
    try {
      hydrateRates(await fetchFinanceRates())
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No fue posible cargar el tarifario")
    } finally {
      setLoadingRates(false)
    }
  }, [])

  useEffect(() => { void refreshRates() }, [refreshRates])

  const handleSave = async (vehicleTypeId: number) => {
    const parsed = Number(editedRates[vehicleTypeId])
    if (!Number.isFinite(parsed) || parsed <= 0) { toast.error("La tarifa debe ser mayor a 0"); return }
    setSavingRateId(vehicleTypeId)
    try {
      const updated = await updateFinanceRate(vehicleTypeId, parsed)
      toast.success(`Tarifa ${updated.typeName} actualizada a Q ${updated.ratePerKm.toFixed(2)}`)
      await refreshRates()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No fue posible actualizar la tarifa")
    } finally {
      setSavingRateId(null)
    }
  }

  const isDirty = (vehicleTypeId: number) => {
    const original = rates.find(r => r.vehicleTypeId === vehicleTypeId)
    if (!original) return false
    return editedRates[vehicleTypeId] !== original.ratePerKm.toFixed(2)
  }

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
      }}>TB</div>

      <div className="relative z-10 max-w-4xl mx-auto px-8 py-14">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE }} style={{ marginBottom: "2.5rem" }}>
          <p style={{ fontSize: "0.55rem", letterSpacing: "0.38em", color: "#C9924B", textTransform: "uppercase", fontWeight: 700, marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ width: "18px", height: "1px", background: "#C9924B", display: "inline-block" }} />
            Módulo Financiero
          </p>
          <div style={{ overflow: "hidden" }}>
            <motion.h1 initial={{ y: "105%" }} animate={{ y: 0 }}
              transition={{ delay: 0.1, duration: 0.9, ease: EASE }}
              style={{ fontSize: "clamp(1.9rem,4vw,2.8rem)", fontWeight: 900, letterSpacing: "-0.035em", color: "#0C0C0A", lineHeight: 1 }}>
              Tarifario Base
            </motion.h1>
          </div>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
            style={{ fontSize: "0.85rem", color: "#6B6260", marginTop: "0.75rem", maxWidth: "44ch" }}>
            Actualización de tarifas mínimas por tipo de unidad de transporte.
          </motion.p>
          <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
            transition={{ delay: 0.4, duration: 0.9, ease: EASE }}
            style={{ height: "1px", background: "rgba(12,12,10,0.1)", marginTop: "1.25rem", transformOrigin: "left" }} />
        </motion.div>

        {/* Loading */}
        {loadingRates && rates.length === 0 && (
          <p style={{ fontSize: "0.75rem", color: "#9A9489", textAlign: "center", padding: "3rem 0" }}>Cargando tarifario...</p>
        )}

        {/* Rate cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {rates.map((rate, i) => {
            const saving = savingRateId === rate.vehicleTypeId
            const dirty = isDirty(rate.vehicleTypeId)

            return (
              <motion.div key={rate.vehicleTypeId}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.07, duration: 0.5, ease: EASE }}>
                <div style={{
                  background: "#ffffff", border: `1px solid ${dirty ? "rgba(201,146,75,0.3)" : "rgba(12,12,10,0.07)"}`,
                  borderRadius: "6px", overflow: "hidden",
                  transition: "border-color 0.2s",
                }}>
                  {/* Accent strip */}
                  <div style={{ height: "2px", background: dirty ? "#C9924B" : "rgba(12,12,10,0.08)" }} />

                  <div style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    gap: "2rem", padding: "1.5rem 1.75rem", flexWrap: "wrap",
                  }}>
                    {/* Info */}
                    <div style={{ flex: 1, minWidth: "180px" }}>
                      <p style={{ fontSize: "0.48rem", letterSpacing: "0.28em", color: "#9A9489", textTransform: "uppercase", fontWeight: 700, marginBottom: "4px" }}>
                        {rate.typeCode}
                      </p>
                      <h2 style={{ fontSize: "1.25rem", fontWeight: 900, letterSpacing: "-0.02em", color: "#0C0C0A", lineHeight: 1, marginBottom: "4px" }}>
                        {rate.typeName}
                      </h2>
                      <p style={{ fontSize: "0.72rem", color: "#9A9489" }}>
                        Capacidad: <span style={{ color: "#6B6260", fontWeight: 600 }}>{formatRange(rate)}</span>
                      </p>
                    </div>

                    {/* Current rate display */}
                    <div style={{ textAlign: "center", flexShrink: 0 }}>
                      <p style={{ fontSize: "0.48rem", letterSpacing: "0.2em", color: "#9A9489", textTransform: "uppercase", fontWeight: 700, marginBottom: "2px" }}>Tarifa actual</p>
                      <p style={{ fontSize: "1.4rem", fontWeight: 900, letterSpacing: "-0.03em", color: dirty ? "#C9924B" : "#0C0C0A", lineHeight: 1 }}>
                        Q {rate.ratePerKm.toFixed(2)}
                      </p>
                      <p style={{ fontSize: "0.6rem", color: "#9A9489" }}>por km</p>
                    </div>

                    {/* Edit field */}
                    <div style={{ display: "flex", alignItems: "flex-end", gap: "8px", minWidth: "280px" }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: "block", fontSize: "0.48rem", letterSpacing: "0.2em", color: "#9A9489", textTransform: "uppercase", fontWeight: 700, marginBottom: "6px" }}>
                          Nueva tarifa por KM (GTQ)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={editedRates[rate.vehicleTypeId] ?? ""}
                          onChange={e => setEditedRates(prev => ({ ...prev, [rate.vehicleTypeId]: e.target.value }))}
                          style={{
                            width: "100%", boxSizing: "border-box",
                            padding: "0.6rem 0.85rem",
                            background: "#F5F2EC", border: `1px solid ${dirty ? "rgba(201,146,75,0.4)" : "rgba(12,12,10,0.12)"}`,
                            borderRadius: "4px", color: "#0C0C0A", fontSize: "0.9rem",
                            fontWeight: 700, outline: "none",
                          }}
                          onFocus={e => (e.target.style.borderColor = "#C9924B")}
                          onBlur={e => (e.target.style.borderColor = dirty ? "rgba(201,146,75,0.4)" : "rgba(12,12,10,0.12)")}
                        />
                      </div>

                      <button
                        onClick={() => void handleSave(rate.vehicleTypeId)}
                        disabled={saving || !dirty}
                        style={{
                          display: "flex", alignItems: "center", gap: "6px",
                          padding: "0.6rem 1.1rem", flexShrink: 0,
                          background: (!dirty || saving) ? "rgba(12,12,10,0.08)" : "#C9924B",
                          border: "none", borderRadius: "4px",
                          fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em",
                          textTransform: "uppercase",
                          color: (!dirty || saving) ? "#9A9489" : "#ffffff",
                          cursor: (!dirty || saving) ? "not-allowed" : "pointer",
                          transition: "background 0.2s, color 0.2s",
                          whiteSpace: "nowrap",
                        }}
                        onMouseOver={e => { if (dirty && !saving) e.currentTarget.style.background = "#b5833f" }}
                        onMouseOut={e => { if (dirty && !saving) e.currentTarget.style.background = "#C9924B" }}
                      >
                        <Save size={12} />
                        {saving ? "Guardando..." : "Guardar"}
                      </button>
                    </div>
                  </div>

                  {/* Footer note */}
                  <div style={{
                    borderTop: "1px solid rgba(12,12,10,0.06)",
                    padding: "0.55rem 1.75rem",
                    background: "rgba(12,12,10,0.015)",
                  }}>
                    <p style={{ fontSize: "0.62rem", color: "#9A9489" }}>
                      Los cambios aplican solo para documentos futuros.
                      {dirty && <span style={{ color: "#C9924B", fontWeight: 700, marginLeft: "8px" }}>· Cambio pendiente de guardar</span>}
                    </p>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Refresh */}
        {rates.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
            style={{ marginTop: "1.5rem" }}>
            <button onClick={() => void refreshRates()} disabled={loadingRates} style={{
              display: "flex", alignItems: "center", gap: "6px",
              padding: "0.55rem 1rem",
              background: "none", border: "1px solid rgba(12,12,10,0.12)",
              borderRadius: "4px", fontSize: "0.6rem", fontWeight: 700,
              letterSpacing: "0.12em", textTransform: "uppercase",
              color: "#6B6260", cursor: loadingRates ? "not-allowed" : "pointer",
              opacity: loadingRates ? 0.6 : 1,
              transition: "border-color 0.15s",
            }}
              onMouseOver={e => !loadingRates && (e.currentTarget.style.borderColor = "rgba(12,12,10,0.25)")}
              onMouseOut={e => (e.currentTarget.style.borderColor = "rgba(12,12,10,0.12)")}
            >
              <RotateCcw size={12} style={{ animation: loadingRates ? "spin 1s linear infinite" : "none" }} />
              Refrescar tarifario
            </button>
          </motion.div>
        )}

      </div>
      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </div>
  )
}
