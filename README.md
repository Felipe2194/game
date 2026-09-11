# Salamanca

Roguelike por turnos en pixel art para la terminal. Descargás, jugás, morís, reintentás.

Ver [`salamanca-diseno.md`](./salamanca-diseno.md) para el documento de diseño completo.

## Desarrollo

```sh
npm install
npm run dev      # corre src/cli.ts con tsx
npm run build    # genera dist/cli.js
npm start        # corre el build
npm run typecheck
npm test
```

Requiere una terminal de al menos 80×24 columnas.

## Estado

**F0 · Motor** — terminal, input, framebuffer y renderer con diff. Un carpincho se mueve por una sala fija con flechas, WASD o HJKL; Ctrl+C o Q restauran la terminal al salir.
