<template>
  <q-page class="menu">
    <PaginaEncabezado miga="Plataforma / Acceso / Menú del sistema" titulo="Menú del sistema">
      <template #acciones>
        <button type="button" class="menu__boton" :disabled="ocupado" @click="nuevo(true)">
          Nuevo grupo
        </button>
        <button
          type="button"
          class="menu__boton menu__boton--primario-borde"
          :disabled="ocupado"
          @click="nuevo(false)"
        >
          Nueva pantalla
        </button>
      </template>
    </PaginaEncabezado>

    <div class="menu__aviso">
      Los cambios rigen al instante para todos los condominios. Los ítems no se borran: se
      desactivan.
    </div>

    <div class="safic-pestanas" role="tablist" aria-label="Menú a editar">
      <button
        v-for="a in AMBITOS_MENU"
        :key="a.valor"
        type="button"
        role="tab"
        class="safic-pestana"
        :class="{ 'safic-pestana--activa': a.valor === ambito }"
        :aria-selected="a.valor === ambito"
        :disabled="ocupado"
        @click="cambiarAmbito(a.valor)"
      >
        {{ a.etiqueta }}
      </button>
    </div>

    <div class="menu__cuerpo">
      <!-- Árbol del menú -->
      <section class="arbol" aria-label="Ítems del menú">
        <div class="arbol__desplazable">
          <div class="arbol__fila arbol__cabecera">
            <div>ÍTEM</div>
            <div>PERMISO · PERFILES</div>
            <div>ACTIVO</div>
            <div class="text-right">ORDEN</div>
          </div>

          <div v-if="consulta.isPending.value" class="arbol__estado" aria-busy="true">
            <q-skeleton v-for="i in 6" :key="i" type="rect" height="36px" class="q-mb-sm" />
          </div>
          <div v-else-if="consulta.isError.value" class="arbol__estado safic-alerta" role="alert">
            {{ consulta.error.value?.mensaje }}
            <q-btn flat no-caps dense label="Reintentar" @click="consulta.refetch()" />
          </div>
          <template v-else>
            <div v-if="!items.length" class="arbol__vacio">
              Este menú está vacío. Agrega un grupo o una pantalla.
            </div>
            <div
              v-for="x in items"
              :key="x.id"
              class="arbol__fila arbol__registro"
              :class="{
                'arbol__registro--activo': x.id === seleccion,
                'arbol__registro--grupo': x.es_grupo,
                'arbol__registro--inactivo': !x.activo,
              }"
            >
              <button
                type="button"
                class="arbol__item"
                :aria-pressed="x.id === seleccion"
                @click="seleccionar(x)"
              >
                <span v-if="x.padre_id !== null" class="arbol__sangria" />
                <q-icon :name="x.icono" size="20px" class="arbol__icono" />
                <span class="arbol__etiqueta">{{ x.etiqueta }}</span>
              </button>
              <div class="arbol__permiso">
                {{ x.es_grupo ? 'Grupo' : x.permiso || 'Sin permiso' }}<br />{{
                  x.es_grupo ? 'Se muestra si hay hijos' : textoPerfiles(x.roles)
                }}
              </div>
              <div>
                <MenuSistemaInterruptor
                  :model-value="x.activo"
                  :etiqueta="`Activo: ${x.etiqueta}`"
                  :disabled="ocupado"
                  @update:model-value="alternarActivo(x)"
                />
              </div>
              <div class="arbol__orden">
                <button
                  type="button"
                  class="arbol__flecha"
                  :aria-label="`Subir ${x.etiqueta}`"
                  :disabled="ocupado || !puedeMover(items, x, 'arriba')"
                  @click="mover(x, 'arriba')"
                >
                  <q-icon name="sym_r_arrow_upward" size="18px" />
                </button>
                <button
                  type="button"
                  class="arbol__flecha"
                  :aria-label="`Bajar ${x.etiqueta}`"
                  :disabled="ocupado || !puedeMover(items, x, 'abajo')"
                  @click="mover(x, 'abajo')"
                >
                  <q-icon name="sym_r_arrow_downward" size="18px" />
                </button>
              </div>
            </div>
          </template>
        </div>
      </section>

      <!-- Editor del ítem seleccionado -->
      <aside class="editor" aria-label="Editar ítem">
        <div v-if="errorGeneral" class="safic-alerta" role="alert">{{ errorGeneral }}</div>
        <template v-if="borrador">
          <div class="editor__tipo">{{ tipoEditor }}</div>
          <label class="editor__campo">
            Etiqueta
            <input v-model="borrador.etiqueta" class="editor__control" maxlength="60" />
            <span v-if="errores.etiqueta" class="editor__error">{{ errores.etiqueta }}</span>
          </label>
          <div id="menu-iconos-etiqueta" class="editor__campo">Ícono</div>
          <div class="editor__iconos" role="radiogroup" aria-labelledby="menu-iconos-etiqueta">
            <button
              v-for="n in iconosOfrecidos(borrador.icono)"
              :key="n"
              type="button"
              role="radio"
              class="editor__icono"
              :class="{ 'editor__icono--activo': borrador.icono === n }"
              :aria-checked="borrador.icono === n"
              :aria-label="n.replace('sym_r_', '')"
              @click="borrador.icono = n"
            >
              <q-icon :name="n" size="20px" />
            </button>
          </div>
          <span v-if="errores.icono" class="editor__error">{{ errores.icono }}</span>

          <template v-if="!borrador.esGrupo">
            <label class="editor__campo">
              Pantalla
              <select v-model="borrador.ruta" class="editor__control editor__control--select">
                <option value="" disabled>Elige la pantalla</option>
                <option v-for="r in pantallas" :key="r.ruta" :value="r.ruta">
                  {{ r.ruta }}&nbsp;&nbsp;({{ r.titulo }})
                </option>
              </select>
              <span v-if="errores.ruta" class="editor__error">{{ errores.ruta }}</span>
            </label>
            <label v-if="creando" class="editor__campo">
              Grupo
              <select v-model="borrador.padreId" class="editor__control editor__control--select">
                <option :value="null">Sin grupo (primer nivel)</option>
                <option v-for="g in grupos" :key="g.id" :value="g.id">{{ g.etiqueta }}</option>
              </select>
              <span v-if="errores.padre_id" class="editor__error">{{ errores.padre_id }}</span>
            </label>
            <label class="editor__campo">
              Permiso requerido
              <select v-model="borrador.permiso" class="editor__control editor__control--select">
                <option value="">Ninguno</option>
                <option v-for="p in datos?.permisos ?? []" :key="p.clave" :value="p.clave">
                  {{ p.etiqueta }} ({{ p.clave }})
                </option>
              </select>
              <span v-if="errores.permiso" class="editor__error">{{ errores.permiso }}</span>
            </label>
            <fieldset class="editor__campo">
              <legend class="editor__campo">Perfiles que lo ven</legend>
              <div class="editor__perfiles">
                <q-checkbox
                  v-for="r in datos?.roles ?? []"
                  :key="r.clave"
                  v-model="borrador.roles"
                  :val="r.clave"
                  :label="r.nombre"
                  dense
                />
              </div>
              <span v-if="errores.roles" class="editor__error">{{ errores.roles }}</span>
            </fieldset>
          </template>

          <div class="editor__nota">
            <template v-if="borrador.esGrupo">
              Un grupo solo se muestra si el perfil ve al menos una de sus pantallas.
            </template>
            <template v-else-if="borrador.permiso">
              Ocultar esta pantalla no quita el acceso: la API sigue exigiendo el permiso
              {{ borrador.permiso }}. Sin perfiles asignados, nadie la ve.
            </template>
            <template v-else>
              Sin permiso requerido: la ven los perfiles marcados. Sin perfiles asignados, nadie la
              ve.
            </template>
          </div>

          <div class="editor__acciones">
            <q-btn
              v-if="creando"
              flat
              no-caps
              label="Cancelar"
              :disable="ocupado"
              @click="cancelar"
            />
            <q-btn
              unelevated
              no-caps
              color="primary"
              class="safic-btn"
              :label="creando ? 'Agregar al menú' : 'Guardar cambios'"
              :loading="guardando"
              :disable="ocupado || (!creando && !hayCambios)"
              @click="guardar"
            />
          </div>
        </template>
        <div v-else class="editor__vacio">
          Elige un ítem de la lista para editarlo, o agrega un grupo o una pantalla.
        </div>
      </aside>

      <!-- Vista previa por perfil -->
      <aside class="previa" aria-label="Vista previa del menú">
        <label class="editor__campo">
          Ver como
          <select
            v-model="perfil"
            class="editor__control editor__control--select editor__control--medio"
          >
            <option v-for="r in datos?.roles ?? []" :key="r.clave" :value="r.clave">
              {{ r.nombre }}
            </option>
          </select>
        </label>
        <div class="previa__menu" :aria-busy="vistaPrevia.isFetching.value">
          <div class="previa__titulo">VISTA PREVIA</div>
          <div v-if="vistaPrevia.isError.value" class="safic-alerta" role="alert">
            {{ vistaPrevia.error.value?.mensaje }}
          </div>
          <template v-for="p in vistaPrevia.data.value?.menu ?? []" :key="p.id">
            <template v-if="p.hijos">
              <div class="previa__grupo">{{ p.etiqueta }}</div>
              <div
                v-for="h in p.hijos"
                :key="h.id"
                class="previa__item"
                :class="{ 'previa__item--activo': h.id === claveSeleccionada }"
              >
                <q-icon :name="h.icono" size="18px" />{{ h.etiqueta }}
              </div>
            </template>
            <div
              v-else
              class="previa__item"
              :class="{ 'previa__item--activo': p.id === claveSeleccionada }"
            >
              <q-icon :name="p.icono" size="18px" />{{ p.etiqueta }}
            </div>
          </template>
        </div>
        <div v-if="vistaPrevia.data.value" class="previa__nota">
          {{ vistaPrevia.data.value.ocultos }} pantallas activas no le llegan a este perfil por
          permiso o porque no están asignadas.
        </div>
      </aside>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { useIsMutating } from '@tanstack/vue-query';
