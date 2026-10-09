<template>
  <q-page class="roles">
    <PaginaEncabezado miga="Plataforma / Acceso / Roles y permisos" titulo="Roles y permisos">
      <template #acciones>
        <button
          type="button"
          class="roles__boton roles__boton--nuevo"
          :disabled="ocupado"
          @click="abrirNuevo"
        >
          <q-icon name="sym_r_add" size="18px" />Nuevo rol
        </button>
        <button
          type="button"
          class="roles__boton"
          :class="pendiente ? 'roles__boton--guardar' : 'roles__boton--apagado'"
          :disabled="!pendiente || ocupado"
          @click="confirmarGuardar"
        >
          {{ etiquetaGuardar }}
        </button>
      </template>
    </PaginaEncabezado>

    <div class="roles__info">
      <q-icon name="sym_r_info" size="20px" />
      <span>
        Solo la plataforma crea y edita roles. Los condominios solo los asignan a sus usuarios; si
        necesitan uno nuevo, lo solicitan
        <template v-if="solicitudes.length">
          ({{ solicitudes.length }}
          {{ solicitudes.length === 1 ? 'solicitud pendiente' : 'solicitudes pendientes' }}
          <button type="button" class="roles__enlace" @click="verSolicitudes = true">ver</button>).
        </template>
        <template v-else>(sin solicitudes pendientes).</template>
        Los permisos vienen del código: aquí solo se combinan. Los cambios rigen en todos los
        condominios al instante.
      </span>
    </div>

    <div v-if="errorGeneral" class="safic-alerta" role="alert">{{ errorGeneral }}</div>

    <div v-if="consulta.isPending.value" class="roles__estado" aria-busy="true">
      <q-skeleton v-for="i in 6" :key="i" type="rect" height="40px" class="q-mb-sm" />
    </div>
    <div
      v-else-if="consulta.isError.value && !consulta.data.value"
      class="safic-alerta"
      role="alert"
    >
      {{ consulta.error.value?.mensaje }}
      <q-btn flat no-caps dense label="Reintentar" @click="consulta.refetch()" />
    </div>
    <template v-else>
      <div v-if="consulta.isError.value" class="safic-alerta" role="alert">
        No se pudo actualizar la matriz: {{ consulta.error.value?.mensaje }} Guarda cuando se
        actualice.
        <q-btn flat no-caps dense label="Reintentar" @click="consulta.refetch()" />
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
            <q-icon name="sym_r_lock" size="16px" />fijo por el código para ese rol
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
          <div v-for="c in cabeceras" :key="c.clave" class="matriz__rol" role="columnheader">
            <div class="matriz__rol-nombre" :title="c.nombre">{{ c.nombre }}</div>
            <div class="tipo" :class="`tipo--${c.clase}`">{{ c.tipoTexto }}</div>
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
            v-for="p in g.permisos"
            :key="p.clave"
            class="matriz__fila matriz__permiso"
            role="row"
            :style="{ gridTemplateColumns: columnas, minWidth }"
          >
            <div class="matriz__permiso-textos" role="rowheader">
              <div class="matriz__permiso-etiqueta">
                {{ p.etiqueta }}
                <span v-if="p.administrativo" class="adm adm--chico">ADM</span>
              </div>
              <div class="matriz__permiso-clave">{{ p.clave }}</div>
            </div>
            <div v-for="rol in roles" :key="rol.clave" class="matriz__celda" role="cell">
              <button
                v-if="rol.bloqueos[p.clave]"
                type="button"
                class="casilla casilla--bloqueada"
                aria-disabled="true"
                :aria-label="`${p.etiqueta} · ${rol.nombre}: ${rol.bloqueos[p.clave]}`"
              >
                <q-icon name="sym_r_lock" size="16px" />
                <q-tooltip>{{ rol.bloqueos[p.clave] }}</q-tooltip>
              </button>
              <button
                v-else
                type="button"
                role="checkbox"
                class="casilla"
                :class="{
                  'casilla--on': concedido(rol, p.clave, borradores),
                  'casilla--fija': fijo(rol, p.clave) !== '',
                }"
                :aria-checked="concedido(rol, p.clave, borradores)"
                :aria-disabled="ocupado || fijo(rol, p.clave) !== ''"
                :aria-label="`${p.etiqueta} · ${rol.nombre}`"
                @click="alternar(rol, p.clave)"
              >
                <q-icon v-if="concedido(rol, p.clave, borradores)" name="sym_r_check" size="18px" />
                <q-tooltip v-if="fijo(rol, p.clave)">{{ fijo(rol, p.clave) }}</q-tooltip>
              </button>
            </div>
          </div>
        </template>
      </div>
    </template>

    <q-dialog v-model="nuevoAbierto" persistent>
      <q-card class="roles__dialogo">
        <q-card-section>
          <div class="text-h6">Nuevo rol</div>
          <p class="q-mt-sm q-mb-none">
            Se crea sin permisos. Después marca en la matriz lo que podrá hacer.
          </p>
        </q-card-section>
        <q-card-section class="q-pt-none">
          <q-input
            v-model="nombreNuevo"
            outlined
            dense
            autofocus
            maxlength="60"
            label="Nombre del rol"
            :error="errorNuevo !== ''"
            :error-message="errorNuevo"
            @keyup.enter="crearRol"
          />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn
            flat
            no-caps
            label="Cancelar"
            :disable="crear.isPending.value"
            @click="cerrarNuevo"
          />
          <q-btn
            unelevated
            no-caps
            color="primary"
            label="Crear rol"
            :loading="crear.isPending.value"
            @click="crearRol"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="verSolicitudes">
      <q-card class="roles__dialogo">
        <q-card-section>
          <div class="text-h6">Solicitudes de rol pendientes</div>
        </q-card-section>
        <q-card-section class="q-pt-none">
          <ul class="roles__lista">
            <li v-for="s in solicitudes" :key="`${s.condominio_id}-${s.id}`" class="roles__item">
              <strong>{{ s.nombre }}</strong> · {{ s.condominio }}<br />
              {{ s.descripcion }}
            </li>
          </ul>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn v-close-popup flat no-caps label="Cerrar" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { useIsMutating } from '@tanstack/vue-query';
