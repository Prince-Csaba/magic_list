export type TabType = "tally" | "counter" | "checklist" | "projects";

export interface Metric {
  id: string;
  label: string;
}

export interface TabDoc {
  id: string;
  name: string;
  type: TabType;
  order: number;
  // tally: metrics tracked with timestamped events
  metrics?: Metric[];
  // counter: a single number
  label?: string;
  value?: number;
  // checklist: items + which ones are done on `doneDate`
  items?: Metric[];
  doneDate?: string;
  doneIds?: string[];
}

export const todayKey = () => {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};
