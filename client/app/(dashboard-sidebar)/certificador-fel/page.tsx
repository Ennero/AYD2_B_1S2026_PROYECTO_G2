import Card from "@/components/ui/Card"
import Button from "@/components/ui/Button"
import Link from "next/link"
import { CheckCircle, Clock, FileCheck2, ShieldCheck } from "lucide-react"

export default function CertificadorFelPage() {
  // Datos simulados para Fase 1
  const summary = {
    pending: 14,
    certifiedToday: 42,
  }

  return (
    <div className="relative">
      {/* Background Watermarks */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 flex justify-between">
        <ShieldCheck className="absolute -top-24 -right-24 text-primary/[0.03] w-[500px] h-[500px] transform rotate-12" strokeWidth={1} />
        <FileCheck2 className="absolute -bottom-24 -left-24 text-accent/[0.04] w-[600px] h-[600px] transform -rotate-12" strokeWidth={1} />
      </div>

      <div className="relative z-10 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-primary">Portal Certificador FEL</h1>
          <p className="text-text-muted mt-1 font-body text-lg">Agencia de Administración Tributaria (Simulador)</p>
        </div>
        <Link href="/certificador-fel/bandeja">
          <Button size="lg" className="shadow-md">
            Ir a Bandeja de Aprobación
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="flex items-center p-8 gap-6 border-l-4 border-l-warning">
          <div className="p-4 bg-warning/10 rounded-full text-warning">
            <Clock size={40} />
          </div>
          <div>
            <p className="text-text-muted text-sm uppercase tracking-wide font-semibold">Documentos Pendientes</p>
            <p className="text-5xl font-bold font-heading mt-1">{summary.pending}</p>
          </div>
        </Card>

        <Card className="flex items-center p-8 gap-6 border-l-4 border-l-accent">
          <div className="p-4 bg-accent/20 rounded-full text-primary">
            <CheckCircle size={40} className="text-accent" />
          </div>
          <div>
            <p className="text-text-muted text-sm uppercase tracking-wide font-semibold">Certificados Hoy</p>
            <p className="text-5xl font-bold font-heading mt-1 text-primary">{summary.certifiedToday}</p>
          </div>
        </Card>
      </div>

      <div className="mt-12 bg-surface p-6 rounded-2xl border border-black/5">
        <h2 className="font-heading text-xl font-semibold mb-4 text-primary">Estado del Servicio</h2>
        <div className="flex items-center gap-3 text-sm text-text-primary">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-accent"></span>
          </span>
          Conexión activa con el simulador SAT. Todos los servicios operativos.
        </div>
      </div>
    </div>
    </div>
  )
}
