import { defineConfig } from 'vite'
import dotenv from 'dotenv';

dotenv.config();

// https://vitejs.dev/config/
export default defineConfig({
     server: {
    open: true,
    port: 3000
  },
}) 