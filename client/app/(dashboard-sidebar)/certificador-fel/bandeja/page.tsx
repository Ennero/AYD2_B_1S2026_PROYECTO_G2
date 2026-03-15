"use client"

import { useState } from "react"
import Card from "@/components/ui/Card"
import Button from "@/components/ui/Button"
import Modal from "@/components/ui/Modal"
import { Check, X, FileText, AlertTriangle, ShieldCheck, FileCheck2 } from "lucide-react"

// Datos simulados
const mockInvoices = [
  { id: "inv-001", number: "DTE-001", client: "Transportes El Rápido", nit: "1234567-8", amount: 15400.00, date: "2026-03-15" },
  { id: "inv-002", number: "DTE-002", client: "Distribuidora Central", nit: "9876543-2", amount: 8250.50, date: "2026-03-15" },
  { id: "inv-003", number: "DTE-003", client: "Logística del Norte", nit: "4567891-3", amount: 22100.00, date: "2026-03-14" },
]

export default function BandejaAprobacionPage() {
  const [invoices, setInvoices] = useState(mockInvoices)
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null)
  
  // Modals
  const [showCertifyModal, setShowCertifyModal] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  const handleAction = (invoice: any, action: "certify" | "reject") => {
    setSelectedInvoice(invoice)
    if (action === "certify") setShowCertifyModal(true)
    if (action === "reject") setShowRejectModal(true)
  }

  const confirmCertify = () => {
    setIsProcessing(true)
    setTimeout(() => {
      setInvoices(prev => prev.filter(inv => inv.id !== selectedInvoice.id))
      setIsProcessing(false)
      setShowCertifyModal(false)
    }, 800)
  }

  const confirmReject = () => {
    setIsProcessing(true)
    setTimeout(() => {
      setInvoices(prev => prev.filter(inv => inv.id !== selectedInvoice.id))
      setIsProcessing(false)
      setShowRejectModal(false)
    }, 800)
  }

  return (
    <div className="relative">
      {/* Background Watermarks */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-[0] flex justify-between">
        <ShieldCheck className="absolute -top-24 -right-24 text-primary/[0.03] w-[500px] h-[500px] transform rotate-12" strokeWidth={1} />
        <FileCheck2 className="absolute -bottom-24 -left-24 text-accent/[0.04] w-[600px] h-[600px] transform -rotate-12" strokeWidth={1} />
      </div>

      <div className="relative z-10 space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-heading font-bold text-primary">Bandeja de Aprobación</h1>
        <p className="text-text-muted mt-1">Revisión y certificación de Documentos Tributarios Electrónicos (DTE)</p>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface border-b border-black/5 text-sm uppercase text-text-muted">
                <th className="p-4 font-semibold">Documento</th>
                <th className="p-4 font-semibold">Cliente</th>
                <th className="p-4 font-semibold">NIT</th>
                <th className="p-4 font-semibold">Monto (GTQ)</th>
                <th className="p-4 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-text-muted">
                    No hay documentos pendientes de aprobación.
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-black/[0.02] transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <FileText size={16} className="text-primary" />
                        <span className="font-medium text-primary">{inv.number}</span>
                      </div>
                      <div className="text-xs text-text-muted mt-0.5">{inv.date}</div>
                    </td>
                    <td className="p-4 font-medium">{inv.client}</td>
                    <td className="p-4 text-text-muted">{inv.nit}</td>
                    <td className="p-4 font-bold tracking-tight">
                      Q {inv.amount.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="text-error hover:bg-error/10"
                        onClick={() => handleAction(inv, "reject")}
                      >
                        <X size={16} /> Rechazar
                      </Button>
                      <Button 
                        size="sm" 
                        className="bg-accent text-primary hover:bg-accent/80"
                        onClick={() => handleAction(inv, "certify")}
                      >
                        <Check size={16} /> Certificar
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
        isOpen={showCertifyModal} 
        onClose={() => !isProcessing && setShowCertifyModal(false)}
        title="Certificar Documento"
      >
        <div className="py-4">
          <div className="flex items-center justify-center mb-6">
            <div className="h-16 w-16 bg-accent/20 rounded-full flex items-center justify-center text-primary">
              <Check size={32} className="text-accent" />
            </div>
          </div>
          <p className="text-center font-medium text-lg mb-2">
            ¿Confirmas la certificación de {selectedInvoice?.number}?
          </p>
          <p className="text-center text-text-muted text-sm mb-6">
            Se generará un UUID de FEL y el documento será válido ante la SAT.
          </p>
          
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => setShowCertifyModal(false)} disabled={isProcessing}>
              Cancelar
            </Button>
            <Button 
              className="bg-accent text-primary hover:bg-accent/90" 
              onClick={confirmCertify} 
              loading={isProcessing}
            >
              Confirmar y Certificar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Rechazar */}
      <Modal 
        isOpen={showRejectModal} 
        onClose={() => !isProcessing && setShowRejectModal(false)}
        title="Rechazar Documento"
      >
        <div className="py-4">
          <div className="flex items-center gap-3 p-4 bg-error/10 text-error rounded-lg mb-6">
            <AlertTriangle size={24} />
            <p className="text-sm font-medium">Esta acción devolverá el documento a estado de borrador o lo invalidará.</p>
          </div>
          
          <div className="space-y-4 mb-6">
            <label className="block text-sm font-medium text-text-primary">Motivo de rechazo (obligatorio)</label>
            <textarea 
              className="w-full border border-black/10 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[100px]"
              placeholder="Ej. NIT inválido, montos no coinciden..."
            ></textarea>
          </div>
          
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => setShowRejectModal(false)} disabled={isProcessing}>
              Cancelar
            </Button>
            <Button 
              variant="danger" 
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
