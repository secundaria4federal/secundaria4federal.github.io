# secundaria4federal.github.io

Página web institucional de la Escuela Secundaria N°4 "Mariano Moreno" de Federal, Entre Ríos.

## Estructura

- `index.html` — sitio público.
- `admin.html` — panel institucional para editar textos y la galería de fotos (ver más abajo).
- `data/content.json` — todos los textos editables del sitio y la lista de fotos de la galería.
- `assets/img/` — imágenes optimizadas para la web (logo, favicons, fotos de galería).
- `docs/fotos/` — fotos originales sin optimizar (material de referencia, no se usan directamente en el sitio).
- `css/`, `js/` — estilos y lógica del sitio y del panel.
- `scripts/` — herramientas de mantenimiento en Node.js (ver abajo).

## Editar contenidos y fotos

Entrando a `/admin.html` los directivos pueden, sin tocar código:

- Editar los textos de cada sección (misión, oferta educativa, fecha de inscripciones, datos de contacto, etc.).
- Subir, eliminar, reordenar y agregar epígrafes a las fotos de la galería.

La primera vez hay que generar un token de GitHub siguiendo las instrucciones que aparecen dentro del propio panel. El token se guarda solo en el navegador de quien lo genera.

## Scripts de mantenimiento (opcional, para quien administre el repositorio)

Requieren [Node.js](https://nodejs.org/). Instalar dependencias una vez con `npm install`.

- `npm run optimize-images` — regenera las fotos optimizadas de `assets/img/gallery/` a partir de lo que haya en `docs/fotos/` (útil si se agregan fotos directamente por archivo en vez de por el panel).
- `npm run build-content` — regenera `data/content.json` desde cero a partir del manifiesto de fotos. **Sobrescribe ediciones manuales/del panel**, pensado solo para una puesta a punto inicial.
