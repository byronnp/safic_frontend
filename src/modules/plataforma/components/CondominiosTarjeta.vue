<template>
  <article class="tarjeta">
    <div class="tarjeta__cabecera">
      <div
        class="tarjeta__avatar"
        :style="{ background: color.fondo, color: color.texto }"
        aria-hidden="true"
      >
        {{ iniciales(condominio.nombre) }}
      </div>
      <div class="tarjeta__nombres">
        <div class="tarjeta__nombre">{{ condominio.nombre }}</div>
        <div class="tarjeta__ciudad">{{ lugar }}</div>
      </div>
      <EstadoBadge
        :tono="ESTADO[condominio.estado].tono"
        :texto="ESTADO[condominio.estado].texto"
      />
    </div>

    <div class="tarjeta__cifras">
      <div>
        <div class="tarjeta__valor">{{ condominio.total_unidades }}</div>
        <div class="tarjeta__etiqueta">Unidades</div>
      </div>
      <div>
        <div class="tarjeta__valor">{{ mensualidad }}</div>
        <div class="tarjeta__etiqueta">Mensualidad</div>
      </div>
      <div>
        <div class="tarjeta__valor">{{ condominio.administradores.length }}</div>
        <div class="tarjeta__etiqueta">Admins</div>
      </div>
    </div>

    <div class="tarjeta__pie">
      <div class="tarjeta__plan">
        Plan {{ condominio.plan?.nombre ?? '—' }} · {{ condominio.codigo }}
      </div>
      <div class="tarjeta__admin" :title="administrador?.email">{{ adminTxt }}</div>
    </div>

    <div v-if="puedeEditar" class="tarjeta__acciones">
      <button type="button" class="tarjeta__reenviar" @click="editar">Editar datos</button>
      <button
        type="button"
        class="tarjeta__reenviar"
        :class="{ 'tarjeta__reenviar--peligro': condominio.estado !== 'suspendido' }"
        @click="cambiarEstado"
      >
        {{ condominio.estado === 'suspendido' ? 'Reactivar' : 'Inactivar' }}
      </button>
    </div>

    <!-- Invitación pendiente: el administrador aún no crea su contraseña -->
    <div v-if="pendiente" class="tarjeta__pendiente">
      <EstadoBadge tono="alerta" texto="Invitación pendiente" />
      <span class="tarjeta__correo" :title="pendiente.email">{{ pendiente.email }}</span>
      <button
        v-if="puedeReenviar"
        type="button"
        class="tarjeta__reenviar"
        @click="reenviarInvitacion"
      >
        Reenviar
      </button>
    </div>
  </article>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import { computed } from 'vue';

import EstadoBadge from '@/components/EstadoBadge.vue';
import type { TonoEstado } from '@/components/EstadoBadge.vue';
import { colorAvatar, iniciales } from '@/core/theme/avatar';
import type {
  CondominioPlataforma,
  EstadoCondominio,
} from '@/modules/plataforma/services/plataforma.service';
import { useSessionStore } from '@/stores/session';
import { formatoMoneda } from '@/utils/formato';

import EditarCondominioDialog from './EditarCondominioDialog.vue';
import MotivoCondominioDialog from './MotivoCondominioDialog.vue';
import ReenviarInvitacionDialog from './ReenviarInvitacionDialog.vue';

const props = defineProps<{ condominio: CondominioPlataforma }>();

const $q = useQuasar();
const session = useSessionStore();
// Mostrar el botón es comodidad; la API exige plataforma.condominios de todas formas.
const puedeReenviar = computed(() => session.tienePermisoPlataforma('plataforma.condominios'));

// Solo el super admin edita e inactiva; la API exige plataforma.condominios-editar de todas formas.
const puedeEditar = computed(() => session.tienePermisoPlataforma('plataforma.condominios-editar'));

function editar(): void {
  $q.dialog({
    component: EditarCondominioDialog,
    componentProps: { condominio: props.condominio },
  }).onOk((c: CondominioPlataforma) => {
    $q.notify({ type: 'positive', message: `Datos de ${c.nombre} actualizados.` });
  });
}

