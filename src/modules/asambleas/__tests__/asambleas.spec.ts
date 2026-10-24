import { afterEach, describe, expect, it, vi } from 'vitest';

import { api } from '@/core/api/client';

import {
  aSolicitudAsamblea,
  aSolicitudPunto,
  ahoraLocal,
  asambleaVacia,
  diaCorto,
  fechaHoraLarga,
  formularioDePunto,
  mensajeAnticipacion,
  normalizarUmbral,
  porcentaje,
  puntoVacio,
  textoMayoria,
  validarAsamblea,
  validarPunto,
} from '../asambleas.logica';
import { clavesAsambleas } from '../composables/useAsambleas';
import {
  asambleasService,
  type AnticipacionConvocatoria,
  type PuntoAsamblea,
} from '../services/asambleas.service';

afterEach(() => vi.restoreAllMocks());

const AHORA = '2026-10-01T10:00';
const valida = () => ({
  ...asambleaVacia(),
  titulo: 'Asamblea ordinaria 2026',
  fechaHora: '2026-10-17T19:00',
  lugar: 'Salón comunal',
});

describe('asamblea: formulario', () => {
  it('una asamblea presencial completa es válida', () => {
    expect(validarAsamblea(valida(), false, AHORA)).toEqual({});
  });

  it('pide título, fecha futura y lugar', () => {
    const e = validarAsamblea({ ...asambleaVacia() }, false, AHORA);
    expect(e.titulo).toBeDefined();
    expect(e.fechaHora).toBeDefined();
    expect(e.lugar).toBeDefined();

    expect(
      validarAsamblea({ ...valida(), fechaHora: '2026-09-30T19:00' }, false, AHORA).fechaHora,
    ).toMatch(/futuras/);
    expect(validarAsamblea({ ...valida(), titulo: 'ab' }, false, AHORA).titulo).toBeDefined();
  });

  it('virtual o mixta solo si el reglamento lo permite, y piden un enlace https', () => {
    const mixta = {
      ...valida(),
      modalidad: 'mixta' as const,
      enlaceVideo: 'https://meet.example.com/a',
    };

    expect(validarAsamblea(mixta, false, AHORA).modalidad).toMatch(/no permite/);
    expect(validarAsamblea(mixta, true, AHORA)).toEqual({});
    expect(validarAsamblea({ ...mixta, enlaceVideo: '' }, true, AHORA).enlaceVideo).toMatch(
      /enlace/,
    );
    expect(
      validarAsamblea({ ...mixta, enlaceVideo: 'http://x.com' }, true, AHORA).enlaceVideo,
    ).toMatch(/https/);
    // Virtual no necesita lugar
    expect(validarAsamblea({ ...mixta, modalidad: 'virtual', lugar: '' }, true, AHORA)).toEqual({});
  });

  it('arma la solicitud: sin enlace en una presencial y con el lugar recortado', () => {
    expect(
      aSolicitudAsamblea({
        ...valida(),
        titulo: '  Asamblea  ',
        lugar: ' Salón ',
        enlaceVideo: 'https://x.com',
      }),
    ).toEqual({
      titulo: 'Asamblea',
      tipo: 'ordinaria',
      modalidad: 'presencial',
      fecha_hora: '2026-10-17T19:00',
      lugar: 'Salón',
      enlace_video: null,
    });
  });

  it('la hora de ahora en Ecuador (UTC-5) como la pide el campo de fecha', () => {
    expect(ahoraLocal(new Date('2026-10-01T15:30:00Z'))).toBe('2026-10-01T10:30');
    // A las 02:00 UTC todavía es el día anterior en Ecuador
    expect(ahoraLocal(new Date('2026-10-02T02:00:00Z'))).toBe('2026-10-01T21:00');
  });
});

