<template>
  <q-dialog ref="dialogRef" persistent @hide="onDialogHide">
    <q-card class="safic-dialogo" style="width: 480px; max-width: 100%">
      <q-form novalidate @submit="guardar">
        <div class="q-pa-lg column" style="gap: 18px">
          <div class="safic-dialogo__titulo">
            {{ vehiculo ? 'Editar vehículo' : 'Registrar vehículo' }}
          </div>

          <div v-if="errorGeneral" class="safic-alerta" role="alert">{{ errorGeneral }}</div>

          <div class="dialogo__dos">
            <div class="safic-campo">
              <label for="ve-placa" class="safic-campo__etiqueta">Placa</label>
              <q-input
                v-model="formulario.placa"
                for="ve-placa"
                class="safic-input"
                outlined
                maxlength="10"
                autofocus
                placeholder="PBA-1234"
                hide-bottom-space
                :error="!!errores.placa"
                :error-message="errores.placa"
              />
            </div>
            <div class="safic-campo">
              <label for="ve-tipo" class="safic-campo__etiqueta">Tipo</label>
              <q-select
                v-model="formulario.tipo"
                for="ve-tipo"
                class="safic-input"
                outlined
                emit-value
                map-options
                :options="TIPOS_VEHICULO.map((t) => ({ label: t.texto, value: t.valor }))"
              />
            </div>
          </div>

          <div class="dialogo__dos">
            <div class="safic-campo">
              <label for="ve-marca" class="safic-campo__etiqueta">Marca (opcional)</label>
              <q-input
                v-model="formulario.marca"
                for="ve-marca"
                class="safic-input"
                outlined
                maxlength="40"
                hide-bottom-space
                :error="!!errores.marca"
                :error-message="errores.marca"
              />
            </div>
            <div class="safic-campo">
              <label for="ve-modelo" class="safic-campo__etiqueta">Modelo (opcional)</label>
              <q-input
                v-model="formulario.modelo"
                for="ve-modelo"
                class="safic-input"
                outlined
                maxlength="40"
                hide-bottom-space
                :error="!!errores.modelo"
                :error-message="errores.modelo"
              />
            </div>
          </div>

          <div class="safic-campo">
            <label for="ve-color" class="safic-campo__etiqueta">Color (opcional)</label>
            <q-input
              v-model="formulario.color"
              for="ve-color"
              class="safic-input"
              outlined
              maxlength="30"
              hide-bottom-space
              :error="!!errores.color"
              :error-message="errores.color"
            />
          </div>

          <div class="row justify-end" style="gap: 10px">
            <q-btn
              unelevated
              no-caps
              class="safic-btn safic-btn--secundario"
              label="Cancelar"
              :disable="guardarVehiculo.isPending.value"
              @click="onDialogCancel"
            />
            <q-btn
              type="submit"
              color="primary"
              unelevated
              no-caps
              class="safic-btn"
              :label="vehiculo ? 'Guardar cambios' : 'Registrar vehículo'"
              :loading="guardarVehiculo.isPending.value"
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

import { useGuardarVehiculo } from '../composables/useUnidades';
import type { Vehiculo } from '../services/unidades.service';
import { TIPOS_VEHICULO, validarVehiculo, type FormularioVehiculo } from '../vehiculo.formulario';

const props = defineProps<{ unidadId: number; vehiculo?: Vehiculo | null }>();
defineEmits([...useDialogPluginComponent.emits]);

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent<Vehiculo>();

const formulario = reactive<FormularioVehiculo>({
  placa: props.vehiculo?.placa ?? '',
  tipo: props.vehiculo?.tipo ?? 'auto',
  marca: props.vehiculo?.marca ?? '',
  modelo: props.vehiculo?.modelo ?? '',
  color: props.vehiculo?.color ?? '',
});
const errores = reactive<Partial<Record<keyof FormularioVehiculo, string | undefined>>>({});
const errorGeneral = ref<string | null>(null);

const guardarVehiculo = useGuardarVehiculo(toRef(props, 'unidadId'));

async function guardar(): Promise<void> {
  for (const k of Object.keys(errores) as (keyof FormularioVehiculo)[]) delete errores[k];
  errorGeneral.value = null;

  const validacion = validarVehiculo(formulario);
  if (!validacion.ok) {
    Object.assign(errores, validacion.errores);
    return;
  }

  try {
    onDialogOK(
      await guardarVehiculo.mutateAsync({
        ...(props.vehiculo ? { id: props.vehiculo.id } : {}),
        datos: validacion.datos,
      }),
    );
  } catch (error) {
    const apiError = aApiError(error);
    for (const campo of ['placa', 'tipo', 'marca', 'modelo', 'color'] as const) {
      errores[campo] = apiError.campo(campo);
    }
    if (!Object.values(errores).some(Boolean)) errorGeneral.value = apiError.mensaje;
  }
}
</script>

<style scoped>
.dialogo__dos {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

@media (max-width: 599px) {
  .dialogo__dos {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
