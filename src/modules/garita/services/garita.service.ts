import { api } from '@/core/api/client';
import { pedirArchivo } from '@/core/api/descarga';
import type { ApiRespuesta } from '@/core/api/types';

/** Tipos del contrato (safic_backend/docs/openapi.yaml · Garita). */
export type TipoAcceso = 'visita' | 'proveedor' | 'delivery';
export type AutorizadoPor = 'qr' | 'llamada' | 'app_residente' | 'administracion';

export interface DentroGarita {
  id: number;
  nombre: string;
  tipo: TipoAcceso;
  unidad: string | null;
  destino: string | null;
  placa: string | null;
  /** «13:40» */
  desde: string;
}

export interface EsperadaGarita {
  id: number;
  nombre: string;
  unidad: string | null;
  placa: string | null;
  hora_desde: string;
  hora_hasta: string;
}

/** Una pregunta del guardia al residente («¿lo dejo pasar?»). */
export interface SolicitudGarita {
  id: number;
  nombre: string;
  tipo: TipoAcceso;
  unidad: string | null;
  placa: string | null;
  estado: 'pendiente' | 'permitida' | 'rechazada' | 'vencida';
  segundos_restantes: number;
  /** El residente la permitió y aún está vigente: se puede registrar el ingreso. */
  puede_ingresar: boolean;
}

export interface PanelGarita {
  dentro: DentroGarita[];
  esperadas: EsperadaGarita[];
  solicitudes: SolicitudGarita[];
}

export interface PedidoDePermiso {
  unidad_codigo: string;
  nombre: string;
  tipo: TipoAcceso;
  placa: string | null;
}

export interface ValidacionQr {
  valido: boolean;
  /** QR_REVOCADO, QR_YA_USADO, QR_VENCIDO, QR_AUN_NO_VIGENTE, QR_DIA_NO_HABILITADO, QR_FUERA_DE_HORARIO, QR_YA_DENTRO */
  motivo: string | null;
  mensaje: string | null;
  visita: {
    visitante: string;
    placa: string | null;
    unidad: string | null;
    autorizo: string | null;
    tipo: 'unica' | 'recurrente';
    fecha_desde: string;
    fecha_hasta: string;
    hora_desde: string;
    hora_hasta: string;
    dias_semana: number[] | null;
  };
}

/** La copia de los QR del día para validar sin red (solo lo mínimo; nunca la cédula). */
export interface QrDeCopia {
  token: string;
  visitante: string;
  placa: string | null;
  unidad: string | null;
  autorizo: string | null;
  tipo: 'unica' | 'recurrente';
  fecha_desde: string;
  fecha_hasta: string;
  hora_desde: string;
  hora_hasta: string;
  dias_semana: number[] | null;
  /** Ya estaba dentro cuando se bajó la copia. */
  ya_dentro: boolean;
}

export interface CopiaQr {
  generado_en: string;
  zona: string;
  qrs: QrDeCopia[];
}

/** Un ingreso registrado sin conexión, pendiente de enviar. `uuid` lo genera el teléfono para que reenviarlo no lo duplique. */
export interface IngresoPendiente {
  uuid: string;
  token: string | null;
  tipo: TipoAcceso;
  nombre: string;
  documento: string | null;
  placa: string | null;
  unidad_codigo: string | null;
  destino: string | null;
  autorizado_por: AutorizadoPor;
  entrada_en: string;
  salida_en: string | null;
}

export interface SalidaPendiente {
  acceso_id: number;
  salida_en: string;
}

export interface ResultadoSincronizacion {
  ingresos: {
    uuid: string;
    resultado: 'ok' | 'duplicado' | 'conflicto' | 'rechazado';
    motivo?: string;
    acceso_id?: number;
  }[];
  salidas: { acceso_id: number; resultado: 'ok' | 'duplicado' | 'rechazado'; motivo?: string }[];
}

