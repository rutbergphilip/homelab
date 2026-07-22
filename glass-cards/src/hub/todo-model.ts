import type { HomeAssistant } from '../types.js';

export interface TodoItem {
  uid: string;
  summary: string;
  status: 'needs_action' | 'completed';
}

/** Split a todo list into open/done, preserving the list's own order. */
export function shapeTodo(items: TodoItem[] | null | undefined): {
  open: TodoItem[];
  done: TodoItem[];
} {
  const list = items ?? [];
  return {
    open: list.filter((i) => i.status === 'needs_action'),
    done: list.filter((i) => i.status === 'completed'),
  };
}

interface GetItemsResponse {
  response?: Record<string, { items?: TodoItem[] }>;
}

/** One-shot todo.get_items over the websocket. Errors resolve to null. */
export async function fetchTodoItems(
  hass: HomeAssistant,
  entityId: string,
): Promise<TodoItem[] | null> {
  try {
    const resp = await hass.callWS<GetItemsResponse>({
      type: 'call_service',
      domain: 'todo',
      service: 'get_items',
      service_data: {},
      target: { entity_id: entityId },
      return_response: true,
    });
    return resp?.response?.[entityId]?.items ?? [];
  } catch {
    return null;
  }
}
