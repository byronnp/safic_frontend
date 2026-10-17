import { api } from '@/core/api/client';
import type { ApiRespuesta } from '@/core/api/types';

/** Tipos del contrato (safic_backend/docs/openapi.yaml · Garita · paquetes). */
export interface OcupanteRetira {
  id: number;
  nombre: string;
  relacion: string;
}

export interface PaqueteEnGarita {
  id: number;
  unidad: string;
  empresa: string;
  descripcion: string | null;
  recibido_en: string;
  dias: number;
  /** Lleva 7 días o más en la garita. */
  atrasado: boolean;
  /** Enlace temporal a la foto; null si el archivo ya no está. */
  foto_url: string | null;
  ocupantes: OcupanteRetira[];
}

export interface PaqueteEntregadoHoy {
  id: number;
  unidad: string;
  empresa: string;
  descripcion: string | null;
  entregado_en: string | null;
  retira_nombre: string | null;
}

export interface PaquetesGarita {
  en_garita: PaqueteEnGarita[];
  entregados_hoy: PaqueteEntregadoHoy[];
}

export interface MiPaquete {
  id: number;
  unidad: string;
  empresa: string;
  descripcion: string | null;
  recibido_en: string;
  entregado_en: string | null;
  dias: number;
}

export interface MisPaquetes {
  en_garita: MiPaquete[];
  entregados: MiPaquete[];
}

export interface NuevoPaquete {
  unidad_codigo: string;
  empresa: string;
  descripcion: string | null;
  foto: File;
}

export interface EntregaPaquete {
  /** Exactamente uno de los dos. */
  ocupante_id: number | null;
  autorizado: string | null;
  firma: File;
}

export const paquetesService = {
  async enGarita(): Promise<PaquetesGarita> {
    const { data } = await api.get<ApiRespuesta<PaquetesGarita>>('/garita/paquetes');
    return data.data;
  },

  async recibir(d: NuevoPaquete): Promise<void> {
    const f = new FormData();
    f.append('unidad_codigo', d.unidad_codigo);
    f.append('empresa', d.empresa);
    if (d.descripcion) f.append('descripcion', d.descripcion);
    f.append('foto', d.foto);
    await api.post('/garita/paquetes', f);
  },

  async entregar(id: number, d: EntregaPaquete): Promise<void> {
    const f = new FormData();
    if (d.ocupante_id !== null) f.append('ocupante_id', String(d.ocupante_id));
    if (d.autorizado) f.append('autorizado', d.autorizado);
    f.append('firma', d.firma);
    await api.post(`/garita/paquetes/${id}/entregar`, f);
  },

  async mios(): Promise<MisPaquetes> {
    const { data } = await api.get<ApiRespuesta<MisPaquetes>>('/mis-paquetes');
    return data.data;
  },
};
