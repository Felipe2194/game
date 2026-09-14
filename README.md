# Bosque Oscuro

Roguelike por turnos en pixel art, jugado en el navegador (Vite + Three.js). Entrás, jugás, morís, reintentás.

Un cazador errante entra al Monte Oscuro, un bosque que perdió la luz. 10 pisos generados al azar, muerte permanente, y una partida completa dura entre 5 y 10 minutos.

<!-- TODO: agregar un GIF de una partida acá una vez grabado. -->

Ver [`salamanca-diseno.md`](./salamanca-diseno.md) para el documento de diseño completo.

## Jugar

```sh
npm install
npm run dev
```

Abrí la URL que imprime Vite (por defecto `http://localhost:5173`). Requiere un navegador con soporte WebGL.

### Controles

| Tecla | Acción |
|---|---|
| Flechas / WASD / HJKL | Moverse; moverse hacia un enemigo lo ataca |
| Espacio / `.` | Esperar un turno |
| Enter / `>` | Bajar la escalera |
| 1 · 2 · 3 | Usar el objeto del cinturón |
| M | Ver el mapa completo del piso |
| ? | Ayuda |
| Q | Pausar |

## Desarrollo

```sh
npm install
npm run dev         # servidor de desarrollo de Vite
npm run build       # genera dist/ (sitio estático)
npm run preview     # sirve el build de dist/ localmente
npm run typecheck
npm test
npm run simulate    # bot headless para medir balance (ver tools/simulate.ts)
```

## Licencia

MIT — ver [`LICENSE`](./LICENSE).
