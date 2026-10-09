<template>
  <q-page class="safic-main usuarios">
    <section class="usuarios-principal">
      <PaginaEncabezado miga="Configuración / Usuarios y roles" titulo="Usuarios y roles">
        <template #acciones>
          <button type="button" class="usuarios-boton" @click="agregar">Agregar persona</button>
        </template>
      </PaginaEncabezado>

      <div class="safic-pestanas usuarios-vistas" role="tablist">
        <button
          v-for="v in VISTAS"
          :key="v.clave"
          type="button"
          role="tab"
          class="safic-pestana"
          :class="{ 'safic-pestana--activa': v.clave === vista }"
          :aria-selected="v.clave === vista"
          @click="elegirVista(v.clave)"
        >
          {{ v.texto }}
        </button>
      </div>

      <!-- Vista: todos los usuarios -->
      <div v-if="vista === 'usuarios'" class="usuarios-vista">
        <div v-if="usuarios.isPending.value" class="usuarios-vista" aria-busy="true">
          <q-skeleton type="rect" height="64px" class="usuarios-skeleton" />
          <q-skeleton type="rect" height="320px" class="usuarios-skeleton" />
        </div>

        <div v-else-if="usuarios.isError.value" class="safic-alerta" role="alert">
          {{ usuarios.error.value?.mensaje }}
          <q-btn flat no-caps dense label="Reintentar" @click="usuarios.refetch()" />
        </div>

        <template v-else-if="lista">
          <div class="usuarios-cupo">
            <div class="usuarios-cupo__textos">
              <div class="usuarios-cupo__etiqueta">
                Usuarios administrativos<template v-if="lista.cupo.plan">
                  · plan {{ lista.cupo.plan }}</template
                >
              </div>
              <div
                v-if="lista.cupo.limite !== null"
                class="usuarios-cupo__barra"
                role="progressbar"
                aria-label="Cupo de usuarios administrativos usado"
                :aria-valuenow="lista.cupo.usados"
                aria-valuemin="0"
                :aria-valuemax="lista.cupo.limite"
              >
                <div
                  class="usuarios-cupo__relleno"
                  :style="{ width: `${porcentajeCupo(lista.cupo)}%` }"
                />
              </div>
            </div>
            <div class="usuarios-cupo__valor">{{ textoCupo(lista.cupo) }}</div>
          </div>

          <div v-if="haySinCupo(lista.cupo)" class="usuarios-error" role="status">
            <div class="usuarios-error__texto">
              <strong>Tu plan permite {{ lista.cupo.limite }} usuarios administrativos.</strong>
              Desactiva a uno o sube de plan. Presidente, vicepresidente, secretario, guardia,
              mantenimiento y residentes no cuentan.
            </div>
            <router-link :to="{ name: 'configuracion-suscripcion' }" class="usuarios-error__subir">
              Subir de plan
            </router-link>
          </div>

          <div v-if="!lista.usuarios.length" class="usuarios-vacio">
            <q-icon :name="ICONOS.vacio" size="36px" />
            <div>Todavía no hay personas en el equipo.</div>
          </div>

          <div v-else class="usuarios-tabla">
            <div class="usuarios-tabla__desplazable">
              <div class="usuarios-tabla__rejilla usuarios-tabla__cabecera">
                <div>PERSONA</div>
                <div>ROLES</div>
                <div>CUENTA CUPO</div>
                <div>ACCESO HASTA</div>
              </div>
              <button
                v-for="u in lista.usuarios"
                :key="u.id"
                type="button"
                class="usuarios-tabla__rejilla usuarios-tabla__fila"
                :class="{ 'usuarios-tabla__fila--activa': u.id === usuarioSeleccionado?.id }"
                :aria-pressed="u.id === usuarioSeleccionado?.id"
                @click="seleccionadoId = u.id"
              >
                <div>
                  <div class="usuarios-tabla__nombre">
                    {{ u.nombre }}
                    <EstadoBadge v-if="u.estado !== 'activo'" :tono="ESTADOS[u.estado].tono">
                      {{ ESTADOS[u.estado].texto }}
                    </EstadoBadge>
                  </div>
                  <div class="usuarios-tabla__correo">{{ u.email }}</div>
                </div>
                <div class="usuarios-tabla__suave">{{ textoRoles(u.roles) }}</div>
                <div>
                  <EstadoBadge :tono="u.cuenta_cupo ? 'alerta' : 'neutro'">
                    {{ u.cuenta_cupo ? 'Sí' : 'No' }}
                  </EstadoBadge>
                </div>
                <div class="usuarios-tabla__suave">
                  {{ u.acceso_hasta ? formatoFecha(u.acceso_hasta) : '—' }}
                </div>
              </button>
            </div>
          </div>
        </template>
      </div>

      <!-- Vista: directiva -->
      <div v-else class="usuarios-vista">
        <div class="usuarios-directiva__intro">
          Cada cargo lo ocupa <strong>una sola persona</strong> y una persona ocupa
          <strong>un solo cargo</strong>. Para reemplazar a alguien usa <strong>Cambiar</strong>: se
          cierra su periodo y se abre el del nuevo.
        </div>
        <div v-if="mensajeOk" class="usuarios-directiva__ok" role="status">{{ mensajeOk }}</div>

        <div v-if="directiva.isPending.value" class="usuarios-directiva__rejilla" aria-busy="true">
          <q-skeleton
            v-for="i in 4"
            :key="i"
            type="rect"
            height="190px"
            class="usuarios-skeleton"
          />
        </div>
        <div v-else-if="directiva.isError.value" class="safic-alerta" role="alert">
          {{ directiva.error.value?.mensaje }}
          <q-btn flat no-caps dense label="Reintentar" @click="directiva.refetch()" />
        </div>
        <div v-else class="usuarios-directiva__rejilla">
          <UsuariosCargoTarjeta
            v-for="c in directiva.data.value"
            :key="c.cargo"
            :cargo="c"
            :activo="c.cargo === cambio"
            :deshabilitado="guardando > 0"
            @cambiar="empezarCambio(c.cargo)"
          />
        </div>
      </div>
    </section>

    <aside class="usuarios-lateral">
      <template v-if="vista === 'usuarios'">
        <UsuariosPanelAcceso
          v-if="usuarioSeleccionado"
          :key="usuarioSeleccionado.id"
          :usuario="usuarioSeleccionado"
        />
        <div v-else class="usuarios-reglas">
          <h2>Acceso de cada persona</h2>
          <div>Elige a alguien de la lista para cambiar su perfil, su vigencia o su acceso.</div>
        </div>
      </template>
      <UsuariosCambioCargo
        v-else-if="cargoEnCambio"
        :key="cargoEnCambio.cargo"
        :cargo="cargoEnCambio"
        @cancelar="cambio = null"
        @confirmado="cargoAsignado"
      />
      <div v-else class="usuarios-reglas">
        <h2>Reglas de la directiva</h2>
        <div>• Un cargo, una persona. No puede haber dos presidentes.</div>
        <div>• Una persona, un cargo: el acta necesita firmas distintas.</div>
        <div>• Solo propietarios con correo (la regla «sin mora» llega con Finanzas).</div>
        <div>
          • Al vencer el periodo el cargo sigue <strong>prorrogado</strong> hasta nombrar reemplazo.
        </div>
        <div>• Si falta el presidente, lo subroga el vicepresidente.</div>
        <div>• Se registra el acta que respalda cada nombramiento.</div>
      </div>
    </aside>
  </q-page>
