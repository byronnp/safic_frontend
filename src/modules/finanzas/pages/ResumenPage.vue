<template>
  <q-page class="safic-main resumen">
    <PaginaEncabezado miga="Finanzas / Resumen" :titulo="titulo">
      <template #acciones>
        <select
          v-model="seleccion"
          class="resumen__selector"
          aria-label="Mes"
          :disabled="emitir.isPending.value"
        >
          <option v-for="o in opciones" :key="o.valor" :value="o.valor">{{ o.etiqueta }}</option>
        </select>
        <EstadoBadge v-if="resumen" :tono="estado.tono" class="resumen__periodo">
          {{ estado.texto }}
        </EstadoBadge>
        <q-btn
          v-if="puedeEmitir"
          unelevated
          no-caps
          color="primary"
          class="safic-btn resumen__accion"
          :label="resumen?.emitido ? 'Emitir unidades nuevas' : 'Emitir cuotas'"
          :loading="emitir.isPending.value"
          @click="confirmarEmision"
        />
      </template>
    </PaginaEncabezado>

    <div v-if="consulta.isPending.value" class="safic-indicadores" aria-busy="true">
      <q-skeleton v-for="i in 2" :key="i" type="rect" height="110px" />
    </div>
    <div v-else-if="consulta.isError.value" class="safic-alerta" role="alert">
      {{ consulta.error.value?.mensaje }}
      <q-btn flat no-caps dense label="Reintentar" @click="consulta.refetch()" />
    </div>

    <template v-else-if="resumen">
      <div v-if="errorEmision" class="safic-alerta" role="alert">{{ errorEmision }}</div>

      <div v-if="!resumen.emitido" class="safic-card resumen__aviso">
        <h2 class="resumen__h2">Aún no se emiten las cuotas de {{ mesFrase }}</h2>
        <div class="resumen__nota">
          Al emitirlas, cada unidad con cuota mensual recibe su cuota del mes con el valor del cobro
          configurado.
        </div>
        <q-btn
          v-if="puedeEmitir"
          unelevated
          no-caps
          color="primary"
          class="safic-btn"
          label="Emitir cuotas"
          :loading="emitir.isPending.value"
          @click="confirmarEmision"
        />
      </div>

      <div class="safic-indicadores">
        <div class="safic-indicador">
          <div class="safic-indicador__etiqueta">Recaudado del mes</div>
          <div class="resumen__valor">{{ formatoMoneda(resumen.recaudado) }}</div>
          <div
            class="resumen__progreso"
            role="progressbar"
            :aria-valuenow="avance"
            aria-valuemin="0"
            aria-valuemax="100"
            aria-label="Recaudado del mes"
          >
            <div class="resumen__progreso-barra" :style="{ width: `${avance}%` }" />
          </div>
          <div class="resumen__nota resumen__nota--progreso">
            {{ formatoPorcentaje(avance, 0) }} de {{ formatoMoneda(resumen.esperado) }} esperado
          </div>
        </div>
        <div class="safic-indicador">
          <div class="safic-indicador__etiqueta">Cartera vencida</div>
          <div class="resumen__valor resumen__valor--error">
            {{ formatoMoneda(resumen.cartera_vencida.saldo) }}
          </div>
          <div class="resumen__nota">
            {{ resumen.cartera_vencida.unidades }}
            {{ resumen.cartera_vencida.unidades === 1 ? 'unidad' : 'unidades' }} con cuotas vencidas
          </div>
        </div>
      </div>

      <div class="resumen__cuerpo">
        <section class="safic-card resumen__cartera" aria-labelledby="resumen-cartera-titulo">
          <div class="resumen__fila-titulo">
            <h2 id="resumen-cartera-titulo" class="resumen__h2">Cartera por antigüedad</h2>
            <router-link :to="{ name: 'unidades' }" class="resumen__enlace">
              Ver unidades
            </router-link>
          </div>
          <div v-for="tramo in tramos" :key="tramo.tramo" class="resumen__tramo">
            <div class="text-weight-bold">{{ tramo.etiqueta }}</div>
            <div class="resumen__tramo-pista">
              <div
                class="resumen__tramo-barra"
                :style="{ width: `${tramo.ancho}%`, background: tramo.color }"
              />
            </div>
            <div class="resumen__tramo-monto">{{ formatoMoneda(tramo.saldo) }}</div>
            <div class="resumen__tramo-unidades">{{ tramo.unidades }} unid.</div>
          </div>
          <div v-if="resumen.cobro" class="resumen__metodo">
            Método de cobro: <strong>{{ NOMBRE_METODO[resumen.cobro.metodo] }}</strong> · Vence
            {{ vencimiento(resumen.cobro.dia_vencimiento) }}
          </div>
        </section>
      </div>
    </template>
  </q-page>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import { computed, ref } from 'vue';

