<template>
  <q-page class="safic-main cxp">
    <PaginaEncabezado miga="Finanzas / Cuentas por pagar" titulo="Cuentas por pagar">
      <template #acciones>
        <q-btn
          v-if="puedeRegistrar"
          unelevated
          no-caps
          class="safic-btn safic-btn--secundario"
          icon="sym_r_edit_note"
          label="Registrar a mano"
          @click="registrarAMano"
        />
        <ImportarFacturaXmlBoton
          v-if="puedeRegistrar"
          @importada="alImportar"
          @error="(m) => (errorImportar = m)"
        />
      </template>
    </PaginaEncabezado>

    <div v-if="errorImportar" class="safic-alerta" role="alert">{{ errorImportar }}</div>
    <div v-if="resultado" class="cxp__resultado" role="status">{{ resultado }}</div>

    <div v-if="consulta.isError.value" class="safic-alerta" role="alert">
      {{ consulta.error.value?.mensaje }}
      <q-btn flat no-caps dense label="Reintentar" @click="consulta.refetch()" />
    </div>

    <div class="cxp__kpis" :aria-busy="consulta.isPending.value">
      <template v-if="lista">
        <div class="safic-card cxp__kpi">
          <div class="cxp__kpi-titulo">Por aprobar</div>
          <div class="cxp__kpi-valor cxp__kpi-valor--alerta">
            {{ formatoMoneda(lista.resumen.por_aprobar_monto) }}
          </div>
          <div class="cxp__kpi-nota">{{ textoFacturas(lista.resumen.por_aprobar_facturas) }}</div>
        </div>
        <div class="safic-card cxp__kpi">
          <div class="cxp__kpi-titulo">Aprobadas por pagar</div>
          <div class="cxp__kpi-valor">{{ formatoMoneda(lista.resumen.por_pagar_monto) }}</div>
          <div class="cxp__kpi-nota">{{ textoFacturas(lista.resumen.por_pagar_facturas) }}</div>
        </div>
        <div class="safic-card cxp__kpi">
          <div class="cxp__kpi-titulo">Vencido</div>
          <div class="cxp__kpi-valor cxp__kpi-valor--error">
            {{ formatoMoneda(lista.resumen.vencido_monto) }}
          </div>
          <div class="cxp__kpi-nota">{{ textoFacturas(lista.resumen.vencido_facturas) }}</div>
        </div>
      </template>
      <template v-else-if="consulta.isPending.value">
        <q-skeleton v-for="i in 3" :key="i" type="rect" height="92px" />
      </template>
    </div>

    <div class="cxp__filtros">
      <div role="tablist" aria-label="Estado de las facturas" class="cxp__pildoras">
        <button
          v-for="f in FILTROS_GASTOS"
          :key="f.valor"
          type="button"
          role="tab"
          class="safic-pildora"
          :class="{ 'safic-pildora--activa': f.valor === filtro }"
          :aria-selected="f.valor === filtro"
          @click="filtro = f.valor"
        >
          {{ f.etiqueta }}{{ lista ? ` (${lista.conteos[f.valor]})` : '' }}
        </button>
      </div>
      <q-input
        v-model="buscar"
        class="safic-input cxp__buscar"
        outlined
        dense
        clearable
        placeholder="Proveedor, RUC o factura"
        aria-label="Buscar factura"
      >
        <template #prepend><q-icon name="sym_r_search" /></template>
      </q-input>
    </div>

    <div class="cxp__cuerpo">
      <section class="safic-card cxp__tabla" aria-label="Facturas de proveedores">
        <div class="cxp__fila cxp__fila--cabecera" role="row">
          <div>PROVEEDOR · FACTURA</div>
          <div>VENCE</div>
          <div class="text-right">TOTAL</div>
          <div class="text-right">SALDO</div>
          <div>ESTADO</div>
        </div>

        <div v-if="consulta.isPending.value" class="q-pa-md" aria-busy="true">
          <q-skeleton v-for="i in 5" :key="i" type="rect" height="44px" class="q-mb-sm" />
        </div>
        <template v-else-if="lista">
          <button
            v-for="g in lista.gastos"
            :key="g.id"
            type="button"
            class="cxp__fila cxp__fila--dato"
            :class="{ 'cxp__fila--activa': g.id === seleccionadaId }"
            :aria-pressed="g.id === seleccionadaId"
            @click="seleccionadaId = g.id"
          >
            <div>
              <div class="text-weight-bold">{{ g.proveedor.razon_social }}</div>
              <div class="cxp__sub">{{ g.categoria ?? 'Sin categoría' }} · {{ g.numero }}</div>
            </div>
            <div :class="{ cxp__vencida: g.vencida }">{{ textoVence(g) }}</div>
            <div class="text-right cxp__monto">{{ formatoMoneda(g.total) }}</div>
            <div class="text-right cxp__monto">{{ formatoMoneda(g.saldo) }}</div>
            <div>
              <EstadoBadge :tono="estadoVisualGasto(g).tono">{{
                estadoVisualGasto(g).texto
              }}</EstadoBadge>
            </div>
          </button>

          <div v-if="lista.gastos.length === 0" class="cxp__vacio">
            <q-icon name="sym_r_receipt_long" size="40px" class="text-suave" />
            <div class="text-weight-bold">{{ vacio.titulo }}</div>
            <div class="text-suave">{{ vacio.detalle }}</div>
          </div>
        </template>
      </section>

      <aside v-if="seleccionada" class="safic-card cxp__detalle" aria-labelledby="cxp-detalle">
        <div>
          <div class="cxp__sub">{{ seleccionada.categoria ?? 'Sin categoría' }}</div>
          <h2 id="cxp-detalle" class="cxp__detalle-titulo">
            {{ seleccionada.proveedor.razon_social }}
          </h2>
          <div class="cxp__sub">
            RUC {{ seleccionada.proveedor.ruc }} · Factura {{ seleccionada.numero }}
          </div>
        </div>

        <div class="cxp__origen">
          <q-icon
            :name="seleccionada.origen === 'xml' ? 'sym_r_verified' : 'sym_r_edit_note'"
            size="18px"
          />
          {{
            seleccionada.origen === 'xml' ? 'Registrada desde el XML del SRI' : 'Registrada a mano'
          }}
          <template v-if="seleccionada.tiene_pdf"> · PDF adjunto</template>
        </div>

        <div v-if="seleccionada.descripcion" class="cxp__detalle-texto">
          {{ seleccionada.descripcion }}
        </div>

        <dl class="cxp__valores">
          <dt>Emisión</dt>
          <dd>{{ formatoFecha(seleccionada.fecha_emision) }}</dd>
          <dt>Vencimiento</dt>
          <dd>{{ formatoFecha(seleccionada.vence_el) }}</dd>
          <dt>Subtotal</dt>
          <dd>{{ formatoMoneda(seleccionada.subtotal) }}</dd>
          <dt>IVA</dt>
          <dd>{{ formatoMoneda(seleccionada.iva) }}</dd>
          <dt class="cxp__total">Total</dt>
          <dd class="cxp__total">{{ formatoMoneda(seleccionada.total) }}</dd>
          <dt>Saldo</dt>
          <dd>{{ formatoMoneda(seleccionada.saldo) }}</dd>
        </dl>

        <EstadoBadge :tono="estadoVisualGasto(seleccionada).tono">
          {{ estadoVisualGasto(seleccionada).texto }}
        </EstadoBadge>

        <AprobacionGasto :gasto-id="seleccionada.id" @resuelto="(m) => (resultado = m)" />

        <q-btn
          v-if="puedePagar && seleccionada.estado === 'aprobada'"
          unelevated
          no-caps
          color="primary"
          class="safic-btn"
          icon="sym_r_payments"
          label="Registrar pago"
          :to="{
            name: 'finanzas-pago-proveedor',
            params: { id: seleccionada.proveedor.id },
            query: { factura: seleccionada.id },
          }"
        />
      </aside>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import EstadoBadge from '@/components/EstadoBadge.vue';
