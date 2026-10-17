<template>
  <q-dialog ref="dialogRef" persistent @hide="onDialogHide">
    <q-card class="safic-dialogo" style="width: 520px; max-width: 100%">
      <div class="q-pa-lg column" style="gap: 18px">
        <div>
          <div class="safic-dialogo__titulo">Convenio de pago · {{ unidad.codigo }}</div>
          <div class="text-suave q-mt-xs" style="font-size: 14px">
            {{ textoResponsable(unidad) }}
          </div>
        </div>

        <div v-if="convenios.isPending.value" aria-busy="true">
          <q-skeleton type="rect" height="120px" />
        </div>
        <div v-else-if="convenios.isError.value" class="safic-alerta" role="alert">
          {{ convenios.error.value?.mensaje }}
          <q-btn flat no-caps dense label="Reintentar" @click="convenios.refetch()" />
        </div>

        <!-- Hay un convenio activo: su avance y la opción de cancelarlo -->
        <template v-else-if="activo">
          <div class="conv__resumen">
            <div>
              <div class="conv__sub">Total acordado</div>
              <strong>{{ formatoMoneda(activo.monto_total) }}</strong>
            </div>
            <div>
              <div class="conv__sub">Pagado desde la firma</div>
              <strong>{{ formatoMoneda(activo.pagado) }}</strong>
            </div>
            <EstadoBadge :tono="activo.al_dia ? 'exito' : 'alerta'">
              {{ activo.al_dia ? 'Al día' : 'Atrasado' }}
            </EstadoBadge>
          </div>

          <ol class="conv__plan">
            <li
              v-for="p in activo.plan"
              :key="p.numero"
              :class="{ conv__cubierta: p.numero <= activo.cuotas_cubiertas }"
            >
              <span>Cuota {{ p.numero }} · {{ formatoFecha(p.vence_el) }}</span>
              <strong>{{ formatoMoneda(p.monto) }}</strong>
              <q-icon
                v-if="p.numero <= activo.cuotas_cubiertas"
                name="sym_r_check_circle"
                size="18px"
              />
            </li>
          </ol>

          <div v-if="cancelando" class="safic-campo">
            <label for="conv-motivo" class="safic-campo__etiqueta">Motivo de la cancelación</label>
            <q-input
              id="conv-motivo"
              v-model="motivo"
              class="safic-input"
              outlined
              type="textarea"
              autogrow
              maxlength="300"
              autofocus
              hide-bottom-space
              :error="!!errorMotivo"
              :error-message="errorMotivo"
            />
          </div>
          <div v-if="errorGeneral" class="safic-alerta" role="alert">{{ errorGeneral }}</div>

          <div class="row justify-end" style="gap: 10px">
            <q-btn
              unelevated
              no-caps
              class="safic-btn safic-btn--secundario"
              label="Cerrar"
              :disable="cancelar.isPending.value"
              @click="onDialogCancel"
            />
            <template v-if="puedeGestionar">
              <q-btn
                v-if="!cancelando"
                unelevated
                no-caps
                color="negative"
                class="safic-btn"
                label="Cancelar convenio"
                @click="cancelando = true"
              />
              <q-btn
                v-else
                unelevated
                no-caps
                color="negative"
                class="safic-btn"
                label="Confirmar cancelación"
                :loading="cancelar.isPending.value"
                @click="confirmarCancelacion"
              />
            </template>
          </div>
        </template>

        <!-- Sin convenio: se puede firmar uno -->
        <q-form v-else novalidate class="column" style="gap: 18px" @submit="firmar">
          <div class="text-suave" style="font-size: 14px">
            Deuda vencida: <strong>{{ formatoMoneda(unidad.saldo_vencido) }}</strong> ({{
              detalleDeuda(unidad)
            }}). Se paga en cuotas mensuales iguales; los pagos que se aprueben desde hoy las cubren
            en orden. Firmarlo levanta la restricción de áreas comunes.
          </div>

          <div v-if="errorGeneral" class="safic-alerta" role="alert">{{ errorGeneral }}</div>

          <div class="row" style="gap: 12px">
            <div class="safic-campo col" style="min-width: 140px">
              <label for="conv-cuotas" class="safic-campo__etiqueta">Número de cuotas</label>
              <q-input
                id="conv-cuotas"
                v-model="f.cuotas"
                class="safic-input"
                outlined
                inputmode="numeric"
                hide-bottom-space
                :error="!!errores.cuotas"
                :error-message="errores.cuotas"
              />
            </div>
            <div class="safic-campo col" style="min-width: 170px">
              <label for="conv-primera" class="safic-campo__etiqueta">Primera cuota</label>
              <q-input
                id="conv-primera"
                v-model="f.primeraCuotaEl"
                class="safic-input"
                outlined
                type="date"
                :min="hoy"
                hide-bottom-space
                :error="!!errores.primeraCuotaEl"
                :error-message="errores.primeraCuotaEl"
              />
            </div>
          </div>

          <div class="row justify-end" style="gap: 10px">
            <q-btn
              unelevated
              no-caps
              class="safic-btn safic-btn--secundario"
              label="Cancelar"
              :disable="crear.isPending.value"
              @click="onDialogCancel"
            />
            <q-btn
              v-if="puedeGestionar"
              type="submit"
              color="primary"
              unelevated
              no-caps
              class="safic-btn"
              label="Firmar convenio"
              :loading="crear.isPending.value"
            />
          </div>
        </q-form>
      </div>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { useDialogPluginComponent } from 'quasar';
