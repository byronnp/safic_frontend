<template>
  <!-- Fila de la lista "Roles disponibles" (mockup F1RolesCondominio) -->
  <button
    type="button"
    class="rol"
    :class="{ 'rol--activo': activo }"
    :aria-pressed="activo"
    @click="emit('elegir')"
  >
    <q-icon
      :name="`sym_r_${rol.tipo === 'cargo' ? 'lock' : rol.icono}`"
      size="20px"
      class="rol__icono"
      :class="{ 'rol__icono--adicional': rol.tipo === 'adicional' }"
    />
    <span class="rol__textos">
      <span class="rol__nombre">{{ rol.nombre }}</span>
      <span class="rol__sub">
        {{ rol.usuarios }} {{ rol.usuarios === 1 ? 'usuario' : 'usuarios'
        }}{{ rol.tipo === 'cargo' ? ' · cargo' : '' }}
      </span>
    </span>
    <span v-if="administrativo" class="rol__adm">ADM</span>
  </button>
</template>

<script setup lang="ts">
import type { RolDemo } from '../demo/roles';

defineProps<{ rol: RolDemo; activo: boolean; administrativo: boolean }>();
const emit = defineEmits<{ elegir: [] }>();
</script>

<style scoped>
.rol {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 8px 14px;
  border: none;
  cursor: pointer;
  font-family: inherit;
  color: var(--safic-texto);
  background: #ffffff;
  text-align: left;
}

.rol:hover {
  background: var(--safic-fondo-2);
}

.rol--activo,
.rol--activo:hover {
  background: color-mix(in srgb, var(--q-primary) 6%, #ffffff);
  box-shadow: inset 3px 0 0 var(--q-primary);
}

.rol:focus-visible {
  outline: 2px solid var(--q-primary);
  outline-offset: -2px;
}

.rol__icono {
  color: #8a857a;
  flex-shrink: 0;
}

.rol__icono--adicional {
  color: var(--q-primary);
}

.rol__textos {
  flex-grow: 1;
  min-width: 0;
}

.rol__nombre {
  display: block;
  font-size: 14px;
  font-weight: 700;
}

.rol__sub {
  display: block;
  font-size: 11px;
  color: var(--safic-texto-suave);
}

.rol__adm {
  padding: 1px 6px;
  border-radius: 5px;
  background: #fff1dc;
  color: #8a3f0a;
  font-size: 9px;
  font-weight: 800;
  flex-shrink: 0;
}
</style>
