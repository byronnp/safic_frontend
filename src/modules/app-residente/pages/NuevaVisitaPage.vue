<template>
  <div class="app-pagina nueva-visita">
    <!-- El mockup usa una barra blanca con "volver" en lugar del encabezado de color. -->
    <header class="nueva-visita-barra">
      <router-link
        :to="{ name: 'app-mis-visitas' }"
        class="nueva-visita-barra__volver"
        aria-label="Volver"
      >
        <q-icon name="sym_r_chevron_left" size="26px" />
      </router-link>
      <h1 class="nueva-visita-barra__titulo">
        {{ creada ? 'Visita creada' : 'Nueva visita' }}
      </h1>
    </header>

    <form v-if="!creada" class="nueva-visita-cuerpo" novalidate @submit.prevent="crear">
      <div v-if="consulta.isError.value" class="safic-alerta nueva-visita-alerta" role="alert">
        {{ consulta.error.value?.mensaje }}
        <q-btn flat no-caps dense label="Reintentar" @click="consulta.refetch()" />
      </div>
      <div v-if="errorGeneral" class="safic-alerta nueva-visita-alerta" role="alert">
        {{ errorGeneral }}
      </div>

      <div class="nueva-visita-segmento" role="group" aria-label="Tipo de visita">
        <button
          type="button"
          class="nueva-visita-segmento__opcion"
          :class="{ 'nueva-visita-segmento__opcion--activa': f.tipo === 'unica' }"
          :aria-pressed="f.tipo === 'unica'"
          @click="f.tipo = 'unica'"
        >
          Una vez
        </button>
        <button
          type="button"
          class="nueva-visita-segmento__opcion"
          :class="{ 'nueva-visita-segmento__opcion--activa': f.tipo === 'recurrente' }"
          :aria-pressed="f.tipo === 'recurrente'"
          @click="f.tipo = 'recurrente'"
        >
          Recurrente
        </button>
      </div>

      <label v-if="unidades.length > 1" class="nueva-visita-campo">
        Unidad
        <select v-model="f.unidadId" class="nueva-visita-input">
          <option v-for="u in unidades" :key="u.unidad_id" :value="u.unidad_id">
            {{ u.codigo }}
          </option>
        </select>
        <span v-if="errores.unidadId" class="nueva-visita-error" role="alert">{{
          errores.unidadId
        }}</span>
      </label>

      <label class="nueva-visita-campo">
        Nombre del visitante
        <input v-model="f.nombre" class="nueva-visita-input" autocomplete="off" maxlength="120" />
        <span v-if="errores.nombre" class="nueva-visita-error" role="alert">{{
          errores.nombre
        }}</span>
      </label>
      <label class="nueva-visita-campo">
        Cédula (opcional)
        <input
          v-model="f.cedula"
          class="nueva-visita-input"
          autocomplete="off"
          maxlength="20"
          placeholder="Solo si el condominio la exige"
        />
        <span v-if="errores.cedula" class="nueva-visita-error" role="alert">{{
          errores.cedula
        }}</span>
      </label>

      <div v-if="f.tipo === 'unica'" class="nueva-visita-horario">
        <label class="nueva-visita-campo">
          Fecha
          <input
            v-model="f.fecha"
            type="date"
            :min="hoy"
            class="nueva-visita-input nueva-visita-input--corto"
          />
          <span v-if="errores.fecha" class="nueva-visita-error" role="alert">{{
            errores.fecha
          }}</span>
        </label>
        <label class="nueva-visita-campo">
          Desde
          <input
            v-model="f.desde"
            type="time"
            class="nueva-visita-input nueva-visita-input--corto"
          />
          <span v-if="errores.desde" class="nueva-visita-error" role="alert">{{
            errores.desde
          }}</span>
        </label>
        <label class="nueva-visita-campo">
          Hasta
          <input
            v-model="f.hasta"
            type="time"
            class="nueva-visita-input nueva-visita-input--corto"
          />
          <span v-if="errores.hasta" class="nueva-visita-error" role="alert">{{
            errores.hasta
          }}</span>
        </label>
      </div>

      <div v-else class="nueva-visita-recurrente">
        <div id="nueva-visita-dias" class="nueva-visita-campo">Días</div>
        <div class="nueva-visita-dias" role="group" aria-labelledby="nueva-visita-dias">
          <button
            v-for="dia in DIAS_VISITA"
            :key="dia.id"
            type="button"
            class="nueva-visita-dia"
            :class="{ 'nueva-visita-dia--activo': f.dias.includes(dia.id) }"
            :aria-pressed="f.dias.includes(dia.id)"
            :aria-label="dia.nombre"
            @click="alternarDia(dia.id)"
          >
            {{ dia.letra }}
          </button>
        </div>
        <span v-if="errores.dias" class="nueva-visita-error" role="alert">{{ errores.dias }}</span>
        <div class="nueva-visita-horario">
          <label class="nueva-visita-campo">
            Desde
            <input
              v-model="f.desde"
              type="time"
              class="nueva-visita-input nueva-visita-input--corto"
            />
          </label>
          <label class="nueva-visita-campo">
            Hasta
            <input
              v-model="f.hasta"
              type="time"
              class="nueva-visita-input nueva-visita-input--corto"
            />
            <span v-if="errores.hasta" class="nueva-visita-error" role="alert">{{
              errores.hasta
            }}</span>
          </label>
          <label class="nueva-visita-campo">
            Vale hasta
            <input
              v-model="f.vigenteHasta"
              type="date"
              :min="f.fecha"
              class="nueva-visita-input nueva-visita-input--corto"
            />
            <span v-if="errores.vigenteHasta" class="nueva-visita-error" role="alert">{{
              errores.vigenteHasta
            }}</span>
          </label>
        </div>
      </div>

      <label class="nueva-visita-campo">
        Placa del vehículo (opcional)
        <input
          v-model="f.placa"
          class="nueva-visita-input nueva-visita-input--placa"
          autocapitalize="characters"
          maxlength="8"
        />
        <span v-if="errores.placa" class="nueva-visita-error" role="alert">{{
          errores.placa
        }}</span>
      </label>

      <div class="nueva-visita-espacio" />

      <button type="submit" class="nueva-visita-principal" :disabled="autorizando.isPending.value">
        {{ autorizando.isPending.value ? 'Creando…' : 'Crear y compartir QR' }}
      </button>
    </form>

    <div v-else-if="creada" class="nueva-visita-cuerpo nueva-visita-cuerpo--qr">
      <div v-if="errorGeneral" class="safic-alerta nueva-visita-alerta" role="alert">
        {{ errorGeneral }}
      </div>
      <div class="app-tarjeta nueva-visita-pase">
        <QrToken :token="creada.token" />
        <div class="nueva-visita-pase__nombre">{{ creada.visitante }}</div>
        <div class="nueva-visita-pase__vigencia">{{ vigenciaVisita(creada) }}</div>
      </div>

      <div class="nueva-visita-titulo-mensaje">Así le llega por WhatsApp</div>
      <div class="nueva-visita-mensaje">
        Hola {{ primerNombre(creada.visitante) }}, te espero en {{ condominio }},
        {{ creada.unidad }}. Muestra este QR en la garita.<br /><span
          class="nueva-visita-mensaje__enlace"
          >Ver mi QR</span
        >
        ·
        <span class="nueva-visita-mensaje__enlace">Cómo llegar (Google Maps / Waze)</span>
      </div>
      <div class="nueva-visita-privacidad">
        El QR no contiene datos personales. Tus datos y los del visitante se tratan según la
        política de privacidad del condominio.
      </div>

      <div class="nueva-visita-espacio" />

      <button type="button" class="nueva-visita-principal" @click="compartir">
        Compartir por WhatsApp
      </button>
      <button
        type="button"
        class="nueva-visita-revocar"
        :disabled="revocando.isPending.value"
        @click="revocar"
      >
        Revocar autorización
      </button>
      <router-link :to="{ name: 'app-mis-visitas' }" class="nueva-visita-revocar">
        Ver mis visitas
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

