# Salamanca — Documento de diseño

> Título provisional. Roguelike por turnos en pixel art para la terminal. Descargás, jugás, morís, reintentás.

## 1. Pitch

Un cazador errante entra al Monte Oscuro, un bosque que perdió la luz. Son 10 zonas generadas al azar (`state.floor` internamente sigue siendo un número de "piso", pero en pantalla y en el texto del juego siempre es "zona" — bajar escaleras no encaja con estar en un bosque): escarabajos y cuervos cerca de la entrada, espíritus corrompidos y lobos más adentro, y el Alfa esperando en el fondo. Si morís, se pierde todo y arrancás de nuevo. Una partida completa dura entre 5 y 10 minutos.

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
| Enter / `>` | Seguir el sendero a la próxima zona (hay que estar parado encima) |
| 1 · 2 · 3 | Usar el objeto del cinturón |
| M | Ver el mapa completo de la zona |
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

Retemado sobre la referencia de arte "GANK — El Monte Oscuro" (`sheet.png`, ver sección 10).

| Enemigo | Pisos | Vida | Daño | Precisión | Velocidad | Comportamiento |
|---|---|---|---|---|---|---|
| Escarabajo de río | 1–3 | 1 | 1 | 60% | Normal | Persigue si te ve |
| Cuervo sombrío | 1–4 | 1 | 1 | 50% | Rápida | Movimiento errático la mitad de las veces |
| Espíritu del bosque | 3–7 | 3 | 1 | 75% | Normal | Persigue si te ve |
| Lobo acechador | 5–9 | 4 | 2 | 70% | Normal | Te rastrea por olfato hasta 12 casillas, aunque no te vea |
| Fuego fatuo | 6–9 | 2 | 1 | 90% | Lenta | Atraviesa paredes y se ve aunque haya muros de por medio |
| **El Alfa / Gran Draco (jefe)** | 10 | 14 | 2 | 80% | Normal | Cada 3 turnos salta hasta 3 casillas en línea recta; el turno anterior se agazapa y lo avisa en el log |

Cantidad por piso: 2 + número de piso, con un máximo de 9. La sala inicial nunca tiene enemigos.

## 7. Objetos

| Objeto | Tipo | Efecto | Aparición |
|---|---|---|---|
| Poción de vida | Cinturón | Cura 2 de vida (no se puede usar con la vida al máximo, para no perderla sin curar nada) | 1–2 por piso |
| Antorcha | Cinturón | Visión 5 → 8 hasta bajar de piso | 30% por piso |
| Ración de carne | Inmediato | +1 vida máxima y cura 1 | 1 cada 3 pisos |
| Daga de caza | Equipo | +1 ataque | Garantizado entre pisos 2 y 4 |
| Capa de cuero | Equipo | +1 defensa | Garantizado entre pisos 3 y 6 |
| Monedas | Inmediato | Suman al puntaje | 3–5 por piso |
| Cofre | Cofre | 65% da 4–9 monedas, 35% "está vacío" | 1 cada 2 pisos |

Los objetos se agarran solos al pisarlos. El cinturón tiene 3 espacios; si está lleno, el objeto queda en el suelo. El cofre se resuelve en el momento (no ocupa espacio): o suma monedas o el log dice que estaba vacío — `game/items.ts`, `content/items.ts` (`COFRE_*`).

**Arbustos.** `populateFloor` reserva unas pocas casillas de piso (hasta 5, `game/dungeon/populate.ts`) antes de repartir enemigos y objetos; los primeros enemigos/objetos en pedir una casilla "roban" un arbusto en vez de una del pool general. El resultado: algunos arbustos esconden algo y otros quedan vacíos, sin que el jugador pueda distinguirlos desde afuera. Puramente de posicionamiento — el arbusto no bloquea el paso ni agrega un paso de "buscar", es la misma casilla de siempre con un sprite de arbusto dibujado detrás (`Renderer`, `behind: true`).

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
| Recordada | Tile a brillo bajo fijo, sin enemigos ni objetos |
| Visible | Tile a brillo según distancia (efecto linterna), con lo que haya encima |

