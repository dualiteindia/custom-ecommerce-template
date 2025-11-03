import path from "path"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig, type Plugin } from "vite"

export default defineConfig({
  plugins: [react(), ...tailwindcss() as Plugin[]],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