import { aApiError } from '@/core/api/errors';
import QrToken from '@/modules/garita/components/QrToken.vue';
import {
  useAutorizarVisita,
  useMisVisitas,
  useRevocarVisita,
} from '@/modules/garita/composables/useVisitas';
import type { VisitaAutorizada } from '@/modules/garita/services/visitas.service';
import {
  DIAS_VISITA,
  mensajeParaVisitante,
  peticionVisita,
  primerNombre,
  validarVisita,
  vigenciaVisita,
  visitaVacia,
  type ErroresVisita,
} from '@/modules/garita/visitas.logica';
import { useSessionStore } from '@/stores/session';
import { hoyEcuador } from '@/utils/fecha';

const $q = useQuasar();
const router = useRouter();
const session = useSessionStore();

const hoy = hoyEcuador();
const consulta = useMisVisitas();
const autorizando = useAutorizarVisita();
const revocando = useRevocarVisita();
const unidades = computed(() => consulta.data.value?.unidades ?? []);
const condominio = computed(() => session.condominioActivo?.nombre ?? 'el condominio');

// Al salir no queda en memoria el nombre, la cédula ni el QR del visitante
onBeforeUnmount(() => {
  Object.assign(f, visitaVacia(hoy));
  creada.value = null;
  autorizando.reset();
});