Si aparecen artefactos visuales molestos, se reemplaza por shadowcasting simétrico sin tocar el resto del código.

**Efecto linterna (`engine/lightmap.ts`).** En vez de remapear cada color a otra entrada de la paleta (versión vieja: tabla `dimmed` en `palette.ts`, ya no existe), `drawPlayScene` calcula un brillo 0–1 por tile visible — 1 pegado al jugador, cayendo hasta un mínimo (~0.5) en el borde del radio de visión — y un brillo fijo bajo (~0.28) para las recordadas. `Renderer.render` multiplica el color real del tile por ese brillo al armar la textura, así una casilla recordada sigue siendo el mismo color de piso/pared, solo más oscuro — no una silueta distinta ni negro puro. Los sprites de personajes (`Renderer.syncEntities`) se tiñen con el mismo brillo del tile en el que están parados, para que no desentonen con el piso iluminado. Antorcha activa = radio de visión más grande (5→8) = el mismo degradé llega más lejos, sin lógica aparte.

**Grilla.** `Renderer.render` oscurece el borde superior/izquierdo de cada tile un 18% (`GRID_EDGE_FACTOR`). Sin esto, sprites más grandes que un tile (todos, desde el retema a imágenes reales) hacían difícil saber en qué casilla exacta estaba parada una criatura — y por lo tanto a qué casilla había que moverse para atacarla.

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

### Tiles (6×6, framebuffer de paleta)

Pared, piso y escalera siguen siendo color plano de la paleta de 16 colores, dibujados en el framebuffer (`Framebuffer.fillTile`) — sección 14. No tienen arte propio todavía (pendiente: sala del jefe con piso decorado, efectos de golpe/muerte).

### Personajes, criaturas y objetos (imágenes reales, `public/sprites/`)

> **Referencia de arte "GANK — El Monte Oscuro" (`sheet.png`).** A diferencia de los tiles, el jugador, los enemigos, el jefe y los objetos (salvo la moneda) **no** son pixel art de 6×6 generado a mano: son recortes reales de `sheet.png`, con el fondo de cada tarjeta convertido a transparencia, servidos como PNG desde `public/sprites/` y dibujados por `Renderer.syncEntities` como planos de `THREE.Mesh` (no `THREE.Sprite`: ver nota más abajo) sobre el framebuffer de tiles — ver `scenes/play.ts` (`playEntitySprites`) y sección 14. Cada uno tiene una altura fija en tiles (`heightTiles`); el ancho sale del aspect ratio real de la imagen, y se ancla por el borde inferior del tile ("los pies").
>
> Los pinos/tranqueras/ríos (paredes) y arbustos/cofre no vienen de `sheet.png` — no hay referencia de mazmorra/bosque en la hoja original — y se dibujaron a mano como pixel art chico (grillas de texto → PNG con `sharp`, mismo criterio que la moneda).