import { useQuasar } from 'quasar';
import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

import PaginaEncabezado from '@/components/PaginaEncabezado.vue';
import { aApiError } from '@/core/api/errors';
import MenuSistemaInterruptor from '@/modules/plataforma/components/MenuSistemaInterruptor.vue';

import {
  AMBITOS_MENU,
  borradorDe,
  borradorNuevo,
  cambiosDe,
  nuevoModificado,
  iconosOfrecidos,
  pantallasDisponibles,
  peticionNueva,
  puedeMover,
  validarBorrador,
  type BorradorMenu,
} from '../menu-sistema.logica';
import {
  clavesMenuSistema,
  useCrearMenuItem,
  useEditarMenuItem,
  useMenuSistema,
  useMoverMenuItem,
  useVistaPreviaMenu,
} from '../composables/useMenuSistema';
import type { AmbitoMenu, MenuSistemaItem } from '../services/menu-sistema.service';

type CampoError = 'etiqueta' | 'icono' | 'ruta' | 'padre_id' | 'permiso' | 'roles';
const CAMPOS_API: CampoError[] = ['etiqueta', 'icono', 'ruta', 'padre_id', 'permiso', 'roles'];

const $q = useQuasar();
const router = useRouter();

const ambito = ref<AmbitoMenu>('condominio');
/** Id del ítem en edición; `null` si no hay ninguno o se está creando uno nuevo. */
const seleccion = ref<number | null>(null);
const borrador = ref<BorradorMenu | null>(null);
const errores = ref<Partial<Record<CampoError, string>>>({});
const errorGeneral = ref<string | null>(null);
const perfilElegido = ref('');

