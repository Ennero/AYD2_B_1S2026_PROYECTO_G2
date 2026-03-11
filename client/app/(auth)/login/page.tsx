/** Aquí implementar formulario de Login
 *
 * Pantalla: Login con campos de email y contraseña
 * Wireframes: Frame 12, 13, Wireframe-18
 *
 * Componentes sugeridos: Logo, Input, Button
 * Hook: useAuth().login(email, password)
 * Ruta sugerida: POST /api/v1/auth/login
 *
 * Después de login exitoso, redirigir según rol
 * (la lógica ya está en useAuth)
 */

export default function LoginPage() {
  return (
    <div className="text-center py-12">
      <h1>Login</h1>
      <p className="text-text-muted mt-2">Implementar formulario de inicio de sesión</p>
    </div>
  )
}
