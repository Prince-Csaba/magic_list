"use client";
import { doc, updateDoc } from "firebase/firestore";
import Card from "@mui/material/Card";
import Checkbox from "@mui/material/Checkbox";
import LinearProgress from "@mui/material/LinearProgress";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { db } from "@/lib/firebase";
import { todayKey, type TabDoc } from "@/lib/types";

export default function ChecklistTab({ uid, tab }: { uid: string; tab: TabDoc }) {
  const items = tab.items ?? [];
  const today = todayKey();
  // Checks from a previous day are ignored, so the list resets itself daily.
  const done = new Set(tab.doneDate === today ? tab.doneIds ?? [] : []);
  const pct = items.length ? (done.size / items.length) * 100 : 0;

  const toggle = (id: string) => {
    const next = new Set(done);
    if (!next.delete(id)) next.add(id);
    return updateDoc(doc(db, "users", uid, "tabs", tab.id), {
      doneDate: today,
      doneIds: [...next],
    });
  };

  return (
    <Card variant="outlined">
      <Stack spacing={1} sx={{ p: 2, pb: 0 }}>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          {done.size} / {items.length} done today
        </Typography>
        <LinearProgress variant="determinate" value={pct} sx={{ height: 8, borderRadius: 4 }} />
      </Stack>
      <List>
        {items.map((it) => (
          <ListItemButton key={it.id} onClick={() => toggle(it.id)}>
            <ListItemIcon>
              <Checkbox edge="start" checked={done.has(it.id)} disableRipple tabIndex={-1} />
            </ListItemIcon>
            <ListItemText
              primary={it.label}
              sx={done.has(it.id) ? { textDecoration: "line-through", opacity: 0.6 } : undefined}
            />
          </ListItemButton>
        ))}
      </List>
    </Card>
  );
}
