/** Aquí implementar Dashboard del Agente Logístico — Bienvenida
 *
 * Pantalla: ¡Bienvenido [Nombre]!
 * Wireframes: Wireframe-21 (Agente Logístico - primer cuadro)
 *
 * Contenido:
 * - WelcomeCard con saludo personalizado
 * - Tarjetas resumen: Órdenes Pendientes (count), Rutas Disponibles (count)
 * - Botón: "Ir a Órdenes de Servicio"
 *
 * Componentes sugeridos: WelcomeCard, Card, Button
 * Rutas sugeridas: GET /api/v1/ordenes, GET /api/v1/rutas
 */

export default function AgenteLogisticoPage() {
  return (
    <div>
      <h1>Bienvenido — Agente Logístico</h1>
      <p className="text-text-muted mt-2">Implementar dashboard con resumen de órdenes y rutas</p>
    </div>
  )
}
