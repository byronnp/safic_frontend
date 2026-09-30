<template>
  <q-page class="safic-main roles" :style-fn="alturaPagina">
    <!-- Lista de roles -->
    <section class="roles-lista">
      <div class="roles-lista__encabezado">
        <h1 class="roles-lista__titulo">Roles disponibles</h1>
        <button type="button" class="roles-boton-borde" @click="abrirSolicitud">
          <q-icon name="sym_r_outgoing_mail" size="18px" />Solicitar rol
        </button>
      </div>
      <div class="roles-lista__tarjeta">
        <template v-for="grupo in GRUPOS_ROLES" :key="grupo.titulo">
          <div class="roles-lista__grupo">{{ grupo.titulo }}</div>
          <RolesCondominioItem
            v-for="item in grupo.roles"
            :key="item.clave"
            :rol="item"
            :activo="item.clave === seleccion"
            :administrativo="esAdministrativo(item)"
            @elegir="elegir(item.clave)"
          />
        </template>
      </div>
    </section>

    <!-- Detalle del rol -->
    <section class="roles-detalle">
      <div class="roles-detalle__encabezado">
        <div class="roles-detalle__textos">
          <div class="roles-detalle__tipo">{{ TIPOS[rolActivo.tipo] }}</div>
          <div class="roles-detalle__nombre">{{ rolActivo.nombre }}</div>
        </div>
        <span class="roles-detalle__candado">
          <q-icon name="sym_r_lock" size="16px" />Solo lectura · lo define la plataforma
        </span>
      </div>

      <RolesCondominioSolicitud
        v-if="solicitando"
        @cancelar="solicitando = false"
        @enviar="enviarSolicitud"
      />

      <div class="roles-detalle__aviso" :class="`roles-detalle__aviso--${aviso.tono}`" role="note">
        {{ aviso.texto }}
      </div>

      <RolesCondominioPermisos :rol="rolActivo" class="roles-detalle__permisos" />

      <div class="roles-detalle__pie">
        <span class="roles-detalle__pie-texto">
          {{ rolActivo.usuarios }}
          {{ rolActivo.usuarios === 1 ? 'usuario tiene' : 'usuarios tienen' }} este rol en
          {{ NOMBRE_CONDOMINIO_CORTO }}.
        </span>
        <router-link
          v-if="rolActivo.tipo !== 'cargo'"
          :to="{ name: 'configuracion-usuarios' }"
          class="roles-detalle__asignar"
        >
          Asignar a usuarios
        </router-link>
      </div>
    </section>

    <!-- Menú que verá -->
    <aside class="roles-menu">
      <div class="roles-menu__titulo">MENÚ QUE VERÁ</div>
      <div class="roles-menu__caja">
        <div v-for="m in menu" :key="m.texto" class="roles-menu__item">
          <q-icon :name="`sym_r_${m.icono}`" size="18px" />{{ m.texto }}
        </div>
        <div v-if="menu.length === 0" class="roles-menu__vacio">
          Sin pantallas: marca al menos un permiso.
        </div>
      </div>
      <div class="roles-menu__nota">
        El menú se arma solo con los permisos del rol y los módulos del plan.
      </div>
    </aside>
  </q-page>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import { computed, ref } from 'vue';

import RolesCondominioItem from '../components/RolesCondominioItem.vue';
import RolesCondominioPermisos from '../components/RolesCondominioPermisos.vue';
import RolesCondominioSolicitud from '../components/RolesCondominioSolicitud.vue';
import {
  CUPO_ROLES,
  GRUPOS_ROLES,
  MENU_POR_PERMISO,
  MODULOS_DEL_PLAN,
  NOMBRE_CONDOMINIO_CORTO,
  PERMISOS,
  ROL_INICIAL,
  type RolDemo,
  type TipoRol,
} from '../demo/roles';

const TIPOS: Record<TipoRol, string> = {
  sistema: 'Rol de sistema',
  cargo: 'Cargo de directiva',
  adicional: 'Rol adicional creado por la plataforma',
};

const $q = useQuasar();

const ROLES = GRUPOS_ROLES.flatMap((g) => g.roles);

const seleccion = ref(ROL_INICIAL);
const solicitando = ref(false);
const enviada = ref(false);

const rolActivo = computed<RolDemo>(
  () => ROLES.find((r) => r.clave === seleccion.value) ?? ROLES[0]!,
);

/** En pantallas anchas la página ocupa el alto visible y las listas se desplazan por dentro. */
function alturaPagina(offset: number, alto: number) {
  const disponible = `${alto - offset}px`;
  return $q.screen.gt.sm ? { height: disponible } : { minHeight: disponible };
}

/** Un rol es administrativo si tiene algún permiso administrativo de un módulo del plan. */
function esAdministrativo(r: RolDemo): boolean {
  return PERMISOS.some(
    (p) => p.administrativo && MODULOS_DEL_PLAN.includes(p.modulo) && r.permisos.includes(p.clave),
  );
}

