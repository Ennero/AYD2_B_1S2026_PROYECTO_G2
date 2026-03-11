/** Aquí implementar Lista de Órdenes de Servicio
 *
 * Pantalla: Órdenes de Servicios Nuevas
 * Wireframes: Wireframe-21 (Agente Logístico - cuadro inferior)
 *
 * Contenido:
 * - Buscador de órdenes
 * - Filtros: estado (Comienzo Progreso, Finalizado, etc.)
 * - Lista de órdenes como tarjetas: ID, fecha, origen, destino, tipo, peso, estado
 * - Cada orden clickeable → abre /agente-logistico/ordenes/[id]
 *
 * Componentes sugeridos: Input, Select, Card, StatusBadge, Button
 * Ruta sugerida: GET /api/v1/ordenes
 */

export default function OrdenesPage() {
  return (
    <div>
      <h1>Órdenes de Servicio</h1>
      <p className="text-text-muted mt-2">Implementar lista de órdenes con búsqueda y filtros</p>
    </div>
  )
}
