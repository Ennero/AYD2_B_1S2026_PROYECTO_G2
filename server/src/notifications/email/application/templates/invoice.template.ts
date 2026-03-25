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

  const pdfInstruction = data.pdfUrl
    ? `<p>La factura PDF ya está disponible en tu cuenta del portal para su descarga.</p>`
    : `<p>La factura quedará disponible en tu cuenta del portal para su consulta.</p>`;

  const html = baseTemplate(
    `
    <p class="eyebrow">Facturación FEL</p>
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

    <div class="info-box">
      ${pdfInstruction}
      <p><strong>Instrucciones:</strong></p>
      <ol class="steps">
        <li>Ingresa al Portal de Clientes LogiTrans.</li>
        <li>Abre el módulo de facturación o estado de cuenta.</li>
        <li>Localiza la factura ${data.invoiceNumber} para descargar PDF o gestionar el pago.</li>
      </ol>
      <p style="margin-top:8px;">Este correo no contiene enlaces directos por política de seguridad.</p>
    </div>

    <hr class="divider" />

    <p style="font-size:13px; color:#888888;">
      Para consultas sobre esta factura, comuníquese con el área financiera en
      facturacion@logitrans.com.
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

Instrucciones:
  1) Ingrese al Portal de Clientes LogiTrans
  2) Abra facturación/estado de cuenta
  3) Busque la factura ${data.invoiceNumber} para descargar PDF y gestionar el pago
  `.trim();

  return { subject, html, text };
}
