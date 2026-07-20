/**
 * Dependency-free WebGL cloud layer: domain-warped multi-octave value noise
 * (fBm) rendered as a continuous, slowly drifting cloud field — the Apple
 * Weather look. Runs on its own half-resolution canvas; the particle canvas
 * sits above it. Consumers must check `ok` every frame: it flips false on
 * init failure or context loss, at which point the caller falls back to the
 * legacy sprite clouds.
 */

export interface CloudPalette {
  lit: [number, number, number];
  shade: [number, number, number];
  alpha: number;
}

export interface CloudFrame {
  time: number; // seconds
  density: number; // 0..1 coverage
  wind: number; // horizontal drift multiplier
  palette: CloudPalette;
  flash: number; // lightning envelope 0..1
}

const VERT = `
attribute vec2 a_pos;
void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
`;

const FRAG = `
precision mediump float;
uniform vec2 u_res;
uniform float u_time;
uniform float u_density;
uniform float u_wind;
uniform vec3 u_lit;
uniform vec3 u_shade;
uniform float u_alpha;
uniform float u_flash;

float hash(vec2 p) {
  p = fract(p * vec2(127.1, 311.7));
  p += dot(p, p + 34.23);
  return fract(p.x * p.y);
}
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
    f.y);
}
float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p = p * 2.03 + vec2(19.3, 7.1);
    a *= 0.5;
  }
  return v;
}
void main() {
  vec2 uv = gl_FragCoord.xy / u_res;
  // Aspect-corrected, vertically squashed noise space -> wide cloud banks.
  vec2 p = vec2(uv.x * (u_res.x / u_res.y), uv.y * 1.9);
  float t = u_time * 0.014 * u_wind;
  // Large slow masses + domain-warped turbulent detail.
  float base = fbm(p * 1.5 + vec2(t, 0.0));
  vec2 q = vec2(
    fbm(p * 2.8 + vec2(t * 2.2, 1.7)),
    fbm(p * 2.8 + vec2(8.3 - t * 1.4, 2.8)));
  float detail = fbm(p * 4.2 + q * 1.7 + vec2(t * 3.5, 0.0));
  float f = base * 0.62 + detail * 0.55 + (uv.y - 0.5) * 0.12;
  float th = mix(0.86, 0.32, u_density);
  float cov = smoothstep(th, th + 0.28, f);
  // Denser core = darker (self-shadowing); lightning lifts the whole field.
  vec3 col = mix(u_lit, u_shade, smoothstep(th + 0.05, th + 0.55, f));
  col += vec3(u_flash * 0.45);
  float a = min(cov * u_alpha * (1.0 + u_flash * 0.25), 1.0);
  gl_FragColor = vec4(col * a, a); // premultiplied
}
`;

export class CloudShader {
  ok = false;

  private gl: WebGLRenderingContext | null = null;
  private prog: WebGLProgram | null = null;
  private u: Record<string, WebGLUniformLocation | null> = {};

  constructor(private canvas: HTMLCanvasElement) {
    canvas.addEventListener('webglcontextlost', this._onLost);
    canvas.addEventListener('webglcontextrestored', this._onRestored);
    this._init();
  }

  private _onLost = (e: Event): void => {
    e.preventDefault();
    this.ok = false;
  };

  private _onRestored = (): void => {
    this._init();
  };

  private _init(): void {
    this.ok = false;
    const gl = this.canvas.getContext('webgl', {
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
      depth: false,
      stencil: false,
    });
    if (!gl) return;
    const compile = (type: number, src: string): WebGLShader | null => {
      const s = gl.createShader(type);
      if (!s) return null;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.debug('[cloud-shader] compile failed:', gl.getShaderInfoLog(s));
        return null;
      }
      return s;
    };
    const vs = compile(gl.VERTEX_SHADER, VERT);
    const fs = compile(gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return;
    const prog = gl.createProgram();
    if (!prog) return;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.debug('[cloud-shader] link failed:', gl.getProgramInfoLog(prog));
      return;
    }
    gl.useProgram(prog);
    // Fullscreen triangle.
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'a_pos');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    for (const name of ['u_res', 'u_time', 'u_density', 'u_wind', 'u_lit', 'u_shade', 'u_alpha', 'u_flash']) {
      this.u[name] = gl.getUniformLocation(prog, name);
    }
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0, 0, 0, 0);
    this.gl = gl;
    this.prog = prog;
    this.ok = true;
  }

  render(f: CloudFrame): void {
    const gl = this.gl;
    if (!gl || !this.ok) return;
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform2f(this.u.u_res, this.canvas.width, this.canvas.height);
    gl.uniform1f(this.u.u_time, f.time);
    gl.uniform1f(this.u.u_density, f.density);
    gl.uniform1f(this.u.u_wind, f.wind);
    gl.uniform3f(this.u.u_lit, ...f.palette.lit);
    gl.uniform3f(this.u.u_shade, ...f.palette.shade);
    gl.uniform1f(this.u.u_alpha, f.palette.alpha);
    gl.uniform1f(this.u.u_flash, f.flash);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  clear(): void {
    const gl = this.gl;
    if (!gl || !this.ok) return;
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT);
  }

  dispose(): void {
    this.canvas.removeEventListener('webglcontextlost', this._onLost);
    this.canvas.removeEventListener('webglcontextrestored', this._onRestored);
    if (this.gl && this.prog) this.gl.deleteProgram(this.prog);
    this.gl = null;
    this.prog = null;
    this.ok = false;
  }
}
