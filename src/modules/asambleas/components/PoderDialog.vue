<template>
  <q-dialog ref="dialogRef" persistent @hide="onDialogHide">
    <q-card class="safic-dialogo" style="width: 520px; max-width: 100%">
      <q-form novalidate @submit="enviar">
        <div class="q-pa-lg column" style="gap: 14px">
          <div>
            <div class="safic-dialogo__titulo">Dar poder a un representante</div>
            <div class="text-suave q-mt-xs" style="font-size: 14px">
              Sube el poder notarial o una carta firmada dirigida al presidente o al administrador.
              La administración lo revisa antes de la asamblea.
            </div>
          </div>

          <div v-if="errorGeneral" class="safic-alerta" role="alert">{{ errorGeneral }}</div>

          <div v-if="unidades.length > 1" class="safic-campo">
            <label for="pod-unidad" class="safic-campo__etiqueta">Unidad</label>
            <q-select
              v-model="f.unidadId"
              for="pod-unidad"
              class="safic-input"
              outlined
              emit-value
              map-options
              hide-bottom-space
              :options="unidades.map((u) => ({ label: u.codigo, value: u.unidad_id }))"
              :error="!!errores.unidadId"
              :error-message="errores.unidadId"
            />
          </div>

          <div class="safic-campo">
            <label for="pod-tipo" class="safic-campo__etiqueta">Documento</label>
            <q-select
              v-model="f.tipo"
              for="pod-tipo"
              class="safic-input"
              outlined
              emit-value
              map-options
              hide-bottom-space
              :options="TIPOS_PODER.map((t) => ({ label: t.etiqueta, value: t.valor }))"
            />
          </div>

          <div class="safic-campo">
            <label for="pod-nombre" class="safic-campo__etiqueta">Nombre del representante</label>
            <q-input
              v-model="f.nombre"
              for="pod-nombre"
              class="safic-input"
              outlined
              maxlength="120"
              hide-bottom-space
              :error="!!errores.nombre"
              :error-message="errores.nombre"
            />
          </div>

          <div class="safic-campo">
            <label for="pod-documento" class="safic-campo__etiqueta">
              {{ f.tipoDocumento === 'cedula' ? 'Cédula' : 'Pasaporte' }} del representante
            </label>
            <q-input
              v-model="f.documento"
              for="pod-documento"
              class="safic-input"
              outlined
              inputmode="numeric"
              maxlength="20"
              hide-bottom-space
              :error="!!errores.documento"
              :error-message="errores.documento"
            >
              <template #after>
                <q-btn
                  flat
                  no-caps
                  dense
                  :label="f.tipoDocumento === 'cedula' ? 'Usar pasaporte' : 'Usar cédula'"
                  @click="f.tipoDocumento = f.tipoDocumento === 'cedula' ? 'pasaporte' : 'cedula'"
                />
              </template>
            </q-input>
          </div>

          <div class="safic-campo">
            <label for="pod-archivo" class="safic-campo__etiqueta">PDF del poder o la carta</label>
            <input
              id="pod-archivo"
              type="file"
              accept="application/pdf"
              :aria-invalid="!!errores.archivo"
              @change="elegir"
            />
            <div v-if="errores.archivo" class="pod__error" role="alert">{{ errores.archivo }}</div>
          </div>

          <div class="row justify-end q-gutter-sm">
            <q-btn flat no-caps label="Cancelar" :disable="subiendo" @click="onDialogCancel" />
            <q-btn
              unelevated
              no-caps
              color="primary"
              type="submit"
              label="Enviar poder"
              :loading="subiendo"
            />
          </div>
        </div>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { useDialogPluginComponent } from 'quasar';
import { computed, reactive, ref } from 'vue';

import { aApiError } from '@/core/api/errors';

import { useCargarPoder } from '../composables/useAsambleas';
import {
  aSolicitudPoder,
  poderVacio,
  TIPOS_PODER,
  validarPoder,
  type ErroresPoder,
} from '../poderes.logica';

const props = defineProps<{
  asambleaId: number;
  /** Unidades del propietario que aún no tienen poder vigente. */
  unidades: { unidad_id: number; codigo: string }[];
}>();

defineEmits([...useDialogPluginComponent.emits]);
const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } = useDialogPluginComponent();

const f = reactive(poderVacio(props.unidades.length === 1 ? props.unidades[0]!.unidad_id : null));
const errores = reactive<ErroresPoder>({});
const errorGeneral = ref<string | null>(null);
const cargando = useCargarPoder();
const subiendo = computed(() => cargando.isPending.value);

function elegir(evento: Event): void {
  f.archivo = (evento.target as HTMLInputElement).files?.[0] ?? null;
}

async function enviar(): Promise<void> {
  if (subiendo.value) return;
  errorGeneral.value = null;
  for (const k of ['unidadId', 'nombre', 'documento', 'archivo'] as const) errores[k] = undefined;
  Object.assign(errores, validarPoder(f));
  if (Object.values(errores).some(Boolean)) return;

  try {
    await cargando.mutateAsync({ asambleaId: props.asambleaId, datos: aSolicitudPoder(f) });
    onDialogOK('Poder enviado. La administración lo revisará.');
  } catch (error) {
    const e = aApiError(error);
    errores.nombre = e.campo('representante_nombre');
    errores.documento = e.campo('representante_documento');
    errores.archivo = e.campo('archivo');
    if (!Object.values(errores).some(Boolean)) errorGeneral.value = e.mensaje;
  }
}
</script>

<style scoped>
.pod__error {
  margin-top: 4px;
  font-size: 12px;
  color: var(--q-negative);
}
</style>
