import { redirect } from "next/navigation"

/**
 * Página raíz — redirige al login.
 * Si el usuario ya está autenticado, la lógica de redirección
 * por rol se maneja en useAuth después de verificar el token.
 */
export default function RootPage() {
  redirect("/login")
}
