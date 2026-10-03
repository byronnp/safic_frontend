import { api } from '@/core/api/client';
import type { ApiRespuesta } from '@/core/api/types';

/** Contrato: components/schemas/Plan. El dinero llega como texto ("2.00"). */
export interface Plan {
  clave: string;
  nombre: string;
  /** Administrador, tesorero y contador cuentan para este límite. */
  max_administrativos: number;
  valor_unidad_sugerido: string;
}

export interface OpcionCatalogo {
  valor: string;
  etiqueta: string;
}

export type ValorMetodoCobro = 'valor_general' | 'por_tipo' | 'por_alicuota' | 'por_unidad';

export interface MetodoCobro {
  valor: ValorMetodoCobro;
  etiqueta: string;
  descripcion: string;
}

export interface AmenidadCatalogo {
  clave: string;
  nombre: string;
  icono: string;
  /** Pasa a la agenda de áreas comunes. */
  reservable: boolean;
  /** Nunca se restringe por mora. */
  esencial: boolean;
}

export interface CatalogosAlta {
  tipos_condominio: OpcionCatalogo[];
  metodos_cobro: MetodoCobro[];
  amenidades: AmenidadCatalogo[];
}

export interface Parroquia {
  codigo: string;
  nombre: string;
}

export interface Canton {
  codigo: string;
  nombre: string;
  parroquias: Parroquia[];
}

export interface Provincia {
  codigo: string;
  nombre: string;
  cantones: Canton[];
}

/** Catálogos del panel de plataforma (no dependen de un condominio). */
export const catalogosService = {
  async planes(): Promise<Plan[]> {
    const { data } = await api.get<ApiRespuesta<Plan[]>>('/plataforma/planes');
    return data.data;
  },

  async catalogos(): Promise<CatalogosAlta> {
    const { data } = await api.get<ApiRespuesta<CatalogosAlta>>('/plataforma/catalogos');
    return data.data;
  },

  async ubicaciones(): Promise<Provincia[]> {
    const { data } = await api.get<ApiRespuesta<Provincia[]>>('/plataforma/ubicaciones');
    return data.data;
  },
};
