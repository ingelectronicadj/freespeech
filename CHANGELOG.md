# Changelog - Free Speech SAAC

Historial de versiones y evolución técnica del proyecto **Free Speech SAAC** (Sistema Aumentativo y Alternativo de Comunicación).

---

## [2.7.0] - 2026-11-01

> Autor: **Diego Javier Mena Amado** (`@ingelectronicadj`)

### Predicción, accesibilidad visual, guía terapeutas y 4 colecciones más

- **Predicción de uso (`TilePad.vue`)**: nueva tira **Frecuentes** bajo la barra de colecciones con los 5 pictogramas más usados por el usuario (basada en `tileTapsCount`) — acceso rápido sin alterar las posiciones fijas del tablero.
- **Ajustes de visualización (`Settings.vue`, `settings.js`, `TilePad.vue`)**:
  - `Tamaño de las baldosas`: Automático/Grande/Extra grande (menos columnas, objetivos táctiles mayores para motricidad reducida).
  - `Alto contraste`: bordes negros gruesos, etiquetas más pesadas y pictogramas con más contraste/saturación (baja visión).
- **Acerca de (`About.vue`, locales)**: contenido reorganizado en paneles colapsables + nueva **Guía para terapeutas** (es/en/de): editar tablero, código de acceso, voces, tamaño/contraste, exportar/importar backups, uso offline y escritura directa.
- **Nuevas colecciones (`build.json`, locales)** — total 335 pictogramas ARASAAC locales, 15 tableros:
  - `Transportes` (13), `Ropa` (16), `Música` (9), `Tiempo` (18: días, hoy/mañana/ayer, partes del día, calendario).
- Versión de datos `_v: 6`.

---

## [2.6.1] - 2026-11-01

> Autor: **Diego Javier Mena Amado** (`@ingelectronicadj`)

### Codificación cromática Fitzgerald (estándar AAC)

- **Retinte completo del tablero según clave Fitzgerald** (`build.json`): las baldosas ahora codifican categoría gramatical por color, estándar en sistemas AAC (AsTeRICS Grid, Proloquo2Go):
  - **Amarillo (`sunny`)**: personas, pronombres y palabras sociales (You, They, I, Please, What, frases hechas...)
  - **Verde (`mint`)**: verbos y acciones (Go, Come, Eat, Run, Clean, leer, escribir...)
  - **Azul (`sky`)**: adjetivos y descriptivos (emociones, colores, tamaños, estados)
  - **Naranja (`peach`)**: sustantivos comunes (alimentos, animales, lugares, partes del cuerpo, objetos)
  - **Blanco**: misceláneos (letras del teclado)
  - Las baldosas de navegación entre colecciones conservan el verde `mint` distintivo.
  - Facilita aprendizaje de la posición y categoría de cada pictograma para personas con discapacidad cognitiva.

---

## [2.6.0] - 2026-11-01

> Autor: **Diego Javier Mena Amado** (`@ingelectronicadj`)

### 5 colecciones nuevas inspiradas en AsTeRICS Grid + navegación global

- **Nuevas colecciones (`build.json`, `TilePad.vue`, locales)**:
  - **`Frases hechas` (página 6, 25)**: frases completas de un toque — quiero comer/beber, necesito baño, me duele, no entiendo, ayúdame, sí/no, por favor/gracias, me gusta/no me gusta, otra vez, ya está... Comunicación instantánea sin construir sintaxis.
  - **`Animales` (página 7, 24)**: mascotas, granja, salvajes e insectos.
  - **`Lugares` (página 8, 20)**: casa, colegio, parque, hospital, tienda, playa, cocina, baño, dormitorio...
  - **`Colores` (página 9, 12)**: los 11 colores básicos + pictograma "color".
  - **`Cuerpo` (página 10, 20)**: cabeza, cara, sentidos, extremidades, corazón...
  - Total: **284 pictogramas ARASAAC autocontenidos** en `/img/pictograms/`.
- **Navegación global (estilo tablero global de AsTeRICS)**: la baldosa `Inicio` ahora ocupa siempre la **primera posición** en todas las sub-colecciones — regreso al tablero principal accesible en punto fijo, sin depender del orden del tablero.
- **Nav tiles en home**: accesos directos a las 5 nuevas colecciones desde el tablero principal.
- Versión de datos `_v: 5` para migración.

