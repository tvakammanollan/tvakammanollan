import { useEffect, useRef } from "react";

/**
 * Animerad dot-matrix WebGL-shader för auth-sidor.
 *
 * Port av sign-in-flow-1-mönstret men direkt mot WebGL2 (utan three.js +
 * @react-three/fiber) — samma stil som `src/components/landing/shaderCanvas.ts`.
 *
 * - `reverse = false` → dots fadar in från mitten utåt
 * - `reverse = true`  → dots fadar ut från kanterna inåt
 *
 * Använd för en mjuk övergång vid lyckad inloggning: starta med `false`,
 * sätt `true` när submit är klar och navigera ~2s senare.
 */

const VERTEX_SRC = `#version 300 es
precision mediump float;
in vec4 position;
out vec2 v_fragCoord;
uniform vec2 u_resolution;
void main() {
  gl_Position = position;
  v_fragCoord = (position.xy + vec2(1.0)) * 0.5 * u_resolution;
  v_fragCoord.y = u_resolution.y - v_fragCoord.y;
}`;

const FRAGMENT_SRC = `#version 300 es
precision mediump float;
in vec2 v_fragCoord;

uniform float u_time;
uniform float u_opacities[10];
uniform vec3 u_color;
uniform float u_total_size;
uniform float u_dot_size;
uniform vec2 u_resolution;
uniform int u_reverse;
uniform float u_speed;

out vec4 fragColor;

float PHI = 1.61803398874989484820459;

float random(vec2 xy) {
  return fract(tan(distance(xy * PHI, xy) * 0.5) * xy.x);
}

void main() {
  vec2 st = v_fragCoord.xy;
  st.x -= abs(floor((mod(u_resolution.x, u_total_size) - u_dot_size) * 0.5));
  st.y -= abs(floor((mod(u_resolution.y, u_total_size) - u_dot_size) * 0.5));

  float opacity = step(0.0, st.x);
  opacity *= step(0.0, st.y);

  vec2 st2 = vec2(floor(st.x / u_total_size), floor(st.y / u_total_size));

  float frequency = 5.0;
  float show_offset = random(st2);
  float rand = random(st2 * floor((u_time / frequency) + show_offset + frequency));
  opacity *= u_opacities[int(rand * 10.0)];
  opacity *= 1.0 - step(u_dot_size / u_total_size, fract(st.x / u_total_size));
  opacity *= 1.0 - step(u_dot_size / u_total_size, fract(st.y / u_total_size));

  vec2 center_grid = u_resolution / 2.0 / u_total_size;
  float dist_from_center = distance(center_grid, st2);

  float timing_offset_intro = dist_from_center * 0.01 + (random(st2) * 0.15);
  float max_grid_dist = distance(center_grid, vec2(0.0, 0.0));
  float timing_offset_outro = (max_grid_dist - dist_from_center) * 0.02 + (random(st2 + 42.0) * 0.2);

  if (u_reverse == 1) {
    float t = timing_offset_outro;
    opacity *= 1.0 - step(t, u_time * u_speed);
    opacity *= clamp((step(t + 0.1, u_time * u_speed)) * 1.25, 1.0, 1.25);
  } else {
    float t = timing_offset_intro;
    opacity *= step(t, u_time * u_speed);
    opacity *= clamp((1.0 - step(t + 0.1, u_time * u_speed)) * 1.25, 1.0, 1.25);
  }

  fragColor = vec4(u_color, opacity);
  fragColor.rgb *= fragColor.a;
}`;

export type DotMatrixOptions = {
  /** RGB i 0–255-skala. Default = amber `[242, 166, 90]`. */
  color?: [number, number, number];
  /** Storleken på cell-rutan i pixlar. Default 20. */
  totalSize?: number;
  /** Storleken på själva pricken i pixlar. Default 6. */
  dotSize?: number;
  /** Animations-hastighet (multiplicerar tiden). Default 0.5. */
  speed?: number;
  /** Slumpmässiga opaciteter per prick. Default = milt amber-flimmer. */
  opacities?: number[];
  /** När true: dots fadar ut från kanterna inåt. */
  reverse?: boolean;
};

const DEFAULT_OPACITIES = [0.3, 0.3, 0.3, 0.5, 0.5, 0.5, 0.8, 0.8, 0.8, 1.0];

export function useDotMatrixCanvas(options: DotMatrixOptions = {}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Pack options into refs so the WebGL loop sees live values without re-init
  const reverseRef = useRef(options.reverse ?? false);
  const startTimeRef = useRef<number | null>(null);
  reverseRef.current = options.reverse ?? false;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl2", { premultipliedAlpha: true });
    if (!gl) return;

    const dpr = Math.max(1, 0.5 * window.devicePixelRatio);

    const resize = () => {
      canvas.width = canvas.clientWidth * dpr;
      canvas.height = canvas.clientHeight * dpr;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();

    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.error("dot-matrix shader compile error:", gl.getShaderInfoLog(s));
      }
      return s;
    };

    const vs = compile(gl.VERTEX_SHADER, VERTEX_SRC);
    const fs = compile(gl.FRAGMENT_SHADER, FRAGMENT_SRC);

    const prog = gl.createProgram()!;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.error("dot-matrix link error:", gl.getProgramInfoLog(prog));
      return;
    }

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, 1, -1, -1, 1, 1, 1, -1]), gl.STATIC_DRAW);
    const posLoc = gl.getAttribLocation(prog, "position");
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(prog, "u_time");
    const uRes = gl.getUniformLocation(prog, "u_resolution");
    const uColor = gl.getUniformLocation(prog, "u_color");
    const uOpacities = gl.getUniformLocation(prog, "u_opacities");
    const uTotal = gl.getUniformLocation(prog, "u_total_size");
    const uDot = gl.getUniformLocation(prog, "u_dot_size");
    const uReverse = gl.getUniformLocation(prog, "u_reverse");
    const uSpeed = gl.getUniformLocation(prog, "u_speed");

    const [r, g, b] = options.color ?? [242, 166, 90];
    const color: [number, number, number] = [r / 255, g / 255, b / 255];
    const opacities = options.opacities ?? DEFAULT_OPACITIES;
    const totalSize = options.totalSize ?? 20;
    const dotSize = options.dotSize ?? 6;
    const speed = options.speed ?? 0.5;

    gl.useProgram(prog);
    gl.uniform3f(uColor, color[0], color[1], color[2]);
    gl.uniform1fv(uOpacities, new Float32Array(opacities));
    gl.uniform1f(uTotal, totalSize);
    gl.uniform1f(uDot, dotSize);
    gl.uniform1f(uSpeed, speed);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

    let raf = 0;
    const loop = (now: number) => {
      if (startTimeRef.current === null) startTimeRef.current = now;
      const t = (now - startTimeRef.current) / 1000;
      gl.useProgram(prog);
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, t);
      gl.uniform1i(uReverse, reverseRef.current ? 1 : 0);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    window.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(raf);
      gl.deleteProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
    };
    // Re-init only when these static visuals change (rare)
  }, [options.color, options.totalSize, options.dotSize, options.speed, options.opacities]);

  return canvasRef;
}
