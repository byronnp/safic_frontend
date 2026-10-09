import { isAxiosError } from 'axios';

import { api } from '@/core/api/client';
import type { ApiRespuesta, Paginacion } from '@/core/api/types';

import type { Persona } from './personas.service';

/** Tipos del contrato (safic_backend/docs/openapi.yaml · Unidades). */
export type TipoUnidad = 'departamento' | 'casa' | 'local' | 'parqueadero' | 'bodega';
export type ResponsablePago = 'propietario' | 'inquilino';
export type EstadoUnidad = 'ocupada' | 'arrendada' | 'vacia';
export type MetodoCobro = 'general' | 'tipo' | 'alicuota' | 'unidad';
export type RelacionOcupante = 'propietario' | 'inquilino' | 'residente' | 'contacto_emergencia';

export interface Unidad {
  id: number;
  codigo: string;
  bloque: { id: number; nombre: string } | null;
  tipo: TipoUnidad;
  piso: number | null;
  /** Texto decimal, ej. "84.00". */
  area_m2: string;
  /** Porcentaje con 4 decimales, ej. "0.6200" (0,62 %). */
  alicuota: string | null;
  cuota_mensual: string | null;
  valor_personalizado: string | null;
  responsable_pago: ResponsablePago;
  estado: EstadoUnidad;
  /** Nombres de los propietarios vigentes, el principal primero. */
  propietarios: string[];
  ocupante_principal: { nombre: string; relacion: RelacionOcupante } | null;
}

/** GET /unidades/{id}: la unidad con sus ocupantes vigentes (principal primero), vehículos y mascotas. */
export interface UnidadDetalle extends Unidad {
  ocupantes: Ocupante[];
  vehiculos: Vehiculo[];
  mascotas: Mascota[];
}

export interface ErrorImportacion {
  /** Número de fila en Excel (la 1 son los títulos). */
  fila: number;
  campo: string;
  mensaje: string;
}

/** POST /unidades/importacion (vista previa o creación). */
export interface ResultadoImportacion {
  confirmado: boolean;
  total_filas: number;
  validas: number;
  /** Filas con al menos un error. */
  con_errores: number;
  errores: ErrorImportacion[];
  bloques_nuevos: string[];
  cupo: { total: number; registradas: number; nuevas: number; alcanza: boolean };
  creadas: number;
}

export type TipoVehiculo = 'auto' | 'moto';
export type Especie = 'perro' | 'gato' | 'ave' | 'otro';

export interface Vehiculo {
  id: number;
  unidad_id: number;
  /** Normalizada: "PBA-1234" o "IA-123B". */
  placa: string;
  tipo: TipoVehiculo;
  marca: string | null;
  modelo: string | null;
  color: string | null;
}

export interface GuardarVehiculo {
  placa: string;
  tipo: TipoVehiculo;
  marca: string | null;
  modelo: string | null;
  color: string | null;
}

export interface Mascota {
  id: number;
  unidad_id: number;
  nombre: string;
  especie: Especie;
  raza: string | null;
}

export interface GuardarMascota {
  nombre: string;
  especie: Especie;
  raza: string | null;
}

export interface Ocupante {
  id: number;
  unidad_id: number;
  persona: Persona;
  relacion: RelacionOcupante;
  es_principal: boolean;
  /** "2025-10-01" */
  fecha_inicio: string;
  fecha_fin: string | null;
  /** Vigente hoy en la zona horaria del condominio. */
  vigente: boolean;
}

export interface AsignarOcupante {
  persona_id: number;
  relacion: RelacionOcupante;
  es_principal: boolean;
  fecha_inicio: string;
  fecha_fin: string | null;
}

export interface ResumenUnidades {
  /** Departamentos, casas y locales (parqueaderos y bodegas no cuentan). */
  registradas: number;
  total_contratadas: number;
  suma_alicuotas: string;
  metodo_cobro: MetodoCobro;
  /** Lo que paga cada unidad con método general; null con los demás. */
  cuota_general: string | null;
  /** Departamentos, casas y locales ocupados o arrendados. */
  ocupadas: number;
  /** Personas distintas con relación vigente (sin contactos de emergencia). */
  residentes: number;
}

/** Cuerpo de POST /unidades. Área y montos como texto decimal ("84.50"), nunca float. */
export interface GuardarUnidad {
  codigo: string;
  bloque_id: number | null;
  tipo: TipoUnidad;
  piso: number | null;
  area_m2: string;
  responsable_pago: ResponsablePago;
  alicuota?: string | null | undefined;
  cuota_mensual?: string | undefined;
  valor_personalizado?: string | null | undefined;
}

export interface FiltroUnidades {
  buscar?: string | undefined;
  tipo?: TipoUnidad | '' | undefined;
  estado?: EstadoUnidad | '' | undefined;
  bloqueId?: number | null | undefined;
  pagina?: number | undefined;
  porPagina?: number | undefined;
}

