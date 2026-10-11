import { aCentavos, deCentavos } from '@/utils/dinero';
import { formatoMoneda } from '@/utils/formato';

import type { Cuadre, LineaBanco, TipoManual } from './services/conciliacion.service';

export type Pestana = 'automaticos' | 'sugeridos' | 'sin_identificar';

export const PESTANAS: { clave: Pestana; etiqueta: string }[] = [
  { clave: 'automaticos', etiqueta: 'Automáticos' },
  { clave: 'sugeridos', etiqueta: 'Sugeridos' },
  { clave: 'sin_identificar', etiqueta: 'Sin identificar' },
];

export const TIPOS_MANUALES: { valor: TipoManual; etiqueta: string }[] = [
  { valor: 'comision', etiqueta: 'Comisión bancaria' },
  { valor: 'interes', etiqueta: 'Interés ganado' },
  { valor: 'otro', etiqueta: 'Otro movimiento' },
];

const NOMBRE_TIPO: Record<string, string> = {
  pago_residente: 'Pago de residente',
  pago_proveedor: 'Pago a proveedor',
  interes: 'Interés',
  comision: 'Comisión bancaria',
  otro: 'Otro movimiento',
};

export function nombreTipo(tipo: string | null): string {
  return tipo === null ? '—' : (NOMBRE_TIPO[tipo] ?? tipo);
}

/** "− $ 3.450,00" para un débito y "$ 80,00" para un crédito. */
export function montoConSigno(monto: string): string {
  return formatoMoneda(monto);
}

export function esCredito(l: Pick<LineaBanco, 'monto'>): boolean {
  return aCentavos(l.monto) > 0;
}

/** Texto de lo que se hará con una línea sugerida, según el tipo de propuesta. */
export function accionDeSugerida(
  l: LineaBanco,
): { etiqueta: string; tipo: 'vincular' | 'clasificar' } | null {
  if (l.propuesta === null) return null;
  if (l.propuesta.tipo === 'pago_residente' || l.propuesta.tipo === 'pago_proveedor') {
    return l.propuesta.id === null ? null : { etiqueta: 'Vincular', tipo: 'vincular' };
  }
  // Solo se confirma lo que la API sabe clasificar (comisión, interés, otro)
  return TIPOS_MANUALES.some((t) => t.valor === l.propuesta?.tipo)
    ? { etiqueta: 'Confirmar', tipo: 'clasificar' }
    : null;
}

/** Cuánto falta para cuadrar, con su aviso. */
export function notaDiferencia(c: Cuadre): { tono: 'exito' | 'error' | 'info'; texto: string } {
  if (c.diferencia === null) {
    return {
      tono: 'info',
      texto: 'El archivo no trae saldos: indícalos al importar para poder cuadrar.',
    };
  }
  if (aCentavos(c.diferencia) === 0) return { tono: 'exito', texto: 'Cuadra con el banco.' };
  return {
    tono: 'error',
    texto: 'Identifica las líneas pendientes o registra un ajuste con motivo.',
  };
}

export function textoArchivoCuadra(c: Cuadre): string {
  if (c.archivo_cuadra === null) return 'Sin saldos en el archivo';
  return c.archivo_cuadra ? 'El archivo cuadra' : 'El archivo no cuadra: revisa que esté completo';
}

// ---------- Formularios ----------

export interface FormularioImportar {
  cuentaBancariaId: number | null;
  periodo: string;
  saldoInicial: string;
  saldoFinal: string;
}

export type ErroresImportar = Partial<
  Record<'cuentaBancariaId' | 'archivo' | 'saldoInicial' | 'saldoFinal', string | undefined>
>;

export function validarImportar(f: FormularioImportar, archivo: File | null): ErroresImportar {
  const e: ErroresImportar = {};
  if (f.cuentaBancariaId === null) e.cuentaBancariaId = 'Elige la cuenta del banco.';
  if (archivo === null) e.archivo = 'Elige el estado de cuenta (Excel o CSV).';
  else if (!/\.(xlsx|csv)$/i.test(archivo.name))
    e.archivo = 'El archivo debe ser Excel (.xlsx) o CSV.';
  else if (archivo.size > 5 * 1024 * 1024) e.archivo = 'El archivo pesa más de 5 MB.';
  for (const [campo, valor] of [
    ['saldoInicial', f.saldoInicial],
    ['saldoFinal', f.saldoFinal],
  ] as const) {
    if (valor.trim() !== '' && !/^-?\d{1,8}(\.\d{1,2})?$/.test(normalizarSaldo(valor))) {
      e[campo] = 'Escribe un saldo válido (hasta dos decimales).';
    }
  }
  return e;
}

/** "1.234,50", "1234.5" o "-12,5" → "1234.50", "1234.50", "-12.50"; el texto sin cambios si no es un saldo. */
export function normalizarSaldo(texto: string): string {
  const t = texto.trim().replace(/\s|\$/g, '');
  const negativo = t.startsWith('-');
  const sinSigno = negativo ? t.slice(1) : t;
  // Con coma decimal (es-EC) los puntos son de miles; sin coma, el punto es decimal
  const conPunto = sinSigno.includes(',')
    ? sinSigno.replace(/\./g, '').replace(',', '.')
    : sinSigno;
  const m = /^(\d{1,8})(?:\.(\d{1,2}))?$/.exec(conPunto);
  if (!m) return texto.trim();
  return `${negativo ? '-' : ''}${m[1]}.${(m[2] ?? '').padEnd(2, '0')}`;
}

export function validarAjuste(monto: string, motivo: string): { monto?: string; motivo?: string } {
  const e: { monto?: string; motivo?: string } = {};
  const m = normalizarSaldo(monto);
  if (!/^-?\d{1,8}(\.\d{1,2})?$/.test(m))
    e.monto = 'Escribe un monto válido (hasta dos decimales).';
  else if (aCentavos(m) === 0) e.monto = 'El ajuste no puede ser cero.';
  if (motivo.trim().length < 3) e.motivo = 'Escribe el motivo del ajuste.';
  return e;
}

/** El ajuste que cierra la diferencia: lo que falta para llegar al saldo del banco. */
export function ajusteSugerido(c: Cuadre): string {
  return c.diferencia === null ? '' : deCentavos(aCentavos(c.diferencia));
}
