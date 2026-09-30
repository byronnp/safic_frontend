<template>
  <div class="app-pagina mi-cuenta">
    <AppEncabezado
      class="mi-cuenta-encabezado"
      :antetitulo="encabezado"
      titulo="Mi cuenta"
      solapado
    />

    <section class="app-tarjeta app-tarjeta-solapada mi-cuenta-total" aria-label="Total pendiente">
      <div class="mi-cuenta-total__etiqueta">Total pendiente</div>
      <div class="mi-cuenta-total__fila">
        <div class="mi-cuenta-total__valor">{{ formatoMoneda(totalPendiente) }}</div>
        <EstadoBadge v-if="vencidas > 0" tono="error">
          {{ vencidas }} {{ vencidas === 1 ? 'vencida' : 'vencidas' }}
        </EstadoBadge>
      </div>
      <router-link :to="{ name: 'app-pagar' }" class="mi-cuenta-pagar">Pagar</router-link>
    </section>

    <div class="app-cuerpo mi-cuenta-cuerpo">
      <h2 class="mi-cuenta-titulo">Cuotas</h2>
      <div class="app-tarjeta">
        <div v-for="cuota in cuotas" :key="cuota.id" class="mi-cuenta-fila">
          <div class="col-grow">
            <div class="mi-cuenta-fila__titulo">{{ cuota.mes }}</div>
            <div
              class="mi-cuenta-fila__nota"
              :class="{ 'mi-cuenta-fila__nota--vencida': cuota.vencida }"
            >
              {{ cuota.nota }}
            </div>
          </div>
          <div class="mi-cuenta-fila__monto">{{ formatoMoneda(cuota.monto) }}</div>
        </div>
      </div>

      <h2 class="mi-cuenta-titulo mi-cuenta-titulo--separado">Pagos y recibos</h2>
      <div class="app-tarjeta">
        <div v-for="recibo in recibos" :key="recibo.id" class="mi-cuenta-fila">
          <div class="col-grow">
            <div class="mi-cuenta-fila__titulo">
              {{ recibo.mes }} · {{ formatoMoneda(recibo.monto) }}
            </div>
            <div class="mi-cuenta-fila__nota">
              Recibo N.º {{ recibo.numero }} · {{ recibo.fecha }}
            </div>
          </div>
          <button
            type="button"
            class="mi-cuenta-enlace"
            :aria-label="`Descargar recibo N.º ${recibo.numero} en PDF`"
            @click="descargar(recibo.numero)"
          >
            PDF
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import { computed } from 'vue';

import AppEncabezado from '@/components/app/AppEncabezado.vue';
import EstadoBadge from '@/components/EstadoBadge.vue';
import { formatoMoneda } from '@/utils/formato';

import { MI_CUENTA_CUOTAS, MI_CUENTA_ENCABEZADO, MI_CUENTA_RECIBOS } from '../demo/miCuenta';

const $q = useQuasar();

const encabezado = MI_CUENTA_ENCABEZADO;
const cuotas = MI_CUENTA_CUOTAS;
const recibos = MI_CUENTA_RECIBOS;

// Suma en centavos para no acumular errores de punto flotante.
const totalPendiente = computed(
  () => cuotas.reduce((suma, cuota) => suma + Math.round(Number(cuota.monto) * 100), 0) / 100,
);

const vencidas = computed(() => cuotas.filter((cuota) => cuota.vencida).length);

function descargar(numero: string): void {
  $q.notify({
    type: 'info',
    message: `El recibo N.º ${numero} se descargará cuando exista la API.`,
  });
}
</script>

<style scoped>
/* Los mockups usan el interlineado normal del navegador. */
.mi-cuenta {
  line-height: normal;
}

.app-pagina .mi-cuenta-encabezado {
  padding-top: 26px;
  padding-bottom: 60px;
}

.mi-cuenta-encabezado :deep(.app-encabezado__titulo) {
  margin-top: 4px;
}

.app-tarjeta.mi-cuenta-total {
  margin-top: -40px;
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.mi-cuenta-total__etiqueta {
  font-size: 13px;
  color: var(--safic-texto-suave);
  font-weight: 600;
}

.mi-cuenta-total__fila {
  display: flex;
  align-items: baseline;
  gap: 10px;
}

.mi-cuenta-total__valor {
  font-size: 34px;
  font-weight: 800;
  letter-spacing: -0.5px;
}

.mi-cuenta-pagar {
  height: 50px;
  border-radius: 12px;
  background: var(--q-primary);
  color: #ffffff;
  font-size: 16px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
}

.mi-cuenta-pagar:hover {
  color: #ffffff;
  filter: brightness(0.92);
}

.app-cuerpo.mi-cuenta-cuerpo {
  padding: 18px 16px;
  gap: 10px;
}

.mi-cuenta-titulo {
  margin: 0;
  font-size: 15px;
  font-weight: 800;
  line-height: normal;
  letter-spacing: normal;
}

.mi-cuenta-titulo--separado {
  margin-top: 6px;
}

.mi-cuenta-fila {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
}

.mi-cuenta-fila + .mi-cuenta-fila {
  border-top: 1px solid var(--safic-linea-2);
}

.mi-cuenta-fila__titulo {
  font-size: 14px;
  font-weight: 700;
}

.mi-cuenta-fila__nota {
  font-size: 12px;
  color: var(--safic-texto-suave);
}

.mi-cuenta-fila__nota--vencida {
  color: #9b1c12;
  font-weight: 600;
}

.mi-cuenta-fila__monto {
  font-size: 15px;
  font-weight: 800;
}

/* Enlace de texto con área táctil de 44px sin cambiar el alto visible. */
.mi-cuenta-enlace {
  position: relative;
  border: none;
  background: transparent;
  padding: 10px 0;
  font-family: inherit;
  font-size: 14px;
  font-weight: 700;
  color: var(--q-primary);
  cursor: pointer;
}

.mi-cuenta-enlace::after {
  content: '';
  position: absolute;
  inset: -2px -10px;
}
</style>
