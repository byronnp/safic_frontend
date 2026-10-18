<template>
  <q-dialog ref="dialogRef" persistent @hide="onDialogHide">
    <q-card class="safic-dialogo" style="width: 460px; max-width: 100%">
      <q-form novalidate @submit="guardar">
        <div class="q-pa-lg column" style="gap: 16px">
          <div>
            <div class="safic-dialogo__titulo">Reportar una incidencia</div>
            <div class="text-suave q-mt-xs" style="font-size: 14px">
              La administración la revisa y te responde aquí.
            </div>
          </div>

          <div v-if="errorGeneral" class="safic-alerta" role="alert">{{ errorGeneral }}</div>

          <div class="safic-campo">
            <label for="inc-titulo" class="safic-campo__etiqueta">¿Qué pasa?</label>
            <q-input
              v-model="f.titulo"
              for="inc-titulo"
              class="safic-input"
              outlined
              maxlength="120"
              autofocus
              hide-bottom-space
              placeholder="Ej.: Fuga de agua en el parqueadero"
              :error="!!errores.titulo"
              :error-message="errores.titulo"
            />
          </div>

          <div class="safic-campo">
            <label for="inc-cat" class="safic-campo__etiqueta">Categoría</label>
            <q-select
              v-model="f.categoria"
              for="inc-cat"
              class="safic-input"
              outlined
              emit-value
              map-options
              hide-bottom-space
              :options="CATEGORIAS.map((c) => ({ value: c.id, label: c.etiqueta }))"
              :error="!!errores.categoria"
              :error-message="errores.categoria"
            />
          </div>

          <div v-if="unidades.length > 0" class="safic-campo">
            <label for="inc-unidad" class="safic-campo__etiqueta">Unidad</label>
            <q-select
              v-model="f.unidadId"
              for="inc-unidad"
              class="safic-input"
              outlined
              emit-value
              map-options
              hide-bottom-space
              :options="[
                { value: null, label: 'Áreas comunes (no es de mi unidad)' },
                ...unidades.map((u) => ({ value: u.unidad_id, label: u.codigo })),
              ]"
            />
          </div>

          <div class="safic-campo">
            <label for="inc-desc" class="safic-campo__etiqueta">Detalle</label>
            <q-input
              v-model="f.descripcion"
              for="inc-desc"
              class="safic-input"
              outlined
              type="textarea"
              rows="4"
              maxlength="2000"
              hide-bottom-space
              :error="!!errores.descripcion"
              :error-message="errores.descripcion"
            />
          </div>

          <div class="safic-campo">
            <label for="inc-fotos" class="safic-campo__etiqueta"
              >Fotos (hasta {{ MAX_FOTOS }})</label
            >
            <q-file
              v-model="f.fotos"
              for="inc-fotos"
              class="safic-input"
              outlined
              multiple
              append
              accept="image/jpeg,image/png"
              :max-files="MAX_FOTOS"
              max-file-size="5242880"
              clearable
              hide-bottom-space
              :error="!!errores.fotos"
              :error-message="errores.fotos"
              @rejected="errores.fotos = `Máximo ${MAX_FOTOS} fotos JPG o PNG de hasta 5 MB.`"
            >
              <template #prepend><q-icon name="sym_r_photo_camera" /></template>
            </q-file>
          </div>

          <div class="row justify-end" style="gap: 10px">
            <q-btn
              unelevated
              no-caps
              class="safic-btn safic-btn--secundario"
              label="Cancelar"
              :disable="reportando.isPending.value"
              @click="onDialogCancel"
            />
            <q-btn
              type="submit"
              color="primary"
              unelevated
              no-caps
              class="safic-btn"
              label="Enviar"
              :loading="reportando.isPending.value"
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

import { useReportarIncidencia } from '../composables/useIncidencias';
import {
  CATEGORIAS,
  incidenciaVacia,
  MAX_FOTOS,
  peticionIncidencia,
  validarIncidencia,
  type ErroresIncidencia,
} from '../incidencias.logica';

const props = defineProps<{ unidades: { unidad_id: number; codigo: string }[] }>();
defineEmits([...useDialogPluginComponent.emits]);

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } = useDialogPluginComponent<string>();
const session = useSessionStore();

watch(
  () => session.condominioId,
  () => onDialogCancel(),
);

const f = reactive(incidenciaVacia());
// Con una sola unidad ya viene elegida; con varias, la primera
f.unidadId = props.unidades[0]?.unidad_id ?? null;
const errores = reactive<ErroresIncidencia>({});
const errorGeneral = ref<string | null>(null);
const reportando = useReportarIncidencia();

async function guardar(): Promise<void> {
  // Enter dentro de un campo también envía el formulario: no se reporta dos veces
  if (reportando.isPending.value) return;
  errorGeneral.value = null;
  for (const k of Object.keys(errores) as (keyof ErroresIncidencia)[]) errores[k] = undefined;

  const problemas = validarIncidencia(f);
  if (Object.keys(problemas).length > 0) {
    Object.assign(errores, problemas);
    return;
  }

  try {
    const r = await reportando.mutateAsync(peticionIncidencia(f));
    onDialogOK(`Incidencia #${r.numero} reportada. La administración la revisará.`);
  } catch (error) {
    const apiError = aApiError(error);
    errores.titulo = apiError.campo('titulo');
    errores.descripcion = apiError.campo('descripcion');
    errores.categoria = apiError.campo('categoria');
    errores.fotos =
      apiError.codigo === 'DEMASIADAS_FOTOS'
        ? apiError.mensaje
        : (apiError.campo('fotos') ?? apiError.campo('fotos.0'));
    if (!Object.values(errores).some(Boolean)) {
      // Sin respuesta o 5xx la incidencia pudo registrarse: se avisa para no duplicarla
      errorGeneral.value =
        apiError.estado === 0 || apiError.estado >= 500
          ? `${apiError.mensaje} Revisa tus incidencias antes de reintentar: pudo registrarse.`
          : apiError.mensaje;
    }
  }
}
</script>