function cambiarEstado(): void {
  const inactivar = props.condominio.estado !== 'suspendido';
  $q.dialog({
    component: MotivoCondominioDialog,
    componentProps: { condominio: props.condominio, inactivar },
  }).onOk((c: CondominioPlataforma) => {
    $q.notify({
      type: 'positive',
      message: inactivar ? `${c.nombre} quedó inactivo.` : `${c.nombre} fue reactivado.`,
    });
  });
}

const ESTADO: Record<EstadoCondominio, { tono: TonoEstado; texto: string }> = {
  activo: { tono: 'exito', texto: 'Activo' },
  prueba: { tono: 'info', texto: 'Prueba' },
  solo_lectura: { tono: 'alerta', texto: 'Solo lectura' },
  suspendido: { tono: 'error', texto: 'Suspendido' },
};

const color = computed(() => colorAvatar(props.condominio.id));
const lugar = computed(() => {
  const u = props.condominio.ubicacion;
  return [u.parroquia, u.provincia].filter(Boolean).join(', ') || 'Sin ubicación';
});
const mensualidad = computed(() =>
  props.condominio.mensualidad ? formatoMoneda(props.condominio.mensualidad) : '—',
);
const administrador = computed(() => props.condominio.administradores[0] ?? null);
const pendiente = computed(
  () => props.condominio.administradores.find((a) => a.estado === 'invitado') ?? null,
);

function reenviarInvitacion(): void {
  const a = pendiente.value;
  if (!a) return;
  $q.dialog({
    component: ReenviarInvitacionDialog,
    componentProps: {
      condominioId: props.condominio.id,
      condominio: props.condominio.nombre,
      usuarioId: a.id,
      nombre: a.nombre,
      emailActual: a.email,
    },
  }).onOk((admin: { email: string }) => {
    $q.notify({ type: 'positive', message: `Enviamos una nueva invitación a ${admin.email}.` });
  });
}

const adminTxt = computed(() => {
  const a = administrador.value;
  if (!a) {
    return 'Sin administrador';
  }
  return a.estado === 'invitado' ? `${a.nombre} · invitado` : a.nombre;
});
</script>

<style scoped>
.tarjeta__pendiente {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid var(--safic-linea);
  min-width: 0;
}

.tarjeta__correo {
  flex-grow: 1;
  min-width: 0;
  font-size: 13px;
  color: var(--safic-texto-suave);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tarjeta__reenviar {
  border: none;
  background: none;
  padding: 4px 0;
  color: var(--q-primary);
  font-size: 13px;
  font-weight: 700;
  font-family: inherit;
  cursor: pointer;
  flex-shrink: 0;
}

.tarjeta__acciones {
  display: flex;
  gap: 16px;
  padding-top: 12px;
  border-top: 1px solid var(--safic-linea);
}

.tarjeta__reenviar--peligro {
  color: #9b1c12;
}

.tarjeta__reenviar:focus-visible {
  outline: 2px solid var(--q-primary);
  outline-offset: 2px;
}

.tarjeta {
  background: #ffffff;
  border: 1px solid var(--safic-borde);
  border-radius: 16px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-width: 0;
}

.tarjeta__cabecera {
  display: flex;
  align-items: center;
  gap: 12px;
}

.tarjeta__avatar {
  width: 46px;
  height: 46px;
  border-radius: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 15px;
  flex-shrink: 0;
}

.tarjeta__nombres {
  flex-grow: 1;
  min-width: 0;
}

.tarjeta__nombre {
  font-size: 16px;
  font-weight: 800;
}

.tarjeta__ciudad {
  font-size: 13px;
  color: var(--safic-texto-suave);
}

.tarjeta__cifras {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  padding: 12px 0;
  border-top: 1px solid var(--safic-linea-2);
  border-bottom: 1px solid var(--safic-linea-2);
}

.tarjeta__valor {
  font-size: 20px;
  font-weight: 800;
}

.tarjeta__etiqueta {
  font-size: 12px;
  color: var(--safic-texto-suave);
}

.tarjeta__pie {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tarjeta__plan {
  font-size: 13px;
  color: var(--safic-texto-2);
  flex-grow: 1;
}

.tarjeta__admin {
  font-size: 13px;
  font-weight: 700;
  color: var(--safic-texto-2);
  max-width: 50%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