</template>

<script setup lang="ts">
import { useIsMutating } from '@tanstack/vue-query';
import { useQuasar } from 'quasar';
import { computed, ref, watch } from 'vue';

import EstadoBadge from '@/components/EstadoBadge.vue';
import PaginaEncabezado from '@/components/PaginaEncabezado.vue';
import { ICONOS } from '@/core/navigation/icons';
import { useSessionStore } from '@/stores/session';
import { formatoFecha } from '@/utils/formato';

import UsuarioInvitarDialog from '../components/UsuarioInvitarDialog.vue';
import UsuariosCambioCargo from '../components/UsuariosCambioCargo.vue';
import UsuariosCargoTarjeta from '../components/UsuariosCargoTarjeta.vue';
import UsuariosPanelAcceso from '../components/UsuariosPanelAcceso.vue';
import { useDirectiva } from '../composables/useDirectiva';
import { useUsuarios } from '../composables/useUsuarios';
import { mensajeNombramiento } from '../directiva.logica';
import type { CargoClave, CargoDirectiva } from '../services/directiva.service';
import { ESTADOS, haySinCupo, porcentajeCupo, textoCupo, textoRoles } from '../usuarios.logica';

type Vista = 'usuarios' | 'directiva';

const VISTAS: { clave: Vista; texto: string }[] = [
  { clave: 'usuarios', texto: 'Todos los usuarios' },
  { clave: 'directiva', texto: 'Directiva' },
];

