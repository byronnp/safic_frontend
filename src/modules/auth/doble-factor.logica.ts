/** Reglas de los formularios de la verificación en dos pasos (la API vuelve a validar todo). */

const TOTP = /^\d{6}$/;
const RESPALDO = /^[A-Z2-7]{10}$/;

/** Sin espacios ni guion, en mayúscula: lo que se compara con un código de respaldo. */
function limpiar(texto: string): string {
  return texto.replace(/[\s-]/g, '').toUpperCase();
}

/** El código de seis dígitos de la app, sin espacios ("123 456" → "123456"). */
export function codigoDeApp(texto: string): string {
  return texto.replace(/\s/g, '');
}

export function esCodigoDeApp(texto: string): boolean {
  return TOTP.test(codigoDeApp(texto));
}

export function esCodigoDeRespaldo(texto: string): boolean {
  return RESPALDO.test(limpiar(texto));
}

/** Código de la app o de respaldo (login y acciones sensibles). null si el formato es válido. */
export function errorCodigo(texto: string): string | null {
  if (texto.trim() === '') {
    return 'Escribe el código de tu app.';
  }
  return esCodigoDeApp(texto) || esCodigoDeRespaldo(texto)
    ? null
    : 'El código tiene 6 dígitos (o 10 letras y números si es de respaldo).';
}

/** Solo el código de seis dígitos de la app (confirmar la activación). */
export function errorCodigoDeApp(texto: string): string | null {
  if (texto.trim() === '') {
    return 'Escribe el código de tu app.';
  }
  return esCodigoDeApp(texto) ? null : 'El código de tu app tiene 6 dígitos.';
}

export function errorContrasena(texto: string): string | null {
  return texto === '' ? 'Escribe tu contraseña.' : null;
}

/** "ABCDEFGH…" → "ABCD EFGH …" para leerlo y copiarlo a mano. */
export function secretoAgrupado(secreto: string): string {
  return (secreto.match(/.{1,4}/g) ?? []).join(' ');
}

/** Archivo de texto con los códigos de respaldo para guardarlos. */
export function textoCodigosRespaldo(codigos: readonly string[], cuenta: string): string {
  return [
    'SAFIC · Códigos de respaldo de la verificación en dos pasos',
    `Cuenta: ${cuenta}`,
    '',
    'Cada código sirve una sola vez. Guárdalos en un lugar seguro, fuera de tu teléfono.',
    '',
    ...codigos,
    '',
  ].join('\n');
}
