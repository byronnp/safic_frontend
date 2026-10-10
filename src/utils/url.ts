/**
 * Enlace que se puede abrir o mostrar: solo https (y http en el equipo local para desarrollo).
 * Un `javascript:` o `data:` que llegara por error no se usa nunca como href ni como src.
 */
export function urlSegura(valor: string | null | undefined): string | null {
  if (!valor) return null;
  try {
    const url = new URL(valor, window.location.origin);
    const local = ['localhost', '127.0.0.1'].includes(url.hostname);
    return url.protocol === 'https:' || (url.protocol === 'http:' && local) ? url.toString() : null;
  } catch {
    return null;
  }
}