const $q = useQuasar();
const session = useSessionStore();
const usuarios = useUsuarios();
const vista = ref<Vista>('usuarios');
const seleccionadoId = ref<number | null>(null);

const lista = computed(() => usuarios.data.value ?? null);

// Un id de persona de otro condominio no debe quedar preseleccionado
watch(
  () => session.condominioId,
  () => {
    seleccionadoId.value = null;
  },
);

// Por omisión se muestra a la primera persona; si desaparece de la lista, vuelve a la primera
const usuarioSeleccionado = computed(
  () =>
    lista.value?.usuarios.find((u) => u.id === seleccionadoId.value) ??
    lista.value?.usuarios[0] ??
    null,
);

function agregar(): void {
  $q.dialog({ component: UsuarioInvitarDialog }).onOk((persona: { id: number }) => {
    seleccionadoId.value = persona.id;
  });
}

// ---------- Directiva ----------
const directiva = useDirectiva();
// Mientras se guarda un nombramiento no se abre otro cargo
const guardando = useIsMutating();
const cambio = ref<CargoClave | null>(null);
const mensajeOk = ref('');

const cargoEnCambio = computed(
  () => directiva.data.value?.find((c) => c.cargo === cambio.value) ?? null,
);

function elegirVista(v: Vista) {
  vista.value = v;
  cambio.value = null;
  mensajeOk.value = '';
}

function empezarCambio(cargo: CargoClave) {
  if (guardando.value > 0) {
    return;
  }
  cambio.value = cargo;
  mensajeOk.value = '';
}

function cargoAsignado(cargo: CargoDirectiva, anterior: string | null) {
  cambio.value = null;
  mensajeOk.value = mensajeNombramiento(cargo, anterior);
}

// Al cambiar de condominio no queda un cargo a medio cambiar
watch(
  () => session.condominioId,
  () => {
    cambio.value = null;
    mensajeOk.value = '';
  },
);
</script>

<style scoped>
.usuarios {
  flex-direction: row;
  padding-top: 24px;
  padding-bottom: 24px;
}

.usuarios-principal {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-width: 0;
}

.usuarios-boton {
  height: 44px;
  padding: 0 16px;
  border-radius: 10px;
  border: none;
  background: var(--q-primary);
  color: #ffffff;
  font-size: 14px;
  font-weight: 700;
  font-family: inherit;
  cursor: pointer;
}

.usuarios-boton:focus-visible,
.usuarios-tabla__fila:focus-visible,
.usuarios-error__cerrar:focus-visible {
  outline: 2px solid var(--q-primary);
  outline-offset: 2px;
}

.usuarios-vistas .safic-pestana {
  height: 42px;
}

.usuarios-vista {
  display: flex;
  flex-direction: column;
  gap: 14px;
  flex-grow: 1;
  min-height: 0;
}

.usuarios-skeleton {
  border-radius: 14px;
}

.usuarios-vacio {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 40px 16px;
  color: var(--safic-texto-suave);
  background: var(--safic-superficie);
  border: 1px solid var(--safic-borde);
  border-radius: 14px;
}

