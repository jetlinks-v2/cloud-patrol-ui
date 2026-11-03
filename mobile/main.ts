import { createApp } from 'vue'
import { createI18n } from 'vue-i18n'
import { zh, en } from './messages'
import App from './App.vue'
import 'ant-design-vue/dist/reset.css'
import './style.css'
createApp(App).use(createI18n({ legacy: false, locale: 'zh', fallbackLocale: 'en', messages: { zh: { Mobile: zh }, en: { Mobile: en } } })).mount('#app')
