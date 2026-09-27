// Configuración de Quasar · https://v2.quasar.dev/quasar-cli-vite/quasar-config-file
import { defineConfig } from '#q-app';

// La API (Laravel) se consume siempre en la misma ruta relativa /api/v1.
// En desarrollo el servidor de Vite la reenvía al backend:
//  - fuera de Docker: http://localhost:8000
//  - dentro de Docker (red "safic"): http://api:8080
const apiProxyTarget = process.env.API_PROXY_TARGET ?? 'http://localhost:8000';

export default defineConfig((ctx) => {
  return {
    boot: ['i18n', 'vue-query', 'api'],

    css: ['app.css'],

    // Íconos: Material Symbols Rounded (obligatorios en cada ítem del menú)
    extras: ['material-symbols-rounded'],

    build: {
      target: {
        browser: 'baseline-widely-available',
        node: 'node22',
      },

      typescript: {
        strict: true,
        vueShim: true,
      },

      vueRouterMode: 'history',

      // En Docker con el código montado desde Windows los cambios no llegan por
      // eventos del sistema de archivos: se detectan revisando cada cierto tiempo.
      extendViteConf(viteConf) {
        if (process.env.SAFIC_WATCH_POLLING === 'true') {
          viteConf.server = {
            ...viteConf.server,
            watch: { ...viteConf.server?.watch, usePolling: true, interval: 300 },
          };
        }
      },

      vitePlugins: [
        [
          '@intlify/unplugin-vue-i18n/vite',
          {
            ssr: ctx.mode.ssr || ctx.mode.ssg,
            include: [ctx.appPaths.resolve.app('src/i18n')],
          },
        ],
        [
          'vite-plugin-checker',
          {
            vueTsc: true,
            eslint: {
              lintCommand: 'eslint -c ./eslint.config.js "./src*/**/*.{ts,js,mjs,cjs,vue}"',
              useFlatConfig: true,
            },
          },
          { server: false },
        ],
      ],
    },

    devServer: {
      host: '0.0.0.0',
      port: 9000,
      open: false,
      proxy: {
        '/api': {
          target: apiProxyTarget,
          changeOrigin: true,
        },
      },
    },

    framework: {
      config: {
        brand: {
          primary: '#0E5E5B',
          secondary: '#12302F',
          accent: '#F0B35A',
          positive: '#1F8A4C',
          negative: '#C0392B',
          info: '#2D6CDF',
          warning: '#E0A100',
        },
        notify: { position: 'top-right', timeout: 3500 },
      },
      iconSet: 'material-symbols-rounded',
      lang: 'es',
      plugins: ['Notify', 'Dialog', 'Loading'],
    },

    animations: [],
  };
});
