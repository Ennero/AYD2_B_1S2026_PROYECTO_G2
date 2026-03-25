"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { BarChart2, ArrowRight, AlertTriangle, RefreshCw } from "lucide-react"
import { api } from "@/lib/api/client"
import { ENDPOINTS } from "@/lib/api/endpoints"

/* ─── Types ─────────────────────────────────────────────────────────────── */

interface AccountStatement {
  creditLimit: number
  totalOwed: number
  availableCredit: number
  aging: {
    current: number      // Al día
    overdue30: number    // Vencido a 30 días
    critical: number     // Crítico (+60 días)
  }
}

/* ─── Helpers ───────────────────────────────────────────────────────────── */

function formatQ(amount: number) {
  return `Q ${amount.toLocaleString("es-GT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

/* ─── Summary Card ───────────────────────────────────────────────────────── */

function SummaryCard({
  label,
  value,
  valueClass = "text-[#1A202C]",
}: {
  label: string
  value: string
  valueClass?: string
}) {
  return (
    <div className="bg-[#e8d5c4] rounded-2xl p-6 shadow-sm border border-[#d4bca9] text-center">
      <p className="text-xs font-bold text-[#64748B] uppercase tracking-wider mb-2">{label}</p>
      <p className={`text-2xl font-extrabold ${valueClass}`}>{value}</p>
    </div>
  )
}

/* ─── Aging Bar ──────────────────────────────────────────────────────────── */

function AgingBar({ aging }: { aging: AccountStatement["aging"] }) {
  const total = aging.current + aging.overdue30 + aging.critical
  if (total === 0) return <p className="text-sm text-[#64748B]">Sin datos de vencimiento.</p>

  const pCurrent = (aging.current / total) * 100
  const pOverdue = (aging.overdue30 / total) * 100
  const pCritical = (aging.critical / total) * 100

  return (
    <div className="space-y-3">
      <div className="flex h-10 rounded-xl overflow-hidden gap-1">
        {aging.current > 0 && (
          <div
            className="flex items-center justify-center text-xs font-bold text-[#095556] bg-[#98cba4] transition-all"
            style={{ width: `${pCurrent}%` }}
          >
            {pCurrent > 15 ? `Al día (${formatQ(aging.current)})` : ""}
          </div>
        )}
        {aging.overdue30 > 0 && (
          <div
            className="flex items-center justify-center text-xs font-bold text-[#6B4A1C] bg-[#9fc2ee] opacity-80 transition-all"
            style={{ width: `${pOverdue}%` }}
          >
            {pOverdue > 15 ? "30 días" : ""}
          </div>
        )}
        {aging.critical > 0 && (
          <div
            className="flex items-center justify-center text-xs font-bold text-white bg-red-500 transition-all"
            style={{ width: `${pCritical}%` }}
          >
            {pCritical > 10 ? "Crítico" : ""}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-[#98cba4] inline-block" />
          <span className="text-[#64748B]">Al día —</span>
          <span className="font-semibold text-[#1A202C]">{formatQ(aging.current)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-[#9fc2ee]/30 inline-block opacity-80" />
          <span className="text-[#64748B]">Vencido a 30 días —</span>
          <span className="font-semibold text-[#1A202C]">{formatQ(aging.overdue30)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-red-500 inline-block" />
          <span className="text-[#64748B]">Crítico (+60 días) —</span>
          <span className="font-semibold text-red-600">{formatQ(aging.critical)}</span>
        </div>
      </div>
    </div>
  )
}

/* ─── Skeleton ───────────────────────────────────────────────────────────── */

function Skeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-28 rounded-2xl bg-[#e8d5c4]/60 animate-pulse" />
        ))}
      </div>
      <div className="h-48 rounded-2xl bg-white animate-pulse" />
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

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-[#0A3B7C]/8 flex items-center justify-center">
          <BarChart2 size={20} className="text-[#0A3B7C]" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1A202C] tracking-tight">
          Estado de Cuenta
        </h1>
      </div>

      {/* Loading */}
      {loading && <Skeleton />}

      {/* Error */}
      {!loading && error && (
        <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-8 text-center space-y-4">
          <AlertTriangle size={36} className="text-amber-500 mx-auto" />
          <p className="text-[#64748B] text-sm">No se pudo cargar el estado de cuenta.</p>
          <button
            onClick={() => void fetchData()}
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#0A3B7C] hover:underline cursor-pointer"
          >
            <RefreshCw size={14} /> Reintentar
          </button>
        </div>
      )}

      {/* Content */}
      {!loading && !error && data && (
        <>
          {/* ── Summary Cards ─────────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <SummaryCard
              label="Límite de Crédito"
              value={formatQ(data.creditLimit)}
            />
            <SummaryCard
              label="Total Adeudado"
              value={formatQ(data.totalOwed)}
              valueClass="text-[#1A202C]"
            />
            <SummaryCard
              label="Crédito Disponible"
              value={formatQ(data.availableCredit)}
              valueClass={data.availableCredit > 0 ? "text-[#3A8E2A]" : "text-red-600"}
            />
          </div>

          {/* ── Aging Report ──────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl shadow-sm border border-black/5 p-6 space-y-5">
            <h2 className="text-base font-bold text-[#1A202C]">Reporte de Vencimientos</h2>
            <AgingBar aging={data.aging} />
          </div>

          {/* ── CTA ───────────────────────────────────────────────────── */}
          <div className="flex justify-center">
            <Link
              href="/cliente/facturas"
              className="inline-flex items-center gap-2 bg-[#C9924B] hover:bg-[#B8813C] text-[#0C0C0A] font-bold py-3 px-8 rounded-xl shadow-md transition-colors text-sm"
            >
              Ver Mis Facturas
              <ArrowRight size={16} />
            </Link>
          </div>
        </>
      )}
    </div>
  )
}
