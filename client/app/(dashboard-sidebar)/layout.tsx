import { Toaster } from "sonner"
import Sidebar from "@/components/layout/Sidebar"

/**
 * Layout para roles con Sidebar lateral.
 * Encargado de Patio, Certificador FEL.
 */
export default function DashboardSidebarLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex">
      <Toaster position="top-right" richColors />
      <Sidebar />
      <main className="flex-1 p-8">
        {children}
      </main>
    </div>
  )
}
