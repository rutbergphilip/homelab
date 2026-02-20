export interface HomeAssistant {
  states: Record<string, HassEntity>;
  callService(
    domain: string,
    service: string,
    serviceData?: Record<string, unknown>,
    target?: { entity_id: string | string[] }
  ): Promise<void>;
  formatEntityState(stateObj: HassEntity): string;
  formatEntityAttributeValue(
    stateObj: HassEntity,
    attribute: string
  ): string;
  locale: {
    language: string;
  };
  themes: {
    darkMode: boolean;
  };
  user: {
    name: string;
  };
}

export interface HassEntity {
  entity_id: string;
  state: string;
  attributes: Record<string, unknown>;
  last_changed: string;
  last_updated: string;
  context: {
    id: string;
    parent_id: string | null;
    user_id: string | null;
  };
}

export interface LovelaceCardConfig {
  type: string;
  [key: string]: unknown;
}

export interface GlassCardConfig extends LovelaceCardConfig {
  entity?: string;
  name?: string;
  icon?: string;
}
