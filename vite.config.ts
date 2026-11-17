import { defineConfig } from 'vite'
import dotenv from 'dotenv';

dotenv.config();

// https://vitejs.dev/config/
export default defineConfig({
    server: {
        open: true,
        port: 3000,
        host: true,       // слушать все интерфейсы: localhost, 127.0.0.1 и ::1
        strictPort: true, // если порт занят — упасть с ошибкой, а не уйти на 3001
    },
    preview: {
        port: 3000,
        host: true,       // слушать все интерфейсы, а не только localhost
        strictPort: true, // если порт занят — упасть с ошибкой, а не уйти на другой
    },
})
