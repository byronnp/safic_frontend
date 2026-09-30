<template>
  <q-page class="safic-main usuarios">
    <section class="usuarios-principal">
      <PaginaEncabezado miga="Configuración / Usuarios y roles" titulo="Usuarios y roles">
        <template #acciones>
          <button type="button" class="usuarios-boton" @click="error = true">
            Asignar rol administrativo
          </button>
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
        <div class="usuarios-cupo">
          <div class="usuarios-cupo__textos">
            <div class="usuarios-cupo__etiqueta">
              Usuarios administrativos · plan {{ CUPO_PLAN.plan }}
            </div>
            <div
              class="usuarios-cupo__barra"
              role="progressbar"
              aria-label="Cupo de usuarios administrativos usado"
              :aria-valuenow="CUPO_PLAN.usados"
              aria-valuemin="0"
              :aria-valuemax="CUPO_PLAN.limite"
            >
              <div class="usuarios-cupo__relleno" :style="{ width: `${porcentajeCupo}%` }" />
            </div>
          </div>
          <div class="usuarios-cupo__valor">{{ CUPO_PLAN.usados }} de {{ CUPO_PLAN.limite }}</div>
        </div>

        <div v-if="error" class="usuarios-error" role="alert">
          <div class="usuarios-error__texto">
            <strong>Tu plan permite {{ CUPO_PLAN.limite }} usuarios administrativos.</strong>
            Desactiva a uno o sube al plan Completo (4 usuarios). Presidente, vicepresidente,
            secretario, guardia y residentes no cuentan.
          </div>
          <router-link :to="{ name: 'configuracion-suscripcion' }" class="usuarios-error__subir">
            Subir de plan
          </router-link>
          <button type="button" class="usuarios-error__cerrar" @click="error = false">
            Entendido
          </button>
        </div>

        <div class="usuarios-tabla">
          <div class="usuarios-tabla__desplazable">
            <div class="usuarios-tabla__rejilla usuarios-tabla__cabecera">
              <div>PERSONA</div>
              <div>ROLES</div>
              <div>CUENTA CUPO</div>
              <div>ACCESO HASTA</div>
            </div>
            <button
              v-for="(u, i) in USUARIOS"
              :key="u.nombre"
              type="button"
              class="usuarios-tabla__rejilla usuarios-tabla__fila"
              :class="{ 'usuarios-tabla__fila--activa': i === seleccionado }"
              :aria-pressed="i === seleccionado"
              @click="seleccionado = i"
            >
              <div>
                <div class="usuarios-tabla__nombre">{{ u.nombre }}</div>
                <div class="usuarios-tabla__correo">{{ u.correo }}</div>
              </div>
              <div class="usuarios-tabla__suave">{{ u.roles }}</div>
              <div>
                <EstadoBadge :tono="u.cuentaCupo ? 'alerta' : 'neutro'">
                  {{ u.cuentaCupo ? 'Sí' : 'No' }}
                </EstadoBadge>
              </div>
              <div class="usuarios-tabla__suave">{{ u.accesoHasta }}</div>
            </button>
          </div>
        </div>
      </div>

      <!-- Vista: directiva -->
      <div v-else class="usuarios-vista">
        <div class="usuarios-directiva__intro">
          Cada cargo lo ocupa <strong>una sola persona</strong> y una persona ocupa
          <strong>un solo cargo</strong>. Para reemplazar a alguien usa <strong>Cambiar</strong>: se
          cierra su periodo y se abre el del nuevo.
        </div>
        <div v-if="mensajeOk" class="usuarios-directiva__ok" role="status">{{ mensajeOk }}</div>
        <div class="usuarios-directiva__rejilla">
          <UsuariosCargoTarjeta
            v-for="(c, i) in cargos"
            :key="c.cargo"
            :cargo="c"
            :activo="i === cambio"
            @cambiar="empezarCambio(i)"
          />
        </div>
      </div>
    </section>

    <aside class="usuarios-lateral">
      <UsuariosPanelAcceso v-if="vista === 'usuarios'" :usuario="usuarioSeleccionado" />
      <UsuariosCambioCargo
        v-else-if="cargoEnCambio"
        :key="cargoEnCambio.cargo"
        :cargo="cargoEnCambio"
        :cargos="cargos"
        @cancelar="cambio = null"
        @confirmar="confirmarCambio"
      />
      <div v-else class="usuarios-reglas">
        <h2>Reglas de la directiva</h2>
        <div>• Un cargo, una persona. No puede haber dos presidentes.</div>
        <div>• Una persona, un cargo: el acta necesita firmas distintas.</div>
        <div>• Solo residentes propietarios sin mora (Decreto 462).</div>
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
import { computed, ref } from 'vue';

import EstadoBadge from '@/components/EstadoBadge.vue';
import PaginaEncabezado from '@/components/PaginaEncabezado.vue';

import UsuariosCambioCargo, {
  type ConfirmacionCambio,
} from '../components/UsuariosCambioCargo.vue';
import UsuariosCargoTarjeta from '../components/UsuariosCargoTarjeta.vue';
import UsuariosPanelAcceso from '../components/UsuariosPanelAcceso.vue';
import {
  CUPO_PLAN,
  DIRECTIVA,
  NUEVO_PERIODO,
  USUARIO_INICIAL,
  USUARIOS,
  type CargoDirectiva,
} from '../demo/usuarios';

type Vista = 'usuarios' | 'directiva';

const VISTAS: { clave: Vista; texto: string }[] = [
  { clave: 'usuarios', texto: 'Todos los usuarios' },
  { clave: 'directiva', texto: 'Directiva' },
];

const vista = ref<Vista>('usuarios');
const seleccionado = ref(USUARIO_INICIAL);
const error = ref(false);

const cargos = ref<CargoDirectiva[]>(DIRECTIVA.map((c) => ({ ...c })));
const cambio = ref<number | null>(null);
const mensajeOk = ref('');

const porcentajeCupo = computed(() =>
  Math.min(100, Math.round((CUPO_PLAN.usados / CUPO_PLAN.limite) * 100)),
);

const usuarioSeleccionado = computed(() => USUARIOS[seleccionado.value] ?? USUARIOS[0]!);

const cargoEnCambio = computed(() =>
  cambio.value === null ? null : (cargos.value[cambio.value] ?? null),
);

function elegirVista(v: Vista) {
  vista.value = v;
  cambio.value = null;
  mensajeOk.value = '';
}

function empezarCambio(i: number) {
  cambio.value = i;
  mensajeOk.value = '';
}

function confirmarCambio(datos: ConfirmacionCambio) {
  const i = cambio.value;
  const actual = i === null ? undefined : cargos.value[i];
  if (i === null || !actual) return;
  const anterior = actual.nombre;
  cargos.value[i] = {
    cargo: actual.cargo,
    nombre: datos.nombre,
    unidad: datos.unidad,
    periodo: `26 sep 2026 – ${datos.hasta || NUEVO_PERIODO.hasta}`,
    acta: datos.acta.split(' · ')[0] || NUEVO_PERIODO.actaCorta,
    prorrogado: false,
  };
  cambio.value = null;
  mensajeOk.value = `${actual.cargo}: ${datos.nombre} desde hoy. El periodo de ${anterior} se cerró y conserva su rol de residente.`;
}
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
