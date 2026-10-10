<template>
  <q-dialog ref="dialogRef" persistent @hide="onDialogHide">
    <q-card class="safic-dialogo">
      <q-form novalidate @submit="guardar">
        <div class="q-pa-lg column" style="gap: 20px">
          <div>
            <div class="safic-dialogo__titulo">{{ bloque ? 'Editar bloque' : 'Nuevo bloque' }}</div>
            <div class="text-suave q-mt-xs" style="font-size: 14px">
              Torre, bloque o etapa. Ej.: Torre A, Bloque 3, Etapa norte.
            </div>
          </div>

          <div v-if="errorGeneral" class="safic-alerta" role="alert">{{ errorGeneral }}</div>

          <div class="safic-campo">
            <label for="bloque-nombre" class="safic-campo__etiqueta">Nombre</label>
            <q-input
              v-model.trim="formulario.nombre"
              for="bloque-nombre"
              class="safic-input"
              outlined
              maxlength="60"
              autofocus
              hide-bottom-space
              :error="!!errores.nombre"
              :error-message="errores.nombre"
            />
          </div>

          <div class="safic-campo">
            <label for="bloque-orden" class="safic-campo__etiqueta"
              >Orden en listas (opcional)</label
            >
            <q-input
              v-model.number="formulario.orden"
              for="bloque-orden"
              class="safic-input"
              outlined
              type="number"
              hide-bottom-space
              :error="!!errores.orden"
              :error-message="errores.orden"
            />
            <div class="text-suave" style="font-size: 12px">
              Los bloques se muestran de menor a mayor.
            </div>
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
              color="primary"
              unelevated
              no-caps
              class="safic-btn"
              label="Guardar bloque"
              :loading="ocupado"
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
import { z } from 'zod';

import { aApiError } from '@/core/api/errors';

import { useCrearBloque, useEditarBloque } from '../composables/useBloques';
import type { Bloque } from '../services/bloques.service';

defineEmits([...useDialogPluginComponent.emits]);

const props = defineProps<{ bloque?: Bloque }>();

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
  nombre: props.bloque?.nombre ?? '',
  orden: props.bloque?.orden,
});
const errores = reactive<{ nombre: string | undefined; orden: string | undefined }>({
  nombre: undefined,
  orden: undefined,
});
const errorGeneral = ref<string | null>(null);

const crear = useCrearBloque();
const editar = useEditarBloque();
const ocupado = computed(() => crear.isPending.value || editar.isPending.value);

async function guardar(): Promise<void> {
  // Enter dentro del campo también envía el formulario: no se guarda dos veces
  if (ocupado.value) return;
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
    onDialogOK(
      props.bloque
        ? await editar.mutateAsync({ id: props.bloque.id, cambios: validacion.data })
        : await crear.mutateAsync(validacion.data),
    );
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
