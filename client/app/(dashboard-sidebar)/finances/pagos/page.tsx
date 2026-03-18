"use client"

import { useEffect, useMemo, useState } from "react"
import { CheckCircle2, Search, Wallet } from "lucide-react"
import { toast } from "sonner"
import Card from "@/components/ui/Card"
import Button from "@/components/ui/Button"
import Modal from "@/components/ui/Modal"
import StatusBadge from "@/components/shared/StatusBadge"
import FinancePageShell from "@/components/finance/FinancePageShell"
import EndpointChip from "@/components/finance/EndpointChip"
import { approvePayment, listPaymentsByStatus } from "@/lib/mocks/financeStore"
import type { FinancePayment } from "@/types/finance"

function formatAmount(value: number): string {
  return `Q ${value.toLocaleString("es-GT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export default function FinancePaymentsPage() {
  const [search, setSearch] = useState("")
  const [pendingPayments, setPendingPayments] = useState<FinancePayment[]>([])
  const [selectedPayment, setSelectedPayment] = useState<FinancePayment | null>(null)
  const [approving, setApproving] = useState(false)

  useEffect(() => {
    setPendingPayments(listPaymentsByStatus("PENDIENTE"))
  }, [])

  const filteredPayments = useMemo(() => {
    const needle = search.trim().toLowerCase()
    if (!needle) {
      return pendingPayments
    }

    return pendingPayments.filter((payment) => {
      const scope = `${payment.clientName} ${payment.invoiceNumber} ${payment.bankReference ?? ""}`.toLowerCase()
      return scope.includes(needle)
    })
  }, [pendingPayments, search])

  const confirmApprovePayment = async () => {
    if (!selectedPayment) {
      return
    }

    setApproving(true)
    try {
      approvePayment(selectedPayment.paymentId)
      toast.success(`Pago ${selectedPayment.bankReference ?? selectedPayment.paymentId} aprobado`)
      setSelectedPayment(null)
      setPendingPayments(listPaymentsByStatus("PENDIENTE"))
    } catch (error) {
      const message = error instanceof Error ? error.message : "No fue posible aprobar el pago"
      toast.error(message)
    } finally {
      setApproving(false)
    }
  }

  return (
    <FinancePageShell
      title="Conciliacion de Pagos"
      subtitle="Aprobacion de pagos registrados por cliente despues del flujo FEL"
      rightSlot={<EndpointChip endpoint="GET /api/finance/payments?status=PENDIENTE" />}
    >
      <div className="mb-8 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        Esta aprobacion no pertenece al proceso FEL. Ocurre despues de certificar y enviar la factura,
        cuando tesoreria valida el pago para liberar credito.
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#64748B]" />
          <input
            type="text"
            placeholder="Buscar por cliente, factura o referencia bancaria"
            className="w-full border border-[#0A3B7C]/30 rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:ring-4 focus:ring-[#0A3B7C]/10 bg-white/95"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <EndpointChip endpoint="PATCH /api/finance/payments/{PAYMENT_ID}/approve" />
      </div>

      <Card className="rounded-3xl border-black/5 bg-white/95 p-0 overflow-hidden">
        <div className="grid grid-cols-6 gap-4 p-4 bg-[#0A3B7C]/5 border-b border-black/5 text-sm font-bold uppercase tracking-[0.12em] text-[#0A3B7C]/70">
          <div>Cliente</div>
          <div>Factura</div>
          <div>Monto</div>
          <div>Banco</div>
          <div>Referencia</div>
          <div className="text-right">Accion</div>
        </div>

        {filteredPayments.length === 0 ? (
          <div className="p-8 text-center text-[#64748B]">No hay pagos pendientes por conciliar.</div>
        ) : (
          filteredPayments.map((payment) => (
            <div
              key={payment.paymentId}
              className="grid grid-cols-6 gap-4 p-4 items-center border-b border-black/5 hover:bg-black/[0.02]"
            >
              <div className="font-semibold text-[#1A202C]">{payment.clientName}</div>
              <div className="text-[#0A3B7C] font-bold">{payment.invoiceNumber}</div>
              <div className="text-[#1A202C] font-bold">{formatAmount(payment.amount)}</div>
              <div className="text-[#64748B]">{payment.bankName ?? "-"}</div>
              <div className="text-sm font-mono text-[#64748B]">{payment.bankReference ?? "-"}</div>
              <div className="text-right">
                <Button size="sm" onClick={() => setSelectedPayment(payment)}>
                  <CheckCircle2 size={15} /> Aprobar
                </Button>
              </div>
            </div>
          ))
        )}
      </Card>

      <Modal
        open={Boolean(selectedPayment)}
        onClose={() => {
          if (!approving) {
            setSelectedPayment(null)
          }
        }}
        title="Confirmar aprobacion de pago"
      >
        <div className="py-4">
          <div className="flex items-center gap-3 mb-4 text-[#0A3B7C]">
            <Wallet size={22} />
            <p className="font-semibold">El pago se registrara como APROBADO en tesoreria.</p>
          </div>

          <div className="rounded-2xl bg-[#0A3B7C]/5 border border-[#0A3B7C]/15 p-4 mb-8 text-sm space-y-1">
            <p>
              Cliente: <strong>{selectedPayment?.clientName}</strong>
            </p>
            <p>
              Factura: <strong>{selectedPayment?.invoiceNumber}</strong>
            </p>
            <p>
              Monto: <strong>{selectedPayment ? formatAmount(selectedPayment.amount) : "-"}</strong>
            </p>
            <p>
              Referencia: <strong>{selectedPayment?.bankReference ?? "-"}</strong>
            </p>
            <div className="pt-2">
              <StatusBadge variant="warning">Estado actual: PENDIENTE</StatusBadge>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setSelectedPayment(null)} disabled={approving}>
              Cancelar
            </Button>
            <Button onClick={() => void confirmApprovePayment()} loading={approving}>
              Confirmar aprobacion
            </Button>
          </div>
        </div>
      </Modal>
    </FinancePageShell>
  )
}