import EstadoBadge from '@/components/EstadoBadge.vue';
import PaginaEncabezado from '@/components/PaginaEncabezado.vue';
import { aApiError } from '@/core/api/errors';
import { useSessionStore } from '@/stores/session';
import { formatoMoneda, formatoPorcentaje } from '@/utils/formato';

import type { EmisionPeriodo } from '../services/periodos.service';
import { useEmitirPeriodo, usePeriodos, useResumenFinanciero } from '../composables/usePeriodos';
import {
  ESTADO_PERIODO,
  estadoDelResumen,
  mesEnFrase,
  NOMBRE_METODO,
  nombreMes,
  opcionesDeMes,
  porcentaje,
  tramosConBarra,
} from '../resumen.logica';

const $q = useQuasar();
const session = useSessionStore();

/** Mes elegido; null = el mes en curso del condominio (lo resuelve la API). */
const elegido = ref<string | null>(null);
const errorEmision = ref<string | null>(null);

const consulta = useResumenFinanciero(elegido);
const periodos = usePeriodos();
const emitir = useEmitirPeriodo();

const resumen = computed(() => consulta.data.value);
const puedeEmitir = computed(
  () =>
    resumen.value !== undefined &&
    resumen.value.estado !== 'cerrado' &&
    session.tienePermiso('cuotas.emitir'),
);

const seleccion = computed({
  get: () => elegido.value ?? resumen.value?.periodo ?? '',
  set: (valor: string) => {
    errorEmision.value = null;
    elegido.value = valor;
  },
});
const opciones = computed(() =>
  opcionesDeMes(periodos.data.value ?? [], elegido.value ?? resumen.value?.periodo ?? ''),
);

const titulo = computed(() => (resumen.value ? nombreMes(resumen.value.periodo) : 'Resumen'));
const mesFrase = computed(() => (resumen.value ? mesEnFrase(resumen.value.periodo) : ''));
const estado = computed(
  () => ESTADO_PERIODO[resumen.value ? estadoDelResumen(resumen.value) : 'sin_emitir'],
);
const avance = computed(() =>
  resumen.value ? porcentaje(resumen.value.recaudado, resumen.value.esperado) : 0,
);
const tramos = computed(() => tramosConBarra(resumen.value?.antiguedad ?? []));

/** "3 nuevas, 117 ya existían, 2 sin cuota mensual · total $ 9.856,00" */
function textoEmision(e: EmisionPeriodo): string {
  const partes = [`${e.creadas} ${e.creadas === 1 ? 'nueva' : 'nuevas'}`];
  if (e.existentes > 0) partes.push(`${e.existentes} ya existían`);
  if (e.sin_cuota > 0) partes.push(`${e.sin_cuota} sin cuota mensual`);
  return `Cuotas emitidas: ${partes.join(', ')} · total ${formatoMoneda(e.total)}.`;
}

function vencimiento(dia: number): string {
  return dia === 0 ? 'el último día del mes' : `el día ${dia}`;
}