import PaginaEncabezado from '@/components/PaginaEncabezado.vue';
import { useSessionStore } from '@/stores/session';
import { refDebounced } from '@/utils/debounce';
import { formatoFecha, formatoMoneda } from '@/utils/formato';

import AprobacionGasto from '../components/AprobacionGasto.vue';
import FacturaManualDialog from '../components/FacturaManualDialog.vue';
import ImportarFacturaXmlBoton from '../components/ImportarFacturaXmlBoton.vue';
import { useGastos } from '../composables/useGastos';
import { estadoVisualGasto, FILTROS_GASTOS, textoVence } from '../proveedores.logica';
import type { FiltroGastos, Gasto } from '../services/gastos.service';

const $q = useQuasar();
const route = useRoute();
const session = useSessionStore();

// Mostrar los botones es comodidad; la API exige gastos.registrar igual.
const puedeRegistrar = computed(() => session.tienePermiso('gastos.registrar'));
const puedePagar = computed(() => session.tienePermiso('gastos.pagar'));

const filtro = ref<FiltroGastos>('todas');
// «Ver facturas» desde Proveedores llega con el RUC en la dirección
const buscar = ref(typeof route.query.buscar === 'string' ? route.query.buscar : '');
const buscarFino = refDebounced(buscar, 300);
watch(
  () => route.query.buscar,
  (q) => {
    if (typeof q === 'string') buscar.value = q;
  },
);
const seleccionadaId = ref<number | null>(null);
const resultado = ref<string | null>(null);
const errorImportar = ref<string | null>(null);

