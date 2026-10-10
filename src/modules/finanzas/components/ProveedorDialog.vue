<template>
  <q-dialog ref="dialogRef" persistent @hide="onDialogHide">
    <q-card class="safic-dialogo">
      <q-form novalidate @submit="guardar">
        <div class="q-pa-lg column" style="gap: 20px">
          <div class="safic-dialogo__titulo">
            {{ proveedor ? 'Editar proveedor' : 'Nuevo proveedor' }}
          </div>

          <div v-if="errorGeneral" class="safic-alerta" role="alert">{{ errorGeneral }}</div>

          <div class="safic-campo">
            <label for="prov-ruc" class="safic-campo__etiqueta">RUC</label>
            <q-input
              v-model="formulario.ruc"
              for="prov-ruc"
              class="safic-input"
              outlined
              inputmode="numeric"
              maxlength="13"
              :readonly="!!proveedor"
              :autofocus="!proveedor"
              hide-bottom-space
              :error="!!errores.ruc"
              :error-message="errores.ruc"
            />
            <div v-if="proveedor" class="text-suave" style="font-size: 12px">
              El RUC no se cambia: las facturas lo usan para identificar al proveedor.
            </div>
          </div>

          <div class="safic-campo">
            <label for="prov-nombre" class="safic-campo__etiqueta">Nombre o razón social</label>
            <q-input
              v-model="formulario.razon_social"
              for="prov-nombre"
              class="safic-input"
              outlined
              maxlength="160"
              :autofocus="!!proveedor"
              hide-bottom-space
              :error="!!errores.razon_social"
              :error-message="errores.razon_social"
            />
          </div>

          <div class="safic-campo">
            <label for="prov-categoria" class="safic-campo__etiqueta">Categoría (opcional)</label>
            <q-input
              v-model="formulario.categoria"
              for="prov-categoria"
              class="safic-input"
              outlined
              maxlength="60"
              placeholder="Ej.: Guardianía, Limpieza, Mantenimiento"
              hide-bottom-space
              :error="!!errores.categoria"
              :error-message="errores.categoria"
            />
          </div>

          <div class="row" style="gap: 12px">
            <div class="safic-campo col" style="min-width: 200px">
              <label for="prov-email" class="safic-campo__etiqueta">Correo (opcional)</label>
              <q-input
                v-model="formulario.email"
                for="prov-email"
                class="safic-input"
                outlined
                type="email"
                hide-bottom-space
                :error="!!errores.email"
                :error-message="errores.email"
              />
            </div>
            <div class="safic-campo col" style="min-width: 160px">
              <label for="prov-tel" class="safic-campo__etiqueta">Teléfono (opcional)</label>
              <q-input
                v-model="formulario.telefono"
                for="prov-tel"
                class="safic-input"
                outlined
                maxlength="30"
                hide-bottom-space
                :error="!!errores.telefono"
                :error-message="errores.telefono"
              />
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
              :label="proveedor ? 'Guardar cambios' : 'Agregar proveedor'"
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

import { aApiError } from '@/core/api/errors';

import { useActualizarProveedor, useCrearProveedor } from '../composables/useProveedores';
import {
  peticionProveedor,
  proveedorVacio,
  validarProveedor,
  type ErroresProveedor,
} from '../proveedores.logica';
import type { Proveedor } from '../services/proveedores.service';

const props = defineProps<{ proveedor?: Proveedor }>();
defineEmits([...useDialogPluginComponent.emits]);

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent<Proveedor>();

const formulario = reactive({
  ...proveedorVacio(),
  ...(props.proveedor
    ? {
        ruc: props.proveedor.ruc,
        razon_social: props.proveedor.razon_social,
        categoria: props.proveedor.categoria ?? '',
        email: props.proveedor.email ?? '',
        telefono: props.proveedor.telefono ?? '',
      }
    : {}),
});
const errores = reactive<ErroresProveedor>({});
const errorGeneral = ref<string | null>(null);

const crear = useCrearProveedor();
const actualizar = useActualizarProveedor();
const ocupado = computed(() => crear.isPending.value || actualizar.isPending.value);

async function guardar(): Promise<void> {
  // Enter dentro de un campo también envía el formulario
  if (ocupado.value) return;
  errorGeneral.value = null;
  for (const k of ['ruc', 'razon_social', 'categoria', 'email', 'telefono'] as const)
    errores[k] = undefined;

  const problemas = validarProveedor(formulario, !props.proveedor);
  if (Object.keys(problemas).length > 0) {
    Object.assign(errores, problemas);
    return;
  }

  try {
    const datos = peticionProveedor(formulario);
    if (props.proveedor) {
      // El RUC no se cambia: solo viajan los demás campos
      const cambios = {
        razon_social: datos.razon_social,
        categoria: datos.categoria ?? null,
        email: datos.email ?? null,
        telefono: datos.telefono ?? null,
      };
      onDialogOK(await actualizar.mutateAsync({ id: props.proveedor.id, datos: cambios }));
    } else {
      onDialogOK(await crear.mutateAsync(datos));
    }
  } catch (error) {
    const apiError = aApiError(error);
    errores.ruc = apiError.campo('ruc');
    errores.razon_social = apiError.campo('razon_social');
    errores.categoria = apiError.campo('categoria');
    errores.email = apiError.campo('email');
    errores.telefono = apiError.campo('telefono');
    if (!Object.values(errores).some(Boolean)) errorGeneral.value = apiError.mensaje;
  }
}
</script>
