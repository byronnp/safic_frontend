<template>
  <q-dialog ref="dialogRef" persistent @hide="onDialogHide">
    <q-card class="safic-dialogo" style="width: 480px; max-width: 100%">
      <q-form novalidate @submit="enviar">
        <div class="q-pa-lg column" style="gap: 18px">
          <div>
            <div class="safic-dialogo__titulo">
              {{ inactivar ? 'Inactivar condominio' : 'Reactivar condominio' }}
            </div>
            <div class="text-suave q-mt-xs" style="font-size: 14px">
              <template v-if="inactivar">
                Nadie de <strong>{{ condominio.nombre }}</strong> podrá entrar mientras esté
                inactivo. No se borra ningún dato y puedes reactivarlo cuando quieras.
              </template>
              <template v-else>
                <strong>{{ condominio.nombre }}</strong> vuelve a su estado anterior y sus usuarios
                podrán entrar de nuevo.
              </template>
            </div>
          </div>

          <div v-if="errorGeneral" class="safic-alerta" role="alert">{{ errorGeneral }}</div>

          <div class="safic-campo">
            <label for="mc-motivo" class="safic-campo__etiqueta"
              >Motivo (queda en la bitácora)</label
            >
            <q-input
              id="mc-motivo"
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
              :disable="ocupado"
              @click="onDialogCancel"
            />
            <q-btn
              type="submit"
              unelevated
              no-caps
              class="safic-btn"
              :color="inactivar ? 'negative' : 'primary'"
              :label="inactivar ? 'Inactivar' : 'Reactivar'"
              :loading="ocupado"
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

import { useInactivarCondominio, useReactivarCondominio } from '../composables/usePlataforma';
import { validarMotivo } from '../condominio-edicion.logica';
import type { CondominioPlataforma } from '../services/plataforma.service';

const $q = useQuasar();
const props = defineProps<{ condominio: CondominioPlataforma; inactivar: boolean }>();
defineEmits([...useDialogPluginComponent.emits]);

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent<CondominioPlataforma>();

const motivo = ref('');
const errorMotivo = ref<string | undefined>(undefined);
const errorGeneral = ref<string | null>(null);

const inactivarMutacion = useInactivarCondominio();
const reactivarMutacion = useReactivarCondominio();
const ocupado = computed(
  () => inactivarMutacion.isPending.value || reactivarMutacion.isPending.value,
);

async function enviar(): Promise<void> {
  // Enter dentro del campo también envía el formulario: no se envía dos veces
  if (ocupado.value) return;
  errorGeneral.value = null;
  errorMotivo.value = validarMotivo(motivo.value);
  if (errorMotivo.value) return;

  const datos = { id: props.condominio.id, motivo: motivo.value.trim() };
  try {
    onDialogOK(
      props.inactivar
        ? await inactivarMutacion.mutateAsync(datos)
        : await reactivarMutacion.mutateAsync(datos),
    );
  } catch (error) {
    const apiError = aApiError(error);
    // La lista estaba desactualizada (otra persona ya cambió el estado): se avisa, se cierra y la lista se refresca
    if (
      apiError.codigo === 'CONDOMINIO_YA_INACTIVO' ||
      apiError.codigo === 'CONDOMINIO_NO_INACTIVO'
    ) {
      $q.notify({ type: 'warning', message: apiError.mensaje });
      onDialogCancel();
      return;
    }
    errorMotivo.value = apiError.campo('motivo');
    if (!errorMotivo.value) errorGeneral.value = apiError.mensaje;
  }
}
</script>
