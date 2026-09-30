<template>
  <q-page class="roles">
    <PaginaEncabezado miga="Plataforma / Acceso / Roles y permisos" titulo="Roles y permisos">
      <template #acciones>
        <button type="button" class="roles__boton roles__boton--nuevo" @click="nuevoRol">
          <q-icon name="sym_r_add" size="18px" />Nuevo rol
        </button>
        <button
          type="button"
          class="roles__boton"
          :class="pendiente ? 'roles__boton--guardar' : 'roles__boton--apagado'"
          :aria-disabled="!pendiente"
          @click="guardar"
        >
          {{ etiquetaGuardar }}
        </button>
      </template>
    </PaginaEncabezado>

    <div class="roles__info">
      <q-icon name="sym_r_info" size="20px" />
      <span>
        Solo la plataforma crea y edita roles. Los condominios solo los asignan a sus usuarios; si
        necesitan uno nuevo, lo solicitan ({{ SOLICITUDES_ROL_PENDIENTES }} solicitudes pendientes).
        Los permisos vienen del código: aquí solo se combinan.
      </span>
    </div>

    <div class="roles__filtros">
      <div class="roles__pildoras" role="group" aria-label="Filtrar por módulo">
        <button
          v-for="m in modulos"
          :key="m"
          type="button"
          class="safic-pildora"
          :class="{ 'safic-pildora--activa': m === modulo }"
          :aria-pressed="m === modulo"
          @click="modulo = m"
        >
          {{ m === 'todos' ? 'Todos' : m }}
        </button>
      </div>
      <div class="roles__leyendas">
        <span class="roles__leyenda">
          <span class="adm">ADM</span>cuenta para el límite del plan
        </span>
        <span class="roles__leyenda">
          <q-icon name="sym_r_lock" size="16px" />no permitido para ese rol
        </span>
      </div>
    </div>

    <div class="matriz" role="table" aria-label="Permisos por rol">
      <div
        class="matriz__fila matriz__cabecera"
        role="row"
        :style="{ gridTemplateColumns: columnas, minWidth }"
      >
        <div class="matriz__titulo-permiso" role="columnheader">PERMISO</div>
        <div v-for="c in cabeceras" :key="c.nombre" class="matriz__rol" role="columnheader">
          <div class="matriz__rol-nombre" :title="c.nombre">{{ c.nombre }}</div>
          <div class="tipo" :class="`tipo--${c.tipo}`">{{ c.tipoTexto }}</div>
          <div class="matriz__rol-conteo">{{ c.resumen }}</div>
        </div>
      </div>

      <template v-for="g in grupos" :key="g.modulo">
        <div
          class="matriz__fila matriz__grupo"
          role="row"
          :style="{ gridTemplateColumns: columnas, minWidth }"
        >
          <div class="matriz__grupo-nombre" role="cell">{{ g.modulo.toUpperCase() }}</div>
        </div>
        <div
          v-for="pi in g.indices"
          :key="PERMISOS_PLANTILLA[pi]!.clave"
          class="matriz__fila matriz__permiso"
          role="row"
          :style="{ gridTemplateColumns: columnas, minWidth }"
        >
          <div class="matriz__permiso-textos" role="rowheader">
            <div class="matriz__permiso-etiqueta">
              {{ PERMISOS_PLANTILLA[pi]!.etiqueta }}
              <span v-if="PERMISOS_PLANTILLA[pi]!.administrativo" class="adm adm--chico">ADM</span>
            </div>
            <div class="matriz__permiso-clave">{{ PERMISOS_PLANTILLA[pi]!.clave }}</div>
          </div>
          <div v-for="(rol, ci) in roles" :key="rol.nombre" class="matriz__celda" role="cell">
            <button
              v-if="bloqueo(pi, ci)"
              type="button"
              class="casilla casilla--bloqueada"
              aria-disabled="true"
              :aria-label="`${PERMISOS_PLANTILLA[pi]!.etiqueta} · ${rol.nombre}: ${bloqueo(pi, ci)}`"
            >
              <q-icon name="sym_r_lock" size="16px" />
              <q-tooltip>{{ bloqueo(pi, ci) }}</q-tooltip>
            </button>
            <button
              v-else
              type="button"
              role="checkbox"
              class="casilla"
              :class="{ 'casilla--on': valor(pi, ci) }"
              :aria-checked="valor(pi, ci)"
              :aria-label="`${PERMISOS_PLANTILLA[pi]!.etiqueta} · ${rol.nombre}`"
              @click="alternar(pi, ci)"
            >
              <q-icon v-if="valor(pi, ci)" name="sym_r_check" size="18px" />
            </button>
          </div>
        </div>
      </template>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