| Grupo | Sprite | Archivo | Alto (tiles) | Frames |
|---|---|---|---|---|
| Jugador | Cazador errante (se espeja al ir a la izquierda) | `hero-0.png` / `hero-1.png` | 1.6 | 2 (respira) |
| Jugador +daga | Ídem, con la daga en la mano (`hasDaga`) | `hero-0-daga.png` / `hero-1-daga.png` | 1.6 | 2 |
| Jugador +capa/antorcha | Ídem, con un ícono de `capa.png`/`antorcha.png` pegado al lado (no integrado al sprite — ver nota) | — | 0.5 | 1 |
| Enemigo | Escarabajo de río | `escarabajo.png` | 0.9 | 1 |
| Enemigo | Cuervo sombrío | `cuervo.png` | 1.0 | 1 |
| Enemigo | Espíritu del bosque | `espiritu.png` | 1.4 | 1 |
| Enemigo | Lobo acechador | `lobo.png` | 1.3 | 1 |
| Enemigo | Fuego fatuo | `fuego-fatuo.png` | 1.0 | 1 |
| Jefe | El Alfa / Gran Draco (normal / agazapado) | `alfa.png` | 1.8 / 1.5 | 1 |
| Objeto | Poción de vida | `pocion.png` | 0.8 | 1 |
| Objeto | Antorcha | `antorcha.png` | 0.8 | 1 |
| Objeto | Ración de carne | `racion.png` | 0.8 | 1 |
| Objeto | Daga de caza | `daga.png` | 0.8 | 1 |
| Objeto | Capa de cuero | `capa.png` | 0.8 | 1 |
| Objeto | Moneda (sin arte en `sheet.png`, ícono generado aparte) | `moneda.png` | 0.55 | 1 |
| Objeto | Cofre (sin arte en `sheet.png`) | `cofre.png` | 0.85 | 1 |
| Pared (bosque) | Pino / tranquera / río, elegido por hash de posición | `pino.png` / `tranquera.png` / `rio.png` | 1.5 / 1.0 / 1.05 | 1 |
| Decoración | Arbusto (puede esconder un enemigo/objeto en la misma casilla) | `arbusto.png` | 0.75 | 1 |

Los enemigos no tienen animación propia todavía (un solo frame, quietos); solo el jugador tiene 2 frames (respira/llama parpadea), recortados de la fila "Animaciones → Quieto" de `sheet.png`. El jefe reutiliza el mismo `alfa.png` para el estado "agazapado", solo un poco más chico (1.5 en vez de 1.8 tiles) como telegraph visual, ya que la referencia no incluye una pose agachada aparte.

**Equipo progresivo (`hasDaga`/`hasCapa`, derivados de `player.attack`/`player.defense`).** Se probó integrar la capa como prenda puesta sobre el cuerpo (superpuesta detrás, recolor del sayo existente) y no se logró que se viera bien a este tamaño sin arte hecho a mano por combinación — cualquier intento quedaba sucio o directamente irreconocible. Se optó por: la daga sí queda dibujada en la mano (compuesta una sola vez sobre `hero-0.png`/`hero-1.png`, alineada a la mancha de piel que marca la mano), y la capa/antorcha se muestran como un ícono chico pegado al lado del personaje en vez de "puestos" — menos prolijo, pero legible y sin arruinar el sprite base. La antorcha "prendida" se muestra mientras `state.belt` tiene una antorcha o la visión está aumentada; no hay una versión "apagada" distinta del sprite base porque la pose de reposo del sheet no muestra el fuego con claridad para empezar.

> **Nota (Sprite vs Mesh para espejar).** `THREE.Sprite`/`SpriteMaterial` calculan el tamaño en su shader con `length()` sobre la escala del objeto, que descarta el signo — poner `scale.x` negativo para espejar un sprite mirando a la izquierda no hacía nada (bug real, reportado por el usuario: el cazador "siempre mira a la derecha"). Como la cámara es ortográfica y no rota nunca, un plano de `THREE.Mesh` de frente se ve igual que un sprite/billboard acá, y si respeta el signo de la escala — por eso el renderer usa `Mesh` + una `PlaneGeometry(1,1)` compartida en vez de `Sprite`.

### Reglas de estilo (tiles y assets nuevos)

- Tiles: máximo 4 colores por sprite, más transparente; sin degradados ni antialiasing (regla original, sección 10 histórica).
- Sprites de `public/sprites/`: recorte ajustado al contenido real (sin franjas de fondo ni líneas divisorias del sheet — ver nota abajo), fondo transparente, silueta reconocible sobre el piso oscuro.

