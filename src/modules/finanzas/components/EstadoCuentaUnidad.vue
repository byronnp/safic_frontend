<template>
  <div class="estado-cuenta">
    <div class="estado-cuenta__barra">
      <div class="text-suave" style="font-size: 13px">
        <template v-if="cuenta?.responsable">
          Paga: {{ cuenta.responsable.nombre }} ({{
            textoRelacion(cuenta.responsable.relacion).toLowerCase()
          }})
        </template>
      </div>
      <q-btn
        v-if="puedeEfectivo"
        unelevated
        no-caps
        class="safic-btn safic-btn--secundario"
        icon="sym_r_payments"
        label="Registrar pago en efectivo"
        :disable="!cuenta"
        @click="registrarEfectivo"
      />
      <q-btn
        unelevated
        no-caps
        color="primary"
        class="safic-btn"
        icon="sym_r_picture_as_pdf"
        label="Descargar PDF"
        :loading="descargando"
        @click="descargarPdf"
      />
    </div>

    <div v-if="errorPdf" class="safic-alerta" role="alert">{{ errorPdf }}</div>
    <div v-if="confirmacion" class="estado-cuenta__ok" role="status">{{ confirmacion }}</div>

    <div v-if="consulta.isPending.value" aria-busy="true" class="estado-cuenta__kpis">
      <q-skeleton v-for="i in 4" :key="i" type="rect" height="92px" />
    </div>
    <div v-else-if="consulta.isError.value" class="safic-alerta" role="alert">
      {{ consulta.error.value?.mensaje }}
      <q-btn flat no-caps dense label="Reintentar" @click="consulta.refetch()" />
    </div>

    <template v-else-if="cuenta">
      <div class="estado-cuenta__kpis">
        <div class="safic-card estado-cuenta__kpi">
          <div class="estado-cuenta__kpi-titulo">Saldo pendiente</div>
          <div class="estado-cuenta__kpi-valor estado-cuenta__kpi-valor--error">
            {{ formatoMoneda(cuenta.saldo_pendiente) }}
          </div>
          <div class="estado-cuenta__kpi-nota">Cuotas por pagar, menos saldo a favor</div>
        </div>
        <div class="safic-card estado-cuenta__kpi">
          <div class="estado-cuenta__kpi-titulo">Saldo a favor</div>
          <div class="estado-cuenta__kpi-valor estado-cuenta__kpi-valor--exito">
            {{ formatoMoneda(cuenta.saldo_favor) }}
          </div>
          <div class="estado-cuenta__kpi-nota">Se aplica al completar una cuota</div>
        </div>
        <div class="safic-card estado-cuenta__kpi">
          <div class="estado-cuenta__kpi-titulo">Días de atraso</div>
          <div class="estado-cuenta__kpi-valor">{{ cuenta.dias_atraso }}</div>
          <div class="estado-cuenta__kpi-nota">
            {{
              cuenta.proximo_vencimiento
                ? `Vence el ${formatoFechaCorta(cuenta.proximo_vencimiento)}`
                : 'Sin cuotas por vencer'
            }}
          </div>
        </div>
        <div class="safic-card estado-cuenta__kpi">
          <div class="estado-cuenta__kpi-titulo">Pagado en {{ cuenta.pagado_en_el_anio.anio }}</div>
          <div class="estado-cuenta__kpi-valor">
            {{ formatoMoneda(cuenta.pagado_en_el_anio.monto) }}
          </div>
          <div class="estado-cuenta__kpi-nota">{{ cuenta.pagado_en_el_anio.pagos }} pagos</div>
        </div>
      </div>

      <div class="estado-cuenta__rangos" role="tablist" aria-label="Rango del estado de cuenta">
        <button
          v-for="r in RANGOS_CUENTA"
          :key="r.valor"
          type="button"
          role="tab"
          class="safic-pildora"
          :class="{ 'safic-pildora--activa': r.valor === rango }"
          :aria-selected="r.valor === rango"
          @click="rango = r.valor"
        >
          {{ r.etiqueta }}
        </button>
        <span class="estado-cuenta__nota"
          >Saldo calculado de cargos y pagos; nunca se edita a mano.</span
        >
      </div>

      <section class="safic-card estado-cuenta__tabla" aria-label="Movimientos">
        <div class="estado-cuenta__fila estado-cuenta__fila--cabecera" role="row">
          <div>FECHA</div>
          <div>CONCEPTO</div>
          <div class="text-right">CARGO</div>
          <div class="text-right">ABONO</div>
          <div class="text-right">SALDO</div>
        </div>
        <div v-if="aCentavos(cuenta.saldo_inicial) !== 0" class="estado-cuenta__fila">
          <div />
          <div class="text-suave">Saldo anterior</div>
          <div />
          <div />
          <div class="text-right estado-cuenta__monto">
            {{ formatoMoneda(cuenta.saldo_inicial) }}
          </div>
        </div>
        <div v-for="(m, i) in cuenta.movimientos" :key="i" class="estado-cuenta__fila">
          <div style="font-size: 13px">{{ formatoFecha(m.fecha) }}</div>
          <div class="text-weight-medium">{{ m.concepto }}</div>
          <div class="text-right estado-cuenta__monto">
            {{ m.cargo ? formatoMoneda(m.cargo) : '' }}
          </div>
          <div class="text-right estado-cuenta__monto estado-cuenta__monto--abono">
            {{ m.abono ? formatoMoneda(m.abono) : '' }}
          </div>
          <div
            class="text-right estado-cuenta__monto"
            :class="
              esSaldoAFavor(m.saldo) ? 'estado-cuenta__monto--abono' : 'estado-cuenta__monto--deuda'
            "
          >
            {{
              esSaldoAFavor(m.saldo)
                ? `A favor ${formatoMoneda(m.saldo.replace('-', ''))}`
                : formatoMoneda(m.saldo)
            }}
          </div>
        </div>
        <div v-if="cuenta.movimientos.length === 0" class="estado-cuenta__vacio">
          <q-icon name="sym_r_receipt_long" size="40px" class="text-suave" />
          <div class="text-weight-bold">Sin movimientos en este rango</div>
          <div class="text-suave">Prueba con «Todo» para ver el historial completo.</div>
        </div>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import { computed, ref } from 'vue';