const consulta = useMenuSistema(ambito);
const crear = useCrearMenuItem();
const editar = useEditarMenuItem();
const mover_ = useMoverMenuItem();
const enCurso = useIsMutating({ mutationKey: clavesMenuSistema.mutacion });

const datos = computed(() => consulta.data.value);
const items = computed(() => datos.value?.items ?? []);
const grupos = computed(() => items.value.filter((i) => i.es_grupo));
const ocupado = computed(() => enCurso.value > 0);
const guardando = computed(() => crear.isPending.value || editar.isPending.value);
const creando = computed(() => borrador.value !== null && seleccion.value === null);
const itemActual = computed(() => items.value.find((i) => i.id === seleccion.value));

/** El perfil de la vista previa es siempre uno del menú que se está viendo. */
const perfil = computed({
  get: () => {
    const roles = datos.value?.roles ?? [];
    return roles.some((r) => r.clave === perfilElegido.value)
      ? perfilElegido.value
      : (roles[0]?.clave ?? '');
  },
  set: (valor: string) => {
    perfilElegido.value = valor;
  },
});
const vistaPrevia = useVistaPreviaMenu(ambito, perfil);
const claveSeleccionada = computed(() => itemActual.value?.clave ?? '');

const pantallas = computed(() =>
  pantallasDisponibles(
    router.getRoutes().map((r) => {
      const name = typeof r.name === 'string' ? r.name : '';
      return {
        name,
        titulo: typeof r.meta.titulo === 'string' ? r.meta.titulo : '',
        publica: r.meta.publica === true,
        app: r.meta.app !== undefined || name.startsWith('app-'),
        conParametros: r.path.includes(':'),
        previa: r.meta.vistaPrevia === true,
      };
    }),
    ambito.value,
    borrador.value?.ruta ?? '',
  ),
);

