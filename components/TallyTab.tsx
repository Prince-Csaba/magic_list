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
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import BarChartIcon from "@mui/icons-material/BarChart";
import GridViewIcon from "@mui/icons-material/GridView";
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
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [chart, setChart] = useState(false);
  const isDating = tab.id === "dating";
  const col = collection(db, "users", uid, "tabs", tab.id, "events");
  const savedMetrics = tab.metrics ?? [];
  const metrics =
    isDating
      ? [
          ...savedMetrics,
          ...datingMetrics.filter(
            (metric) => !savedMetrics.some((saved) => saved.id === metric.id)
          ),
        ]
      : savedMetrics;

  useEffect(() => {
    const eventsCollection = collection(db, "users", uid, "tabs", tab.id, "events");
    const q = isDating
      ? query(eventsCollection, orderBy("ts", "desc"))
      : query(eventsCollection, where("ts", ">=", Timestamp.fromDate(startOfWeek())), orderBy("ts", "desc"));
    return onSnapshot(
      q,
      (snap) => {
        setEvents(
          snap.docs.map((d) => {
            const data = d.data({ serverTimestamps: "estimate" });
            return { id: d.id, metricId: data.metricId, ts: data.ts.toDate() };
          })
        );
        setReady(true);
        setLoadError(null);
      },
      (snapshotError) => {
        setLoadError(snapshotError.message);
        setReady(true);
      }
    );
  }, [uid, tab.id, isDating]);

  const add = async (metricId: string) => {
    try {
      await addDoc(col, { metricId, ts: serverTimestamp() });
      setError(null);
    } catch (addError) {
      setError(addError instanceof Error ? addError.message : "Could not add the event.");
    }
  };
  const dayStart = startOfDay();

  const remove = async (metricId: string) => {
    const last = events.find((e) => e.metricId === metricId && (isDating || e.ts >= dayStart));
    if (!last) return;
    try {
      await deleteDoc(doc(col, last.id));
      setError(null);
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : "Could not remove the event.");
    }
  };

  const counts = metrics.map((metric) => events.filter((event) => event.metricId === metric.id).length);
  const maxCount = Math.max(0, ...counts);

  return (
    <Stack spacing={2}>
      {isDating && (
        <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
          <IconButton
            aria-label={chart ? "Show dating counters" : "Show dating chart"}
            title={chart ? "Show counters" : "Show chart"}
            onClick={() => setChart(!chart)}
          >
            {chart ? <GridViewIcon /> : <BarChartIcon />}
          </IconButton>
        </Box>
      )}
      {error && <Alert severity="error">{error}</Alert>}
      {loadError && <Alert severity="error">{loadError}</Alert>}
      {loadError ? null : !ready ? (
        <Box sx={{ textAlign: "center", pt: 3 }}><CircularProgress /></Box>
      ) : chart && isDating ? (
        <Stack spacing={2}>
          <Typography variant="h6">All-time dating activity</Typography>
          <Typography variant="body2" color="text.secondary">
            Percentages compare each count with the preceding metric.
          </Typography>
          {metrics.map((metric, index) => {
            const count = counts[index];
            const previous = counts[index - 1];
            const percentage = index > 0 && previous > 0
              ? `${Number(((count / previous) * 100).toFixed(1))}% of ${metrics[index - 1].label}`
              : index === 0 ? "First metric" : `N/A (no ${metrics[index - 1].label})`;
            return (
              <Box key={metric.id}>
                <Stack direction="row" spacing={1} sx={{ justifyContent: "space-between" }}>
                  <Typography sx={{ fontWeight: 700 }}>{metric.label}</Typography>
                  <Typography>{count}</Typography>
                </Stack>
                <Box sx={{ height: 16, bgcolor: "action.hover", borderRadius: 2, overflow: "hidden", my: 0.5 }}>
                  <Box sx={{ width: `${maxCount ? (count / maxCount) * 100 : 0}%`, height: "100%", background: GRADIENTS[index % GRADIENTS.length] }} />
                </Box>
                <Typography variant="caption" color="text.secondary">{percentage}</Typography>
              </Box>
            );
          })}
        </Stack>
      ) : (
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
                allTime={isDating ? mine.length : undefined}
                gradient={GRADIENTS[i % GRADIENTS.length]}
                onAdd={() => add(m.id)}
                onRemove={() => remove(m.id)}
              />
            );
          })}
        </Box>
      )}
    </Stack>
  );
}
