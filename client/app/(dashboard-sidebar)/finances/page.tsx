"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import {
  Banknote,
  CheckCircle2,
  Clock3,
  CreditCard,
  FileClock,
  RefreshCcw,
  Settings,
} from "lucide-react"
import { toast } from "sonner"
import Card from "@/components/ui/Card"
import Button from "@/components/ui/Button"
import FinancePageShell from "@/components/finance/FinancePageShell"
import { fetchFinanceSummary } from "@/lib/api/finance"
import type { FinanceSummary } from "@/types/finance"

function formatCurrency(value: number): string {
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

  useEffect(() => {
    void refreshSummary()
  }, [])

  return (
    <FinancePageShell
      title="Panel Financiero"
      subtitle="Control de facturacion FEL, tesoreria y tarifario base"
    >
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4 mb-8">
        <Card className="rounded-3xl border-black/5 bg-white/95">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.15em] text-[#64748B] font-semibold">Borradores</p>
              <p className="text-4xl font-extrabold text-[#0A3B7C] mt-2">{summary.draftInvoicesPendingReview}</p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-[#0A3B7C]/10 flex items-center justify-center">
              <FileClock size={24} className="text-[#0A3B7C]" />
            </div>
          </div>
          <p className="text-sm text-[#64748B] mt-3">Facturas BORRADOR pendientes de revision</p>
        </Card>

        <Card className="rounded-3xl border-black/5 bg-white/95">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.15em] text-[#64748B] font-semibold">Certificadas</p>
              <p className="text-4xl font-extrabold text-[#0A3B7C] mt-2">{summary.certifiedInvoicesPendingSend}</p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-[#53B73E]/15 flex items-center justify-center">
              <CheckCircle2 size={24} className="text-[#3A8E2A]" />
            </div>
          </div>
          <p className="text-sm text-[#64748B] mt-3">Listas para envio a cliente</p>
        </Card>

        <Card className="rounded-3xl border-black/5 bg-white/95">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.15em] text-[#64748B] font-semibold">Pagos por conciliar</p>
              <p className="text-4xl font-extrabold text-[#0A3B7C] mt-2">{summary.pendingPayments}</p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-amber-100 flex items-center justify-center">
              <CreditCard size={24} className="text-amber-700" />
            </div>
          </div>
          <p className="text-sm text-[#64748B] mt-3">Tesoreria pendiente de aprobacion</p>
        </Card>

        <Card className="rounded-3xl border-black/5 bg-white/95">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.15em] text-[#64748B] font-semibold">Cobrado</p>
              <p className="text-3xl font-extrabold text-[#3A8E2A] mt-2">{formatCurrency(summary.collectedAmount)}</p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-[#53B73E]/15 flex items-center justify-center">
              <Banknote size={24} className="text-[#3A8E2A]" />
            </div>
          </div>
          <p className="text-sm text-[#64748B] mt-3">Pagos aprobados del periodo</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2 rounded-3xl border-black/5 bg-white/95">
          <h2 className="text-2xl font-bold text-[#0A3B7C] mb-5">Accesos del modulo financiero</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/finances/facturacion" className="block">
              <div className="rounded-2xl border border-[#0A3B7C]/10 p-5 bg-[#0A3B7C]/5 hover:bg-[#0A3B7C]/10 transition-colors h-full">
                <div className="h-11 w-11 rounded-xl bg-white flex items-center justify-center shadow-sm mb-4">
                  <FileClock size={22} className="text-[#0A3B7C]" />
                </div>
                <h3 className="text-lg font-bold text-[#0A3B7C]">Bandeja de Facturacion</h3>
                <p className="text-sm text-[#64748B] mt-2">Revisa borradores y envia certificadas.</p>
              </div>
            </Link>

            <Link href="/finances/pagos" className="block">
              <div className="rounded-2xl border border-amber-200 p-5 bg-amber-50 hover:bg-amber-100 transition-colors h-full">
                <div className="h-11 w-11 rounded-xl bg-white flex items-center justify-center shadow-sm mb-4">
                  <CreditCard size={22} className="text-amber-700" />
                </div>
                <h3 className="text-lg font-bold text-amber-800">Conciliar Pagos</h3>
                <p className="text-sm text-amber-700 mt-2">Aprueba pagos para liberar credito.</p>
              </div>
            </Link>

            <Link href="/finances/tarifario" className="block">
              <div className="rounded-2xl border border-emerald-200 p-5 bg-emerald-50 hover:bg-emerald-100 transition-colors h-full">
                <div className="h-11 w-11 rounded-xl bg-white flex items-center justify-center shadow-sm mb-4">
                  <Settings size={22} className="text-emerald-700" />
                </div>
                <h3 className="text-lg font-bold text-emerald-800">Tarifario Base</h3>
                <p className="text-sm text-emerald-700 mt-2">Actualiza tarifa por tipo de unidad.</p>
              </div>
            </Link>
          </div>
        </Card>

        <Card className="rounded-3xl border-black/5 bg-white/95">
          <h2 className="text-xl font-bold text-[#0A3B7C] mb-4">Estado del panel</h2>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#53B73E] opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-[#53B73E]" />
              </span>
              <p className="text-sm text-[#1A202C] font-semibold">Backend financiero conectado</p>
            </div>

            <div className="flex items-center gap-2 text-sm text-[#64748B]">
              <Clock3 size={16} />
              <span>
                {now.toLocaleDateString("es-GT")} {now.toLocaleTimeString("es-GT", { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>

            <div className="pt-2 space-y-3">
              <Button variant="outline" className="w-full" onClick={() => void refreshSummary()} loading={loadingSummary}>
                <RefreshCcw size={16} /> Refrescar indicadores
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </FinancePageShell>
  )
}
