import { useQueryClient } from '@tanstack/vue-query';
import { computed, readonly, ref, watch } from 'vue';

import { aApiError } from '@/core/api/errors';
import { borrarLocal, guardarLocal, leerLocal } from '@/core/offline/almacen';
import { useSessionStore } from '@/stores/session';

import {
  aplicarResultado,
  cantidadPendiente,
  colaVacia,
  conSalida,
  copiaVigente,
  type ColaLocal,
  type ResumenSincronizacion,
} from '../offline.logica';
import { garitaService, type CopiaQr } from '../services/garita.service';

/**
 * Garita sin conexión: la copia de los QR de hoy y mañana y los ingresos/salidas hechos sin red, guardados en el dispositivo
 * (IndexedDB) por usuario y condominio. El estado es uno solo para toda la app; los timers corren mientras haya una pantalla usándolo.
 */
const COPIA_CADA_MS = 10 * 60_000;
const SINCRONIZAR_CADA_MS = 30_000;

const copia = ref<CopiaQr | null>(null);
const cola = ref<ColaLocal>(colaVacia());
const enLinea = ref(typeof navigator === 'undefined' ? true : navigator.onLine);
const sincronizando = ref(false);
const resumen = ref<ResumenSincronizacion | null>(null);
const errorCopia = ref<string | null>(null);
const alcance = ref<string | null>(null);
const errorSincronizacion = ref<string | null>(null);
/** La carga inicial del almacén: nada se registra antes de que termine. */
let cargado: Promise<void> = Promise.resolve();

let usos = 0;
let temporizadores: ReturnType<typeof setInterval>[] = [];

const claveCopia = (a: string): string => `${a}:copia`;
const claveCola = (a: string): string => `${a}:cola`;

function cargarAlcance(nuevo: string | null): Promise<void> {
  cargado = cargarAlcanceAsync(nuevo);
  return cargado;
}

async function cargarAlcanceAsync(nuevo: string | null): Promise<void> {
  alcance.value = nuevo;
  copia.value = null;
  cola.value = colaVacia();
  resumen.value = null;
  errorCopia.value = null;
  if (nuevo === null) return;
  const [c, q] = await Promise.all([
    leerLocal<CopiaQr>(claveCopia(nuevo)),
    leerLocal<ColaLocal>(claveCola(nuevo)),
  ]);
  // Si mientras tanto cambió el alcance, no se pisa con datos de otro
  if (alcance.value !== nuevo) return;
  copia.value = copiaVigente(c, Date.now());
  cola.value = q ? { ingresos: q.ingresos ?? [], salidas: q.salidas ?? [] } : colaVacia();
}

async function guardarCola(): Promise<boolean> {
  const a = alcance.value;
  if (a === null) return false;
  if (cantidadPendiente(cola.value) === 0) {
    await borrarLocal(claveCola(a));
    return true;
  }
  return guardarLocal(claveCola(a), cola.value);
}

/**
 * Cambia la cola y la guarda de inmediato: lo que el guardia registró no se puede perder si se cierra la pestaña.
 * Devuelve false si no pudo guardarse en el dispositivo (queda solo en memoria).
 */
async function cambiarCola(nueva: ColaLocal): Promise<boolean> {
  await cargado;
  cola.value = nueva;
  return guardarCola();
}

async function actualizarCopia(): Promise<void> {
  const a = alcance.value;
  if (a === null || !navigator.onLine) return;
  try {
    const nueva = await garitaService.copiaQr();
    if (alcance.value !== a) return;
    copia.value = nueva;
    errorCopia.value = null;
    await guardarLocal(claveCopia(a), nueva);
  } catch (error) {
    // Sin copia nueva se sigue con la anterior
    errorCopia.value = aApiError(error).mensaje;
  }
}

