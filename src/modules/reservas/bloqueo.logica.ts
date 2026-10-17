export interface FormularioBloqueo {
  areaId: number | null;
  fecha: string;
  todoElDia: boolean;
  inicio: string;
  fin: string;
  motivo: string;
}

export type ErroresBloqueo = Partial<
  Record<'areaId' | 'fecha' | 'inicio' | 'fin' | 'motivo', string | undefined>
>;

export function validarBloqueo(f: FormularioBloqueo, hoy: string): ErroresBloqueo {
  const errores: ErroresBloqueo = {};
  if (f.areaId === null) errores.areaId = 'Elige el área.';
  if (f.fecha === '') errores.fecha = 'Elige la fecha.';
  else if (f.fecha < hoy) errores.fecha = 'No se puede bloquear un día que ya pasó.';
  if (!f.todoElDia) {
    if (f.inicio === '') errores.inicio = 'Indica la hora de inicio.';
    if (f.fin === '') errores.fin = 'Indica la hora de fin.';
    if (!errores.inicio && !errores.fin && f.inicio >= f.fin) {
      errores.fin = 'La hora de fin debe ser posterior a la de inicio.';
    }
  }
  if (f.motivo.trim().length < 3) errores.motivo = 'Escribe el motivo del bloqueo.';
  return errores;
}
