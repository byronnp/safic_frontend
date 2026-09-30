<template>
  <!-- Panel "Cambiar <cargo>" del mockup F1Usuarios · Directiva -->
  <div class="cambio">
    <h2 class="cambio__titulo">Cambiar {{ cargo.cargo.toLowerCase() }}</h2>
    <div class="cambio__actual">
      Actual: <strong>{{ cargo.nombre }}</strong
      >. Su periodo se cerrará hoy.
    </div>
    <div id="cambio-nueva-persona" class="cambio__seccion">NUEVA PERSONA</div>
    <div class="cambio__candidatos" role="radiogroup" aria-labelledby="cambio-nueva-persona">
      <button
        v-for="k in candidatos"
        :key="k.nombre"
        type="button"
        role="radio"
        class="cambio__candidato"
        :class="{
          'cambio__candidato--elegido': k.nombre === elegido,
          'cambio__candidato--bloqueado': !k.libre,
        }"
        :aria-checked="k.nombre === elegido"
        :aria-disabled="!k.libre"
        @click="k.libre && (elegido = k.nombre)"
      >
        <div class="cambio__candidato-textos">
          <div class="cambio__candidato-nombre">{{ k.nombre }}</div>
          <div class="cambio__candidato-unidad">Residente {{ k.unidad }}</div>
        </div>
        <EstadoBadge :tono="k.libre ? 'exito' : 'error'" class="cambio__motivo">
          {{ k.motivo }}
        </EstadoBadge>
      </button>
    </div>
    <div class="cambio__campos">
      <label class="cambio__campo">
        Acta que lo respalda
        <input v-model="acta" />
      </label>
      <label class="cambio__campo">
        Periodo hasta
        <input v-model="hasta" />
      </label>
    </div>
    <div class="cambio__acciones">
      <button type="button" class="cambio__cancelar" @click="emit('cancelar')">Cancelar</button>
      <button
        type="button"
        class="cambio__confirmar"
        :class="{ 'cambio__confirmar--listo': !!candidatoElegido }"
        :aria-disabled="!candidatoElegido"
        @click="confirmar"
      >
        Confirmar cambio
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

import EstadoBadge from '@/components/EstadoBadge.vue';

import { CANDIDATOS_DIRECTIVA, NUEVO_PERIODO, type CargoDirectiva } from '../demo/usuarios';

export interface ConfirmacionCambio {
  nombre: string;
  unidad: string;
  acta: string;
  hasta: string;
}

const props = defineProps<{ cargo: CargoDirectiva; cargos: CargoDirectiva[] }>();
const emit = defineEmits<{ cancelar: []; confirmar: [datos: ConfirmacionCambio] }>();

const elegido = ref<string | null>(null);
const acta = ref<string>(NUEVO_PERIODO.acta);
const hasta = ref<string>(NUEVO_PERIODO.hasta);

/** Reglas del mockup: sin mora y sin otro cargo; quien ya ocupa este cargo no aparece. */
const candidatos = computed(() =>
  CANDIDATOS_DIRECTIVA.flatMap((r) => {
    const ocupa = props.cargos.find((c) => c.nombre === r.nombre)?.cargo ?? null;
    if (ocupa === props.cargo.cargo) return [];
    const motivo = r.enMora ? 'En mora' : ocupa ? `Ya es ${ocupa.toLowerCase()}` : 'Disponible';
    return [{ ...r, motivo, libre: !r.enMora && !ocupa }];
  }),
);

const candidatoElegido = computed(
  () => candidatos.value.find((k) => k.nombre === elegido.value && k.libre) ?? null,
);

function confirmar() {
  const k = candidatoElegido.value;
  if (!k) return;
  emit('confirmar', { nombre: k.nombre, unidad: k.unidad, acta: acta.value, hasta: hasta.value });
}
</script>

<style scoped>
.cambio {
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  font-size: 13px;
  overflow-y: auto;
}

.cambio__titulo {
  margin: 0;
  font-size: 17px;
  line-height: 1.4;
  font-weight: 800;
  letter-spacing: 0;
}

.cambio__actual {
  background: #f7f6f2;
  border-radius: 10px;
  padding: 10px 12px;
  color: var(--safic-texto-2);
}

.cambio__seccion {
  font-size: 12px;
  font-weight: 800;
  color: var(--safic-texto-suave);
  letter-spacing: 0.4px;
}

.cambio__candidatos {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.cambio__candidato {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 12px;
  border-radius: 10px;
  font-family: inherit;
  color: var(--safic-texto);
  cursor: pointer;
  border: 1px solid var(--safic-borde);
  background: #ffffff;
}

.cambio__candidato--elegido {
  border: 2px solid var(--q-primary);
  padding: 9px 11px;
  background: color-mix(in srgb, var(--q-primary) 6%, #ffffff);
}

.cambio__candidato--bloqueado {
  cursor: not-allowed;
  opacity: 0.6;
}

.cambio__candidato:focus-visible,
.cambio__cancelar:focus-visible,
.cambio__confirmar:focus-visible {
  outline: 2px solid var(--q-primary);
  outline-offset: 2px;
}

.cambio__candidato-textos {
  flex-grow: 1;
  text-align: left;
}

.cambio__candidato-nombre {
  font-weight: 800;
  font-size: 14px;
}

.cambio__candidato-unidad {
  font-size: 12px;
  color: var(--safic-texto-suave);
}

.cambio__motivo {
  flex-shrink: 0;
}

.cambio__campos {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 10px;
}

.cambio__campo {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-weight: 700;
  color: var(--safic-texto-2);
}

.cambio__campo input {
  height: 40px;
  border: 1px solid var(--safic-borde-campo);
  border-radius: 9px;
  padding: 0 10px;
  font-size: 14px;
  font-family: inherit;
  color: var(--safic-texto);
  min-width: 0;
  width: 100%;
}

.cambio__campo input:focus {
  outline: none;
  border-color: var(--q-primary);
}

.cambio__acciones {
  display: flex;
  gap: 10px;
  margin-top: 4px;
}

.cambio__cancelar {
  flex-grow: 1;
  height: 44px;
  border-radius: 10px;
  border: 1px solid var(--safic-borde-2);
  background: #ffffff;
  font-size: 14px;
  font-weight: 700;
  font-family: inherit;
  color: var(--safic-texto);
  cursor: pointer;
}

.cambio__confirmar {
  flex-grow: 2;
  height: 44px;
  border-radius: 10px;
  border: none;
  font-size: 14px;
  font-weight: 700;
  font-family: inherit;
  cursor: not-allowed;
  background: var(--safic-borde);
  color: var(--safic-texto-tenue);
}

.cambio__confirmar--listo {
  cursor: pointer;
  background: var(--q-primary);
  color: #ffffff;
}
</style>
