<template>
  <div class="app-pagina mi-hogar">
    <AppEncabezado
      class="mi-hogar-encabezado"
      :antetitulo="unidad.condominio"
      :titulo="unidad.saludo"
      solapado
    />

    <section class="app-tarjeta app-tarjeta-solapada mi-hogar-unidad" aria-label="Mi unidad">
      <div class="mi-hogar-unidad__icono">
        <q-icon name="sym_r_home" size="26px" />
      </div>
      <div class="col-grow">
        <div class="mi-hogar-unidad__codigo">{{ unidad.codigo }}</div>
        <div class="mi-hogar-unidad__detalle">{{ unidad.detalle }}</div>
      </div>
    </section>

    <div class="app-cuerpo">
      <section>
        <div class="mi-hogar-seccion">
          <h2 class="mi-hogar-seccion__titulo">Quiénes viven aquí</h2>
          <button type="button" class="mi-hogar-enlace" @click="avisar('Agregar residente')">
            Agregar
          </button>
        </div>
        <div class="app-tarjeta">
          <div v-for="persona in personas" :key="persona.id" class="mi-hogar-fila">
            <div
              class="mi-hogar-avatar"
              :style="{
                background: colorAvatar(persona.id).fondo,
                color: colorAvatar(persona.id).texto,
              }"
              aria-hidden="true"
            >
              {{ iniciales(persona.nombre) }}
            </div>
            <div class="col-grow">
              <div class="mi-hogar-fila__nombre">
                {{ persona.nombre }}{{ persona.esUsuario ? ' (tú)' : '' }}
              </div>
              <div class="mi-hogar-fila__nota">{{ persona.rol }}</div>
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2 class="mi-hogar-seccion__titulo mi-hogar-seccion__titulo--solo">Vehículos</h2>
        <div class="mi-hogar-vehiculos">
          <div
            v-for="vehiculo in vehiculos"
            :key="vehiculo.placa"
            class="app-tarjeta mi-hogar-vehiculo"
          >
            <div class="safic-placa">{{ vehiculo.placa }}</div>
            <div class="mi-hogar-fila__nota mi-hogar-vehiculo__nota">
              {{ vehiculo.descripcion }}
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2 class="mi-hogar-seccion__titulo mi-hogar-seccion__titulo--solo">Mascotas</h2>
        <div
          v-for="mascota in mascotas"
          :key="mascota.nombre"
          class="app-tarjeta mi-hogar-fila mi-hogar-fila--tarjeta"
        >
          <div class="col-grow">
            <div class="mi-hogar-fila__nombre">{{ mascota.nombre }}</div>
            <div class="mi-hogar-fila__nota">{{ mascota.descripcion }}</div>
          </div>
          <button
            type="button"
            class="mi-hogar-enlace"
            :aria-label="`Editar ${mascota.nombre}`"
            @click="avisar('Editar mascota')"
          >
            Editar
          </button>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';

import AppEncabezado from '@/components/app/AppEncabezado.vue';
import { colorAvatar, iniciales } from '@/core/theme/avatar';

import {
  MI_HOGAR_MASCOTAS,
  MI_HOGAR_PERSONAS,
  MI_HOGAR_UNIDAD,
  MI_HOGAR_VEHICULOS,
} from '../demo/miHogar';

const $q = useQuasar();

const unidad = MI_HOGAR_UNIDAD;
const personas = MI_HOGAR_PERSONAS;
const vehiculos = MI_HOGAR_VEHICULOS;
const mascotas = MI_HOGAR_MASCOTAS;

function avisar(accion: string): void {
  $q.notify({ type: 'info', message: `${accion}: disponible cuando exista la API.` });
}
</script>

<style scoped>
/* Los mockups usan el interlineado normal del navegador. */
.mi-hogar {
  line-height: normal;
}

.app-pagina .mi-hogar-encabezado {
  padding-top: 28px;
}

.mi-hogar-encabezado :deep(.app-encabezado__titulo) {
  font-size: 26px;
  margin-top: 4px;
}

.mi-hogar-unidad {
  padding: 18px;
  display: flex;
  align-items: center;
  gap: 14px;
}

.mi-hogar-unidad__icono {
  width: 52px;
  height: 52px;
  border-radius: 12px;
  background: #e3efec;
  color: #0b4a47;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.mi-hogar-unidad__codigo {
  font-size: 20px;
  font-weight: 800;
}

.mi-hogar-unidad__detalle {
  font-size: 13px;
  color: var(--safic-texto-suave);
}

.mi-hogar-seccion {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.mi-hogar-seccion__titulo {
  margin: 0;
  flex-grow: 1;
  font-size: 15px;
  font-weight: 800;
  line-height: normal;
  letter-spacing: normal;
}

.mi-hogar-seccion__titulo--solo {
  margin-bottom: 10px;
}

/* Enlace de texto con área táctil de 44px sin cambiar el alto visible. */
.mi-hogar-enlace {
  position: relative;
  border: none;
  background: transparent;
  padding: 8px 0;
  font-family: inherit;
  font-size: 14px;
  font-weight: 700;
  color: var(--q-primary);
  cursor: pointer;
}

.mi-hogar-enlace::after {
  content: '';
  position: absolute;
  inset: -4px -8px;
}

.mi-hogar-fila {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
}

.mi-hogar-fila + .mi-hogar-fila {
  border-top: 1px solid var(--safic-linea-2);
}

.mi-hogar-avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 13px;
  flex-shrink: 0;
}

.mi-hogar-fila__nombre {
  font-size: 14px;
  font-weight: 700;
}

.mi-hogar-fila__nota {
  font-size: 12px;
  color: var(--safic-texto-suave);
}

.mi-hogar-vehiculos {
  display: flex;
  gap: 10px;
}

.mi-hogar-vehiculo {
  flex-grow: 1;
  padding: 12px;
}

.mi-hogar-vehiculo__nota {
  margin-top: 6px;
}
</style>
