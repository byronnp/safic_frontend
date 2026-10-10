<template>
  <q-page class="safic-main cierre">
    <PaginaEncabezado
      miga="Finanzas / Cierre de mes"
      :titulo="titulo"
      subtitulo="Al cerrar, los cargos, pagos y gastos del mes quedan de solo lectura."
    >
      <template #acciones>
        <label for="cierre-periodo" class="cierre__etiqueta">Mes</label>
        <q-select
          v-model="periodo"
          for="cierre-periodo"
          class="safic-input cierre__select"
          outlined
          dense
          emit-value
          map-options
          :options="opciones"
        />
      </template>
    </PaginaEncabezado>

    <div v-if="resultado" class="cierre__resultado" role="status">{{ resultado }}</div>
    <div v-if="errorAccion" class="safic-alerta" role="alert">{{ errorAccion }}</div>

    <div v-if="consulta.isPending.value" aria-busy="true">
      <q-skeleton v-for="i in 5" :key="i" type="rect" height="56px" class="q-mb-sm" />
    </div>
    <div v-else-if="consulta.isError.value" class="safic-alerta" role="alert">
      {{ consulta.error.value?.mensaje }}
      <q-btn flat no-caps dense label="Reintentar" @click="consulta.refetch()" />
    </div>

    <div v-else-if="cierre" class="cierre__cuerpo">
      <section class="safic-card cierre__lista" aria-labelledby="cierre-antes">
        <div class="cierre__lista-cab">
          <h2 id="cierre-antes" class="cierre__h2">Antes de cerrar</h2>
          <span class="cierre__avance">{{ textoAvance(cierre.verificaciones) }}</span>
        </div>
        <ul class="cierre__puntos">
          <li v-for="v in cierre.verificaciones" :key="v.clave" class="cierre__punto">
            <q-icon
              :name="ESTADO_VERIFICACION[v.estado].icono"
              size="22px"
              :class="`cierre__icono--${ESTADO_VERIFICACION[v.estado].tono}`"
            />
            <div class="cierre__punto-texto">
              <div class="text-weight-bold">{{ v.titulo }}</div>
              <div class="cierre__sub">{{ v.detalle }}</div>
            </div>
            <EstadoBadge :tono="ESTADO_VERIFICACION[v.estado].tono">
              {{ ESTADO_VERIFICACION[v.estado].texto }}
            </EstadoBadge>
          </li>
        </ul>

        <div v-if="cerrado" class="cierre__cerrado" role="status">
          <q-icon name="sym_r_lock" size="20px" />
          <div>
            Cerrado<template v-if="cierre.cierre?.cerrado_por">
              por {{ cierre.cierre.cerrado_por }}</template
            ><template v-if="cierre.cierre?.cerrado_en">
              el {{ fechaHora(cierre.cierre.cerrado_en) }}</template
            >.
          </div>
        </div>
        <div v-else-if="cierre.motivo_bloqueo" class="cierre__bloqueo" role="status">
          <q-icon name="sym_r_block" size="20px" />
          <div>
            <div class="text-weight-bold">No se puede cerrar todavía.</div>
            <div>{{ cierre.motivo_bloqueo }}</div>
          </div>
        </div>
        <div v-else-if="!cierre.emitido" class="cierre__bloqueo" role="status">
          <q-icon name="sym_r_block" size="20px" />
          <div>Este mes no tiene cuotas emitidas: no hay nada que cerrar.</div>
        </div>
      </section>

      <aside class="safic-card cierre__lateral" aria-labelledby="cierre-resumen">
        <h2 id="cierre-resumen" class="cierre__h2">Resumen del periodo</h2>
        <dl class="cierre__resumen">
          <dt>Emitido</dt>
          <dd>{{ formatoMoneda(cierre.resumen.emitido) }}</dd>
          <dt>Cobrado</dt>
          <dd>
            {{ formatoMoneda(cierre.resumen.cobrado) }}
            <span class="cierre__sub">
              · {{ porcentajeCobrado(cierre.resumen.emitido, cierre.resumen.cobrado) }} %
            </span>
          </dd>
          <dt>Gastos pagados</dt>
          <dd>{{ formatoMoneda(cierre.resumen.gastos_pagados) }}</dd>
        </dl>

        <div v-if="cierre.anterior_cerrado" class="cierre__sub">
          Cerrado anterior: {{ nombreMes(cierre.anterior_cerrado.periodo) }}
          <template v-if="cierre.anterior_cerrado.por">
            · por {{ cierre.anterior_cerrado.por }}</template
          >
        </div>
        <div v-if="cierre.reapertura" class="cierre__sub">
          Reabierto por {{ cierre.reapertura.reabierto_por ?? '—' }} el
          {{ fechaHora(cierre.reapertura.reabierto_en) }}: «{{ cierre.reapertura.motivo }}»
        </div>
        <div class="cierre__sub">
          Reabrir un mes cerrado lo hace solo el administrador, con motivo, y queda en auditoría.
        </div>

        <q-btn
          v-if="cerrado && puedeReabrir"
          unelevated
          no-caps
          class="safic-btn safic-btn--secundario"
          icon="sym_r_lock_open"
          label="Reabrir mes"
          @click="reabrir"
        />
        <q-btn
          v-if="!cerrado && puedeCerrar"
          unelevated
          no-caps
          color="primary"
          class="safic-btn"
          icon="sym_r_lock"
          :label="`Cerrar ${nombreMes(periodo).toLowerCase()}`"
          :disable="!cierre.puede_cerrar"
          :loading="cerrar.isPending.value"
          @click="confirmarCierre"
        />
      </aside>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import { computed, ref, watch } from 'vue';

