import type { Metric } from "./types";

export interface ChecklistHistoryItem extends Metric {
  done: boolean;
}

export interface ChecklistHistoryDay {
  date: string;
  items: ChecklistHistoryItem[];
}

export function snapshotChecklist(
  items: Metric[],
  doneIds: string[],
  previous: ChecklistHistoryItem[] = []
): ChecklistHistoryItem[] {
  const done = new Set(doneIds);
  const currentIds = new Set(items.map((item) => item.id));
  const previousById = new Map(previous.map((item) => [item.id, item]));
  const current = items.map((item) => {
    const saved = previousById.get(item.id);
    return {
      id: item.id,
      label: done.has(item.id) && saved?.done ? saved.label : item.label,
      done: done.has(item.id),
    };
  });
  return [...current, ...previous.filter((item) => item.done && !currentIds.has(item.id))];
}
