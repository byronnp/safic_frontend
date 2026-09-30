<template>
  <article class="reserva" :aria-label="`${reserva.area}, ${reserva.hora}`">
    <div class="reserva__cabecera">
      <div class="reserva__textos">
        <div class="reserva__area">{{ reserva.area }}</div>
        <div class="reserva__detalle">
          {{ reserva.hora }} · {{ reserva.unidad }} · {{ reserva.persona }}
        </div>
      </div>
      <EstadoBadge :tono="ESTADOS[reserva.estado].tono" :texto="ESTADOS[reserva.estado].texto" />
    </div>
    <div class="reserva__pago">{{ reserva.pago }}</div>

    <button
      v-if="reserva.estado === 'confirmada'"
      type="button"
      class="reserva__boton"
      @click="emit('ingreso')"
    >
      Registrar ingreso
    </button>
    <button
      v-else-if="reserva.estado === 'en_uso' && !abierta"
      type="button"
      class="reserva__boton reserva__boton--secundario"
      @click="emit('abrir')"
    >
      Recibir área
    </button>

    <div v-if="reserva.estado === 'en_uso' && abierta" class="reserva__entrega">
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
          aria-label="Describe el daño"
          class="reserva__descripcion"
        ></textarea>
        <button type="button" class="reserva__fotos" @click="elegirFotos">
          {{ fotos.length ? textoFotos : 'Tomar fotos (obligatorio)' }}
        </button>
        <input
          ref="campoFotos"
          type="file"
          accept="image/*"
          capture="environment"
          multiple
          class="reserva__archivo"
          tabindex="-1"
          aria-hidden="true"
          @change="alElegirFotos"
        />
        <div class="reserva__nota">La administración decidirá el cargo por daños a la unidad.</div>
      </template>

      <button type="button" class="reserva__boton" @click="confirmar">Confirmar entrega</button>
    </div>
  </article>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import { computed, ref } from 'vue';

import type { TonoEstado } from '@/components/EstadoBadge.vue';
import EstadoBadge from '@/components/EstadoBadge.vue';
import type { ReservaHoy, ReservaHoyEstado } from '@/modules/app-guardia/demo/reservas-hoy';
import { RESERVAS_HOY_DANO_EJEMPLO } from '@/modules/app-guardia/demo/reservas-hoy';

const ESTADOS: Record<ReservaHoyEstado, { texto: string; tono: TonoEstado }> = {
  confirmada: { texto: 'Confirmada', tono: 'info' },
  en_uso: { texto: 'En uso', tono: 'alerta' },
  finalizada: { texto: 'Finalizada', tono: 'exito' },
};

defineProps<{ reserva: ReservaHoy; abierta: boolean }>();

const emit = defineEmits<{
  ingreso: [];
  abrir: [];
  entregar: [danos: { descripcion: string; fotos: File[] } | null];
}>();

const $q = useQuasar();

const conDanos = ref(false);
const descripcion = ref(RESERVAS_HOY_DANO_EJEMPLO);
const fotos = ref<File[]>([]);
const campoFotos = ref<HTMLInputElement | null>(null);

const textoFotos = computed(() =>
  fotos.value.length === 1 ? '1 foto · tomar otra' : `${fotos.value.length} fotos · tomar otra`,
);

function elegirFotos(): void {
  campoFotos.value?.click();
}

function alElegirFotos(evento: Event): void {
  const campo = evento.target as HTMLInputElement;
  fotos.value = [...fotos.value, ...Array.from(campo.files ?? [])];
  campo.value = '';
}

function confirmar(): void {
  if (!conDanos.value) {
    emit('entregar', null);
    return;
  }
  if (!descripcion.value.trim()) {
    $q.notify({ type: 'negative', message: 'Describe el daño antes de confirmar.' });
    return;
  }
  if (!fotos.value.length) {
    $q.notify({ type: 'negative', message: 'Toma al menos una foto del daño.' });
    return;
  }
  emit('entregar', { descripcion: descripcion.value.trim(), fotos: fotos.value });
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

.reserva__fotos {
  height: 44px;
  border-radius: 10px;
  border: 1.5px dashed #9fbdb8;
  background: #f1f6f5;
  color: var(--q-primary);
  font-family: inherit;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}

.reserva__archivo {
  display: none;
}

.reserva__nota {
  font-size: 12px;
  color: var(--safic-texto-suave);
}
</style>