export interface IngresoSinQr {
  tipo: TipoAcceso;
  nombre: string;
  documento: string | null;
  placa: string | null;
  unidad_codigo: string | null;
  destino: string | null;
  autorizado_por: Exclude<AutorizadoPor, 'qr'>;
}

export interface AccesoBitacora {
  id: number;
  nombre: string;
  tipo: TipoAcceso;
  unidad: string | null;
  destino: string | null;
  autorizado_por: AutorizadoPor;
  estado: 'dentro' | 'salio';
  sin_conexion: boolean;
  /** Si se registró sin conexión y al sincronizar había un conflicto. */
  nota: string | null;
  entrada_en: string;
  salida_en: string | null;
  registrado_por: string | null;
}

export interface BitacoraGarita {
  desde: string;
  hasta: string;
  hay_mas: boolean;
  /** Cuándo se sincronizó por última vez lo registrado sin conexión. */
  ultima_sincronizacion: string | null;
  indicadores: {
    dentro_ahora: number;
    proveedores_dentro: number;
    ingresos_hoy: number;
    con_qr_hoy: number;
    sin_anunciar_hoy: number;
    sin_conexion: number;
  };
  accesos: AccesoBitacora[];
}

export interface FiltrosBitacora {
  desde: string;
  hasta: string;
  tipo: TipoAcceso | null;
  q: string;
}

export const garitaService = {
  async panel(): Promise<PanelGarita> {
    const { data } = await api.get<ApiRespuesta<PanelGarita>>('/garita/panel');
    return data.data;
  },

  async validarQr(token: string): Promise<ValidacionQr> {
    const { data } = await api.post<ApiRespuesta<ValidacionQr>>('/garita/qr/validar', { token });
    return data.data;
  },

  async copiaQr(): Promise<CopiaQr> {
    const { data } = await api.get<ApiRespuesta<CopiaQr>>('/garita/qr/vigentes');
    return data.data;
  },

  async sincronizar(
    ingresos: IngresoPendiente[],
    salidas: SalidaPendiente[],
  ): Promise<ResultadoSincronizacion> {
    const { data } = await api.post<ApiRespuesta<ResultadoSincronizacion>>(
      '/garita/accesos/sincronizar',
      { ingresos, salidas },
    );
    return data.data;
  },

  async ingresoConQr(token: string): Promise<void> {
    await api.post('/garita/accesos', { token });
  },

  async ingresoSinQr(datos: IngresoSinQr): Promise<void> {
    await api.post('/garita/accesos', datos);
  },

  async pedirPermiso(d: PedidoDePermiso): Promise<void> {
    await api.post('/garita/solicitudes', d);
  },

  async ingresoDeSolicitud(id: number): Promise<void> {
    await api.post(`/garita/solicitudes/${id}/ingreso`);
  },

  async cancelarSolicitud(id: number): Promise<void> {
    await api.post(`/garita/solicitudes/${id}/cancelar`);
  },

  async salida(id: number): Promise<void> {
    await api.post(`/garita/accesos/${id}/salida`);
  },

  /** Excel de la bitácora con los mismos filtros de la pantalla. */
  async exportarBitacora(f: FiltrosBitacora): Promise<Blob> {
    const params = new URLSearchParams({ desde: f.desde, hasta: f.hasta });
    if (f.tipo !== null) params.set('tipo', f.tipo);
    if (f.q.trim() !== '') params.set('q', f.q.trim());
    return pedirArchivo(`/garita/bitacora/exportar?${params.toString()}`);
  },

  async bitacora(f: FiltrosBitacora): Promise<BitacoraGarita> {
    const params: Record<string, string> = { desde: f.desde, hasta: f.hasta };
    if (f.tipo !== null) params.tipo = f.tipo;
    if (f.q.trim() !== '') params.q = f.q.trim();
    const { data } = await api.get<ApiRespuesta<BitacoraGarita>>('/garita/bitacora', { params });
    return data.data;
  },
};
