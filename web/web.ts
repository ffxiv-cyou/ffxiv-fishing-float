import { mount } from 'svelte'
import App from './Web.svelte'

const app = mount(App, {
  target: document.getElementById('app')!,
})

import "../src/sentry";

export default app
