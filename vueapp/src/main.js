import { createApp } from 'vue';
import App from './App.vue';
import store from './store/store';
import router from './router';
import vuetify from './plugins/vuetify';
import './registerServiceWorker';
import i18n from './i18n';

const app = createApp(App);

app.use(store);
app.use(router);
app.use(vuetify);
app.use(i18n);

app.mount('#app');
