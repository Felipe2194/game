# Salamanca — Documento de diseño

> Título provisional. Roguelike por turnos en pixel art para la terminal. Descargás, jugás, morís, reintentás.

## 1. Pitch

Un carpincho baja a la Salamanca, la cueva del folklore donde se aprenden artes prohibidas. Son 10 pisos generados al azar: ratas y murciélagos cerca de la superficie, apariciones del monte más abajo y un lobizón esperando en el fondo. Si morís, se pierde todo y arrancás de nuevo. Una partida completa dura entre 5 y 10 minutos.

## 2. Principios de diseño

| Principio | Qué implica |
|---|---|
| Una partida, un café | 10 pisos chicos, unos 45 segundos por piso |
| Cada tecla es un turno | Sin reflejos ni tiempos; se puede pausar la vida real en cualquier momento |
| Legible de un vistazo | Sprites de silueta clara, paleta cerrada, log de 2 líneas |
| Muerte permanente, reinicio inmediato | De la pantalla de game over a una partida nueva con una sola tecla |
| Datos, no código | Enemigos, ítems y balance viven en tablas editables |
| Determinista | Todo el azar sale de una semilla, lo que permite tests, simulación y desafío diario |

## 3. Controles

| Tecla | Acción |
|---|---|
| Flechas / WASD / HJKL | Moverse; moverse hacia un enemigo lo ataca |
| Espacio / `.` | Esperar un turno |
| Enter / `>` | Bajar la escalera (hay que estar parado encima) |
| 1 · 2 · 3 | Usar el objeto del cinturón |
| M | Ver el mapa completo del piso |
| ? | Ayuda |
| Q | Salir, con confirmación |
| Ctrl+C | Salida inmediata, siempre restaura la terminal |

Movimiento en 4 direcciones (ver decisiones pendientes).

## 4. Sistema de turnos

1. El jugador hace una acción: moverse, atacar, esperar, usar un objeto o bajar.
2. Si la acción fue inválida (chocar contra una pared), no consume turno.
3. Cada enemigo acumula acciones según su velocidad y actúa:

| Velocidad | Acciones |
|---|---|
| Lenta | 1 cada 2 turnos |
| Normal | 1 por turno |
| Rápida | 2 por turno |

4. Se recalcula el campo de visión y el mapa de distancias, y se redibuja.

## 5. Combate

| Regla | Valor |
|---|---|
| Ataque del jugador | Siempre acierta; daño = ataque |
| Ataque enemigo | Acierta con probabilidad = precisión − 10% × defensa del jugador |
| Daño enemigo | Valor fijo por tipo de enemigo |
| Jugador base | Vida 6 · ataque 1 · defensa 0 · visión 5 |

La defensa baja la probabilidad de que te peguen en lugar de restar daño. Así el poncho sirve contra todos los enemigos, incluso los que pegan 1.

## 6. Enemigos

| Enemigo | Pisos | Vida | Daño | Precisión | Velocidad | Comportamiento |
|---|---|---|---|---|---|---|
| Rata | 1–3 | 1 | 1 | 60% | Normal | Persigue si te ve |
| Murciélago | 1–4 | 1 | 1 | 50% | Rápida | Movimiento errático la mitad de las veces |
| Esqueleto | 3–7 | 3 | 1 | 75% | Normal | Persigue si te ve |
| Familiar (perro negro) | 5–9 | 4 | 2 | 70% | Normal | Te rastrea por olfato hasta 12 casillas, aunque no te vea |
| Luz mala | 6–9 | 2 | 1 | 90% | Lenta | Atraviesa paredes y se ve aunque haya muros de por medio |
| **Lobizón (jefe)** | 10 | 14 | 2 | 80% | Normal | Cada 3 turnos salta hasta 3 casillas en línea recta; el turno anterior se agazapa y lo avisa en el log |

Cantidad por piso: 2 + número de piso, con un máximo de 9. La sala inicial nunca tiene enemigos.

## 7. Objetos

| Objeto | Tipo | Efecto | Aparición |
|---|---|---|---|
| Mate | Cinturón | Cura 2 de vida | 1–2 por piso |
| Vela | Cinturón | Visión 5 → 8 hasta bajar de piso | 30% por piso |
| Alfajor | Inmediato | +1 vida máxima y cura 1 | 1 cada 3 pisos |
| Facón | Equipo | +1 ataque | Garantizado entre pisos 2 y 4 |
| Poncho | Equipo | +1 defensa | Garantizado entre pisos 3 y 6 |
| Monedas | Inmediato | Suman al puntaje | 3–5 por piso |

Los objetos se agarran solos al pisarlos. El cinturón tiene 3 espacios; si está lleno, el objeto queda en el suelo.

## 8. Generación de pisos

