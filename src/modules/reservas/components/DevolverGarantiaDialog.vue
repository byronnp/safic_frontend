<template>
  <q-dialog ref="dialogRef" persistent @hide="onDialogHide">
    <q-card class="safic-dialogo" style="width: 480px; max-width: 100%">
      <q-form novalidate @submit="guardar">
        <div class="q-pa-lg column" style="gap: 16px">
          <div>
            <div class="safic-dialogo__titulo">Devolver garantía</div>
            <div class="text-suave q-mt-xs" style="font-size: 14px">
              {{ garantia.area }} · {{ garantia.unidad }} · {{ fechaCorta(garantia.fecha) }}
            </div>
          </div>

          <div class="devolver__monto">
            <span class="devolver__etiqueta">Se devuelve</span>
            <strong>{{ formatoMoneda(garantia.monto) }}</strong>
            <span v-if="descontado" class="devolver__etiqueta">
              de {{ formatoMoneda(garantia.garantia) }} (descontados
              {{ formatoMoneda(descontado) }})
            </span>
          </div>

          <div v-if="errorGeneral" class="safic-alerta" role="alert">{{ errorGeneral }}</div>

          <div>
            <div class="safic-campo__etiqueta">Cómo se devolvió</div>
            <div role="radiogroup" aria-label="Forma de devolución" class="devolver__formas">
              <button
                v-for="o in FORMAS_DEVOLUCION"
                :key="o.valor"
                type="button"
                role="radio"
                class="devolver__forma"
                :class="{ 'devolver__forma--elegida': f.forma === o.valor }"
                :aria-checked="f.forma === o.valor"
                @click="elegir(o.valor)"
              >
                {{ o.titulo }}
              </button>
            </div>
            <div v-if="errores.forma" class="devolver__error" role="alert">{{ errores.forma }}</div>
          </div>

          <div class="safic-campo">
            <label for="dev-fecha" class="safic-campo__etiqueta">Día de la devolución</label>
            <q-input
              v-model="f.fecha"
              for="dev-fecha"
              class="safic-input"
              outlined
              type="date"
              :min="garantia.fecha"
              :max="hoy"
              hide-bottom-space
              :error="!!errores.fecha"
              :error-message="errores.fecha"
            />
          </div>

          <div class="safic-campo">
            <label for="dev-ref" class="safic-campo__etiqueta">
              {{
                f.forma === 'transferencia' ? 'Número de la transferencia' : 'Referencia (opcional)'
              }}
            </label>
            <q-input
              v-model="f.referencia"
              for="dev-ref"
              class="safic-input"
              outlined
              maxlength="40"
              hide-bottom-space
              :error="!!errores.referencia"
              :error-message="errores.referencia"
            />
          </div>

          <div class="devolver__aviso">
            El sistema no mueve el dinero: esto deja el registro. Al conciliar el banco, clasifica
            la salida como «otro».
          </div>

          <div class="row justify-end" style="gap: 10px">
            <q-btn
              unelevated
              no-caps
              class="safic-btn safic-btn--secundario"
              label="Cancelar"
              :disable="devolviendo.isPending.value"
              @click="onDialogCancel"
            />
            <q-btn
              type="submit"
              color="primary"
              unelevated
              no-caps
              class="safic-btn"
              label="Registrar devolución"
              :loading="devolviendo.isPending.value"
            />
          </div>
        </div>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { useDialogPluginComponent } from 'quasar';
import { computed, reactive, ref, watch } from 'vue';

import { aApiError } from '@/core/api/errors';
import { useSessionStore } from '@/stores/session';
import { aCentavos, deCentavos } from '@/utils/dinero';
import { hoyEcuador } from '@/utils/fecha';
import { formatoMoneda } from '@/utils/formato';

import { useDevolverGarantia } from '../composables/useGarantias';
import {
  aDevolucion,
  devolucionVacia,
  FORMAS_DEVOLUCION,
  validarDevolucion,
  type ErroresDevolucion,
} from '../garantias.logica';
import { fechaCorta } from '../reservas.logica';
import type { FormaDevolucion, GarantiaReserva } from '../services/garantias.service';

const props = defineProps<{ garantia: GarantiaReserva }>();
defineEmits([...useDialogPluginComponent.emits]);

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } = useDialogPluginComponent<string>();
const session = useSessionStore();

// Si cambia el condominio con el diálogo abierto, se cierra: la reserva ya no sería de ese condominio
watch(
  () => session.condominioId,
  () => onDialogCancel(),
);

const hoy = hoyEcuador();
const f = reactive(devolucionVacia(hoy));
const errores = reactive<ErroresDevolucion>({});
const errorGeneral = ref<string | null>(null);
const devolviendo = useDevolverGarantia();

/** Lo que se descontó de la garantía por daños (vacío si se devuelve completa). */
const descontado = computed(() => {
  const resto = aCentavos(props.garantia.garantia) - aCentavos(props.garantia.monto);
  return resto > 0 ? deCentavos(resto) : null;
});

function elegir(forma: FormaDevolucion): void {
  f.forma = forma;
  errores.forma = undefined;
}

async function guardar(): Promise<void> {
  if (devolviendo.isPending.value) return;
  errorGeneral.value = null;
  for (const k of ['forma', 'fecha', 'referencia'] as const) errores[k] = undefined;

  const problemas = validarDevolucion(f, hoy, props.garantia.fecha);
  if (Object.keys(problemas).length > 0) {
    Object.assign(errores, problemas);
    return;
  }

  try {
    await devolviendo.mutateAsync({ reservaId: props.garantia.reserva_id, datos: aDevolucion(f) });
    onDialogOK('Devolución de la garantía registrada.');
  } catch (error) {
    const apiError = aApiError(error);
    errores.forma = apiError.campo('forma');
    errores.fecha = apiError.campo('fecha');
    errores.referencia = apiError.campo('referencia');
    if (!Object.values(errores).some(Boolean)) {
      // Sin respuesta o 5xx el registro pudo guardarse: se avisa para no duplicarlo
      errorGeneral.value =
        apiError.estado === 0 || apiError.estado >= 500
          ? `${apiError.mensaje} Revisa la lista antes de reintentar: la devolución pudo registrarse.`
          : apiError.mensaje;
    }
  }
}
</script>

<style scoped>
.devolver__monto {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 8px;
  padding: 12px 14px;
  border: 1px solid var(--safic-borde);
  border-radius: 12px;
  background: #f7f6f2;
  font-size: 22px;
}

.devolver__etiqueta {
  font-size: 13px;
  color: var(--safic-texto-suave);
}

.devolver__formas {
  display: flex;
  gap: 8px;
  margin-top: 6px;
}

.devolver__forma {
  flex: 1;
  padding: 10px 14px;
  border: 1px solid var(--safic-borde);
  border-radius: 12px;
  background: #ffffff;
  font: inherit;
  font-weight: 700;
  color: inherit;
  cursor: pointer;
}

.devolver__forma--elegida {
  border: 2px solid var(--q-primary);
  padding: 9px 13px;
}

.devolver__error {
  margin-top: 4px;
  font-size: 12px;
  color: var(--q-negative);
}

.devolver__aviso {
  font-size: 12px;
  color: var(--safic-texto-suave);
}
</style>
