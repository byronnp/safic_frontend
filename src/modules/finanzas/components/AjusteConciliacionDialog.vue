<template>
  <q-dialog ref="dialogRef" persistent @hide="onDialogHide">
    <q-card class="safic-dialogo" style="width: 480px; max-width: 100%">
      <q-form novalidate @submit="enviar">
        <div class="q-pa-lg column" style="gap: 18px">
          <div>
            <div class="safic-dialogo__titulo">Registrar ajuste con motivo</div>
            <div class="text-suave q-mt-xs" style="font-size: 14px">
              Úsalo solo para una diferencia que no vas a poder identificar. Positivo suma al saldo
              de la app y negativo resta; queda en la auditoría.
            </div>
          </div>

          <div v-if="errorGeneral" class="safic-alerta" role="alert">{{ errorGeneral }}</div>

          <div class="safic-campo">
            <label for="aj-monto" class="safic-campo__etiqueta">Monto (USD)</label>
            <q-input
              id="aj-monto"
              v-model="monto"
              class="safic-input"
              outlined
              inputmode="decimal"
              prefix="$"
              autofocus
              hide-bottom-space
              :error="!!errores.monto"
              :error-message="errores.monto"
            />
          </div>

          <div class="safic-campo">
            <label for="aj-motivo" class="safic-campo__etiqueta">Motivo</label>
            <q-input
              id="aj-motivo"
              v-model="motivo"
              class="safic-input"
              outlined
              type="textarea"
              autogrow
              maxlength="300"
              hide-bottom-space
              :error="!!errores.motivo"
              :error-message="errores.motivo"
            />
          </div>

          <div class="row justify-end" style="gap: 10px">
            <q-btn
              unelevated
              no-caps
              class="safic-btn safic-btn--secundario"
              label="Cancelar"
              :disable="ajustar.isPending.value"
              @click="onDialogCancel"
            />
            <q-btn
              type="submit"
              color="primary"
              unelevated
              no-caps
              class="safic-btn"
              label="Registrar ajuste"
              :loading="ajustar.isPending.value"
            />
          </div>
        </div>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { useDialogPluginComponent } from 'quasar';
import { reactive, ref } from 'vue';

import { aApiError } from '@/core/api/errors';

import { useAjustarConciliacion } from '../composables/useConciliacion';
import { normalizarSaldo, validarAjuste } from '../conciliacion.logica';
import type { Conciliacion } from '../services/conciliacion.service';

const props = defineProps<{ estadoId: number; sugerido: string }>();
defineEmits([...useDialogPluginComponent.emits]);

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent<Conciliacion>();

const monto = ref(props.sugerido);
const motivo = ref('');
const errores = reactive<{ monto?: string | undefined; motivo?: string | undefined }>({});
const errorGeneral = ref<string | null>(null);
const ajustar = useAjustarConciliacion();

async function enviar(): Promise<void> {
  // Enter dentro de un campo también envía el formulario: no se registra dos veces
  if (ajustar.isPending.value) return;
  errorGeneral.value = null;
  errores.monto = undefined;
  errores.motivo = undefined;

  const problemas = validarAjuste(monto.value, motivo.value);
  if (problemas.monto || problemas.motivo) {
    Object.assign(errores, problemas);
    return;
  }

  try {
    onDialogOK(
      await ajustar.mutateAsync({
        estadoId: props.estadoId,
        monto: normalizarSaldo(monto.value),
        motivo: motivo.value.trim(),
      }),
    );
  } catch (error) {
    const apiError = aApiError(error);
    errores.monto = apiError.campo('monto');
    errores.motivo = apiError.campo('motivo');
    if (!errores.monto && !errores.motivo) {
      const incierto = apiError.estado === 0 || apiError.estado >= 500;
      errorGeneral.value = incierto
        ? `${apiError.mensaje} Revisa el cuadre antes de reintentar: el ajuste pudo registrarse.`
        : apiError.mensaje;
    }
  }
}
</script>
