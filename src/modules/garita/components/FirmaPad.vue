<template>
  <div class="firma">
    <canvas
      ref="lienzo"
      class="firma__lienzo"
      width="600"
      height="220"
      role="img"
      aria-label="Espacio para la firma de quien retira"
      @pointerdown="empezar"
      @pointermove="trazar"
      @pointerup="terminar"
      @pointerleave="terminar"
      @pointercancel="terminar"
    />
    <div class="firma__pie">
      <span class="firma__ayuda">{{
        conTrazo ? 'Firma registrada' : 'Firma aquí con el dedo'
      }}</span>
      <button type="button" class="firma__borrar" @click="limpiar">Borrar</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';

/** Espacio para firmar con el dedo o el lápiz. Entrega la firma como una imagen PNG. */
const emit = defineEmits<{ cambio: [conTrazo: boolean] }>();

const lienzo = ref<HTMLCanvasElement | null>(null);
const conTrazo = ref(false);
let dibujando = false;

function contexto(): CanvasRenderingContext2D | null {
  return lienzo.value?.getContext('2d') ?? null;
}

function punto(e: PointerEvent): { x: number; y: number } {
  const c = lienzo.value;
  if (!c) return { x: 0, y: 0 };
  const r = c.getBoundingClientRect();
  return {
    x: ((e.clientX - r.left) * c.width) / r.width,
    y: ((e.clientY - r.top) * c.height) / r.height,
  };
}

function preparar(): void {
  const ctx = contexto();
  if (!ctx) return;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 600, 220);
  ctx.strokeStyle = '#1c1b18';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
}

onMounted(preparar);

function empezar(e: PointerEvent): void {
  const ctx = contexto();
  if (!ctx) return;
  lienzo.value?.setPointerCapture(e.pointerId);
  dibujando = true;
  const p = punto(e);
  ctx.beginPath();
  ctx.moveTo(p.x, p.y);
  // Un toque sin movimiento también deja un punto
  ctx.lineTo(p.x + 0.1, p.y + 0.1);
  ctx.stroke();
}

function trazar(e: PointerEvent): void {
  if (!dibujando) return;
  const ctx = contexto();
  if (!ctx) return;
  const p = punto(e);
  ctx.lineTo(p.x, p.y);
  ctx.stroke();
  if (!conTrazo.value) {
    conTrazo.value = true;
    emit('cambio', true);
  }
}

function terminar(): void {
  dibujando = false;
}

function limpiar(): void {
  preparar();
  conTrazo.value = false;
  emit('cambio', false);
}

/** La firma como imagen PNG, o null si no hay trazo. */
function aArchivo(): Promise<File | null> {
  const c = lienzo.value;
  if (!c || !conTrazo.value) return Promise.resolve(null);
  return new Promise((resolver) => {
    c.toBlob(
      (blob) => resolver(blob ? new File([blob], 'firma.png', { type: 'image/png' }) : null),
      'image/png',
    );
  });
}

defineExpose({ aArchivo, limpiar });
</script>

<style scoped>
.firma__lienzo {
  width: 100%;
  height: 110px;
  border: 1px dashed var(--safic-borde-2);
  border-radius: 10px;
  background: #ffffff;
  touch-action: none;
  cursor: crosshair;
}

.firma__pie {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 4px;
}

.firma__ayuda {
  font-size: 12px;
  color: var(--safic-texto-suave);
}

.firma__borrar {
  min-height: 44px;
  padding: 0 12px;
  border: none;
  background: transparent;
  color: var(--q-primary);
  font-family: inherit;
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
}
</style>
