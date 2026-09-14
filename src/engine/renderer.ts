import * as THREE from "three";
import { rgbOf } from "../assets/palette.js";
import type { Framebuffer } from "./framebuffer.js";

// Renderer de Three.js: en vez de convertir el framebuffer a bloques ANSI
// (versión terminal), lo vuelca a un canvas 2D fuera de pantalla que se usa
// como textura de un único plano — un solo draw call, con `NearestFilter`
// para que el pixel art no se suavice (sección 13/14 del documento).
export class Renderer {
  private readonly scene = new THREE.Scene();
  private readonly camera: THREE.OrthographicCamera;
  private readonly webgl: THREE.WebGLRenderer;
  private readonly texture: THREE.CanvasTexture;
  private readonly ctx: CanvasRenderingContext2D;
  private readonly imageData: ImageData;
  private readonly fbWidth: number;
  private readonly fbHeight: number;

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
