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
    body { margin: 0; padding: 0; background-color: #f4f2ed; font-family: 'Segoe UI', Arial, sans-serif; }
    .wrapper { max-width: 620px; margin: 28px auto; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 10px; overflow: hidden; box-shadow: 0 8px 24px rgba(0,0,0,.08); }
    .header  { background: #0c0c0a; padding: 18px 28px; border-bottom: 2px solid #c9924b; }
    .header h1 { color: #f5f2ec; font-size: 18px; margin: 0; letter-spacing: .18em; text-transform: uppercase; font-weight: 800; }
    .body    { padding: 28px; color: #242424; font-size: 14px; line-height: 1.65; }
    .body h2 { color: #0c0c0a; font-size: 28px; line-height: 1.05; letter-spacing: -.03em; margin: 0 0 12px; }
    .body p  { margin: 10px 0; }
    .eyebrow { font-size: 11px; letter-spacing: .28em; text-transform: uppercase; color: #c9924b; font-weight: 700; margin: 0 0 8px; }
    .info-box { background: #fbfaf7; border: 1px solid #ece6db; border-left: 4px solid #c9924b; padding: 14px 16px; border-radius: 6px; margin: 16px 0; }
    .info-box p { margin: 4px 0; font-size: 13px; }
    .steps { margin: 10px 0 0; padding-left: 18px; }
    .steps li { margin: 5px 0; }
    code { background: #f1ede6; padding: 2px 5px; border-radius: 4px; font-family: 'Consolas', monospace; font-size: 12px; }
    .token-box { font-family: 'Consolas', monospace; background: #f1ede6; border: 1px dashed #c9924b; border-radius: 6px; padding: 12px; text-align: center; letter-spacing: 1px; font-size: 14px; font-weight: 700; word-break: break-all; margin-top: 10px; }
    .divider  { border: none; border-top: 1px solid #e8ecf0; margin: 24px 0; }
    .footer   { background: #faf8f4; padding: 16px 24px; text-align: center; font-size: 12px; color: #777; border-top: 1px solid #ece6db; }
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