> **Nota (líneas divisorias del sheet y alfa parcial).** `sheet.png` separa cada tarjeta con una línea fina. Si un recorte queda demasiado pegado al borde de su tarjeta, esa línea sobrevive el recorte como una columna opaca y gris aislada — invisible a simple vista en el PNG pero muy notoria en el juego, ya escalada. Más en general: el recorte por color-distancia contra el fondo de la tarjeta deja muchos píxeles internos (sombras oscuras del propio personaje, cercanas en color al fondo casi negro) con alfa parcial en vez de 0 o 255 — invisible en el PNG a simple vista, pero se nota como un aura semitransparente/lavada cuando esa zona queda sobre un tile claro (reportado por el usuario como "el personaje se ve transparente cerca de una pared"). La corrección que funcionó: binarizar el alfa de todo el sprite (todo <130 → 0, todo ≥130 → 255) en vez de dejar la transición suave del keying original, y recién ahí volver a recortar al contenido real. Antes de dar un sprite por terminado conviene revisar su histograma de alfa (¿hay valores entre 1 y 254?), no solo mirar el PNG de reojo.

**Rehecho de `pino.png`/`arbusto.png`/`tranquera.png`/`rio.png`/`cofre.png` (pedido explícito: "estilo Pokémon Rojo Fuego").** La primera versión (grillas de texto tipeadas a mano, ver `moneda.png`) quedaba demasiado tosca/geométrica para pasar como tileset. La segunda versión genera las formas por código en vez de tipearlas: 2–4 círculos superpuestos (radios y centros a mano) para las copas redondeadas de árbol/arbusto, con luz calculada por posición relativa al centro de cada círculo (`(-dx-dy)/radio` — positivo es arriba-izquierda) para decidir base/luz/sombra, más un contorno de 1 px automático (cualquier pixel del relleno con un vecino de 4 direcciones afuera de la forma). Tranquera y río siguen siendo grilla a mano pero con 3–4 tonos en vez de 2 y ese mismo contorno. Da un resultado mucho más redondeado y prolijo con relativamente poco código; conviene reusar el mismo enfoque (círculos + luz por posición + contorno automático) para cualquier decoración nueva en vez de tipear la grilla directamente.

### Animación

Estilo "Pokémon" (pedido explícito): el cazador solo alterna frame ("camina") mientras se desliza a la casilla siguiente, y queda en un único frame fijo el resto del tiempo — nada de parpadeo constante en reposo. Se sacó el `state.animFrame`/`setInterval` de la versión anterior (parpadeaba todo el tiempo, no solo al moverse).

1. **Deslizamiento entre casillas + frame de caminata.** La lógica sigue siendo instantánea (`step()` devuelve la posición final de una), pero `main.ts` guarda, por cada movimiento real de jugador o enemigo, un `{from, to, start}` y lo interpola con un `requestAnimationFrame` continuo (`ease-out cúbico`, ~130 ms) — así un personaje se desliza a la casilla nueva en vez de teletransportarse. Mientras dura ese deslizamiento, `currentHeroMotion` en `main.ts` también calcula qué mitad del trayecto va (`hero-0.png` primera mitad, `hero-1.png` segunda) y se lo pasa a `playEntitySprites` como `heroFrame` — de ahí sale el "paso". Quieto, siempre es `hero-0.png` (o `hero-0-daga.png` si tiene la daga). Solo se anima si el piso no cambió (bajar escalera o reiniciar la partida deja de animar y arranca en la posición final directamente, no tendría sentido deslizar entre mazmorras distintas).

El framebuffer de tiles (paredes/piso/escalera) y el `Lightmap` solo se recalculan cuando cambia el estado lógico (una vez por tecla), no en cada frame de la animación — lo único que corre a 60 fps es el `requestAnimationFrame` reposicionando los sprites de personajes y volviendo a pedirle a Three.js que dibuje.

## 11. Pantallas

