<template>
  <q-dialog ref="dialogRef" persistent @hide="onDialogHide">
    <q-card class="safic-dialogo">
      <q-form novalidate @submit="guardar">
        <div class="q-pa-lg column" style="gap: 20px">
          <div>
            <div class="safic-dialogo__titulo">
              {{ proveedor.cuenta ? 'Cambiar la cuenta de pagos' : 'Cuenta de pagos' }}
            </div>
            <div class="text-suave q-mt-xs" style="font-size: 14px">
              <template v-if="proveedor.cuenta">
                Cambiar la cuenta pide tu contraseña, avisa a administración y tesorería y espera 24
                horas. Mientras tanto se paga a la cuenta anterior.
              </template>
              <template v-else>
                {{ proveedor.razon_social }} aún no tiene cuenta. La primera queda activa al
                guardarla.
              </template>
            </div>
          </div>

          <div v-if="errorGeneral" class="safic-alerta" role="alert">{{ errorGeneral }}</div>

          <div class="safic-campo">
            <label for="cta-banco" class="safic-campo__etiqueta">Banco</label>
            <q-input
              v-model="formulario.banco"
              for="cta-banco"
              class="safic-input"
              outlined
              maxlength="60"
              autofocus
              hide-bottom-space
              :error="!!errores.banco"
              :error-message="errores.banco"
            />
          </div>

          <div class="row" style="gap: 12px">
            <div class="safic-campo col" style="min-width: 140px">
              <label for="cta-tipo" class="safic-campo__etiqueta">Tipo</label>
              <q-select
                v-model="formulario.tipo"
                for="cta-tipo"
                class="safic-input"
                outlined
                emit-value
                map-options
                :options="TIPOS_CUENTA.map((t) => ({ value: t.valor, label: t.etiqueta }))"
              />
            </div>
            <div class="safic-campo col" style="min-width: 200px">
              <label for="cta-numero" class="safic-campo__etiqueta">Número de cuenta</label>
              <q-input
                v-model="formulario.numero"
                for="cta-numero"
                class="safic-input"
                outlined
                inputmode="numeric"
                maxlength="30"
                autocomplete="off"
                hide-bottom-space
                :error="!!errores.numero"
                :error-message="errores.numero"
              />
            </div>
          </div>

          <div class="safic-campo">
            <label for="cta-titular" class="safic-campo__etiqueta">Titular</label>
            <q-input
              v-model="formulario.titular"
              for="cta-titular"
              class="safic-input"
              outlined
              maxlength="120"
              hide-bottom-space
              :error="!!errores.titular"
              :error-message="errores.titular"
            />
          </div>

          <div class="safic-campo">
            <label for="cta-password" class="safic-campo__etiqueta">Tu contraseña</label>
            <q-input
              v-model="formulario.password"
              for="cta-password"
              class="safic-input"
              outlined
              type="password"
              autocomplete="current-password"
              hide-bottom-space
              :error="!!errores.password"
              :error-message="errores.password"
            />
          </div>

          <div class="row justify-end" style="gap: 10px">
            <q-btn
              unelevated
              no-caps
              class="safic-btn safic-btn--secundario"
              label="Cancelar"
              :disable="cambiar.isPending.value"
              @click="onDialogCancel"
            />
            <q-btn
              type="submit"
              color="primary"
              unelevated
              no-caps
              class="safic-btn"
              :label="proveedor.cuenta ? 'Solicitar el cambio' : 'Guardar cuenta'"
              :loading="cambiar.isPending.value"
            />
          </div>
        </div>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { useDialogPluginComponent } from 'quasar';
import { reactive, ref } from 'vue';

import { aApiError } from '@/core/api/errors';

import { useCambiarCuentaProveedor } from '../composables/useProveedores';
import {
  cuentaVacia,
  peticionCuenta,
  TIPOS_CUENTA,
  validarCuenta,
  type ErroresCuenta,
} from '../proveedores.logica';
import type { Proveedor } from '../services/proveedores.service';

const props = defineProps<{ proveedor: Proveedor }>();
defineEmits([...useDialogPluginComponent.emits]);

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent<Proveedor>();

const formulario = reactive(cuentaVacia(props.proveedor.razon_social));
const errores = reactive<ErroresCuenta>({});
const errorGeneral = ref<string | null>(null);

const cambiar = useCambiarCuentaProveedor();

async function guardar(): Promise<void> {
  // Enter dentro de un campo también envía el formulario: no se pide dos veces
  if (cambiar.isPending.value) return;
  errorGeneral.value = null;
  for (const k of ['banco', 'numero', 'titular', 'password'] as const) errores[k] = undefined;

  const problemas = validarCuenta(formulario);
  if (Object.keys(problemas).length > 0) {
    Object.assign(errores, problemas);
    return;
  }

  try {
    onDialogOK(
      await cambiar.mutateAsync({ id: props.proveedor.id, datos: peticionCuenta(formulario) }),
    );
  } catch (error) {
    const apiError = aApiError(error);
    errores.banco = apiError.campo('banco');
    errores.numero = apiError.campo('numero');
    errores.titular = apiError.campo('titular');
    errores.password = apiError.campo('password');
    if (!Object.values(errores).some(Boolean)) {
      const incierto = apiError.estado === 0 || apiError.estado >= 500;
      errorGeneral.value = incierto
        ? `${apiError.mensaje} Revisa el proveedor antes de reintentar: el cambio pudo registrarse.`
        : apiError.mensaje;
    }
  } finally {
    // La contraseña no se queda en memoria más de lo necesario
    formulario.password = '';
    cambiar.reset();
  }
}
</script>
