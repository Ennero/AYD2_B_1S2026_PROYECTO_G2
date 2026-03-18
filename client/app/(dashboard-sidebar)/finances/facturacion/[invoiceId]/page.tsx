"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, FileCheck2, Send } from "lucide-react"
import { toast } from "sonner"
import Card from "@/components/ui/Card"
import Button from "@/components/ui/Button"
import Modal from "@/components/ui/Modal"
import StatusBadge from "@/components/shared/StatusBadge"
import FinancePageShell from "@/components/finance/FinancePageShell"
import EndpointChip from "@/components/finance/EndpointChip"
import { fetchFinanceInvoiceById, submitFinanceInvoiceForCertification } from "@/lib/api/finance"
import type { FinanceInvoice } from "@/types/finance"

function formatAmount(value: number): string {
  return `Q ${value.toLocaleString("es-GT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export default function FinanceInvoiceReviewPage() {
  const params = useParams<{ invoiceId: string }>()
  const router = useRouter()
  const [invoice, setInvoice] = useState<FinanceInvoice | null>(null)
  const [loadingInvoice, setLoadingInvoice] = useState(true)
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const loadInvoice = async () => {
      if (!params.invoiceId) {
        setLoadingInvoice(false)
        return
      }

      setLoadingInvoice(true)
      try {
        const current = await fetchFinanceInvoiceById(params.invoiceId)
        setInvoice(current)
      } catch (error) {
        setInvoice(null)
        const message = error instanceof Error ? error.message : "No fue posible cargar el detalle de factura"
        toast.error(message)
      } finally {
        setLoadingInvoice(false)
      }
    }

    void loadInvoice()
  }, [params.invoiceId])

  const handleSubmitForCertification = async () => {
    if (!invoice) {
      return
    }

    setSubmitting(true)
    try {
      await submitFinanceInvoiceForCertification(invoice.invoiceId, {
        serviceDescription: invoice.serviceDescription,
        dueDate: invoice.dueDate,
        reviewConfirmed: true,
      })
      toast.success(`Factura ${invoice.invoiceNumber} enviada al flujo FEL`)
      setShowSubmitModal(false)
      router.push("/finances/facturacion")
    } catch (error) {
      const message = error instanceof Error ? error.message : "No fue posible enviar la factura"
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loadingInvoice) {
    return (
      <FinancePageShell title="Cargando factura" subtitle="Obteniendo detalle desde el backend financiero.">
        <Card className="rounded-3xl bg-white/95 border-black/5">
          <p className="text-[#64748B]">Cargando informacion de la factura...</p>
        </Card>
      </FinancePageShell>
    )
  }

  if (!invoice) {
    return (
      <FinancePageShell title="Factura no encontrada" subtitle="No se encontro el borrador solicitado.">
        <Card className="rounded-3xl bg-white/95 border-black/5">
          <p className="text-[#64748B] mb-6">El identificador de factura no existe o no esta disponible.</p>
          <Link href="/finances/facturacion">
            <Button variant="outline">
              <ArrowLeft size={16} /> Volver a bandeja
            </Button>
          </Link>
        </Card>
      </FinancePageShell>
    )
  }

  return (
    <FinancePageShell
      title="Revision de factura borrador"
      subtitle={`Factura ${invoice.invoiceNumber} asociada a ${invoice.orderNumber}`}
      rightSlot={<EndpointChip endpoint="GET /api/finance/invoices/{INVOICE_ID}" />}
    >
      <Link href="/finances/facturacion" className="inline-flex items-center gap-2 text-[#0A3B7C] font-bold mb-6 hover:text-[#083066]">
        <ArrowLeft size={16} /> Volver a bandeja
      </Link>

      <div className="mb-6 rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900">
        Este borrador se genero automaticamente cuando la orden fue marcada como ENTREGADA. Finanzas valida
        datos comerciales y tributarios antes de enviarlo al certificador FEL.
      </div>

      <Card className="rounded-3xl bg-white/95 border-black/5">
        <div className="border-b border-black/5 pb-6 mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.15em] text-[#64748B] font-semibold">Documento</p>
            <h2 className="text-3xl font-extrabold text-[#0A3B7C] mt-2">{invoice.invoiceNumber}</h2>
            <p className="text-sm text-[#64748B] mt-1">Emitida: {new Date(invoice.issueDate).toLocaleString("es-GT")}</p>
          </div>
          <StatusBadge variant="warning" className="w-fit">Borrador</StatusBadge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-[#0A3B7C]">Datos del receptor</h3>
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-[#64748B] font-semibold">Cliente</p>
              <p className="text-[#1A202C] font-semibold mt-1">{invoice.clientName}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-[#64748B] font-semibold">NIT</p>
              <p className="text-[#1A202C] font-semibold mt-1">{invoice.clientNit}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-[#64748B] font-semibold">Direccion fiscal</p>
              <p className="text-[#1A202C] font-semibold mt-1">{invoice.clientAddress || "-"}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-[#64748B] font-semibold">Fecha entrega orden</p>
              <p className="text-[#1A202C] font-semibold mt-1">
                {invoice.deliveredAt ? new Date(invoice.deliveredAt).toLocaleString("es-GT") : "-"}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-bold text-[#0A3B7C]">Concepto y totales</h3>
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-[#64748B] font-semibold">Descripcion servicio</p>
              <p className="text-[#1A202C] font-semibold mt-1">{invoice.serviceDescription || "-"}</p>
            </div>
            <div className="rounded-2xl bg-[#0A3B7C] text-white p-5 mt-4 shadow-inner">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white/80">Subtotal</span>
                <strong>{formatAmount(invoice.subtotalAmount)}</strong>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-white/80">IVA (12%)</span>
                <strong>{formatAmount(invoice.taxAmount)}</strong>
              </div>
              <div className="h-px bg-white/20 my-3" />
              <div className="flex items-center justify-between text-lg">
                <span className="font-bold">Total</span>
                <strong>{formatAmount(invoice.totalAmount)}</strong>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-black/5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <EndpointChip endpoint="PATCH /api/finance/invoices/{INVOICE_ID}/submit-for-certification" />
          <Button className="md:w-auto" onClick={() => setShowSubmitModal(true)}>
            <Send size={16} /> Enviar a certificador FEL
          </Button>
        </div>
      </Card>

      <Modal
        open={showSubmitModal}
        onClose={() => {
          if (!submitting) {
            setShowSubmitModal(false)
          }
        }}
        title="Confirmar envio a FEL"
      >
        <div className="py-4">
          <div className="flex items-center gap-3 mb-6 text-[#0A3B7C]">
            <FileCheck2 size={24} />
            <p className="font-semibold">Se enviara el borrador para validacion fiscal del certificador.</p>
          </div>

          <p className="text-[#1A202C] mb-8">
            Factura: <strong>{invoice.invoiceNumber}</strong><br />
            Cliente: <strong>{invoice.clientName}</strong>
          </p>

          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setShowSubmitModal(false)} disabled={submitting}>
              Cancelar
            </Button>
            <Button onClick={() => void handleSubmitForCertification()} loading={submitting}>
              Confirmar envio
            </Button>
          </div>
        </div>
      </Modal>
    </FinancePageShell>
  )
}
