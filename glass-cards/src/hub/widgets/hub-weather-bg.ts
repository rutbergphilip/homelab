import { html, css, nothing, type PropertyValues } from 'lit';
import { property, state } from 'lit/decorators.js';
import { GlassBaseElement } from '../../glass-base-element.js';
import {
  conditionScene,
  skyStops,
  elevBand,
  cloudColors,
  clipForScene,
  type SceneSpec,
  type ElevBand,
} from '../weather-model.js';
import { getForcedCondition } from '../weather-settings.js';
import { CloudShader } from './cloud-shader.js';
import type { HubTheme } from '../theme-controller.js';

const DPR_CAP = 1.5;
const MAX_DT = 0.05; // clamp frame delta (s) so tab-switch jumps don't teleport particles
const CLIP_BASE = '/local/glass-cards/weather'; // baked by scripts/fetch-weather-clips.sh

// Parallax depth layers: far → near.
const DEPTH = [
  { scale: 0.55, alpha: 0.3, speed: 0.6 },
  { scale: 0.8, alpha: 0.55, speed: 0.85 },
  { scale: 1.15, alpha: 0.9, speed: 1.15 },
];

interface Drop { x: number; y: number; layer: number; jl: number; js: number; ja: number }
interface Flake { x: number; y: number; r: number; phase: number; rot: number; rotSpd: number; layer: number }
interface Stone { x: number; y: number; vy: number; vx: number; r: number; bounced: boolean }
interface Splash { x: number; y: number; r: number; life: number }
interface Cloud { x: number; y: number; scale: number; spd: number; alpha: number }
interface Star { x: number; y: number; r: number; phase: number }

/**
 * Full-bleed animated weather scene behind the Hem page: CSS gradient sky
 * (crossfaded on change) + one particle canvas. The rAF loop runs ONLY while
 * `active` (Hem is the settled page), the document is visible, and the
 * element is connected — transitions are logged for verification.
 */
export class HubWeatherBg extends GlassBaseElement {
  @property({ attribute: false }) entity!: string;
  @property({ attribute: false }) theme: HubTheme = 'natt';
  @property({ attribute: false }) active = false;

  // Two stacked sky layers for gradient crossfades.
  @state() private _skyA = '';
  @state() private _skyB = '';
  @state() private _frontA = true;

  // Two stacked stock-footage loops, crossfaded on clip change. Empty src =
  // slot unmounted. When both are empty the shader/sprite path takes over.
  @state() private _vidSrcA = '';
  @state() private _vidSrcB = '';
  @state() private _vidFrontA = true;

  private _activeVidSrc = '';
  private _videoDead = false; // a clip 404'd/failed → shader for the session
  private _vidSwapTimer?: number;
  private _band: ElevBand = 'night';
  private _clipName: string | null = null;

  private _canvas?: HTMLCanvasElement;
  private _ctx?: CanvasRenderingContext2D;
  private _glCanvas?: HTMLCanvasElement;
  private _shader?: CloudShader;
  private _ro?: ResizeObserver;
  private _w = 0; // CSS px
  private _h = 0;
  private _dpr = 1;

  private _running = false;
  private _raf = 0;
  private _last = 0;
  private _t = 0; // scene clock (s)

  private _scene: SceneSpec = conditionScene('cloudy');
  private _sceneKey = '';

  private _drops: Drop[] = [];
  private _flakes: Flake[] = [];
  private _stones: Stone[] = [];
  private _splashes: Splash[] = [];
  private _clouds: Cloud[] = [];
  private _stars: Star[] = [];
  private _fogOffsets = [0, 0, 0];
  private _cloudSprite?: HTMLCanvasElement;
  private _flakeSprite?: HTMLCanvasElement;
  private _flash = 0; // lightning envelope 0..1
  private _nextFlash = 0;
  private _bolt: [number, number][][] | null = null; // main channel + branches

  static styles = css`
    :host {
      position: absolute;
      inset: 0;
      overflow: hidden;
      pointer-events: none;
      z-index: 0;
    }
    .sky {
      position: absolute;
      inset: 0;
      transition: opacity 1.5s ease;
    }
    .vid {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: opacity 1.5s ease;
    }
    /* Day clip forced under the natt theme (manual override) — dim it. */
    .vid.dim {
      filter: brightness(0.5) saturate(0.85);
    }
    /* Text-contrast veil over bright day footage, anchored to the clock corner. */
    .scrim {
      position: absolute;
      inset: 0;
      background: radial-gradient(120% 90% at 18% 12%, rgba(0, 0, 0, 0.34), transparent 55%);
    }
    canvas {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
    }
  `;