import PaginaEncabezado from '@/components/PaginaEncabezado.vue';
import {
  MODULOS_PERMISOS,
  PERMISOS_PLANTILLA,
  ROLES_PLANTILLA,
  SOLICITUDES_ROL_PENDIENTES,
} from '@/modules/plataforma/demo/roles-permisos';
import type { RolPlantilla } from '@/modules/plataforma/demo/roles-permisos';

const roles = ref<RolPlantilla[]>(ROLES_PLANTILLA.map((r) => ({ ...r })));
/** valores[permiso][rol] */
const valores = ref<boolean[][]>(
  PERMISOS_PLANTILLA.map((p) => ROLES_PLANTILLA.map((_, ci) => p.valores[ci] === '1')),
);
const modulo = ref<string>('todos');
const pendiente = ref(false);
const guardado = ref(false);
const rolesNuevos = ref(0);

const modulos = ['todos', ...MODULOS_PERMISOS];

const columnas = computed(() => `300px repeat(${roles.value.length}, minmax(0, 1fr))`);
const minWidth = computed(() => `${300 + roles.value.length * 72}px`);

/** Reglas fijas del código: qué permisos nunca recibe cada rol. */
function bloqueo(pi: number, ci: number): string {
  const p = PERMISOS_PLANTILLA[pi];
  const rol = roles.value[ci]?.nombre;
  if (!p) return '';
  if (rol === 'Contador' && p.escritura) return 'El contador es solo lectura';
  if (rol === 'Residente' && p.administrativo) {
    return 'Un residente no recibe permisos administrativos';
  }
  if (rol === 'Guardia' && p.administrativo) {
    return 'El guardia no recibe permisos administrativos';
  }
  return '';
}

function valor(pi: number, ci: number): boolean {
  return !bloqueo(pi, ci) && (valores.value[pi]?.[ci] ?? false);
}

function alternar(pi: number, ci: number): void {
  const fila = valores.value[pi];
  if (!fila || bloqueo(pi, ci)) return;
  fila[ci] = !fila[ci];
  pendiente.value = true;
  guardado.value = false;
}

const grupos = computed(() => {
  const lista: { modulo: string; indices: number[] }[] = [];
  PERMISOS_PLANTILLA.forEach((p, pi) => {
    if (modulo.value !== 'todos' && p.modulo !== modulo.value) return;
    let grupo = lista.at(-1);
    if (grupo?.modulo !== p.modulo) {
      grupo = { modulo: p.modulo, indices: [] };
      lista.push(grupo);
    }
    grupo.indices.push(pi);
  });
  return lista;
});

const TIPO_TEXTO = { sis: 'Sistema', car: 'Cargo', adi: 'Adicional' } as const;

/** Conteo por columna (sobre todos los permisos, no solo los filtrados), como en el mockup. */
const cabeceras = computed(() =>
  roles.value.map((r, ci) => {
    const concedidos = PERMISOS_PLANTILLA.filter((_, pi) => valor(pi, ci));
    const adm = concedidos.some((p) => p.administrativo);
    return {
      nombre: r.nombre,
      tipo: r.tipo,
      tipoTexto: TIPO_TEXTO[r.tipo],
      resumen: `${concedidos.length} perm.${adm ? ' · ADM' : ''} · ${r.alcance}`,
    };
  }),
);

const etiquetaGuardar = computed(() => {
  if (guardado.value) return 'Guardado · aplicado a todos los condominios';
  return pendiente.value ? 'Guardar plantillas' : 'Sin cambios';
});

function nuevoRol(): void {
  rolesNuevos.value += 1;
  roles.value.push({
    nombre: `Nuevo rol ${rolesNuevos.value}`,
    tipo: 'adi',
    alcance: 'Sin publicar',
  });
  valores.value.forEach((fila) => fila.push(false));
  pendiente.value = true;
  guardado.value = false;
}

function guardar(): void {
  if (!pendiente.value) return;
  pendiente.value = false;
  guardado.value = true;
}
</script>

<style scoped>
.roles {
  padding: 24px 32px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  box-sizing: border-box;
}

@media (min-width: 1024px) {
  /* Como en el mockup: la matriz se desplaza dentro de la pantalla con la cabecera fija. */
  .roles {
    height: 100vh;
  }
}

