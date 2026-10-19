<template>
  <article class="reserva" :aria-label="`${reserva.area}, ${textoHora(reserva)}`">
    <div class="reserva__cabecera">
      <div class="reserva__textos">
        <div class="reserva__area">{{ reserva.area }}</div>
        <div class="reserva__detalle">
          {{ textoHora(reserva) }} · {{ reserva.unidad }} · {{ reserva.persona ?? 'Sin nombre' }}
        </div>
      </div>
      <EstadoBadge :tono="ESTADOS[reserva.estado].tono" :texto="ESTADOS[reserva.estado].texto" />
    </div>
    <div class="reserva__pago">{{ textoPago(reserva) }}</div>

    <div v-if="accion === 'bloqueada'" class="reserva__nota" role="alert">
      <strong>Unidad restringida por mora.</strong> No se da el ingreso a esta área (Decreto 462).
    </div>
    <button
      v-else-if="accion === 'ingreso'"
      type="button"
      class="reserva__boton"
      :disabled="ocupado"
      @click="emit('ingreso')"
    >
      Registrar ingreso
    </button>
    <button
      v-else-if="accion === 'recibir' && !abierta"
      type="button"
      class="reserva__boton reserva__boton--secundario"
      @click="emit('abrir')"
    >
      Recibir área
    </button>

    <div v-if="accion === 'recibir' && abierta" class="reserva__entrega">
      <div class="reserva__opciones" role="radiogroup" aria-label="Estado del área">
        <button
          type="button"
          role="radio"
          class="reserva__opcion"
          :class="{ 'reserva__opcion--ok': !conDanos }"
          :aria-checked="!conDanos"
          @click="conDanos = false"
        >
          Sin novedades
        </button>
        <button
          type="button"
          role="radio"
          class="reserva__opcion"
          :class="{ 'reserva__opcion--dano': conDanos }"
          :aria-checked="conDanos"
          @click="conDanos = true"
        >
          Con daños
        </button>
      </div>

      <template v-if="conDanos">
        <textarea
          v-model="descripcion"
          rows="2"
          maxlength="500"
          aria-label="Describe el daño"
          class="reserva__descripcion"
        ></textarea>
        <q-file
          v-model="fotos"
          class="reserva__fotos"
          outlined
          dense
          multiple
          append
          clearable
          hide-bottom-space
          accept="image/jpeg,image/png"
          :max-files="MAX_FOTOS_DANOS"
          max-file-size="5242880"
          :label="`Fotos del daño (hasta ${MAX_FOTOS_DANOS})`"
          aria-label="Fotos del daño"
          :error="!!errorFotos"
          :error-message="errorFotos ?? undefined"
          @rejected="errorFotos = `Máximo ${MAX_FOTOS_DANOS} fotos JPG o PNG de hasta 5 MB.`"
        >
          <template #prepend><q-icon name="sym_r_photo_camera" /></template>
        </q-file>
        <div class="reserva__nota">La administración decidirá el cargo por daños a la unidad.</div>
      </template>

      <button type="button" class="reserva__boton" :disabled="ocupado" @click="confirmar">
        Confirmar entrega
      </button>
    </div>
  </article>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import { computed, ref } from 'vue';

import type { TonoEstado } from '@/components/EstadoBadge.vue';
import EstadoBadge from '@/components/EstadoBadge.vue';

import {
  accionDeReserva,
  errorFotosDanos,
  MAX_FOTOS_DANOS,
  textoHora,
  textoPago,
} from '../reservas-hoy.logica';
import type { EstadoReservaHoy, ReservaHoy } from '../services/reservas-hoy.service';

const ESTADOS: Record<EstadoReservaHoy, { texto: string; tono: TonoEstado }> = {
  confirmada: { texto: 'Confirmada', tono: 'info' },
  en_uso: { texto: 'En uso', tono: 'alerta' },
  finalizada: { texto: 'Finalizada', tono: 'exito' },
};

const props = defineProps<{ reserva: ReservaHoy; abierta: boolean; ocupado?: boolean }>();

const emit = defineEmits<{
  ingreso: [];
  abrir: [];
  /** `null` = sin novedades; texto = descripción del daño, con sus fotos (opcionales) */
  entregar: [danos: string | null, fotos: File[]];
}>();

const $q = useQuasar();

const accion = computed(() => accionDeReserva(props.reserva));
const conDanos = ref(false);
const descripcion = ref('');
const fotos = ref<File[]>([]);
const errorFotos = ref<string | null>(null);

function confirmar(): void {
  if (!conDanos.value) {
    emit('entregar', null, []);
    return;
  }
  if (descripcion.value.trim().length < 3) {
    $q.notify({ type: 'negative', message: 'Describe el daño antes de confirmar.' });
    return;
  }
  errorFotos.value = errorFotosDanos(fotos.value);
  if (errorFotos.value !== null) return;
  emit('entregar', descripcion.value.trim(), fotos.value);
}
</script>

<style scoped>
.reserva {
  background: #ffffff;
  border: 1px solid var(--safic-borde);
  border-radius: 14px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.reserva__cabecera {
  display: flex;
  align-items: center;
  gap: 10px;
}

.reserva__textos {
  flex-grow: 1;
  min-width: 0;
}

.reserva__area {
  font-size: 15px;
  font-weight: 800;
}

.reserva__detalle {
  font-size: 13px;
  color: var(--safic-texto-2);
}

.reserva__pago {
  font-size: 12px;
  color: var(--safic-texto-suave);
}

.reserva__boton {
  height: 44px;
  border-radius: 10px;
  border: none;
  background: var(--q-primary);
  color: #ffffff;
  font-family: inherit;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
}

.reserva__boton--secundario {
  border: 1px solid var(--q-primary);
  background: #ffffff;
  color: var(--q-primary);
}

.reserva__entrega {
  border-top: 1px solid var(--safic-linea-2);
  padding-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.reserva__opciones {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.reserva__opcion {
  height: 44px;
  border-radius: 10px;
  font-family: inherit;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  background: #ffffff;
  color: var(--safic-texto);
  border: 1px solid var(--safic-borde-2);
}

.reserva__opcion--ok {
  background: #e3efec;
  color: #0b4a47;
  border: 2px solid #0e5e5b;
}

.reserva__opcion--dano {
  background: #fde8e6;
  color: #9b1c12;
  border: 2px solid #9b1c12;
}

.reserva__descripcion {
  border: 1px solid var(--safic-borde-campo);
  border-radius: 9px;
  padding: 8px 10px;
  font-family: inherit;
  font-size: 13px;
  color: var(--safic-texto);
  resize: none;
}

.reserva__descripcion:focus {
  outline: 2px solid var(--q-primary);
  outline-offset: -1px;
}

.reserva__nota {
  font-size: 12px;
  color: var(--safic-texto-suave);
}
</style>
