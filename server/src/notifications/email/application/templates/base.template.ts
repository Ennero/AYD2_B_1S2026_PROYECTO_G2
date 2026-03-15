/**
 * Layout base HTML para todos los correos de LogiTrans.
 * Encapsula el wrapper visual (header, footer, colores corporativos)
 * de modo que cada template sólo aporte el contenido central.
 */
export function baseTemplate(content: string, title: string): string {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #f4f6f9; font-family: 'Segoe UI', Arial, sans-serif; }
    .wrapper { max-width: 600px; margin: 32px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,.12); }
    .header  { background: #1a3a5c; padding: 24px 32px; text-align: center; }
    .header img { height: 40px; }
    .header h1 { color: #ffffff; font-size: 20px; margin: 8px 0 0; letter-spacing: .5px; }
    .body    { padding: 32px; color: #333333; font-size: 15px; line-height: 1.6; }
    .body h2 { color: #1a3a5c; font-size: 18px; margin-top: 0; }
    .body p  { margin: 12px 0; }
    .btn     { display: inline-block; margin: 20px 0; padding: 12px 28px; background: #1a3a5c; color: #ffffff !important; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 15px; }
    .info-box { background: #f0f4fa; border-left: 4px solid #1a3a5c; padding: 14px 18px; border-radius: 4px; margin: 18px 0; }
    .info-box p { margin: 4px 0; font-size: 14px; }
    .divider  { border: none; border-top: 1px solid #e8ecf0; margin: 24px 0; }
    .footer   { background: #f0f4fa; padding: 18px 32px; text-align: center; font-size: 12px; color: #888888; }
    .footer a { color: #1a3a5c; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>LogiTrans</h1>
    </div>
    <div class="body">
      ${content}
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} LogiTrans. Todos los derechos reservados.</p>
      <p>Este es un correo automático, por favor no lo responda directamente.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}