const tipoEditor = computed(() => {
  const b = borrador.value;
  if (!b) return '';
  const que = b.esGrupo ? 'grupo' : 'pantalla';
  return creando.value ? `Nuevo ${que} del menú` : `Editar ${que} del menú`;
});

const hayCambios = computed(() => {
  const item = itemActual.value;
  return (
    item !== undefined &&
    borrador.value !== null &&
    Object.keys(cambiosDe(item, borrador.value)).length > 0
  );
});

function textoPerfiles(roles: string[]): string {
  if (roles.length === 0) return 'Sin perfiles (nadie lo ve)';
  const nombres = roles.map((c) => datos.value?.roles.find((r) => r.clave === c)?.nombre ?? c);
  return nombres.join(', ');
}

/** No pisar una edición en curso: pide confirmar antes de cambiar de ítem. */
function sinPerderCambios(accion: () => void): void {
  const sucio =
    (creando.value && borrador.value !== null && nuevoModificado(borrador.value)) ||
    hayCambios.value;
  if (!sucio) {
    accion();
    return;
  }
  $q.dialog({
    title: 'Hay cambios sin guardar',
    message: 'Si sigues, se pierden los cambios del ítem que estás editando.',
    cancel: { label: 'Seguir editando', flat: true, noCaps: true },
    ok: { label: 'Descartar', color: 'negative', noCaps: true },
    persistent: true,
  }).onOk(accion);
}

function limpiarMensajes(): void {
  errores.value = {};
  errorGeneral.value = null;
}

function seleccionar(item: MenuSistemaItem): void {
  if (item.id === seleccion.value) return;
  sinPerderCambios(() => {
    limpiarMensajes();
    seleccion.value = item.id;
    borrador.value = borradorDe(item);
  });
}

function nuevo(esGrupo: boolean): void {
  sinPerderCambios(() => {
    limpiarMensajes();
    seleccion.value = null;
    borrador.value = borradorNuevo(esGrupo);
  });
}

function cancelar(): void {
  limpiarMensajes();
  borrador.value = null;
}

function cambiarAmbito(valor: AmbitoMenu): void {
  if (valor === ambito.value || ocupado.value) return;
  sinPerderCambios(() => {
    limpiarMensajes();
    seleccion.value = null;
    borrador.value = null;
    ambito.value = valor;
  });
}

/** Errores de la API: bajo cada campo, o arriba si no son de un campo. */
function mostrarError(error: unknown): void {
  const e = aApiError(error);
  const porCampo: Partial<Record<CampoError, string>> = {};
  for (const campo of CAMPOS_API) {
    const mensaje = e.campo(campo);
    if (mensaje) porCampo[campo] = mensaje;
  }
  errores.value = porCampo;
  errorGeneral.value = Object.keys(porCampo).length === 0 ? e.mensaje : null;
}

function guardar(): void {
  const b = borrador.value;
  if (!b) return;
  limpiarMensajes();
  const faltas = validarBorrador(b);
  if (Object.keys(faltas).length > 0) {
    errores.value = faltas;
    return;
  }

  const ambitoAlGuardar = ambito.value;
  const alExito = (item: MenuSistemaItem, mensaje: string): void => {
    $q.notify({ type: 'positive', message: mensaje });
    // Si mientras tanto se cambió de menú, no se abre un ítem de otro menú en el editor.
    if (ambito.value !== ambitoAlGuardar) return;
    seleccion.value = item.id;
    borrador.value = borradorDe(item);
  };

  const item = itemActual.value;
  if (creando.value) {
    crear.mutate(peticionNueva(ambito.value, b), {
      onSuccess: (creado) => alExito(creado, 'Ítem agregado al menú.'),
      onError: mostrarError,
    });
    return;
  }

  if (!item) return;
  const cambios = cambiosDe(item, b);
  if (Object.keys(cambios).length === 0) return;
  editar.mutate(
    { id: item.id, cambios },
    { onSuccess: (guardado) => alExito(guardado, 'Cambios guardados.'), onError: mostrarError },
  );
}

