<template>
  <!-- Formulario "Solicitar un rol nuevo a la plataforma" (mockup F1RolesCondominio) -->
  <form class="solicitud" novalidate @submit.prevent="enviar">
    <div class="solicitud__titulo">Solicitar un rol nuevo a la plataforma</div>
    <div v-if="errorGeneral" class="solicitud__error" role="alert">{{ errorGeneral }}</div>
    <label class="solicitud__campo">
      Nombre sugerido
      <input
        v-model="formulario.nombre"
        class="solicitud__input"
        maxlength="60"
        placeholder="Jardinero"
        :aria-invalid="!!errores.nombre"
      />
      <span v-if="errores.nombre" class="solicitud__error">{{ errores.nombre }}</span>
    </label>
    <label class="solicitud__campo">
      ¿Qué debe poder hacer?
      <input
        v-model="formulario.descripcion"
        class="solicitud__input solicitud__input--chico"
        maxlength="500"
        placeholder="Ver la agenda de áreas y reportar incidencias de áreas verdes"
        :aria-invalid="!!errores.descripcion"
      />
      <span v-if="errores.descripcion" class="solicitud__error">{{ errores.descripcion }}</span>
    </label>
    <div class="solicitud__acciones">
      <button
        type="button"
        class="solicitud__cancelar"
        :disabled="solicitar.isPending.value"
        @click="emit('cancelar')"
      >
        Cancelar
      </button>
      <button type="submit" class="solicitud__enviar" :disabled="solicitar.isPending.value">
        {{ solicitar.isPending.value ? 'Enviando…' : 'Enviar solicitud' }}
      </button>
    </div>
  </form>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';

import { aApiError } from '@/core/api/errors';

import { useSolicitarRol } from '../composables/useRoles';
import { validarSolicitud } from '../roles.logica';
import type { SolicitarRol } from '../services/roles.service';

const emit = defineEmits<{ cancelar: []; enviada: [] }>();

const solicitar = useSolicitarRol();
const formulario = reactive<SolicitarRol>({ nombre: '', descripcion: '' });
const errores = reactive<{ nombre?: string | undefined; descripcion?: string | undefined }>({});
const errorGeneral = ref<string | null>(null);

async function enviar(): Promise<void> {
  errores.nombre = undefined;
  errores.descripcion = undefined;
  errorGeneral.value = null;

  Object.assign(errores, validarSolicitud(formulario));
  if (errores.nombre || errores.descripcion) {
    return;
  }

  try {
    await solicitar.mutateAsync({
      nombre: formulario.nombre.trim(),
      descripcion: formulario.descripcion.trim(),
    });
    emit('enviada');
  } catch (e) {
    const apiError = aApiError(e);
    errores.nombre = apiError.campo('nombre');
    errores.descripcion = apiError.campo('descripcion');
    if (!errores.nombre && !errores.descripcion) {
      errorGeneral.value =
        apiError.estado === 429
          ? 'Enviaste demasiadas solicitudes. Intenta de nuevo en un rato.'
          : apiError.mensaje;
    }
  }
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
