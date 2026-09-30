<template>
  <div class="app-pagina nueva-visita">
    <!-- El mockup usa una barra blanca con "volver" en lugar del encabezado de color. -->
    <header class="nueva-visita-barra">
      <router-link
        :to="{ name: 'app-mi-hogar' }"
        class="nueva-visita-barra__volver"
        aria-label="Volver"
      >
        <q-icon name="sym_r_chevron_left" size="26px" />
      </router-link>
      <h1 class="nueva-visita-barra__titulo">
        {{ paso === 'formulario' ? 'Nueva visita' : 'Visita creada' }}
      </h1>
    </header>

    <form v-if="paso === 'formulario'" class="nueva-visita-cuerpo" @submit.prevent="crear">
      <div class="nueva-visita-segmento" role="group" aria-label="Tipo de visita">
        <button
          type="button"
          class="nueva-visita-segmento__opcion"
          :class="{ 'nueva-visita-segmento__opcion--activa': tipo === 'unica' }"
          :aria-pressed="tipo === 'unica'"
          @click="tipo = 'unica'"
        >
          Una vez
        </button>
        <button
          type="button"
          class="nueva-visita-segmento__opcion"
          :class="{ 'nueva-visita-segmento__opcion--activa': tipo === 'recurrente' }"
          :aria-pressed="tipo === 'recurrente'"
          @click="tipo = 'recurrente'"
        >
          Recurrente
        </button>
      </div>

      <label class="nueva-visita-campo">
        Nombre del visitante
        <input v-model="formulario.nombre" class="nueva-visita-input" autocomplete="off" />
      </label>
      <label class="nueva-visita-campo">
        Cédula (opcional)
        <input
          v-model="formulario.cedula"
          class="nueva-visita-input"
          inputmode="numeric"
          placeholder="Solo si el condominio la exige"
        />
      </label>

      <div v-if="tipo === 'unica'" class="nueva-visita-horario">
        <label class="nueva-visita-campo">
          Fecha
          <input v-model="formulario.fecha" class="nueva-visita-input nueva-visita-input--corto" />
        </label>
        <label class="nueva-visita-campo">
          Desde
          <input v-model="formulario.desde" class="nueva-visita-input nueva-visita-input--corto" />
        </label>
        <label class="nueva-visita-campo">
          Hasta
          <input v-model="formulario.hasta" class="nueva-visita-input nueva-visita-input--corto" />
        </label>
      </div>

      <div v-else class="nueva-visita-recurrente">
        <div id="nueva-visita-dias" class="nueva-visita-campo">Días</div>
        <div class="nueva-visita-dias" role="group" aria-labelledby="nueva-visita-dias">
          <button
            v-for="dia in dias"
            :key="dia.id"
            type="button"
            class="nueva-visita-dia"
            :class="{ 'nueva-visita-dia--activo': diasElegidos.includes(dia.id) }"
            :aria-pressed="diasElegidos.includes(dia.id)"
            :aria-label="dia.nombre"
            @click="alternarDia(dia.id)"
          >
            {{ dia.letra }}
          </button>
        </div>
        <div class="nueva-visita-nota">{{ horarioRecurrente }}</div>
      </div>

      <label class="nueva-visita-campo">
        Placa del vehículo (opcional)
        <input
          v-model="formulario.placa"
          class="nueva-visita-input nueva-visita-input--placa"
          autocapitalize="characters"
        />
      </label>

      <div class="nueva-visita-espacio" />

      <button type="submit" class="nueva-visita-principal">Crear y compartir QR</button>
    </form>

    <div v-else class="nueva-visita-cuerpo nueva-visita-cuerpo--qr">
      <div class="app-tarjeta nueva-visita-pase">
        <NuevaVisitaQr />
        <div class="nueva-visita-pase__nombre">{{ formulario.nombre }}</div>
        <div class="nueva-visita-pase__vigencia">{{ vigencia }}</div>
      </div>

      <div class="nueva-visita-titulo-mensaje">Así le llega por WhatsApp</div>
      <div class="nueva-visita-mensaje">
        Hola {{ primerNombre }}, te espero en {{ condominio }}, {{ unidad }}. Muestra este QR en la
        garita.<br /><span class="nueva-visita-mensaje__enlace">Ver mi QR</span>
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
      <button type="button" class="nueva-visita-revocar" @click="paso = 'formulario'">
        Revocar autorización
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import { computed, reactive, ref } from 'vue';

import NuevaVisitaQr from '../components/NuevaVisitaQr.vue';
import {
  NUEVA_VISITA_CONDOMINIO,
  NUEVA_VISITA_DIAS,
  NUEVA_VISITA_DIAS_INICIALES,
  NUEVA_VISITA_FORMULARIO,
  NUEVA_VISITA_RECURRENTE_HORARIO,
  NUEVA_VISITA_UNIDAD,
  NUEVA_VISITA_VIGENCIA,
} from '../demo/nuevaVisita';

type TipoVisita = 'unica' | 'recurrente';

const $q = useQuasar();

const dias = NUEVA_VISITA_DIAS;
const horarioRecurrente = NUEVA_VISITA_RECURRENTE_HORARIO;
const condominio = NUEVA_VISITA_CONDOMINIO;
const unidad = NUEVA_VISITA_UNIDAD;

const paso = ref<'formulario' | 'qr'>('formulario');
const tipo = ref<TipoVisita>('unica');
const formulario = reactive({ ...NUEVA_VISITA_FORMULARIO });
const diasElegidos = ref<string[]>([...NUEVA_VISITA_DIAS_INICIALES]);

const vigencia = computed(() => NUEVA_VISITA_VIGENCIA[tipo.value]);
const primerNombre = computed(() => formulario.nombre.trim().split(/\s+/)[0] ?? '');

function alternarDia(id: string): void {
  diasElegidos.value = diasElegidos.value.includes(id)
    ? diasElegidos.value.filter((d) => d !== id)
    : [...diasElegidos.value, id];
}

function crear(): void {
  if (!formulario.nombre.trim()) {
    $q.notify({ type: 'warning', message: 'Escribe el nombre del visitante.' });
    return;
  }
  paso.value = 'qr';
}

function compartir(): void {
  $q.notify({ type: 'positive', message: 'Invitación lista para compartir por WhatsApp.' });
}
</script>

<style scoped>
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
