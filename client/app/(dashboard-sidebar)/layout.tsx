import { Toaster } from "sonner"
import Sidebar from "@/components/layout/Sidebar"

/**
 * Layout para roles con Sidebar lateral.
 * Encargado de Patio, Certificador FEL.
 */
export default function DashboardSidebarLayout({ children }: { children: React.ReactNode }) {
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