| Escena | Contenido |
|---|---|
| Portada | Cazador errante de fondo (`hero-0.png`, cuadro fijo sin grilla/niebla) + título y controles; cualquier tecla o click arranca la partida |
| Jugando | Mapa con efecto linterna, HUD, log |
| Mapa | Superposición del piso completo a 2×2 px por casilla (56×32 px), solo lo explorado |
| Ayuda | Controles y leyenda de sprites |
| Game over | Causa ("Te mató un espíritu del bosque en el piso 4"), puntaje, récord, tecla para reintentar |
| Victoria | Cuadro fijo con el cazador y el Alfa derrotado detrás del texto (mismo mecanismo que la portada), puntaje y récords |

La Portada y la Victoria comparten `renderTableau`/`victoryTableau` en `main.ts`: un piso liso a brillo pleno (sin grilla ni niebla) con uno o más sprites puestos a mano — no pasan por `drawPlayScene` ni por el `Lightmap`. El menú de la sección original (jugar/cómo jugar/récords/salir como opciones separadas) sigue sin implementarse; la portada de hoy es solo "portada + arrancar".

## 12. Puntaje y guardado

| Concepto | Puntos |
|---|---|
| Por piso alcanzado | 100 |
| Por moneda | 10 |
| Por enemigo derrotado | 5 |
| Victoria | 1000 |

- Almacenamiento: `localStorage` del navegador (clave `bosque-oscuro:save`), por origen — no se comparte entre dispositivos ni navegadores.
- Contenido: las 5 mejores partidas con fecha, puntaje, piso, causa de muerte y semilla.
- Si falla la lectura o escritura, el juego sigue sin récords y no crashea.

## 13. Stack técnico

| Pieza | Elección |
|---|---|
| Lenguaje | TypeScript |
| Build / dev server | Vite |
| Renderizado | Three.js (WebGL), `OrthographicCamera` |
| Texturas | `THREE.NearestFilter` en mag/min para conservar el pixel art sin suavizado |
| Input | Eventos nativos del navegador (`window.addEventListener('keydown')`) |
| Tests | Vitest |
| Distribución | Despliegue automático en Vercel (sitio estático generado por `vite build`) |

> Se abandona el runtime exclusivo de Node (CLI), `tsup`/`dist/cli.js` y la distribución por `npx` o binarios compilados. `tsx` se conserva solo para scripts internos (`tools/simulate.ts`).

## 14. Arquitectura

La idea central se mantiene: la lógica del juego es pura y no sabe que existe un canvas ni WebGL.

```
tecla ─► Input (DOM) ─► Acción ─► step(estado, acción) ─► { estado nuevo, eventos }
                                                              │
                          Escena.draw(estado) ─► Framebuffer (grilla de paleta) ─► Renderer Three.js (escena WebGL)
```

Esto permite tres cosas:

1. **Tests.** Se puede verificar que la escalera siempre es alcanzable en 10.000 semillas.
2. **Simulador.** Un bot juega miles de partidas sin pantalla para medir en qué piso muere la gente y ajustar el balance con números.
3. **Repeticiones y desafío diario.** Semilla más lista de acciones reproduce la partida exacta.

El framebuffer (grilla de índices de paleta) sigue siendo la interfaz entre el juego y la presentación, acompañado ahora de un `Lightmap` (brillo 0–1 por tile, sección 9) para el efecto linterna. En la implementación actual el renderer vuelca esa grilla entera a un canvas 2D fuera de pantalla usado como textura (`THREE.CanvasTexture`, `NearestFilter`) de un único plano en la escena, multiplicando cada pixel por el brillo del `Lightmap` y oscureciendo el borde de cada tile para la grilla — un solo draw call, sin diff, porque a 78×42 px volcarla entera es barato. El HUD y el log ya no son parte del framebuffer: son texto en el DOM superpuesto al canvas (`#hud`, `#log`, `#overlay` en `index.html`), que sí solo se actualiza cuando cambia.

