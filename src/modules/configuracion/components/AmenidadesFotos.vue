<template>
  <!-- Fotos de la amenidad: la primera es la portada (mockup F1AmenidadesCondominio) -->
  <div class="fotos">
    <div v-if="portada" class="fotos__portada">
      <img :src="portada.url" alt="" aria-hidden="true" />
    </div>
    <div v-else class="fotos__portada fotos__portada--vacia">Sin fotos</div>

    <div class="fotos__tira">
      <div v-for="(f, i) in amenidad.fotos" :key="f.id" class="fotos__miniatura">
        <img :src="f.url" :alt="`Foto ${i + 1} de ${amenidad.nombre}`" />
        <div class="fotos__acciones">
          <button
            type="button"
            :disabled="ocupado || i === 0"
            :aria-label="`Mover la foto ${i + 1} antes`"
            @click="mover(f.id, -1)"
          >
            <q-icon name="sym_r_chevron_left" size="16px" />
          </button>
          <button
            type="button"
            :disabled="ocupado || i === amenidad.fotos.length - 1"
            :aria-label="`Mover la foto ${i + 1} después`"
            @click="mover(f.id, 1)"
          >
            <q-icon name="sym_r_chevron_right" size="16px" />
          </button>
          <button
            type="button"
            :disabled="ocupado"
            :aria-label="`Quitar la foto ${i + 1}`"
            @click="confirmarQuitar(f.id, i + 1)"
          >
            <q-icon name="sym_r_delete" size="16px" />
          </button>
        </div>
        <span v-if="i === 0" class="fotos__etiqueta">Portada</span>
      </div>

      <label
        v-if="amenidad.fotos.length < FOTOS_MAXIMO"
        class="fotos__agregar"
        :class="{ 'fotos__agregar--apagado': ocupado }"
      >
        <q-icon name="sym_r_add_a_photo" size="20px" />
        <span>{{ subiendo ? 'Subiendo…' : 'Foto' }}</span>
        <input
          type="file"
          accept="image/jpeg,image/png"
          class="fotos__archivo"
          :disabled="ocupado"
          :aria-label="`Agregar una foto a ${amenidad.nombre}`"
          @change="elegida"
        />
      </label>
    </div>

    <div v-if="error" class="safic-alerta" role="alert">{{ error }}</div>
    <div class="fotos__ayuda">
      Hasta {{ FOTOS_MAXIMO }} fotos, JPG o PNG de {{ FOTO_MAXIMO_MB }} MB. La primera es la
      portada.
    </div>
  </div>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import { computed, ref, watch } from 'vue';

import { aApiError } from '@/core/api/errors';

import { errorFoto, FOTO_MAXIMO_MB, FOTOS_MAXIMO, moverFoto } from '../amenidades.logica';
import {
  useOrdenarFotosAmenidad,
  useQuitarFotoAmenidad,
  useSubirFotoAmenidad,
} from '../composables/useAmenidades';
import type { AmenidadCondominio } from '../services/amenidades.service';

const props = defineProps<{ amenidad: AmenidadCondominio }>();

const $q = useQuasar();
const subir = useSubirFotoAmenidad();
const quitar = useQuitarFotoAmenidad();
const ordenar = useOrdenarFotosAmenidad();

const error = ref<string | null>(null);
const subiendo = computed(() => subir.isPending.value);
const ocupado = computed(
  () => subir.isPending.value || quitar.isPending.value || ordenar.isPending.value,
);
const portada = computed(() => props.amenidad.fotos[0]);

// Al elegir otra amenidad no queda el error de la anterior
watch(
  () => props.amenidad.id,
  () => {
    error.value = null;
  },
);

function mostrarError(e: unknown): void {
  error.value = aApiError(e).mensaje;
}

function elegida(evento: Event): void {
  const campo = evento.target as HTMLInputElement;
  const archivo = campo.files?.[0];
  // Permite volver a elegir el mismo archivo después de un error
  campo.value = '';
  if (!archivo || ocupado.value) return;

  const invalido = errorFoto(archivo, props.amenidad.fotos.length);
  if (invalido) {
    error.value = invalido;
    return;
  }
  error.value = null;
  subir.mutate(
    { id: props.amenidad.id, foto: archivo },
    {
      onSuccess: () => $q.notify({ type: 'positive', message: 'Foto agregada.' }),
      onError: mostrarError,
    },
  );
}

function mover(fotoId: number, direccion: -1 | 1): void {
  const ids = props.amenidad.fotos.map((f) => f.id);
  const nuevo = moverFoto(ids, fotoId, direccion);
  error.value = null;
  ordenar.mutate({ id: props.amenidad.id, ids: nuevo }, { onError: mostrarError });
}

function confirmarQuitar(fotoId: number, numero: number): void {
  // Se toma la amenidad al abrir el diálogo, no al confirmar: si la lista cambia no se quita otra
  const id = props.amenidad.id;
  $q.dialog({
    title: 'Quitar foto',
    message: `Se elimina la foto ${numero} de ${props.amenidad.nombre}. No se puede deshacer.`,
    cancel: { label: 'Cancelar', flat: true, noCaps: true },
    ok: { label: 'Quitar', color: 'negative', unelevated: true, noCaps: true },
    persistent: true,
  }).onOk(() => {
    error.value = null;
    quitar.mutate({ id, fotoId }, { onError: mostrarError });
  });
}
</script>

<style scoped>
.fotos {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex-shrink: 0;
}

.fotos__portada {
  height: 120px;
  border-radius: 12px;
  background: #dce7e4;
  overflow: hidden;
}

.fotos__portada img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.fotos__portada--vacia {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #0b4a47;
  font-size: 13px;
  font-weight: 700;
}

.fotos__tira {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.fotos__miniatura {
  position: relative;
  width: 72px;
  height: 72px;
  border-radius: 10px;
  overflow: hidden;
  background: #dce7e4;
}

.fotos__miniatura img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.fotos__acciones {
  position: absolute;
  inset: auto 0 0 0;
  display: flex;
  justify-content: space-between;
  background: rgb(28 27 24 / 70%);
}

.fotos__acciones button {
  flex: 1;
  height: 24px;
  border: none;
  background: none;
  color: #ffffff;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.fotos__acciones button:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.fotos__etiqueta {
  position: absolute;
  top: 4px;
  left: 4px;
  padding: 1px 6px;
  border-radius: 999px;
  background: #fff1dc;
  color: #8a3f0a;
  font-size: 10px;
  font-weight: 800;
}

.fotos__agregar {
  position: relative;
  width: 72px;
  height: 72px;
  border-radius: 10px;
  border: 1.5px dashed var(--safic-borde-campo);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  font-size: 11px;
  font-weight: 700;
  color: var(--safic-texto-2);
  cursor: pointer;
}

.fotos__agregar--apagado {
  opacity: 0.5;
  cursor: not-allowed;
}

/* El campo cubre todo el recuadro: se activa con clic y con teclado */
.fotos__agregar:focus-within {
  outline: 2px solid var(--q-primary);
  outline-offset: 2px;
}

.fotos__archivo {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: inherit;
  width: 100%;
  height: 100%;
}

.fotos__ayuda {
  font-size: 11px;
  color: var(--safic-texto-suave);
}
</style>