---

## [2.5.0] - 2026-11-01

> Autor: **Diego Javier Mena Amado** (`@ingelectronicadj`)

### Offline real, más colecciones, pictogramas locales y ajuste de tamaño

- **Pictogramas autocontenidos (`build.json`, `public/img/pictograms/`)**: los 175 pictogramas ARASAAC se sirven desde `/img/pictograms/` en lugar de `static.arasaac.org` — el tablero funciona en redes filtradas o sin internet.
- **Nuevas colecciones (`build.json`, `TilePad.vue`, locales)**:
  - **`Comida` (página 4, 27 baldosas)**: comer, beber, desayuno/almuerzo/cena, alimentos básicos, frutas, verduras, agua/leche/jugo, hambre, sed.
  - **`Acciones` (página 5, 29 baldosas)**: correr, caminar, dormir, abrir/cerrar, dar/tomar, escuchar, mirar, hablar, llorar, reír, cantar, bailar, esperar, empezar, terminar...
  - Página `Números`: dígitos 0–1000 también migrados a ARASAAC; retiradas baldosas de unidades sin pictograma fiel (Degrees, Pounds, Feet, Miles).
  - Versión de datos `_v: 4` para migración de tableros almacenados.
- **Offline-first (`public/service-worker.js`)**: Service Worker con caché en tiempo de ejecución (app shell + pictogramas + fallback SPA). Antes registraba un archivo inexistente — el modo offline no funcionaba.
- **Ajustes → `Tamaño de los pictogramas`**: selector Normal/Grande/Extra grande (48/64/80 px) persistido por usuario, con alturas de baldosa y escalado móvil adaptados.
- **Rutas en español (`router.js`)**: `/acerca-de` y `/ajustes` como URLs canónicas; `/about` y `/settings` redirigen.
- **Terminología AAC consistente (locales)**: "mosaicos"/"baldosas"/"Kacheln"/"tiles" unificados a **pictograma / pictogram / Piktogramm**.
- **Acerca de (`About.vue`)**: sección legal visible — atribución **ARASAAC (CC BY-NC-SA 4.0, Sergio Palao, Gobierno de Aragón)** y nota de privacidad (todo se guarda en el navegador, sin servidores ni seguimiento).

---

## [2.4.0] - 2026-11-01

> Autor: **Diego Javier Mena Amado** (`@ingelectronicadj`)

### Pictogramas ARASAAC en todo el tablero, nuevas colecciones y barra simplificada

- **Sustitución integral de pictogramas por ARASAAC (`build.json`)**:
  - Reemplazados los enlaces a imágenes de terceros (icons8) por pictogramas oficiales **ARASAAC** (`static.arasaac.org/{id}/{id}_300.png`), coherentes con la simbología AAC y con el buscador ARASAAC del diálogo de edición.
  - Corregidos mapeos semánticamente incorrectos (p. ej. "Was"→avispa, "All"→cocodrilo, "You"→logo de YouTube, "Come"→cometa, "Have"→hospital).
- **Nuevas colecciones de palabras (`build.json`, `TilePad.vue`, locales)**:
  - **`Estudio` (página 2, 19 baldosas)**: escuela, tareas, estudiar, leer, escribir, dibujar, pintar, lápiz, cuaderno, libro, computadora, clase, maestra, examen, aprender, pensar, pregunta, respuesta, recreo.
  - **`Aseo personal` (página 3, 20 baldosas)**: ducha, baño, dientes, cepillo, manos, jabón, champú, toalla, cara, peine, secador, desodorante, uñas, papel higiénico, inodoro, vestirse, limpiar, ordenar, cama, basura.
  - Ampliada **`Sentir y Emociones`** (11→22): aburrido, sorprendido, confundido, avergonzado, orgulloso, preocupado, emocionado, enfermo, frío, calor, amor.
  - Pestañas de colecciones en `TilePad.vue` y claves `collections.study`/`collections.hygiene` en `sp`, `en`, `de`.
  - Migración por versión de datos (`_v: 3`): el tablero almacenado del usuario se actualiza al nuevo catálogo en la primera carga.
