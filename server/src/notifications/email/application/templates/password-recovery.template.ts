import { baseTemplate } from './base.template';

export interface PasswordRecoveryTemplateData {
  clientName: string;
  recoveryUrl: string;
  /** Minutos de vigencia del enlace (por RNF: 30 minutos) */
  expiresInMinutes: number;
  ipAddress?: string;
}

/**
 * HU-03 — Correo de recuperación de contraseña.
 * El enlace es de un solo uso y expira en 30 minutos (RNF seguridad CDU001).
 */
export function passwordRecoveryTemplate(
  data: PasswordRecoveryTemplateData,
): { subject: string; html: string; text: string } {
  const subject = 'LogiTrans — Recuperación de contraseña';

  const html = baseTemplate(
    `
    <h2>Solicitud de recuperación de contraseña</h2>
    <p>Hola <strong>${data.clientName}</strong>,</p>
    <p>Recibimos una solicitud para restablecer la contraseña asociada a su cuenta de LogiTrans.</p>

    <p style="text-align:center;">
      <a class="btn" href="${data.recoveryUrl}">Restablecer contraseña</a>
    </p>

    <div class="info-box">
      <p><strong>Este enlace es válido por ${data.expiresInMinutes} minutos</strong> y expirará tras su primer uso.</p>
      ${data.ipAddress ? `<p style="font-size:12px; color:#888;">Solicitud originada desde: ${data.ipAddress}</p>` : ''}
    </div>

    <hr class="divider" />

    <p style="font-size:13px; color:#888888;">
      Si usted no solicitó este restablecimiento, ignore este correo. Su contraseña actual permanece sin cambios.
      Si sospecha de actividad no autorizada, contáctenos en <a href="mailto:soporte@logitrans.com">soporte@logitrans.com</a>.
    </p>
    `,
    subject,
  );

  const text = `
Hola ${data.clientName},

Recibimos una solicitud para restablecer su contraseña de LogiTrans.

Haga clic en el siguiente enlace para continuar (válido por ${data.expiresInMinutes} minutos):
${data.recoveryUrl}

Si usted no solicitó este restablecimiento, ignore este correo.
  `.trim();

  return { subject, html, text };
}