function confirmarEmision(): void {
  const r = resumen.value;
  if (!r || emitir.isPending.value) return;
  $q.dialog({
    title: `Emitir las cuotas de ${mesEnFrase(r.periodo)}`,
    message: r.emitido
      ? 'Se agregan las cuotas de las unidades que aún no la tienen. Las ya emitidas no cambian.'
      : 'Cada unidad con cuota mensual recibirá su cuota con el valor del cobro configurado.',
    cancel: { label: 'Cancelar', flat: true, noCaps: true },
    ok: { label: 'Emitir', color: 'primary', noCaps: true },
    persistent: true,
  }).onOk(() => {
    errorEmision.value = null;
    emitir.mutate(r.periodo, {
      onSuccess: (e) =>
        $q.notify({
          type: 'positive',
          message: textoEmision(e),
        }),
      onError: (error) => {
        errorEmision.value = aApiError(error).mensaje;
      },
    });
  });
}
</script>

<style scoped>
.resumen.safic-main {
  padding: 26px 32px;
  gap: 18px;
}

.resumen__periodo.resumen__periodo {
  padding: 6px 12px;
  font-size: 13px;
}

.resumen__accion.q-btn {
  padding: 0 16px;
}

.resumen__valor {
  font-size: 28px;
  font-weight: 800;
  margin-top: 6px;
  line-height: 1.3;
}

.resumen__valor--error {
  color: #9b1c12;
}

.resumen__nota {
  font-size: 12px;
  color: var(--safic-texto-suave);
  margin-top: 4px;
}

.resumen__nota--progreso {
  margin-top: 6px;
}

.resumen__nota--fuerte {
  color: inherit;
  font-weight: 600;
}

.resumen__progreso {
  height: 6px;
  border-radius: 3px;
  background: var(--safic-linea);
  margin-top: 10px;
  overflow: hidden;
}

.resumen__progreso-barra {
  height: 6px;
  background: var(--q-primary);
}

.resumen__cuerpo {
  display: flex;
  gap: 16px;
  flex-grow: 1;
  min-height: 0;
}

.resumen__h2 {
  margin: 0;
  font-size: 16px;
  line-height: 1.4;
  font-weight: 800;
  flex-grow: 1;
}

.resumen__aviso {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
  padding: 28px 24px;
}

.resumen__selector {
  height: 42px;
  min-width: 170px;
  padding: 0 10px;
  border: 1px solid var(--safic-borde-campo);
  border-radius: 10px;
  background: #ffffff;
  color: var(--safic-texto);
  font-family: inherit;
  font-size: 14px;
  font-weight: 700;
}

.resumen__fila-titulo {
  display: flex;
  align-items: center;
  gap: 8px;
}

.resumen__enlace {
  font-size: 13px;
  font-weight: 700;
  text-decoration: none;
}

.resumen__cartera {
  flex-grow: 1;
  padding: 20px 22px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-width: 0;
}

.resumen__tramo {
  display: grid;
  grid-template-columns: 120px 1fr 110px 90px;
  align-items: center;
  gap: 14px;
  font-size: 14px;
}

.resumen__tramo-pista {
  height: 14px;
  border-radius: 4px;
  background: #f1efe8;
  overflow: hidden;
}

.resumen__tramo-barra {
  height: 14px;
}

.resumen__tramo-monto {
  text-align: right;
  font-weight: 700;
}

.resumen__tramo-unidades {
  text-align: right;
  color: var(--safic-texto-suave);
}

.resumen__metodo {
  border-top: 1px solid var(--safic-linea);
  padding-top: 12px;
  font-size: 13px;
  color: var(--safic-texto-suave);
}

.resumen__metodo strong {
  color: var(--safic-texto);
}

@media (max-width: 1023px) {
  .resumen__cuerpo {
    flex-direction: column;
  }
}

@media (max-width: 599px) {
  .resumen.safic-main {
    padding: 20px 16px;
  }

  .resumen__valor {
    font-size: 22px;
  }

  .resumen__tramo {
    grid-template-columns: 76px 1fr 84px;
    gap: 10px;
    font-size: 13px;
  }

  .resumen__tramo-unidades {
    display: none;
  }
}
</style>
