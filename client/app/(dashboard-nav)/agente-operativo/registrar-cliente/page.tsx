/** Aquí implementar formulario de Registrar Cliente Nuevo
 *
 * Pantalla: Registrar Cliente Nuevo
 * Wireframes: Wireframe-21 (segundo y tercer cuadro)
 *
 * Secciones del formulario:
 * 1. Datos Generales — nombre, teléfono
 * 2. Datos Fiscales — razón social, dirección, NIT
 * 3. Perfil de Riesgo — capacidad de pago, seguro de aseguradora,
 *    medición de antigüedad, lavado de dinero
 *
 * Componentes sugeridos: Input, Select, Button, Card
 * Ruta sugerida: POST /api/v1/clientes
 *
 * Al completar exitosamente → redirigir a /agente-operativo/cliente-registrado
 */

export default function RegistrarClientePage() {
  return (
    <div>
      <h1>Registrar Cliente Nuevo</h1>
      <p className="text-text-muted mt-2">Implementar formulario de registro de cliente con 3 secciones</p>
    </div>
  )
}