  connectedCallback(): void {
    super.connectedCallback();
    document.addEventListener('visibilitychange', this._onVisibility);
    window.addEventListener('hub-weather-force', this._onForce);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    document.removeEventListener('visibilitychange', this._onVisibility);
    window.removeEventListener('hub-weather-force', this._onForce);
    this._ro?.disconnect();
    this._ro = undefined;
    this._shader?.dispose();
    this._shader = undefined;
    if (this._vidSwapTimer !== undefined) {
      clearTimeout(this._vidSwapTimer);
      this._vidSwapTimer = undefined;
    }
    this._stopLoop();
  }

  firstUpdated(): void {
    this._canvas = (this.renderRoot.querySelector('canvas.px') as HTMLCanvasElement) ?? undefined;
    this._ctx = this._canvas?.getContext('2d') ?? undefined;
    this._glCanvas = (this.renderRoot.querySelector('canvas.gl') as HTMLCanvasElement) ?? undefined;
    if (this._glCanvas) this._shader = new CloudShader(this._glCanvas);
    this._ro = new ResizeObserver(() => this._resize());
    this._ro.observe(this);
    this._resize();
  }

  updated(changed: PropertyValues): void {
    this._syncScene();
    if (changed.has('active')) this._maybeRun();
  }

  private _onVisibility = (): void => this._maybeRun();
  private _onForce = (): void => this.requestUpdate();

  private get _condition(): string {
    return getForcedCondition() ?? this.getEntity(this.entity)?.state ?? 'cloudy';
  }

  private get _elevation(): number | null {
    const e = this.hass?.states['sun.sun']?.attributes?.elevation;
    return typeof e === 'number' ? e : null;
  }

  // ── Scene lifecycle ──────────────────────────────────────
  private _syncScene(): void {
    const band = elevBand(this._elevation);
    const condition = this._condition;
    const key = `${condition}|${this.theme}|${band}`;
    if (key === this._sceneKey) return;
    this._sceneKey = key;
    this._band = band;
    this._scene = conditionScene(condition);
    // Stock-footage layer: pick the clip for this scene; crossfade on change.
    const clip = this._videoDead ? null : clipForScene(condition, band);
    this._clipName = clip;
    const src = clip ? `${CLIP_BASE}/${clip}.mp4` : '';
    if (src !== this._activeVidSrc) {
      this._activeVidSrc = src;
      this._swapVideo(src);
    }
    const [top, mid, bot] = skyStops(this._scene.sky, this.theme, band);
    const cssBg = `background:linear-gradient(180deg, ${top} 0%, ${mid} 55%, ${bot} 100%)`;
    // Crossfade: paint the back layer, then flip which layer is in front.
    if (this._frontA) {
      this._skyB = cssBg;
      this._frontA = false;
    } else {
      this._skyA = cssBg;
      this._frontA = true;
    }
    this._buildSprites();
    this._buildParticles();
    this._nextFlash = this._t + 2 + Math.random() * 5;
    this._maybeRun();
  }

