import Vue from 'vue';
Vue.config.productionTip = false;

import VueResource from 'vue-resource';
Vue.use(VueResource);

import App from './App';
import router from './router';

import './assets/css/bootstrap.css'
import './assets/css/style.css'
import './assets/css/font-awesome-4.7.0/css/font-awesome.min.css';

const appConfig = new Vue();
//appConfig.URL ='https://jwt-chat.herokuapp.com/api/';
appConfig.URL ='http://localhost:3000/api/';

//appConfig.WSS = 'wss://jwt-chat.herokuapp.com';
appConfig.WSS = 'ws://localhost:3000';

appConfig.getAccessToken = ()=> {appConfig.access_token = localStorage.getItem('access_token');};
appConfig.getName = ()=> {appConfig.name = localStorage.getItem('name');};

appConfig.sockets = { items: [], refresh: true };
appConfig.messages = { items: [], refresh: true };
appConfig.audits = { items: [] };
appConfig.users = { items: [] };
appConfig.notifications = {items: []}
export default appConfig;

new Vue({
  el: '#app',
  router,
  template: '<App/>',
  components: { App }
})
