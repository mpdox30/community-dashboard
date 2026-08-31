import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
// base ต้องตรงกับชื่อ repo บน GitHub Pages (project site):
// https://mpdox30.github.io/community-dashboard/
export default defineConfig({
  base: '/community-dashboard/',
  plugins: [react()],
})
