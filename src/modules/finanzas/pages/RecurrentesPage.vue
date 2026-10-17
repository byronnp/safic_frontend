<template>
  <q-page class="safic-main rec">
    <PaginaEncabezado
      miga="Finanzas / Gastos recurrentes"
      titulo="Gastos recurrentes"
      subtitulo="Cada mes se crea la cuenta por pagar y se avisa para adjuntar la factura real."
    >
      <template #acciones>
        <label for="rec-periodo" class="rec__etiqueta">Mes</label>
        <q-select
          v-model="periodo"
          for="rec-periodo"
          class="safic-input rec__select"
          outlined
          dense
          emit-value
          map-options
          :options="opciones"
        />
        <q-btn
          v-if="puedeGestionar"
          unelevated
          no-caps
          color="primary"
          class="safic-btn"
          icon="sym_r_add"
          label="Nuevo gasto recurrente"
          @click="nuevo"
        />
      </template>
    </PaginaEncabezado>

    <div v-if="resultado" class="rec__resultado" role="status">{{ resultado }}</div>

    <div v-if="consulta.isError.value" class="safic-alerta" role="alert">
      {{ consulta.error.value?.mensaje }}
      <q-btn flat no-caps dense label="Reintentar" @click="consulta.refetch()" />
    </div>

    <div class="rec__kpis" :aria-busy="consulta.isPending.value">
      <template v-if="lista">
        <div class="safic-card rec__kpi">
          <div class="rec__kpi-titulo">Comprometido al mes</div>
          <div class="rec__kpi-valor">{{ formatoMoneda(lista.resumen.comprometido) }}</div>
          <div class="rec__sub">Sin contar luz ni agua</div>
        </div>
        <div class="safic-card rec__kpi">
          <div class="rec__kpi-titulo">Facturas por adjuntar</div>
          <div class="rec__kpi-valor rec__kpi-valor--alerta">{{ lista.resumen.por_adjuntar }}</div>
          <div class="rec__sub">{{ nombreMes(periodo) }}</div>
        </div>
        <div class="safic-card rec__kpi">
          <div class="rec__kpi-titulo">Próximo</div>
          <div class="rec__kpi-valor rec__kpi-valor--chico">
            {{ textoProximo(lista.resumen.proximo) }}
          </div>
        </div>
      </template>
      <template v-else-if="consulta.isPending.value">
        <q-skeleton v-for="i in 3" :key="i" type="rect" height="84px" />
      </template>
    </div>

    <section class="safic-card rec__tabla" aria-label="Gastos recurrentes">
      <div class="rec__fila rec__fila--cabecera" role="row">
        <div>GASTO</div>
        <div>PROVEEDOR</div>
        <div class="text-right">MONTO</div>
        <div>SE CREA</div>
        <div>{{ nombreMes(periodo).split(' ')[0]?.toUpperCase() }}</div>
        <div v-if="puedeGestionar" />
      </div>

      <div v-if="consulta.isPending.value" class="q-pa-md" aria-busy="true">
        <q-skeleton v-for="i in 5" :key="i" type="rect" height="44px" class="q-mb-sm" />
      </div>
      <template v-else-if="lista">
        <div
          v-for="r in lista.recurrentes"
          :key="r.id"
          class="rec__fila"
          :class="{ 'rec__fila--pausada': !r.activo }"
        >
          <div class="text-weight-bold">{{ r.nombre }}</div>
          <div>{{ r.proveedor.razon_social }}</div>
          <div class="text-right rec__monto">{{ textoMonto(r, formatoMoneda) }}</div>
          <div>{{ textoDia(r.dia_mes) }}</div>
          <div>
            <EstadoBadge :tono="ESTADO_MES[r.mes.estado].tono">{{
              ESTADO_MES[r.mes.estado].texto
            }}</EstadoBadge>
            <div v-if="r.mes.aprobada_automaticamente" class="rec__sub">Nivel 1 automático</div>
          </div>
          <div v-if="puedeGestionar" class="rec__acciones">
            <q-btn
              v-if="r.mes.estado === 'falta_factura'"
              flat
              no-caps
              dense
              color="primary"
              label="Adjuntar factura"
              @click="adjuntar(r)"
            />
            <q-btn
              flat
              round
              dense
              icon="sym_r_edit"
              :aria-label="`Editar ${r.nombre}`"
              @click="editar(r)"
            />
          </div>
        </div>

        <div v-if="lista.recurrentes.length === 0" class="rec__vacio">
          <q-icon name="sym_r_autorenew" size="40px" class="text-suave" />
          <div class="text-weight-bold">Aún no hay gastos recurrentes</div>
          <div class="text-suave">
            Guardianía, limpieza, luz, agua… Créalos una vez y cada mes se te recuerda su factura.
          </div>
          <q-btn
            v-if="puedeGestionar"
            unelevated
            no-caps
            color="primary"
            class="safic-btn"
            label="Crear el primero"
            @click="nuevo"
          />
        </div>
      </template>
    </section>
  </q-page>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import { computed, ref, watch } from 'vue';

