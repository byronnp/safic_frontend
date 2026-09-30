<template>
  <!-- Formulario "Solicitar un rol nuevo a la plataforma" (mockup F1RolesCondominio) -->
  <form class="solicitud" @submit.prevent="enviar">
    <div class="solicitud__titulo">Solicitar un rol nuevo a la plataforma</div>
    <label class="solicitud__campo">
      Nombre sugerido
      <input v-model="nombre" class="solicitud__input" />
    </label>
    <label class="solicitud__campo">
      ¿Qué debe poder hacer?
      <input v-model="descripcion" class="solicitud__input solicitud__input--chico" />
    </label>
    <div v-if="error" class="solicitud__error" role="alert">{{ error }}</div>
    <div class="solicitud__acciones">
      <button type="button" class="solicitud__cancelar" @click="emit('cancelar')">Cancelar</button>
      <button type="submit" class="solicitud__enviar">Enviar solicitud</button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref } from 'vue';

import { SOLICITUD_EJEMPLO } from '../demo/roles';

const emit = defineEmits<{ cancelar: []; enviar: [] }>();

const nombre = ref<string>(SOLICITUD_EJEMPLO.nombre);
const descripcion = ref<string>(SOLICITUD_EJEMPLO.descripcion);
const error = ref('');

function enviar() {
  if (!nombre.value.trim() || !descripcion.value.trim()) {
    error.value = 'Escribe el nombre y lo que debe poder hacer el rol.';
    return;
  }
  error.value = '';
  emit('enviar');
}
</script>

<style scoped>
.solicitud {
  border: 1px solid var(--q-primary);
  border-radius: 12px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.solicitud__titulo {
  font-size: 14px;
  font-weight: 800;
}

.solicitud__campo {
  display: flex;
  flex-direction: column;
  gap: 5px;
  font-size: 12px;
  font-weight: 700;
  color: var(--safic-texto-2);
}

.solicitud__input {
  height: 36px;
  border: 1px solid var(--safic-borde-campo);
  border-radius: 9px;
  padding: 0 10px;
  font-size: 14px;
  font-family: inherit;
  color: var(--safic-texto);
}

.solicitud__input--chico {
  font-size: 13px;
}

.solicitud__input:focus {
  outline: none;
  border-color: var(--q-primary);
}

.solicitud__error {
  font-size: 12px;
  font-weight: 600;
  color: #9b1c12;
}

.solicitud__acciones {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.solicitud__cancelar,
.solicitud__enviar {
  height: 36px;
  border-radius: 9px;
  font-size: 13px;
  font-weight: 700;
  font-family: inherit;
  cursor: pointer;
}

.solicitud__cancelar {
  padding: 0 12px;
  border: 1px solid var(--safic-borde-2);
  background: #ffffff;
  color: var(--safic-texto);
}

.solicitud__enviar {
  padding: 0 14px;
  border: none;
  background: var(--q-primary);
  color: #ffffff;
}

.solicitud__cancelar:focus-visible,
.solicitud__enviar:focus-visible {
  outline: 2px solid var(--q-primary);
  outline-offset: 2px;
}
</style>
