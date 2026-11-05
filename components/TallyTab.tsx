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
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import UndoIcon from "@mui/icons-material/Undo";
import { db } from "@/lib/firebase";
import type { TabDoc } from "@/lib/types";

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

export default function TallyTab({ uid, tab }: { uid: string; tab: TabDoc }) {
  const [events, setEvents] = useState<Ev[]>([]);
  const col = collection(db, "users", uid, "tabs", tab.id, "events");

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
  const undo = (metricId: string) => {
    const last = events.find((e) => e.metricId === metricId);
    if (last) deleteDoc(doc(col, last.id));
  };

  const dayStart = startOfDay();

  return (
    <Stack spacing={2}>
      {(tab.metrics ?? []).map((m) => {
        const mine = events.filter((e) => e.metricId === m.id);
        const today = mine.filter((e) => e.ts >= dayStart).length;
        return (
          <Card key={m.id} variant="outlined">
            <Stack direction="row" sx={{ alignItems: "center" }}>
              <CardActionArea onClick={() => add(m.id)} sx={{ p: 2, flex: 1 }}>
                <Typography variant="subtitle1">{m.label}</Typography>
                <Box sx={{ display: "flex", alignItems: "baseline", gap: 2 }}>
                  <Typography variant="h3" sx={{ fontWeight: 700 }}>
                    {today}
                  </Typography>
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    today · {mine.length} this week
                  </Typography>
                </Box>
              </CardActionArea>
              <IconButton aria-label="undo" onClick={() => undo(m.id)} sx={{ mr: 1 }}>
                <UndoIcon />
              </IconButton>
            </Stack>
          </Card>
        );
      })}
    </Stack>
  );
}
