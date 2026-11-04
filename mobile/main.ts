import { createApp } from 'vue'
import { createI18n } from 'vue-i18n'
import { zh, en } from './messages'
import App from './App.vue'
import zhPatrol from '../locales/lang/zh.json'
import enPatrol from '../locales/lang/en.json'
import 'ant-design-vue/dist/reset.css'
import './style.css'
createApp(App).use(createI18n({ legacy: false, locale: 'zh', fallbackLocale: 'en', messages: { zh: { Mobile: zh, Patrol: { missed: zhPatrol.Patrol.missed } }, en: { Mobile: en, Patrol: { missed: enPatrol.Patrol.missed } } } })).mount('#app')
