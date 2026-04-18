import { baseTemplate } from './base.template';

export interface ContractProposalTemplateData {
  clientName: string;
  contractCode: string;
  routes: string[];
  validUntil: string;
  totalAmount: string;
  currency: string;
  agentName: string;
}

/**
 * HU-04 / HU-05 — Notificación de propuesta de contrato digital.
 * Se envía al cliente cuando el Agente Operativo crea la propuesta
 * para que éste la acepte o rechace desde el portal.
 */
export function contractProposalTemplate(data: ContractProposalTemplateData): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = `LogiTrans — Propuesta de Contrato ${data.contractCode}`;

  const routesHtml = data.routes
    .map((r) => `<li style="margin:4px 0;">${r}</li>`)
    .join('');

  const html = baseTemplate(
    `
    <p class="eyebrow">Propuesta Comercial</p>
    <h2>Propuesta de Contrato Digital</h2>
    <p>Estimado/a <strong>${data.clientName}</strong>,</p>
    <p>Le informamos que el agente <strong>${data.agentName}</strong> ha generado una propuesta de contrato para su revisión y aceptación:</p>

    <div class="info-box">
      <p><strong>Código de contrato:</strong> ${data.contractCode}</p>
      <p><strong>Rutas incluidas:</strong></p>
      <ul style="margin:6px 0; padding-left:18px;">${routesHtml}</ul>
      <p><strong>Monto total:</strong> ${data.currency} ${data.totalAmount}</p>
      <p><strong>Válido hasta:</strong> ${data.validUntil}</p>
    </div>

    <div class="info-box">
      <p><strong>Pasos para revisar y responder</strong></p>
      <ol class="steps">
        <li>Ingrese al Portal de Clientes LogiTrans.</li>
        <li>Abra el módulo de contratos y busque el código <code>${data.contractCode}</code>.</li>
        <li>Revise términos y seleccione Aceptar o Rechazar.</li>
      </ol>
      <p style="margin-top:10px;">Este correo no contiene enlaces directos por política de seguridad.</p>
    </div>

    <hr class="divider" />

    <p style="font-size:13px; color:#888888;">
      Si tiene dudas sobre esta propuesta, comuníquese con su agente asignado o
      escríbanos a contratos@logitrans.com.
    </p>
    `,
    subject,
  );

  const text = `
Estimado/a ${data.clientName},

El agente ${data.agentName} ha generado la propuesta de contrato ${data.contractCode}.

Rutas: ${data.routes.join(', ')}
Monto: ${data.currency} ${data.totalAmount}
Válido hasta: ${data.validUntil}

Para revisar y responder:
  1) Ingrese al Portal de Clientes LogiTrans
  2) Abra el módulo de contratos y busque ${data.contractCode}
  3) Seleccione Aceptar o Rechazar
  `.trim();

  return { subject, html, text };
}
