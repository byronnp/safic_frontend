import { api } from '@/core/api/client';
import type { ApiRespuesta } from '@/core/api/types';

/** Tipos del contrato (safic_backend/docs/openapi.yaml · Finanzas · proveedores). Los montos son texto decimal. */
export type EstadoProveedor = 'sin_facturas' | 'por_aprobar' | 'vence_pronto' | 'al_dia';
export type FiltroProveedores = 'todos' | 'con_saldo' | 'cuenta_en_cambio';
export type TipoCuenta = 'corriente' | 'ahorros';

export interface CuentaProveedor {
  id: number;
  banco: string;
  tipo: TipoCuenta;
  numero: string;
  titular: string;
}

export interface CambioDeCuenta extends CuentaProveedor {
  /** ISO 8601: cuándo se activa si nadie lo detiene. */
  activa_en: string | null;
  solicitado_por: string | null;
  solicitado_en: string | null;
}

export interface Proveedor {
  id: number;
  ruc: string;
  razon_social: string;
  categoria: string | null;
  email: string | null;
  telefono: string | null;
  saldo_por_pagar: string;
  estado: EstadoProveedor;
  proximo_vencimiento: string | null;
  cuenta: CuentaProveedor | null;
  cambio_de_cuenta: CambioDeCuenta | null;
}

export interface ListaProveedores {
  proveedores: Proveedor[];
  conteos: Record<FiltroProveedores, number>;
}

export interface NuevoProveedor {
  ruc: string;
  razon_social: string;
  categoria?: string | null;
  email?: string | null;
  telefono?: string | null;
}

export type ActualizarProveedor = Partial<Omit<NuevoProveedor, 'ruc'>> & { activo?: boolean };

export interface NuevaCuentaProveedor {
  banco: string;
  tipo: TipoCuenta;
  numero: string;
  titular: string;
  password: string;
}

export const proveedoresService = {
  async listar(filtro: FiltroProveedores, buscar: string): Promise<ListaProveedores> {
    const { data } = await api.get<ApiRespuesta<Proveedor[]>>('/proveedores', {
      params: { filtro, ...(buscar.trim() !== '' ? { buscar: buscar.trim() } : {}) },
    });
    const conteos = data.meta?.conteos as Record<FiltroProveedores, number> | undefined;
    return {
      proveedores: data.data,
      conteos: conteos ?? { todos: data.data.length, con_saldo: 0, cuenta_en_cambio: 0 },
    };
  },

  async crear(datos: NuevoProveedor): Promise<Proveedor> {
    const { data } = await api.post<ApiRespuesta<Proveedor>>('/proveedores', datos);
    return data.data;
  },

  async actualizar(id: number, datos: ActualizarProveedor): Promise<Proveedor> {
    const { data } = await api.patch<ApiRespuesta<Proveedor>>(`/proveedores/${id}`, datos);
    return data.data;
  },

  async cambiarCuenta(id: number, datos: NuevaCuentaProveedor): Promise<Proveedor> {
    const { data } = await api.post<ApiRespuesta<Proveedor>>(
      `/proveedores/${id}/cuenta-bancaria`,
      datos,
    );
    return data.data;
  },

  async detenerCambio(id: number): Promise<Proveedor> {
    const { data } = await api.delete<ApiRespuesta<Proveedor>>(
      `/proveedores/${id}/cuenta-bancaria/pendiente`,
    );
    return data.data;
  },
};
