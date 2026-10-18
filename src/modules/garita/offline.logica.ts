import type {
  CopiaQr,
  IngresoPendiente,
  QrDeCopia,
  ResultadoSincronizacion,
  SalidaPendiente,
  TipoAcceso,
  ValidacionQr,
} from './services/garita.service';

/**
 * Garita sin conexión. Todo lo de este archivo es lógica pura (sin red ni almacenamiento): decidir si un QR de la copia local sirve ahora,
 * armar los ingresos pendientes y entender la respuesta del servidor. Las reglas son las mismas que valida el servidor
 * (`ValidadorDeVisita`): si cambian allá, cambian aquí.
 */
export interface ColaLocal {
  ingresos: IngresoPendiente[];
  salidas: SalidaPendiente[];
}

export const colaVacia = (): ColaLocal => ({ ingresos: [], salidas: [] });

export const cantidadPendiente = (c: ColaLocal): number => c.ingresos.length + c.salidas.length;

/** Fecha, hora y día de la semana (1 = lunes … 7 = domingo) de un instante en la zona del condominio. */
export function enZona(ms: number, zona: string): { fecha: string; hora: string; dia: number } {
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: zona,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    weekday: 'short',
  }).formatToParts(new Date(ms));
  const p = (tipo: string): string => partes.find((x) => x.type === tipo)?.value ?? '';
  const dias: Record<string, number> = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 };
  return {
    fecha: `${p('year')}-${p('month')}-${p('day')}`,
    hora: `${p('hour')}:${p('minute')}`,
    dia: dias[p('weekday')] ?? 1,
  };
}

const MENSAJES: Record<string, string> = {
  QR_YA_USADO: 'Este QR de un solo ingreso ya se usó.',
  QR_VENCIDO: 'Este QR ya venció.',
  QR_AUN_NO_VIGENTE: 'Este QR todavía no es válido: empieza otro día.',
  QR_DIA_NO_HABILITADO: 'Este QR no vale para el día de hoy.',
  QR_FUERA_DE_HORARIO: 'Este QR no vale a esta hora.',
  QR_YA_DENTRO: 'Esta persona ya está dentro. Registra su salida primero.',
};

export const NO_EN_COPIA = 'QR_NO_EN_COPIA';
export const MENSAJE_NO_EN_COPIA =
  'Este QR no está en la copia del teléfono (pudo crearse después). Confirma con el residente y usa «Ingreso sin QR».';

/** ¿Está esa persona dentro según lo que tiene el teléfono? (la copia y los ingresos hechos sin conexión) */
function estaDentro(qr: QrDeCopia, cola: ColaLocal): boolean {
  const locales = cola.ingresos.filter((i) => i.token === qr.token);
  if (locales.length === 0) return qr.ya_dentro;
  // El último movimiento local manda
  return locales[locales.length - 1]?.salida_en === null;
}

/** Valida un QR con la copia local. null = no está en la copia. No sabe de revocaciones posteriores a la copia. */
export function validarLocal(
  token: string,
  copia: CopiaQr | null,
  cola: ColaLocal,
  ahoraMs: number,
): ValidacionQr | null {
  const qr = copia?.qrs.find((q) => q.token === token);
  if (!copia || !qr) return null;

  const { fecha, hora, dia } = enZona(ahoraMs, copia.zona);
  let motivo: string | null = null;
  if (qr.tipo === 'unica' && cola.ingresos.some((i) => i.token === token)) motivo = 'QR_YA_USADO';
  else if (qr.fecha_hasta < fecha) motivo = 'QR_VENCIDO';
  else if (qr.fecha_desde > fecha) motivo = 'QR_AUN_NO_VIGENTE';
  else if (qr.tipo === 'recurrente' && !(qr.dias_semana ?? []).includes(dia))
    motivo = 'QR_DIA_NO_HABILITADO';
  else if (hora < qr.hora_desde || hora > qr.hora_hasta) motivo = 'QR_FUERA_DE_HORARIO';
  else if (estaDentro(qr, cola)) motivo = 'QR_YA_DENTRO';

  return {
    valido: motivo === null,
    motivo,
    mensaje: motivo === null ? null : (MENSAJES[motivo] ?? 'QR no válido.'),
    visita: {
      visitante: qr.visitante,
      placa: qr.placa,
      unidad: qr.unidad,
      autorizo: qr.autorizo,
      tipo: qr.tipo,
      fecha_desde: qr.fecha_desde,
      fecha_hasta: qr.fecha_hasta,
      hora_desde: qr.hora_desde,
      hora_hasta: qr.hora_hasta,
      dias_semana: qr.dias_semana,
    },
  };
}

/** Identificador para que reenviar un ingreso no lo duplique. */
export function nuevoUuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function')
    return crypto.randomUUID();
  // Respaldo para navegadores sin crypto.randomUUID (contexto no seguro): un UUID v4 con números al azar
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.floor(Math.random() * 16);
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

