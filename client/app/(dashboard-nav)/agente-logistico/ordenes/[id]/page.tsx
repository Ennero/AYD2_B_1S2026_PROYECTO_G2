/** Aquí implementar Detalle de la Orden de Servicio
 *
 * Pantalla: Detalles de la Orden
 * Wireframes: Wireframe-21 (cuadro central "Detalles de la orden")
 *
 * Contenido:
 * - ID de la orden, fecha, origen, destino
 * - Peso, tipo de carga
 * - INFORMACIÓN CLIENTE: nombre, teléfono, email
 * - Dirección del cliente
 * - Botones: "Asignar Piloto y Vehículo" (abre modal/formulario)
 *
 * Componentes sugeridos: Card, Button, Modal, Select
 * Rutas sugeridas:
 *   GET /api/v1/ordenes/{id}
 *   POST /api/v1/ordenes/{id}/asignar-ruta
 */

import type { PageProps } from "@/types"

export default function OrdenDetallePage({ params }: PageProps<{ id: string }>) {
  return (
    <div>
      <h1>Detalle de la Orden</h1>
      <p className="text-text-muted mt-2">Implementar vista detallada con asignación de piloto y vehículo</p>
    </div>
  )
}
