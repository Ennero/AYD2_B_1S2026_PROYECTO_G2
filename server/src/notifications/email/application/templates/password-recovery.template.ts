import { baseTemplate } from './base.template';

export interface PasswordRecoveryTemplateData {
  clientName: string;
  recoveryToken: string;
  /** Minutos de vigencia del token (por RNF: 30 minutos) */
  expiresInMinutes: number;
}

/**
 * HU-03 — Correo de recuperación de contraseña.
 * El token es de un solo uso y expira en 30 minutos (RNF seguridad CDU001).
 */
export function passwordRecoveryTemplate(
  data: PasswordRecoveryTemplateData,
): { subject: string; html: string; text: string } {
  const subject = 'LogiTrans — Recuperación de contraseña';

  const html = baseTemplate(
    `
    <p class="eyebrow">Recuperación Segura</p>
    <h2 style="margin-top:0;">Recuperación de contraseña</h2>

    <p>Hola <strong>${data.clientName}</strong>,</p>
    <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta en el
       <strong>Portal de Clientes LogiTrans</strong>.
    </p>

    <div class="info-box">
      <p><strong>Token de recuperación (válido por ${data.expiresInMinutes} minutos):</strong></p>
      <div class="token-box">${data.recoveryToken}</div>
      <p style="margin-top:10px;">Ingresa este token manualmente dentro de la plataforma.</p>
      <ol class="steps">
        <li>Ingresa al Portal de Clientes LogiTrans.</li>
        <li>Ve a la pantalla de recuperación de contraseña.</li>
        <li>Pega el token y registra tu nueva contraseña.</li>
      </ol>
      <p style="margin-top:8px;">Este correo no contiene enlaces directos por política de seguridad.</p>
    </div>

    <div class="info-box">
      <p style="margin:0 0 6px;">
        <strong>Uso único:</strong> El token expira al primer uso o al cumplir su vigencia.
      </p>
    </div>

    <hr class="divider" />

    <p style="font-size:13px; color:#888888;">
      Si <strong>no solicitaste</strong> este restablecimiento, ignora este mensaje.
      Tu contraseña actual permanece sin cambios.<br/><br/>
      ¿Sospechas de actividad no autorizada? Escríbenos a soporte@logitrans.gt.
    </p>
    `,
    subject,
  );

  const text = `
Hola ${data.clientName},

Recibimos una solicitud para restablecer tu contraseña en el Portal de Clientes LogiTrans.

Token de recuperación (válido por ${data.expiresInMinutes} minutos):
${data.recoveryToken}

Instrucciones:
  1) Ingresa al Portal de Clientes LogiTrans
  2) Abre la sección de recuperación
  3) Ingresa el token y define tu nueva contraseña

Si no solicitaste este restablecimiento, ignora este mensaje.
  `.trim();

  return { subject, html, text };
}
