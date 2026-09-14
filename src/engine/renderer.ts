import * as THREE from "three";
import { rgbOf } from "../assets/palette.js";
import { TILE_SIZE } from "../game/config.js";
import type { Framebuffer } from "./framebuffer.js";

// Un personaje/criatura/objeto a dibujar sobre el framebuffer de tiles,
// como imagen real (public/sprites/) en vez de pixel art de 6×6 — ver
// EntitySprite en scenes/play.ts. `tileX`/`tileY` son coordenadas de tile
// en vista de cámara (mismas unidades que el framebuffer / TILE_SIZE);
// el sprite se ancla por el borde inferior del tile ("los pies").
export interface EntitySpritePlacement {
  image: string;
  tileX: number;
  tileY: number;
  heightTiles: number;
  flipX?: boolean;
}

const textureLoader = new THREE.TextureLoader();
const textureCache = new Map<string, THREE.Texture>();

function loadSpriteTexture(path: string): THREE.Texture {
  let texture = textureCache.get(path);
  if (!texture) {
    texture = textureLoader.load(path);
    // Nearest al agrandar (pixel art nítido); lineal al achicar (evita el
    // ruido de aliasing cuando un sprite se ve más chico que su imagen
    // nativa, p. ej. la moneda).
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.LinearFilter;
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.generateMipmaps = false;
    textureCache.set(path, texture);
  }
  return texture;
}

// Renderer de Three.js: el framebuffer de tiles (paleta de 16 colores) se
// vuelca a un canvas 2D fuera de pantalla usado como textura de un único
// plano de fondo — con `NearestFilter` para que el pixel art no se
// suavice (sección 13/14 del documento). Los personajes/criaturas/objetos
// se dibujan aparte, como sprites de Three.js con imágenes reales
// (public/sprites/), sobre ese fondo.
export class Renderer {
  private readonly scene = new THREE.Scene();
  private readonly camera: THREE.OrthographicCamera;
  private readonly webgl: THREE.WebGLRenderer;
  private readonly texture: THREE.CanvasTexture;
  private readonly ctx: CanvasRenderingContext2D;
  private readonly imageData: ImageData;
  private readonly fbWidth: number;
  private readonly fbHeight: number;
  private readonly entityPool: THREE.Sprite[] = [];

  constructor(canvas: HTMLCanvasElement, fbWidth: number, fbHeight: number) {
    this.fbWidth = fbWidth;
    this.fbHeight = fbHeight;

    this.webgl = new THREE.WebGLRenderer({ canvas, antialias: false });
    this.webgl.setPixelRatio(1);

    const buffer = document.createElement("canvas");
    buffer.width = fbWidth;
    buffer.height = fbHeight;
    const ctx = buffer.getContext("2d");
    if (!ctx) throw new Error("No se pudo crear el contexto 2D del framebuffer.");
    this.ctx = ctx;
    this.imageData = ctx.createImageData(fbWidth, fbHeight);

    this.texture = new THREE.CanvasTexture(buffer);
    this.texture.magFilter = THREE.NearestFilter;
    this.texture.minFilter = THREE.NearestFilter;
    this.texture.colorSpace = THREE.SRGBColorSpace;

    const material = new THREE.MeshBasicMaterial({ map: this.texture });
    const geometry = new THREE.PlaneGeometry(fbWidth, fbHeight);
    this.scene.add(new THREE.Mesh(geometry, material));

    this.camera = new THREE.OrthographicCamera(
      -fbWidth / 2,
      fbWidth / 2,
      fbHeight / 2,
      -fbHeight / 2,
      0,
      1,
    );
    this.camera.position.z = 1;
  }

  // Reescala el canvas a un múltiplo entero del framebuffer para que cada
  // pixel de juego ocupe la misma cantidad de pixels de pantalla.
  resize(cssWidth: number, cssHeight: number): void {
    const scale = Math.max(
      1,
      Math.floor(Math.min(cssWidth / this.fbWidth, cssHeight / this.fbHeight)),
    );
    this.webgl.setSize(this.fbWidth * scale, this.fbHeight * scale);
  }

  // Actualiza los sprites de personajes/criaturas/objetos (pool reutilizado
  // entre frames, sin recrear meshes). Se llama antes de `render()`.
  syncEntities(placements: EntitySpritePlacement[]): void {
    while (this.entityPool.length < placements.length) {
      const sprite = new THREE.Sprite(
        new THREE.SpriteMaterial({ transparent: true, alphaTest: 0.3, depthWrite: false }),
      );
      this.scene.add(sprite);
      this.entityPool.push(sprite);
    }

    for (let i = 0; i < this.entityPool.length; i++) {
      const sprite = this.entityPool[i]!;
      const placement = placements[i];
      if (!placement) {
        sprite.visible = false;
        continue;
      }
      sprite.visible = true;

      const texture = loadSpriteTexture(placement.image);
      const material = sprite.material;
      if (material.map !== texture) material.map = texture;

      const img = texture.image as { width?: number; height?: number } | undefined;
      const aspect = img?.width && img?.height ? img.width / img.height : 1;
      const heightWorld = placement.heightTiles * TILE_SIZE;
      const widthWorld = heightWorld * aspect;
      sprite.scale.set(placement.flipX ? -widthWorld : widthWorld, heightWorld, 1);

      // Ancla el sprite por el borde inferior del tile ("los pies").
      const centerXpx = (placement.tileX + 0.5) * TILE_SIZE;
      const bottomYpx = (placement.tileY + 1) * TILE_SIZE;
      const worldX = centerXpx - this.fbWidth / 2;
      const worldY = this.fbHeight / 2 - bottomYpx + heightWorld / 2;
      sprite.position.set(worldX, worldY, 0.1);
    }
  }

  render(fb: Framebuffer): void {
    const data = this.imageData.data;
    for (let y = 0; y < this.fbHeight; y++) {
      for (let x = 0; x < this.fbWidth; x++) {
        const { r, g, b } = rgbOf(fb.get(x, y));
        const i = (y * this.fbWidth + x) * 4;
        data[i] = r;
        data[i + 1] = g;
        data[i + 2] = b;
        data[i + 3] = 255;
      }
    }
    this.ctx.putImageData(this.imageData, 0, 0);
    this.texture.needsUpdate = true;
    this.webgl.render(this.scene, this.camera);
  }
}
