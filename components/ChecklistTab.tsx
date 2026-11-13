"use client";
import { useEffect, useMemo, useState } from "react";
import {
  collection, doc, onSnapshot, orderBy, query, runTransaction,
  type Transaction,
} from "firebase/firestore";
import AddIcon from "@mui/icons-material/Add";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import EditIcon from "@mui/icons-material/Edit";
import HistoryIcon from "@mui/icons-material/History";
import SettingsIcon from "@mui/icons-material/Settings";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import Checkbox from "@mui/material/Checkbox";
import Collapse from "@mui/material/Collapse";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import LinearProgress from "@mui/material/LinearProgress";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { db } from "@/lib/firebase";
import { snapshotChecklist, type ChecklistHistoryDay } from "@/lib/checklistHistory";
import { todayKey, type ProjectItem, type TabDoc } from "@/lib/types";

function recentDates(today: string) {
  const [year, month, day] = today.split("-").map(Number);
  const date = new Date(year, month - 1, day, 12);
  return Array.from({ length: 7 }, () => {
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    date.setDate(date.getDate() - 1);
    return key;
  });
}

export default function ChecklistTab({ uid, tab }: { uid: string; tab: TabDoc }) {
  const [today, setToday] = useState(todayKey);
  const [label, setLabel] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [history, setHistory] = useState<ChecklistHistoryDay[]>([]);
  const [historyReady, setHistoryReady] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [renaming, setRenaming] = useState<{ id: string; label: string } | null>(null);
  const tabRef = useMemo(() => doc(db, "users", uid, "tabs", tab.id), [uid, tab.id]);
  const historyRef = useMemo(() => collection(tabRef, "dailyChecklist"), [tabRef]);
  const items = tab.items ?? [];
  const done = new Set(tab.doneDate === today ? tab.doneIds ?? [] : []);
  const completed = items.filter((item) => done.has(item.id)).length;

  useEffect(() => {
    const updateDate = () => setToday(todayKey());
    const timer = window.setInterval(updateDate, 60_000);
    document.addEventListener("visibilitychange", updateDate);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", updateDate);
    };
  }, []);

  useEffect(() => {
    return onSnapshot(query(historyRef, orderBy("date", "desc")), (snapshot) => {
      setHistory(snapshot.docs.map((entry) => entry.data() as ChecklistHistoryDay));
      setHistoryReady(true);
      setHistoryError(null);
    }, (snapshotError) => {
      setHistoryError(snapshotError.message);
      setHistoryReady(true);
    });
  }, [historyRef]);

  // Save the last legacy day before a routine edit can change its labels.
  const readLegacy = async (transaction: Transaction, current: Omit<TabDoc, "id">) => {
    if (!current.doneDate) return null;
    const ref = doc(historyRef, current.doneDate);
    const saved = await transaction.get(ref);
    return { ref, saved };
  };

  useEffect(() => {
    let active = true;
    void runTransaction(db, async (transaction) => {
      const current = await transaction.get(tabRef);
      if (!current.exists()) return;
      const data = current.data() as Omit<TabDoc, "id">;
      const legacy = data.doneDate
        ? { ref: doc(historyRef, data.doneDate), date: data.doneDate }
        : null;
      if (!legacy) return;
      const saved = await transaction.get(legacy.ref);
      if (!saved.exists()) {
        transaction.set(legacy.ref, {
          date: legacy.date,
          items: snapshotChecklist(data.items ?? [], data.doneIds ?? []),
        });
      }
    }).catch((migrationError: unknown) => {
      if (active) setError(migrationError instanceof Error ? migrationError.message : "Could not save checklist history.");
    });
    return () => { active = false; };
  }, [historyRef, tabRef]);

  const changeItems = async (change: (current: ProjectItem[]) => ProjectItem[]) => {
    setBusy(true);
    setError(null);
    try {
      const date = todayKey();
      await runTransaction(db, async (transaction) => {
        const snapshot = await transaction.get(tabRef);
        if (!snapshot.exists()) throw new Error("The checklist no longer exists.");
        const current = snapshot.data() as Omit<TabDoc, "id">;
        const legacy = await readLegacy(transaction, current);
        const nextItems = change(current.items ?? []);
        if (legacy && (current.doneDate === date || !legacy.saved.exists())) {
          const previous = legacy.saved.exists()
            ? (legacy.saved.data() as ChecklistHistoryDay).items
            : snapshotChecklist(current.items ?? [], current.doneIds ?? []);
          transaction.set(legacy.ref, {
            date: current.doneDate,
            items: current.doneDate === date
              ? snapshotChecklist(nextItems, current.doneIds ?? [], previous)
              : previous,
          });
        }
        transaction.update(tabRef, { items: nextItems });
      });
      return true;
    } catch (changeError) {
      setError(changeError instanceof Error ? changeError.message : "Could not update the routine.");
      return false;
    } finally {
      setBusy(false);
    }
  };

  const toggle = async (id: string) => {
    setBusy(true);
    setError(null);
    try {
      const date = todayKey();
      await runTransaction(db, async (transaction) => {
        const snapshot = await transaction.get(tabRef);
        if (!snapshot.exists()) throw new Error("The checklist no longer exists.");
        const current = snapshot.data() as Omit<TabDoc, "id">;
        const currentItems = current.items ?? [];
        if (!currentItems.some((item) => item.id === id)) throw new Error("This activity no longer exists.");
        const legacy = await readLegacy(transaction, current);
        const todayRef = doc(historyRef, date);
        const todaySnapshot = current.doneDate === date && legacy
          ? legacy.saved
          : await transaction.get(todayRef);
        const nextDone = new Set(current.doneDate === date ? current.doneIds ?? [] : []);
        if (!nextDone.delete(id)) nextDone.add(id);
        const previous = todaySnapshot.exists()
          ? (todaySnapshot.data() as ChecklistHistoryDay).items
          : current.doneDate === date
            ? snapshotChecklist(currentItems, current.doneIds ?? [])
            : [];
        if (legacy && current.doneDate !== date && !legacy.saved.exists()) {
          transaction.set(legacy.ref, {
            date: current.doneDate,
            items: snapshotChecklist(currentItems, current.doneIds ?? []),
          });
        }
        const doneIds = [...nextDone];
        transaction.set(todayRef, { date, items: snapshotChecklist(currentItems, doneIds, previous) });
        transaction.update(tabRef, { doneDate: date, doneIds });
      });
      setToday(date);
    } catch (toggleError) {
      setError(toggleError instanceof Error ? toggleError.message : "Could not update the checklist.");
    } finally {
      setBusy(false);
    }
  };

  const add = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = label.trim();
    if (!trimmed) return;
    const id = doc(collection(tabRef, "itemIds")).id;
    if (await changeItems((current) => [...current, { id, label: trimmed }])) setLabel("");
  };

  const move = (id: string, direction: -1 | 1) => changeItems((current) => {
    const index = current.findIndex((item) => item.id === id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= current.length) return current;
    const next = [...current];
    [next[index], next[target]] = [next[target], next[index]];
    return next;
  });

  const rename = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!renaming || !renaming.label.trim()) return;
    const { id } = renaming;
    const nextLabel = renaming.label.trim();
    if (await changeItems((current) =>
      current.map((item) => item.id === id ? { ...item, label: nextLabel } : item)
    )) setRenaming(null);
  };

  const historyByDate = new Map(history.map((day) => [day.date, day]));
  const dates = [...new Set([...recentDates(today), ...historyByDate.keys()])].sort().reverse();

  return (
    <Stack spacing={2}>
      {error && <Alert severity="error">{error}</Alert>}
      <Button
        startIcon={<HistoryIcon />}
        onClick={() => setShowHistory((current) => !current)}
        sx={{ alignSelf: "flex-end" }}
      >
        {showHistory ? "Back to routine" : "Daily history"}
      </Button>
      {showHistory ? (
        <Stack spacing={1.5}>
          <Typography variant="h6">Daily history</Typography>
          {historyError ? <Alert severity="error">{historyError}</Alert> : !historyReady ? (
            <Typography color="text.secondary">Loading history...</Typography>
          ) : dates.map((date) => {
            const record = historyByDate.get(date);
            const completedItems = record?.items.filter((item) => item.done) ?? [];
            return (
              <Card key={date} variant="outlined" sx={{ p: 2 }}>
                <Stack direction="row" sx={{ justifyContent: "space-between", gap: 1 }}>
                  <Typography sx={{ fontWeight: 700 }}>{date}{date === today ? " (Today)" : ""}</Typography>
                  <Typography color="text.secondary">
                    {record ? `${completedItems.length} / ${record.items.length} completed` : "No activity recorded"}
                  </Typography>
                </Stack>
                {record && completedItems.length > 0 && (
                  <Typography variant="body2" sx={{ mt: 1, overflowWrap: "anywhere" }}>
                    {completedItems.map((item) => item.label).join(" · ")}
                  </Typography>
                )}
              </Card>
            );
          })}
        </Stack>
      ) : (
        <>
          <Stack component="form" direction="row" spacing={1} onSubmit={add}>
            <TextField label="New activity" value={label} onChange={(event) => setLabel(event.target.value)} disabled={busy} size="small" fullWidth />
            <Button type="submit" variant="contained" disabled={busy || !label.trim()} startIcon={<AddIcon />}>Add</Button>
          </Stack>
          <Card variant="outlined">
            <Stack spacing={1} sx={{ p: 2, pb: 0 }}>
              <Typography variant="body2" color="text.secondary">{completed} / {items.length} done today</Typography>
              <LinearProgress variant="determinate" value={items.length ? completed / items.length * 100 : 0} sx={{ height: 8, borderRadius: 4 }} />
            </Stack>
            {items.length === 0 ? (
              <Typography color="text.secondary" sx={{ p: 2 }}>Add an activity to start your routine.</Typography>
            ) : (
              <List>
                {items.map((item, index) => (
                  <li key={item.id}>
                    <ListItem disablePadding secondaryAction={
                      <IconButton
                        aria-label={`Settings for ${item.label}`}
                        aria-expanded={expandedId === item.id}
                        aria-controls={`routine-actions-${item.id}`}
                        disabled={busy}
                        onClick={() => setExpandedId((current) => current === item.id ? null : item.id)}
                      ><SettingsIcon /></IconButton>
                    }>
                      <ListItemButton disabled={busy} onClick={() => void toggle(item.id)}>
                        <ListItemIcon><Checkbox edge="start" checked={done.has(item.id)} tabIndex={-1} disableRipple /></ListItemIcon>
                        <ListItemText primary={item.label} sx={{ overflowWrap: "anywhere", ...(done.has(item.id) ? { textDecoration: "line-through", opacity: 0.6 } : {}) }} />
                      </ListItemButton>
                    </ListItem>
                    <Collapse in={expandedId === item.id}>
                      <Stack id={`routine-actions-${item.id}`} direction="row" spacing={1} sx={{ px: 2, py: 1, bgcolor: "action.hover", justifyContent: "flex-end" }}>
                        <IconButton aria-label={`Move ${item.label} up`} disabled={busy || index === 0} onClick={() => void move(item.id, -1)}><ArrowUpwardIcon /></IconButton>
                        <IconButton aria-label={`Move ${item.label} down`} disabled={busy || index === items.length - 1} onClick={() => void move(item.id, 1)}><ArrowDownwardIcon /></IconButton>
                        <IconButton aria-label={`Rename ${item.label}`} disabled={busy} onClick={() => { setError(null); setRenaming({ id: item.id, label: item.label }); }}><EditIcon /></IconButton>
                        <IconButton aria-label={`Delete ${item.label}`} color="error" disabled={busy} onClick={() => void changeItems((current) => current.filter((entry) => entry.id !== item.id))}><DeleteOutlineIcon /></IconButton>
                      </Stack>
                    </Collapse>
                  </li>
                ))}
              </List>
            )}
          </Card>
        </>
      )}
      <Dialog open={Boolean(renaming)} onClose={() => { if (!busy) setRenaming(null); }} fullWidth maxWidth="xs">
        <form onSubmit={rename}>
          <DialogTitle>Rename activity</DialogTitle>
          <DialogContent>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <TextField autoFocus fullWidth label="Activity name" value={renaming?.label ?? ""} onChange={(event) => setRenaming((current) => current ? { ...current, label: event.target.value } : current)} disabled={busy} sx={{ mt: 1 }} />
          </DialogContent>
          <DialogActions>
            <Button disabled={busy} onClick={() => setRenaming(null)}>Cancel</Button>
            <Button type="submit" disabled={busy || !renaming?.label.trim()}>Save</Button>
          </DialogActions>
        </form>
      </Dialog>
    </Stack>
  );
}
