import { z } from 'zod';

import { formatoFecha, formatoMoneda } from '@/utils/formato';
import {
  METODOS_COBRO,
  multiplicarMonto,
  normalizarMonto,
  TIPOS_UNIDAD,
} from '@/modules/plataforma/asistente';
import type { MetodoCobro, TipoUnidad } from '@/modules/unidades/services/unidades.service';

import type {
  CambioCobro,
  CobroCuotas,
  GuardarCobro,
  RegistroHistorialCobro,
} from './services/cobro.service';

export { DIAS_VENCIMIENTO, METODOS_COBRO, TIPOS_UNIDAD } from '@/modules/plataforma/asistente';

/** Lo que se edita en pantalla: los montos como texto, tal como los escribe la persona. */
export interface FormularioCobro {
  metodo: MetodoCobro;
  cuotaGeneral: string;
  presupuesto: string;
  valoresTipo: Record<TipoUnidad, string>;
  diaVencimiento: number;
  /** AAAA-MM */
  aplicaDesde: string;
}

export type CampoCobro =
  'metodo' | 'cuotaGeneral' | 'presupuesto' | 'valoresTipo' | 'diaVencimiento' | 'aplicaDesde';

const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
]; // prettier-ignore

/** "2026-11" → "noviembre 2026" */
export function textoMes(mes: string): string {
  const [anio, numero] = mes.split('-');
  return `${MESES[Number(numero) - 1] ?? mes} ${anio}`;
}

