<template>
  <q-page class="safic-main cc">
    <PaginaEncabezado
      miga="Finanzas / Caja chica"
      titulo="Caja chica"
      subtitulo="Un fondo fijo para gastos menores, cada uno con la foto de su respaldo."
    >
      <template #acciones>
        <q-btn
          v-if="puedeConfigurar"
          unelevated
          no-caps
          class="safic-btn safic-btn--secundario"
          icon="sym_r_tune"
          label="Fondo y responsable"
          @click="configurar"
        />
        <q-btn
          v-if="puedeRegistrar && caja?.configurada"
          unelevated
          no-caps
          color="primary"
          class="safic-btn"
          icon="sym_r_add"
          label="Registrar gasto"
          @click="registrar"
        />
      </template>
    </PaginaEncabezado>

    <div v-if="resultado" class="cc__resultado" role="status">{{ resultado }}</div>

    <div v-if="errorReposicion" class="safic-alerta" role="alert">{{ errorReposicion }}</div>

    <div v-if="consulta.isError.value" class="safic-alerta" role="alert">
      {{ consulta.error.value?.mensaje }}
      <q-btn flat no-caps dense label="Reintentar" @click="consulta.refetch()" />
    </div>

    <div v-if="consulta.isPending.value" class="cc__kpis" aria-busy="true">
      <q-skeleton v-for="i in 4" :key="i" type="rect" height="84px" />
    </div>

    <template v-else-if="caja">
      <div v-if="!caja.configurada" class="safic-card cc__vacio">
        <q-icon name="sym_r_savings" size="40px" class="text-suave" />
        <div class="text-weight-bold">La caja chica aún no tiene fondo</div>
        <div class="text-suave">Define el monto y quién queda a cargo para empezar a usarla.</div>
        <q-btn
          v-if="puedeConfigurar"
          unelevated
          no-caps
          color="primary"
          class="safic-btn"
          label="Configurar la caja chica"
          @click="configurar"
        />
      </div>

      <template v-else>
        <div class="cc__kpis">
          <div class="safic-card cc__kpi">
            <div class="cc__kpi-titulo">Fondo</div>
            <div class="cc__kpi-valor">{{ formatoMoneda(caja.fondo) }}</div>
            <div class="cc__sub">A cargo de {{ caja.responsable }}</div>
          </div>
          <div class="safic-card cc__kpi">
            <div class="cc__kpi-titulo">Gastado desde la última reposición</div>
            <div class="cc__kpi-valor">{{ formatoMoneda(caja.gastado) }}</div>
            <q-linear-progress
              :value="porcentaje / 100"
              color="primary"
              track-color="grey-3"
              rounded
              class="q-mt-sm"
              :aria-label="`${porcentaje}% del fondo gastado`"
            />
          </div>
          <div class="safic-card cc__kpi">
            <div class="cc__kpi-titulo">Disponible</div>
            <div class="cc__kpi-valor">{{ formatoMoneda(caja.disponible) }}</div>
          </div>
          <div class="safic-card cc__kpi">
            <div class="cc__kpi-titulo">Última reposición</div>
            <template v-if="caja.ultima_reposicion">
              <div class="cc__kpi-valor cc__kpi-valor--chico">
                {{ formatoFechaCorta(caja.ultima_reposicion.fecha) }}
              </div>
              <div class="cc__sub">
                {{ caja.ultima_reposicion.gasto_numero }} ·
                {{ formatoMoneda(caja.ultima_reposicion.monto) }}
              </div>
            </template>
            <div v-else class="cc__sub q-mt-sm">Aún no se repone</div>
          </div>
        </div>

        <section class="safic-card cc__tabla" aria-label="Gastos desde la última reposición">
          <div class="cc__fila cc__fila--cabecera" role="row">
            <div>FECHA</div>
            <div>CONCEPTO</div>
            <div>COMERCIO</div>
            <div class="text-right">MONTO</div>
            <div>RESPALDO</div>
          </div>

          <div v-for="m in caja.movimientos" :key="m.id" class="cc__fila">
            <div>{{ formatoFechaCorta(m.fecha) }}</div>
            <div class="text-weight-bold">{{ m.concepto }}</div>
            <div>{{ m.comercio ?? '—' }}</div>
            <div class="text-right cc__monto">{{ formatoMoneda(m.monto) }}</div>
            <div>
              <a
                v-if="m.respaldo_url && /^https?:\/\//.test(m.respaldo_url)"
                :href="m.respaldo_url"
                target="_blank"
                rel="noopener noreferrer"
                >Ver respaldo</a
              >
              <span v-else class="text-suave">No disponible</span>
            </div>
          </div>

          <div v-if="caja.movimientos.length === 0" class="cc__vacio">
            <q-icon name="sym_r_receipt_long" size="40px" class="text-suave" />
            <div class="text-weight-bold">No hay gastos pendientes de reponer</div>
            <div class="text-suave">El fondo está completo.</div>
          </div>

          <div v-else-if="puedeReponer" class="cc__pie">
            <q-btn
              unelevated
              no-caps
              color="primary"
              class="safic-btn"
              icon="sym_r_autorenew"
              :label="`Reponer fondo (${formatoMoneda(caja.gastado)})`"
              :loading="reponer.isPending.value"
              @click="confirmarReposicion"
            />
          </div>
        </section>
      </template>
    </template>
  </q-page>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import { computed, ref, watch } from 'vue';

