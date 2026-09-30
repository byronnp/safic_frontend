// Datos de ejemplo del mockup F3GuardiaHoy.dc.html. Se reemplazan por la API cuando exista el endpoint.
// Solo llegan reservas pagadas o gratuitas: el guardia no recibe pagos.

export type ReservaHoyEstado = 'confirmada' | 'en_uso' | 'finalizada';

export interface ReservaHoy {
  id: string;
  area: string;
  hora: string;
  unidad: string;
  persona: string;
  pago: string;
  estado: ReservaHoyEstado;
}

export const RESERVAS_HOY_TURNO = {
  garita: 'Garita principal',
  turno: 'Turno día',
  fecha: 'Sáb 3 oct',
};

export const RESERVAS_HOY: ReservaHoy[] = [
  {
    id: 'c',
    area: 'Cancha múltiple',
    hora: '09:00–11:00',
    unidad: 'B-306',
    persona: 'Jorge Cevallos',
    pago: 'Gratis',
    estado: 'en_uso',
  },
  {
    id: 'b1',
    area: 'Área BBQ 1',
    hora: '12:00–16:00',
    unidad: 'A-201',
    persona: 'Fernando Salazar',
    pago: 'Uso $ 15,00 pagado',
    estado: 'confirmada',
  },
  {
    id: 'b2',
    area: 'Área BBQ 2',
    hora: '13:00–17:00',
    unidad: 'B-305',
    persona: 'Andrea Villacís',
    pago: 'Uso $ 15,00 pagado',
    estado: 'confirmada',
  },
  {
    id: 's',
    area: 'Salón comunal',
    hora: '18:00–23:00',
    unidad: 'CS-04',
    persona: 'Gabriela Torres',
    pago: 'Uso $ 50,00 y garantía $ 100,00 pagados',
    estado: 'confirmada',
  },
];

/** Reserva que el mockup muestra con el panel "Recibir área" abierto. */
export const RESERVAS_HOY_ABIERTA = 'c';

/** Descripción de daño que muestra el mockup en el campo de texto. */
export const RESERVAS_HOY_DANO_EJEMPLO = 'Silla plegable rota y mancha en el mesón.';
