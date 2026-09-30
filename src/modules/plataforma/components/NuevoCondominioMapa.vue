<template>
  <!-- Mapa ilustrativo del mockup (sin librerías de mapas): el pin se arrastra con el puntero o con las flechas -->
  <div class="mapa">
    <svg
      ref="lienzo"
      width="100%"
      height="100%"
      viewBox="0 0 800 460"
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label="Mapa de ubicación"
      @pointermove="mover"
      @pointerup="soltar"
      @pointerleave="soltar"
    >
      <rect width="800" height="460" fill="#E8EDE6" />
      <path d="M0 300 C 200 260, 380 330, 800 250" stroke="#FFFFFF" stroke-width="22" fill="none" />
      <path d="M300 0 L 360 460" stroke="#FFFFFF" stroke-width="14" fill="none" />
      <path d="M560 0 C 520 160, 600 300, 540 460" stroke="#FFFFFF" stroke-width="10" fill="none" />
      <rect x="390" y="120" width="130" height="100" rx="8" fill="#CFE0D4" />
      <rect x="120" y="340" width="150" height="80" rx="8" fill="#D9D4C4" />
      <g
        class="mapa__pin"
        :class="{ 'mapa__pin--arrastrando': arrastrando }"
        :transform="`translate(${x} ${y})`"
        tabindex="0"
        role="slider"
        aria-label="Pin de la entrada principal. Usa las flechas para moverlo."
        :aria-valuetext="`x ${Math.round(x)}, y ${Math.round(y)}`"
        @pointerdown.prevent="tomar"
        @keydown="teclado"
      >
        <path
          d="M0 -42 C -18 -42 -28 -28 -28 -16 C -28 4 0 26 0 26 C 0 26 28 4 28 -16 C 28 -28 18 -42 0 -42 Z"
          class="mapa__gota"
        />
        <circle cx="0" cy="-16" r="9" fill="#FFFFFF" />
      </g>
    </svg>
    <div class="mapa__aviso">Arrastra el pin hasta la entrada principal</div>
  </div>
</template>

<script setup lang="ts">
import { ref, useTemplateRef } from 'vue';

const props = defineProps<{ x: number; y: number }>();
const emit = defineEmits<{ mover: [x: number, y: number] }>();

const lienzo = useTemplateRef<SVGSVGElement>('lienzo');
const arrastrando = ref(false);

function limitar(valor: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, valor));
}

function tomar(evento: PointerEvent): void {
  arrastrando.value = true;
  lienzo.value?.setPointerCapture(evento.pointerId);
}

function soltar(): void {
  arrastrando.value = false;
}

function mover(evento: PointerEvent): void {
  const svg = lienzo.value;
  const matriz = svg?.getScreenCTM();
  if (!arrastrando.value || !svg || !matriz) {
    return;
  }
  const punto = new DOMPoint(evento.clientX, evento.clientY).matrixTransform(matriz.inverse());
  // El pin se toma por la punta: la punta está 26 unidades bajo el centro del grupo.
  emit('mover', limitar(punto.x, 30, 770), limitar(punto.y - 26, 44, 430));
}

function teclado(evento: KeyboardEvent): void {
  const paso = evento.shiftKey ? 20 : 5;
  const delta: Record<string, [number, number]> = {
    ArrowLeft: [-paso, 0],
    ArrowRight: [paso, 0],
    ArrowUp: [0, -paso],
    ArrowDown: [0, paso],
  };
  const d = delta[evento.key];
  if (!d) {
    return;
  }
  evento.preventDefault();
  emit('mover', limitar(props.x + d[0], 30, 770), limitar(props.y + d[1], 44, 430));
}
</script>

<style scoped>
.mapa {
  flex-grow: 1;
  border-radius: 14px;
  overflow: hidden;
  position: relative;
  background: #e8ede6;
  border: 1px solid #d6dcd2;
  min-height: 420px;
  touch-action: none;
}

.mapa svg {
  display: block;
  position: absolute;
  inset: 0;
}

.mapa__pin {
  cursor: grab;
  outline: none;
}

.mapa__pin--arrastrando {
  cursor: grabbing;
}

.mapa__gota {
  fill: var(--q-primary);
}

.mapa__pin:focus-visible .mapa__gota {
  stroke: var(--q-accent);
  stroke-width: 4;
}

.mapa__aviso {
  position: absolute;
  left: 16px;
  top: 16px;
  background: #ffffff;
  border-radius: 10px;
  padding: 8px 12px;
  font-size: 13px;
  font-weight: 700;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.12);
  pointer-events: none;
}
</style>
