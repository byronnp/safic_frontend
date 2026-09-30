<template>
  <!-- Panel lateral del usuario elegido (mockup F1Usuarios: contadora externa) -->
  <div class="panel">
    <div class="panel__cabecera">
      <div class="panel__persona">
        <div class="panel__avatar" :style="{ background: color.fondo, color: color.texto }">
          {{ esContadora ? CONTADORA.iniciales : iniciales(usuario.nombre) }}
        </div>
        <div class="panel__persona-textos">
          <div class="panel__nombre">{{ usuario.nombre }}</div>
          <div class="panel__descripcion">
            {{ esContadora ? CONTADORA.descripcion : usuario.roles }}
          </div>
        </div>
      </div>
      <div v-if="esContadora" class="panel__pestanas" role="tablist">
        <button
          v-for="t in PESTANAS"
          :key="t.clave"
          type="button"
          role="tab"
          class="panel__pestana"
          :class="{ 'panel__pestana--activa': t.clave === pestana }"
          :aria-selected="t.clave === pestana"
          @click="pestana = t.clave"
        >
          {{ t.texto }}
        </button>
      </div>
    </div>

    <template v-if="esContadora">
      <div v-if="pestana === 'acceso'" class="panel__acceso">
        <div class="panel__acuerdo">{{ CONTADORA.acuerdo }}</div>
        <div v-for="d in CONTADORA.datos" :key="d.etiqueta" class="panel__dato">
          <span class="panel__dato-etiqueta">{{ d.etiqueta }}</span>
          <strong>{{ d.valor }}</strong>
        </div>
        <label class="panel__campo">
          Acceso hasta
          <input v-model="accesoHasta" />
        </label>
        <label class="panel__casilla">
          <input v-model="avisar" type="checkbox" />
          Avisarme por correo en cada exportación
        </label>
        <div class="panel__nota">
          Al llegar la fecha, el rol se desactiva solo. Su acceso como residente de
          {{ CONTADORA.unidad }} no cambia.
        </div>
        <button type="button" class="panel__revocar" :disabled="revocado" @click="revocar">
          {{ revocado ? 'Acceso de contadora revocado' : 'Revocar acceso de contadora' }}
        </button>
      </div>

      <div v-else class="panel__bitacora">
        <div v-for="b in BITACORA_CONTADORA" :key="b.hora + b.recurso" class="panel__evento">
          <div class="panel__evento-hora">{{ b.hora }}</div>
          <div class="panel__evento-textos">
            <div class="panel__evento-recurso">{{ b.recurso }}</div>
            <div class="panel__evento-detalle">{{ b.detalle }}</div>
          </div>
          <EstadoBadge
            :tono="b.tipo === 'Exportó' ? 'alerta' : 'neutro'"
            class="panel__evento-tipo"
          >
            {{ b.tipo }}
          </EstadoBadge>
        </div>
        <div class="panel__inmutable">Registro inmutable · se conserva 5 años.</div>
      </div>
    </template>

    <div v-else class="panel__acceso">
      <div class="panel__dato">
        <span class="panel__dato-etiqueta">Correo o ubicación</span>
        <strong>{{ usuario.correo }}</strong>
      </div>
      <div class="panel__dato">
        <span class="panel__dato-etiqueta">Cuenta para el cupo</span>
        <strong>{{ usuario.cuentaCupo ? 'Sí' : 'No' }}</strong>
      </div>
      <div class="panel__dato">
        <span class="panel__dato-etiqueta">Acceso hasta</span>
        <strong>{{
          usuario.accesoHasta === '—' ? 'Sin fecha de fin' : usuario.accesoHasta
        }}</strong>
      </div>
      <div class="panel__nota">
        {{
          usuario.cuentaCupo
            ? 'Este usuario ocupa uno de los cupos administrativos de tu plan.'
            : 'Este rol no cuenta para el límite de usuarios administrativos del plan.'
        }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import { computed, ref } from 'vue';

import EstadoBadge from '@/components/EstadoBadge.vue';
import { colorAvatar, iniciales } from '@/core/theme/avatar';

import { BITACORA_CONTADORA, CONTADORA, USUARIOS, type UsuarioDemo } from '../demo/usuarios';

type Pestana = 'acceso' | 'bitacora';

const PESTANAS: { clave: Pestana; texto: string }[] = [
  { clave: 'acceso', texto: 'Acceso y confidencialidad' },
  { clave: 'bitacora', texto: 'Bitácora' },
];

const props = defineProps<{ usuario: UsuarioDemo }>();

const $q = useQuasar();

const pestana = ref<Pestana>('acceso');
const accesoHasta = ref<string>(CONTADORA.accesoHasta);
const avisar = ref<boolean>(CONTADORA.avisarExportaciones);
const revocado = ref(false);

const esContadora = computed(() => props.usuario.nombre === CONTADORA.nombre);

/** Ana Villacís usa el azul del mockup (#E6ECF7 / #23407A = colorAvatar(2)). */
const color = computed(() => colorAvatar(USUARIOS.indexOf(props.usuario)));

function revocar() {
  revocado.value = true;
  $q.notify({ type: 'positive', message: 'Se revocó el acceso de contadora de Ana Villacís.' });
}
</script>

<style scoped>
.panel {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.panel__cabecera {
  padding: 18px 20px 0 20px;
}

.panel__persona {
  display: flex;
  align-items: center;
  gap: 12px;
}

.panel__avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  flex-shrink: 0;
}

.panel__persona-textos {
  flex-grow: 1;
  min-width: 0;
}

.panel__nombre {
  font-size: 17px;
  font-weight: 800;
}

.panel__descripcion {
  font-size: 12px;
  color: var(--safic-texto-suave);
}

.panel__pestanas {
  display: flex;
  gap: 4px;
  margin-top: 14px;
  border-bottom: 1px solid var(--safic-linea);
}

.panel__pestana {
  height: 42px;
  padding: 0 12px;
  border: none;
  border-bottom: 3px solid transparent;
  margin-bottom: -1px;
  background: none;
  cursor: pointer;
  font-size: 13px;
  font-weight: 700;
  font-family: inherit;
  color: var(--safic-texto-tenue);
}

.panel__pestana--activa {
  color: var(--safic-texto);
  border-bottom-color: var(--q-primary);
}

.panel__pestana:focus-visible,
.panel__revocar:focus-visible {
  outline: 2px solid var(--q-primary);
  outline-offset: 2px;
}

.panel__acceso {
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  font-size: 13px;
}

.panel__acuerdo {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #e3efec;
  color: #0b4a47;
  border-radius: 10px;
  padding: 10px 12px;
  font-weight: 700;
}

.panel__dato {
  display: flex;
  gap: 12px;
}

.panel__dato-etiqueta {
  flex-grow: 1;
  color: var(--safic-texto-suave);
}

.panel__dato strong {
  text-align: right;
}

.panel__campo {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-weight: 700;
  color: var(--safic-texto-2);
  margin-top: 4px;
}

.panel__campo input {
  height: 42px;
  border: 1px solid var(--safic-borde-campo);
  border-radius: 9px;
  padding: 0 12px;
  font-size: 15px;
  font-family: inherit;
  color: var(--safic-texto);
}

.panel__campo input:focus {
  outline: none;
  border-color: var(--q-primary);
}

.panel__casilla {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 600;
  color: var(--safic-texto-2);
  cursor: pointer;
}

.panel__casilla input {
  width: 18px;
  height: 18px;
  margin: 0;
  accent-color: var(--q-primary);
}

.panel__nota {
  font-size: 12px;
  color: var(--safic-texto-suave);
  line-height: 1.5;
}

.panel__revocar {
  height: 42px;
  border-radius: 10px;
  border: 1px solid #9b1c12;
  background: #ffffff;
  color: #9b1c12;
  font-size: 14px;
  font-weight: 700;
  font-family: inherit;
  cursor: pointer;
  margin-top: 6px;
}

.panel__revocar:disabled {
  cursor: default;
  opacity: 0.6;
}

.panel__bitacora {
  padding: 8px 20px 16px 20px;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.panel__evento {
  display: flex;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid var(--safic-linea-2);
}

.panel__evento-hora {
  width: 70px;
  flex-shrink: 0;
  font-size: 12px;
  color: var(--safic-texto-suave);
  font-weight: 700;
}

.panel__evento-textos {
  flex-grow: 1;
  min-width: 0;
}

.panel__evento-recurso {
  font-size: 13px;
  font-weight: 700;
}

.panel__evento-detalle {
  font-size: 12px;
  color: var(--safic-texto-suave);
}

.panel__evento-tipo {
  flex-shrink: 0;
  align-self: center;
}

.panel__inmutable {
  font-size: 12px;
  color: var(--safic-texto-suave);
  margin-top: 10px;
}
</style>
