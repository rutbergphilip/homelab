import { html, svg, css, nothing, LitElement } from 'lit';
import { property } from 'lit/decorators.js';

export interface SparkPoint {
  date: string;
  value: number;
}
export interface SparkXY {
  x: number;
  y: number;
}

/**
 * Map a value series into SVG coordinates for a sparkline.
 *
 * x is spread evenly across `width`; y is inverted (a larger value sits higher
 * on screen) and normalised over the value range padded by `pad` at both ends,
 * so the line never grazes the top or bottom edge. A constant series collapses
 * to the vertical centre; a lone point parks at the right edge (the "today" end).
 */
export function sparklineCoords(
  points: SparkPoint[],
  width: number,
  height: number,
  pad = 0.1,
): SparkXY[] {
  const n = points.length;
  if (n === 0) return [];
  if (n === 1) return [{ x: width, y: height / 2 }];

  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min;
  const lo = min - span * pad;
  const range = span * (1 + 2 * pad);

  return points.map((p, i) => {
    const x = (i / (n - 1)) * width;
    const y = span <= 0 ? height / 2 : height - ((p.value - lo) / range) * height;
    return { x, y };
  });
}

let uid = 0;

/**
 * A minimal, axis-free sparkline: a soft area wash under a crisp polyline with a
 * dot marking the latest point. Stroke colour is a token name (e.g.
 * `--hub-lavender`) resolved against the inherited theme. Scales horizontally to
 * fill its container; the stroke stays hairline-crisp via non-scaling-stroke.
 */
export class HubSparkline extends LitElement {
  @property({ attribute: false }) points: SparkPoint[] = [];
  @property() stroke = '--hub-lavender';
  @property({ type: Number }) width = 560;
  @property({ type: Number }) height = 130;

  private readonly _gid = `hub-spark-${uid++}`;

  static styles = css`
    :host {
      display: block;
    }
    .spark {
      position: relative;
      width: 100%;
      line-height: 0;
    }
    svg {
      display: block;
      width: 100%;
      overflow: visible;
    }
    polyline {
      fill: none;
      stroke: var(--spark-stroke, #b99cf2);
      stroke-width: 2.5px;
      stroke-linecap: round;
      stroke-linejoin: round;
    }
    .grad-a {
      stop-color: var(--spark-stroke, #b99cf2);
      stop-opacity: 0.24;
    }
    .grad-b {
      stop-color: var(--spark-stroke, #b99cf2);
      stop-opacity: 0;
    }
    .dot {
      position: absolute;
      width: 9px;
      height: 9px;
      border-radius: 50%;
      background: var(--spark-stroke, #b99cf2);
      transform: translate(-50%, -50%);
      pointer-events: none;
      box-shadow: 0 0 0 5px color-mix(in srgb, var(--spark-stroke, #b99cf2) 16%, transparent);
    }
  `;

  render() {
    const coords = sparklineCoords(this.points, this.width, this.height);
    if (coords.length === 0) return html``;

    const line = coords.map((c) => `${c.x.toFixed(2)},${c.y.toFixed(2)}`).join(' ');
    const last = coords[coords.length - 1];
    const first = coords[0];
    const hasLine = coords.length >= 2;
    const area = `${line} ${last.x.toFixed(2)},${this.height} ${first.x.toFixed(2)},${this.height}`;

    return html`
      <div class="spark" style="--spark-stroke:var(${this.stroke})">
        ${svg`
          <svg
            viewBox="0 0 ${this.width} ${this.height}"
            preserveAspectRatio="none"
            style="height:${this.height}px"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="${this._gid}" x1="0" y1="0" x2="0" y2="1">
                <stop class="grad-a" offset="0%"></stop>
                <stop class="grad-b" offset="100%"></stop>
              </linearGradient>
            </defs>
            ${
              hasLine
                ? svg`<polygon points="${area}" fill="url(#${this._gid})" stroke="none"></polygon>
                       <polyline points="${line}" vector-effect="non-scaling-stroke"></polyline>`
                : nothing
            }
          </svg>
        `}
        <span
          class="dot"
          style="left:${((last.x / this.width) * 100).toFixed(3)}%;top:${((last.y / this.height) * 100).toFixed(3)}%"
        ></span>
      </div>
    `;
  }
}

customElements.define('hub-sparkline', HubSparkline);
