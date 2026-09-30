<template>
  <q-page class="menu">
    <PaginaEncabezado miga="Plataforma / Acceso / Menú del sistema" titulo="Menú del sistema">
      <template #acciones>
        <button type="button" class="menu__boton" @click="agregar('g')">Nuevo grupo</button>
        <button type="button" class="menu__boton menu__boton--primario-borde" @click="agregar('i')">
          Nuevo ítem
        </button>
        <button
          type="button"
          class="menu__boton"
          :class="pendiente ? 'menu__boton--publicar' : 'menu__boton--apagado'"
          :aria-disabled="!pendiente"
          @click="publicar"
        >
          {{ publicado ? 'Publicado' : pendiente ? 'Publicar cambios' : 'Sin cambios' }}
        </button>
      </template>
    </PaginaEncabezado>

    <div class="safic-pestanas" role="tablist" aria-label="Menú a editar">
      <button
        v-for="a in AMBITOS_MENU"
        :key="a.valor"
        type="button"
        role="tab"
        class="safic-pestana"
        :class="{ 'safic-pestana--activa': a.valor === ambito }"
        :aria-selected="a.valor === ambito"
        @click="ambito = a.valor"
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
            <div>PERMISO · MÓDULO</div>
            <div>ACTIVO</div>
            <div class="text-right">ORDEN</div>
          </div>
          <div
            v-for="(x, idx) in items"
            :key="x.clave"
            class="arbol__fila arbol__registro"
            :class="{
              'arbol__registro--activo': idx === seleccion,
              'arbol__registro--grupo': x.tipo === 'g',
              'arbol__registro--inactivo': !x.activo,
            }"
          >
            <button
              type="button"
              class="arbol__item"
              :aria-pressed="idx === seleccion"
              @click="seleccion = idx"
            >
              <span v-if="x.grupo" class="arbol__sangria" />
              <q-icon :name="`sym_r_${x.icono}`" size="20px" class="arbol__icono" />
              <span class="arbol__etiqueta">{{ x.etiqueta }}</span>
            </button>
            <div class="arbol__permiso">
              {{ x.tipo === 'g' ? 'Grupo' : x.permiso || 'Sin permiso' }}<br />{{
                x.tipo === 'g' ? (x.modulo ? `Módulo ${x.modulo}` : 'Siempre') : x.modulo || '—'
              }}
            </div>
            <div>
              <MenuSistemaInterruptor
                :model-value="x.activo"
                :etiqueta="`Activo: ${x.etiqueta}`"
                @update:model-value="alternarActivo(idx)"
              />
            </div>
            <div class="arbol__orden">
              <button
                type="button"
                class="arbol__flecha"
                :aria-label="`Subir ${x.etiqueta}`"
                @click="mover(idx, -1)"
              >
                <q-icon name="sym_r_arrow_upward" size="18px" />
              </button>
              <button
                type="button"
                class="arbol__flecha"
                :aria-label="`Bajar ${x.etiqueta}`"
                @click="mover(idx, 1)"
              >
                <q-icon name="sym_r_arrow_downward" size="18px" />
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- Editor del ítem seleccionado -->
      <aside v-if="actual" class="editor" aria-label="Editar ítem">
        <div class="editor__tipo">{{ tipoEditor }}</div>
        <label class="editor__campo">
          Etiqueta
          <input v-model="actual.etiqueta" class="editor__control" @input="marcar" />
        </label>
        <div id="menu-iconos-etiqueta" class="editor__campo">Ícono</div>
        <div class="editor__iconos" role="radiogroup" aria-labelledby="menu-iconos-etiqueta">
          <button
            v-for="n in ICONOS_MENU"
            :key="n"
            type="button"
            role="radio"
            class="editor__icono"
            :class="{ 'editor__icono--activo': actual.icono === n }"
            :aria-checked="actual.icono === n"
            :aria-label="n"
            @click="elegirIcono(n)"
          >
            <q-icon :name="`sym_r_${n}`" size="20px" />
          </button>
        </div>
        <template v-if="actual.tipo === 'i'">
          <label class="editor__campo">
            Pantalla (del manifiesto de rutas)
            <select
              v-model="actual.ruta"
              class="editor__control editor__control--select"
              @change="marcar"
            >
              <option v-for="r in rutas" :key="r.ruta" :value="r.ruta">
                {{ r.ruta }}&nbsp;&nbsp;({{ r.etiqueta }})
              </option>
            </select>
          </label>
          <div class="editor__par">
            <label class="editor__campo">
              Permiso requerido
              <select
                v-model="actual.permiso"
                class="editor__control editor__control--select editor__control--chico"
                @change="marcar"
              >
                <option value="">Ninguno</option>
                <option v-for="p in permisos" :key="p" :value="p">{{ p }}</option>
              </select>
            </label>
            <label class="editor__campo">
              Módulo requerido
              <select
                v-model="actual.modulo"
                class="editor__control editor__control--select editor__control--chico"
                @change="marcar"
              >
                <option value="">Ninguno</option>
                <option v-for="m in modulos" :key="m" :value="m">{{ m }}</option>
              </select>
            </label>
          </div>
        </template>
        <div class="editor__nota">
          <template v-if="actual.tipo === 'g'">
            Un grupo solo se muestra si el usuario ve al menos uno de sus ítems.
          </template>
          <template v-else-if="actual.permiso">
            Ocultar este ítem no quita el acceso: la API sigue exigiendo el permiso
            {{ actual.permiso }}. El ícono es obligatorio.
          </template>
          <template v-else>
            Sin permiso requerido: lo ve todo usuario del ámbito. El ícono es obligatorio.
          </template>
        </div>
      </aside>

      <!-- Vista previa por rol -->
      <aside class="previa" aria-label="Vista previa del menú">
        <label class="editor__campo">
          Ver como
          <select
            v-model="rol"
            class="editor__control editor__control--select editor__control--medio"
          >
            <option v-for="r in ROLES_VISTA_PREVIA" :key="r.valor" :value="r.valor">
              {{ r.etiqueta }}
            </option>
          </select>
        </label>
        <div class="previa__menu">
          <div class="previa__titulo">VISTA PREVIA</div>
          <template v-for="p in vistaPrevia" :key="p.clave">
            <div v-if="p.grupo" class="previa__grupo">{{ p.etiqueta }}</div>
            <div v-else class="previa__item" :class="{ 'previa__item--activo': p.activo }">
              <q-icon :name="`sym_r_${p.icono}`" size="18px" />{{ p.etiqueta }}
            </div>
          </template>
        </div>
        <div class="previa__nota">
          {{ ocultos }} ítems ocultos para este rol por permiso, módulo del plan o porque están
          inactivos.
        </div>
      </aside>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';