function mayuscula(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/** Año y mes de hoy en la hora de Ecuador (la del condominio): "2026-10". */
export function mesActual(ahora: Date = new Date()): string {
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Guayaquil',
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(ahora);
  const valor = (tipo: string) => partes.find((p) => p.type === tipo)?.value ?? '';
  return `${valor('year')}-${valor('month')}`;
}

function sumarMeses(mes: string, cantidad: number): string {
  const [anio, numero] = mes.split('-').map(Number) as [number, number];
  const total = anio * 12 + (numero - 1) + cantidad;
  return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, '0')}`;
}

/** Los 12 meses desde el siguiente: la API no acepta el mes actual ni más de 12 adelante. */
export function mesesDisponibles(ahora: Date = new Date()): { valor: string; etiqueta: string }[] {
  const actual = mesActual(ahora);
  return Array.from({ length: 12 }, (_, i) => {
    const valor = sumarMeses(actual, i + 1);
    return { valor, etiqueta: mayuscula(textoMes(valor)) };
  });
}

const TIPOS_VACIOS: Record<TipoUnidad, string> = {
  departamento: '',
  casa: '',
  local: '',
  parqueadero: '',
  bodega: '',
};

/** "80.00" → "80,00" (se muestra con coma decimal, como en el mockup). */
function montoAEditable(monto: string | null): string {
  return monto === null ? '' : monto.replace('.', ',');
}

/** Formulario con lo guardado; el mes de aplicación nunca es uno ya pasado. */
export function formularioDesde(cobro: CobroCuotas, ahora: Date = new Date()): FormularioCobro {
  const meses = mesesDisponibles(ahora).map((m) => m.valor);
  const valoresTipo = { ...TIPOS_VACIOS };
  for (const v of cobro.valores_tipo) {
    valoresTipo[v.tipo] = montoAEditable(v.valor);
  }

  return {
    metodo: cobro.metodo,
    cuotaGeneral: montoAEditable(cobro.cuota_general),
    presupuesto: montoAEditable(cobro.presupuesto_mensual),
    valoresTipo,
    diaVencimiento: cobro.dia_vencimiento,
    aplicaDesde:
      cobro.aplica_desde !== null && meses.includes(cobro.aplica_desde)
        ? cobro.aplica_desde
        : meses[0]!,
  };
}

function montoPositivo(texto: string): boolean {
  const monto = normalizarMonto(texto);
  return monto !== null && /[1-9]/.test(monto);
}

const ESQUEMA = z.object({
  cuotaGeneral: z
    .string()
    .refine(montoPositivo, 'Escribe la cuota mensual (mayor a 0, hasta 2 decimales).'),
  presupuesto: z
    .string()
    .refine(montoPositivo, 'Escribe el presupuesto mensual (mayor a 0, hasta 2 decimales).'),
});

/** Errores por campo; vacío si se puede guardar. */
export function validarCobro(f: FormularioCobro): Partial<Record<CampoCobro, string>> {
  const errores: Partial<Record<CampoCobro, string>> = {};

  if (f.metodo === 'general') {
    const r = ESQUEMA.shape.cuotaGeneral.safeParse(f.cuotaGeneral);
    if (!r.success) {
      errores.cuotaGeneral = r.error.issues[0]?.message ?? 'Revisa la cuota.';
    }
  }
  if (f.metodo === 'alicuota') {
    const r = ESQUEMA.shape.presupuesto.safeParse(f.presupuesto);
    if (!r.success) {
      errores.presupuesto = r.error.issues[0]?.message ?? 'Revisa el presupuesto.';
    }
  }
  if (f.metodo === 'tipo') {
    const escritos = TIPOS_UNIDAD.filter((t) => f.valoresTipo[t.valor].trim() !== '');
    const invalidos = escritos.some((t) => !montoPositivo(f.valoresTipo[t.valor]));
    if (escritos.length === 0 || invalidos) {
      errores.valoresTipo =
        'Escribe el valor de al menos un tipo (mayor a 0, hasta 2 decimales); deja vacíos los que no cobras.';
    }
  }

  return errores;
}

/** Cuerpo de PUT /cobro: solo viaja lo que el método usa. */
export function aPeticionCobro(f: FormularioCobro): GuardarCobro {
  return {
    metodo: f.metodo,
    cuota_general: f.metodo === 'general' ? normalizarMonto(f.cuotaGeneral) : null,
    presupuesto_mensual: f.metodo === 'alicuota' ? normalizarMonto(f.presupuesto) : null,
    valores_tipo:
      f.metodo === 'tipo'
        ? TIPOS_UNIDAD.filter((t) => f.valoresTipo[t.valor].trim() !== '').map((t) => ({
            tipo: t.valor,
            valor: normalizarMonto(f.valoresTipo[t.valor])!,
          }))
        : null,
    dia_vencimiento: f.diaVencimiento,
    aplica_desde: f.aplicaDesde,
  };
}

/** Campos de la API → campo del formulario (para pintar los errores 422). */
export const CAMPOS_API_COBRO: Record<string, CampoCobro> = {
  metodo: 'metodo',
  cuota_general: 'cuotaGeneral',
  presupuesto_mensual: 'presupuesto',
  valores_tipo: 'valoresTipo',
  dia_vencimiento: 'diaVencimiento',
  aplica_desde: 'aplicaDesde',
};

/** ¿El formulario es igual a lo guardado? (activa o no "Guardar cambios" y "Descartar"). */
export function esIgualACobro(f: FormularioCobro, base: FormularioCobro): boolean {
  return (
    JSON.stringify(aPeticionCobroParaComparar(f)) ===
    JSON.stringify(aPeticionCobroParaComparar(base))
  );
}

function aPeticionCobroParaComparar(f: FormularioCobro): unknown {
  const t =
    f.metodo === 'tipo'
      ? TIPOS_UNIDAD.map((x) => normalizarMonto(f.valoresTipo[x.valor]) ?? '')
      : [];
  return [
    f.metodo,
    f.metodo === 'general' ? (normalizarMonto(f.cuotaGeneral) ?? f.cuotaGeneral.trim()) : '',
    f.metodo === 'alicuota' ? (normalizarMonto(f.presupuesto) ?? f.presupuesto.trim()) : '',
    t,
    f.diaVencimiento,
    f.aplicaDesde,
  ];
}

/** Unidades sin el dato que pide el método elegido (la API no deja guardar así). */
export function avisoDatosFaltantes(f: FormularioCobro, cobro: CobroCuotas): string | null {
  if (f.metodo === 'alicuota' && cobro.unidades.sin_alicuota > 0) {
    return `${cobro.unidades.sin_alicuota} unidades no tienen alícuota. Complétalas en Unidades antes de cobrar por alícuota.`;
  }
  if (f.metodo === 'unidad' && cobro.unidades.sin_cuota_mensual > 0) {
    return `${cobro.unidades.sin_cuota_mensual} unidades no tienen cuota. Complétalas en Unidades o con el Excel antes de cobrar por unidad.`;
  }
  return null;
}

// ---------- Proyección de la próxima emisión ----------

export interface Proyeccion {
  total: string;
  detalle: string;
  cuotaUnidad: string;
  metodo: string;
}

function sumarMontos(montos: (string | null)[]): string | null {
  if (montos.some((m) => m === null)) {
    return null;
  }
  const centavos = montos.reduce((acumulado, m) => {
    const [entero, dec = '00'] = m!.split('.');
    return acumulado + BigInt(entero!) * 100n + BigInt(dec.padEnd(2, '0').slice(0, 2));
  }, 0n);
  return `${centavos / 100n}.${String(centavos % 100n).padStart(2, '0')}`;
}

const PLURAL_TIPO: Record<TipoUnidad, [string, string]> = {
  departamento: ['departamento', 'departamentos'],
  casa: ['casa', 'casas'],
  local: ['local', 'locales'],
  parqueadero: ['parqueadero', 'parqueaderos'],
  bodega: ['bodega', 'bodegas'],
};

function cuentaTipos(porTipo: Record<TipoUnidad, number>): string {
  const partes = TIPOS_UNIDAD.filter((t) => porTipo[t.valor] > 0).map(
    (t) => `${porTipo[t.valor]} ${PLURAL_TIPO[t.valor][porTipo[t.valor] === 1 ? 0 : 1]}`,
  );
  return partes.length > 1
    ? `${partes.slice(0, -1).join(', ')} y ${partes.at(-1)}`
    : (partes[0] ?? 'Sin unidades');
}

/** Lo que verá el administrador a la derecha: total del mes según el formulario y las unidades actuales. */
export function proyeccionCobro(f: FormularioCobro, u: CobroCuotas['unidades']): Proyeccion {
  const metodo = METODOS_COBRO.find((m) => m.valor === f.metodo)?.nombre ?? '';
  const dinero = (m: string | null) => (m === null ? '—' : formatoMoneda(m));
  const totalUnidades = Object.values(u.por_tipo).reduce((a, b) => a + b, 0);

  switch (f.metodo) {
    case 'general': {
      const cuota = normalizarMonto(f.cuotaGeneral);
      return {
        metodo,
        total: dinero(multiplicarMonto(u.con_cupo, cuota)),
        detalle: `${u.con_cupo} unidades × ${dinero(cuota)}`,
        cuotaUnidad: dinero(cuota),
      };
    }
    case 'tipo': {
      const valores = TIPOS_UNIDAD.map((t) => ({
        tipo: t.valor,
        valor: normalizarMonto(f.valoresTipo[t.valor]),
      }));
      const conUnidades = valores.filter((v) => v.valor !== null && u.por_tipo[v.tipo] > 0);
      const total = sumarMontos(
        conUnidades.map((v) => multiplicarMonto(u.por_tipo[v.tipo], v.valor)),
      );
      const ordenados = conUnidades.map((v) => v.valor!).sort((a, b) => Number(a) - Number(b));
      const rango =
        ordenados.length === 0
          ? '—'
          : ordenados[0] === ordenados.at(-1)
            ? dinero(ordenados[0]!)
            : `${dinero(ordenados[0]!)} a ${dinero(ordenados.at(-1)!)}`;
      return { metodo, total: dinero(total), detalle: cuentaTipos(u.por_tipo), cuotaUnidad: rango };
    }
    case 'alicuota':
      return {
        metodo,
        total: dinero(normalizarMonto(f.presupuesto)),
        detalle: 'Presupuesto repartido por alícuota',
        cuotaUnidad: 'Según su %',
      };
    case 'unidad':
      return {
        metodo,
        total: dinero(u.suma_cuotas),
        detalle: `Suma de las cuotas de ${totalUnidades} unidades`,
        cuotaUnidad: 'Según cada unidad',
      };
  }
}

/** "10 nov 2026": fecha de vencimiento de la primera cuota con el cambio (0 = último día del mes). */
export function textoVencimiento(dia: number, mes: string): string {
  const [anio, numero] = mes.split('-').map(Number) as [number, number];
  const ultimo = new Date(anio, numero, 0).getDate();
  const diaReal = dia === 0 ? ultimo : dia;
  return formatoFecha(
    `${anio}-${String(numero).padStart(2, '0')}-${String(diaReal).padStart(2, '0')}`,
  );
}

// ---------- Historial ----------

function textoDia(valor: string | null): string {
  return valor === '0' ? 'último día' : `día ${valor ?? '—'}`;
}

function nombreMetodo(valor: string | null): string {
  return METODOS_COBRO.find((m) => m.valor === valor)?.nombre ?? valor ?? '—';
}

/** "Valor general: $ 75,00 → $ 80,00" */
export function textoCambio(cambio: CambioCobro): string {
  const monto = (m: string | null) => (m === null ? '—' : formatoMoneda(m));
  const flecha = (a: string, d: string) => `${a} → ${d}`;

  if (cambio.campo.startsWith('valor_tipo:')) {
    const tipo = cambio.campo.slice('valor_tipo:'.length) as TipoUnidad;
    const nombre = TIPOS_UNIDAD.find((t) => t.valor === tipo)?.etiqueta ?? tipo;
    return `Valor ${nombre}: ${cambio.antes === null ? monto(cambio.despues) : cambio.despues === null ? 'quitado' : flecha(monto(cambio.antes), monto(cambio.despues))}`;
  }

  switch (cambio.campo) {
    case 'metodo':
      return `Método: ${flecha(nombreMetodo(cambio.antes), nombreMetodo(cambio.despues))}`;
    case 'cuota_general':
      return `Valor general: ${flecha(monto(cambio.antes), monto(cambio.despues))}`;
    case 'presupuesto_mensual':
      return `Presupuesto mensual: ${flecha(monto(cambio.antes), monto(cambio.despues))}`;
    case 'dia_vencimiento':
      return `Vencimiento: ${flecha(textoDia(cambio.antes), textoDia(cambio.despues))}`;
    case 'aplica_desde':
      return `Aplica desde ${cambio.despues ? textoMes(cambio.despues) : '—'}`;
    default:
      return cambio.campo;
  }
}

/** Una línea por registro: la configuración inicial o los cambios separados por punto y coma. */
export function textoRegistro(registro: RegistroHistorialCobro): string {
  if (registro.inicial) {
    const cambio = (campo: string) =>
      registro.cambios.find((c) => c.campo === campo)?.despues ?? null;
    const metodo = cambio('metodo');
    const valor = cambio('cuota_general') ?? cambio('presupuesto_mensual');
    return `Configuración inicial: ${nombreMetodo(metodo).toLowerCase()}${valor ? ` ${formatoMoneda(valor)}` : ''}`;
  }
  return registro.cambios.map(textoCambio).join(' · ');
}

/** Fecha del registro en la hora de Ecuador: "15 sep 2026". */
export function fechaRegistro(iso: string): string {
  const dia = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Guayaquil',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(iso));
  return formatoFecha(dia);
}
