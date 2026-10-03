<template>
  <!-- Escena animada del login (mockup Login): edificios con ventanas que se encienden y
       avisos de lo que hace SAFIC. Solo CSS; se detiene con "reducir movimiento". -->
  <svg
    class="escena"
    viewBox="0 0 832 340"
    fill="none"
    role="img"
    aria-label="Edificios del condominio con avisos de pagos recibidos, conciliación con el banco y cuotas generadas"
  >
    <line x1="0" :y1="SUELO" x2="832" :y2="SUELO" class="escena__borde" stroke-width="2" />

    <g v-for="edificio in EDIFICIOS" :key="edificio.x">
      <rect
        :x="edificio.x"
        :y="edificio.y"
        :width="edificio.ancho"
        :height="SUELO - edificio.y"
        rx="4"
        class="escena__edificio"
        stroke-width="2"
      />
    </g>
    <rect
      v-for="(ventana, i) in VENTANAS"
      :key="i"
      :x="ventana.x"
      :y="ventana.y"
      width="16"
      height="20"
      rx="2"
      :class="ventana.encendida ? 'escena__ventana escena__ventana--viva' : 'escena__ventana'"
      :style="
        ventana.encendida
          ? { animationDelay: `${ventana.retraso}s`, animationDuration: `${ventana.duracion}s` }
          : undefined
      "
    />

    <path
      v-for="(aviso, i) in AVISOS"
      :key="`flujo-${i}`"
      :d="`M452 230 C 478 230, 478 ${aviso.y + 36}, 500 ${aviso.y + 36}`"
      class="escena__flujo"
      stroke-width="2"
      stroke-linecap="round"
      :style="{ animationDelay: `${i * 0.6}s` }"
    />

    <g v-for="aviso in AVISOS" :key="aviso.titulo" :transform="`translate(500 ${aviso.y})`">
      <g class="escena__aviso" :style="{ animationDelay: `${aviso.retraso}s` }">
        <rect width="300" height="72" rx="14" class="escena__tarjeta" stroke-width="1.5" />
        <circle cx="36" cy="36" r="18" class="escena__insignia" />
        <path
          :d="aviso.icono"
          class="escena__icono"
          stroke-width="2.6"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <text x="66" y="31" class="escena__titulo">{{ aviso.titulo }}</text>
        <text x="66" y="51" class="escena__detalle">{{ aviso.detalle }}</text>
        <text v-if="aviso.monto" x="284" y="44" text-anchor="end" class="escena__monto">
          {{ aviso.monto }}
        </text>
      </g>
    </g>
  </svg>
</template>

<script setup lang="ts">
import { EDIFICIOS, SUELO, ventanas } from './escena';

const VENTANAS = ventanas();

const AVISOS = [
  {
    y: 40,
    titulo: 'Pago recibido',
    detalle: 'A-102 · Transferencia',
    monto: '$ 160,00',
    retraso: 0,
    icono: 'M28 36l6 6 11-12',
  },
  {
    y: 140,
    titulo: 'Conciliado con el banco',
    detalle: 'Banco Pichincha · 18 sep',
    monto: '',
    retraso: 1.4,
    icono: 'M26 32h20M28 32v10M33 32v10M39 32v10M44 32v10M25 44h22M36 25l11 6H25z',
  },
  {
    y: 240,
    titulo: 'Cuotas de octubre',
    detalle: '148 unidades generadas',
    monto: '',
    retraso: 2.8,
    icono: 'M30 25h9l5 5v15H30zM34 34h7M34 39h7',
  },
] as const;
</script>

<style scoped>
.escena {
  width: 100%;
  height: auto;
  max-height: 100%;
  font-family: inherit;
}

.escena__borde {
  stroke: #2c6461;
}

.escena__edificio {
  fill: #18403e;
  stroke: #2c6461;
}

.escena__ventana {
  fill: #24524f;
}

.escena__ventana--viva {
  fill: var(--q-accent);
  animation-name: encender;
  animation-iteration-count: infinite;
  animation-timing-function: ease-in-out;
}

.escena__flujo {
  stroke: var(--q-accent);
  stroke-dasharray: 4 10;
  animation: fluir 1.6s linear infinite;
}

.escena__aviso {
  animation: aparecer 9s ease-out infinite both;
}

.escena__tarjeta {
  fill: #1b4341;
  stroke: #2c6461;
}

.escena__insignia {
  fill: var(--q-accent);
}

.escena__icono {
  stroke: var(--safic-tinta);
  fill: none;
}

.escena__titulo {
  font-size: 15px;
  font-weight: 700;
  fill: #ffffff;
}

.escena__detalle {
  font-size: 13px;
  font-weight: 600;
  fill: #b9cdc9;
}

.escena__monto {
  font-size: 16px;
  font-weight: 800;
  fill: #ffffff;
}

@keyframes encender {
  0%,
  100% {
    opacity: 0.95;
  }
  45%,
  55% {
    opacity: 0.25;
  }
}

@keyframes fluir {
  to {
    stroke-dashoffset: -28;
  }
}

@keyframes aparecer {
  0% {
    opacity: 0;
    transform: translateY(14px);
  }
  8%,
  86% {
    opacity: 1;
    transform: translateY(0);
  }
  96%,
  100% {
    opacity: 0;
    transform: translateY(-6px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .escena *,
  .escena__aviso {
    animation: none !important;
  }
}
</style>
