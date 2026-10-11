<template>
  <q-dialog ref="dialogRef" persistent @hide="onDialogHide">
    <q-card class="safic-dialogo" style="width: 480px; max-width: 100%">
      <q-form novalidate @submit="enviar">
        <div class="q-pa-lg column" style="gap: 18px">
          <div>
            <div class="safic-dialogo__titulo">Reabrir {{ nombre }}</div>
            <div class="text-suave q-mt-xs" style="font-size: 14px">
              El mes vuelve a admitir movimientos. Queda en la auditoría quién lo reabrió y por qué.
            </div>
          </div>

          <div v-if="errorGeneral" class="safic-alerta" role="alert">{{ errorGeneral }}</div>

          <div class="safic-campo">
            <label for="reabrir-motivo" class="safic-campo__etiqueta">Motivo</label>
            <q-input
              id="reabrir-motivo"
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

          <div class="row justify-end" style="gap: 10px">
            <q-btn
              unelevated
              no-caps
              class="safic-btn safic-btn--secundario"
              label="Cancelar"
              :disable="reabrir.isPending.value"
              @click="onDialogCancel"
            />
            <q-btn
              type="submit"
              color="primary"
              unelevated
              no-caps
              class="safic-btn"
              label="Reabrir mes"
              :loading="reabrir.isPending.value"
            />
          </div>
        </div>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { useDialogPluginComponent, useQuasar } from 'quasar';
import { computed, ref } from 'vue';

import { aApiError } from '@/core/api/errors';
import { nombreMes } from '@/utils/periodo';

import { useReabrirMes } from '../composables/useCierreMes';
import { validarMotivoReapertura } from '../cierre-mes.logica';
import type { CierreMes } from '../services/cierre-mes.service';

const $q = useQuasar();
const props = defineProps<{ periodo: string }>();
defineEmits([...useDialogPluginComponent.emits]);

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent<CierreMes>();

const nombre = computed(() => nombreMes(props.periodo).toLowerCase());
const motivo = ref('');
const errorMotivo = ref<string | undefined>(undefined);
const errorGeneral = ref<string | null>(null);
const reabrir = useReabrirMes();

async function enviar(): Promise<void> {
  // Enter dentro del campo también envía el formulario
  if (reabrir.isPending.value) return;
  errorGeneral.value = null;
  errorMotivo.value = validarMotivoReapertura(motivo.value);
  if (errorMotivo.value) return;

  try {
    onDialogOK(await reabrir.mutateAsync({ periodo: props.periodo, motivo: motivo.value.trim() }));
  } catch (error) {
    const apiError = aApiError(error);
    errorMotivo.value = apiError.campo('motivo');
    // Decide el código: ya estaba abierto (se cierra y la lista se refresca) o hay un mes posterior cerrado
    if (apiError.codigo === 'PERIODO_NO_CERRADO') {
      $q.notify({ type: 'warning', message: apiError.mensaje });
      onDialogCancel();
      return;
    }
    if (!errorMotivo.value) errorGeneral.value = apiError.mensaje;
  }
}
</script>