/** Un ingreso con QR hecho sin conexión. */
export function ingresoConQrLocal(qr: QrDeCopia, ahoraMs: number): IngresoPendiente {
  return {
    uuid: nuevoUuid(),
    token: qr.token,
    tipo: 'visita',
    nombre: qr.visitante,
    documento: null,
    placa: qr.placa,
    unidad_codigo: qr.unidad,
    destino: null,
    autorizado_por: 'qr',
    entrada_en: new Date(ahoraMs).toISOString(),
    salida_en: null,
  };
}

/** Un ingreso sin QR (llamada, proveedor, delivery) hecho sin conexión. */
export function ingresoLibreLocal(
  d: {
    tipo: TipoAcceso;
    nombre: string;
    documento: string | null;
    placa: string | null;
    unidad_codigo: string | null;
    destino: string | null;
    autorizado_por: 'llamada' | 'administracion';
  },
  ahoraMs: number,
): IngresoPendiente {
  return {
    uuid: nuevoUuid(),
    token: null,
    ...d,
    entrada_en: new Date(ahoraMs).toISOString(),
    salida_en: null,
  };
}

/** Registra la salida de un ingreso hecho sin conexión (por su uuid) o de uno que ya estaba en el servidor (por su id). */
export function conSalida(
  cola: ColaLocal,
  quien: { uuid: string } | { accesoId: number },
  ahoraMs: number,
): ColaLocal {
  const salida = new Date(ahoraMs).toISOString();
  if ('uuid' in quien) {
    return {
      ...cola,
      ingresos: cola.ingresos.map((i) =>
        i.uuid === quien.uuid && i.salida_en === null ? { ...i, salida_en: salida } : i,
      ),
    };
  }
  if (cola.salidas.some((s) => s.acceso_id === quien.accesoId)) return cola;
  return { ...cola, salidas: [...cola.salidas, { acceso_id: quien.accesoId, salida_en: salida }] };
}

/** Los ingresos hechos sin conexión que siguen dentro (para mostrarlos en «Dentro ahora»). */
export const dentroLocal = (cola: ColaLocal): IngresoPendiente[] =>
  cola.ingresos.filter((i) => i.salida_en === null);

export interface ResumenSincronizacion {
  enviados: number;
  conflictos: { nombre: string; motivo: string }[];
  rechazados: { nombre: string; motivo: string }[];
}

/**
 * Qué queda en la cola después de enviar y qué le decimos al guardia. Todo lo que el servidor respondió (ok, duplicado, conflicto o
 * rechazado) sale de la cola: el conflicto ya quedó guardado con su nota y lo rechazado no se puede arreglar reenviándolo.
 */
export function aplicarResultado(
  cola: ColaLocal,
  r: ResultadoSincronizacion,
): { cola: ColaLocal; resumen: ResumenSincronizacion } {
  const resueltos = new Set(r.ingresos.map((x) => x.uuid));
  const nombres = new Map(cola.ingresos.map((i) => [i.uuid, i.nombre]));
  const resumen: ResumenSincronizacion = {
    enviados: r.ingresos.length + r.salidas.length,
    conflictos: [],
    rechazados: [],
  };

  for (const x of r.ingresos) {
    if (x.resultado === 'conflicto')
      resumen.conflictos.push({ nombre: nombres.get(x.uuid) ?? 'Ingreso', motivo: x.motivo ?? '' });
    if (x.resultado === 'rechazado')
      resumen.rechazados.push({ nombre: nombres.get(x.uuid) ?? 'Ingreso', motivo: x.motivo ?? '' });
  }
  for (const x of r.salidas) {
    if (x.resultado === 'rechazado')
      resumen.rechazados.push({ nombre: `Salida #${x.acceso_id}`, motivo: x.motivo ?? '' });
  }

  const salidasResueltas = new Set(r.salidas.map((x) => x.acceso_id));
  return {
    cola: {
      ingresos: cola.ingresos.filter((i) => !resueltos.has(i.uuid)),
      salidas: cola.salidas.filter((s) => !salidasResueltas.has(s.acceso_id)),
    },
    resumen,
  };
}

/** Los QR que ya no sirven pasado un día se descartan de la copia al cargarla (por si el teléfono guardó una vieja). */
export function copiaVigente(copia: CopiaQr | null, ahoraMs: number): CopiaQr | null {
  if (!copia) return null;
  const hoy = enZona(ahoraMs, copia.zona).fecha;
  return { ...copia, qrs: copia.qrs.filter((q) => q.fecha_hasta >= hoy) };
}

/** «Copia de hoy 09:40» a partir de cuándo se generó. */
export function textoCopia(copia: CopiaQr | null): string {
  if (!copia) return 'Sin copia local';
  return `Copia de ${copia.generado_en.slice(11, 16)}`;
}
