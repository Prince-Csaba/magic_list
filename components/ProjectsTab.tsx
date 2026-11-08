"use client";
import { useState } from "react";
import { collection, doc, runTransaction } from "firebase/firestore";
import AddIcon from "@mui/icons-material/Add";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { db } from "@/lib/firebase";
import type { ProjectItem, ProjectPriority, TabDoc } from "@/lib/types";

const priorityColors: Record<ProjectPriority, string> = {
  none: "text.secondary",
  high: "error.main",
  medium: "warning.main",
  low: "success.main",
};

export default function ProjectsTab({ uid, tab }: { uid: string; tab: TabDoc }) {
  const [label, setLabel] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const items = tab.items ?? [];

  const changeItems = async (change: (current: ProjectItem[]) => ProjectItem[]) => {
    setBusy(true);
    setError(null);
    try {
      const ref = doc(db, "users", uid, "tabs", tab.id);
      await runTransaction(db, async (transaction) => {
        const snapshot = await transaction.get(ref);
        const current = snapshot.exists() ? (snapshot.data().items ?? []) as ProjectItem[] : [];
        const next = change(current);
        if (snapshot.exists()) {
          transaction.update(ref, { items: next });
        } else {
          transaction.set(ref, { name: tab.name, type: tab.type, order: tab.order, items: next });
        }
      });
      return true;
    } catch (changeError) {
      setError(changeError instanceof Error ? changeError.message : "Could not update projects.");
      return false;
    } finally {
      setBusy(false);
    }
  };

  const add = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = label.trim();
    if (!trimmed) return;
    const id = doc(collection(db, "users", uid, "tabs", tab.id, "projectIds")).id;
    if (await changeItems((current) => [...current, { id, label: trimmed }])) {
      setLabel("");
    }
  };

  const move = (id: string, direction: -1 | 1) =>
    changeItems((current) => {
      const index = current.findIndex((item) => item.id === id);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });

  return (
    <Stack spacing={2}>
      <Typography color="text.secondary">
        Keep your long-term focuses and priorities in order.
      </Typography>
      {error && <Alert severity="error">{error}</Alert>}
      <Stack component="form" direction="row" spacing={1} onSubmit={add}>
        <TextField
          label="New project"
          placeholder="e.g. Get a drone certificate"
          value={label}
          onChange={(event) => setLabel(event.target.value)}
          disabled={busy}
          size="small"
          fullWidth
        />
        <Button type="submit" variant="contained" disabled={busy || !label.trim()} startIcon={<AddIcon />}>
          Add
        </Button>
      </Stack>
      <Card variant="outlined">
        {items.length === 0 ? (
          <Typography color="text.secondary" sx={{ p: 2 }}>
            No projects yet. Add a focus to get started.
          </Typography>
        ) : (
          <List disablePadding>
            {items.map((item, index) => (
              <ListItem
                key={item.id}
                divider={index < items.length - 1}
                sx={{ flexWrap: "wrap" }}
              >
                <ListItemText
                  primary={item.label}
                  sx={{ overflowWrap: "anywhere", minWidth: { xs: "100%", sm: 0 } }}
                />
                <Select<ProjectPriority>
                  value={item.priority ?? "none"}
                  onChange={(event) => {
                    const priority = event.target.value;
                    void changeItems((current) =>
                      current.map((entry) => entry.id === item.id ? { ...entry, priority } : entry)
                    );
                  }}
                  inputProps={{ "aria-label": `Priority for ${item.label}` }}
                  disabled={busy}
                  size="small"
                  sx={{ minWidth: 140, color: priorityColors[item.priority ?? "none"], mr: "auto" }}
                >
                  <MenuItem value="none">No priority</MenuItem>
                  <MenuItem value="high" sx={{ color: "error.main" }}>High</MenuItem>
                  <MenuItem value="medium" sx={{ color: "warning.main" }}>Medium</MenuItem>
                  <MenuItem value="low" sx={{ color: "success.main" }}>Low</MenuItem>
                </Select>
                <IconButton
                  aria-label={`Move ${item.label} up`}
                  disabled={busy || index === 0}
                  onClick={() => move(item.id, -1)}
                >
                  <ArrowUpwardIcon />
                </IconButton>
                <IconButton
                  aria-label={`Move ${item.label} down`}
                  disabled={busy || index === items.length - 1}
                  onClick={() => move(item.id, 1)}
                >
                  <ArrowDownwardIcon />
                </IconButton>
                <IconButton
                  aria-label={`Delete ${item.label}`}
                  disabled={busy}
                  onClick={() => changeItems((current) => current.filter((entry) => entry.id !== item.id))}
                >
                  <DeleteOutlineIcon />
                </IconButton>
              </ListItem>
            ))}
          </List>
        )}
      </Card>
    </Stack>
  );
}
