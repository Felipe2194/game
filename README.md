# Salamanca

Roguelike por turnos en pixel art para la terminal. Descargás, jugás, morís, reintentás.

Un carpincho baja a la Salamanca, la cueva del folklore donde se aprenden artes prohibidas. 10 pisos generados al azar, muerte permanente, y una partida completa dura entre 5 y 10 minutos.

<!-- TODO: agregar un GIF de una partida acá una vez grabado (asciinema, terminalizer o similar). -->

Ver [`salamanca-diseno.md`](./salamanca-diseno.md) para el documento de diseño completo.

## Jugar

```sh
npx salamanca
```

Requiere Node ≥ 18 y una terminal de al menos 80×24 columnas. También hay binarios standalone (sin depender de Node) en la sección [Releases](https://github.com/Felipe2194/game/releases) del repo.

### Controles

| Tecla | Acción |
|---|---|
| Flechas / WASD / HJKL | Moverse; moverse hacia un enemigo lo ataca |
| Espacio / `.` | Esperar un turno |
| Enter / `>` | Bajar la escalera |
| 1 · 2 · 3 | Usar el objeto del cinturón |
| M | Ver el mapa completo del piso |
| ? | Ayuda |
| Q / Ctrl+C | Salir |

## Desarrollo

```sh
npm install
npm run dev        # corre src/cli.ts con tsx
npm run build      # genera dist/cli.js
npm start          # corre el build
npm run typecheck
npm test
npm run simulate   # bot headless para medir balance (ver tools/simulate.ts)
```

## Licencia

MIT — ver [`LICENSE`](./LICENSE).
