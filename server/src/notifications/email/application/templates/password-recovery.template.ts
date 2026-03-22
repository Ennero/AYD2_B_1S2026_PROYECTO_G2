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
    <h2 style="color:#0A3B7C; margin-top:0;">Recuperación de contraseña</h2>

    <p>Hola <strong>${data.clientName}</strong>,</p>
    <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta en el
       <strong>Portal de Clientes LogiTrans</strong>.
    </p>

    <p style="text-align:center; margin:28px 0;">
      <a class="btn" href="${data.recoveryUrl}">Restablecer mi contraseña</a>
    </p>

    <div class="info-box">
      <p style="margin:0 0 6px;">
        <strong>⏱ Enlace válido por ${data.expiresInMinutes} minutos.</strong><br/>
        Por seguridad, este enlace expira una vez utilizado o transcurrido el tiempo indicado.
      </p>
      ${
        data.ipAddress
          ? `<p style="font-size:12px; color:#888; margin:8px 0 0;">Solicitud originada desde: <code>${data.ipAddress}</code></p>`
          : ''
      }
    </div>

    <hr class="divider" />

    <p style="font-size:13px; color:#888888;">
      Si <strong>no solicitaste</strong> este restablecimiento, ignora este mensaje.
      Tu contraseña actual permanece sin cambios.<br/><br/>
      ¿Sospechas de actividad no autorizada? Escríbenos a
      <a href="mailto:soporte@logitrans.gt" style="color:#0A3B7C;">soporte@logitrans.gt</a>.
    </p>
    `,
    subject,
  );

  const text = `
Hola ${data.clientName},

Recibimos una solicitud para restablecer tu contraseña en el Portal de Clientes LogiTrans.

Haz clic en el siguiente enlace para continuar (válido por ${data.expiresInMinutes} minutos):
${data.recoveryUrl}

Si no solicitaste este restablecimiento, ignora este mensaje.
  `.trim();

  return { subject, html, text };
}