import PaginaEncabezado from '@/components/PaginaEncabezado.vue';
import MenuSistemaInterruptor from '@/modules/plataforma/components/MenuSistemaInterruptor.vue';
import {
  AMBITOS_MENU,
  ICONOS_MENU,
  MENU_SISTEMA,
  ROLES_VISTA_PREVIA,
  SELECCION_INICIAL,
} from '@/modules/plataforma/demo/menu-sistema';
import type { AmbitoMenu, ItemMenuSistema } from '@/modules/plataforma/demo/menu-sistema';

const menus = ref<Record<AmbitoMenu, ItemMenuSistema[]>>({
  cond: MENU_SISTEMA.cond.map((x) => ({ ...x })),
  plat: MENU_SISTEMA.plat.map((x) => ({ ...x })),
  res: MENU_SISTEMA.res.map((x) => ({ ...x })),
});
const ambito = ref<AmbitoMenu>('cond');
const seleccion = ref(SELECCION_INICIAL.cond);
const rol = ref('admin');
const pendiente = ref(false);
const publicado = ref(false);
let nuevos = 0;

watch(ambito, (a) => {
  seleccion.value = SELECCION_INICIAL[a];
});

const items = computed(() => menus.value[ambito.value]);
const actual = computed(() => items.value[seleccion.value]);

const tipoEditor = computed(() => {
  const x = actual.value;
  if (!x) return '';
  if (x.tipo === 'g') return `Grupo del menú${x.sistema ? ' · de sistema' : ''}`;
  return `Ítem del menú${x.sistema ? ' · de sistema (se edita, no se borra)' : ''}`;
});

