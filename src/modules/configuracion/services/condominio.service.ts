import { api } from '@/core/api/client';
import type { ApiRespuesta, MarcaCondominio } from '@/core/api/types';

/** Tipos del contrato (safic_backend/docs/openapi.yaml · DatosCondominio). */
export interface CodigoNombre {
  codigo: string;
  nombre: string;
}

export interface DatosCondominio {
  id: number;
  codigo: string;
  nombre: string;
  tipo: string | null;
  /** RUC y razón social los cambia la plataforma. */
  ruc: string | null;
  razon_social: string | null;
  telefono: string | null;
  email_contacto: string | null;
  direccion: string | null;
  provincia: CodigoNombre | null;
  canton: CodigoNombre | null;
  parroquia: CodigoNombre | null;
  /** Texto decimal con 6 decimales, ej. "-0.180000". */
  latitud: string | null;
  longitud: string | null;
  marca: Required<{ [K in keyof MarcaCondominio]: string | null }>;
}

/** Solo viaja lo que cambia. Provincia, cantón y parroquia van juntos; latitud y longitud también. */
export interface ActualizarDatosCondominio {
  nombre?: string;
  telefono?: string | null;
  email_contacto?: string | null;
  direccion?: string;
  provincia_codigo?: string;
  canton_codigo?: string;
  parroquia_codigo?: string;
  latitud?: number;
  longitud?: number;
  /** null restablece el color de SAFIC. */
  color_primario?: string | null;
  color_acento?: string | null;
}

export type VarianteLogo = 'claro' | 'oscuro';

/** El condominio va en el header X-Condominio-Id (lo agrega el cliente HTTP). */
export const condominioService = {
  async ver(): Promise<DatosCondominio> {
    const { data } = await api.get<ApiRespuesta<DatosCondominio>>('/condominio');
    return data.data;
  },

  async actualizar(datos: ActualizarDatosCondominio): Promise<DatosCondominio> {
    const { data } = await api.patch<ApiRespuesta<DatosCondominio>>('/condominio', datos);
    return data.data;
  },

  async subirLogo(variante: VarianteLogo, archivo: File): Promise<DatosCondominio> {
    const formulario = new FormData();
    formulario.append('archivo', archivo);
    const { data } = await api.post<ApiRespuesta<DatosCondominio>>(
      `/condominio/logo/${variante}`,
      formulario,
    );
    return data.data;
  },

  async quitarLogo(variante: VarianteLogo): Promise<DatosCondominio> {
    const { data } = await api.delete<ApiRespuesta<DatosCondominio>>(
      `/condominio/logo/${variante}`,
    );
    return data.data;
  },
};