function alternarActivo(item: MenuSistemaItem): void {
  const aplicar = (): void => {
    editar.mutate(
      { id: item.id, cambios: { activo: !item.activo } },
      {
        onError: (error) => $q.notify({ type: 'negative', message: aApiError(error).mensaje }),
      },
    );
  };

  if (!item.activo) {
    aplicar();
    return;
  }
  $q.dialog({
    title: `¿Desactivar «${item.etiqueta}»?`,
    message: 'Dejará de aparecer en el menú de todos los condominios al instante.',
    cancel: { label: 'Cancelar', flat: true, noCaps: true },
    ok: { label: 'Desactivar', color: 'negative', noCaps: true },
    persistent: true,
  }).onOk(aplicar);
}

function mover(item: MenuSistemaItem, direccion: 'arriba' | 'abajo'): void {
  mover_.mutate(
    { id: item.id, direccion },
    { onError: (error) => $q.notify({ type: 'negative', message: aApiError(error).mensaje }) },
  );
}

// Si el ítem en edición desaparece del menú (otro super admin, otro ámbito), se cierra el editor.
watch(items, (lista) => {
  if (seleccion.value !== null && !lista.some((i) => i.id === seleccion.value)) {
    seleccion.value = null;
    borrador.value = null;
  }
});
</script>

<style scoped>
.menu {
  padding: 24px 32px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  box-sizing: border-box;
}

@media (min-width: 1280px) {
  .menu {
    height: 100vh;
  }
}

.menu__boton {
  height: 42px;
  padding: 0 14px;
  border-radius: 10px;
  border: 1px solid var(--safic-borde-2);
  background: #ffffff;
  color: var(--safic-texto);
  font-size: 14px;
  font-weight: 700;
  font-family: inherit;
  cursor: pointer;
}

.menu__boton:disabled,
.arbol__flecha:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.menu__boton--primario-borde {
  border-color: var(--q-primary);
  color: var(--q-primary);
}

.menu__boton--publicar {
  padding: 0 16px;
  border: none;
  background: var(--q-primary);
  color: #ffffff;
}

.menu__boton--apagado {
  padding: 0 16px;
  border: none;
  background: var(--safic-borde);
  color: var(--safic-texto-tenue);
}

.menu__cuerpo {
  display: flex;
  gap: 14px;
  flex-grow: 1;
  min-height: 0;
}

/* ---------- Árbol ---------- */

.arbol {
  flex-grow: 1;
  background: #ffffff;
  border: 1px solid var(--safic-borde);
  border-radius: 14px;
  overflow-y: auto;
  min-width: 0;
}

.arbol__desplazable {
  overflow-x: auto;
}

.arbol__fila {
  display: grid;
  grid-template-columns: 1fr 150px 56px 64px;
  gap: 8px;
  align-items: center;
  min-width: 440px;
}

.arbol__cabecera {
  padding: 9px 14px;
  background: var(--safic-fondo-2);
  font-size: 11px;
  font-weight: 700;
  color: var(--safic-texto-suave);
  letter-spacing: 0.3px;
}

.arbol__registro {
  padding: 0 14px;
  height: 44px;
  border-top: 1px solid var(--safic-linea-2);
  background: #ffffff;
}

.arbol__registro--grupo {
  background: #fcfbf8;
}

.arbol__registro--activo {
  background: #f2f7f6;
  box-shadow: inset 3px 0 0 var(--q-primary);
}

.arbol__registro--inactivo {
  opacity: 0.55;
}

.arbol__item {
  display: flex;
  align-items: center;
  gap: 10px;
  border: none;
  background: none;
  padding: 0;
  text-align: left;
  cursor: pointer;
  min-width: 0;
  font-family: inherit;
  color: var(--safic-texto);
  height: 100%;
}

.arbol__item:focus-visible {
  outline: 2px solid var(--q-primary);
  outline-offset: 2px;
  border-radius: 4px;
}

.arbol__sangria {
  width: 18px;
  flex-shrink: 0;
}

.arbol__icono {
  color: var(--q-primary);
  flex-shrink: 0;
}

.arbol__registro--grupo .arbol__icono {
  color: #8a857a;
}

