import { describe, it, expect } from 'vitest';
import { shapeTodo, type TodoItem } from '../src/hub/todo-model';

const item = (over: Partial<TodoItem>): TodoItem => ({
  uid: 'u1',
  summary: 'Handla',
  status: 'needs_action',
  ...over,
});

describe('shapeTodo', () => {
  it('splits open and done, preserving list order', () => {
    const items = [
      item({ uid: 'a', summary: 'Första' }),
      item({ uid: 'b', summary: 'Klar', status: 'completed' }),
      item({ uid: 'c', summary: 'Andra' }),
    ];
    const out = shapeTodo(items);
    expect(out.open.map((i) => i.uid)).toEqual(['a', 'c']);
    expect(out.done.map((i) => i.uid)).toEqual(['b']);
  });

  it('handles null/undefined as empty', () => {
    expect(shapeTodo(null)).toEqual({ open: [], done: [] });
    expect(shapeTodo(undefined)).toEqual({ open: [], done: [] });
  });
});