async function sincronizar(): Promise<void> {
  const a = alcance.value;
  if (a === null || sincronizando.value || !navigator.onLine || cantidadPendiente(cola.value) === 0)
    return;
  sincronizando.value = true;
  // Lo que se envía es una foto de la cola: lo que el guardia registre mientras tanto se queda para la siguiente vuelta
  const enviada = cola.value;
  try {
    const respuesta = await garitaService.sincronizar(enviada.ingresos, enviada.salidas);
    if (alcance.value !== a) return;
    const { cola: restante, resumen: r } = aplicarResultado(enviada, respuesta);
    // Un ingreso al que se le registró la salida mientras viajaba el envío se queda para la siguiente vuelta
    const cambiados = cola.value.ingresos.filter((i) =>
      enviada.ingresos.some((e) => e.uuid === i.uuid && e.salida_en !== i.salida_en),
    );
    const nuevos: ColaLocal = {
      ingresos: [
        ...restante.ingresos.filter((i) => !cambiados.some((c) => c.uuid === i.uuid)),
        ...cambiados,
        ...cola.value.ingresos.filter((i) => !enviada.ingresos.some((e) => e.uuid === i.uuid)),
      ],
      salidas: [
        ...restante.salidas,
        ...cola.value.salidas.filter(
          (s) => !enviada.salidas.some((e) => e.acceso_id === s.acceso_id),
        ),
      ],
    };
    await cambiarCola(nuevos);
    resumen.value = r;
    errorSincronizacion.value = null;
  } catch (error) {
    // Sin red o error del servidor: todo sigue en la cola para el próximo intento. Un error 4xx no se arregla solo: se avisa.
    const e = aApiError(error);
    errorSincronizacion.value = e.estado >= 400 && e.estado < 500 ? e.mensaje : null;
  } finally {
    sincronizando.value = false;
  }
}

/** Para saber si un error de red justifica seguir sin conexión. */
export const sinRed = (error: unknown): boolean =>
  !navigator.onLine || aApiError(error).estado === 0;

export function useGaritaOffline() {
  const session = useSessionStore();
  const queryClient = useQueryClient();

  const alcanceActual = computed(() =>
    session.condominioId !== null && session.usuario
      ? `garita:${session.usuario.id}:${session.condominioId}`
      : null,
  );

  const alEstarEnLinea = (): void => {
    enLinea.value = true;
    void sincronizar().then(() => actualizarCopia());
  };
  const alPerderLinea = (): void => {
    enLinea.value = false;
  };

  if (usos === 0 || alcance.value !== alcanceActual.value) void cargarAlcance(alcanceActual.value);

  watch(alcanceActual, (nuevo) => {
    if (nuevo !== alcance.value) void cargarAlcance(nuevo).then(() => actualizarCopia());
  });

  // Se monta y se desmonta con la pantalla que lo usa
  usos += 1;
  if (usos === 1) {
    window.addEventListener('online', alEstarEnLinea);
    window.addEventListener('offline', alPerderLinea);
    temporizadores = [
      setInterval(() => void actualizarCopia(), COPIA_CADA_MS),
      setInterval(
        () =>
          void sincronizar().then(() => queryClient.invalidateQueries({ queryKey: ['garita'] })),
        SINCRONIZAR_CADA_MS,
      ),
    ];
    void actualizarCopia();
  }

  function liberar(): void {
    usos -= 1;
    if (usos > 0) return;
    window.removeEventListener('online', alEstarEnLinea);
    window.removeEventListener('offline', alPerderLinea);
    temporizadores.forEach(clearInterval);
    temporizadores = [];
  }

  return {
    copia: computed(() => copia.value),
    cola: computed(() => cola.value),
    enLinea: readonly(enLinea),
    sincronizando: readonly(sincronizando),
    resumen,
    errorCopia: readonly(errorCopia),
    errorSincronizacion: readonly(errorSincronizacion),
    pendientes: computed(() => cantidadPendiente(cola.value)),
    liberar,
    actualizarCopia,
    sincronizar: async () => {
      await sincronizar();
      await queryClient.invalidateQueries({ queryKey: ['garita'] });
    },
    /** Agrega un ingreso a la cola (ya armado con `ingresoConQrLocal` / `ingresoLibreLocal`). */
    registrarIngreso: (i: ColaLocal['ingresos'][number]) =>
      cambiarCola({ ...cola.value, ingresos: [...cola.value.ingresos, i] }),
    registrarSalida: (quien: { uuid: string } | { accesoId: number }) =>
      cambiarCola(conSalida(cola.value, quien, Date.now())),
    cerrarResumen: () => (resumen.value = null),
  };
}
