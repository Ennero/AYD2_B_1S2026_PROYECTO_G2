import { baseTemplate } from './base.template';

export interface InvoiceTemplateData {
  clientName: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  orderCode: string;
  subtotal: string;
  taxes: string;
  total: string;
  currency: string;
  pdfUrl?: string;
  portalUrl: string;
  felAuthorizationCode?: string;
}

/**
 * HU-13 — Notificación de factura electrónica FEL emitida.
 * Se envía al cliente cuando el Agente Financiero emite la factura
 * con certificación ante la SAT (DTE).
 */
export function invoiceTemplate(
  data: InvoiceTemplateData,
): { subject: string; html: string; text: string } {
  const subject = `LogiTrans — Factura ${data.invoiceNumber} emitida`;

  const felSection = data.felAuthorizationCode
    ? `<p><strong>No. autorización SAT (FEL):</strong> ${data.felAuthorizationCode}</p>`
    : '';

  const pdfButton = data.pdfUrl
    ? `<p style="text-align:center;"><a class="btn" href="${data.pdfUrl}" target="_blank">Descargar factura PDF</a></p>`
    : '';

  const html = baseTemplate(
    `
    <h2>Factura Electrónica Emitida</h2>
    <p>Estimado/a <strong>${data.clientName}</strong>,</p>
    <p>Le informamos que se ha emitido la siguiente factura electrónica (FEL) correspondiente a sus servicios de transporte:</p>

    <div class="info-box">
      <p><strong>No. Factura:</strong> ${data.invoiceNumber}</p>
      <p><strong>Orden de servicio:</strong> ${data.orderCode}</p>
      <p><strong>Fecha de emisión:</strong> ${data.issueDate}</p>
      <p><strong>Fecha de vencimiento:</strong> ${data.dueDate}</p>
      ${felSection}
    </div>

    <div class="info-box">
      <p><strong>Subtotal:</strong> ${data.currency} ${data.subtotal}</p>
      <p><strong>Impuestos (IVA):</strong> ${data.currency} ${data.taxes}</p>
      <p style="font-size:16px;"><strong>Total a pagar: ${data.currency} ${data.total}</strong></p>
    </div>

    ${pdfButton}

    <p>También puede gestionar sus pagos y consultar su estado de cuenta desde el portal:</p>
    <p style="text-align:center;">
      <a class="btn" href="${data.portalUrl}">Ver estado de cuenta</a>
    </p>

    <hr class="divider" />

    <p style="font-size:13px; color:#888888;">
      Para consultas sobre esta factura, comuníquese con el área financiera en
      <a href="mailto:facturacion@logitrans.com">facturacion@logitrans.com</a>.
    </p>
    `,
    subject,
  );

  const text = `
Estimado/a ${data.clientName},

Se ha emitido la factura ${data.invoiceNumber} por los servicios de transporte (Orden ${data.orderCode}).

Emisión:    ${data.issueDate}
Vencimiento: ${data.dueDate}
Total:       ${data.currency} ${data.total}
${data.felAuthorizationCode ? `No. SAT FEL: ${data.felAuthorizationCode}` : ''}

Gestione su pago en: ${data.portalUrl}
  `.trim();

  return { subject, html, text };
}