const consulta = useGastos(
  filtro,
  computed(() => buscarFino.value ?? ''),
);
const lista = computed(() => consulta.data.value);
const seleccionada = computed(
  () => lista.value?.gastos.find((g) => g.id === seleccionadaId.value) ?? null,
);

const textoFacturas = (n: number): string => `${n} ${n === 1 ? 'factura' : 'facturas'}`;

const vacio = computed(() =>
  filtro.value !== 'todas' || buscar.value !== ''
    ? { titulo: 'Sin resultados', detalle: 'Prueba con otro filtro o con otra búsqueda.' }
    : { titulo: 'Aún no hay facturas', detalle: 'Sube el XML de una factura o regístrala a mano.' },
);

function alImportar(g: Gasto): void {
  errorImportar.value = null;
  seleccionadaId.value = g.id;
}

function registrarAMano(): void {
  errorImportar.value = null;
  $q.dialog({ component: FacturaManualDialog }).onOk((g: Gasto) => {
    seleccionadaId.value = g.id;
    resultado.value = `Factura ${g.numero} registrada por ${formatoMoneda(g.total)}. Queda por aprobar.`;
  });
}
</script>

<style scoped>
.cxp {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.cxp__resultado {
  padding: 12px 16px;
  border-radius: 10px;
  background: #e3efec;
  color: #0b4a47;
  font-weight: 700;
}

.cxp__kpis {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 14px;
}

.cxp__kpi {
  padding: 16px 18px;
}

.cxp__kpi-titulo {
  font-size: 13px;
  font-weight: 700;
  color: var(--safic-texto-suave);
}

.cxp__kpi-valor {
  margin-top: 6px;
  font-size: 26px;
  font-weight: 800;
  letter-spacing: -0.4px;
  font-variant-numeric: tabular-nums;
}

.cxp__kpi-valor--alerta {
  color: #8a3f0a;
}

.cxp__kpi-valor--error {
  color: #9b1c12;
}

.cxp__kpi-nota {
  margin-top: 4px;
  font-size: 12px;
  color: var(--safic-texto-suave);
}

.cxp__filtros {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.cxp__pildoras {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.cxp__buscar {
  margin-left: auto;
  width: 260px;
}

.cxp__cuerpo {
  display: flex;
  gap: 18px;
  align-items: flex-start;
  flex-wrap: wrap;
}

.cxp__tabla {
  flex: 1 1 620px;
  min-width: 0;
  overflow-x: auto;
}

.cxp__fila {
  display: grid;
  grid-template-columns: 1.6fr 130px 110px 110px 170px;
  gap: 12px;
  align-items: center;
  min-width: 680px;
  min-height: 56px;
  padding: 8px 18px;
  border: none;
  border-top: 1px solid var(--safic-borde);
  background: transparent;
  font: inherit;
  font-size: 14px;
  text-align: left;
  width: 100%;
}

.cxp__fila--cabecera {
  min-height: 0;
  padding-block: 10px;
  border-top: none;
  background: var(--safic-fondo);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.3px;
  color: var(--safic-texto-suave);
}

.cxp__fila--dato {
  cursor: pointer;
}

.cxp__fila--dato:hover,
.cxp__fila--activa {
  background: var(--safic-fondo);
}

.cxp__fila--dato:focus-visible {
  outline: 2px solid var(--q-primary);
  outline-offset: -2px;
}

.cxp__sub {
  font-size: 12px;
  color: var(--safic-texto-suave);
}

.cxp__monto {
  font-weight: 800;
  font-variant-numeric: tabular-nums;
}

.cxp__vencida {
  color: #9b1c12;
  font-weight: 700;
}

.cxp__vacio {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 40px 16px;
  text-align: center;
}

.cxp__detalle {
  flex: 0 0 340px;
  max-width: 100%;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.cxp__detalle-titulo {
  margin: 2px 0;
  font-size: 18px;
  font-weight: 800;
}

.cxp__detalle-texto {
  font-size: 14px;
}

.cxp__origen {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 10px;
  border-radius: 8px;
  background: #e3efec;
  color: #0b4a47;
  font-size: 13px;
  font-weight: 700;
}

.cxp__valores {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 6px 10px;
  margin: 0;
  font-size: 14px;
}

.cxp__valores dt {
  color: var(--safic-texto-suave);
}

.cxp__valores dd {
  margin: 0;
  text-align: right;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.cxp__valores .cxp__total {
  padding-top: 8px;
  border-top: 1px solid var(--safic-borde);
  color: inherit;
  font-weight: 800;
}
</style>
