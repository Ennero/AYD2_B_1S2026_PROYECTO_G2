import { Toaster } from "sonner"
import ClientSidebar, { ClientMobileHeader } from "@/components/layout/ClientSidebar"

/**
 * Layout del portal cliente.
 * - Desktop (lg+): sidebar colapsable a la izquierda, contenido a la derecha.
 * - Mobile: ClientMobileHeader sticky en la columna principal + drawer overlay.
 */
export default function DashboardClienteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen bg-background flex overflow-hidden">
      <Toaster position="top-right" richColors />
      {/* Desktop sidebar — oculto en móvil */}
      <ClientSidebar />
      {/* Columna principal */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Mobile top bar + drawer — oculto en desktop */}
        <ClientMobileHeader />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}
