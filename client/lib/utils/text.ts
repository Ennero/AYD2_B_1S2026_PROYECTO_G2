const MOJIBAKE_PATTERN = /Ã.|Â.|â..|�/

function mojibakeScore(value: string): number {
  const matches = value.match(/Ã.|Â.|â..|�/g)
  return matches ? matches.length : 0
}

/**
 * Repara texto UTF-8 mal interpretado como Latin-1 en respuestas externas.
 * Si el texto no parece corrupto, se devuelve sin cambios.
 */
export function normalizeUtf8Text(value: string): string {
  if (!value || !MOJIBAKE_PATTERN.test(value)) {
    return value
  }

  try {
    const bytes = Uint8Array.from(value, (char) => char.charCodeAt(0) & 0xff)
    const decoded = new TextDecoder("utf-8", { fatal: false }).decode(bytes)
    return mojibakeScore(decoded) < mojibakeScore(value) ? decoded : value
  } catch {
    return value
  }
}
