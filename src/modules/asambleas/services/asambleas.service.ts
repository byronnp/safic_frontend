import { api } from '@/core/api/client';
import { pedirArchivo } from '@/core/api/descarga';
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
  /** Convocada y todavía sin instalar. */
  puede_cancelar: boolean;
  convocada_en: string | null;
  motivo_cancelacion: string | null;
}

/** Seguimiento de la convocatoria: lo que dice la constancia de lectura del anuncio con que se convocó. */
export interface ConvocatoriaAsamblea {
  anuncio_id: number;
  publicada_en: string;
  unidades: number;
  leyeron: number;
  confirmaron: number;
  /** 0–100 */
  porcentaje_confirmaron: number;
  pendientes: { unidad_id: number; codigo: string; leyo: boolean }[];
  recordatorios: { tres_dias: string | null; dos_horas: string | null };
}

export type EstadoPoder = 'pendiente' | 'validado' | 'rechazado' | 'revocado';
export type TipoPoder = 'notarial' | 'carta';

export interface PoderAsamblea {
  id: number;
  asamblea_id: number;
  unidad_id: number;
  unidad_codigo: string;
  alicuota: string;
  otorgante: string | null;
  tipo: TipoPoder;
  estado: EstadoPoder;
  motivo_rechazo: string | null;
  representante_nombre: string;
  /** Enmascarado. */
  representante_documento: string;
  representante_registrado: boolean;
  documento_nombre: string;
  /** Enlace temporal al PDF. */
  documento_url: string | null;
  cargado_por: string | null;
  cargado_en: string;
  validado_por: string | null;
  validado_en: string | null;
  /** La unidad debe cuotas hoy: no vota aunque el poder esté validado. */
  unidad_en_mora: boolean;
}

export interface PoderesDeAsamblea {
  pendientes: number;
  validados: number;
  rechazados: number;
  poderes: PoderAsamblea[];
}

export interface CargarPoder {
  unidad_id: number;
  tipo: TipoPoder;
  representante_nombre: string;
  representante_tipo_documento: 'cedula' | 'pasaporte';
  representante_documento: string;
  archivo: File;
}

/** Una asamblea vista por el propietario: sus unidades y el poder que dio por cada una. */
export interface MiAsamblea extends AsambleaBase {
  unidades: {
    unidad_id: number;
    codigo: string;
    alicuota: string;
    poder: {
      id: number;
      estado: Exclude<EstadoPoder, 'revocado'>;
      tipo: TipoPoder;
      representante_nombre: string;
      motivo_rechazo: string | null;
    } | null;
  }[];
  /** Unidades que represento por poder validado. */
  representa: { poder_id: number; unidad_codigo: string }[];
  puede_dar_poder: boolean;
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

  async convocar(id: number): Promise<AsambleaDetalle> {
    const { data } = await api.post<ApiRespuesta<AsambleaDetalle>>(`/asambleas/${id}/convocar`);
    return data.data;
  },

  async cancelar(id: number, motivo: string): Promise<AsambleaDetalle> {
    const { data } = await api.post<ApiRespuesta<AsambleaDetalle>>(`/asambleas/${id}/cancelar`, {
      motivo,
    });
    return data.data;
  },

  async convocatoria(id: number): Promise<ConvocatoriaAsamblea> {
    const { data } = await api.get<ApiRespuesta<ConvocatoriaAsamblea>>(
      `/asambleas/${id}/convocatoria`,
    );
    return data.data;
  },

  /** Devuelve a cuántas unidades se les avisó. */
  async reenviarConvocatoria(id: number): Promise<number> {
    const { data } = await api.post<ApiRespuesta<{ unidades: number }>>(
      `/asambleas/${id}/convocatoria/reenviar`,
    );
    return data.data.unidades;
  },

  async constancia(id: number): Promise<Blob> {
    return pedirArchivo(`/asambleas/${id}/constancia.pdf`);
  },

  async poderes(id: number): Promise<PoderesDeAsamblea> {
    const { data } = await api.get<ApiRespuesta<PoderesDeAsamblea>>(`/asambleas/${id}/poderes`);
    return data.data;
  },

  async cargarPoder(id: number, d: CargarPoder): Promise<PoderAsamblea> {
    const formulario = new FormData();
    formulario.append('unidad_id', String(d.unidad_id));
    formulario.append('tipo', d.tipo);
    formulario.append('representante_nombre', d.representante_nombre);
    formulario.append('representante_tipo_documento', d.representante_tipo_documento);
    formulario.append('representante_documento', d.representante_documento);
    formulario.append('archivo', d.archivo);
    const { data } = await api.post<ApiRespuesta<PoderAsamblea>>(
      `/asambleas/${id}/poderes`,
      formulario,
    );
    return data.data;
  },

  async validarPoder(poderId: number): Promise<PoderAsamblea> {
    const { data } = await api.post<ApiRespuesta<PoderAsamblea>>(`/poderes/${poderId}/validar`);
    return data.data;
  },

  async rechazarPoder(poderId: number, motivo: string): Promise<PoderAsamblea> {
    const { data } = await api.post<ApiRespuesta<PoderAsamblea>>(`/poderes/${poderId}/rechazar`, {
      motivo,
    });
    return data.data;
  },

  async retirarPoder(poderId: number): Promise<PoderAsamblea> {
    const { data } = await api.delete<ApiRespuesta<PoderAsamblea>>(`/poderes/${poderId}`);
    return data.data;
  },

  async misAsambleas(): Promise<MiAsamblea[]> {
    const { data } = await api.get<ApiRespuesta<MiAsamblea[]>>('/mis-asambleas');
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
