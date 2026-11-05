"use client";
import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  where,
} from "firebase/firestore";
import Box from "@mui/material/Box";
import { db } from "@/lib/firebase";
import type { TabDoc } from "@/lib/types";
import TallyTile from "./TallyTile";

const GRADIENTS = [
  "linear-gradient(135deg, #ff6b6b, #ee5a9b)",
  "linear-gradient(135deg, #4facfe, #6a5af9)",
  "linear-gradient(135deg, #11c9a0, #38a3f1)",
  "linear-gradient(135deg, #ffb347, #ff6f61)",
  "linear-gradient(135deg, #a18cd1, #fbc2eb)",
  "linear-gradient(135deg, #43cea2, #185a9d)",
];

interface Ev {
  id: string;
  metricId: string;
  ts: Date;
}

const startOfDay = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};
const startOfWeek = () => {
  const d = startOfDay();
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d;
};

const datingMetrics = [
  { id: "closes", label: "Closes" },
  { id: "mismatch", label: "Mismatch" },
  { id: "old-contact", label: "Old contact" },
];

export default function TallyTab({ uid, tab }: { uid: string; tab: TabDoc }) {
  const [events, setEvents] = useState<Ev[]>([]);
  const col = collection(db, "users", uid, "tabs", tab.id, "events");
  const savedMetrics = tab.metrics ?? [];
  const metrics =
    tab.id === "dating"
      ? [
          ...savedMetrics,
          ...datingMetrics.filter(
            (metric) => !savedMetrics.some((saved) => saved.id === metric.id)
          ),
        ]
      : savedMetrics;

  useEffect(() => {
    const q = query(
      collection(db, "users", uid, "tabs", tab.id, "events"),
      where("ts", ">=", Timestamp.fromDate(startOfWeek())),
      orderBy("ts", "desc")
    );
    return onSnapshot(q, (snap) =>
      setEvents(
        snap.docs.map((d) => {
          const data = d.data({ serverTimestamps: "estimate" });
          return { id: d.id, metricId: data.metricId, ts: data.ts.toDate() };
        })
      )
    );
  }, [uid, tab.id]);

  const add = (metricId: string) => addDoc(col, { metricId, ts: serverTimestamp() });
  const dayStart = startOfDay();

  // Events are sorted newest first, so the first match is today's latest entry.
  const remove = (metricId: string) => {
    const last = events.find((e) => e.metricId === metricId && e.ts >= dayStart);
    if (last) deleteDoc(doc(col, last.id));
  };

  return (
    <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
      {metrics.map((m, i) => {
        const mine = events.filter((e) => e.metricId === m.id);
        const today = mine.filter((e) => e.ts >= dayStart).length;
        return (
          <TallyTile
            key={m.id}
            label={m.label}
            today={today}
            week={mine.length}
            gradient={GRADIENTS[i % GRADIENTS.length]}
            onAdd={() => add(m.id)}
            onRemove={() => remove(m.id)}
          />
        );
      })}
    </Box>
  );
}