import EstadoBadge from '@/components/EstadoBadge.vue';
import PaginaEncabezado from '@/components/PaginaEncabezado.vue';
import { aApiError } from '@/core/api/errors';
import { useSessionStore } from '@/stores/session';
import { hoyEcuador } from '@/utils/fecha';
import { formatoMoneda } from '@/utils/formato';
import { nombreMes } from '@/utils/periodo';

import ReabrirMesDialog from '../components/ReabrirMesDialog.vue';
import {
  ESTADO_VERIFICACION,
  mesPorCerrar,
  porcentajeCobrado,
  textoAvance,
  tituloCierre,
} from '../cierre-mes.logica';
import { useCerrarMes, useCierreMes } from '../composables/useCierreMes';
import { usePeriodos } from '../composables/usePeriodos';
import { fechaHora } from '../proveedores.logica';
import { opcionesDeMes } from '../resumen.logica';

const $q = useQuasar();
const session = useSessionStore();

// Mostrar los botones es comodidad; la API exige periodos.cerrar y periodos.reabrir igual.
const puedeCerrar = computed(() => session.tienePermiso('periodos.cerrar'));
const puedeReabrir = computed(() => session.tienePermiso('periodos.reabrir'));

const hoy = hoyEcuador();
const periodos = usePeriodos();
const periodo = ref('');
const resultado = ref<string | null>(null);
const errorAccion = ref<string | null>(null);

// Al cargar la lista de meses, se elige el que toca cerrar
watch(
  () => periodos.data.value,
  (lista) => {
    if (periodo.value === '' && lista) periodo.value = mesPorCerrar(lista, hoy);
  },
  { immediate: true },
);
watch(
  () => periodos.isError.value,
  (fallo) => {
    if (fallo && periodo.value === '') periodo.value = mesPorCerrar([], hoy);
  },
);

const consulta = useCierreMes(periodo);
const cierre = computed(() => consulta.data.value ?? null);
const cerrado = computed(() => cierre.value?.estado === 'cerrado');
const cerrar = useCerrarMes();

const opciones = computed(() => opcionesDeMes(periodos.data.value ?? [], periodo.value));
const titulo = computed(() =>
  periodo.value ? tituloCierre(periodo.value, cerrado.value) : 'Cierre de mes',
);

watch(periodo, () => {
  resultado.value = null;
  errorAccion.value = null;
});

function confirmarCierre(): void {
  errorAccion.value = null;
  $q.dialog({
    title: `Cerrar ${nombreMes(periodo.value).toLowerCase()}`,
    message:
      'Los cargos, pagos y gastos de este mes quedarán de solo lectura. Solo el administrador puede reabrirlo.',
    cancel: { label: 'Cancelar', flat: true, noCaps: true },
    ok: { label: 'Cerrar mes', color: 'primary', unelevated: true, noCaps: true },
    persistent: true,
  }).onOk(() => {
    // Un segundo clic mientras responde no cierra dos veces
    if (cerrar.isPending.value) return;
    cerrar.mutate(periodo.value, {
      onSuccess: () => (resultado.value = `${nombreMes(periodo.value)} quedó cerrado.`),
      onError: (error) => (errorAccion.value = aApiError(error).mensaje),
    });
  });
}

function reabrir(): void {
  errorAccion.value = null;
  $q.dialog({ component: ReabrirMesDialog, componentProps: { periodo: periodo.value } }).onOk(
    () => {
      resultado.value = `${nombreMes(periodo.value)} se reabrió.`;
    },
  );
}
</script>

<style scoped>
.cierre {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.cierre__etiqueta {
  font-size: 13px;
  font-weight: 700;
  color: var(--safic-texto-suave);
}

.cierre__select {
  min-width: 200px;
}

.cierre__resultado {
  padding: 12px 16px;
  border-radius: 10px;
  background: #e3efec;
  color: #0b4a47;
  font-weight: 700;
}

.cierre__cuerpo {
  display: flex;
  gap: 18px;
  align-items: flex-start;
  flex-wrap: wrap;
}

.cierre__lista {
  flex: 1 1 520px;
  min-width: 0;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.cierre__lista-cab {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}

.cierre__h2 {
  margin: 0;
  font-size: 16px;
  font-weight: 800;
}

.cierre__avance,
.cierre__sub {
  font-size: 12px;
  color: var(--safic-texto-suave);
}

.cierre__puntos {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
}

.cierre__punto {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-top: 1px solid var(--safic-borde);
}

.cierre__punto-texto {
  flex: 1;
  min-width: 0;
}

.cierre__icono--exito {
  color: #0b4a47;
}

.cierre__icono--alerta {
  color: #8a3f0a;
}

.cierre__icono--error {
  color: #9b1c12;
}

.cierre__cerrado,
.cierre__bloqueo {
  display: flex;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 10px;
  font-size: 14px;
}

.cierre__cerrado {
  background: #e3efec;
  color: #0b4a47;
}

.cierre__bloqueo {
  background: #fde8e6;
  color: #7f1810;
}

.cierre__lateral {
  flex: 0 0 340px;
  max-width: 100%;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.cierre__resumen {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 8px 10px;
  margin: 0;
  font-size: 14px;
}

.cierre__resumen dt {
  color: var(--safic-texto-suave);
}

.cierre__resumen dd {
  margin: 0;
  text-align: right;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
}
</style>