.roles__boton {
  height: 42px;
  padding: 0 16px;
  border-radius: 10px;
  border: none;
  font-size: 14px;
  font-weight: 700;
  font-family: inherit;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
}

.roles__boton--nuevo {
  padding: 0 14px;
  border: 1px solid var(--q-primary);
  background: #ffffff;
  color: var(--q-primary);
}

.roles__boton--guardar {
  background: var(--q-primary);
  color: #ffffff;
}

.roles__boton--apagado {
  background: var(--safic-borde);
  color: var(--safic-texto-tenue);
}

.roles__info {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #e6ecf7;
  color: #23407a;
  border-radius: 12px;
  padding: 10px 14px;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.45;
}

.roles__info .q-icon {
  flex-shrink: 0;
}

.roles__filtros {
  display: flex;
  align-items: center;
  gap: 8px 16px;
  flex-wrap: wrap;
}

.roles__pildoras {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  flex-grow: 1;
}

.roles__leyendas {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.roles__leyenda {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--safic-texto-suave);
  font-weight: 600;
}

.adm {
  padding: 2px 7px;
  border-radius: 6px;
  background: #fff1dc;
  color: #8a3f0a;
  font-size: 10px;
  font-weight: 800;
}

.adm--chico {
  padding: 1px 6px;
  border-radius: 5px;
  font-size: 9px;
}

/* ---------- Matriz ---------- */

.matriz {
  flex-grow: 1;
  background: #ffffff;
  border: 1px solid var(--safic-borde);
  border-radius: 14px;
  overflow: auto;
  min-height: 0;
}

.matriz__fila {
  display: grid;
  align-items: center;
}

.matriz__cabecera {
  align-items: stretch;
  position: sticky;
  top: 0;
  z-index: 1;
  background: var(--safic-fondo-2);
  border-bottom: 1px solid var(--safic-borde);
}

.matriz__titulo-permiso {
  padding: 10px 14px;
  font-size: 11px;
  font-weight: 700;
  color: var(--safic-texto-suave);
  letter-spacing: 0.3px;
  align-self: end;
  position: sticky;
  left: 0;
  background: var(--safic-fondo-2);
}

.matriz__rol {
  padding: 8px 4px;
  text-align: center;
  min-width: 0;
}

.matriz__rol-nombre {
  font-size: 12px;
  font-weight: 800;
  overflow: hidden;
  text-overflow: ellipsis;
}

.matriz__rol-conteo {
  font-size: 10px;
  color: var(--safic-texto-suave);
  margin-top: 2px;
}

.tipo {
  display: inline-block;
  margin-top: 3px;
  padding: 1px 7px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 700;
}

.tipo--sis {
  background: #f1efe8;
  color: #3d3a33;
}

.tipo--car {
  background: #e6ecf7;
  color: #23407a;
}

.tipo--adi {
  background: #e3efec;
  color: #0b4a47;
}

.matriz__grupo {
  height: 32px;
  background: #f2f7f6;
  border-top: 1px solid var(--safic-borde);
}

.matriz__grupo-nombre {
  padding: 0 14px;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.8px;
  color: var(--q-primary);
}

.matriz__permiso {
  height: 44px;
  border-top: 1px solid var(--safic-linea-2);
}

.matriz__permiso:hover {
  background: var(--safic-fondo-2);
}

.matriz__permiso-textos {
  padding: 0 14px;
  min-width: 0;
}

.matriz__permiso-etiqueta {
  font-size: 13px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 6px;
}

.matriz__permiso-clave {
  font-size: 11px;
  color: #8a857a;
  font-family: ui-monospace, Menlo, monospace;
}

.matriz__celda {
  display: flex;
  justify-content: center;
}

.casilla {
  width: 26px;
  height: 26px;
  border-radius: 7px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 1.5px solid #b9b3a5;
  background: #ffffff;
  cursor: pointer;
  color: #ffffff;
}

.casilla--on {
  border: 1px solid var(--q-primary);
  background: var(--q-primary);
}

.casilla:focus-visible {
  outline: 2px solid var(--q-primary);
  outline-offset: 2px;
}

.casilla--bloqueada {
  border: 1px dashed var(--safic-borde-2);
  background: var(--safic-fondo-2);
  cursor: not-allowed;
  color: #b9b3a5;
}

@media (max-width: 599px) {
  .roles {
    padding: 20px 16px;
  }
}
</style>
