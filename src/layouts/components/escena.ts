/** Datos de la escena animada del login (AuthEscena.vue). */
export const SUELO = 328;

export const EDIFICIOS = [
  { x: 40, y: 130, ancho: 120 },
  { x: 180, y: 50, ancho: 150 },
  { x: 350, y: 160, ancho: 100 },
] as const;

export interface Ventana {
  x: number;
  y: number;
  encendida: boolean;
  retraso: number;
  duracion: number;
}

/** Pseudoaleatorio con semilla fija: la escena se ve igual en cada carga (y en las pruebas). */
function generador(semilla: number): () => number {
  let estado = semilla;
  return () => {
    estado = (estado * 1103515245 + 12345) % 2147483648;
    return estado / 2147483648;
  };
}

export function ventanas(): Ventana[] {
  const azar = generador(7);
  const lista: Ventana[] = [];
  for (const { x, y, ancho } of EDIFICIOS) {
    const columnas = Math.max(2, Math.floor((ancho - 24) / 30));
    const filas = Math.floor((SUELO - y - 40) / 34);
    const hueco = (ancho - columnas * 16) / (columnas + 1);
    for (let f = 0; f < filas; f++) {
      for (let c = 0; c < columnas; c++) {
        lista.push({
          x: Math.round(x + hueco + c * (16 + hueco)),
          y: y + 22 + f * 34,
          encendida: azar() < 0.45,
          retraso: Math.round(azar() * 60) / 10,
          duracion: 3.5 + Math.round(azar() * 35) / 10,
        });
      }
    }
  }
  return lista;
}
