import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  conectar,
  configDesdeEntorno,
  desconectar,
  estadoTiempoReal,
  intervaloConRespaldo,
  RUTA_WS,
  type ClientePusher,
  type ConfigTiempoReal,
  type OpcionesConexion,
} from '../tiempo-real';

const config: ConfigTiempoReal = { clave: 'k', host: 'localhost', puerto: 9000, seguro: false };

/** Cliente falso: guarda quién escucha qué para poder disparar eventos a mano. */
function crearFalso() {
  const conexion = new Map<string, () => void>();
  const canales = new Map<string, (dato: unknown) => void>();
  const cliente: ClientePusher = {
    connection: { bind: (evento, fn) => void conexion.set(evento, fn) },
    subscribe: (canal) => ({
      bind: (_evento: string, fn: (dato: unknown) => void) => {
        canales.set(canal, fn);
        return undefined as never;
      },
    }),
    disconnect: vi.fn(),
  };
  return { cliente, conexion, canales };
}

function opciones(extra: Partial<OpcionesConexion> = {}): OpcionesConexion {
  return {
    condominioId: 3,
    usuarioId: 8,
    escuchaGarita: false,
    alAviso: vi.fn(),
    alRecuperar: vi.fn(),
    ...extra,
  };
}

afterEach(() => {
  desconectar();
});

describe('tiempo real', () => {
  it('se suscribe solo al canal privado de la cuenta en el condominio activo', () => {
    const falso = crearFalso();
    conectar(config, opciones(), () => falso.cliente);

    expect([...falso.canales.keys()]).toEqual(['private-condominio.3.usuario.8']);
  });

  it('con permiso de garita escucha además el canal de la garita', () => {
    const falso = crearFalso();
    conectar(config, opciones({ escuchaGarita: true }), () => falso.cliente);

    expect([...falso.canales.keys()]).toEqual([
      'private-condominio.3.usuario.8',
      'private-condominio.3.garita',
    ]);
  });

  it('pasa el aviso (recurso e id) y descarta lo que no tiene la forma esperada', () => {
    const falso = crearFalso();
    const o = opciones();
    conectar(config, o, () => falso.cliente);
    const recibir = falso.canales.get('private-condominio.3.usuario.8')!;

    recibir({ recurso: 'paquetes', id: 5 });
    recibir({ recurso: 'accesos' });
    recibir({ otra: 'cosa' });
    recibir('texto');
    recibir(null);

    expect(o.alAviso).toHaveBeenCalledTimes(2);
    expect(o.alAviso).toHaveBeenNthCalledWith(1, { recurso: 'paquetes', id: 5 });
    expect(o.alAviso).toHaveBeenNthCalledWith(2, { recurso: 'accesos', id: null });
  });

  it('refleja el estado de la conexión y avisa al recuperarse tras una caída', () => {
    const falso = crearFalso();
    const o = opciones();
    conectar(config, o, () => falso.cliente);
    expect(estadoTiempoReal.value).toBe('conectando');

    falso.conexion.get('connected')!();
    expect(estadoTiempoReal.value).toBe('conectado');
    expect(o.alRecuperar).not.toHaveBeenCalled();

    falso.conexion.get('unavailable')!();
    expect(estadoTiempoReal.value).toBe('sin-conexion');

    falso.conexion.get('connected')!();
    expect(estadoTiempoReal.value).toBe('conectado');
    expect(o.alRecuperar).toHaveBeenCalledTimes(1);
  });

  it('espacia la consulta periódica solo mientras hay conexión', () => {
    const falso = crearFalso();
    conectar(config, opciones(), () => falso.cliente);
    expect(intervaloConRespaldo(8_000, 120_000)).toBe(8_000);

    falso.conexion.get('connected')!();
    expect(intervaloConRespaldo(8_000, 120_000)).toBe(120_000);

    falso.conexion.get('failed')!();
    expect(intervaloConRespaldo(8_000, 120_000)).toBe(8_000);
  });

  it('desconectar cierra el cliente y apaga el estado; conectar de nuevo cierra el anterior', () => {
    const uno = crearFalso();
    const dos = crearFalso();
    conectar(config, opciones(), () => uno.cliente);
    conectar(config, opciones({ condominioId: 4 }), () => dos.cliente);
    expect(uno.cliente.disconnect).toHaveBeenCalledTimes(1);
    expect([...dos.canales.keys()]).toEqual(['private-condominio.4.usuario.8']);

    desconectar();
    expect(dos.cliente.disconnect).toHaveBeenCalledTimes(1);
    expect(estadoTiempoReal.value).toBe('apagado');
  });

  it('el WebSocket va por /ws, no por /app (que es de las pantallas del residente)', () => {
    const falso = crearFalso();
    let recibidas: Record<string, unknown> = {};
    conectar(config, opciones(), (_config, o) => {
      recibidas = { ...o };
      return falso.cliente;
    });

    expect(recibidas.wsPath).toBe(RUTA_WS);
    expect(RUTA_WS).toBe('/ws');
    expect(RUTA_WS.startsWith('/app')).toBe(false);
  });

  it('sin configuración no abre ninguna conexión', () => {
    const fabrica = vi.fn();
    conectar(null, opciones(), fabrica);

    expect(fabrica).not.toHaveBeenCalled();
    expect(estadoTiempoReal.value).toBe('apagado');
  });

  it('la configuración sale del mismo origen y exige la clave', () => {
    vi.stubGlobal('__REVERB_APP_KEY__', '');
    expect(configDesdeEntorno()).toBeNull();

    vi.stubGlobal('__REVERB_APP_KEY__', 'abc');
    expect(configDesdeEntorno()).toMatchObject({ clave: 'abc', host: window.location.hostname });
    vi.unstubAllGlobals();
  });
});