const f = reactive(visitaVacia(hoy));
const errores = reactive<ErroresVisita>({});
const errorGeneral = ref<string | null>(null);
const creada = ref<VisitaAutorizada | null>(null);

// Con una sola unidad no se pregunta; si hay varias, se parte de la primera
watch(
  unidades,
  (lista) => {
    if (!lista.some((u) => u.unidad_id === f.unidadId)) f.unidadId = lista[0]?.unidad_id ?? null;
  },
  { immediate: true },
);

// Otro condominio: nada de lo escrito ni del QR queda
watch(
  () => session.condominioId,
  () => {
    Object.assign(f, visitaVacia(hoy));
    creada.value = null;
    errorGeneral.value = null;
  },
);

function alternarDia(id: number): void {
  f.dias = f.dias.includes(id) ? f.dias.filter((d) => d !== id) : [...f.dias, id];
}

async function crear(): Promise<void> {
  // Enter dentro de un campo también envía el formulario: no se crea dos veces
  if (autorizando.isPending.value) return;
  errorGeneral.value = null;
  for (const k of Object.keys(errores) as (keyof ErroresVisita)[]) errores[k] = undefined;

  const ahora = new Date().toLocaleTimeString('en-GB', {
    timeZone: 'America/Guayaquil',
    hour: '2-digit',
    minute: '2-digit',
  });
  const problemas = validarVisita(f, hoy, ahora);
  if (Object.keys(problemas).length > 0) {
    Object.assign(errores, problemas);
    return;
  }

  try {
    creada.value = await autorizando.mutateAsync(peticionVisita(f));
  } catch (error) {
    const apiError = aApiError(error);
    errores.nombre = apiError.campo('visitante');
    errores.cedula = apiError.campo('documento');
    errores.placa = apiError.campo('placa');
    errores.fecha = apiError.campo('fecha_desde');
    errores.desde = apiError.campo('hora_desde');
    errores.hasta = apiError.campo('hora_hasta');
    errores.dias = apiError.campo('dias_semana');
    if (!Object.values(errores).some(Boolean)) {
      // Sin respuesta o 5xx la visita pudo crearse: se avisa para no duplicarla
      errorGeneral.value =
        apiError.estado === 0 || apiError.estado >= 500
          ? `${apiError.mensaje} Revisa Mis visitas antes de reintentar: pudo crearse.`
          : apiError.mensaje;
    }
  }
}

async function compartir(): Promise<void> {
  const v = creada.value;
  if (!v) return;
  const texto = mensajeParaVisitante(v, condominio.value, window.location.origin);
  // En el celular se abre el menú de compartir (WhatsApp entre otros); si no existe, se abre WhatsApp con el texto
  if (typeof navigator.share === 'function') {
    try {
      await navigator.share({ text: texto });
    } catch {
      // La persona cerró el menú: no es un error
    }
    return;
  }
  window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank', 'noopener,noreferrer');
}

function revocar(): void {
  const v = creada.value;
  if (!v || revocando.isPending.value) return;
  $q.dialog({
    title: 'Revocar autorización',
    message: `El QR de ${v.visitante} dejará de servir en la garita.`,
    cancel: { label: 'Mantenerla', flat: true, noCaps: true },
    ok: { label: 'Revocar', unelevated: true, noCaps: true, color: 'negative' },
    persistent: true,
  }).onOk(() => {
    // Dos toques rápidos abren dos cuadros: se vuelve a mirar al confirmar
    if (revocando.isPending.value) return;
    revocando.mutate(v.id, {
      onSuccess: () => {
        $q.notify({ type: 'positive', message: 'Autorización revocada.' });
        void router.push({ name: 'app-mis-visitas' });
      },
      onError: (error) => {
        errorGeneral.value = aApiError(error).mensaje;
      },
    });
  });
}
</script>

<style scoped>
.nueva-visita-error {
  font-size: 12px;
  font-weight: 600;
  color: #b3261e;
}

.nueva-visita-alerta {
  margin: 0;
}

.nueva-visita-principal:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Los mockups usan el interlineado normal del navegador. */
.nueva-visita {
  line-height: normal;
}

