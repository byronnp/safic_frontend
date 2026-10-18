import { describe, expect, it, vi } from 'vitest';

import { invalidarPorAviso, invalidarTodo, type ConsultasPorRecurso } from '../avisos';

const consultas: ConsultasPorRecurso = {
  uno: (c) => [
    ['uno', c],
    ['otro', c, 'x'],
  ],
  dos: (c) => [['dos', c]],
};

function falso() {
  return { invalidateQueries: vi.fn().mockResolvedValue(undefined) };
}

describe('avisos en vivo → consultas', () => {
  it('invalida las consultas del recurso en el condominio indicado', () => {
    const qc = falso();
    invalidarPorAviso(consultas, { recurso: 'uno', id: 4 }, 7, qc);

    expect(qc.invalidateQueries.mock.calls.map(([f]) => f)).toEqual([
      { queryKey: ['uno', 7] },
      { queryKey: ['otro', 7, 'x'] },
    ]);
  });

  it('un recurso desconocido se ignora', () => {
    const qc = falso();
    invalidarPorAviso(consultas, { recurso: 'nuevo', id: null }, 7, qc);

    expect(qc.invalidateQueries).not.toHaveBeenCalled();
  });

  it('tras una caída se refrescan todos los recursos', () => {
    const qc = falso();
    invalidarTodo(consultas, 7, qc);

    expect(qc.invalidateQueries).toHaveBeenCalledTimes(3);
  });
});
