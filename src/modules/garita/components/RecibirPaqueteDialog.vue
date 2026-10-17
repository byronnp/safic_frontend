<template>
  <q-dialog ref="dialogRef" persistent @hide="onDialogHide">
    <q-card class="safic-dialogo" style="width: 440px; max-width: 100%">
      <q-form novalidate @submit="guardar">
        <div class="q-pa-lg column" style="gap: 16px">
          <div>
            <div class="safic-dialogo__titulo">Recibir paquete</div>
            <div class="text-suave q-mt-xs" style="font-size: 14px">
              Foto del paquete y a qué unidad va. Se avisa a quienes viven ahí.
            </div>
          </div>

          <div v-if="errorGeneral" class="safic-alerta" role="alert">{{ errorGeneral }}</div>

          <div class="safic-campo">
            <label for="paq-foto" class="safic-campo__etiqueta">Foto</label>
            <q-file
              v-model="f.foto"
              for="paq-foto"
              class="safic-input"
              outlined
              accept="image/jpeg,image/png"
              capture="environment"
              max-file-size="5242880"
              clearable
              hide-bottom-space
              :error="!!errores.foto"
              :error-message="errores.foto"
              @rejected="errores.foto = 'Sube una foto JPG o PNG de hasta 5 MB.'"
            >
              <template #prepend><q-icon name="sym_r_photo_camera" /></template>
            </q-file>
          </div>

          <div class="safic-campo">
            <label for="paq-unidad" class="safic-campo__etiqueta">Unidad</label>
            <q-input
              v-model="f.unidad"
              for="paq-unidad"
              class="safic-input"
              outlined
              maxlength="20"
              placeholder="Ej.: A-102"
              hide-bottom-space
              :error="!!errores.unidad"
              :error-message="errores.unidad"
            />
          </div>

          <div class="safic-campo">
            <label for="paq-empresa" class="safic-campo__etiqueta">Empresa o quién lo envía</label>
            <q-input
              v-model="f.empresa"
              for="paq-empresa"
              class="safic-input"
              outlined
              maxlength="80"
              hide-bottom-space
              :error="!!errores.empresa"
              :error-message="errores.empresa"
            />
          </div>

          <div class="safic-campo">
            <label for="paq-desc" class="safic-campo__etiqueta">Descripción (opcional)</label>
            <q-input
              v-model="f.descripcion"
              for="paq-desc"
              class="safic-input"
              outlined
              maxlength="60"
              placeholder="Ej.: Caja mediana"
              hide-bottom-space
              :error="!!errores.descripcion"
              :error-message="errores.descripcion"
            />
          </div>

          <div class="row justify-end" style="gap: 10px">
            <q-btn
              unelevated
              no-caps
              class="safic-btn safic-btn--secundario"
              label="Cancelar"
              :disable="recibiendo.isPending.value"
              @click="onDialogCancel"
            />
            <q-btn
              type="submit"
              color="primary"
              unelevated
              no-caps
              class="safic-btn"
              label="Recibir paquete"
              :loading="recibiendo.isPending.value"
            />
          </div>
        </div>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { useDialogPluginComponent } from 'quasar';
import { reactive, ref, watch } from 'vue';

import { aApiError } from '@/core/api/errors';
import { useSessionStore } from '@/stores/session';

import { useRecibirPaquete } from '../composables/usePaquetes';
import { paqueteVacio, validarPaquete, type ErroresPaquete } from '../paquetes.logica';

defineEmits([...useDialogPluginComponent.emits]);

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } = useDialogPluginComponent<string>();
const session = useSessionStore();

watch(
  () => session.condominioId,
  () => onDialogCancel(),
);

const f = reactive(paqueteVacio());
const errores = reactive<ErroresPaquete>({});
const errorGeneral = ref<string | null>(null);
const recibiendo = useRecibirPaquete();

async function guardar(): Promise<void> {
  // Enter dentro de un campo también envía el formulario: no se registra dos veces
  if (recibiendo.isPending.value) return;
  errorGeneral.value = null;
  for (const k of Object.keys(errores) as (keyof ErroresPaquete)[]) errores[k] = undefined;

  const problemas = validarPaquete(f);
  if (Object.keys(problemas).length > 0) {
    Object.assign(errores, problemas);
    return;
  }

  try {
    await recibiendo.mutateAsync({
      unidad_codigo: f.unidad.trim(),
      empresa: f.empresa.trim(),
      descripcion: f.descripcion.trim() === '' ? null : f.descripcion.trim(),
      foto: f.foto as File,
    });
    onDialogOK(
      `Paquete de ${f.empresa.trim()} recibido para ${f.unidad.trim().toUpperCase()}. Se avisó a la unidad.`,
    );
  } catch (error) {
    const apiError = aApiError(error);
    errores.unidad =
      apiError.codigo === 'UNIDAD_NO_ENCONTRADA'
        ? apiError.mensaje
        : apiError.campo('unidad_codigo');
    errores.empresa = apiError.campo('empresa');
    errores.descripcion = apiError.campo('descripcion');
    errores.foto = apiError.campo('foto');
    if (!Object.values(errores).some(Boolean)) {
      // Sin respuesta o 5xx el paquete pudo registrarse: se avisa para no duplicarlo
      errorGeneral.value =
        apiError.estado === 0 || apiError.estado >= 500
          ? `${apiError.mensaje} Revisa «En garita» antes de reintentar: el paquete pudo registrarse.`
          : apiError.mensaje;
    }
  }
}
</script>