| Parámetro | Valor |
|---|---|
| Tamaño del mapa | 28×16 casillas |
| Salas | 5 a 7, de 4–7 × 3–5 casillas, sin superponerse, con 1 casilla de separación |
| Pasillos | En L, conectando salas en orden, más 1 pasillo extra para generar un circuito |
| Inicio | Centro de la primera sala |
| Escalera | Sala más lejana del inicio, medida con BFS |
| Piso 10 | Una sala grande del jefe, sin escalera; derrotarlo es la victoria |
| Validación | Si la escalera no es alcanzable o hay menos de 3 salas, se regenera |

El azar sale de un generador propio con semilla (mulberry32) guardado en el estado. La misma semilla produce la misma partida.

## 9. Visión e inteligencia

**Campo de visión.** Líneas de Bresenham desde el jugador a cada casilla dentro del radio. Cada casilla tiene tres estados:

| Estado | Cómo se dibuja |
|---|---|
| Nunca vista | Color de fondo |
| Recordada | Versión atenuada del tile, sin enemigos ni objetos |
| Visible | Tile completo con lo que haya encima |

Si aparecen artefactos visuales molestos, se reemplaza por shadowcasting simétrico sin tocar el resto del código.

**Persecución.** Un solo mapa de distancias (BFS desde el jugador) por turno sirve para todos los enemigos: cada uno se mueve a la casilla vecina con menor distancia. El familiar usa el mismo mapa aunque no te vea. La luz mala usa distancia en línea recta e ignora paredes.

## 10. Dirección de arte

### Distribución de la terminal (80×24 celdas)

| Filas | Contenido |
|---|---|
| 0 | HUD en texto |
| 1–21 | Área de juego: 42 px de alto con medio bloque `▀` = 7 casillas de 6×6 px |
| 22–23 | Log de mensajes, las 2 últimas líneas |

Horizontalmente entran 13 casillas × 6 px = 78 px, con 1 px de margen por lado. La cámara sigue al jugador y se frena en los bordes del mapa.

HUD de referencia:

```
piso 3  ♥♥♥♥♡♡  atq 2 def 1  [1]mate [2]vela [3]·            oro 12
```

### Paleta (16 colores)

| Clave | Hex | Uso |
|---|---|---|
| · | `#0e0f1a` | Fondo, zonas nunca vistas |
| a | `#1a1c2c` | Piso, sombras profundas |
| b | `#29366f` | Detalles fríos |
| c | `#5d275d` | Murciélago, magia |
| d | `#b13e53` | Vida, ojos de enemigos |
| e | `#ef7d57` | Brillos cálidos, luz mala |
| f | `#ffcd75` | Escalera, oro, velas |
| g | `#a7f070` | Luz mala (núcleo) |
| h | `#38b764` | Veneno, musgo |
| i | `#257179` | Agua, detalles de pared |
| j | `#333c57` | Paredes |
| k | `#8b5a3c` | Carpincho |
| l | `#4e342e` | Madera, mate, sombras marrones |
| m | `#f4f4f4` | Esqueleto, texto |
| n | `#c9a26b` | Mate, poncho |
| o | `#94b0c2` | Borde superior de paredes, metal, rata |

### Atenuación de casillas recordadas

No se dibujan versiones aparte: se aplica una tabla de reemplazo sobre el sprite.

| Original | Recordado |
|---|---|
| o | j |
| j, l | a |
| f, n, e | l |
| a y cualquier otro | fondo |

### Sprites (todos 6×6)

| Grupo | Sprites | Frames |
|---|---|---|
| Tiles | Pared, piso, escalera, sala del jefe (piso decorado) | 1 |
| Jugador | Carpincho (se espeja al ir a la izquierda) | 2 (respira) |
| Enemigos | Rata, murciélago, esqueleto, familiar, luz mala | 2 |
| Jefe | Lobizón normal, agazapado | 2 + 1 |
| Objetos | Mate, vela, alfajor, facón, poncho, moneda | 1 |
| Efectos | Golpe (destello), muerte (humo) | 1–2 |

### Reglas de estilo

- Máximo 4 colores por sprite, más transparente.
- Silueta reconocible sobre el piso (`a`): nada de sprites oscuros sin contorno claro.
- Los enemigos llevan ojos en `d` o `g` para detectarlos rápido.
- Objetos útiles en tonos cálidos (`f`, `n`, `e`); peligros en `c`, `d`, `g`.
- Sin degradados ni antialiasing.

### Animación

El renderer dibuja inmediatamente después de cada tecla y, además, cada ~250 ms para las animaciones de 2 frames. Como solo se escriben las celdas que cambiaron, el consumo es mínimo.

## 11. Pantallas

