<template>
  <!-- Acción sensible de la verificación en dos pasos: contraseña + código vigente -->
  <q-dialog
    :model-value="modelValue"
    persistent
    @update:model-value="emit('update:modelValue', $event)"
  >
    <q-card class="confirmacion">
      <q-form novalidate @submit="enviar">
        <q-card-section>
          <div class="text-h6">{{ titulo }}</div>
          <p class="confirmacion__texto">{{ mensaje }}</p>
        </q-card-section>
        <q-card-section class="column" style="gap: 14px">
          <div v-if="error" class="safic-alerta" role="alert">{{ error }}</div>
          <q-input
            v-model="password"
            outlined
            dense
            type="password"
            label="Contraseña"
            autocomplete="current-password"
            :error="!!errores.password"
            :error-message="errores.password"
          />
          <q-input
            v-model="codigo"
            outlined
            dense
            label="Código de tu app"
            autocomplete="one-time-code"
            maxlength="14"
            :error="!!errores.codigo"
            :error-message="errores.codigo"
          />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat no-caps label="Cancelar" :disable="enviando" @click="cerrar" />
          <q-btn
            type="submit"
            unelevated
            no-caps
            :color="peligro ? 'negative' : 'primary'"
            :label="etiqueta"
            :loading="enviando"
          />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue';

import { errorCodigo, errorContrasena } from '../doble-factor.logica';

const props = defineProps<{
  modelValue: boolean;
  titulo: string;
  mensaje: string;
  etiqueta: string;
  peligro?: boolean;
  enviando: boolean;
  /** Error general de la API (los de campo llegan por `errorCampos`). */
  error: string | null;
  errorCampos?: { password?: string | undefined; codigo?: string | undefined };
}>();
const emit = defineEmits<{
  'update:modelValue': [valor: boolean];
  confirmar: [datos: { password: string; codigo: string }];
}>();

const password = ref('');
const codigo = ref('');
const errores = reactive<{ password: string | undefined; codigo: string | undefined }>({
  password: undefined,
  codigo: undefined,
});

// Cada vez que se abre empieza limpio: no queda la contraseña de la vez anterior
watch(
  () => props.modelValue,
  (abierto) => {
    if (abierto) {
      password.value = '';
      codigo.value = '';
      errores.password = undefined;
      errores.codigo = undefined;
    }
  },
);
// Los errores de la API bajo cada campo
watch(
  () => props.errorCampos,
  (campos) => {
    errores.password = campos?.password;
    errores.codigo = campos?.codigo;
  },
);

function cerrar(): void {
  emit('update:modelValue', false);
}

function enviar(): void {
  if (props.enviando) return;
  errores.password = errorContrasena(password.value) ?? undefined;
  errores.codigo = errorCodigo(codigo.value) ?? undefined;
  if (errores.password || errores.codigo) return;
  emit('confirmar', { password: password.value, codigo: codigo.value.trim() });
}
</script>

<style scoped>
.confirmacion {
  width: 420px;
  max-width: 92vw;
}

.confirmacion__texto {
  margin: 8px 0 0;
  font-size: 14px;
  color: var(--safic-texto-2);
  line-height: 1.45;
}
</style>