import { computed, reactive, ref, watch } from 'vue';

import EstadoBadge from '@/components/EstadoBadge.vue';
import { aApiError } from '@/core/api/errors';
import { useSessionStore } from '@/stores/session';
import { hoyEcuador } from '@/utils/fecha';
import { formatoFecha, formatoMoneda } from '@/utils/formato';

import { useCancelarConvenio, useConvenios, useCrearConvenio } from '../composables/useMorosidad';
import {
  convenioVacio,
  detalleDeuda,
  textoResponsable,
  validarConvenio,
  validarMotivo,
  type ErroresConvenio,
} from '../morosidad.logica';
import type { UnidadMorosa } from '../services/morosidad.service';

const props = defineProps<{ unidad: UnidadMorosa }>();
defineEmits([...useDialogPluginComponent.emits]);

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } = useDialogPluginComponent<string>();

const session = useSessionStore();
// Mostrar los botones es comodidad; la API exige morosidad.gestionar igual.
const puedeGestionar = computed(() => session.tienePermiso('morosidad.gestionar'));

// Si cambia el condominio con el diálogo abierto, se cierra: la unidad ya no sería de ese condominio
watch(
  () => session.condominioId,
  () => onDialogCancel(),
);

const hoy = hoyEcuador();
const convenios = useConvenios(computed(() => props.unidad.unidad_id));
const activo = computed(() => convenios.data.value?.find((c) => c.estado === 'activo') ?? null);

const f = reactive(convenioVacio(hoy));
const errores = reactive<ErroresConvenio>({});
const errorGeneral = ref<string | null>(null);
const crear = useCrearConvenio();
const cancelar = useCancelarConvenio();

const cancelando = ref(false);
const motivo = ref('');
const errorMotivo = ref<string | undefined>(undefined);

async function firmar(): Promise<void> {
  // Enter dentro de un campo también envía el formulario: no se firma dos veces
  if (crear.isPending.value) return;
  errorGeneral.value = null;
  errores.cuotas = undefined;
  errores.primeraCuotaEl = undefined;

  const problemas = validarConvenio(f, hoy);
  if (Object.keys(problemas).length > 0) {
    Object.assign(errores, problemas);
    return;
  }

  try {
    await crear.mutateAsync({
      unidadId: props.unidad.unidad_id,
      cuotas: Number(f.cuotas),
      primeraCuotaEl: f.primeraCuotaEl,
    });
    onDialogOK(`Convenio firmado con ${props.unidad.codigo}.`);
  } catch (error) {
    const apiError = aApiError(error);
    errores.cuotas = apiError.campo('cuotas');
    errores.primeraCuotaEl = apiError.campo('primera_cuota_el');
    if (!errores.cuotas && !errores.primeraCuotaEl) {
      // Decide el código: ya había un convenio o ya no hay deuda; se refresca y se explica
      if (apiError.codigo === 'CONVENIO_ACTIVO') void convenios.refetch();
      const incierto = apiError.estado === 0 || apiError.estado >= 500;
      errorGeneral.value = incierto
        ? `${apiError.mensaje} Revisa la lista antes de reintentar: el convenio pudo registrarse.`
        : apiError.mensaje;
    }
  }
}

async function confirmarCancelacion(): Promise<void> {
  if (cancelar.isPending.value || !activo.value) return;
  errorGeneral.value = null;
  errorMotivo.value = validarMotivo(motivo.value);
  if (errorMotivo.value) return;

  try {
    await cancelar.mutateAsync({ id: activo.value.id, motivo: motivo.value.trim() });
    onDialogOK(`Convenio de ${props.unidad.codigo} cancelado.`);
  } catch (error) {
    const apiError = aApiError(error);
    errorMotivo.value = apiError.campo('motivo');
    if (!errorMotivo.value) {
      if (apiError.codigo === 'CONVENIO_NO_ACTIVO') void convenios.refetch();
      errorGeneral.value = apiError.mensaje;
    }
  }
}
</script>

<style scoped>
.conv__resumen {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.conv__sub {
  font-size: 12px;
  color: var(--safic-texto-suave);
}

.conv__plan {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
}

.conv__plan li {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
  border-top: 1px solid var(--safic-borde);
  font-size: 14px;
}

.conv__plan li span {
  flex: 1;
}

.conv__cubierta {
  color: #0b4a47;
}
</style>