import { useQuasar } from 'quasar';
import { computed, ref, watch } from 'vue';
import { onBeforeRouteLeave } from 'vue-router';

import PaginaEncabezado from '@/components/PaginaEncabezado.vue';
import { aApiError } from '@/core/api/errors';

import {
  clavesRolesAdmin,
  useCrearRol,
  useGuardarPermisosRol,
  useRolesAdmin,
} from '../composables/useRolesAdmin';
import {
  alternarPermiso,
  concedido,
  errorNombreRol,
  gruposDePermisos,
  permisosFinales,
  sinBorradoresResueltos,
  motivoFijo,
  resumenRol,
  rolesModificados,
  textoAlcance,
  TIPO_CLASE,
  TIPO_TEXTO,
  type Borradores,
} from '../roles-permisos.logica';
import type { RolAdmin } from '../services/roles-admin.service';

const $q = useQuasar();

const consulta = useRolesAdmin();
const crear = useCrearRol();
const guardarPermisos = useGuardarPermisosRol();
const enCurso = useIsMutating({ mutationKey: clavesRolesAdmin.mutacion });

const borradores = ref<Borradores>({});
const modulo = ref('todos');
const errorGeneral = ref<string | null>(null);
const guardado = ref(false);
const guardando = ref(false);

const nuevoAbierto = ref(false);
const nombreNuevo = ref('');
const errorNuevo = ref('');
const verSolicitudes = ref(false);

const roles = computed(() => consulta.data.value?.roles ?? []);
const permisos = computed(() => consulta.data.value?.permisos ?? []);
const solicitudes = computed(() => consulta.data.value?.solicitudes ?? []);
const ocupado = computed(() => enCurso.value > 0 || guardando.value || consulta.isError.value);
const modificados = computed(() => rolesModificados(roles.value, borradores.value));
const pendiente = computed(() => modificados.value.length > 0);

// Si el servidor ya tiene lo mismo que un borrador (otro admin, un refetch), el borrador sobra.
watch(roles, (lista) => {
  borradores.value = sinBorradoresResueltos(lista, borradores.value);
});

const modulos = computed(() => ['todos', ...new Set(permisos.value.map((p) => p.grupo))]);
const grupos = computed(() => gruposDePermisos(permisos.value, modulo.value));

const columnas = computed(() => `300px repeat(${roles.value.length}, minmax(0, 1fr))`);
const minWidth = computed(() => `${300 + roles.value.length * 72}px`);

