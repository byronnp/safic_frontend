/**
 * Cédula y RUC de Ecuador. Mismas reglas que el backend
 * (App\Core\Validation\Rules\CedulaEc y RucEc); la API valida de todas formas.
 */

function provinciaValida(codigo: number): boolean {
  return (codigo >= 1 && codigo <= 24) || codigo === 30;
}

/** 10 dígitos, provincia 01–24 o 30, tercer dígito < 6 y verificador módulo 10. */
export function cedulaValida(cedula: string): boolean {
  if (!/^\d{10}$/.test(cedula)) {
    return false;
  }
  const d = [...cedula].map(Number);
  if (!provinciaValida(d[0]! * 10 + d[1]!) || d[2]! >= 6) {
    return false;
  }
  let suma = 0;
  for (let i = 0; i < 9; i++) {
    const producto = d[i]! * (i % 2 === 0 ? 2 : 1);
    suma += producto > 9 ? producto - 9 : producto;
  }
  return (10 - (suma % 10)) % 10 === d[9];
}

/**
 * 13 dígitos, provincia válida y establecimiento distinto de 000. Persona natural:
 * los 10 primeros son una cédula; sociedades (6 o 9): solo estructura, porque el SRI
 * emite RUC que ya no cumplen el dígito verificador.
 */
export function rucValido(ruc: string): boolean {
  if (!/^\d{13}$/.test(ruc) || ruc.endsWith('000')) {
    return false;
  }
  if (!provinciaValida(Number(ruc.slice(0, 2)))) {
    return false;
  }
  const tercero = Number(ruc[2]);
  if (tercero < 6) {
    return cedulaValida(ruc.slice(0, 10));
  }
  return tercero === 6 || tercero === 9;
}
