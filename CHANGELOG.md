# Changelog - Free Speech SAAC

Historial de versiones y evolución técnica del proyecto **Free Speech SAAC** (Sistema Aumentativo y Alternativo de Comunicación).

---

## [2.2.0] - 2026-10-16

> Autor: **Diego Javier Mena Amado** (`@ingelectronicadj`)

### SDK Universal (`customTrigger` + Botón Flotante en cualquier Web) y Ergonomía Móvil / Tablet

- **Widget Universal `freespeech-widget.js` para cualquier página web o LMS**:
  - Soporte simultáneo para **`customTrigger`** global (`data-custom-trigger`), disparadores declarativos **`[data-saac-trigger]`** con destino específico (`data-saac-target="#campo"`), botón flotante integrado configurable por esquina (`bottom-right`, `bottom-left`, `top-right`, `top-left`) y API JavaScript (`FreeSpeechSAAC.open`, `.toggle`, `.close`, `.setTarget`).
  - **Barra selectora de campo destino (`Insertar en:`)**: Escanea automáticamente cualquier `<input>`, `<textarea>`, `[contenteditable="true"]` y editores ricos (`TinyMCE`, `Atto`, `CKEditor`, `Quill`) de la página anfitriona, resaltando el campo activo.
  - **Modo Acoplado Lateral (`Dock Right`)**, sincronización automática del idioma (`?embed=1&lang=...`) desde el `<html lang>` anfitrión e iconos geométricos 100 % en CSS (`aria-hidden="true"`).
- **Optimización Responsiva para Teléfonos Móviles y Tablets (`Sentence.vue`, `TilePad.vue`, `Tile.vue`)**:
  - **Barra de frase compacta con tira horizontal deslizable (`.sentence-tiles-strip`)**: Evita que los pictogramas seleccionados cubran la pantalla en teléfonos móviles y dentro de la ventana flotante.
  - **Cuadrícula progresiva `.saac-responsive-grid` (`2 / 3 / 4 / 5 / 6` columnas)**: Ajusta automáticamente la densidad de pictogramas para teléfonos (`3` columnas), tablets en vertical (`4` columnas), tablets en horizontal (`5` columnas) y escritorio (`6` columnas).
  - **Soporte táctil (`touchstart` / `touchmove`) en tablets y modo *Bottom Sheet* (`78vh`) en teléfonos móviles**.

---

## [2.1.0] - 2026-10-15

> Autor: **Diego Javier Mena Amado** (`@ingelectronicadj`)

### Rediseño Visual SAAC, Identificación de Colecciones y Editor con ARASAAC

- **Identificación visual de Baldosas de Colección (`Tile.vue` y `TilePad.vue`)**:
  - Cinta superior distintiva tipo carpeta (`COLECCIÓN` y `VOLVER`) con iconos CSS y relieve de tarjetas apiladas para diferenciar inmediatamente las baldosas que abren colecciones de las baldosas que pronuncian palabras.
  - Nueva **Barra de Colecciones de palabras (`#collectionsBar`)** en la parte superior del tablero con acceso rápido a *Principal*, *Sentir y Emociones*, *Números y Tiempo* y *Teclado ABC*, además del botón de retorno directo al tablero principal.
  - Se pobló la colección **Sentir y Emociones** (`build.json`) con 12 baldosas trilingües (`es`, `en`, `de`) y se ocultan las celdas vacías cuando no se está en modo edición.
- **Nuevo Editor de Baldosas (`EditTileDialog.vue`)**:
  - **Vista Previa en Vivo** de la baldosa y botón **Probar voz** dentro del modal.
  - **Buscador integrado de Pictogramas ARASAAC**, galería rápida de 18 pictogramas frecuentes y carga de imágenes desde el dispositivo.
  - **Paleta visual de colores por categoría CAA (Clave Fitzgerald)** con selección accesible.
  - Corrección en la edición y guardado de textos en el idioma activo (`es`/`sp`, `de`, `en`) y botón para eliminar baldosas.
- **Tema Luminoso y Estilizado de Documentación (`About.vue`, `vuetify.js`, `README.md`)**:
  - Tema claro de alto contraste, cuadrícula de 6 columnas amplias sin recortes de texto y bloques de código estilizados con botón **Copiar código** en `/about`.

---

## [2.0.0] - 2026-10-15

> Autor de modernización y evolución SAAC: **Diego Javier Mena Amado** (`@ingelectronicadj`)

### Nuevas capacidades SAAC (Texto en claro, Copiado y Ventana Flotante para Moodle / LMS)

- **Vista previa de oración en texto plano (`#sentenceTextOutput`)**:
  - La barra de oración muestra en tiempo real el mensaje construido en texto claro a partir de los pictogramas seleccionados, permitiendo que la persona valide o seleccione su mensaje sin depender únicamente de glifos visuales.
- **Copiado directo al portapapeles (`#copySentenceButton`)**:
  - Nuevo botón **Copiar texto** (`Copy text` / `Text kopieren`) en `Sentence.vue` para copiar con un clic la frase construida y pegarla en buscadores web, Microsoft Word, clientes de correo o mensajería.
  - Incluye soporte para `navigator.clipboard.writeText`, respaldo clásico `document.execCommand('copy')` y confirmación accesible mediante `role="status"` y `aria-live="polite"`.
