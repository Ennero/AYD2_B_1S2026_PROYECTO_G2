import { baseTemplate } from './base.template';

export interface ContractProposalTemplateData {
  clientName: string;
  contractCode: string;
  routes: string[];
  validUntil: string;
  totalAmount: string;
  currency: string;
  portalUrl: string;
  agentName: string;
}

/**
 * HU-04 / HU-05 — Notificación de propuesta de contrato digital.
 * Se envía al cliente cuando el Agente Operativo crea la propuesta
 * para que éste la acepte o rechace desde el portal.
 */
export function contractProposalTemplate(
  data: ContractProposalTemplateData,
): { subject: string; html: string; text: string } {
  const subject = `LogiTrans — Propuesta de Contrato ${data.contractCode}`;

  const routesHtml = data.routes
    .map((r) => `<li style="margin:4px 0;">${r}</li>`)
    .join('');

  const html = baseTemplate(
    `
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

    <p>Puede revisar los términos completos y tomar una decisión desde el portal:</p>

    <p style="text-align:center;">
      <a class="btn" href="${data.portalUrl}">Revisar y responder contrato</a>
    </p>

    <hr class="divider" />

    <p style="font-size:13px; color:#888888;">
      Si tiene dudas sobre esta propuesta, comuníquese con su agente asignado o
      escríbanos a <a href="mailto:contratos@logitrans.com">contratos@logitrans.com</a>.
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

Revise y responda en: ${data.portalUrl}
  `.trim();

  return { subject, html, text };
}
