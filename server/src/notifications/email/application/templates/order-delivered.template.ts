import { baseTemplate } from './base.template';

export interface OrderDeliveredTemplateData {
  clientName: string;
  orderNumber: string;
  destination: string;
  deliveredAt: string;
  receiverName: string;
  cargoType?: string;
  totalAmount?: string;
  currency?: string;
}

export function orderDeliveredTemplate(data: OrderDeliveredTemplateData): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = `LogiTrans — Tu orden ${data.orderNumber} fue entregada`;

  const amountSection =
    data.totalAmount && data.currency
      ? `<p><strong>Total de la orden:</strong> ${data.currency} ${data.totalAmount}</p>`
      : '';

  const html = baseTemplate(
    `
    <p class="eyebrow">Entrega confirmada</p>
    <h2>Pedido entregado correctamente</h2>
    <p>Estimado/a <strong>${data.clientName}</strong>,</p>
    <p>Te informamos que la orden <strong>${data.orderNumber}</strong> fue marcada como entregada.</p>

    <div class="info-box">
      <p><strong>Orden:</strong> ${data.orderNumber}</p>
      <p><strong>Destino:</strong> ${data.destination}</p>
      <p><strong>Fecha de entrega:</strong> ${data.deliveredAt}</p>
      <p><strong>Receptor:</strong> ${data.receiverName}</p>
      ${data.cargoType ? `<p><strong>Tipo de carga:</strong> ${data.cargoType}</p>` : ''}
      ${amountSection}
    </div>

    <div class="info-box">
      <p>La evidencia y el detalle de la entrega están disponibles en el portal, en <strong>Órdenes</strong>.</p>
    </div>
    `,
    subject,
  );

  const text = `
Estimado/a ${data.clientName},

La orden ${data.orderNumber} fue entregada correctamente.

Destino: ${data.destination}
Fecha de entrega: ${data.deliveredAt}
Receptor: ${data.receiverName}
${data.cargoType ? `Tipo de carga: ${data.cargoType}` : ''}
${data.totalAmount && data.currency ? `Total de la orden: ${data.currency} ${data.totalAmount}` : ''}

Puedes revisar evidencia y detalle en el portal, módulo Órdenes.
  `.trim();

  return { subject, html, text };
}
