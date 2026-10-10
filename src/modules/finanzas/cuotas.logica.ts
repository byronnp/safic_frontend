import { z } from 'zod';

import { aCentavos, deCentavos } from '@/utils/dinero';
import { inicioDeMesAtras, sumarDias } from '@/utils/fecha';
import { formatoFechaCorta } from '@/utils/formato';
import { nombreMes } from '@/utils/periodo';

import { NOMBRE_METODO } from './resumen.logica';
import type {
  EstadoCuota,
  FiltroCuotas,
  NuevaCuotaExtraordinaria,
  ResumenCuotas,
} from './services/cuotas.service';
import type { RangoCuenta } from './services/estado-cuenta.service';

export const FILTROS_CUOTAS: { valor: FiltroCuotas; etiqueta: string }[] = [
  { valor: 'todas', etiqueta: 'Todas' },
  { valor: 'pendiente', etiqueta: 'Pendientes' },
  { valor: 'por_aprobar', etiqueta: 'Por aprobar' },
  { valor: 'vencida', etiqueta: 'Vencidas' },
  { valor: 'pagada', etiqueta: 'Pagadas' },
];

export const ESTADO_CUOTA: Record<
  EstadoCuota,
  { texto: string; tono: 'exito' | 'alerta' | 'error' | 'info' }
> = {
  pagada: { texto: 'Pagada', tono: 'exito' },
  pendiente: { texto: 'Pendiente', tono: 'alerta' },
  por_aprobar: { texto: 'Pago por aprobar', tono: 'info' },
  vencida: { texto: 'Vencida', tono: 'error' },
};

const RELACION: Record<string, string> = {
  propietario: 'Propietario',
  inquilino: 'Inquilino',
  residente: 'Residente',
};

export function textoRelacion(relacion: string): string {
  return RELACION[relacion] ?? relacion;
}

export function textoResponsable(r: { nombre: string; relacion: string } | null): string {
  return r === null ? 'Sin responsable' : `${r.nombre} · ${textoRelacion(r.relacion)}`;
}

/** "Generadas el 1 oct · vencen el día 10 · método: valor por tipo de unidad" */
export function subtituloDelMes(resumen: ResumenCuotas): string {
  if (!resumen.emitida) return 'Aún no se emiten las cuotas de este mes.';
  const partes: string[] = [];
  if (resumen.emitido_en)
    partes.push(`Generadas el ${formatoFechaCorta(resumen.emitido_en.slice(0, 10))}`);
  if (resumen.dia_vencimiento !== null) {
    partes.push(
      resumen.dia_vencimiento === 0
        ? 'vencen el último día del mes'
        : `vencen el día ${resumen.dia_vencimiento}`,
    );
  }
  if (resumen.metodo) partes.push(`método: ${NOMBRE_METODO[resumen.metodo]}`);
  return partes.join(' · ');
}

export function textoPorcentaje(porcentaje: number): string {
  return `${porcentaje.toLocaleString('es-EC', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} %`;
}

// ---------- Cuota extraordinaria ----------

export interface FormularioExtraordinaria {
  detalle: string;
  venceEl: string;
  modo: 'por_unidad' | 'alicuota';
  monto: string;
}

export const MODOS_EXTRAORDINARIA: {
  valor: FormularioExtraordinaria['modo'];
  etiqueta: string;
  ayuda: string;
}[] = [
  { valor: 'por_unidad', etiqueta: 'Igual para todas', ayuda: 'Cada unidad paga el mismo monto.' },
  {
    valor: 'alicuota',
    etiqueta: 'Según la alícuota',
    ayuda: 'El monto es el total y se reparte según la alícuota de cada unidad.',
  },
];

export function formularioExtraordinariaVacio(hoy: string): FormularioExtraordinaria {
  return { detalle: '', venceEl: sumarDias(hoy, 15), modo: 'por_unidad', monto: '' };
}

const esquemaExtraordinaria = z.object({
  detalle: z
    .string()
    .trim()
    .min(3, 'Escribe en qué consiste (mínimo 3 letras).')
    .max(80, 'El detalle tiene máximo 80 caracteres.'),
  monto: z
    .string()
    .regex(/^\d{1,8}(\.\d{1,2})?$/, 'Escribe un monto válido (hasta dos decimales).'),
});

export type ErroresExtraordinaria = Partial<
  Record<'detalle' | 'monto' | 'venceEl', string | undefined>
>;

/** Monto escrito → "45.00" (acepta coma), o '' si no es un monto. */
export function normalizarMonto(texto: string): string {
  const limpio = texto.trim().replace(',', '.');
  return /^\d{1,8}(\.\d{1,2})?$/.test(limpio) ? deCentavos(aCentavos(limpio)) : limpio;
}

export function validarExtraordinaria(
  f: FormularioExtraordinaria,
  hoy: string,
): ErroresExtraordinaria {
  const errores: ErroresExtraordinaria = {};
  const monto = normalizarMonto(f.monto);
  const r = esquemaExtraordinaria.safeParse({ detalle: f.detalle, monto });
  if (!r.success) {
    for (const p of r.error.issues) {
      const campo = p.path[0];
      if ((campo === 'detalle' || campo === 'monto') && !errores[campo]) errores[campo] = p.message;
    }
  }
  if (!errores.monto && aCentavos(monto) <= 0) errores.monto = 'El monto debe ser mayor a cero.';
  if (f.venceEl === '') errores.venceEl = 'Elige la fecha de vencimiento.';
  else if (f.venceEl < hoy) errores.venceEl = 'La fecha de vencimiento no puede ser pasada.';
  return errores;
}

export function peticionExtraordinaria(
  f: FormularioExtraordinaria,
  periodo: string,
): NuevaCuotaExtraordinaria {
  return {
    detalle: f.detalle.trim(),
    periodo,
    vence_el: f.venceEl,
    modo: f.modo,
    monto: normalizarMonto(f.monto),
  };
}

// ---------- Estado de cuenta ----------

export type RangoElegido = '3m' | 'anio' | 'todo';

export const RANGOS_CUENTA: { valor: RangoElegido; etiqueta: string }[] = [
  { valor: '3m', etiqueta: 'Últimos 3 meses' },
  { valor: 'anio', etiqueta: 'Este año' },
  { valor: 'todo', etiqueta: 'Todo' },
];

/** Fechas del rango elegido (la API recorta lo que muestra y calcula el saldo inicial). */
export function rangoDeCuenta(rango: RangoElegido, hoy: string): RangoCuenta {
  if (rango === 'todo') return {};
  if (rango === 'anio') return { desde: `${hoy.slice(0, 4)}-01-01`, hasta: hoy };
  return { desde: inicioDeMesAtras(hoy, 2), hasta: hoy };
}

/** "−$ 13,00" se muestra como "A favor $ 13,00" cuando el saldo corriente es negativo. */
export function esSaldoAFavor(saldo: string): boolean {
  return aCentavos(saldo) < 0;
}

export function tituloDelMes(periodo: string): string {
  return `Cuotas de ${nombreMes(periodo).toLowerCase()}`;
}
