import { api } from '@/core/api/client';
import { pedirArchivo } from '@/core/api/descarga';
import type { ApiRespuesta } from '@/core/api/types';

/** Tipos del contrato (safic_backend/docs/openapi.yaml · Comunicación · anuncios). */
export type DestinoTipo = 'todos' | 'bloque' | 'unidades';

export interface AnuncioAdmin {
  id: number;
  titulo: string;
  destino: string;
  publicado_en: string;
  expira_en: string | null;
  vigente: boolean;
  fijado: boolean;
  requiere_confirmacion: boolean;
  unidades: number;
  leidas: number;
  confirmadas: number;
  /** 0–100 */
  porcentaje_leido: number;
  tiene_adjunto: boolean;
}

export interface Aviso {
  id: number;
  titulo: string;
  mensaje: string;
  destino: string;
  publicado_en: string;
  expira_en: string | null;
  fijado: boolean;
  requiere_confirmacion: boolean;
  leido: boolean;
  confirmado: boolean;
  adjunto_nombre: string | null;
  /** Enlace temporal al adjunto. */
  adjunto_url: string | null;
}

export interface MisAvisos {
  no_leidos: number;
  avisos: Aviso[];
}

export interface DestinoAnuncio {
  destino_tipo: DestinoTipo;
  bloque_id: number | null;
  unidades: string[];
}

export interface AlcanceAnuncio {
  destino: string;
  unidades: number;
  personas_con_cuenta: number;
}

export interface NuevoAnuncio extends DestinoAnuncio {
  titulo: string;
  mensaje: string;
  fijar: boolean;
  confirmacion: boolean;
  expira: string | null;
  adjunto: File | null;
}

export const anunciosService = {
  async listar(): Promise<AnuncioAdmin[]> {
    const { data } = await api.get<ApiRespuesta<AnuncioAdmin[]>>('/comunicacion/anuncios');
    return data.data;
  },

  async alcance(d: DestinoAnuncio): Promise<AlcanceAnuncio> {
    const params: Record<string, unknown> = { destino_tipo: d.destino_tipo };
    if (d.destino_tipo === 'bloque' && d.bloque_id !== null) params.bloque_id = d.bloque_id;
    if (d.destino_tipo === 'unidades') params.unidades = d.unidades;
    const { data } = await api.get<ApiRespuesta<AlcanceAnuncio>>('/comunicacion/anuncios/alcance', {
      params,
    });
    return data.data;
  },

  async publicar(d: NuevoAnuncio): Promise<void> {
    const f = new FormData();
    f.append('titulo', d.titulo);
    f.append('mensaje', d.mensaje);
    f.append('destino_tipo', d.destino_tipo);
    if (d.destino_tipo === 'bloque' && d.bloque_id !== null)
      f.append('bloque_id', String(d.bloque_id));
    if (d.destino_tipo === 'unidades') d.unidades.forEach((u) => f.append('unidades[]', u));
    f.append('fijar', d.fijar ? '1' : '0');
    f.append('confirmacion', d.confirmacion ? '1' : '0');
    if (d.expira) f.append('expira', d.expira);
    if (d.adjunto) f.append('adjunto', d.adjunto);
    await api.post('/comunicacion/anuncios', f);
  },

  async reenviar(id: number): Promise<number> {
    const { data } = await api.post<ApiRespuesta<{ unidades: number }>>(
      `/comunicacion/anuncios/${id}/reenviar`,
    );
    return data.data.unidades;
  },

  async constancia(id: number): Promise<Blob> {
    return pedirArchivo(`/comunicacion/anuncios/${id}/constancia`);
  },

  async mios(): Promise<MisAvisos> {
    const { data } = await api.get<ApiRespuesta<MisAvisos>>('/mis-avisos');
    return data.data;
  },

  async leer(id: number): Promise<void> {
    await api.post(`/mis-avisos/${id}/leer`);
  },

  async confirmar(id: number): Promise<void> {
    await api.post(`/mis-avisos/${id}/confirmar`);
  },
};