- **SDK de Ventana Flotante integrable con `customTrigger` (`public/freespeech-widget.js`)**:
  - Permite cargar el SAAC como una ventana flotante sobre cualquier plataforma externa (como **Moodle**, Canvas, WordPress o portales institucionales).
  - Soporte para enlazar cualquier botón del sitio anfitrión mediante `data-custom-trigger="#selector"` o `window.FreeSpeechSAAC.init({ customTrigger: '...' })`, eventos DOM (`freespeech:toggle`, `freespeech:open`, `freespeech:close`) y atajo de teclado global **`Alt + Shift + S`**.
  - Ventana flotante arrastrable desde la cabecera, minimizable, maximizable, cerrable con `Escape` y desacoplable en ventana independiente.
- **Inserción directa en campos de la página anfitriona (`#insertSentenceButton`)**:
  - Cuando el SAAC se ejecuta embebido (`?embed=1` o iframe), habilita el botón **Insertar en página** que envía el mensaje vía `postMessage` (`FREESPEECH_SAAC_MESSAGE`) e inserta el texto directamente en el último `<input>`, `<textarea>` o editor `[contenteditable="true"]` (ej. foros o tareas de Moodle con TinyMCE/Atto) donde estuvo el foco.
- **Modo ventana flotante independiente (`#openFloatingWindowButton`)**:
  - Nuevo botón en la barra superior de `App.vue` para abrir el SAAC en una ventana compacta independiente del navegador y utilizarla junto a Word o aplicaciones de escritorio.
- **Demostración interactiva tipo Moodle (`public/moodle-demo.html`)**:
  - Entorno de prueba que simula un Aula Virtual Moodle con botón `customTrigger`, buscador web y caja de respuesta de foro.

### Accesibilidad Web (Cumplimiento WCAG 2.2 AA)

- **`WCAG 4.1.2 Name, Role, Value`**: Se añadieron atributos `aria-label` internacionalizados (`es`, `en`, `de`) y `aria-pressed` a todos los botones de solo icono en `App.vue` y `NumberPad.vue`.
- **`WCAG 1.1.1 Non-text Content`**: Se añadieron atributos `alt=""` y `aria-hidden="true"` a las imágenes e iconos decorativos dentro de los botones de pictogramas (`Tile.vue`) para evitar anuncios redundantes en lectores de pantalla.
- **`WCAG 3.1.1 Language of Page`**: Estandarización del código ISO `es` para español (manteniendo compatibilidad retroactiva con `sp` en `build.json` y configuraciones exportadas) y sincronización dinámica de `<html lang="...">`.
- **`WCAG 4.1.3 Status Messages`**: Regiones `role="region"` y `aria-live="polite"` en `Sentence.vue` y `NumberPad.vue` para anunciar cambios en la oración, confirmación de copiado/inserción y entrada de dígitos.
- **`WCAG 4.1.1 Parsing`**: Uso de clase `.drag-handle` para el manejador de arrastre de mosaicos en modo edición.

### Modernización Tecnológica (Stack 2026)

- **Framework y UI**: Migración de Vue `2.6.10` + Vuetify `2.2.19` a **Vue `3.5.43`** + **Vuetify `4.2.3`**.
- **Bundler y Entorno**: Migración de Vue CLI 4 / Webpack 4 a **Vite `8.3.2`** con soporte nativo para **Node.js 22 / 26**.
- **Estado, Rutas e i18n**: Actualización a **Vuex `4.1.0`** (con persistencia en `localStorage` compatible con versiones previas), **Vue Router `5.3.1`**, **Vue I18n `11.4.12`** y **SortableJS `1.15.7`**.
- **Calidad, Linting y Testing**:
  - Migración de pruebas unitarias de Mocha/Chai a **Vitest `5.0.3`** + **`@vue/test-utils` `2.5.1`** + `jsdom` (5 suites, 30 tests pasando).
  - Migración a **ESLint `10.11.0`** (Flat Config) + `eslint-plugin-vue` `10.11.1`.
  - Actualización de workflows de GitHub Actions (`build-and-publish.yml` y `pull-request.yml`) a `actions/checkout@v4` y `actions/setup-node@v4`.
  - **0 vulnerabilidades** en auditoría de dependencias (`npm audit`).

### Corrección de Bugs Históricos

- **Guardado de edición de mosaicos (`tilePad.js`)**: Se corrigió `SET_TILE_BEING_EDITED` donde `.splice(index, item)` pasaba el objeto como `deleteCount` en vez de `.splice(index, 1, item)`.
- **Diálogo duplicado (`Settings.vue`)**: Se eliminó el segundo `<v-dialog v-model="passcodeEntry">` duplicado que abría dos modales superpuestos.
- **Creación de nuevos mosaicos (`TilePad.vue`)**: Se restauró la tarjeta `#newTile` en modo edición y se reactivó su prueba unitaria en `TilePad.spec.js`.
- **Traducciones (`sp.json`, `de.json`, `en.json`)**: Se corrigió la clave `butonSave` → `buttonSave` en español y se completaron todas las traducciones de modo edición y etiquetas ARIA en los tres idiomas.

---

## [0.1.0] - Versión Original (Upstream)

- Aplicación web progresiva (PWA) de Comunicación Aumentativa y Alternativa en Vue 2 + Vuetify 2 creada originalmente por Archer Calder y colaboradores.
