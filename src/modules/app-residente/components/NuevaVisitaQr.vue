<template>
  <!--
    PENDIENTE: este QR es decorativo (mismo patrón que el mockup F4NuevaVisita).
    El código real se generará con el token que devuelva la API de visitas.
  -->
  <svg
    role="img"
    :aria-label="etiqueta"
    :width="TAMANO * celda"
    :height="TAMANO * celda"
    :viewBox="`0 0 ${TAMANO} ${TAMANO}`"
    shape-rendering="crispEdges"
    class="nueva-visita-qr"
  >
    <rect :width="TAMANO" :height="TAMANO" fill="#FFFFFF" />
    <rect
      v-for="c in celdas"
      :key="c.clave"
      :x="c.x"
      :y="c.y"
      width="1"
      height="1"
      fill="#1C1B18"
    />
  </svg>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ etiqueta?: string; celda?: number }>(), {
  etiqueta: 'Código QR de la visita',
  celda: 9,
});

const TAMANO = 21;
const ESQUINAS: ReadonlyArray<readonly [number, number]> = [
  [0, 0],
  [0, 14],
  [14, 0],
];

/** 1 = módulo oscuro del patrón de esquina, 0 = claro, -1 = fuera de las esquinas. */
function esquina(fila: number, columna: number): number {
  for (const [f0, c0] of ESQUINAS) {
    const y = fila - f0;
    const x = columna - c0;
    if (y >= 0 && y < 7 && x >= 0 && x < 7) {
      const borde = y === 0 || y === 6 || x === 0 || x === 6;
      const centro = y >= 2 && y <= 4 && x >= 2 && x <= 4;
      return borde || centro ? 1 : 0;
    }
    if (y >= -1 && y <= 7 && x >= -1 && x <= 7) {
      return 0;
    }
  }
  return -1;
}

const celdas: { clave: string; x: number; y: number }[] = [];
for (let fila = 0; fila < TAMANO; fila++) {
  for (let columna = 0; columna < TAMANO; columna++) {
    const e = esquina(fila, columna);
    const oscuro = e === -1 ? (fila * 7 + columna * 13 + fila * columna) % 5 < 2 : e === 1;
    if (oscuro) {
      celdas.push({ clave: `${fila}-${columna}`, x: columna, y: fila });
    }
  }
}
</script>

<style scoped>
.nueva-visita-qr {
  display: block;
  flex-shrink: 0;
}
</style>