.nueva-visita-barra {
  height: 60px;
  flex-shrink: 0;
  background: var(--safic-superficie);
  border-bottom: 1px solid var(--safic-borde);
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0 8px;
}

.nueva-visita-barra__volver {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--safic-texto);
  border-radius: 10px;
  text-decoration: none;
}

.nueva-visita-barra__titulo {
  margin: 0;
  font-size: 17px;
  font-weight: 800;
  line-height: normal;
  letter-spacing: normal;
}

.nueva-visita-cuerpo {
  flex-grow: 1;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.nueva-visita-cuerpo--qr {
  gap: 12px;
}

.nueva-visita-segmento {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  background: var(--safic-linea);
  padding: 4px;
  border-radius: 12px;
}

/* Segmento de 42px como el mockup, con área táctil de 44px. */
.nueva-visita-segmento__opcion {
  position: relative;
  height: 42px;
  border-radius: 9px;
  border: none;
  font-family: inherit;
  font-size: 14px;
  cursor: pointer;
  background: transparent;
  color: var(--safic-texto-suave);
  font-weight: 600;
}

.nueva-visita-segmento__opcion::after {
  content: '';
  position: absolute;
  inset: -1px;
}

.nueva-visita-segmento__opcion--activa {
  background: var(--safic-superficie);
  color: var(--safic-texto);
  font-weight: 800;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
}

.nueva-visita-campo {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
  font-weight: 700;
  color: var(--safic-texto-2);
  min-width: 0;
}

.nueva-visita-input {
  height: 48px;
  border: 1px solid var(--safic-borde-campo);
  border-radius: 10px;
  padding: 0 12px;
  font-family: inherit;
  font-size: 16px;
  font-weight: 400;
  color: var(--safic-texto);
  background: var(--safic-superficie);
  min-width: 0;
}

.nueva-visita-input::placeholder {
  color: var(--safic-texto-tenue);
}

.nueva-visita-input:focus {
  outline: 2px solid var(--q-primary);
  outline-offset: -1px;
}

.nueva-visita-input--corto {
  padding: 0 10px;
  font-size: 15px;
}

.nueva-visita-input--placa {
  letter-spacing: 1px;
  text-transform: uppercase;
}

.nueva-visita-horario {
  display: grid;
  grid-template-columns: 1.3fr 1fr 1fr;
  gap: 8px;
}

.nueva-visita-recurrente {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.nueva-visita-dias {
  display: flex;
  gap: 6px;
}

/* Píldora del mockup, con área táctil de 44px. */
.nueva-visita-dia {
  position: relative;
  padding: 8px 10px;
  border-radius: 999px;
  font-family: inherit;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  background: var(--safic-superficie);
  color: var(--safic-texto);
  border: 1px solid var(--safic-borde-2);
}

.nueva-visita-dia::after {
  content: '';
  position: absolute;
  inset: -6px -3px;
}

.nueva-visita-dia--activo {
  background: var(--q-primary);
  color: #ffffff;
  border-color: var(--q-primary);
}

.nueva-visita-nota {
  font-size: 13px;
  color: var(--safic-texto-2);
}

.nueva-visita-espacio {
  flex-grow: 1;
}

.nueva-visita-principal {
  flex-shrink: 0;
  height: 52px;
  border-radius: 12px;
  border: none;
  background: var(--q-primary);
  color: #ffffff;
  font-family: inherit;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
}

.nueva-visita-pase {
  border-radius: 16px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.nueva-visita-pase__nombre {
  font-size: 17px;
  font-weight: 800;
}

.nueva-visita-pase__vigencia {
  font-size: 13px;
  color: var(--safic-texto-2);
}

.nueva-visita-titulo-mensaje {
  font-size: 13px;
  font-weight: 800;
  color: var(--safic-texto-suave);
}

.nueva-visita-mensaje {
  background: #e7f4e4;
  border-radius: 12px 12px 12px 2px;
  padding: 12px 14px;
  font-size: 14px;
  line-height: 1.5;
  color: var(--safic-texto);
}

.nueva-visita-mensaje__enlace {
  color: var(--q-primary);
  font-weight: 700;
  text-decoration: underline;
}

.nueva-visita-privacidad {
  font-size: 12px;
  color: var(--safic-texto-suave);
  line-height: 1.5;
}

.nueva-visita-revocar {
  flex-shrink: 0;
  height: 44px;
  border-radius: 12px;
  border: 1px solid var(--safic-borde-2);
  background: var(--safic-superficie);
  color: #9b1c12;
  font-family: inherit;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
}
</style>