/** Manifiesto de rutas, permisos y módulos conocidos (de todos los menús). */
const todos = computed(() => Object.values(menus.value).flat());
const rutas = computed(() => {
  const vistas = new Map<string, string>();
  todos.value.forEach((x) => {
    if (x.tipo === 'i' && x.ruta && !vistas.has(x.ruta)) vistas.set(x.ruta, x.etiqueta);
  });
  return [...vistas].map(([ruta, etiqueta]) => ({ ruta, etiqueta }));
});
const permisos = computed(() =>
  [...new Set(todos.value.map((x) => x.permiso ?? '').filter(Boolean))].sort(),
);
const modulos = computed(() =>
  [...new Set(todos.value.map((x) => x.modulo).filter(Boolean))].sort(),
);

function marcar(): void {
  pendiente.value = true;
  publicado.value = false;
}

function alternarActivo(idx: number): void {
  const x = items.value[idx];
  if (!x) return;
  x.activo = !x.activo;
  marcar();
}

function elegirIcono(nombre: string): void {
  if (!actual.value) return;
  actual.value.icono = nombre;
  marcar();
}

/** Mueve un ítem dentro de su mismo grupo; los grupos no se mueven (como el mockup). */
function mover(idx: number, dir: -1 | 1): void {
  const lista = items.value;
  const x = lista[idx];
  if (!x) return;
  let j = idx + dir;
  while (j >= 0 && j < lista.length && (lista[j]?.grupo ?? '') !== (x.grupo ?? '')) j += dir;
  const destino = lista[j];
  if (!destino || x.tipo === 'g' || destino.tipo === 'g') return;
  lista[idx] = destino;
  lista[j] = x;
  seleccion.value = j;
  marcar();
}

function agregar(tipo: 'i' | 'g'): void {
  nuevos += 1;
  const nuevo: ItemMenuSistema =
    tipo === 'g'
      ? {
          clave: `nuevo-g-${nuevos}`,
          tipo: 'g',
          etiqueta: 'NUEVO GRUPO',
          icono: 'dashboard',
          modulo: '',
          activo: true,
          sistema: false,
        }
      : {
          clave: `nuevo-i-${nuevos}`,
          tipo: 'i',
          etiqueta: 'Nuevo ítem',
          icono: 'dashboard',
          ruta: rutas.value[0]?.ruta ?? '',
          permiso: '',
          modulo: '',
          activo: true,
          sistema: false,
        };
  items.value.push(nuevo);
  seleccion.value = items.value.length - 1;
  marcar();
}

function publicar(): void {
  if (!pendiente.value) return;
  pendiente.value = false;
  publicado.value = true;
}

// ---------- Vista previa ----------
const rolPrevia = computed(
  () => ROLES_VISTA_PREVIA.find((r) => r.valor === rol.value) ?? ROLES_VISTA_PREVIA[0]!,
);

function visible(x: ItemMenuSistema): boolean {
  const r = rolPrevia.value;
  if (!x.activo) return false;
  if (x.modulo && !r.modulos.includes(x.modulo)) return false;
  if (x.permiso && r.permisos !== '*' && !r.permisos.includes(x.permiso)) return false;
  return true;
}

const vistaPrevia = computed(() => {
  const lista = items.value;
  const salida: {
    clave: string;
    etiqueta: string;
    icono: string;
    grupo: boolean;
    activo: boolean;
  }[] = [];
  lista.forEach((x, idx) => {
    if (x.tipo === 'g') {
      const hijos = lista.filter((y) => y.grupo === x.clave && visible(y));
      if (x.activo && hijos.length) {
        salida.push({
          clave: x.clave,
          etiqueta: x.etiqueta,
          icono: '',
          grupo: true,
          activo: false,
        });
      }
      return;
    }
    const padre = x.grupo ? lista.find((y) => y.clave === x.grupo) : undefined;
    if (visible(x) && (!x.grupo || padre?.activo)) {
      salida.push({
        clave: x.clave,
        etiqueta: x.etiqueta,
        icono: x.icono,
        grupo: false,
        activo: idx === seleccion.value,
      });
    }
  });
  return salida;
});

const ocultos = computed(() => items.value.filter((x) => x.tipo === 'i' && !visible(x)).length);
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