.usuarios-tabla__nombre {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

/* Cupo del plan */
.usuarios-cupo {
  display: flex;
  align-items: center;
  gap: 14px;
  background: var(--safic-superficie);
  border: 1px solid var(--safic-borde);
  border-radius: 14px;
  padding: 14px 18px;
}

.usuarios-cupo__textos {
  flex-grow: 1;
}

.usuarios-cupo__etiqueta {
  font-size: 13px;
  font-weight: 700;
  color: var(--safic-texto-2);
}

.usuarios-cupo__barra {
  height: 8px;
  border-radius: 4px;
  background: var(--safic-linea);
  margin-top: 8px;
  overflow: hidden;
}

.usuarios-cupo__relleno {
  height: 8px;
  background: #b8641c;
}

.usuarios-cupo__valor {
  font-size: 24px;
  font-weight: 800;
  white-space: nowrap;
}

/* Error de cupo */
.usuarios-error {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #fde8e6;
  border: 1px solid #f3b8b2;
  border-radius: 14px;
  padding: 14px 18px;
  color: #7f1810;
  flex-wrap: wrap;
}

.usuarios-error__texto {
  flex: 1 1 280px;
  font-size: 13px;
  line-height: 1.45;
}

.usuarios-error__subir {
  height: 38px;
  padding: 0 14px;
  border-radius: 9px;
  background: #9b1c12;
  color: #ffffff;
  font-size: 13px;
  font-weight: 800;
  text-decoration: none;
  display: flex;
  align-items: center;
}

.usuarios-error__cerrar {
  height: 38px;
  padding: 0 12px;
  border-radius: 9px;
  border: 1px solid #f3b8b2;
  background: #ffffff;
  color: #7f1810;
  font-size: 13px;
  font-weight: 700;
  font-family: inherit;
  cursor: pointer;
}

/* Tabla de usuarios */
.usuarios-tabla {
  flex-grow: 1;
  background: var(--safic-superficie);
  border: 1px solid var(--safic-borde);
  border-radius: 14px;
  overflow: hidden;
}

.usuarios-tabla__desplazable {
  overflow-x: auto;
}

.usuarios-tabla__rejilla {
  display: grid;
  grid-template-columns: 1.4fr 1.4fr 150px 150px;
  min-width: 720px;
}

.usuarios-tabla__cabecera {
  padding: 10px 18px;
  background: var(--safic-fondo-2);
  font-size: 12px;
  font-weight: 700;
  color: var(--safic-texto-suave);
  letter-spacing: 0.3px;
}

.usuarios-tabla__fila {
  align-items: center;
  width: 100%;
  text-align: left;
  padding: 0 18px;
  height: 52px;
  border: none;
  border-top: 1px solid var(--safic-linea-2);
  font-size: 14px;
  cursor: pointer;
  font-family: inherit;
  color: var(--safic-texto);
  background: var(--safic-superficie);
}

.usuarios-tabla__fila--activa {
  background: color-mix(in srgb, var(--q-primary) 6%, #ffffff);
  box-shadow: inset 3px 0 0 var(--q-primary);
}

.usuarios-tabla__nombre {
  font-weight: 800;
}

.usuarios-tabla__correo {
  font-size: 12px;
  color: var(--safic-texto-suave);
}

.usuarios-tabla__suave {
  font-size: 13px;
  color: var(--safic-texto-2);
}

/* Directiva */
.usuarios-directiva__intro {
  font-size: 13px;
  color: var(--safic-texto-2);
  line-height: 1.5;
}

.usuarios-directiva__ok {
  background: #e3efec;
  border: 1px solid #b9d7d0;
  border-radius: 12px;
  padding: 12px 16px;
  font-size: 13px;
  color: #0b4a47;
  font-weight: 600;
}

.usuarios-directiva__rejilla {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

/* Panel lateral */
.usuarios-lateral {
  width: 400px;
  flex-shrink: 0;
  align-self: stretch;
  background: var(--safic-superficie);
  border: 1px solid var(--safic-borde);
  border-radius: 14px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.usuarios-reglas {
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  font-size: 13px;
  color: var(--safic-texto-2);
  line-height: 1.5;
}

.usuarios-reglas h2 {
  margin: 0;
  font-size: 16px;
  line-height: 1.5;
  font-weight: 800;
  color: var(--safic-texto);
  letter-spacing: 0;
}

@media (max-width: 1100px) {
  .usuarios {
    flex-direction: column;
  }

  .usuarios-lateral {
    width: auto;
  }
}

@media (max-width: 599px) {
  .usuarios-directiva__rejilla {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