/** Conteo por columna sobre todos los permisos (no solo los filtrados), como en el mockup. */
const cabeceras = computed(() =>
  roles.value.map((r) => {
    const { total, administrativo } = resumenRol(r, permisos.value, borradores.value);
    return {
      clave: r.clave,
      nombre: r.nombre,
      clase: TIPO_CLASE[r.tipo],
      tipoTexto: TIPO_TEXTO[r.tipo],
      resumen: `${total} perm.${administrativo ? ' · ADM' : ''} · ${textoAlcance(r)}`,
    };
  }),
);

const etiquetaGuardar = computed(() => {
  if (guardando.value) return 'Guardando…';
  if (guardado.value && !pendiente.value) return 'Guardado · aplicado a todos los condominios';
  return pendiente.value ? `Guardar cambios (${modificados.value.length})` : 'Sin cambios';
});

function fijo(rol: RolAdmin, permiso: string): string {
  return motivoFijo(rol, permiso, borradores.value);
}

function alternar(rol: RolAdmin, permiso: string): void {
  if (ocupado.value) return;
  errorGeneral.value = null;
  borradores.value = alternarPermiso(rol, permiso, borradores.value);
  guardado.value = false;
}

function confirmarGuardar(): void {
  if (!pendiente.value || ocupado.value) return;
  const nombres = modificados.value.map((r) => r.nombre).join(', ');
  $q.dialog({
    title: 'Guardar permisos',
    message: `Cambiarás los permisos de ${nombres}. Rigen en todos los condominios al instante.`,
    cancel: { label: 'Cancelar', flat: true, noCaps: true },
    ok: { label: 'Guardar', color: 'primary', noCaps: true },
    persistent: true,
  }).onOk(() => void guardar());
}

/** Uno por uno: si alguno falla, los ya guardados se quitan del borrador y el resto sigue pendiente. */
async function guardar(): Promise<void> {
  errorGeneral.value = null;
  guardando.value = true;
  try {
    for (const rol of modificados.value) {
      const borrador = borradores.value[rol.clave];
      if (!borrador) continue;
      try {
        await guardarPermisos.mutateAsync({
          clave: rol.clave,
          permisos: permisosFinales(rol, borrador),
        });
      } catch (error) {
        errorGeneral.value = `${rol.nombre}: ${aApiError(error).mensaje}`;
        return;
      }
      const { [rol.clave]: _guardado, ...resto } = borradores.value;
      void _guardado;
      borradores.value = resto;
    }
    guardado.value = true;
    $q.notify({ type: 'positive', message: 'Permisos guardados.' });
  } finally {
    guardando.value = false;
  }
}

function abrirNuevo(): void {
  nombreNuevo.value = '';
  errorNuevo.value = '';
  nuevoAbierto.value = true;
}

function cerrarNuevo(): void {
  nuevoAbierto.value = false;
}

function crearRol(): void {
  const invalido = errorNombreRol(nombreNuevo.value);
  if (invalido) {
    errorNuevo.value = invalido;
    return;
  }
  errorNuevo.value = '';
  crear.mutate(nombreNuevo.value.trim(), {
    onSuccess: () => {
      nuevoAbierto.value = false;
      $q.notify({ type: 'positive', message: 'Rol creado. Marca sus permisos en la matriz.' });
    },
    onError: (error) => {
      const e = aApiError(error);
      errorNuevo.value = e.campo('nombre') ?? e.mensaje;
    },
  });
}

// No perder cambios sin guardar al salir de la pantalla.
onBeforeRouteLeave(
  () =>
    !pendiente.value ||
    new Promise<boolean>((resolver) => {
      $q.dialog({
        title: 'Hay cambios sin guardar',
        message: 'Si sales, se pierden los cambios de permisos.',
        cancel: { label: 'Seguir aquí', flat: true, noCaps: true },
        ok: { label: 'Salir', color: 'negative', noCaps: true },
        persistent: true,
      })
        .onOk(() => resolver(true))
        .onCancel(() => resolver(false));
    }),
);
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

.roles__estado {
  padding: 14px;
}

.roles__error {
  font-size: 12px;
  font-weight: 600;
  color: var(--safic-error, #b3261e);
}

.roles__lista {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.roles__item {
  font-size: 13px;
  line-height: 1.4;
}

.roles__enlace {
  border: none;
  background: none;
  padding: 0;
  font: inherit;
  font-weight: 800;
  color: inherit;
  text-decoration: underline;
  cursor: pointer;
}

.roles__dialogo {
  width: 440px;
  max-width: 92vw;
}

.casilla--fija {
  cursor: not-allowed;
}

.roles__boton:disabled {
  opacity: 0.55;
  cursor: not-allowed;
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
