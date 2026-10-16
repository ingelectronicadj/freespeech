# [Free Speech SAAC](http://freespeechaac.com/) &middot; [![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE.md) ![Version](https://img.shields.io/badge/version-2.2.0-0f766e.svg) ![Vue 3](https://img.shields.io/badge/Vue-3.5-4FC08D.svg) ![Vite](https://img.shields.io/badge/Vite-8.3-646CFF.svg) ![WCAG 2.2 AA](https://img.shields.io/badge/WCAG-2.2_AA-005A9C.svg)

Free Speech is an open-source **Augmentative and Alternative Communication (AAC / SAAC)** web application designed to help non-verbal people communicate without cost, both as a standalone communicator and as an **embeddable floating window** over platforms such as **Moodle LMS**, search engines, or desktop editors.

* **Free & Open-Source, Forever:** Free Speech is committed to providing its services at no cost for the entire duration of the application's lifespan. We believe that communication is a right that everyone deserves to have access to regardless of income status.
* **Plain-Text Output & One-Click Copy:** Build sentences with pictograms while seeing the plain-text phrase in real time, and copy it with one click to paste into search engines, Word, WhatsApp, or Moodle forums.
* **Floating Window & `customTrigger` for Moodle / Web:** Load Free Speech as a draggable, resizable floating window over any website or LMS triggered by your own custom button (`customTrigger`) or keyboard shortcut (`Alt + Shift + S`), with direct text insertion into active inputs.
* **WCAG 2.2 AA Accessible & Fully Customizable:** Built with Vue 3, Vuetify 4, and Vite, supporting screen readers (`aria-label`, `aria-live`), full keyboard navigation, custom tile boards, drag-and-drop reordering, and import/export in English (`en`), Spanish (`es`), and German (`de`).

See [CHANGELOG.md](./CHANGELOG.md) for full details on version **2.0.0**.

## Quick start

### For regular users:

* Navigate to [http://app.freespeechaac.com/](http://app.freespeechaac.com/) on the device you wish to use the software on.
* If you are using a computer, bookmark that tab in the browser to come back to it, your changes will save in the browser.
* If you're using iOS, open [Free Speech](http://app.freespeechaac.com/) in Safari, then click middle share button on the bottom row of buttons. Then, scroll down on the share pop-up and click on "Add to Home Screen". This will add Free Speech as an app on the iOS home screen. Your changes will save in the app.
* If you're using Android, open [Free Speech](http://app.freespeechaac.com/) in Chrome, then tap on the three dots on the top right. Navigate to "Add to Home Screen" on the pop up and select that item, name the app "Free Speech" and add the app to your home screen. Your changes will save in the app.

### For Developers:
* First make sure you have your Node and NPM installed and updated. If you need to install Node, [visit this website](https://nodejs.org/en/download/).
* Run `git clone https://github.com/ingelectronicadj/freespeech freespeech` in your directory of choice then `cd freespeech/vueapp`
* Next, run `npm i` and after that is complete you can run the Vue 3 + Vite app on your machine by running `npm run dev` (or `npm run serve`). You can run unit tests with `npm run test:unit` and build the application with `npm run build`.
* Please be sure to also read our [contributing guide](https://github.com/Merkie/freespeech/blob/master/.github/CONTRIBUTING.md)!

## SAAC Enhancements: Universal `customTrigger`, Floating Window & Mobile/Tablet Ergonomics

Free Speech includes capabilities designed so users do not have to rely solely on visual glyphs when communicating across any web page, search engine, form, rich-text editor, or LMS (such as Moodle, Canvas, or Blackboard):

1. **Plain-Text Sentence Preview & One-Click Copy (`Copy text`)**:
   * As tiles are tapped, the Sentence bar shows the plain-text phrase being built (`#sentenceTextOutput`) alongside a compact horizontal strip of selected pictograms.
   * Clicking **Copy text** copies the constructed message directly to the clipboard so it can be pasted anywhere (Google, Word, chat, etc.).
   * Responsive **2 / 3 / 4 / 5 / 6-column progressive CSS grid** (`TilePad.vue`) and horizontal swipeable collection bar designed for phones, tablets, and desktops.

2. **Universal Floating Widget for Any Web Page or LMS (`freespeech-widget.js`)**:
   * Open the SAAC board on **any web page** via:
     1. A global **`customTrigger`** selector (`data-custom-trigger="#open-saac-btn"`),
     2. Declarative **`[data-saac-trigger]`** buttons targeting specific fields (`data-saac-target="#search-input"`),
     3. The built-in **floating launcher button** (`data-show-default-trigger="true"`),
     4. JavaScript API (`window.FreeSpeechSAAC.open('#field')`, `.toggle()`, `.close()`) or **`Alt + Shift + S`**.
   ```html
   <!-- Option A: Global customTrigger button in any navbar or page -->
   <button id="open-saac-btn" type="button">Abrir Comunicador SAAC</button>

   <!-- Option B: Contextual button targeting a specific input or rich-text editor -->
   <button type="button" data-saac-trigger data-saac-target="#search-box">
     Escribir con SAAC
   </button>

   <!-- Universal Floating SAAC widget script -->
   <script
     src="https://your-freespeech-host.example/freespeech-widget.js"
     data-saac-url="https://your-freespeech-host.example/"
     data-custom-trigger="#open-saac-btn"
     data-show-default-trigger="true"
   ></script>
   ```
   * Includes an **Interactive Target Field Selector (`Insertar en:`)** that auto-detects standard `<input>`, `<textarea>`, `[contenteditable="true"]`, and rich-text editors (`TinyMCE`, `Atto`, `CKEditor`, `Quill`), lateral **Dock Right** mode, touch dragging on tablets, and **Bottom Sheet (`78vh`)** presentation on mobile phones.
   * Try the interactive multi-scenario lab locally at `http://localhost:8080/moodle-demo.html`.

## Authors

* **Diego Javier Mena Amado** - *SAAC Evolution, WCAG 2.2 AA Accessibility & Vue 3 Modernization* - [GitHub](https://github.com/ingelectronicadj) · [A11Y PRO](https://a11ypro.tech/) · [LinkedIn](https://www.linkedin.com/in/ingelectronicadj/) · [diegomena.rocks](https://diegomena.rocks/)
* **Archer Calder** - *Founder/Original Lead Developer* - [GitHub](https://github.com/Merkie) [Donate](https://ko-fi.com/merkie) *archercalder@gmail.com*
* **Bailey Townsend** - *Core Team Member/Lead Developer* - [GitHub](https://github.com/fatfingers23) [Linkedin](https://www.linkedin.com/in/bailey-townsend-25b195105)

None of this would be possible without you all. Thank you!
<a href="https://github.com/Merkie/freespeech/graphs/contributors">
  <img src="https://contributors-img.firebaseapp.com/image?repo=Merkie/freespeech" />
</a>

Made with [contributors-img](https://contributors-img.firebaseapp.com).

## Sponsors
<a href="https://opensource.optum.com/"><img src="https://i.postimg.cc/NGRqXYJs/optum.png" width=200px></a>

## Special Thanks
<a href="https://icons8.com/"><img src="https://logos-download.com/wp-content/uploads/2020/06/Icons8_Logo_full.png" width=200px></a>
Thanks to Icons8 for providing all icons and graphics for the Free Speech AAC project!


<a href="https://www.cnn.com/2021/12/19/us/texas-teen-freespeech-app/index.html"><img src="https://1000logos.net/wp-content/uploads/2021/04/CNN-logo.png" width=200px></a>
Thanks to CNN for covering Free Speech AAC!


<a href="https://www.bbc.com/news/av/disability-57515272"><img src="https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/BBC_Logo_2021.svg/2560px-BBC_Logo_2021.svg.png" width=200px></a>
Thanks to the BBC for covering Free Speech AAC!

### License

Free Speech AAC is [MIT licensed](./LICENSE).
