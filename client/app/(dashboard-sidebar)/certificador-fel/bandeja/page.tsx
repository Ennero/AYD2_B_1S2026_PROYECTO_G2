"use client"

import { useState, useEffect } from "react"
import Card from "@/components/ui/Card"
import Button from "@/components/ui/Button"
import Modal from "@/components/ui/Modal"
import { Check, X, FileText, AlertTriangle } from "lucide-react"
import { api } from "@/lib/api/client"
import { ENDPOINTS } from "@/lib/api/endpoints"
import { Invoice } from "@/lib/api/types"
import { toast } from "sonner"

export default function BandejaAprobacionPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [rejectReason, setRejectReason] = useState("")
  
  // Modals
  const [showCertifyModal, setShowCertifyModal] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [nitToValidate, setNitToValidate] = useState("")
  const [nitIsValid, setNitIsValid] = useState(false)
  const [nitValidatedForInvoiceId, setNitValidatedForInvoiceId] = useState<string | null>(null)
  const [isValidatingNit, setIsValidatingNit] = useState(false)

  const fetchInvoices = async () => {
    try {
      setLoading(true)
      const response = await api.get<{ data: Invoice[] }>(ENDPOINTS.CERTIFIER.INVOICES)
      setInvoices(response.data.data)
    } catch (error) {
      console.error("Failed to fetch invoices:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInvoices()
  }, [])

  const handleAction = (invoice: Invoice, action: "certify" | "reject") => {
    setSelectedInvoice(invoice)
    if (action === "certify") {
      setNitToValidate(invoice.clientNit ?? "")
      setNitIsValid(false)
      setNitValidatedForInvoiceId(null)
      setShowCertifyModal(true)
    }
    if (action === "reject") {
        setRejectReason("")
        setShowRejectModal(true)
    }
  }

  const validateNit = async () => {
    if (!selectedInvoice) return

    const nitValue = nitToValidate.trim()
    if (!nitValue) {
      toast.error("Debe ingresar un NIT para validar")
      return
    }

    setIsValidatingNit(true)
    try {
      const response = await api.post<{ data: { invoiceId: string; clientNit: string; isValid: boolean } }>(
        ENDPOINTS.CERTIFIER.VALIDATE_NIT(selectedInvoice.invoiceId),
        { clientNit: nitValue },
      )

      const isValid = response.data.data.isValid
      setNitIsValid(isValid)
      setNitValidatedForInvoiceId(isValid ? selectedInvoice.invoiceId : null)

      if (isValid) {
        toast.success("NIT validado correctamente")
      } else {
        toast.error("El NIT no coincide con el receptor de la factura")
      }
    } catch (error) {
      setNitIsValid(false)
      setNitValidatedForInvoiceId(null)
      console.error("NIT validation error:", error)
    } finally {
      setIsValidatingNit(false)
    }
  }

  const confirmCertify = async () => {
    if (!selectedInvoice) return

    if (!nitIsValid || nitValidatedForInvoiceId !== selectedInvoice.invoiceId) {
      toast.error("Primero debe validar correctamente el NIT del receptor")
      return
    }

    setIsProcessing(true)
    try {
      // Simulamos la generación de un UUID de FEL que normalmente vendría de SAT
      const pseudoFelUuid = crypto.randomUUID().toUpperCase()
      await api.patch(ENDPOINTS.CERTIFIER.CERTIFY(selectedInvoice.invoiceId), {
        felUuid: pseudoFelUuid,
        clientNit: nitToValidate.trim(),
      })
      
      toast.success(`Factura ${selectedInvoice.invoiceNumber} certificada con éxito`)
      await fetchInvoices()
      setShowCertifyModal(false)
      setNitIsValid(false)
      setNitValidatedForInvoiceId(null)
    } catch (error) {
      console.error("Certification error:", error)
    } finally {
      setIsProcessing(false)
    }
  }

  const confirmReject = async () => {
    if (!selectedInvoice) return
    if (!rejectReason.trim()) {
        toast.error("Debe proporcionar un motivo de rechazo")
        return
    }

    setIsProcessing(true)
    try {
      await api.patch(ENDPOINTS.CERTIFIER.REJECT(selectedInvoice.invoiceId), { reason: rejectReason })
      
      toast.success(`Documento ${selectedInvoice.invoiceNumber} rechazado correctamente`)
      await fetchInvoices()
      setShowRejectModal(false)
    } catch (error) {
      console.error("Rejection error:", error)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="min-h-screen relative animate-in fade-in duration-700 font-body">
      {/* HD Minimalist Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40 pointer-events-none"
        style={{ backgroundImage: "url('/images/certificador-minimal-hd.png')" }}
      />
      
      <div className="relative z-10 w-full h-full min-h-screen px-6 py-12 md:p-16 flex flex-col max-w-7xl mx-auto">
        <div className="mb-10">
          <h1 className="text-4xl font-heading font-extrabold text-[#0A3B7C]">Bandeja de Aprobación</h1>
          <p className="text-[#64748B] mt-2 text-lg">Revisión y certificación de Documentos Tributarios Electrónicos (DTE)</p>
        </div>

        <Card className="overflow-hidden p-0 rounded-3xl shadow-xl bg-white/95 backdrop-blur-md border-black/5">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#0A3B7C]/5 border-b border-black/5 text-sm uppercase text-[#0A3B7C]/60">
                  <th className="p-6 font-bold tracking-widest">Documento</th>
                  <th className="p-6 font-bold tracking-widest">Cliente</th>
                  <th className="p-6 font-bold tracking-widest">NIT</th>
                  <th className="p-6 font-bold tracking-widest">Monto (GTQ)</th>
                  <th className="p-6 font-bold tracking-widest text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-10 text-center text-[#64748B] text-lg">
                      No hay documentos pendientes de aprobación.
                    </td>
                  </tr>
                ) : (
                  invoices.map((inv) => (
                    <tr key={inv.invoiceId} className="hover:bg-black/[0.02] transition-colors">
                      {(() => {
                        const emissionDate =
                          inv.issueDate ||
                          (inv as Invoice & { issue_date?: string }).issue_date ||
                          null

                        return (
                      <td className="p-6">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-[#0A3B7C]/10 rounded-lg">
                            <FileText size={20} className="text-[#0A3B7C]" />
                          </div>
                          <span className="font-bold text-[#0A3B7C]">{inv.invoiceNumber}</span>
                        </div>
                        <div className="text-xs text-[#64748B] mt-1 ml-11">
                          {emissionDate ? new Date(emissionDate).toLocaleDateString() : "Sin fecha"}
                        </div>
                      </td>
                        )
                      })()}
                      <td className="p-6 font-semibold text-[#1A202C]">{inv.clientName}</td>
                      <td className="p-6 text-[#64748B]">{inv.clientNit}</td>
                      <td className="p-6 font-extrabold text-lg text-[#0A3B7C] tracking-tight">
                        {inv.currency || "GTQ"} {Number(inv.totalAmount).toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-6 text-right space-x-3">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="text-error hover:bg-error/10 font-bold"
                          onClick={() => handleAction(inv, "reject")}
                        >
                          <X size={18} /> Rechazar
                        </Button>
                        <Button 
                          size="sm" 
                          className="bg-[#53B73E] text-white hover:bg-[#3A8E2A] border-none shadow-md px-6"
                          onClick={() => handleAction(inv, "certify")}
                        >
                          <Check size={18} /> Certificar
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Modal Certificar */}
        <Modal 
          open={showCertifyModal} 
          onClose={() => !isProcessing && setShowCertifyModal(false)}
          title="Certificar Documento"
        >
          <div className="py-6">
            <div className="flex items-center justify-center mb-8">
              <div className="h-20 w-20 bg-[#53B73E]/20 rounded-full flex items-center justify-center text-[#53B73E]">
                <Check size={40} className="text-[#53B73E]" />
              </div>
            </div>
            <p className="text-center font-bold text-xl mb-3 text-[#0A3B7C]">
              ¿Confirmas la certificación de {selectedInvoice?.invoiceNumber}?
            </p>
            <p className="text-center text-[#64748B] text-base mb-10 max-w-sm mx-auto">
              Se generará un UUID de FEL y el documento será válido ante la SAT de forma inmediata.
            </p>

            <div className="space-y-3 mb-8">
              <label className="block text-sm font-bold text-[#0A3B7C] uppercase tracking-widest pl-1">
                Validación de NIT (simulada)
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  className="w-full border border-black/10 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-4 focus:ring-[#0A3B7C]/10 bg-surface/50"
                  placeholder="Ingrese NIT a validar"
                  value={nitToValidate}
                  onChange={(e) => {
                    setNitToValidate(e.target.value)
                    setNitIsValid(false)
                    setNitValidatedForInvoiceId(null)
                  }}
                  disabled={isProcessing}
                />
                <Button
                  variant="outline"
                  className="whitespace-nowrap"
                  onClick={validateNit}
                  loading={isValidatingNit}
                  disabled={isProcessing || !nitToValidate.trim()}
                >
                  Verificar NIT
                </Button>
              </div>
              <p className={`text-sm font-semibold ${nitIsValid ? "text-[#3A8E2A]" : "text-[#64748B]"}`}>
                {nitIsValid
                  ? "NIT validado. Ya puede certificar este documento."
                  : "Debe validar el NIT correctamente antes de certificar."}
              </p>
            </div>
            
            <div className="flex gap-4 justify-end border-t border-black/5 pt-8">
              <Button variant="ghost" onClick={() => setShowCertifyModal(false)} disabled={isProcessing} className="font-bold">
                Cancelar
              </Button>
              <Button 
                className="bg-[#53B73E] text-white hover:bg-[#3A8E2A] border-none shadow-lg px-8" 
                onClick={confirmCertify} 
                disabled={!nitIsValid || nitValidatedForInvoiceId !== selectedInvoice?.invoiceId}
                loading={isProcessing}
              >
                Confirmar y Certificar
              </Button>
            </div>
          </div>
        </Modal>

        {/* Modal Rechazar */}
        <Modal 
          open={showRejectModal} 
          onClose={() => !isProcessing && setShowRejectModal(false)}
          title="Rechazar Documento"
        >
          <div className="py-6">
            <div className="flex items-center gap-4 p-5 bg-error/10 text-error rounded-2xl mb-8">
              <AlertTriangle size={32} />
              <p className="text-sm font-bold">Esta acción invalidará el documento y lo devolverá al flujo operativo de revisión.</p>
            </div>
            
            <div className="space-y-4 mb-8">
              <label className="block text-sm font-bold text-[#0A3B7C] uppercase tracking-widest pl-1">Motivo de rechazo (obligatorio)</label>
              <textarea 
                className="w-full border border-black/10 rounded-2xl p-5 text-base focus:outline-none focus:ring-4 focus:ring-[#E53E3E]/10 min-h-[120px] bg-surface/50"
                placeholder="Ej. NIT inválido, montos no coinciden con la orden de servicio..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              ></textarea>
            </div>
            
            <div className="flex gap-4 justify-end border-t border-black/5 pt-8">
              <Button variant="ghost" onClick={() => setShowRejectModal(false)} disabled={isProcessing} className="font-bold">
                Cancelar
              </Button>
              <Button 
                variant="danger" 
                className="bg-[#E53E3E] hover:bg-[#C53030] text-white shadow-lg px-8"
                onClick={confirmReject} 
                loading={isProcessing}
              >
                Rechazar Documento
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  )
}
