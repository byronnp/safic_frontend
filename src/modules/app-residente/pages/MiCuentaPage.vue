<template>
  <div class="app-pagina mi-cuenta">
    <AppEncabezado
      class="mi-cuenta-encabezado"
      :antetitulo="unidad?.encabezado ?? 'Mi cuenta'"
      titulo="Mi cuenta"
      solapado
    >
      <select
        v-if="datos && datos.unidades.length > 1"
        :model-value="unidad?.unidad_id"
        class="mi-cuenta-unidad"
        aria-label="Unidad"
        @update:model-value="unidadElegida = $event as number"
      >
        <option v-for="u in datos.unidades" :key="u.unidad_id" :value="u.unidad_id">
          {{ u.codigo }}
        </option>
      </select>
    </AppEncabezado>

    <section class="app-tarjeta app-tarjeta-solapada mi-cuenta-total" aria-label="Total pendiente">
      <template v-if="consulta.isPending.value">
        <q-skeleton type="text" width="40%" />
        <q-skeleton type="rect" height="40px" />
      </template>
      <template v-else-if="unidad">
        <div class="mi-cuenta-total__etiqueta">Total pendiente</div>
        <div class="mi-cuenta-total__fila">
          <div class="mi-cuenta-total__valor">{{ formatoMoneda(unidad.total_pendiente) }}</div>
          <EstadoBadge v-if="unidad.vencidas > 0" tono="error">
            {{ unidad.vencidas }} {{ unidad.vencidas === 1 ? 'vencida' : 'vencidas' }}
          </EstadoBadge>
        </div>
        <div v-if="aFavor > 0" class="mi-cuenta-total__etiqueta">
          Saldo a favor: {{ formatoMoneda(unidad.saldo_favor) }}
        </div>
        <router-link
          v-if="puedePagar"
          :to="{ name: 'app-pagar', query: { unidad: unidad.unidad_id } }"
          class="mi-cuenta-pagar"
        >
          Pagar
        </router-link>
        <span
          v-else
          class="mi-cuenta-pagar mi-cuenta-pagar--apagado"
          role="link"
          aria-disabled="true"
        >
          Pagar
        </span>
        <div v-if="!unidad.puede_pagar" class="mi-cuenta-total__etiqueta">
          Los pagos de esta unidad los hace su responsable de pago.
        </div>
      </template>
    </section>

    <div class="app-cuerpo mi-cuenta-cuerpo">
      <div v-if="consulta.isError.value" class="safic-alerta" role="alert">
        {{ consulta.error.value?.mensaje }}
        <q-btn flat no-caps dense label="Reintentar" @click="consulta.refetch()" />
      </div>

      <div v-else-if="datos && !unidad" class="app-tarjeta mi-cuenta-estado">
        Tu cuenta aún no está ligada a una unidad. Pídele a la administración que revise tu ficha.
      </div>

      <template v-else-if="unidad">
        <h2 class="mi-cuenta-titulo">Cuotas</h2>
        <div class="app-tarjeta">
          <div v-for="cuota in unidad.cuotas" :key="cuota.id" class="mi-cuenta-fila">
            <div class="col-grow">
              <div class="mi-cuenta-fila__titulo">{{ mesCuota(cuota) }}</div>
              <div
                class="mi-cuenta-fila__nota"
                :class="{ 'mi-cuenta-fila__nota--vencida': cuota.estado === 'vencida' }"
              >
                {{ notaCuota(cuota) }}
              </div>
            </div>
            <div class="mi-cuenta-fila__monto">{{ formatoMoneda(cuota.saldo) }}</div>
          </div>
          <div v-if="unidad.cuotas.length === 0" class="mi-cuenta-estado">
            No tienes cuotas pendientes. ¡Estás al día!
          </div>
        </div>

        <h2 class="mi-cuenta-titulo mi-cuenta-titulo--separado">Pagos y recibos</h2>
        <div class="app-tarjeta">
          <div v-for="pago in unidad.pagos" :key="pago.id" class="mi-cuenta-fila">
            <div class="col-grow">
              <div class="mi-cuenta-fila__titulo">
                {{ mesesDelPago(pago) }} · {{ formatoMoneda(pago.monto) }}
              </div>
              <div class="mi-cuenta-fila__nota">
                Comprobante {{ pago.numero_comprobante ?? '—' }} ·
                {{ formatoFechaCorta(pago.fecha) }}
              </div>
              <div
                v-if="pago.motivo_rechazo"
                class="mi-cuenta-fila__nota mi-cuenta-fila__nota--vencida"
              >
                {{ pago.motivo_rechazo }}
              </div>
            </div>
            <button
              v-if="pago.recibo"
              type="button"
              class="mi-cuenta-enlace"
              :aria-label="`Descargar recibo N.º ${pago.recibo} en PDF`"
              :disabled="descargando === pago.id"
              @click="descargarRecibo(pago.id, pago.recibo)"
            >
              PDF
            </button>
            <EstadoBadge :tono="TONO_ESTADO_PAGO[pago.estado]">
              {{ TEXTO_ESTADO_PAGO[pago.estado] }}
            </EstadoBadge>
          </div>
          <div v-if="unidad.pagos.length === 0" class="mi-cuenta-estado">
            Todavía no has enviado pagos.
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import { computed, ref } from 'vue';

import AppEncabezado from '@/components/app/AppEncabezado.vue';
import { guardarArchivo } from '@/core/api/descarga';
import { aApiError } from '@/core/api/errors';
import EstadoBadge from '@/components/EstadoBadge.vue';
import { aCentavos } from '@/utils/dinero';
import { formatoFechaCorta, formatoMoneda } from '@/utils/formato';

import { useMiCuenta } from '../composables/useMiCuenta';
import { miCuentaService } from '../services/mi-cuenta.service';
import {
  cuotasLibres,
  mesCuota,
  mesesDelPago,
  notaCuota,
  TEXTO_ESTADO_PAGO,
  TONO_ESTADO_PAGO,
  unidadInicial,
} from '../mi-cuenta.logica';

const $q = useQuasar();
const consulta = useMiCuenta();
const descargando = ref<number | null>(null);
const datos = computed(() => consulta.data.value);

/** Unidad que eligió la persona; mientras no elija, la primera que puede pagar. */
const unidadElegida = ref<number | null>(null);
const unidad = computed(() => unidadInicial(datos.value?.unidades ?? [], unidadElegida.value));

async function descargarRecibo(pagoId: number, numero: string): Promise<void> {
  if (descargando.value !== null) return;
  descargando.value = pagoId;
  try {
    guardarArchivo(await miCuentaService.recibo(pagoId), `recibo-${numero}.pdf`);
  } catch (e) {
    $q.notify({ type: 'negative', message: aApiError(e).mensaje });
  } finally {
    descargando.value = null;
  }
}

const aFavor = computed(() => (unidad.value ? aCentavos(unidad.value.saldo_favor) : 0));
const puedePagar = computed(
  () => !!unidad.value && unidad.value.puede_pagar && cuotasLibres(unidad.value).length > 0,
);
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

.mi-cuenta-estado {
  padding: 18px 14px;
  font-size: 14px;
  color: var(--safic-texto-suave);
}

.mi-cuenta-unidad {
  margin-top: 8px;
  height: 36px;
  border-radius: 10px;
  border: none;
  padding: 0 10px;
  font-family: inherit;
  font-size: 14px;
  font-weight: 700;
}

.mi-cuenta-pagar--apagado {
  background: var(--safic-borde);
  color: var(--safic-texto-tenue);
  pointer-events: none;
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