describe('asamblea: puntos del orden del día', () => {
  const punto = (cambios: Partial<ReturnType<typeof puntoVacio>>) => ({
    ...puntoVacio(),
    titulo: 'Aprobación de estados',
    ...cambios,
  });

  it('un informativo o una votación simple no piden porcentaje', () => {
    expect(validarPunto(punto({ tipo: 'informativo' }), null)).toEqual({});
    expect(validarPunto(punto({ tipo: 'votacion', mayoria: 'simple' }), null)).toEqual({});
    expect(validarPunto(punto({ titulo: 'ab' }), null).titulo).toBeDefined();
  });

  it('una mayoría calificada necesita su porcentaje (mayor que 50 y hasta 100)', () => {
    const c = punto({ tipo: 'votacion', mayoria: 'calificada' });

    expect(validarPunto(c, null).umbral).toBeDefined();
    expect(validarPunto({ ...c, umbral: '60' }, null)).toEqual({});
    for (const malo of ['50', '101', 'abc', '66.666']) {
      expect(validarPunto({ ...c, umbral: malo }, null).umbral).toBeDefined();
    }
  });

  it('la reforma del reglamento toma el porcentaje de las reglas del condominio, y si no hay, lo exige', () => {
    const r = punto({ tipo: 'reforma_reglamento' });

    expect(validarPunto(r, null).umbral).toMatch(/asesoría legal/);
    expect(validarPunto(r, '66.67')).toEqual({});
    expect(validarPunto({ ...r, umbral: '75' }, null)).toEqual({});
  });

  it('arma la solicitud de cada tipo de punto', () => {
    expect(aSolicitudPunto(punto({ tipo: 'informativo' }))).toMatchObject({
      mayoria: null,
      umbral_pct: null,
      base: null,
    });
    expect(aSolicitudPunto(punto({ tipo: 'votacion' }))).toMatchObject({
      mayoria: 'simple',
      umbral_pct: null,
    });
    expect(
      aSolicitudPunto(
        punto({ tipo: 'votacion', mayoria: 'calificada', umbral: '60,5', base: 'presentes' }),
      ),
    ).toMatchObject({
      mayoria: 'calificada',
      umbral_pct: 60.5,
      base: 'presentes',
    });
    // La reforma siempre es sobre el total; sin porcentaje escrito, lo pone el servidor desde las reglas
    expect(aSolicitudPunto(punto({ tipo: 'reforma_reglamento', base: 'presentes' }))).toMatchObject(
      {
        mayoria: 'calificada',
        umbral_pct: null,
        base: 'total',
      },
    );
  });

  it('normaliza el porcentaje', () => {
    expect(normalizarUmbral('66,67')).toBe(66.67);
    expect(normalizarUmbral(' 75 ')).toBe(75);
    expect(normalizarUmbral('50')).toBeNull();
    expect(normalizarUmbral('')).toBeNull();
  });

  it('rellena el formulario con un punto que ya existe', () => {
    const p: PuntoAsamblea = {
      id: 1,
      orden: 1,
      titulo: 'Presupuesto',
      descripcion: null,
      tipo: 'votacion',
      mayoria: 'calificada',
      umbral_pct: '60.00',
      base: 'presentes',
      adjunto_nombre: null,
      adjunto_url: null,
    };

    expect(formularioDePunto(p)).toMatchObject({
      mayoria: 'calificada',
      umbral: '60',
      base: 'presentes',
      descripcion: '',
    });
  });

  it('dice cómo se decide cada punto, como en el mockup', () => {
    const base = { umbral_pct: null, base: null };

    expect(textoMayoria({ ...base, mayoria: 'ninguna' })).toBe('—');
    expect(textoMayoria({ ...base, mayoria: 'simple', base: 'presentes' })).toBe(
      'Simple · presentes',
    );
    expect(textoMayoria({ mayoria: 'calificada', umbral_pct: '66.67', base: 'total' })).toBe(
      '66,67 % · total',
    );
  });
});

describe('asamblea: textos', () => {
  const anticipacion = (c: Partial<AnticipacionConvocatoria> = {}): AnticipacionConvocatoria => ({
    cumple: true,
    minimo: 8,
    dias_habiles: 12,
    ultimo_dia: '2026-10-06',
    feriados: [],
    segunda_convocatoria: '20:00',
    ...c,
  });

  it('el aviso de anticipación del mockup, con el feriado descontado', () => {
    expect(
      mensajeAnticipacion(
        anticipacion({ feriados: [{ fecha: '2026-10-09', nombre: 'Independencia de Guayaquil' }] }),
      ),
    ).toBe(
      'Cumple la anticipación legal: hay que convocar a más tardar el mar 6 oct (8 días hábiles, descontando el feriado del 9 de octubre, Art. 37). Segunda convocatoria automática a las 20:00.',
    );
    expect(mensajeAnticipacion(anticipacion())).not.toContain('descontando');
  });

  it('varios feriados y el caso en que ya no se llega a tiempo', () => {
    const dos = mensajeAnticipacion(
      anticipacion({
        feriados: [
          { fecha: '2026-11-02', nombre: 'a' },
          { fecha: '2026-11-03', nombre: 'b' },
        ],
      }),
    );
    expect(dos).toContain('descontando los feriados del 2 de noviembre y 3 de noviembre');
    expect(mensajeAnticipacion(anticipacion({ cumple: false }))).toMatch(
      /Ya no hay 8 días hábiles/,
    );
  });

  it('fechas sin depender de la zona del navegador', () => {
    expect(diaCorto('2026-10-17')).toBe('sáb 17 oct');
    expect(fechaHoraLarga('2026-10-17T19:00')).toBe('sáb 17 oct 2026 · 19:00');
    expect(porcentaje('100')).toBe('100,00 %');
  });
});

