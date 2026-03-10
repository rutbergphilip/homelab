import { html, css, nothing } from 'lit';
import { customElement } from 'lit/decorators.js';
import { GlassBaseElement } from '../glass-base-element.js';
import type { GlassCardConfig } from '../types.js';

interface DepartureLine {
  designation: string;
  group_of_lines?: string;
  transport_mode?: string;
}

interface DepartureStopPoint {
  designation: string;
}

interface DepartureStopArea {
  id: number;
  name: string;
  type?: string;
}

interface Departure {
  destination: string;
  display: string;
  line: DepartureLine;
  stop_point: DepartureStopPoint;
  stop_area: DepartureStopArea;
  scheduled: string;
  expected: string;
  state: string;
  deviations: { message?: string }[];
}

interface GlassDepartureConfig extends GlassCardConfig {
  station_name?: string;
  max_departures?: number;
}

@customElement('glass-departure-card')
export class GlassDepartureCard extends GlassBaseElement {
  static styles = [
    GlassBaseElement.glassStyles,
    css`
      :host {
        display: block;
      }
      .departure-card {
        padding: 14px;
      }
      .departure-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 12px;
      }
      .departure-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        border-radius: 12px;
        background: rgba(255, 255, 255, 0.06);
      }
      .departure-icon ha-icon {
        --mdc-icon-size: 22px;
        color: var(--glass-text-secondary);
      }
      .station-name {
        font-size: 15px;
        font-weight: 600;
        color: var(--glass-text-primary);
      }
      .departure-list {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      .departure-row {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 8px 4px;
        border-radius: 8px;
        transition: background var(--glass-transition);
      }
      .departure-row:hover {
        background: rgba(255, 255, 255, 0.04);
      }
      .line-badge {
        display: flex;
        align-items: center;
        justify-content: center;
        min-width: 38px;
        padding: 3px 8px;
        border-radius: 6px;
        background: rgba(79, 195, 247, 0.15);
        color: var(--glass-accent);
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.02em;
        flex-shrink: 0;
      }
      .destination {
        flex: 1;
        font-size: 13px;
        font-weight: 500;
        color: var(--glass-text-primary);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        min-width: 0;
      }
      .track {
        font-size: 11px;
        color: var(--glass-text-dim);
        flex-shrink: 0;
        white-space: nowrap;
      }
      .time {
        font-size: 13px;
        font-weight: 600;
        color: var(--glass-text-secondary);
        font-variant-numeric: tabular-nums;
        flex-shrink: 0;
        text-align: right;
        min-width: 50px;
      }
      .time.soon {
        color: var(--glass-accent);
      }
      .time.delayed {
        color: var(--glass-coral);
      }
      .deviation {
        font-size: 11px;
        color: var(--glass-coral);
        padding: 2px 4px 2px 52px;
        opacity: 0.9;
      }
      .empty-state {
        text-align: center;
        padding: 16px 8px;
        font-size: 13px;
        color: var(--glass-text-dim);
      }
    `,
  ];

  private get _departureConfig(): GlassDepartureConfig {
    return this._config as GlassDepartureConfig;
  }

  setConfig(config: GlassDepartureConfig): void {
    super.setConfig(config);
    if (config.entity) this.setTrackedEntities([config.entity]);
  }

  private _getDepartures(): Departure[] {
    if (!this._config?.entity) return [];
    const departures = this.getEntityAttribute(this._config.entity, 'departures') as Departure[] | undefined;
    return departures ?? [];
  }

  private _isDelayed(departure: Departure): boolean {
    if (!departure.scheduled || !departure.expected) return false;
    const scheduled = new Date(departure.scheduled).getTime();
    const expected = new Date(departure.expected).getTime();
    return expected - scheduled > 60_000;
  }

  private _isSoon(departure: Departure): boolean {
    const display = departure.display?.toLowerCase() ?? '';
    const match = display.match(/^(\d+)\s*min/);
    if (match) return parseInt(match[1], 10) <= 5;
    if (display === 'nu') return true;
    return false;
  }

  private _getTimeClass(departure: Departure): string {
    if (this._isDelayed(departure)) return 'time delayed';
    if (this._isSoon(departure)) return 'time soon';
    return 'time';
  }

  getCardSize(): number {
    return 3;
  }

  render() {
    if (!this.hass || !this._config?.entity) return html``;

    const departures = this._getDepartures();
    const maxDepartures = this._departureConfig.max_departures ?? 6;
    const visibleDepartures = departures.slice(0, maxDepartures);

    const stationName =
      this._departureConfig.station_name ??
      this._departureConfig.name ??
      (departures.length > 0 ? departures[0].stop_area?.name : undefined) ??
      'Avgångar';

    const icon = this._departureConfig.icon ?? 'mdi:train';

    return html`
      <div class="glass departure-card">
        <div class="departure-header">
          <div class="departure-icon">
            <ha-icon .icon=${icon}></ha-icon>
          </div>
          <div class="station-name">${stationName}</div>
        </div>
        ${visibleDepartures.length === 0
          ? html`<div class="empty-state">Inga avgångar</div>`
          : html`
              <div class="departure-list">
                ${visibleDepartures.map(
                  (dep) => html`
                    <div class="departure-row">
                      <span class="line-badge">${dep.line.designation}</span>
                      <span class="destination">${dep.destination}</span>
                      <span class="track">Spår ${dep.stop_point.designation}</span>
                      <span class=${this._getTimeClass(dep)}>${dep.display}</span>
                    </div>
                    ${dep.deviations?.length
                      ? dep.deviations
                          .filter((d) => d.message)
                          .map((d) => html`<div class="deviation">${d.message}</div>`)
                      : nothing}
                  `,
                )}
              </div>
            `}
      </div>
    `;
  }
}