const aviso = computed(() => {
  if (enviada.value) {
    return {
      tono: 'exito',
      texto: 'Solicitud enviada a la plataforma. Te avisaremos cuando el rol esté disponible.',
    };
  }
  if (rolActivo.value.tipo === 'cargo') {
    return {
      tono: 'neutro',
      texto:
        'Cargo de directiva: se asigna desde Usuarios › Directiva. Sus permisos los define la plataforma.',
    };
  }
  if (esAdministrativo(rolActivo.value)) {
    return {
      tono: 'alerta',
      texto: `Rol administrativo: quien lo tenga cuenta para el límite de tu plan (${CUPO_ROLES.usados} de ${CUPO_ROLES.limite} usados). Los roles los define la plataforma; aquí solo los asignas.`,
    };
  }
  return {
    tono: 'info',
    texto:
      'Los roles los define la plataforma; aquí ves qué permite cada uno en tu plan y los asignas a tus usuarios. ¿Necesitas otro? Usa Solicitar rol.',
  };
});

const menu = computed(() =>
  MENU_POR_PERMISO.filter((m) => rolActivo.value.permisos.includes(m.permiso)),
);

function elegir(clave: string) {
  seleccion.value = clave;
  enviada.value = false;
}

function abrirSolicitud() {
  solicitando.value = true;
  enviada.value = false;
}

function enviarSolicitud() {
  solicitando.value = false;
  enviada.value = true;
}
</script>

<style scoped>
.roles {
  flex-direction: row;
  gap: 16px;
  padding-top: 20px;
  padding-bottom: 20px;
}

/* Lista de roles */
.roles-lista {
  width: 300px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 0;
}

.roles-lista__encabezado {
  display: flex;
  align-items: center;
  gap: 8px;
}

.roles-lista__titulo {
  margin: 0;
  font-size: 24px;
  line-height: 1.3;
  font-weight: 800;
  letter-spacing: 0;
  flex-grow: 1;
}

.roles-boton-borde {
  height: 38px;
  padding: 0 12px;
  border-radius: 9px;
  border: 1px solid var(--q-primary);
  background: #ffffff;
  color: var(--q-primary);
  font-size: 13px;
  font-weight: 700;
  font-family: inherit;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.roles-boton-borde:focus-visible,
.roles-detalle__asignar:focus-visible {
  outline: 2px solid var(--q-primary);
  outline-offset: 2px;
}

.roles-lista__tarjeta {
  flex-grow: 1;
  background: var(--safic-superficie);
  border: 1px solid var(--safic-borde);
  border-radius: 14px;
  overflow-y: auto;
  min-height: 0;
}

.roles-lista__grupo {
  padding: 12px 14px 4px 14px;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.8px;
  color: #8a857a;
}

/* Detalle */
.roles-detalle {
  flex-grow: 1;
  background: var(--safic-superficie);
  border: 1px solid var(--safic-borde);
  border-radius: 14px;
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
  min-height: 0;
}

.roles-detalle__encabezado {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.roles-detalle__textos {
  flex-grow: 1;
}

.roles-detalle__tipo {
  font-size: 12px;
  color: var(--safic-texto-suave);
  font-weight: 700;
}

.roles-detalle__nombre {
  font-size: 20px;
  font-weight: 800;
}

.roles-detalle__candado {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  border-radius: 999px;
  background: #f1efe8;
  color: var(--safic-texto-suave);
  font-size: 12px;
  font-weight: 700;
}

.roles-detalle__aviso {
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.45;
}

.roles-detalle__aviso--exito {
  background: #e3efec;
  color: #0b4a47;
}

.roles-detalle__aviso--neutro {
  background: #f1efe8;
  color: #3d3a33;
}

.roles-detalle__aviso--alerta {
  background: #fff7ec;
  color: #7a3808;
}

.roles-detalle__aviso--info {
  background: #e6ecf7;
  color: #23407a;
}

.roles-detalle__permisos {
  flex-grow: 1;
  min-height: 0;
}

.roles-detalle__pie {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}

.roles-detalle__pie-texto {
  flex-grow: 1;
  font-size: 12px;
  color: var(--safic-texto-suave);
}

.roles-detalle__asignar {
  height: 42px;
  padding: 0 16px;
  border-radius: 10px;
  background: var(--q-primary);
  color: #ffffff;
  font-size: 14px;
  font-weight: 700;
  text-decoration: none;
  display: flex;
  align-items: center;
}

/* Menú que verá */
.roles-menu {
  width: 210px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.roles-menu__titulo {
  font-size: 12px;
  font-weight: 800;
  color: var(--safic-texto-suave);
}

.roles-menu__caja {
  flex-grow: 1;
  background: var(--safic-tinta);
  border-radius: 14px;
  padding: 12px 8px;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.roles-menu__item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 7px 8px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  color: var(--safic-menu-texto);
}

.roles-menu__vacio {
  padding: 8px;
  font-size: 12px;
  color: var(--safic-menu-seccion);
}

.roles-menu__nota {
  font-size: 11px;
  color: var(--safic-texto-suave);
  line-height: 1.45;
}

@media (max-width: 1023px) {
  .roles {
    flex-direction: column;
  }

  .roles-lista,
  .roles-menu {
    width: auto;
  }

  .roles-lista__tarjeta {
    max-height: 420px;
  }

  .roles-detalle__permisos {
    max-height: 520px;
  }

  .roles-menu__caja {
    flex-grow: 0;
  }
}
</style>
