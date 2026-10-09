import type { ResultadoImportacion } from './services/unidades.service';

/** Nombre de cada campo del Excel tal como lo ve la persona (títulos de la plantilla). */
const ETIQUETAS_CAMPO: Record<string, string> = {
  codigo: 'Código',
  bloque: 'Bloque',
  tipo: 'Tipo',
  piso: 'Piso',
  area_m2: 'Área (m²)',
  alicuota: 'Alícuota',
  cuota_mensual: 'Cuota mensual',
  valor_personalizado: 'Valor personalizado',
  responsable_pago: 'Responsable de pago',
};

export function etiquetaCampo(campo: string): string {
  return ETIQUETAS_CAMPO[campo] ?? campo;
}

/**
 * Solo se permite crear cuando la vista previa no tiene errores, hay al menos una
 * unidad y alcanza el total contratado. La API lo vuelve a exigir.
 */
export function puedeConfirmarImportacion(vista: ResultadoImportacion | null): boolean {
  return !!vista && vista.con_errores === 0 && vista.validas > 0 && vista.cupo.alcanza;
}

/** Texto de la vista previa cuando no se puede confirmar, o null si todo está bien. */
export function motivoSinConfirmar(vista: ResultadoImportacion): string | null {
  if (vista.total_filas === 0) {
    return 'El archivo no tiene unidades. Llena la plantilla desde la fila 2.';
  }
  if (vista.con_errores > 0) {
    return 'Corrige las filas con error en el Excel y vuelve a revisar el archivo.';
  }
  if (!vista.cupo.alcanza) {
    const libres = Math.max(vista.cupo.total - vista.cupo.registradas, 0);
    return `Solo quedan ${libres} unidades por registrar de ${vista.cupo.total} contratadas y el archivo trae ${vista.cupo.nuevas}. Solicita un aumento o reduce el archivo.`;
  }
  return null;
}

/** "1 unidad" / "12 unidades". */
export function cantidadUnidades(cantidad: number): string {
  return `${cantidad} ${cantidad === 1 ? 'unidad' : 'unidades'}`;
}