### Diferencias con la versión de terminal

- No hay loop a 30 fps ni `requestAnimationFrame`: igual que en la terminal, el render se dispara por evento (tecla), más el temporizador de animación (~250 ms) del `Scheduler` para los sprites de 2 frames — ambos llaman a `renderer.render()` directamente.
- El resize se escucha vía `window.addEventListener('resize')` en vez de `stdout.on('resize')`, y reescala el canvas a un múltiplo entero del framebuffer en lugar de validar columnas/filas de terminal.
- La atenuación de casillas recordadas y el field of view (Bresenham) son exactamente la misma lógica matemática; solo cambia el paso final de color→pixel (canvas 2D en vez de ANSI truecolor/256).

## 15. Estructura de carpetas

```
salamanca/
├── package.json
├── vite.config.ts
├── index.html                # punto de entrada de Vite, monta <div id="app">
├── tsconfig.json
├── README.md
├── src/
│   ├── main.ts                # arranque: framebuffer + renderer + scheduler + input, overlay DOM (#hud/#log/#overlay)
│   ├── engine/
│   │   ├── input.ts           # listeners del DOM (`keydown`), teclas → acciones
│   │   ├── framebuffer.ts     # grilla de índices de paleta (igual que antes)
│   │   ├── renderer.ts        # Three.js: framebuffer → canvas 2D → CanvasTexture (NearestFilter) sobre un plano
│   │   └── scheduler.ts       # render por evento + tick de animación
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
│   │   ├── palette.ts        # 16 colores, tabla de atenuación
│   │   └── sprites/          # items.ts: moneda (único sprite de 6×6 que queda)
│   └── storage/
│       └── save.ts           # récords en localStorage (sección 12)
├── public/
│   └── sprites/               # PNG reales recortados de sheet.png (hero, enemigos, jefe, objetos)
├── tools/
│   └── simulate.ts           # bot headless para balance
└── test/
    ├── rng.test.ts
    ├── generate.test.ts      # conectividad y escalera alcanzable
    ├── fov.test.ts
    ├── combat.test.ts
    └── step.test.ts
```

## 16. Formatos de datos

### Sprite de tile (pixel art de 6×6, solo la moneda)

```ts
// src/assets/sprites/items.ts
export const monedaSprite = {
  frames: [[".ffff.", ".fnnf.", ".fnnf.", ".ffff.", "......"]],
};
```

### Sprite de personaje/criatura/objeto (imagen real, el resto)

```ts
// src/engine/renderer.ts — lo que arma scenes/play.ts (playEntitySprites)
export interface EntitySpritePlacement {
  image: string; // ruta bajo public/sprites/, p. ej. "/sprites/hero-0.png"
  tileX: number; // columna de tile en vista de cámara
  tileY: number; // fila de tile en vista de cámara
  heightTiles: number; // alto visual; el ancho sale del aspect ratio real
  flipX?: boolean;
}
```

### Enemigo

```ts
// src/content/enemies.ts
export const enemies = {
  espiritu: {
    nombre: "un espíritu del bosque",
    verbo: "te golpeó",
    pisos: [3, 7],
    vida: 3,
    dano: 1,
    precision: 0.75,
    velocidad: "normal",
    comportamiento: "perseguir",
    sprite: "espiritu",
  },
} as const;
```

## 17. Compatibilidad de navegador

| Riesgo | Mitigación |
|---|---|
| Sin soporte WebGL | Three.js tira `WebGLRenderer` si falla; pendiente: pantalla de aviso explícita en vez de que la página quede en blanco |
| Ventana muy angosta (celular) | `Renderer.resize()` reescala el canvas a un múltiplo entero del framebuffer, con mínimo 1×; el HUD (`white-space: pre`) puede necesitar scroll horizontal en pantallas muy chicas — pendiente de ajuste fino |
| `localStorage` bloqueado o en modo privado | `storage/save.ts` atrapa la excepción; el juego sigue sin récords (sección 12) |
| Teclas del juego interfieren con atajos del navegador | `engine/input.ts` llama `preventDefault()` solo en las teclas que reconoce (flechas, WASD, etc.) |