import PaginaEncabezado from '@/components/PaginaEncabezado.vue';
import { aApiError } from '@/core/api/errors';
import { useSessionStore } from '@/stores/session';
import { formatoFechaCorta, formatoMoneda } from '@/utils/formato';

import { porcentajeGastado } from '../caja-chica.logica';
import FondoCajaChicaDialog from '../components/FondoCajaChicaDialog.vue';
import GastoCajaChicaDialog from '../components/GastoCajaChicaDialog.vue';
import { useCajaChica, useReponerCajaChica } from '../composables/useCajaChica';

const $q = useQuasar();
const session = useSessionStore();

// Mostrar los botones es comodidad; la API exige el permiso igual.
const puedeRegistrar = computed(() => session.tienePermiso('cajachica.registrar'));
const puedeConfigurar = computed(() => session.tienePermiso('gastos.registrar'));
const puedeReponer = puedeConfigurar;

const consulta = useCajaChica();
const caja = computed(() => consulta.data.value);
const reponer = useReponerCajaChica();
const resultado = ref<string | null>(null);
const errorReposicion = ref<string | null>(null);

const porcentaje = computed(() =>
  caja.value ? porcentajeGastado(caja.value.fondo, caja.value.gastado) : 0,
);

watch(
  () => session.condominioId,
  () => {
    resultado.value = null;
    errorReposicion.value = null;
  },
);

function avisar(mensaje: string): void {
  resultado.value = mensaje;
}

function registrar(): void {
  if (!caja.value) return;
  $q.dialog({
    component: GastoCajaChicaDialog,
    componentProps: { disponible: caja.value.disponible },
  }).onOk(avisar);
}

function configurar(): void {
  const c = caja.value;
  $q.dialog({
    component: FondoCajaChicaDialog,
    componentProps: {
      fondo: c?.configurada ? c.fondo : '',
      responsable: c?.responsable ?? '',
      gastado: c?.gastado ?? '0.00',
    },
  }).onOk(avisar);
}

function confirmarReposicion(): void {
  const c = caja.value;
  if (!c || reponer.isPending.value) return;
  $q.dialog({
    title: 'Reponer el fondo',
    message: `Se creará una cuenta por pagar de ${formatoMoneda(c.gastado)} por ${c.movimientos.length} gasto(s). Seguirá el flujo normal: aprobación, pago y conciliación.`,
    cancel: { label: 'Cancelar', flat: true, noCaps: true },
    ok: { label: 'Reponer', unelevated: true, noCaps: true, color: 'primary' },
    persistent: true,
  }).onOk(() => {
    errorReposicion.value = null;
    reponer.mutate(undefined, {
      onSuccess: ({ gastoNumero }) =>
        avisar(
          `Reposición ${gastoNumero === '' ? '' : gastoNumero + ' '}creada. Queda por aprobar en Cuentas por pagar.`,
        ),
      onError: (error) => {
        const apiError = aApiError(error);
        // Sin respuesta o 5xx la reposición pudo crearse: se avisa para no duplicarla
        errorReposicion.value =
          apiError.estado === 0 || apiError.estado >= 500
            ? `${apiError.mensaje} Revisa Cuentas por pagar antes de reintentar: la reposición pudo crearse.`
            : apiError.mensaje;
      },
    });
  });
}
</script>

<style scoped>
.cc {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.cc__resultado {
  padding: 12px 16px;
  border-radius: 10px;
  background: #e3efec;
  color: #0b4a47;
  font-weight: 700;
}

.cc__kpis {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 14px;
}

.cc__kpi {
  padding: 16px 18px;
}

.cc__kpi-titulo {
  font-size: 13px;
  font-weight: 700;
  color: var(--safic-texto-suave);
}

.cc__kpi-valor {
  margin-top: 6px;
  font-size: 26px;
  font-weight: 800;
  letter-spacing: -0.4px;
  font-variant-numeric: tabular-nums;
}

.cc__kpi-valor--chico {
  font-size: 18px;
}

.cc__sub {
  font-size: 12px;
  color: var(--safic-texto-suave);
}

.cc__tabla {
  overflow-x: auto;
}

.cc__fila {
  display: grid;
  grid-template-columns: 90px 1.6fr 1.2fr 110px 130px;
  gap: 12px;
  align-items: center;
  min-width: 700px;
  padding: 10px 18px;
  border-top: 1px solid var(--safic-borde);
  font-size: 14px;
}

.cc__fila--cabecera {
  padding-block: 10px;
  border-top: none;
  background: var(--safic-fondo);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.3px;
  color: var(--safic-texto-suave);
}

.cc__monto {
  font-weight: 800;
  font-variant-numeric: tabular-nums;
}

.cc__pie {
  display: flex;
  justify-content: flex-end;
  padding: 14px 18px;
  border-top: 1px solid var(--safic-borde);
}

.cc__vacio {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 40px 16px;
  text-align: center;
}
</style>
