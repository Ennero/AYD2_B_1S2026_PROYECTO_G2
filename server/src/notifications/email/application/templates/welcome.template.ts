import { baseTemplate } from './base.template';

export interface WelcomeTemplateData {
  clientName: string;
  email: string;
  temporaryPassword: string;
  portalUrl: string;
}

/**
 * HU-02 — Correo de bienvenida con credenciales generadas automáticamente.
 * Se envía tras el registro exitoso del cliente por parte del Agente Operativo.
 */
export function welcomeTemplate(data: WelcomeTemplateData): { subject: string; html: string; text: string } {
  const subject = 'Bienvenido a LogiTrans — Sus credenciales de acceso';

  const html = baseTemplate(
    `
    <p class="eyebrow">Alta de Cuenta</p>
    <h2>Bienvenido a LogiTrans, ${data.clientName}</h2>
    <p>Su cuenta fue registrada exitosamente en nuestra plataforma de gestión logística. A continuación encontrará su información de acceso:</p>

    <div class="info-box">
      <p><strong>Correo electrónico:</strong> ${data.email}</p>
      <p><strong>Contraseña temporal:</strong> ${data.temporaryPassword}</p>
    </div>

    <div class="info-box">
      <p><strong>Instrucciones de acceso</strong></p>
      <ol class="steps">
        <li>Abra la plataforma en <code>${data.portalUrl}</code>.</li>
        <li>Inicie sesión con el correo y la contraseña temporal indicados arriba.</li>
        <li>Al entrar, cambie su contraseña para mayor seguridad.</li>
      </ol>
    </div>

    <hr class="divider" />

    <p style="font-size:13px; color:#888888;">
      Si usted no solicitó esta cuenta, ignore este correo o contáctenos en: soporte@logitrans.com.
    </p>
    `,
    subject,
  );

  const text = `
Bienvenido a LogiTrans, ${data.clientName}.

Sus credenciales de acceso:
  Correo electrónico: ${data.email}
  Contraseña temporal: ${data.temporaryPassword}

Instrucciones:
  1) Abra la plataforma en ${data.portalUrl}
  2) Inicie sesión con las credenciales enviadas en este correo
  3) Cambie su contraseña en el primer ingreso

Por seguridad, cambie su contraseña en su primer inicio de sesión.
  `.trim();

  return { subject, html, text };
}
