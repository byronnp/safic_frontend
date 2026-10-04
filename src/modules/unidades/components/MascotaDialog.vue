<template>
  <q-dialog ref="dialogRef" persistent @hide="onDialogHide">
    <q-card class="safic-dialogo" style="width: 440px; max-width: 100%">
      <q-form novalidate @submit="guardar">
        <div class="q-pa-lg column" style="gap: 18px">
          <div class="safic-dialogo__titulo">
            {{ mascota ? 'Editar mascota' : 'Registrar mascota' }}
          </div>

          <div v-if="errorGeneral" class="safic-alerta" role="alert">{{ errorGeneral }}</div>

          <div class="safic-campo">
            <label for="ma-nombre" class="safic-campo__etiqueta">Nombre</label>
            <q-input
              v-model="formulario.nombre"
              for="ma-nombre"
              class="safic-input"
              outlined
              maxlength="40"
              autofocus
              hide-bottom-space
              :error="!!errores.nombre"
              :error-message="errores.nombre"
            />
          </div>

          <div class="safic-campo">
            <label for="ma-especie" class="safic-campo__etiqueta">Especie</label>
            <q-select
              v-model="formulario.especie"
              for="ma-especie"
              class="safic-input"
              outlined
              emit-value
              map-options
              :options="ESPECIES.map((e) => ({ label: e.texto, value: e.valor }))"
              hide-bottom-space
              :error="!!errores.especie"
              :error-message="errores.especie"
            />
          </div>

          <div class="safic-campo">
            <label for="ma-raza" class="safic-campo__etiqueta">Raza (opcional)</label>
            <q-input
              v-model="formulario.raza"
              for="ma-raza"
              class="safic-input"
              outlined
              maxlength="40"
              hide-bottom-space
              :error="!!errores.raza"
              :error-message="errores.raza"
            />
          </div>

          <div class="row justify-end" style="gap: 10px">
            <q-btn
              unelevated
              no-caps
              class="safic-btn safic-btn--secundario"
              label="Cancelar"
              :disable="guardarMascota.isPending.value"
              @click="onDialogCancel"
            />
            <q-btn
              type="submit"
              color="primary"
              unelevated
              no-caps
              class="safic-btn"
              :label="mascota ? 'Guardar cambios' : 'Registrar mascota'"
              :loading="guardarMascota.isPending.value"
            />
          </div>
        </div>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { useDialogPluginComponent } from 'quasar';
import { reactive, ref, toRef } from 'vue';

import { aApiError } from '@/core/api/errors';

import { useGuardarMascota } from '../composables/useUnidades';
import type { Mascota } from '../services/unidades.service';
import { ESPECIES, validarMascota, type FormularioMascota } from '../vehiculo.formulario';

const props = defineProps<{ unidadId: number; mascota?: Mascota | null }>();
defineEmits([...useDialogPluginComponent.emits]);

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } = useDialogPluginComponent<Mascota>();

const formulario = reactive<FormularioMascota>({
  nombre: props.mascota?.nombre ?? '',
  especie: props.mascota?.especie ?? 'perro',
  raza: props.mascota?.raza ?? '',
});
const errores = reactive<Partial<Record<keyof FormularioMascota, string | undefined>>>({});
const errorGeneral = ref<string | null>(null);

const guardarMascota = useGuardarMascota(toRef(props, 'unidadId'));

async function guardar(): Promise<void> {
  for (const k of Object.keys(errores) as (keyof FormularioMascota)[]) delete errores[k];
  errorGeneral.value = null;

  const validacion = validarMascota(formulario);
  if (!validacion.ok) {
    Object.assign(errores, validacion.errores);
    return;
  }

  try {
    onDialogOK(
      await guardarMascota.mutateAsync({
        ...(props.mascota ? { id: props.mascota.id } : {}),
        datos: validacion.datos,
      }),
    );
  } catch (error) {
    const apiError = aApiError(error);
    for (const campo of ['nombre', 'especie', 'raza'] as const) {
      errores[campo] = apiError.campo(campo);
    }
    if (!Object.values(errores).some(Boolean)) errorGeneral.value = apiError.mensaje;
  }
}
</script>
