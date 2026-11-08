export type TabType = "tally" | "counter" | "checklist" | "projects";

export interface Metric {
  id: string;
  label: string;
}

export type ProjectPriority = "none" | "high" | "medium" | "low";

export interface ProjectItem extends Metric {
  priority?: ProjectPriority;
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
  // checklist or projects: items; checklist tracks which are done on `doneDate`
  items?: ProjectItem[];
  doneDate?: string;
  doneIds?: string[];
}

export const todayKey = () => {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};
