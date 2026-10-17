import { aCentavos } from '@/utils/dinero';
import { formatoMoneda } from '@/utils/formato';

import type {
  AreaReservable,
  DiaDisponible,
  EstadoReserva,
  Franja,
  MiReserva,
} from './services/reservas.service';

type Tono = 'exito' | 'alerta' | 'error' | 'info' | 'neutro';

/** Ícono de Material Symbols según el nombre del área (los del mockup F3Areas). */
export function iconoDeArea(nombre: string): string {
  const n = nombre.toLowerCase();
  if (/sal[oó]n|fiesta|eventos/.test(n)) return 'sym_r_celebration';
  if (/bbq|parrill|asador/.test(n)) return 'sym_r_outdoor_grill';
  if (/piscina|pileta/.test(n)) return 'sym_r_pool';
  if (/cancha|tenis|f[uú]tbol|b[aá]squet/.test(n)) return 'sym_r_sports_tennis';
  if (/gimnasio|gym/.test(n)) return 'sym_r_fitness_center';
  return 'sym_r_event_available';
}

export const tieneCosto = (a: Pick<AreaReservable, 'costo'>): boolean => aCentavos(a.costo) > 0;
export const tieneGarantia = (a: Pick<AreaReservable, 'garantia'>): boolean =>
  aCentavos(a.garantia) > 0;

/** «Hasta 60 personas · $ 50,00 + garantía $ 100,00» / «Turnos de 2 horas · Sin costo». */
export function resumenAreaResidente(a: AreaReservable): string {
  const partes: string[] = [];
  if (a.capacidad !== null) partes.push(`Hasta ${a.capacidad} personas`);
  else
    partes.push(
      `Turnos de ${a.duracion_min_horas} ${a.duracion_min_horas === 1 ? 'hora' : 'horas'}`,
    );
  if (!tieneCosto(a)) partes.push('Sin costo');
  else if (tieneGarantia(a))
    partes.push(`${formatoMoneda(a.costo)} + garantía ${formatoMoneda(a.garantia)}`);
  else partes.push(`${formatoMoneda(a.costo)} · sin garantía`);
  return partes.join(' · ');
}

export const textoAprobacion = (a: Pick<AreaReservable, 'requiere_aprobacion'>): string =>
  a.requiere_aprobacion ? 'Requiere aprobación' : 'Confirmación inmediata';

export const textoFranja = (f: Pick<Franja, 'inicio' | 'fin'>): string => `${f.inicio}–${f.fin}`;

const fecha = (iso: string): Date => new Date(`${iso}T12:00:00`);

/** «Sáb 17 oct». */
export function fechaCorta(iso: string): string {
  const d = new Intl.DateTimeFormat('es-EC', { weekday: 'short', day: 'numeric', month: 'short' })
    .format(fecha(iso))
    .replace(/\./g, '')
    .replace(',', '');
  return d.charAt(0).toUpperCase() + d.slice(1);
}

/** Para la tira de días: «VIE» y 2. */
export function diaDeTira(iso: string): { semana: string; numero: number } {
  const semana = new Intl.DateTimeFormat('es-EC', { weekday: 'short' })
    .format(fecha(iso))
    .replace(/\./g, '')
    .toUpperCase();
  return { semana, numero: fecha(iso).getDate() };
}

/** Un día sin ninguna franja libre no se puede elegir. */
export const diaConLugar = (d: DiaDisponible): boolean =>
  d.franjas.some((f) => f.estado === 'libre');

export const ETIQUETA_FRANJA: Record<Franja['estado'], string> = {
  libre: 'Libre',
  ocupada: 'Ocupado',
  cerrada: 'Cerrado',
};

export const debeAlgo = (porPagar: string | undefined): boolean => aCentavos(porPagar ?? '0') > 0;

/** «vie 16 oct, 14:00» a partir de «2026-10-16T14:00». */
export function limiteDePago(iso: string): string {
  const [dia = '', hora = ''] = iso.split('T');
  return `${fechaCorta(dia).toLowerCase()}, ${hora}`;
}

/** Estado que ve el residente: una confirmada que ya pasó es «Finalizada». */
export function estadoDeReserva(
  r: Pick<MiReserva, 'estado' | 'proxima'> & Partial<Pick<MiReserva, 'por_pagar'>>,
): {
  texto: string;
  tono: Tono;
} {
  const mapa: Record<EstadoReserva, { texto: string; tono: Tono }> = {
    pendiente: { texto: 'Pendiente de aprobación', tono: 'alerta' },
    confirmada: { texto: 'Confirmada', tono: 'exito' },
    rechazada: { texto: 'Rechazada', tono: 'error' },
    cancelada: { texto: 'Cancelada', tono: 'neutro' },
    vencida: { texto: 'Vencida', tono: 'neutro' },
  };
  if (r.estado === 'confirmada' && !r.proxima) return { texto: 'Finalizada', tono: 'neutro' };
  if (r.estado === 'confirmada' && debeAlgo(r.por_pagar)) {
    return { texto: 'Confirmada · falta pagar', tono: 'alerta' };
  }
  return mapa[r.estado];
}

/** «Sáb 17 oct · 14:00 – 20:00». */
export const cuando = (r: Pick<MiReserva, 'fecha' | 'inicio' | 'fin'>): string =>
  `${fechaCorta(r.fecha)} · ${r.inicio} – ${r.fin}`;

/** Las próximas y el historial, en el orden en que la API las entrega. */
export function separarReservas(lista: MiReserva[]): {
  proximas: MiReserva[];
  historial: MiReserva[];
} {
  return { proximas: lista.filter((r) => r.proxima), historial: lista.filter((r) => !r.proxima) };
}