Probar en Chrome, Firefox, Safari y Edge de escritorio; el soporte táctil/móvil todavía no está implementado (el juego es solo de teclado).

## 18. Pipeline de assets (`public/sprites/`)

Superado el brief original de "modo diseño" (pixel art de 6×6 dibujado a mano): jugador, enemigos, jefe y objetos salen directamente de `sheet.png` (la referencia de arte "GANK — El Monte Oscuro"), recortados y procesados así:

1. **Recortar** la tarjeta del personaje/objeto en `sheet.png` (coordenadas a ojo, iterando con capturas hasta encajar bien).
2. **Quitar el fondo:** el fondo de cada tarjeta es casi negro pero no un color parejo; se mide por color-distancia contra las 4 esquinas del recorte y se pasa a alfa con una transición suave (no todo o nada), para no dejar un borde duro.
3. **Endurecer y recortar al contenido real:** todo alfa por debajo de un umbral pasa a 0, y se recorta a la caja del contenido opaco restante (+2 px de margen). Esto saca el "fondo casi transparente" que el paso 2 deja.
4. **Revisar las columnas de borde** (ver nota de la sección 10): las tarjetas de `sheet.png` están separadas por una línea fina, y si el recorte del paso 1 queda pegado a una tarjeta vecina, esa línea sobrevive los pasos 2–3 como una columna angosta, opaca, de saturación muy baja (gris) — se nota poco en el PNG pero mucho ya escalada en el juego. Se detecta buscando columnas cerca de los bordes que sean mayormente opacas y de baja saturación, aisladas del resto del sprite por transparencia; se borran y se vuelve a recortar al contenido real.
5. Copiar el PNG final a `public/sprites/<nombre>.png` y sumarlo a las tablas de `scenes/play.ts` (`ENEMY_SPRITE`/`ITEM_SPRITE`/hero) con su `heightTiles`.

Sigue pendiente (no hay referencia en `sheet.png`): tiles decorativos (piso de la sala del jefe), efectos de golpe/muerte, logo del menú, y animación propia de los enemigos (hoy tienen un solo frame; solo el jugador respira).

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
| F8 · Migración a web | Vite + Three.js reemplazan terminal/ANSI; retema visual completo a "GANK — Monte Oscuro" a partir de `sheet.png` (jugador, enemigos, jefe y objetos como imágenes reales en `public/sprites/`); récords a `localStorage`; deploy a Vercel | El juego se juega en el navegador, con los gráficos de `sheet.png`, y el link de Vercel funciona en una máquina limpia |

## 20. Decisiones pendientes

| Decisión | Opciones | Estado |
|---|---|---|
| Nombre y paquete npm | Salamanca (provisional) · otro | Paquete sigue llamándose `salamanca` (metadata interna); el juego en pantalla es "Bosque Oscuro" / "GANK" — falta unificar si se publica más ampliamente |
| Temática | Folklore argentino en pisos profundos · mazmorra clásica genérica | **Resuelto:** "GANK — El Monte Oscuro", a partir de `sheet.png` (F8) |
| Movimiento | 4 direcciones (más simple) · 8 direcciones (más táctico, requiere teclas diagonales) | Pendiente — sigue en 4 direcciones |
| Bajar escalera | Con Enter (evita accidentes) · automático al pisarla | **Resuelto:** con Enter |
| Sonido | Campana de la terminal en golpes y muerte · silencio | Pendiente — no aplica igual en la versión web (no hay campana de terminal); a definir con Web Audio |
| Después de la victoria | Fin de partida · modo infinito con dificultad creciente | Pendiente — sigue en fin de partida |
