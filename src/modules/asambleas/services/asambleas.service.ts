import { api } from '@/core/api/client';
import type { ApiRespuesta } from '@/core/api/types';

/** Tipos del contrato (safic_backend/docs/openapi.yaml · Asambleas). Las alícuotas son texto decimal (porcentaje). */
export type EstadoAsamblea =
  | 'borrador'
  | 'convocada'
  | 'en_registro'
  | 'instalada'
  | 'en_votacion'
  | 'cerrada'
  | 'acta_firmada'
  | 'cancelada';
export type TipoAsamblea = 'ordinaria' | 'extraordinaria';
export type ModalidadAsamblea = 'presencial' | 'mixta' | 'virtual';
export type TipoPunto = 'informativo' | 'votacion' | 'eleccion' | 'reforma_reglamento';
export type MayoriaPunto = 'ninguna' | 'simple' | 'calificada';
export type BasePunto = 'presentes' | 'total';

/** Lo que tienen en común la lista y el detalle. */
export interface AsambleaBase {
  id: number;
  titulo: string;
  tipo: TipoAsamblea;
  modalidad: ModalidadAsamblea;
  estado: EstadoAsamblea;
  /** Hora local del condominio, `YYYY-MM-DDTHH:MM`. */
  fecha_hora: string;
  lugar: string | null;
  enlace_video: string | null;
}

export interface AsambleaResumen extends AsambleaBase {
  /** Cantidad de puntos del orden del día. */
  puntos: number;
}

export interface PuntoAsamblea {
  id: number;
  orden: number;
  titulo: string;
  descripcion: string | null;
  tipo: TipoPunto;
  mayoria: MayoriaPunto;
  umbral_pct: string | null;
  base: BasePunto | null;
  adjunto_nombre: string | null;
  /** Enlace temporal al informe. */
  adjunto_url: string | null;
}

export interface PadronAsamblea {
  unidades: number;
  suma_alicuotas: string;
  en_mora: { unidades: number; alicuotas: string };
  quorum_minimo_pct: string;
}

export interface AnticipacionConvocatoria {
  cumple: boolean;
  minimo: number;
  dias_habiles: number;
  /** `YYYY-MM-DD`: el último día para publicar la convocatoria. */
  ultimo_dia: string;
  feriados: { fecha: string; nombre: string }[];
  /** `HH:MM`. */
  segunda_convocatoria: string;
}

export interface AsambleaDetalle extends AsambleaBase {
  segunda_convocatoria: string;
  anticipacion: AnticipacionConvocatoria;
  puntos: PuntoAsamblea[];
  padron: PadronAsamblea;
  falta_para_convocar: string[];
  puede_convocar: boolean;
}

export interface ConfiguracionAsambleas {
  permite_virtual: boolean;
  mora_cuenta_para_quorum: boolean;
  voto_secreto: boolean;
  porcentaje_reforma: string | null;
}

export interface GuardarAsamblea {
  titulo: string;
  tipo: TipoAsamblea;
  modalidad: ModalidadAsamblea;
  fecha_hora: string;
  lugar: string | null;
  enlace_video: string | null;
}

export interface GuardarPunto {
  titulo: string;
  descripcion: string | null;
  tipo: TipoPunto;
  mayoria: 'simple' | 'calificada' | null;
  umbral_pct: number | null;
  base: BasePunto | null;
}

/** El condominio va en el header X-Condominio-Id (lo agrega el cliente HTTP). */
export const asambleasService = {
  async lista(estado?: EstadoAsamblea): Promise<AsambleaResumen[]> {
    const { data } = await api.get<ApiRespuesta<AsambleaResumen[]>>('/asambleas', {
      params: estado ? { estado } : {},
    });
    return data.data;
  },

  async ver(id: number): Promise<AsambleaDetalle> {
    const { data } = await api.get<ApiRespuesta<AsambleaDetalle>>(`/asambleas/${id}`);
    return data.data;
  },

  async padron(): Promise<PadronAsamblea> {
    const { data } = await api.get<ApiRespuesta<PadronAsamblea>>('/asambleas/padron');
    return data.data;
  },

  /** Cómo queda la anticipación de la convocatoria con esa fecha, sin guardar nada. */
  async anticipacion(fechaHora: string): Promise<AnticipacionConvocatoria> {
    const { data } = await api.get<ApiRespuesta<AnticipacionConvocatoria>>(
      '/asambleas/anticipacion',
      {
        params: { fecha_hora: fechaHora },
      },
    );
    return data.data;
  },

  async crear(d: GuardarAsamblea): Promise<AsambleaDetalle> {
    const { data } = await api.post<ApiRespuesta<AsambleaDetalle>>('/asambleas', d);
    return data.data;
  },

  async actualizar(id: number, d: GuardarAsamblea): Promise<AsambleaDetalle> {
    const { data } = await api.patch<ApiRespuesta<AsambleaDetalle>>(`/asambleas/${id}`, d);
    return data.data;
  },

  async descartar(id: number): Promise<void> {
    await api.delete(`/asambleas/${id}`);
  },

  async agregarPunto(id: number, d: GuardarPunto): Promise<AsambleaDetalle> {
    const { data } = await api.post<ApiRespuesta<AsambleaDetalle>>(`/asambleas/${id}/puntos`, d);
    return data.data;
  },

  async editarPunto(id: number, puntoId: number, d: GuardarPunto): Promise<AsambleaDetalle> {
    const { data } = await api.patch<ApiRespuesta<AsambleaDetalle>>(
      `/asambleas/${id}/puntos/${puntoId}`,
      d,
    );
    return data.data;
  },

  async quitarPunto(id: number, puntoId: number): Promise<AsambleaDetalle> {
    const { data } = await api.delete<ApiRespuesta<AsambleaDetalle>>(
      `/asambleas/${id}/puntos/${puntoId}`,
    );
    return data.data;
  },

  async moverPunto(
    id: number,
    puntoId: number,
    direccion: 'sube' | 'baja',
  ): Promise<AsambleaDetalle> {
    const { data } = await api.post<ApiRespuesta<AsambleaDetalle>>(
      `/asambleas/${id}/puntos/${puntoId}/mover`,
      { direccion },
    );
    return data.data;
  },

  async adjuntarInforme(id: number, puntoId: number, archivo: File): Promise<AsambleaDetalle> {
    const formulario = new FormData();
    formulario.append('archivo', archivo);
    const { data } = await api.post<ApiRespuesta<AsambleaDetalle>>(
      `/asambleas/${id}/puntos/${puntoId}/adjunto`,
      formulario,
    );
    return data.data;
  },

  async quitarInforme(id: number, puntoId: number): Promise<AsambleaDetalle> {
    const { data } = await api.delete<ApiRespuesta<AsambleaDetalle>>(
      `/asambleas/${id}/puntos/${puntoId}/adjunto`,
    );
    return data.data;
  },

  async configuracion(): Promise<ConfiguracionAsambleas> {
    const { data } = await api.get<ApiRespuesta<ConfiguracionAsambleas>>(
      '/asambleas/configuracion',
    );
    return data.data;
  },

  async guardarConfiguracion(d: ConfiguracionAsambleas): Promise<ConfiguracionAsambleas> {
    const { data } = await api.put<ApiRespuesta<ConfiguracionAsambleas>>(
      '/asambleas/configuracion',
      d,
    );
    return data.data;
  },
};
