<template>
  <!-- Segundo paso del login: código de la app autenticadora o de respaldo -->
  <q-form novalidate class="column" style="gap: 20px" @submit="enviar">
    <div>
      <h2 class="codigo__titulo">Verificación en dos pasos</h2>
      <p class="codigo__subtitulo">
        Abre tu app autenticadora y escribe el código de 6 dígitos. Si perdiste tu teléfono, usa uno
        de tus códigos de respaldo.
      </p>
    </div>

    <div v-if="error" class="safic-alerta" role="alert">{{ error }}</div>

    <div class="safic-campo">
      <label for="codigo-2fa" class="safic-campo__etiqueta">Código</label>
      <q-input
        v-model="codigo"
        for="codigo-2fa"
        class="safic-input"
        outlined
        autocomplete="one-time-code"
        inputmode="text"
        maxlength="14"
        hide-bottom-space
        autofocus
        :error="!!errorCampo"
        :error-message="errorCampo ?? undefined"
      />
    </div>

    <q-btn
      type="submit"
      color="primary"
      unelevated
      no-caps
      class="safic-btn safic-btn--grande full-width"
      label="Verificar"
      :loading="enviando"
    />
    <q-btn
      flat
      no-caps
      class="full-width"
      label="Volver"
      :disable="enviando"
      @click="emit('volver')"
    />
  </q-form>
</template>

<script setup lang="ts">
import { ref } from 'vue';

import { errorCodigo } from '../doble-factor.logica';

const props = defineProps<{ enviando: boolean; error: string | null }>();
const emit = defineEmits<{ verificar: [codigo: string]; volver: [] }>();

const codigo = ref('');
const errorCampo = ref<string | null>(null);

function enviar(): void {
  if (props.enviando) return;
  errorCampo.value = errorCodigo(codigo.value);
  if (errorCampo.value === null) {
    emit('verificar', codigo.value.trim());
  }
}
</script>

<style scoped>
.codigo__titulo {
  margin: 0;
  font-size: 28px;
  line-height: 1.2;
  font-weight: 800;
  letter-spacing: -0.5px;
}

.codigo__subtitulo {
  margin: 8px 0 0 0;
  font-size: 15px;
  color: var(--safic-texto-suave);
}
</style>