  private _resize(): void {
    if (!this._canvas) return;
    this._w = this.offsetWidth;
    this._h = this.offsetHeight;
    this._dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);
    this._canvas.width = Math.max(1, Math.round(this._w * this._dpr));
    this._canvas.height = Math.max(1, Math.round(this._h * this._dpr));
    // Cloud field renders at half resolution — it's all soft gradients, and
    // CSS upscaling is invisible while the fill-rate saving is 4×.
    if (this._glCanvas) {
      this._glCanvas.width = Math.max(1, Math.round((this._w * this._dpr) / 2));
      this._glCanvas.height = Math.max(1, Math.round((this._h * this._dpr) / 2));
    }
    this._buildParticles();
  }

  private get _isNightBand(): boolean {
    return elevBand(this._elevation) === 'night';
  }

  // ── Stock-footage layer ──────────────────────────────────
  private get _videoOn(): boolean {
    return this._activeVidSrc !== '' && !this._videoDead;
  }

  private _swapVideo(src: string): void {
    if (this._vidSwapTimer !== undefined) {
      clearTimeout(this._vidSwapTimer);
      this._vidSwapTimer = undefined;
    }
    if (!src) {
      this._vidSrcA = '';
      this._vidSrcB = '';
      return;
    }
    if (this._vidFrontA) {
      this._vidSrcB = src;
      this._vidFrontA = false;
    } else {
      this._vidSrcA = src;
      this._vidFrontA = true;
    }
    void this.updateComplete.then(() => {
      this._playVideos();
      // Once the crossfade lands, unmount the faded-out slot to free its decoder.
      this._vidSwapTimer = window.setTimeout(() => {
        if (this._vidFrontA) this._vidSrcB = '';
        else this._vidSrcA = '';
      }, 1700);
    });
  }

  private _videos(): HTMLVideoElement[] {
    return Array.from(this.renderRoot.querySelectorAll('video'));
  }

  private _playVideos(): void {
    if (!this._running) return;
    for (const v of this._videos()) void v.play().catch(() => {});
  }

  private _pauseVideos(): void {
    for (const v of this._videos()) v.pause();
  }

  private _onVideoError = (): void => {
    console.debug('[weather-bg] video failed — falling back to shader clouds');
    this._videoDead = true;
    this._activeVidSrc = '';
    this._vidSrcA = '';
    this._vidSrcB = '';
    this._sceneKey = ''; // force a scene rebuild on the next update
    this.requestUpdate();
  };

  /** Particle counts scale with viewport area (spec counts are per megapixel). */
  private _perMp(n: number): number {
    return Math.round((n * this._w * this._h) / 1_000_000);
  }

  private _buildParticles(): void {
    const s = this._scene;
    const w = this._w;
    const h = this._h;
    if (w === 0 || h === 0) return;
    const rand = Math.random;

    this._drops = Array.from({ length: this._perMp(s.rain) }, () => ({
      x: rand() * w,
      y: rand() * h,
      layer: Math.floor(rand() * DEPTH.length),
      jl: 0.7 + rand() * 0.6, // per-drop length jitter
      js: 0.85 + rand() * 0.35, // per-drop speed jitter
      ja: (rand() - 0.5) * 40, // per-drop wind-angle jitter (px/s)
    }));
    this._flakes = Array.from({ length: this._perMp(s.snow) }, () => ({
      x: rand() * w,
      y: rand() * h,
      r: 1.5 + rand() * 2.5,
      phase: rand() * Math.PI * 2,
      rot: rand() * Math.PI * 2,
      rotSpd: (rand() - 0.5) * 1.2,
      layer: Math.floor(rand() * DEPTH.length),
    }));
    this._stones = Array.from({ length: this._perMp(s.hail) }, () => ({
      x: rand() * w,
      y: rand() * h,
      vy: 700 + rand() * 300,
      vx: (rand() - 0.5) * 60,
      r: 1.2 + rand() * 1.6,
      bounced: false,
    }));
    const cloudCount = s.clouds > 0 ? Math.round(2 + s.clouds * 5) : 0;
    this._clouds = Array.from({ length: cloudCount }, (_, i) => ({
      x: rand() * w * 1.4 - w * 0.2,
      y: (i / Math.max(cloudCount, 1)) * h * 0.38 + rand() * 30,
      scale: 0.7 + rand() * 0.9,
      spd: 6 + rand() * 10,
      alpha: 0.5 + rand() * 0.5,
    }));
    this._stars = s.stars
      ? Array.from({ length: 90 }, () => ({
          x: rand() * w,
          y: rand() * h * 0.7,
          r: 0.5 + rand() * 1.1,
          phase: rand() * Math.PI * 2,
        }))
      : [];
    this._splashes = [];
  }

  private _buildSprites(): void {
    // Cloud blob: overlapping radial gradients, pre-blurred by their falloff.
    const c = document.createElement('canvas');
    c.width = 512;
    c.height = 256;
    const g = c.getContext('2d')!;
    const natt = this.theme === 'natt';
    const stormy = this._scene.sky === 'storm';
    const [r, gg, b] = natt ? [26, 30, 40] : stormy ? [120, 130, 142] : [255, 255, 255];
    for (let i = 0; i < 9; i++) {
      const x = 80 + Math.random() * 352;
      const y = 90 + Math.random() * 80;
      const rad = 55 + Math.random() * 70;
      const grad = g.createRadialGradient(x, y, 0, x, y, rad);
      grad.addColorStop(0, `rgba(${r},${gg},${b},${natt ? 0.5 : 0.55})`);
      grad.addColorStop(1, `rgba(${r},${gg},${b},0)`);
      g.fillStyle = grad;
      g.fillRect(0, 0, 512, 256);
    }
    this._cloudSprite = c;

    // Snowflake: soft disc + faint arms so rotation is visible.
    const f = document.createElement('canvas');
    f.width = 32;
    f.height = 32;
    const fg = f.getContext('2d')!;
    const disc = fg.createRadialGradient(16, 16, 0, 16, 16, 14);
    disc.addColorStop(0, 'rgba(255,255,255,0.9)');
    disc.addColorStop(0.5, 'rgba(255,255,255,0.35)');
    disc.addColorStop(1, 'rgba(255,255,255,0)');
    fg.fillStyle = disc;
    fg.fillRect(0, 0, 32, 32);
    fg.strokeStyle = 'rgba(255,255,255,0.5)';
    fg.lineWidth = 1.2;
    for (let i = 0; i < 3; i++) {
      fg.save();
      fg.translate(16, 16);
      fg.rotate((i * Math.PI) / 3);
      fg.beginPath();
      fg.moveTo(-7, 0);
      fg.lineTo(7, 0);
      fg.stroke();
      fg.restore();
    }
    this._flakeSprite = f;
  }

  // ── Loop control ─────────────────────────────────────────
  private _maybeRun(): void {
    const hasWork =
      this._scene.rain > 0 || this._scene.snow > 0 || this._scene.hail > 0 ||
      this._scene.clouds > 0 || this._scene.stars || this._scene.sun ||
      this._scene.fog || this._scene.lightning || this._videoOn;
    const should =
      this.active && hasWork && this.isConnected && document.visibilityState === 'visible';
    if (should && !this._running) {
      this._running = true;
      this._last = performance.now();
      console.debug('[weather-bg] start');
      this._playVideos();
      this._raf = requestAnimationFrame(this._frame);
    } else if (!should && this._running) {
      this._stopLoop();
    }
  }

  private _stopLoop(): void {
    if (!this._running) return;
    this._running = false;
    cancelAnimationFrame(this._raf);
    this._pauseVideos();
    console.debug('[weather-bg] stop');
  }

  private _frame = (now: number): void => {
    if (!this._running) return;
    const dt = Math.min((now - this._last) / 1000, MAX_DT);
    this._last = now;
    this._t += dt;
    this._draw(dt);
    this._raf = requestAnimationFrame(this._frame);
  };

  // ── Drawing ──────────────────────────────────────────────
  private _draw(dt: number): void {
    const ctx = this._ctx;
    if (!ctx) return;
    const w = this._w;
    const h = this._h;
    ctx.setTransform(this._dpr, 0, 0, this._dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    this._updateFlash(dt);
    // Footage carries sky/clouds/sun/stars/fog when active; only precipitation
    // and lightning stay on the canvas. Otherwise: fBm shader clouds when
    // WebGL is healthy, sprite fallback when it isn't.
    const videoOn = this._videoOn;
    if (!videoOn && this._stars.length && this._isNightBand) this._drawStars(ctx);
    if (!videoOn && this._scene.sun && !this._isNightBand && this.theme === 'dag')
      this._drawSun(ctx, w, h);
    const shaderOn = this._shader?.ok === true;
    if (shaderOn) {
      if (!videoOn && this._scene.clouds > 0) {
        this._shader!.render({
          time: this._t,
          density: this._scene.clouds,
          wind: this._scene.wind,
          palette: cloudColors(this._scene.sky, this.theme),
          flash: this._flash,
        });
      } else {
        this._shader!.clear();
      }
    } else if (!videoOn && this._clouds.length) {
      this._drawClouds(ctx, dt, w, h);
    }
    if (!videoOn && this._scene.fog) this._drawFog(ctx, dt, w, h);
    if (this._drops.length) this._drawRain(ctx, dt, w, h);
    if (this._flakes.length) this._drawSnow(ctx, dt, w, h);
    if (this._stones.length) this._drawHail(ctx, dt, w, h);
    if (this._splashes.length) this._drawSplashes(ctx, dt);
    if (this._flash > 0.01) {
      // A visible channel carries the drama — dampen the sheet flash then.
      const sheet = (this.theme === 'natt' ? 0.22 : 0.3) * (this._bolt ? 0.6 : 1);
      ctx.fillStyle = `rgba(215,225,255,${this._flash * sheet})`;
      ctx.fillRect(0, 0, w, h);
    }
    // Bolt last so the flash overlay never dilutes the channel.
    if (this._bolt && this._flash > 0.05) this._drawBolt(ctx);
  }

  private _drawStars(ctx: CanvasRenderingContext2D): void {
    for (const s of this._stars) {
      const a = 0.25 + 0.5 * Math.abs(Math.sin(this._t * 0.5 + s.phase));
      ctx.fillStyle = `rgba(200,215,255,${a})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private _drawSun(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    const cx = w * 0.76;
    const cy = h * 0.2;
    const golden = elevBand(this._elevation) === 'golden';
    const rad = Math.min(w, h) * 0.55;
    const pulse = 0.92 + 0.08 * Math.sin(this._t * 0.3);
    const warm = golden ? '255,170,90' : '255,218,130';
    // Hot core + wide bloom (Apple's sunny hero look).
    let grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad);
    grad.addColorStop(0, `rgba(255,246,220,${0.85 * pulse})`);
    grad.addColorStop(0.12, `rgba(${warm},${0.5 * pulse})`);
    grad.addColorStop(0.35, `rgba(${warm},0.16)`);
    grad.addColorStop(1, `rgba(${warm},0)`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    // Lens-halo ring around the disc.
    const ringR = rad * 0.52;
    grad = ctx.createRadialGradient(cx, cy, ringR * 0.88, cx, cy, ringR * 1.12);
    grad.addColorStop(0, `rgba(${warm},0)`);
    grad.addColorStop(0.5, `rgba(${warm},0.1)`);
    grad.addColorStop(1, `rgba(${warm},0)`);
    ctx.fillStyle = grad;
    const rb = ringR * 1.15;
    ctx.fillRect(cx - rb, cy - rb, rb * 2, rb * 2);
    // Slow-rotating rays.
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(this._t * 0.02);
    ctx.fillStyle = `rgba(${warm},0.07)`;
    for (let i = 0; i < 8; i++) {
      ctx.rotate(Math.PI / 4);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(rad * 1.1, -rad * 0.045);
      ctx.lineTo(rad * 1.1, rad * 0.045);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
    // Faint lens-flare dots along the sun→centre axis.
    const dxAxis = w / 2 - cx;
    const dyAxis = h / 2 - cy;
    const dots: [number, number, number][] = [
      [0.7, 14, 0.06],
      [1.4, 9, 0.08],
      [2.1, 22, 0.045],
    ];
    for (const [f, r, a] of dots) {
      const x = cx + dxAxis * f;
      const y = cy + dyAxis * f;
      const g2 = ctx.createRadialGradient(x, y, 0, x, y, r);
      g2.addColorStop(0, `rgba(${warm},${a})`);
      g2.addColorStop(1, `rgba(${warm},0)`);
      ctx.fillStyle = g2;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
  }

  private _drawClouds(ctx: CanvasRenderingContext2D, dt: number, w: number, h: number): void {
    const sprite = this._cloudSprite;
    if (!sprite) return;
    const wind = this._scene.wind;
    for (const c of this._clouds) {
      c.x += c.spd * wind * dt;
      const cw = 512 * c.scale * 0.9;
      if (c.x - cw / 2 > w) c.x = -cw / 2;
      ctx.globalAlpha = c.alpha * (0.35 + this._scene.clouds * 0.5) + this._flash * 0.3;
      ctx.drawImage(sprite, c.x - cw / 2, c.y - (128 * c.scale) / 2, cw, 256 * c.scale * 0.9);
    }
    ctx.globalAlpha = 1;
  }

  private _drawFog(ctx: CanvasRenderingContext2D, dt: number, w: number, h: number): void {
    const natt = this.theme === 'natt';
    const [r, g, b] = natt ? [40, 44, 52] : [225, 228, 230];
    const alphas = natt ? [0.1, 0.14, 0.18] : [0.16, 0.22, 0.28];
    for (let i = 0; i < 3; i++) {
      const dir = i % 2 === 0 ? 1 : -1;
      this._fogOffsets[i] = (this._fogOffsets[i] + dir * (4 + i * 3) * dt + w) % w;
      const y = h * (0.35 + i * 0.22);
      const grad = ctx.createLinearGradient(0, y - 70, 0, y + 70);
      grad.addColorStop(0, `rgba(${r},${g},${b},0)`);
      grad.addColorStop(0.5, `rgba(${r},${g},${b},${alphas[i]})`);
      grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
      ctx.fillStyle = grad;
      // Two copies for a seamless wrap.
      ctx.fillRect(this._fogOffsets[i] - w, y - 70, w, 140);
      ctx.fillRect(this._fogOffsets[i], y - 70, w, 140);
    }
  }

  private _drawRain(ctx: CanvasRenderingContext2D, dt: number, w: number, h: number): void {
    const wind = this._scene.wind;
    const natt = this.theme === 'natt';
    const baseSpd = this._scene.rain > 150 ? 1500 : 1150; // pouring falls harder
    const baseLen = this._scene.rain > 150 ? 30 : 20;
    ctx.lineCap = 'round';
    for (const d of this._drops) {
      const L = DEPTH[d.layer];
      const spd = baseSpd * L.speed * d.js;
      const drift = (60 * wind + d.ja) * L.speed;
      d.y += spd * dt;
      d.x += drift * dt;
      if (d.y > h) {
        d.y = -baseLen;
        d.x = Math.random() * w;
        if (d.layer === 2 && Math.random() < 0.25) {
          this._splashes.push({ x: d.x, y: h - 4 - Math.random() * 8, r: 1, life: 1 });
        }
      }
      if (d.x > w) d.x -= w;
      const len = baseLen * L.scale * d.jl;
      const slant = (drift / spd) * len;
      ctx.strokeStyle = natt
        ? `rgba(150,170,200,${L.alpha * 0.45})`
        : `rgba(235,242,250,${L.alpha * 0.6})`;
      ctx.lineWidth = 1 * L.scale;
      ctx.beginPath();
      ctx.moveTo(d.x, d.y);
      ctx.lineTo(d.x - slant, d.y - len);
      ctx.stroke();
    }
  }

  private _drawSnow(ctx: CanvasRenderingContext2D, dt: number, w: number, h: number): void {
    const sprite = this._flakeSprite;
    if (!sprite) return;
    const wind = this._scene.wind;
    for (const f of this._flakes) {
      const L = DEPTH[f.layer];
      f.y += 55 * L.speed * dt;
      f.x += Math.sin(f.phase + this._t * 0.8) * 20 * wind * dt;
      f.rot += f.rotSpd * dt;
      if (f.y > h + 6) {
        f.y = -6;
        f.x = Math.random() * w;
      }
      if (f.x > w + 6) f.x = -6;
      if (f.x < -6) f.x = w + 6;
      const size = f.r * 4 * L.scale;
      ctx.save();
      ctx.globalAlpha = L.alpha * (this.theme === 'natt' ? 0.7 : 0.95);
      ctx.translate(f.x, f.y);
      ctx.rotate(f.rot);
      ctx.drawImage(sprite, -size / 2, -size / 2, size, size);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }

  private _drawHail(ctx: CanvasRenderingContext2D, dt: number, w: number, h: number): void {
    const natt = this.theme === 'natt';
    ctx.fillStyle = natt ? 'rgba(190,205,225,0.7)' : 'rgba(250,252,255,0.9)';
    for (const s of this._stones) {
      s.y += s.vy * dt;
      s.x += s.vx * dt;
      if (s.y > h) {
        if (!s.bounced && Math.random() < 0.5) {
          s.bounced = true;
          s.vy = -s.vy * 0.35;
          s.y = h;
        } else {
          s.y = -4;
          s.x = Math.random() * w;
          s.vy = 700 + Math.random() * 300;
          s.bounced = false;
        }
      } else if (s.bounced) {
        s.vy += 1600 * dt; // gravity pulls the bounce back down
      }
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private _drawSplashes(ctx: CanvasRenderingContext2D, dt: number): void {
    const natt = this.theme === 'natt';
    for (const sp of this._splashes) {
      sp.r += 50 * dt;
      sp.life -= 5 * dt;
      if (sp.life <= 0) continue;
      ctx.strokeStyle = natt
        ? `rgba(150,170,200,${sp.life * 0.2})`
        : `rgba(235,242,250,${sp.life * 0.3})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(sp.x, sp.y, sp.r, sp.r * 0.35, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    this._splashes = this._splashes.filter((sp) => sp.life > 0);
  }

  private _updateFlash(dt: number): void {
    if (!this._scene.lightning) {
      this._flash = 0;
      this._bolt = null;
      return;
    }
    if (this._t >= this._nextFlash) {
      this._flash = 1;
      // Most strikes show a visible branching channel; some are sheet lightning.
      this._bolt = Math.random() < 0.7 ? this._makeBolt() : null;
      // Occasional quick double-flash, otherwise a 4–12 s lull.
      this._nextFlash = this._t + (Math.random() < 0.3 ? 0.15 : 4 + Math.random() * 8);
    } else {
      this._flash = Math.max(0, this._flash - dt / 0.4) ** 1.5;
    }
  }

  /** Jagged main channel from the cloud deck with a few thinner branches. */
  private _makeBolt(): [number, number][][] {
    const w = this._w;
    const h = this._h;
    const rand = Math.random;
    const polylines: [number, number][][] = [];
    const main: [number, number][] = [];
    let x = w * (0.2 + rand() * 0.6);
    let y = -8;
    const bias = (rand() - 0.5) * 10;
    const endY = h * (0.55 + rand() * 0.3);
    main.push([x, y]);
    while (y < endY) {
      y += 12 + rand() * 22;
      x += (rand() - 0.5) * 36 + bias;
      main.push([x, y]);
      if (rand() < 0.14 && main.length > 2) {
        // Branch: shorter, drifting off to one side, fading out mid-air.
        const branch: [number, number][] = [[x, y]];
        let bx = x;
        let by = y;
        const dir = rand() < 0.5 ? -1 : 1;
        const steps = 3 + Math.floor(rand() * 4);
        for (let i = 0; i < steps; i++) {
          by += 10 + rand() * 16;
          bx += dir * (8 + rand() * 20) + (rand() - 0.5) * 12;
          branch.push([bx, by]);
        }
        polylines.push(branch);
      }
    }
    polylines.unshift(main);
    return polylines;
  }

  private _drawBolt(ctx: CanvasRenderingContext2D): void {
    const bolt = this._bolt;
    if (!bolt) return;
    const a = this._flash;
    // Three passes: wide glow, tight glow, hot core. Branches thinner than main.
    const passes: [number, string][] = [
      [10, `rgba(120,170,255,${0.25 * a})`],
      [4.5, `rgba(170,205,255,${0.45 * a})`],
      [2.5, `rgba(255,255,255,${0.95 * a})`],
    ];
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (const [lw, style] of passes) {
      ctx.strokeStyle = style;
      bolt.forEach((line, i) => {
        ctx.lineWidth = i === 0 ? lw : lw * 0.55;
        ctx.beginPath();
        ctx.moveTo(line[0][0], line[0][1]);
        for (let j = 1; j < line.length; j++) ctx.lineTo(line[j][0], line[j][1]);
        ctx.stroke();
      });
    }
  }

  render() {
    // Dim any bright (non-night) clip under the natt theme — day clips during
    // a manual natt override, and the fog clip, which is bright at any hour.
    const dim =
      this.theme === 'natt' && this._clipName !== null && !this._clipName.endsWith('-night')
        ? 'dim'
        : '';
    const vid = (src: string, front: boolean) =>
      src
        ? html`<video
            class="vid ${dim}"
            style="opacity:${front ? 1 : 0}"
            .src=${src}
            muted
            loop
            playsinline
            preload="auto"
            @error=${this._onVideoError}
          ></video>`
        : nothing;
    return html`
      <div class="sky" style="${this._skyA};opacity:${this._frontA ? 1 : 0}"></div>
      <div class="sky" style="${this._skyB};opacity:${this._frontA ? 0 : 1}"></div>
      ${vid(this._vidSrcA, this._vidFrontA)} ${vid(this._vidSrcB, !this._vidFrontA)}
      ${this._videoOn ? html`<div class="scrim"></div>` : nothing}
      <canvas class="gl"></canvas>
      <canvas class="px"></canvas>
    `;
  }
}

customElements.define('hub-weather-bg', HubWeatherBg);
