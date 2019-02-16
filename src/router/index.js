import Vue from 'vue'
import Router from 'vue-router'

import App from '../App.vue'

import Test from '../components/Test.vue'

Vue.use(Router)

export default new Router({
  mode: 'hash',
  linkActiveClass: 'open active',
  scrollBehavior: () => ({ y: 0 }),
  routes: [
    {
      path: '/',
      name: '',
      component: App,
      children: [
        {
          path: '/test',
          name: 'Test',
          component: Test
        }
      ]
    }
  ]
})