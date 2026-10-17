import { z } from 'zod';

import { sumarDias } from '@/utils/fecha';

import type {
  AutorizadoPor,
  DentroGarita,
  EsperadaGarita,
  FiltrosBitacora,
  IngresoSinQr,
  TipoAcceso,
} from './services/garita.service';

export const TIPOS_ACCESO: { id: TipoAcceso; etiqueta: string; singular: string }[] = [
  { id: 'visita', etiqueta: 'Visitas', singular: 'Visita' },
  { id: 'proveedor', etiqueta: 'Proveedores', singular: 'Proveedor' },
  { id: 'delivery', etiqueta: 'Delivery', singular: 'Delivery' },
];

export const singularDeTipo = (t: TipoAcceso): string =>
  TIPOS_ACCESO.find((x) => x.id === t)?.singular ?? t;

/** «QR», «Llamada», «App · residente», «Administración». */
export const ETIQUETA_AUTORIZO: Record<AutorizadoPor, string> = {
  qr: 'QR',
  llamada: 'Llamada',
  app_residente: 'App · residente',
  administracion: 'Administración',
};

/** «A-201 · visita · desde 13:40» / «Torre B · proveedor · desde 11:20». */
export function detalleDentro(d: DentroGarita): string {
  const partes = [d.unidad ?? d.destino ?? 'Sin destino', singularDeTipo(d.tipo).toLowerCase()];
  if (d.placa) partes.push(d.placa);
  partes.push(`desde ${d.desde}`);
  return partes.join(' · ');
}

/** «A-102 · 15:00–20:00 · PDQ-3321». */
export function detalleEsperada(e: EsperadaGarita): string {
  return [e.unidad ?? 'Sin unidad', `${e.hora_desde}–${e.hora_hasta}`, e.placa]
    .filter(Boolean)
    .join(' · ');
}

export interface FormularioSinQr {
  tipo: TipoAcceso;
  nombre: string;
  cedula: string;
  placa: string;
  unidad: string;
  destino: string;
  autorizadoPor: Exclude<AutorizadoPor, 'qr' | 'app_residente'>;
}

export type ErroresSinQr = Partial<
  Record<'nombre' | 'cedula' | 'placa' | 'unidad' | 'destino', string | undefined>
>;

export const sinQrVacio = (): FormularioSinQr => ({
  tipo: 'visita',
  nombre: '',
  cedula: '',
  placa: '',
  unidad: '',
  destino: '',
  autorizadoPor: 'llamada',
});

const esquema = z.object({
  nombre: z.string().trim().min(3, 'Escribe el nombre.').max(120, 'Máximo 120 letras.'),
  cedula: z.union([
    z.literal(''),
    z.string().regex(/^[A-Za-z0-9]{5,20}$/, 'La cédula o el documento no es válido.'),
  ]),
  placa: z.union([
    z.literal(''),
    z.string().regex(/^[A-Za-z]{2,3}-?\d{3,4}$/, 'La placa no es válida (ej. PDQ-3321).'),
  ]),
});

export function validarSinQr(f: FormularioSinQr): ErroresSinQr {
  const errores: ErroresSinQr = {};
  const r = esquema.safeParse({ nombre: f.nombre, cedula: f.cedula.trim(), placa: f.placa.trim() });
  if (!r.success) {
    for (const p of r.error.issues) {
      const campo = p.path[0] as 'nombre' | 'cedula' | 'placa';
      if (!errores[campo]) errores[campo] = p.message;
    }
  }
  const unidad = f.unidad.trim();
  const destino = f.destino.trim();
  if (f.tipo === 'visita' && unidad === '') errores.unidad = 'Indica a qué unidad va la visita.';
  else if (f.tipo !== 'visita' && unidad === '' && destino === '') {
    errores.destino = 'Indica a dónde va (unidad o lugar).';
  }
  return errores;
}

export function peticionSinQr(f: FormularioSinQr): IngresoSinQr {
  const vacio = (t: string): string | null => (t.trim() === '' ? null : t.trim());
  return {
    tipo: f.tipo,
    nombre: f.nombre.trim(),
    documento: vacio(f.cedula),
    placa: vacio(f.placa)?.toUpperCase() ?? null,
    unidad_codigo: vacio(f.unidad),
    destino: vacio(f.destino),
    autorizado_por: f.autorizadoPor,
  };
}

/** Hora «13:40» de un instante ISO, en la hora local del condominio (el servidor ya la manda con su zona). */
export function horaDe(iso: string | null): string {
  return iso === null ? '—' : iso.slice(11, 16);
}

/** «Hoy», «Ayer» o «12 oct» para la columna de entrada. */
export function diaDe(iso: string, hoy: string): string {
  const dia = iso.slice(0, 10);
  if (dia === hoy) return 'Hoy';
  if (dia === sumarDias(hoy, -1)) return 'Ayer';
  const [, m = '1', d = '1'] = dia.split('-');
  const meses = [
    'ene',
    'feb',
    'mar',
    'abr',
    'may',
    'jun',
    'jul',
    'ago',
    'sep',
    'oct',
    'nov',
    'dic',
  ];
  return `${Number(d)} ${meses[Number(m) - 1] ?? ''}`;
}

export type RangoBitacora = 'hoy' | '7dias';

export function filtrosPorRango(
  rango: RangoBitacora,
  hoy: string,
  tipo: TipoAcceso | null,
  q: string,
): FiltrosBitacora {
  return { desde: rango === 'hoy' ? hoy : sumarDias(hoy, -6), hasta: hoy, tipo, q };
}
