<template>
  <!-- Pestaña General (sin mockup): formulario sencillo con el estilo de Apariencia -->
  <q-form class="formulario" @submit="guardar">
    <div>
      <div class="formulario__titulo">Datos generales</div>
      <div class="formulario__ayuda">Aparecen en recibos, correos y en la app de residentes.</div>
    </div>
    <div class="formulario__grilla">
      <div class="safic-campo formulario__ancho">
        <label for="dc-gen-nombredelcon" class="safic-campo__etiqueta">Nombre del condominio</label>
        <q-input
          v-model="datos.nombre"
          for="dc-gen-nombredelcon"
          class="safic-input"
          outlined
          dense
          :rules="[requerido]"
          hide-bottom-space
        />
      </div>
      <div class="safic-campo">
        <label for="dc-gen-ruc" class="safic-campo__etiqueta">RUC</label>
        <q-input
          v-model="datos.ruc"
          for="dc-gen-ruc"
          class="safic-input"
          outlined
          dense
          inputmode="numeric"
          maxlength="13"
          :rules="[rucValido]"
          hide-bottom-space
        />
      </div>
      <div class="safic-campo">
        <label for="dc-gen-telefono" class="safic-campo__etiqueta">Teléfono</label>
        <q-input
          v-model="datos.telefono"
          for="dc-gen-telefono"
          class="safic-input"
          outlined
          dense
          type="tel"
        />
      </div>
      <div class="safic-campo formulario__ancho">
        <label for="dc-gen-direccion" class="safic-campo__etiqueta">Dirección</label>
        <q-input
          v-model="datos.direccion"
          for="dc-gen-direccion"
          class="safic-input"
          outlined
          dense
        />
      </div>
      <div class="safic-campo formulario__ancho">
        <label for="dc-gen-correodelaad" class="safic-campo__etiqueta"
          >Correo de la administración</label
        >
        <q-input
          v-model="datos.correo"
          for="dc-gen-correodelaad"
          class="safic-input"
          outlined
          dense
          type="email"
          :rules="[correoValido]"
          hide-bottom-space
        />
      </div>
    </div>
    <div class="formulario__acciones">
      <q-btn
        type="submit"
        unelevated
        no-caps
        color="primary"
        class="safic-btn"
        label="Guardar datos"
      />
    </div>
  </q-form>
</template>

<script setup lang="ts">
import { reactive } from 'vue';
import { useQuasar } from 'quasar';
import { DATOS_GENERALES } from '../demo/datos-condominio';

const $q = useQuasar();
const datos = reactive({ ...DATOS_GENERALES });

const requerido = (v: string) => !!v.trim() || 'Escribe el nombre.';
const rucValido = (v: string) => /^\d{13}$/.test(v) || 'El RUC tiene 13 dígitos.';
const correoValido = (v: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || 'Escribe un correo válido.';

function guardar() {
  $q.notify({ type: 'positive', message: 'Datos del condominio guardados.' });
}
</script>

<style scoped>
.formulario {
  max-width: 760px;
  background: #ffffff;
  border: 1px solid var(--safic-borde);
  border-radius: 14px;
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.formulario__titulo {
  font-size: 14px;
  font-weight: 800;
}

.formulario__ayuda {
  font-size: 12px;
  color: var(--safic-texto-suave);
}

.formulario__grilla {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.formulario__ancho {
  grid-column: 1 / -1;
}

.formulario__acciones {
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 599px) {
  .formulario__grilla {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