| Escena | Contenido |
|---|---|
| Menú | Logo, jugar, cómo jugar, récords, salir |
| Jugando | Mapa, HUD, log |
| Mapa | Superposición del piso completo a 2×2 px por casilla (56×32 px), solo lo explorado |
| Ayuda | Controles y leyenda de sprites |
| Game over | Causa ("Te mató un esqueleto en el piso 4"), puntaje, récord, tecla para reintentar |
| Victoria | Lobizón derrotado, estadísticas de la partida |

## 12. Puntaje y guardado

| Concepto | Puntos |
|---|---|
| Por piso alcanzado | 100 |
| Por moneda | 10 |
| Por enemigo derrotado | 5 |
| Victoria | 1000 |

- Archivo: `~/.salamanca/save.json`.
- Contenido: las 5 mejores partidas con fecha, puntaje, piso, causa de muerte y semilla.
- Si falla la lectura o escritura, el juego sigue sin récords y no crashea.

## 13. Stack técnico

| Pieza | Elección |
|---|---|
| Lenguaje | TypeScript |
| Runtime | Node ≥ 18, sin dependencias en runtime |
| Build | tsup → `dist/cli.js` con shebang |
| Desarrollo | tsx |
| Tests | Vitest |
| Distribución | `npx salamanca` (nombre a verificar en npm) + binarios con `bun build --compile` en GitHub Releases |

## 14. Arquitectura

La idea central es que la lógica del juego es pura y no sabe que existe una terminal:

```
tecla ─► Input ─► Acción ─► step(estado, acción) ─► { estado nuevo, eventos }
                                                         │
                          Escena.draw(estado) ─► Framebuffer 80×46 ─► Renderer (diff) ─► ANSI
```

Esto permite tres cosas:

1. **Tests.** Se puede verificar que la escalera siempre es alcanzable en 10.000 semillas.
2. **Simulador.** Un bot juega miles de partidas sin pantalla para medir en qué piso muere la gente y ajustar el balance con números.
3. **Repeticiones y desafío diario.** Semilla más lista de acciones reproduce la partida exacta.

### Diferencias con un juego en tiempo real

- No hay loop a 30 fps: el render se dispara por evento, más un temporizador de animación.
- Se escucha `stdout.on('resize')` para revalidar el tamaño y avisar si la terminal queda chica.

## 15. Estructura de carpetas

```
salamanca/
├── package.json              # "bin": { "salamanca": "dist/cli.js" }
├── tsconfig.json
├── tsup.config.ts
├── README.md
├── src/
│   ├── cli.ts                # chequeos de terminal, arranque, restauración
│   ├── engine/
│   │   ├── terminal.ts       # pantalla alternativa, cursor, tamaño, color, chequeo de ancho
│   │   ├── input.ts          # modo raw, teclas → acciones
│   │   ├── framebuffer.ts    # grilla de índices de paleta
│   │   ├── renderer.ts       # medio bloque + diff + escritura única
│   │   ├── scheduler.ts      # render por evento + tick de animación
│   │   └── text.ts           # HUD, log y textos centrados
│   ├── game/
│   │   ├── config.ts         # constantes base (vida, visión, tamaños)
│   │   ├── rng.ts            # mulberry32 con semilla
│   │   ├── state.ts          # tipos: GameState, Entity, Tile, Item
│   │   ├── step.ts           # step(estado, acción) → estado + eventos
│   │   ├── dungeon/
│   │   │   ├── generate.ts   # salas, pasillos, escalera, validación
│   │   │   └── populate.ts   # enemigos y objetos según el piso
│   │   ├── fov/visibility.ts
│   │   ├── ai/
│   │   │   ├── distance-map.ts
│   │   │   └── behaviors.ts  # perseguir, errático, olfato, atravesar, saltar
│   │   ├── combat.ts
│   │   ├── items.ts          # efectos y cinturón
│   │   └── turns.ts          # velocidades y acumulación de acciones
│   ├── content/
│   │   ├── enemies.ts        # tabla de la sección 6
│   │   ├── items.ts          # tabla de la sección 7
│   │   └── messages.ts       # textos del log y causas de muerte
│   ├── scenes/
│   │   ├── menu.ts
│   │   ├── play.ts
│   │   ├── map-overlay.ts
│   │   ├── help.ts
│   │   ├── gameover.ts
│   │   └── victory.ts
│   ├── ui/
│   │   ├── camera.ts
│   │   ├── hud.ts
│   │   └── log.ts
│   ├── assets/
│   │   ├── palette.ts        # 16 colores, tabla de atenuación, mapeo a 256
│   │   └── sprites/          # tiles.ts, hero.ts, enemies.ts, items.ts, fx.ts
│   └── storage/
│       └── save.ts
├── tools/
│   ├── png-to-sprite.ts      # PNG del modo diseño → sprite en texto
│   ├── preview-sprites.ts    # muestra todos los sprites en la terminal
│   └── simulate.ts           # bot headless para balance
└── test/
    ├── rng.test.ts
    ├── generate.test.ts      # conectividad y escalera alcanzable
    ├── fov.test.ts
    ├── combat.test.ts
    └── step.test.ts
```