describe('asamblea: servicio y caché', () => {
  it('las claves llevan el condominio', () => {
    expect(clavesAsambleas.lista(7, null)).toEqual(['asambleas', 7, 'lista', null]);
    expect(clavesAsambleas.detalle(7, 3)).toEqual(['asambleas', 7, 'detalle', 3]);
    expect(clavesAsambleas.todas(7)).toEqual(['asambleas', 7]);
  });

  it('usa las rutas del contrato', async () => {
    const get = vi.spyOn(api, 'get').mockResolvedValue({ data: { data: {} } });
    const post = vi.spyOn(api, 'post').mockResolvedValue({ data: { data: {} } });
    const patch = vi.spyOn(api, 'patch').mockResolvedValue({ data: { data: {} } });
    const del = vi.spyOn(api, 'delete').mockResolvedValue({ data: { data: {} } });
    const put = vi.spyOn(api, 'put').mockResolvedValue({ data: { data: {} } });
    const datos = aSolicitudAsamblea({
      ...asambleaVacia(),
      titulo: 'x',
      fechaHora: '2026-10-17T19:00',
      lugar: 'y',
    });
    const punto = aSolicitudPunto(puntoVacio());

    await asambleasService.lista('borrador');
    await asambleasService.ver(4);
    await asambleasService.padron();
    await asambleasService.anticipacion('2026-10-17T19:00');
    await asambleasService.crear(datos);
    await asambleasService.actualizar(4, datos);
    await asambleasService.descartar(4);
    await asambleasService.agregarPunto(4, punto);
    await asambleasService.editarPunto(4, 9, punto);
    await asambleasService.quitarPunto(4, 9);
    await asambleasService.moverPunto(4, 9, 'sube');
    await asambleasService.quitarInforme(4, 9);
    await asambleasService.configuracion();

    expect(get).toHaveBeenCalledWith('/asambleas', { params: { estado: 'borrador' } });
    expect(get).toHaveBeenCalledWith('/asambleas/4');
    expect(get).toHaveBeenCalledWith('/asambleas/padron');
    expect(get).toHaveBeenCalledWith('/asambleas/anticipacion', {
      params: { fecha_hora: '2026-10-17T19:00' },
    });
    expect(post).toHaveBeenCalledWith('/asambleas', datos);
    expect(patch).toHaveBeenCalledWith('/asambleas/4', datos);
    expect(del).toHaveBeenCalledWith('/asambleas/4');
    expect(post).toHaveBeenCalledWith('/asambleas/4/puntos', punto);
    expect(patch).toHaveBeenCalledWith('/asambleas/4/puntos/9', punto);
    expect(del).toHaveBeenCalledWith('/asambleas/4/puntos/9');
    expect(post).toHaveBeenCalledWith('/asambleas/4/puntos/9/mover', { direccion: 'sube' });
    expect(del).toHaveBeenCalledWith('/asambleas/4/puntos/9/adjunto');
    expect(get).toHaveBeenCalledWith('/asambleas/configuracion');
    expect(put).not.toHaveBeenCalled();
  });

  it('el informe se sube como formulario', async () => {
    const post = vi.spyOn(api, 'post').mockResolvedValue({ data: { data: {} } });
    const archivo = new File(['x'], 'informe.pdf', { type: 'application/pdf' });

    await asambleasService.adjuntarInforme(4, 9, archivo);

    const [ruta, cuerpo] = post.mock.calls[0] as [string, FormData];
    expect(ruta).toBe('/asambleas/4/puntos/9/adjunto');
    expect(cuerpo.get('archivo')).toBe(archivo);
  });
});
