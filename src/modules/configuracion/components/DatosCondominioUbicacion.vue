<template>
  <!-- Pestaña Ubicación (sin mockup): formulario sencillo y recuadro para el mapa -->
  <q-form class="ubicacion" @submit="guardar">
    <div class="ubicacion__campos">
      <div>
        <div class="ubicacion__titulo">Ubicación</div>
        <div class="ubicacion__ayuda">Ayuda a proveedores y visitas a llegar al condominio.</div>
      </div>
      <div class="safic-campo">
        <label for="dc-ubi-provincia" class="safic-campo__etiqueta">Provincia</label>
        <q-select
          v-model="datos.provincia"
          for="dc-ubi-provincia"
          class="safic-input"
          outlined
          dense
          :options="PROVINCIAS"
        />
      </div>
      <div class="ubicacion__par">
        <div class="safic-campo">
          <label for="dc-ubi-canton" class="safic-campo__etiqueta">Cantón</label>
          <q-input v-model="datos.canton" for="dc-ubi-canton" class="safic-input" outlined dense />
        </div>
        <div class="safic-campo">
          <label for="dc-ubi-parroquia" class="safic-campo__etiqueta">Parroquia</label>
          <q-input
            v-model="datos.parroquia"
            for="dc-ubi-parroquia"
            class="safic-input"
            outlined
            dense
          />
        </div>
      </div>
      <div class="safic-campo">
        <label for="dc-ubi-direccion" class="safic-campo__etiqueta">Dirección</label>
        <q-input
          v-model="datos.direccion"
          for="dc-ubi-direccion"
          class="safic-input"
          outlined
          dense
          type="textarea"
          autogrow
        />
      </div>
      <div class="col-grow" />
      <q-btn
        type="submit"
        unelevated
        no-caps
        color="primary"
        class="safic-btn"
        label="Guardar ubicación"
      />
    </div>
    <div class="ubicacion__mapa" role="img" aria-label="Mapa del condominio">
      <q-icon name="sym_r_map" size="32px" />
      <div>Mapa · {{ datos.canton }}, {{ datos.provincia }}</div>
    </div>
  </q-form>
</template>

<script setup lang="ts">
import { reactive } from 'vue';
import { useQuasar } from 'quasar';
import { PROVINCIAS, UBICACION } from '../demo/datos-condominio';

const $q = useQuasar();
const datos = reactive({ ...UBICACION });

function guardar() {
  $q.notify({ type: 'positive', message: 'Ubicación guardada.' });
}
</script>

<style scoped>
.ubicacion {
  display: flex;
  gap: 18px;
  flex-grow: 1;
  min-height: 0;
}

.ubicacion__campos {
  width: 420px;
  flex-shrink: 0;
  background: #ffffff;
  border: 1px solid var(--safic-borde);
  border-radius: 14px;
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  box-sizing: border-box;
}

.ubicacion__titulo {
  font-size: 14px;
  font-weight: 800;
}

.ubicacion__ayuda {
  font-size: 12px;
  color: var(--safic-texto-suave);
}

.ubicacion__par {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.ubicacion__mapa {
  flex-grow: 1;
  min-height: 280px;
  border-radius: 14px;
  background: #e4e1d8;
  border: 1px solid var(--safic-borde-2);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: var(--safic-texto-suave);
  font-size: 13px;
  font-weight: 700;
}

@media (max-width: 1023px) {
  .ubicacion {
    flex-direction: column;
  }

  .ubicacion__campos {
    width: 100%;
  }
}
</style>