import { guardarArchivo } from '@/core/api/descarga';
import { aApiError } from '@/core/api/errors';
import { useSessionStore } from '@/stores/session';
import { aCentavos } from '@/utils/dinero';
import { hoyEcuador } from '@/utils/fecha';
import { formatoFecha, formatoFechaCorta, formatoMoneda } from '@/utils/formato';

import { useEstadoCuenta } from '../composables/useEstadoCuenta';
import {
  esSaldoAFavor,
  RANGOS_CUENTA,
  rangoDeCuenta,
  textoRelacion,
  type RangoElegido,
} from '../cuotas.logica';
import {
  estadoCuentaService,
  type PagoEfectivoRegistrado,
} from '../services/estado-cuenta.service';
import PagoEfectivoDialog from './PagoEfectivoDialog.vue';

const props = defineProps<{ unidadId: number; codigo: string; activo: boolean }>();

const $q = useQuasar();
const session = useSessionStore();

// Mostrar el botón es comodidad; la API exige pagos.aprobar igual.
const puedeEfectivo = computed(() => session.tienePermiso('pagos.aprobar'));

const rango = ref<RangoElegido>('3m');
const rangoFechas = computed(() => rangoDeCuenta(rango.value, hoyEcuador()));
const consulta = useEstadoCuenta(
  computed(() => props.unidadId),
  rangoFechas,
  computed(() => props.activo),
);
const cuenta = computed(() => consulta.data.value);

const descargando = ref(false);
const errorPdf = ref<string | null>(null);
const confirmacion = ref<string | null>(null);

async function descargarPdf(): Promise<void> {
  errorPdf.value = null;
  descargando.value = true;
  // Se fijan antes del await: si cambia la unidad durante la descarga, nombre y contenido coinciden
  const { unidadId, codigo } = props;
  const fechas = rangoFechas.value;
  try {
    const archivo = await estadoCuentaService.pdf(unidadId, fechas);
    guardarArchivo(archivo, `estado-de-cuenta-${codigo}.pdf`);
  } catch (error) {
    errorPdf.value = aApiError(error).mensaje;
  } finally {
    descargando.value = false;
  }
}

function registrarEfectivo(): void {
  confirmacion.value = null;
  $q.dialog({
    component: PagoEfectivoDialog,
    componentProps: { unidadId: props.unidadId, codigo: props.codigo },
  }).onOk((r: PagoEfectivoRegistrado) => {
    confirmacion.value = `Pago de ${formatoMoneda(r.monto)} registrado · recibo ${r.recibo}.`;
  });
}
</script>

<style scoped>
.estado-cuenta {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.estado-cuenta__barra {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
}

.estado-cuenta__ok {
  padding: 12px 16px;
  border-radius: 10px;
  background: #e3efec;
  color: #0b4a47;
  font-weight: 700;
}

.estado-cuenta__kpis {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 14px;
}

.estado-cuenta__kpi {
  padding: 16px 18px;
}

.estado-cuenta__kpi-titulo {
  font-size: 13px;
  font-weight: 700;
  color: var(--safic-texto-suave);
}

.estado-cuenta__kpi-valor {
  margin-top: 6px;
  font-size: 26px;
  font-weight: 800;
  letter-spacing: -0.4px;
  font-variant-numeric: tabular-nums;
}

.estado-cuenta__kpi-valor--exito {
  color: #0b4a47;
}

.estado-cuenta__kpi-valor--error {
  color: #9b1c12;
}

.estado-cuenta__kpi-nota {
  margin-top: 4px;
  font-size: 12px;
  color: var(--safic-texto-suave);
}

.estado-cuenta__rangos {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.estado-cuenta__nota {
  margin-left: auto;
  font-size: 13px;
  color: var(--safic-texto-suave);
}

.estado-cuenta__tabla {
  overflow-x: auto;
}

.estado-cuenta__fila {
  display: grid;
  grid-template-columns: 110px 1.8fr 110px 110px 140px;
  gap: 12px;
  align-items: center;
  min-width: 620px;
  min-height: 50px;
  padding: 8px 18px;
  border-top: 1px solid var(--safic-borde);
  font-size: 14px;
}

.estado-cuenta__fila--cabecera {
  min-height: 0;
  padding-block: 10px;
  border-top: none;
  background: var(--safic-fondo);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.3px;
  color: var(--safic-texto-suave);
}

.estado-cuenta__monto {
  font-weight: 800;
  font-variant-numeric: tabular-nums;
}

.estado-cuenta__monto--abono {
  color: #0b4a47;
}

.estado-cuenta__monto--deuda {
  color: #9b1c12;
}

.estado-cuenta__vacio {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 40px 16px;
  text-align: center;
}
</style>
