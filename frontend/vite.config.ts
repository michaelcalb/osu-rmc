import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { execFileSync } from 'node:child_process'

const [date, hash] = execFileSync('git', ['log', '-1', '--format=%cs %h']).toString().trim().split(' ')

// https://vite.dev/config/
export default defineConfig({
    plugins: [vue()],
    define: {
        __COMMIT__: { date, hash },
    },
})
