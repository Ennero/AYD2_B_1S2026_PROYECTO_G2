import { Toaster } from "sonner"
import Sidebar from "@/components/layout/Sidebar"

/**
 * Layout general para roles (ahora todos usan Sidebar).
 * Agente Operativo, Piloto, Agente Logístico.
 */
export default function DashboardNavLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen bg-background flex overflow-hidden">
      <Toaster position="top-right" richColors />
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
