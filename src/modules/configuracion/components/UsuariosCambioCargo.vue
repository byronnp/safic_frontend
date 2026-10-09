<template>
  <!-- Panel "Cambiar <cargo>" del mockup F1Usuarios · Directiva -->
  <div class="cambio">
    <h2 class="cambio__titulo">
      {{ cargo.titular ? 'Cambiar' : 'Asignar' }} {{ cargo.etiqueta.toLowerCase() }}
    </h2>
    <div v-if="cargo.titular" class="cambio__actual">
      Actual: <strong>{{ cargo.titular.nombre }}</strong
      >. Su periodo se cerrará hoy.
    </div>

    <div v-if="error" class="safic-alerta" role="alert">
      {{ error.mensaje }}
      <router-link
        v-if="error.codigo === 'LIMITE_USUARIOS'"
        :to="{ name: 'configuracion-suscripcion' }"
      >
        Subir de plan
      </router-link>
    </div>

    <div id="cambio-nueva-persona" class="cambio__seccion">NUEVA PERSONA</div>
    <div v-if="candidatos.isPending.value" class="cambio__candidatos" aria-busy="true">
      <q-skeleton v-for="i in 3" :key="i" type="rect" height="52px" />
    </div>
    <div v-else-if="candidatos.isError.value" class="safic-alerta" role="alert">
      {{ candidatos.error.value?.mensaje }}
      <q-btn flat no-caps dense label="Reintentar" @click="candidatos.refetch()" />
    </div>
    <div v-else class="cambio__candidatos" role="radiogroup" aria-labelledby="cambio-nueva-persona">
      <div v-if="!candidatos.data.value?.length" class="cambio__vacio">
        No hay propietarios para elegir. Registra a los propietarios en Unidades.
      </div>
      <button
        v-for="k in candidatos.data.value"
        :key="k.persona_id"
        type="button"
        role="radio"
        class="cambio__candidato"
        :class="{
          'cambio__candidato--elegido': k.persona_id === formulario.personaId,
          'cambio__candidato--bloqueado': !k.disponible,
        }"
        :aria-checked="k.persona_id === formulario.personaId"
        :aria-disabled="!k.disponible"
        @click="k.disponible && (formulario.personaId = k.persona_id)"
      >
        <div class="cambio__candidato-textos">
          <div class="cambio__candidato-nombre">{{ k.nombre }}</div>
          <div class="cambio__candidato-unidad">Propietario {{ k.unidad }}</div>
        </div>
        <EstadoBadge :tono="motivoCandidato(k).tono" class="cambio__motivo">
          {{ motivoCandidato(k).texto }}
        </EstadoBadge>
      </button>
      <div v-if="errores.personaId" class="cambio__error">{{ errores.personaId }}</div>
    </div>

    <div class="cambio__campos">
      <label class="cambio__campo">
        Acta que lo respalda
        <input v-model="formulario.acta" maxlength="80" placeholder="Acta 2026-03" />
        <span v-if="errores.acta" class="cambio__error">{{ errores.acta }}</span>
      </label>
      <label class="cambio__campo">
        Periodo hasta
        <input v-model="formulario.hasta" type="date" :min="hoy" />
        <span v-if="errores.hasta" class="cambio__error">{{ errores.hasta }}</span>
      </label>
    </div>
    <div class="cambio__acciones">
      <button type="button" class="cambio__cancelar" @click="emit('cancelar')">Cancelar</button>
      <button
        type="button"
        class="cambio__confirmar"
        :class="{ 'cambio__confirmar--listo': formulario.personaId !== null }"
        :disabled="asignar.isPending.value"
        @click="confirmar"
      >
        {{ cargo.titular ? 'Confirmar cambio' : 'Confirmar nombramiento' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';

import EstadoBadge from '@/components/EstadoBadge.vue';
import { aApiError, type ApiError } from '@/core/api/errors';

import { useAsignarCargo, useCandidatosDirectiva } from '../composables/useDirectiva';
import {
  CAMPOS_API_CARGO,
  motivoCandidato,
  periodoPorOmision,
  peticionCargo,
  validarCargo,
  type FormularioCargo,
} from '../directiva.logica';
import type { CargoDirectiva } from '../services/directiva.service';
import { hoyEcuador } from '../usuarios.logica';

const props = defineProps<{ cargo: CargoDirectiva }>();
const emit = defineEmits<{
  cancelar: [];
  confirmado: [cargo: CargoDirectiva, anterior: string | null];
}>();

const hoy = hoyEcuador();
const candidatos = useCandidatosDirectiva(computed(() => props.cargo.cargo));
const asignar = useAsignarCargo();

const formulario = reactive<FormularioCargo>({
  personaId: null,
  acta: '',
  hasta: periodoPorOmision(hoy),
});
const errores = reactive<Partial<Record<keyof FormularioCargo, string>>>({});
const error = ref<ApiError | null>(null);

// Si al refrescar la lista la persona elegida ya no está disponible (ej. otro administrador
// le dio un cargo), se desmarca para no reenviar un nombramiento que va a fallar
watch(
  () => candidatos.data.value,
  (lista) => {
    if (
      formulario.personaId !== null &&
      !lista?.some((k) => k.persona_id === formulario.personaId && k.disponible)
    ) {
      formulario.personaId = null;
    }
  },
);

async function confirmar(): Promise<void> {
  for (const campo of Object.keys(errores) as (keyof FormularioCargo)[]) {
    delete errores[campo];
  }
  error.value = null;

  Object.assign(errores, validarCargo(formulario, hoy));
  if (Object.keys(errores).length > 0) {
    return;
  }

  const anterior = props.cargo.titular?.nombre ?? null;
  try {
    const nuevo = await asignar.mutateAsync({
      cargo: props.cargo.cargo,
      datos: peticionCargo(formulario),
    });
    emit('confirmado', nuevo, anterior);
  } catch (e) {
    const apiError = aApiError(e);
    let pintado = false;
    for (const [campoApi, campo] of Object.entries(CAMPOS_API_CARGO)) {
      const mensaje = apiError.campo(campoApi);
      if (mensaje) {
        errores[campo] = mensaje;
        pintado = true;
      }
    }
    if (!pintado) {
      // NO_ES_PROPIETARIO, PERSONA_SIN_CORREO, PERSONA_CON_CARGO, LIMITE_USUARIOS…
      error.value = apiError;
    }
  }
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

.cambio__vacio {
  font-size: 13px;
  color: var(--safic-texto-suave);
  padding: 8px 0;
}

.cambio__error {
  font-size: 12px;
  font-weight: 600;
  color: var(--q-negative);
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
