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
    <h2>Bienvenido a LogiTrans, ${data.clientName}</h2>
    <p>Su cuenta ha sido registrada exitosamente en nuestra plataforma de gestión logística. A continuación encontrará sus credenciales de acceso:</p>

    <div class="info-box">
      <p><strong>Correo electrónico:</strong> ${data.email}</p>
      <p><strong>Contraseña temporal:</strong> ${data.temporaryPassword}</p>
    </div>

    <p>Por seguridad, le recomendamos cambiar su contraseña en su primer inicio de sesión.</p>

    <p style="text-align:center;">
      <a class="btn" href="${data.portalUrl}">Acceder al portal</a>
    </p>

    <hr class="divider" />

    <p style="font-size:13px; color:#888888;">
      Si usted no solicitó esta cuenta, ignore este correo o contáctenos a
      <a href="mailto:soporte@logitrans.com">soporte@logitrans.com</a>.
    </p>
    `,
    subject,
  );

  const text = `
Bienvenido a LogiTrans, ${data.clientName}.

Sus credenciales de acceso:
  Correo electrónico: ${data.email}
  Contraseña temporal: ${data.temporaryPassword}

Acceda al portal en: ${data.portalUrl}

Por seguridad, cambie su contraseña en su primer inicio de sesión.
  `.trim();

  return { subject, html, text };
}
