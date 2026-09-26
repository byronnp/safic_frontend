<template>
  <q-dialog ref="dialogRef" persistent @hide="onDialogHide">
    <q-card class="safic-card" style="width: 420px; max-width: 92vw">
      <q-card-section>
        <div class="text-h6 text-weight-bold">Nuevo bloque</div>
        <div class="text-suave text-body2">Ej.: Torre A, Bloque 3, Etapa norte.</div>
      </q-card-section>

      <q-form novalidate @submit="guardar">
        <q-card-section class="q-gutter-y-md">
          <q-banner v-if="errorGeneral" dense rounded class="bg-red-1 text-negative" role="alert">
            {{ errorGeneral }}
          </q-banner>

          <q-input
            v-model.trim="formulario.nombre"
            outlined
            label="Nombre *"
            maxlength="60"
            counter
            autofocus
            :error="!!errores.nombre"
            :error-message="errores.nombre"
          />

          <q-input
            v-model.number="formulario.orden"
            outlined
            type="number"
            label="Orden en listas"
            hint="Opcional. Los bloques se muestran de menor a mayor."
            :error="!!errores.orden"
            :error-message="errores.orden"
          />
        </q-card-section>

        <q-card-actions align="right" class="q-pa-md">
          <q-btn
            flat
            no-caps
            label="Cancelar"
            :disable="crear.isPending.value"
            @click="onDialogCancel"
          />
          <q-btn
            type="submit"
            color="primary"
            unelevated
            no-caps
            label="Guardar"
            :loading="crear.isPending.value"
          />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { useDialogPluginComponent } from 'quasar';
import { reactive, ref } from 'vue';
import { z } from 'zod';

import { aApiError } from '@/core/api/errors';

import { useCrearBloque } from '../composables/useBloques';
import type { Bloque } from '../services/bloques.service';

defineEmits([...useDialogPluginComponent.emits]);

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } = useDialogPluginComponent<Bloque>();

const esquema = z.object({
  nombre: z.string().min(1, 'Escribe el nombre del bloque.').max(60, 'Máximo 60 caracteres.'),
  orden: z
    .number('El orden debe ser un número.')
    .int('El orden debe ser un número entero.')
    .min(0, 'El orden no puede ser negativo.')
    .max(999, 'El orden máximo es 999.')
    .optional(),
});

const formulario = reactive<{ nombre: string; orden: number | '' | undefined }>({
  nombre: '',
  orden: undefined,
});
const errores = reactive<{ nombre: string | undefined; orden: string | undefined }>({
  nombre: undefined,
  orden: undefined,
});
const errorGeneral = ref<string | null>(null);

const crear = useCrearBloque();

async function guardar(): Promise<void> {
  errores.nombre = undefined;
  errores.orden = undefined;
  errorGeneral.value = null;

  const validacion = esquema.safeParse({
    nombre: formulario.nombre,
    orden: formulario.orden === '' ? undefined : formulario.orden,
  });

  if (!validacion.success) {
    for (const problema of validacion.error.issues) {
      const campo = problema.path[0];
      if (campo === 'nombre' || campo === 'orden') {
        errores[campo] ??= problema.message;
      }
    }
    return;
  }

  try {
    onDialogOK(await crear.mutateAsync(validacion.data));
  } catch (error) {
    const apiError = aApiError(error);
    errores.nombre = apiError.campo('nombre');
    errores.orden = apiError.campo('orden');
    if (!errores.nombre && !errores.orden) {
      errorGeneral.value = apiError.mensaje;
    }
  }
}
</script>
