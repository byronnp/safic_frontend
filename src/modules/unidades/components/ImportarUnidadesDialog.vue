<template>
  <q-dialog ref="dialogRef" persistent @hide="onDialogHide">
    <q-card class="safic-dialogo" style="width: 640px; max-width: 95vw">
      <div class="q-pa-lg column" style="gap: 20px">
        <div>
          <div class="safic-dialogo__titulo">Importar unidades desde Excel</div>
          <div class="text-suave q-mt-xs" style="font-size: 14px">
            Descarga la plantilla, llénala (una unidad por fila, máximo 500) y súbela. Antes de
            guardar verás una vista previa; no se crea nada hasta que confirmes.
          </div>
        </div>

        <div v-if="errorGeneral" class="safic-alerta" role="alert">{{ errorGeneral }}</div>

        <div class="row items-center" style="gap: 12px">
          <q-btn
            flat
            no-caps
            color="primary"
            :icon="ICONOS.descargar"
            label="Descargar plantilla"
            :loading="descargando"
            @click="descargarPlantilla"
          />
        </div>

        <div class="safic-campo">
          <label for="importar-archivo" class="safic-campo__etiqueta"
            >Archivo de Excel (.xlsx)</label
          >
          <q-file
            v-model="archivo"
            for="importar-archivo"
            class="safic-input"
            outlined
            accept=".xlsx"
            max-file-size="2097152"
            hide-bottom-space
            clearable
            :disable="revisar.isPending.value || importando"
            @rejected="archivoRechazado"
            @update:model-value="vista = null"
          >
            <template #prepend><q-icon :name="ICONOS.archivo" /></template>
          </q-file>
        </div>

        <template v-if="vista">
          <div class="column" style="gap: 8px" aria-live="polite">
            <div class="row items-center" style="gap: 8px">
              <q-icon
                :name="vista.con_errores === 0 ? ICONOS.correcto : ICONOS.alerta"
                :color="vista.con_errores === 0 ? 'positive' : 'negative'"
                size="22px"
              />
              <span style="font-weight: 700">
                {{ vista.validas }} de {{ vista.total_filas }} filas están listas
                <template v-if="vista.con_errores > 0"
                  >· {{ vista.con_errores }} con error</template
                >
              </span>
            </div>
            <div v-if="vista.bloques_nuevos.length" class="text-suave" style="font-size: 14px">
              Se crearán los bloques: {{ vista.bloques_nuevos.join(', ') }}.
            </div>
            <div v-if="motivo" class="text-suave" style="font-size: 14px" role="status">
              {{ motivo }}
            </div>
          </div>

          <q-markup-table
            v-if="vista.errores.length"
            flat
            bordered
            dense
            class="importacion-errores"
            aria-label="Errores por fila"
          >
            <thead>
              <tr>
                <th class="text-left">Fila</th>
                <th class="text-left">Campo</th>
                <th class="text-left">Error</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(error, i) in vista.errores" :key="`${error.fila}-${error.campo}-${i}`">
                <td>{{ error.fila }}</td>
                <td>{{ etiquetaCampo(error.campo) }}</td>
                <td>{{ error.mensaje }}</td>
              </tr>
            </tbody>
          </q-markup-table>
        </template>

        <div class="row justify-end" style="gap: 10px">
          <q-btn
            unelevated
            no-caps
            class="safic-btn safic-btn--secundario"
            label="Cancelar"
            :disable="revisar.isPending.value || importando"
            @click="onDialogCancel"
          />
          <q-btn
            v-if="!puedeConfirmar"
            color="primary"
            unelevated
            no-caps
            class="safic-btn"
            label="Revisar archivo"
            :disable="!archivo"
            :loading="revisar.isPending.value"
            @click="revisarArchivo"
          />
          <q-btn
            v-else
            color="primary"
            unelevated
            no-caps
            class="safic-btn"
            :label="`Importar ${cantidadUnidades(vista?.validas ?? 0)}`"
            :loading="importando"
            @click="confirmar"
          />
        </div>
      </div>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { useDialogPluginComponent, useQuasar } from 'quasar';
import { computed, ref } from 'vue';

import { aApiError } from '@/core/api/errors';
import { ICONOS } from '@/core/navigation/icons';

import { useImportarUnidades } from '../composables/useUnidades';
import { unidadesService, type ResultadoImportacion } from '../services/unidades.service';
import {
  cantidadUnidades,
  etiquetaCampo,
  motivoSinConfirmar,
  puedeConfirmarImportacion,
} from '../unidad.importacion';

defineEmits([...useDialogPluginComponent.emits]);

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent<ResultadoImportacion>();
const $q = useQuasar();

const archivo = ref<File | null>(null);
const vista = ref<ResultadoImportacion | null>(null);
const errorGeneral = ref<string | null>(null);
const descargando = ref(false);
const importando = ref(false);

const revisar = useImportarUnidades();

const puedeConfirmar = computed(() => puedeConfirmarImportacion(vista.value));
const motivo = computed(() => (vista.value ? motivoSinConfirmar(vista.value) : null));

function archivoRechazado(): void {
  vista.value = null;
  errorGeneral.value = 'El archivo debe ser un Excel (.xlsx) de máximo 2 MB.';
}

async function descargarPlantilla(): Promise<void> {
  errorGeneral.value = null;
  descargando.value = true;
  try {
    const blob = await unidadesService.descargarPlantilla();
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = 'plantilla-unidades.xlsx';
    enlace.click();
    // Algunos navegadores cancelan la descarga si se revoca antes de que empiece
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (error) {
    errorGeneral.value = aApiError(error).mensaje;
  } finally {
    descargando.value = false;
  }
}

async function revisarArchivo(): Promise<void> {
  if (!archivo.value) {
    return;
  }
  errorGeneral.value = null;
  vista.value = null;
  try {
    vista.value = await revisar.mutateAsync({ archivo: archivo.value, confirmar: false });
  } catch (error) {
    errorGeneral.value = aApiError(error).mensaje;
  }
}

async function confirmar(): Promise<void> {
  if (!archivo.value || !puedeConfirmar.value) {
    return;
  }
  errorGeneral.value = null;
  importando.value = true;
  try {
    const resultado = await revisar.mutateAsync({ archivo: archivo.value, confirmar: true });
    $q.notify({
      type: 'positive',
      message: `Se importaron ${cantidadUnidades(resultado.creadas)}.`,
    });
    onDialogOK(resultado);
  } catch (error) {
    const apiError = aApiError(error);
    // El archivo cambió o se llenó el cupo desde la vista previa: se vuelve a revisar
    errorGeneral.value = apiError.mensaje;
    if (apiError.codigo === 'LIMITE_UNIDADES' || apiError.codigo === 'IMPORTACION_CON_ERRORES') {
      await revisarArchivo();
      errorGeneral.value ??= apiError.mensaje;
    }
  } finally {
    importando.value = false;
  }
}
</script>

<style scoped>
.importacion-errores {
  max-height: 260px;
  overflow: auto;
}
</style>