export interface PaginaUnidades {
  unidades: Unidad[];
  paginacion: Paginacion;
}

/** El condominio va en el header X-Condominio-Id (lo agrega el cliente HTTP). */
export const unidadesService = {
  async listar(filtro: FiltroUnidades = {}): Promise<PaginaUnidades> {
    const { data } = await api.get<ApiRespuesta<Unidad[]>>('/unidades', {
      params: {
        buscar: filtro.buscar?.trim() || undefined,
        tipo: filtro.tipo || undefined,
        estado: filtro.estado || undefined,
        bloque_id: filtro.bloqueId ?? undefined,
        page: filtro.pagina ?? 1,
        por_pagina: filtro.porPagina,
      },
    });
    return {
      unidades: data.data,
      paginacion: data.meta?.pagination ?? {
        page: 1,
        per_page: data.data.length,
        total: data.data.length,
        last_page: 1,
      },
    };
  },

  async resumen(): Promise<ResumenUnidades> {
    const { data } = await api.get<ApiRespuesta<ResumenUnidades>>('/unidades/resumen');
    return data.data;
  },

  async crear(datos: GuardarUnidad): Promise<Unidad> {
    const { data } = await api.post<ApiRespuesta<Unidad>>('/unidades', datos);
    return data.data;
  },

  async ver(id: number): Promise<UnidadDetalle> {
    const { data } = await api.get<ApiRespuesta<UnidadDetalle>>(`/unidades/${id}`);
    return data.data;
  },

  /** Vigentes y terminados, los más recientes primero. */
  async historialOcupantes(unidadId: number): Promise<Ocupante[]> {
    const { data } = await api.get<ApiRespuesta<Ocupante[]>>(`/unidades/${unidadId}/ocupantes`);
    return data.data;
  },

  async asignarOcupante(unidadId: number, datos: AsignarOcupante): Promise<Ocupante> {
    const { data } = await api.post<ApiRespuesta<Ocupante>>(
      `/unidades/${unidadId}/ocupantes`,
      datos,
    );
    return data.data;
  },

  async crearVehiculo(unidadId: number, datos: GuardarVehiculo): Promise<Vehiculo> {
    const { data } = await api.post<ApiRespuesta<Vehiculo>>(
      `/unidades/${unidadId}/vehiculos`,
      datos,
    );
    return data.data;
  },

  async editarVehiculo(id: number, datos: GuardarVehiculo): Promise<Vehiculo> {
    const { data } = await api.patch<ApiRespuesta<Vehiculo>>(`/vehiculos/${id}`, datos);
    return data.data;
  },

  async eliminarVehiculo(id: number): Promise<void> {
    await api.delete(`/vehiculos/${id}`);
  },

  async crearMascota(unidadId: number, datos: GuardarMascota): Promise<Mascota> {
    const { data } = await api.post<ApiRespuesta<Mascota>>(`/unidades/${unidadId}/mascotas`, datos);
    return data.data;
  },

  async editarMascota(id: number, datos: GuardarMascota): Promise<Mascota> {
    const { data } = await api.patch<ApiRespuesta<Mascota>>(`/mascotas/${id}`, datos);
    return data.data;
  },

  async eliminarMascota(id: number): Promise<void> {
    await api.delete(`/mascotas/${id}`);
  },

  /** Excel de ejemplo con las columnas del método de cobro del condominio. */
  async descargarPlantilla(): Promise<Blob> {
    try {
      const { data } = await api.get<Blob>('/unidades/importacion/plantilla', {
        responseType: 'blob',
      });
      return data;
    } catch (error) {
      // Con responseType blob el cuerpo del error también llega como Blob: se lee para
      // conservar el código y el mensaje de la API.
      if (isAxiosError(error) && error.response?.data instanceof Blob) {
        try {
          error.response.data = JSON.parse(await error.response.data.text());
        } catch {
          // No era JSON: queda el error genérico
        }
      }
      throw error;
    }
  },

  /**
   * Sin `confirmar` solo valida (vista previa, no guarda nada). Con `confirmar`
   * crea todas las unidades o ninguna.
   */
  async importar(archivo: File, confirmar: boolean): Promise<ResultadoImportacion> {
    const formulario = new FormData();
    formulario.append('archivo', archivo);
    if (confirmar) {
      formulario.append('confirmar', '1');
    }
    const { data } = await api.post<ApiRespuesta<ResultadoImportacion>>(
      '/unidades/importacion',
      formulario,
    );
    return data.data;
  },

  async finalizarOcupante(ocupanteId: number, fechaFin: string): Promise<Ocupante> {
    const { data } = await api.patch<ApiRespuesta<Ocupante>>(`/ocupantes/${ocupanteId}/finalizar`, {
      fecha_fin: fechaFin,
    });
    return data.data;
  },
};
