import { Toaster } from "sonner"

/**
 * Layout para páginas de autenticación.
 * Centrado verticalmente, sin navbar/sidebar.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Toaster position="top-right" richColors />
      <div className="w-full max-w-md">
        {children}
      </div>
    </div>
  )
}