## 16. Formatos de datos

### Sprite

```ts
// src/assets/sprites/hero.ts
export const hero = {
  frames: [
    ["....l.", "..kkkk", "kkkkak", "kkkkkl", "kkkkk.", ".l.l.."],
    ["....l.", "..kkkk", "kkkkak", "kkkkkl", "kkkkk.", "l...l."],
  ],
};
```

### Enemigo

```ts
// src/content/enemies.ts
export const enemies = {
  esqueleto: {
    nombre: "un esqueleto",
    verbo: "te golpeó",
    pisos: [3, 7],
    vida: 3,
    dano: 1,
    precision: 0.75,
    velocidad: "normal",
    comportamiento: "perseguir",
    sprite: "esqueleto",
  },
} as const;
```

## 17. Compatibilidad de terminal

| Riesgo | Mitigación |
|---|---|
| Terminal menor a 80×24 | Pantalla de aviso hasta que se agrande |
| Sin truecolor | Detectar `COLORTERM`; si no hay truecolor, usar el mapeo a 256 colores |
| `▀` y `♥` dibujados con ancho doble (configuraciones CJK) | Al arrancar, escribir `▀`, pedir la posición del cursor (`ESC[6n`) y, si avanzó 2 columnas, mostrar aviso |
| Cierre abrupto | Restaurar cursor, pantalla y modo raw en `exit`, `SIGINT`, `SIGTERM` y excepciones no capturadas |

Probar en Windows Terminal, terminal de macOS, iTerm2, GNOME Terminal y la terminal integrada de VS Code.

## 18. Brief para el modo diseño

**Restricciones que no se negocian:** casillas de 6×6 px, la paleta de 16 colores de la sección 10, máximo 4 colores por sprite y fondo transparente.

Qué diseñar:

1. **Hoja de tiles:** pared, piso, escalera y piso decorado del jefe.
2. **Carpincho:** 2 frames mirando a la derecha.
3. **Enemigos:** rata, murciélago, esqueleto, familiar y luz mala con 2 frames cada uno; lobizón con 2 frames más la pose agazapado.
4. **Objetos:** mate, vela, alfajor, facón, poncho y moneda.
5. **Efectos:** golpe y muerte.
6. **Logo** del menú, máximo 60×10 px.
7. **Pantallas de referencia** a 80×46 px: exploración, combate con log, mapa superpuesto y game over.

Las versiones atenuadas no se diseñan: salen de la tabla de la sección 10.

Exportar cada hoja como PNG a escala 1×, sin fondo, para pasarla por `tools/png-to-sprite.ts`.

## 19. Hoja de ruta

| Fase | Entregable | Listo cuando |
|---|---|---|
| F0 · Motor | Terminal, input, framebuffer, renderer con diff, chequeos de compatibilidad | Un sprite se mueve con flechas sin parpadeo y Ctrl+C deja todo limpio |
| F1 · Exploración | Mapa fijo, movimiento, cámara, campo de visión, HUD, log | Se puede recorrer un piso con niebla de guerra |
| F2 · Pisos | Generación con semilla, escalera, validación, tests de conectividad | 10.000 semillas generan pisos válidos |
| F3 · Combate | Turnos, mapa de distancias, rata, murciélago y esqueleto, muerte, game over | Se puede morir de forma justa |
| F4 · Objetos | Cinturón, mate, vela, alfajor, facón y poncho | Hay decisiones reales sobre cuándo curarse |
| F5 · Contenido | Familiar, luz mala, lobizón, victoria, puntaje y récords | Se puede ganar una partida completa |
| F6 · Balance y pulido | Simulador, ajuste de tablas, mapa superpuesto, ayuda, fallback 256 colores | Un jugador promedio llega al piso 5–6 |
| F7 · Publicación | npm, binarios, README con GIF | `npx salamanca` funciona en una máquina limpia |

## 20. Decisiones pendientes

| Decisión | Opciones |
|---|---|
| Nombre y paquete npm | Salamanca (provisional) · otro |
| Temática | Folklore argentino en pisos profundos · mazmorra clásica genérica |
| Movimiento | 4 direcciones (más simple) · 8 direcciones (más táctico, requiere teclas diagonales) |
| Bajar escalera | Con Enter (evita accidentes) · automático al pisarla |
| Sonido | Campana de la terminal en golpes y muerte · silencio |
| Después de la victoria | Fin de partida · modo infinito con dificultad creciente |
