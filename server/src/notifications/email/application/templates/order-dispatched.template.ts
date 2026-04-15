import { baseTemplate } from './base.template';

export interface OrderDispatchedTemplateData {
  clientName: string;
  orderNumber: string;
  origin: string;
  destination: string;
  dispatchedAt: string;
  cargoType?: string;
  unitPlate?: string;
}

export function orderDispatchedTemplate(
  data: OrderDispatchedTemplateData,
): { subject: string; html: string; text: string } {
  const subject = `LogiTrans — Tu orden ${data.orderNumber} salió del patio`;

  const html = baseTemplate(
    `
    <p class="eyebrow">Seguimiento de orden</p>
    <h2>Tu pedido salió del patio</h2>
    <p>Estimado/a <strong>${data.clientName}</strong>,</p>
    <p>Te confirmamos que la orden <strong>${data.orderNumber}</strong> ya fue despachada y se encuentra en ruta.</p>

    <div class="info-box">
      <p><strong>Orden:</strong> ${data.orderNumber}</p>
      <p><strong>Origen:</strong> ${data.origin}</p>
      <p><strong>Destino:</strong> ${data.destination}</p>
      <p><strong>Salida del patio:</strong> ${data.dispatchedAt}</p>
      ${data.cargoType ? `<p><strong>Tipo de carga:</strong> ${data.cargoType}</p>` : ''}
      ${data.unitPlate ? `<p><strong>Unidad:</strong> ${data.unitPlate}</p>` : ''}
    </div>

    <div class="info-box">
      <p>Puedes revisar el tracking actualizado desde el portal de clientes en el módulo <strong>Órdenes</strong>.</p>
    </div>
    `,
    subject,
  );

  const text = `
Estimado/a ${data.clientName},

La orden ${data.orderNumber} salió del patio y ya va en ruta.

Origen: ${data.origin}
Destino: ${data.destination}
Salida del patio: ${data.dispatchedAt}
${data.cargoType ? `Tipo de carga: ${data.cargoType}` : ''}
${data.unitPlate ? `Unidad: ${data.unitPlate}` : ''}

Puedes revisar el tracking en el portal de clientes.
  `.trim();

  return { subject, html, text };
}