.arbol__etiqueta {
  font-size: 14px;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.arbol__registro--grupo .arbol__etiqueta {
  font-size: 11px;
  letter-spacing: 0.8px;
  font-weight: 800;
  color: var(--safic-texto-suave);
}

.arbol__permiso {
  font-size: 11px;
  color: var(--safic-texto-suave);
  line-height: 1.35;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.arbol__orden {
  display: flex;
  justify-content: flex-end;
  gap: 4px;
}

.arbol__flecha {
  width: 28px;
  height: 28px;
  border-radius: 7px;
  border: 1px solid var(--safic-borde);
  background: #ffffff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--safic-texto-2);
  padding: 0;
}

.arbol__flecha:hover {
  background: var(--safic-fondo-2);
}

/* ---------- Editor ---------- */

.editor {
  width: 340px;
  flex-shrink: 0;
  background: #ffffff;
  border: 1px solid var(--safic-borde);
  border-radius: 14px;
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  box-sizing: border-box;
  overflow-y: auto;
}

.editor__tipo {
  font-size: 12px;
  color: var(--safic-texto-suave);
  font-weight: 700;
}

.editor__campo {
  display: flex;
  flex-direction: column;
  gap: 5px;
  font-size: 12px;
  font-weight: 700;
  color: var(--safic-texto-2);
  min-width: 0;
}

.editor__control {
  height: 38px;
  border: 1px solid var(--safic-borde-campo);
  border-radius: 9px;
  padding: 0 10px;
  font-size: 14px;
  font-family: inherit;
  font-weight: 400;
  color: var(--safic-texto);
  background: #ffffff;
  width: 100%;
  box-sizing: border-box;
  min-width: 0;
}

.editor__control:focus {
  outline: 2px solid color-mix(in srgb, var(--q-primary) 35%, transparent);
  border-color: var(--q-primary);
}

.editor__control--select {
  padding: 0 8px;
  font-size: 13px;
}

.editor__control--chico {
  padding: 0 6px;
  font-size: 12px;
}

.editor__iconos {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 5px;
}

.editor__icono {
  height: 34px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background: #ffffff;
  color: var(--safic-texto-2);
  border: 1px solid var(--safic-borde);
  padding: 0;
}

.editor__icono--activo {
  background: var(--q-primary);
  color: #ffffff;
  border-color: var(--q-primary);
}

.editor__par {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.editor__nota {
  background: #f1efe8;
  border-radius: 10px;
  padding: 9px 11px;
  font-size: 11px;
  color: var(--safic-texto-2);
  line-height: 1.45;
}

/* ---------- Vista previa ---------- */

.previa {
  width: 230px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.previa__menu {
  flex-grow: 1;
  background: var(--safic-tinta);
  border-radius: 14px;
  padding: 14px 10px;
  display: flex;
  flex-direction: column;
  gap: 1px;
  overflow: hidden;
}

.previa__titulo {
  font-size: 11px;
  font-weight: 800;
  color: #f0b35a;
  letter-spacing: 0.8px;
  padding: 0 8px 10px;
}

.previa__grupo {
  padding: 10px 8px 4px;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.8px;
  color: var(--safic-menu-seccion);
}

.previa__item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 7px 8px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  color: var(--safic-menu-texto);
}

.previa__item--activo {
  background: var(--safic-tinta-2);
  color: #ffffff;
}

.previa__nota {
  font-size: 11px;
  color: var(--safic-texto-suave);
  line-height: 1.4;
}

/* ---------- Estados y avisos ---------- */

.menu__aviso {
  font-size: 12px;
  color: var(--safic-texto-suave);
}

.arbol__estado {
  padding: 14px;
}

.arbol__vacio {
  padding: 28px 14px;
  text-align: center;
  font-size: 13px;
  color: var(--safic-texto-suave);
}

.editor__error {
  font-size: 12px;
  font-weight: 600;
  color: var(--safic-error, #b3261e);
}

.editor__perfiles {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.editor__acciones {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.editor__vacio {
  font-size: 13px;
  color: var(--safic-texto-suave);
  line-height: 1.5;
}

@media (max-width: 1279px) {
  .menu__cuerpo {
    flex-wrap: wrap;
  }

  .arbol {
    flex-basis: 100%;
  }

  .editor,
  .previa {
    flex: 1 1 280px;
  }

  .previa__menu {
    flex-grow: 0;
  }
}

@media (max-width: 1023px) {
  .menu__cuerpo {
    flex-direction: column;
  }

  .editor,
  .previa {
    width: 100%;
    flex-basis: auto;
  }
}

@media (max-width: 599px) {
  .menu {
    padding: 20px 16px;
  }
}
</style>
