"use client"

import Link from "next/link"
import { useCallback, useEffect, useMemo, useState } from "react"
import { FileSearch, Send, Plus, Mail } from "lucide-react"
import { toast } from "sonner"
import Card from "@/components/ui/Card"
import Button from "@/components/ui/Button"
import Modal from "@/components/ui/Modal"
import StatusBadge from "@/components/shared/StatusBadge"
import FinancePageShell from "@/components/finance/FinancePageShell"
import EndpointChip from "@/components/finance/EndpointChip"
import { fetchFinanceInvoices, sendFinanceInvoice } from "@/lib/api/finance"
import type { FinanceInvoice } from "@/types/finance"

function normalize(value: string): string {
  return value.trim().toLowerCase()
}

export default function FinanceBillingPage() {
  const [search, setSearch] = useState("")
  const [draftInvoices, setDraftInvoices] = useState<FinanceInvoice[]>([])
  const [certifiedInvoices, setCertifiedInvoices] = useState<FinanceInvoice[]>([])
  const [selectedCertified, setSelectedCertified] = useState<FinanceInvoice | null>(null)
  const [loadingData, setLoadingData] = useState(false)
  const [sendingInvoice, setSendingInvoice] = useState(false)

  const refreshData = useCallback(async () => {
    setLoadingData(true)
    try {
      const [draft, certified] = await Promise.all([
        fetchFinanceInvoices("BORRADOR"),
        fetchFinanceInvoices("CERTIFICADA"),
      ])
      setDraftInvoices(draft)
      setCertifiedInvoices(certified)
    } catch (error) {
      const message = error instanceof Error ? error.message : "No fue posible cargar la bandeja de facturacion"
      toast.error(message)
    } finally {
      setLoadingData(false)
    }
  }, [])

  useEffect(() => {
    void refreshData()
  }, [refreshData])

  const searchValue = normalize(search)

  const filteredDraftInvoices = useMemo(() => {
    if (!searchValue) {
      return draftInvoices
    }

    return draftInvoices.filter((invoice) => {
      const scope = `${invoice.invoiceNumber} ${invoice.orderNumber} ${invoice.clientName}`.toLowerCase()
      return scope.includes(searchValue)
    })
  }, [draftInvoices, searchValue])

  const filteredCertifiedInvoices = useMemo(() => {
    if (!searchValue) {
      return certifiedInvoices
    }

    return certifiedInvoices.filter((invoice) => {
      const scope = `${invoice.invoiceNumber} ${invoice.clientName} ${invoice.felUuid ?? ""}`.toLowerCase()
      return scope.includes(searchValue)
    })
  }, [certifiedInvoices, searchValue])

  const confirmSendInvoice = async () => {
    if (!selectedCertified) {
      return
    }

    setSendingInvoice(true)
    try {
      await sendFinanceInvoice(selectedCertified.invoiceId)
      toast.success(`Factura ${selectedCertified.invoiceNumber} enviada al cliente`)
      setSelectedCertified(null)
      await refreshData()
    } catch (error) {
      const message = error instanceof Error ? error.message : "No fue posible enviar la factura"
      toast.error(message)
    } finally {
      setSendingInvoice(false)
    }
  }

  return (
    <FinancePageShell
      title="Bandeja de Facturacion"
      subtitle="Revision de BORRADOR autogenerado y envio de certificadas"
      rightSlot={
        <Button variant="outline" className="w-full md:w-auto" onClick={() => toast.info("Flujo de contingencia disponible en la siguiente fase")}> 
          <Plus size={16} /> Crear Manual (Contingencia)
        </Button>
      }
    >
      <div className="mb-6 rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900">
        En esta vista conviven dos bandejas: primero los BORRADOR generados al entregar la orden y despues
        las facturas CERTIFICADA listas para envio al cliente.
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <input
          type="text"
          placeholder="Buscar por factura, orden o cliente"
          className="flex-1 min-w-[220px] border border-[#0A3B7C]/30 rounded-xl px-4 py-3 focus:outline-none focus:ring-4 focus:ring-[#0A3B7C]/10 bg-white/95"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <EndpointChip endpoint="GET /api/finance/invoices?status=BORRADOR" />
      </div>

      <Card className="rounded-3xl border-black/5 bg-white/95 p-0 overflow-hidden mb-10">
        <div className="grid grid-cols-6 gap-4 p-4 bg-[#0A3B7C]/5 border-b border-black/5 text-sm font-bold uppercase tracking-[0.12em] text-[#0A3B7C]/70">
          <div className="col-span-1">Factura</div>
          <div className="col-span-1">Orden</div>
          <div className="col-span-1">Cliente</div>
          <div className="col-span-1">Fecha entrega</div>
          <div className="col-span-1">Estado</div>
          <div className="col-span-1 text-right">Acciones</div>
        </div>

        {loadingData ? (
          <div className="p-8 text-center text-[#64748B]">Cargando facturas...</div>
        ) : filteredDraftInvoices.length === 0 ? (
          <div className="p-8 text-center text-[#64748B]">No hay facturas BORRADOR para mostrar.</div>
        ) : (
          filteredDraftInvoices.map((invoice) => (
            <div
              key={invoice.invoiceId}
              className="grid grid-cols-6 gap-4 p-4 items-center border-b border-black/5 hover:bg-black/[0.02]"
            >
              <div className="font-bold text-[#0A3B7C]">{invoice.invoiceNumber}</div>
              <div className="font-semibold text-[#1A202C]">{invoice.orderNumber}</div>
              <div className="text-[#1A202C]">{invoice.clientName}</div>
              <div className="text-[#64748B] text-sm">{invoice.deliveredAt ? new Date(invoice.deliveredAt).toLocaleDateString("es-GT") : "-"}</div>
              <div>
                <StatusBadge variant="warning">Borrador</StatusBadge>
              </div>
              <div className="text-right">
                <Link href={`/finances/facturacion/${invoice.invoiceId}`}>
                  <Button variant="outline" size="sm">
                    <FileSearch size={15} /> Revisar
                  </Button>
                </Link>
              </div>
            </div>
          ))
        )}
      </Card>

      <div className="mt-2 mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#0A3B7C]">Facturas Certificadas por FEL</h2>
          <p className="text-sm text-[#64748B]">Luego de la aprobacion fiscal, quedan listas para envio.</p>
        </div>
        <EndpointChip endpoint="GET /api/finance/invoices?status=CERTIFICADA" />
      </div>

      <Card className="rounded-3xl border-black/5 bg-white/95 p-0 overflow-hidden">
        <div className="grid grid-cols-6 gap-4 p-4 bg-[#0A3B7C]/5 border-b border-black/5 text-sm font-bold uppercase tracking-[0.12em] text-[#0A3B7C]/70">
          <div className="col-span-1">Factura</div>
          <div className="col-span-1">Cliente</div>
          <div className="col-span-1">UUID FEL</div>
          <div className="col-span-1">Certificada</div>
          <div className="col-span-1">Estado</div>
          <div className="col-span-1 text-right">Acciones</div>
        </div>

        {loadingData ? (
          <div className="p-8 text-center text-[#64748B]">Cargando facturas...</div>
        ) : filteredCertifiedInvoices.length === 0 ? (
          <div className="p-8 text-center text-[#64748B]">No hay facturas CERTIFICADA pendientes de envio.</div>
        ) : (
          filteredCertifiedInvoices.map((invoice) => (
            <div
              key={invoice.invoiceId}
              className="grid grid-cols-6 gap-4 p-4 items-center border-b border-black/5 hover:bg-black/[0.02]"
            >
              <div className="font-bold text-[#0A3B7C]">{invoice.invoiceNumber}</div>
              <div className="text-[#1A202C]">{invoice.clientName}</div>
              <div className="text-xs font-mono text-[#64748B] break-all">{invoice.felUuid ?? "-"}</div>
              <div className="text-[#64748B] text-sm">
                {invoice.certifiedAt ? new Date(invoice.certifiedAt).toLocaleString("es-GT") : "-"}
              </div>
              <div>
                <StatusBadge variant="info">Certificada</StatusBadge>
              </div>
              <div className="text-right">
                <Button size="sm" onClick={() => setSelectedCertified(invoice)}>
                  <Mail size={15} /> Enviar
                </Button>
              </div>
            </div>
          ))
        )}
      </Card>

      <Modal
        open={Boolean(selectedCertified)}
        onClose={() => {
          if (!sendingInvoice) {
            setSelectedCertified(null)
          }
        }}
        title="Enviar factura certificada"
      >
        <div className="py-4">
          <p className="text-[#1A202C] mb-8">
            Se enviara la factura <strong>{selectedCertified?.invoiceNumber}</strong> al cliente
            {" "}<strong>{selectedCertified?.clientName}</strong> y se marcara como ENVIADA.
          </p>

          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setSelectedCertified(null)} disabled={sendingInvoice}>
              Cancelar
            </Button>
            <Button onClick={() => void confirmSendInvoice()} loading={sendingInvoice}>
              <Send size={15} /> Confirmar envio
            </Button>
          </div>
        </div>
      </Modal>
    </FinancePageShell>
  )
}