- **Barra superior simplificada para usuarios con discapacidad cognitiva (`App.vue`)**:
  - Eliminados los botones rápidos `ES | EN | DE` (el idioma se cambia en Ajustes → Idioma).
  - `title` nativo en todos los botones de navegación para mostrar descripción al pasar el puntero.
- **Iconos de interfaz autocontenidos (`vuetify.js`, `package.json`)**:
  - Font **Material Icons empaquetado localmente** (`material-design-icons-iconfont`, woff2 ~125 KB) en lugar de Google Fonts: los iconos ya no aparecen como texto cuando la CDN externa falla, incluido dentro de iframes embebidos.
- **Imagen BBC rota en /about (`README.md`, `About.vue`, `public/img/logos/bbc.svg`)**: logo servido localmente; el compilado de markdown reescribe rutas `vueapp/public/...` para que funcionen igual en GitHub y en la app.

---

## [2.3.0] - 2026-10-22

> Autor: **Diego Javier Mena Amado** (`@ingelectronicadj`)

### Mejoras de Ventana Flotante por `customTrigger`, Modo Escritura Directa y Buscador Transversal

- **Posicionamiento inteligente anti-colisión y 4 modos de disposición (`public/freespeech-widget.js`)**:
  - **Posicionamiento inteligente (`positionFloatingWindowSmart`)**: Cuando el tablero se abre desde un `customTrigger` vinculado a un campo (`data-saac-target="#campo"` o último campo con foco), calcula las coordenadas del campo activo y posiciona la ventana flotante en el lado libre (izquierda, derecha o debajo) para no tapar nunca el campo donde la persona usuaria está escribiendo.
  - **4 modos de acoplamiento (`float`, `left`, `bottom`, `right`)**: Nuevos controles en cabecera y soporte declarativo mediante `data-saac-mode="float|left|right|bottom"`. El modo `bottom` transforma la ventana en un teclado asistivo inferior a ancho completo, ajustando el `padding-bottom` del documento y desplazando el campo activo a la vista (`scrollIntoView`).
  - **Persistencia en `sessionStorage`** de las preferencias de acoplamiento y modo de inserción.
- **Modo `Escritura directa` (`Directo al campo`) y botón `Borrar palabra` (`public/freespeech-widget.js`, `Tile.vue`)**:
  - Interruptor **`Escritura directa`** (`data-saac-direct="true"` o botón en la barra de destino): permite insertar cada palabra o letra directamente en el `<input>`, `<textarea>` o editor rico a medida que se pulsa cada baldosa del tablero, con pulso visual de confirmación sobre el campo activo.
  - Nuevo botón **`Borrar palabra`** (`FreeSpeechSAAC.deleteLastWord()`) para eliminar la última palabra escrita en el campo destino sin usar el teclado físico.
- **Buscador rápido de palabras y mejoras visuales en modo embebido (`TilePad.vue`, `App.vue`, `Sentence.vue`, `Tile.vue`, `index.html`)**:
  - **Buscador transversal (`#boardQuickSearchInput`)** en la barra de colecciones de `TilePad.vue` que filtra baldosas en tiempo real a través de todas las colecciones (`Principal`, `Sentir y Emociones`, `Números y Tiempo`, `Teclado ABC`) en español, inglés y alemán.
  - **Iconos SVG nativos (`aria-hidden="true"`) y selector rápido `ES | EN | DE`**: Reemplazadas las ligaduras externas de `Material Icons` en `App.vue` y `Sentence.vue` (que se superponían al bloquearse `fonts.googleapis.com`) por iconos vectoriales SVG y eliminados los `<link>` externos bloqueantes de `index.html`.
  - **Carga directa de los 115 pictogramas en `Tile.vue`** sin bloqueo por `loading="lazy"`, manteniendo emblemas de respaldo para las teclas alfabéticas.
  - **Ciclo completo de accesibilidad WCAG 2.2 AA**: sincronización de `aria-expanded` y `aria-controls="fs-saac-floating-window"` en todos los `customTrigger`, anuncios en región `aria-live="polite"` y retorno automático del foco al cerrar con `Escape`.

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
