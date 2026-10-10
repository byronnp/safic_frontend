<template>
  <q-page class="safic-main apr">
    <PaginaEncabezado
      miga="Finanzas / Aprobaciones"
      titulo="Aprobaciones pendientes"
      :subtitulo="subtitulo"
    />

    <div v-if="resultado" class="apr__resultado" role="status">{{ resultado }}</div>

    <div role="tablist" aria-label="Estado de las aprobaciones" class="apr__pildoras">
      <button
        v-for="t in TABS"
        :key="t.filtro"
        type="button"
        role="tab"
        class="safic-pildora"
        :class="{ 'safic-pildora--activa': t.filtro === filtro }"
        :aria-selected="t.filtro === filtro"
        @click="cambiar(t.filtro)"
      >
        {{ t.etiqueta }}{{ t.filtro === 'por_aprobar' ? ` (${filas.length})` : '' }}
      </button>
    </div>

    <div v-if="consulta.isError.value" class="safic-alerta" role="alert">
      {{ consulta.error.value?.mensaje }}
      <q-btn flat no-caps dense label="Reintentar" @click="consulta.refetch()" />
    </div>

    <div class="apr__cuerpo">
      <section class="apr__lista" aria-label="Facturas">
        <div v-if="consulta.isPending.value" aria-busy="true">
          <q-skeleton v-for="i in 3" :key="i" type="rect" height="84px" class="q-mb-sm" />
        </div>
        <template v-else>
          <button
            v-for="g in filas"
            :key="g.id"
            type="button"
            class="safic-card apr__tarjeta"
            :class="{ 'apr__tarjeta--activa': g.id === seleccionadaId }"
            :aria-pressed="g.id === seleccionadaId"
            @click="seleccionadaId = g.id"
          >
            <div class="apr__tarjeta-cab">
              <strong>{{ g.proveedor.razon_social }}</strong>
              <span class="apr__monto">{{ formatoMoneda(g.total) }}</span>
            </div>
            <div class="apr__sub">{{ g.descripcion ?? g.categoria ?? g.numero }}</div>
            <div class="apr__sub">{{ textoVence(g) }}</div>
          </button>

          <div v-if="filas.length === 0" class="safic-card apr__vacio">
            <q-icon name="sym_r_task_alt" size="40px" class="text-suave" />
            <div class="text-weight-bold">{{ vacio.titulo }}</div>
            <div class="text-suave">{{ vacio.detalle }}</div>
          </div>
        </template>
      </section>

      <aside v-if="seleccionada" class="safic-card apr__detalle" aria-labelledby="apr-detalle">
        <div>
          <EstadoBadge :tono="estadoVisualGasto(seleccionada).tono">
            {{ estadoVisualGasto(seleccionada).texto }}
          </EstadoBadge>
          <h2 id="apr-detalle" class="apr__titulo">Factura {{ seleccionada.numero }}</h2>
          <div class="apr__sub">{{ seleccionada.descripcion ?? seleccionada.categoria }}</div>
        </div>

        <dl class="apr__valores">
          <dt>Proveedor</dt>
          <dd>{{ seleccionada.proveedor.razon_social }} · RUC {{ seleccionada.proveedor.ruc }}</dd>
          <dt>Categoría</dt>
          <dd>{{ seleccionada.categoria ?? '—' }}</dd>
          <dt>Subtotal</dt>
          <dd>{{ formatoMoneda(seleccionada.subtotal) }}</dd>
          <dt>IVA</dt>
          <dd>{{ formatoMoneda(seleccionada.iva) }}</dd>
          <dt class="apr__total">Total</dt>
          <dd class="apr__total">{{ formatoMoneda(seleccionada.total) }}</dd>
        </dl>

        <AprobacionGasto :gasto-id="seleccionada.id" @resuelto="alResolver" />
      </aside>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

import EstadoBadge from '@/components/EstadoBadge.vue';
import PaginaEncabezado from '@/components/PaginaEncabezado.vue';
import { formatoMoneda } from '@/utils/formato';

import AprobacionGasto from '../components/AprobacionGasto.vue';
import { useGastos } from '../composables/useGastos';
import { estadoVisualGasto, textoVence } from '../proveedores.logica';
import type { FiltroGastos } from '../services/gastos.service';

const TABS: { filtro: FiltroGastos; etiqueta: string }[] = [
  { filtro: 'por_aprobar', etiqueta: 'Por aprobar' },
  { filtro: 'por_pagar', etiqueta: 'Aprobadas' },
  { filtro: 'rechazadas', etiqueta: 'Rechazadas' },
];

const filtro = ref<FiltroGastos>('por_aprobar');
const seleccionadaId = ref<number | null>(null);
const resultado = ref<string | null>(null);

const consulta = useGastos(filtro, ref(''));

// Aquí solo están las que ya aprobó la administración y esperan a la directiva
const filas = computed(() => {
  const todas = consulta.data.value?.gastos ?? [];
  return filtro.value === 'por_aprobar' ? todas.filter((g) => g.nivel_pendiente === 2) : todas;
});
const seleccionada = computed(() => filas.value.find((g) => g.id === seleccionadaId.value) ?? null);

const subtitulo =
  'Facturas que superan el umbral de segunda aprobación y ya aprobó la administración.';

const vacio = computed(() =>
  filtro.value === 'por_aprobar'
    ? {
        titulo: 'Nada por aprobar',
        detalle: 'Cuando la administración apruebe una factura grande, aparecerá aquí.',
      }
    : { titulo: 'Sin facturas', detalle: 'No hay facturas en este estado.' },
);

function cambiar(f: FiltroGastos): void {
  filtro.value = f;
  seleccionadaId.value = null;
}

function alResolver(mensaje: string): void {
  resultado.value = mensaje;
  seleccionadaId.value = null;
}
</script>

<style scoped>
.apr {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.apr__resultado {
  padding: 12px 16px;
  border-radius: 10px;
  background: #e3efec;
  color: #0b4a47;
  font-weight: 700;
}

.apr__pildoras {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.apr__cuerpo {
  display: flex;
  gap: 18px;
  align-items: flex-start;
  flex-wrap: wrap;
}

.apr__lista {
  flex: 1 1 420px;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.apr__tarjeta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 14px 16px;
  text-align: left;
  font: inherit;
  cursor: pointer;
  width: 100%;
}

.apr__tarjeta--activa {
  outline: 2px solid var(--q-primary);
}

.apr__tarjeta:focus-visible {
  outline: 2px solid var(--q-primary);
  outline-offset: 2px;
}

.apr__tarjeta-cab {
  display: flex;
  justify-content: space-between;
  gap: 10px;
}

.apr__monto {
  font-weight: 800;
  font-variant-numeric: tabular-nums;
}

.apr__sub {
  font-size: 12px;
  color: var(--safic-texto-suave);
}

.apr__vacio {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 40px 16px;
  text-align: center;
}

.apr__detalle {
  flex: 0 0 380px;
  max-width: 100%;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.apr__titulo {
  margin: 8px 0 2px;
  font-size: 18px;
  font-weight: 800;
}

.apr__valores {
  display: grid;
  grid-template-columns: 90px 1fr;
  gap: 6px 10px;
  margin: 0;
  font-size: 14px;
}

.apr__valores dt {
  color: var(--safic-texto-suave);
}

.apr__valores dd {
  margin: 0;
  font-weight: 700;
}

.apr__valores .apr__total {
  padding-top: 8px;
  border-top: 1px solid var(--safic-borde);
  color: inherit;
  font-weight: 800;
}
</style>
