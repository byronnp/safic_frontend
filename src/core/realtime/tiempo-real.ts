import Pusher, { type Channel, type Options } from 'pusher-js';
import { computed, ref } from 'vue';

import { api } from '@/core/api/client';

/**
 * Tiempo real (Reverb, protocolo Pusher). El servidor solo avisa «este recurso cambió» (sin datos de negocio ni personales):
 * al recibir un aviso se vuelve a consultar la API normal, así permisos, condominio y enmascarado siguen decidiendo qué se ve.
 * La conexión es de mejor esfuerzo: si se cae, las consultas periódicas de cada pantalla siguen funcionando.
 *
 * Canales privados (los autoriza el backend con la sesión):
 * - condominio.{id}.usuario.{userId}: lo que le toca a la cuenta.
 * - condominio.{id}.garita: lo que necesita el equipo de garita.
 */

/**
 * Prefijo del WebSocket en el origen de la app. NO puede ser `/app` (el que usa Reverb por defecto): las pantallas del residente
 * viven en `/app/...` y al recargar una de ellas el proxy se la mandaba a Reverb («Internal server error»). El proxy quita el
 * prefijo antes de llegar a Reverb, así que el servidor no cambia.
 */
export const RUTA_WS = '/ws';

/** Evento que publica el backend (`ActualizacionEnVivo::broadcastAs`). */
export const EVENTO = 'actualizacion';

export interface AvisoEnVivo {
  recurso: string;
  id: number | null;
}

export type EstadoTiempoReal = 'apagado' | 'conectando' | 'conectado' | 'sin-conexion';

export interface ConfigTiempoReal {
  clave: string;
  host: string;
  puerto: number;
  seguro: boolean;
}

export interface OpcionesConexion {
  condominioId: number;
  usuarioId: number;
  /** Escucha también el canal de la garita (permiso garita.registrar). */
  escuchaGarita: boolean;
  alAviso: (aviso: AvisoEnVivo) => void;
  /** Se recuperó la conexión tras una caída: pudieron perderse avisos, conviene volver a consultar. */
  alRecuperar: () => void;
}

/** Lo mínimo de pusher-js que usamos (permite probar sin red). */
export interface ClientePusher {
  connection: { bind: (evento: string, fn: (...a: never[]) => void) => void };
  subscribe: (canal: string) => Pick<Channel, 'bind'>;
  disconnect: () => void;
}

export type FabricaCliente = (config: ConfigTiempoReal, opciones: Options) => ClientePusher;

const estado = ref<EstadoTiempoReal>('apagado');

/** Verdadero mientras hay conexión: las pantallas lo usan para espaciar su consulta periódica. */
export const tiempoRealConectado = computed(() => estado.value === 'conectado');
export const estadoTiempoReal = computed(() => estado.value);

/**
 * Intervalo de consulta de una pantalla: el corto si no hay tiempo real y el largo (solo de respaldo) si lo hay.
 * Se evalúa en cada ciclo de la consulta, así que se adapta solo cuando la conexión cae o vuelve.
 */
export function intervaloConRespaldo(sinTiempoReal: number, conTiempoReal: number): number {
  return tiempoRealConectado.value ? conTiempoReal : sinTiempoReal;
}

/**
 * Mismo origen que la app: en desarrollo lo reenvía el proxy de Vite (/ws) y en producción el balanceador o nginx. Sin clave
 * configurada no hay tiempo real (devuelve null) y todo sigue con consulta periódica.
 */
export function configDesdeEntorno(): ConfigTiempoReal | null {
  const clave = typeof __REVERB_APP_KEY__ === 'string' ? __REVERB_APP_KEY__ : '';
  if (!clave) {
    return null;
  }
  const seguro = window.location.protocol === 'https:';
  const puerto = Number(window.location.port) || (seguro ? 443 : 80);

  return { clave, host: window.location.hostname, puerto, seguro };
}

const crearCliente: FabricaCliente = (config, opciones) => new Pusher(config.clave, opciones);

let cliente: ClientePusher | null = null;

/** Opciones de pusher-js: la autorización pasa por el cliente HTTP (token, renovación y errores como en el resto de la app). */
function opcionesPusher(config: ConfigTiempoReal): Options {
  return {
    cluster: 'mt1', // pusher-js lo exige; con wsHost no se usa
    wsHost: config.host,
    wsPath: RUTA_WS,
    wsPort: config.puerto,
    wssPort: config.puerto,
    forceTLS: config.seguro,
    enabledTransports: ['ws', 'wss'],
    disableStats: true,
    channelAuthorization: {
      transport: 'ajax',
      endpoint: '/api/v1/broadcasting/auth',
      customHandler: ({ socketId, channelName }, callback) => {
        api
          .post('/broadcasting/auth', { socket_id: socketId, channel_name: channelName })
          .then((respuesta) => {
            callback(null, respuesta.data as { auth: string });
          })
          .catch((error: Error) => {
            callback(error, null);
          });
      },
    },
  };
}

function esAviso(dato: unknown): dato is AvisoEnVivo {
  return (
    typeof dato === 'object' &&
    dato !== null &&
    typeof (dato as { recurso?: unknown }).recurso === 'string'
  );
}

/** Abre la conexión del condominio activo. Cualquier conexión anterior se cierra primero. */
export function conectar(
  config: ConfigTiempoReal | null,
  opciones: OpcionesConexion,
  fabrica: FabricaCliente = crearCliente,
): void {
  desconectar();
  if (config === null) {
    return;
  }

  estado.value = 'conectando';
  const nuevo = fabrica(config, opcionesPusher(config));
  cliente = nuevo;
  let cayo = false;

  nuevo.connection.bind('connected', () => {
    estado.value = 'conectado';
    if (cayo) {
      cayo = false;
      opciones.alRecuperar();
    }
  });
  const sinConexion = () => {
    cayo = true;
    estado.value = 'sin-conexion';
  };
  nuevo.connection.bind('disconnected', sinConexion);
  nuevo.connection.bind('unavailable', sinConexion);
  nuevo.connection.bind('failed', sinConexion);

  const escuchar = (canal: string) => {
    nuevo.subscribe(`private-${canal}`).bind(EVENTO, (dato: unknown) => {
      if (esAviso(dato)) {
        opciones.alAviso({ recurso: dato.recurso, id: dato.id ?? null });
      }
    });
  };
  escuchar(`condominio.${opciones.condominioId}.usuario.${opciones.usuarioId}`);
  if (opciones.escuchaGarita) {
    escuchar(`condominio.${opciones.condominioId}.garita`);
  }
}

/** Cierra la conexión (cambio de condominio, cierre de sesión). */
export function desconectar(): void {
  cliente?.disconnect();
  cliente = null;
  estado.value = 'apagado';
}