import EstadoBadge from '@/components/EstadoBadge.vue';
import PaginaEncabezado from '@/components/PaginaEncabezado.vue';
import { useSessionStore } from '@/stores/session';
import { hoyEcuador } from '@/utils/fecha';
import { formatoMoneda } from '@/utils/formato';
import { nombreMes } from '@/utils/periodo';

import AdjuntarFacturaDialog from '../components/AdjuntarFacturaDialog.vue';
import RecurrenteDialog from '../components/RecurrenteDialog.vue';
import { usePeriodos } from '../composables/usePeriodos';
import { useRecurrentes } from '../composables/useRecurrentes';
import { ESTADO_MES, textoDia, textoMonto, textoProximo } from '../recurrentes.logica';
import { opcionesDeMes } from '../resumen.logica';
import type { GastoRecurrente } from '../services/recurrentes.service';

const $q = useQuasar();
const session = useSessionStore();

// Mostrar los botones es comodidad; la API exige gastos.registrar igual.
const puedeGestionar = computed(() => session.tienePermiso('gastos.registrar'));

const periodo = ref(hoyEcuador().slice(0, 7));
const resultado = ref<string | null>(null);

const periodos = usePeriodos();
const opciones = computed(() => opcionesDeMes(periodos.data.value ?? [], periodo.value));
const consulta = useRecurrentes(periodo);
const lista = computed(() => consulta.data.value);

watch([periodo, () => session.condominioId], () => (resultado.value = null));

function avisar(mensaje: string): void {
  resultado.value = mensaje;
}

function nuevo(): void {
  $q.dialog({ component: RecurrenteDialog }).onOk(avisar);
}

function editar(r: GastoRecurrente): void {
  $q.dialog({ component: RecurrenteDialog, componentProps: { recurrente: r } }).onOk(avisar);
}

function adjuntar(r: GastoRecurrente): void {
  $q.dialog({
    component: AdjuntarFacturaDialog,
    componentProps: { recurrente: r, periodo: periodo.value },
  }).onOk(avisar);
}
</script>

<style scoped>
.rec {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.rec__etiqueta {
  font-size: 13px;
  font-weight: 700;
  color: var(--safic-texto-suave);
}

.rec__select {
  min-width: 180px;
}

.rec__resultado {
  padding: 12px 16px;
  border-radius: 10px;
  background: #e3efec;
  color: #0b4a47;
  font-weight: 700;
}

.rec__kpis {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 14px;
}

.rec__kpi {
  padding: 16px 18px;
}

.rec__kpi-titulo {
  font-size: 13px;
  font-weight: 700;
  color: var(--safic-texto-suave);
}

.rec__kpi-valor {
  margin-top: 6px;
  font-size: 26px;
  font-weight: 800;
  letter-spacing: -0.4px;
  font-variant-numeric: tabular-nums;
}

.rec__kpi-valor--alerta {
  color: #8a3f0a;
}

.rec__kpi-valor--chico {
  font-size: 18px;
}

.rec__sub {
  font-size: 12px;
  color: var(--safic-texto-suave);
}

.rec__tabla {
  overflow-x: auto;
}

.rec__fila {
  display: grid;
  grid-template-columns: 1.2fr 1.4fr 110px 80px 170px auto;
  gap: 12px;
  align-items: center;
  min-width: 800px;
  padding: 10px 18px;
  border-top: 1px solid var(--safic-borde);
  font-size: 14px;
}

.rec__fila--cabecera {
  min-height: 0;
  padding-block: 10px;
  border-top: none;
  background: var(--safic-fondo);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.3px;
  color: var(--safic-texto-suave);
}

.rec__fila--pausada {
  opacity: 0.7;
}

.rec__monto {
  font-weight: 800;
  font-variant-numeric: tabular-nums;
}

.rec__acciones {
  display: flex;
  align-items: center;
  gap: 4px;
  justify-content: flex-end;
}

.rec__vacio {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 40px 16px;
  text-align: center;
}
</style>
