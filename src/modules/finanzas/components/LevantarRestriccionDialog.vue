<template>
  <q-dialog ref="dialogRef" persistent @hide="onDialogHide">
    <q-card class="safic-dialogo" style="width: 460px; max-width: 100%">
      <q-form novalidate @submit="enviar">
        <div class="q-pa-lg column" style="gap: 18px">
          <div>
            <div class="safic-dialogo__titulo">Levantar la restricción · {{ unidad.codigo }}</div>
            <div class="text-suave q-mt-xs" style="font-size: 14px">
              La unidad vuelve a usar las áreas comunes. Si sigue cumpliendo la condición de mora,
              el sistema puede notificarla otra vez.
            </div>
          </div>

          <div v-if="errorGeneral" class="safic-alerta" role="alert">{{ errorGeneral }}</div>

          <div class="safic-campo">
            <label for="lev-motivo" class="safic-campo__etiqueta"
              >Motivo (queda en la auditoría)</label
            >
            <q-input
              id="lev-motivo"
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
              :disable="levantar.isPending.value"
              @click="onDialogCancel"
            />
            <q-btn
              type="submit"
              color="primary"
              unelevated
              no-caps
              class="safic-btn"
              label="Levantar restricción"
              :loading="levantar.isPending.value"
            />
          </div>
        </div>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { useDialogPluginComponent } from 'quasar';
import { ref, watch } from 'vue';

import { useSessionStore } from '@/stores/session';

import { aApiError } from '@/core/api/errors';

import { useLevantarRestriccion } from '../composables/useMorosidad';
import { validarMotivo } from '../morosidad.logica';
import type { UnidadMorosa } from '../services/morosidad.service';

const props = defineProps<{ unidad: UnidadMorosa }>();
defineEmits([...useDialogPluginComponent.emits]);

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } = useDialogPluginComponent<string>();

const session = useSessionStore();
// Si cambia el condominio con el diálogo abierto, se cierra: la unidad ya no sería de ese condominio
watch(
  () => session.condominioId,
  () => onDialogCancel(),
);

const motivo = ref('');
const errorMotivo = ref<string | undefined>(undefined);
const errorGeneral = ref<string | null>(null);
const levantar = useLevantarRestriccion();

async function enviar(): Promise<void> {
  // Enter dentro del campo también envía el formulario
  if (levantar.isPending.value) return;
  errorGeneral.value = null;
  errorMotivo.value = validarMotivo(motivo.value);
  if (errorMotivo.value) return;

  try {
    await levantar.mutateAsync({ unidadId: props.unidad.unidad_id, motivo: motivo.value.trim() });
    onDialogOK(`Restricción de ${props.unidad.codigo} levantada.`);
  } catch (error) {
    const apiError = aApiError(error);
    // Decide el código: ya la había levantado el sistema (pagó o firmó un convenio)
    if (apiError.codigo === 'SIN_RESTRICCION') {
      onDialogOK(`${props.unidad.codigo} ya no tenía una restricción en curso.`);
      return;
    }
    errorMotivo.value = apiError.campo('motivo');
    if (!errorMotivo.value) errorGeneral.value = apiError.mensaje;
  }
}
</script>
