"use client";
import { useState } from "react";
import { collection, doc, runTransaction } from "firebase/firestore";
import AddIcon from "@mui/icons-material/Add";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import EditIcon from "@mui/icons-material/Edit";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import SettingsIcon from "@mui/icons-material/Settings";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import Collapse from "@mui/material/Collapse";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
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

const projectGradients = [
  "linear-gradient(135deg, #6750a4, #d0479b)",
  "linear-gradient(135deg, #397bd1, #7255bd)",
  "linear-gradient(135deg, #008f83, #348bc6)",
  "linear-gradient(135deg, #cb5b48, #d3852b)",
];

export default function ProjectsTab({ uid, tab }: { uid: string; tab: TabDoc }) {
  const [label, setLabel] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [renaming, setRenaming] = useState<{ id: string; label: string } | null>(null);
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

  const rename = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!renaming || !renaming.label.trim()) return;
    const { id } = renaming;
    const nextLabel = renaming.label.trim();
    if (await changeItems((current) =>
      current.map((item) => item.id === id ? { ...item, label: nextLabel } : item)
    )) {
      setRenaming(null);
    }
  };

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
      {items.length === 0 ? (
        <Card variant="outlined">
          <Typography color="text.secondary" sx={{ p: 2 }}>
            No projects yet. Add a focus to get started.
          </Typography>
        </Card>
      ) : (
        <Stack spacing={1.5}>
          {items.map((item, index) => (
            <Card key={item.id} variant="outlined" sx={{ overflow: "hidden", boxShadow: 1 }}>
              <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", p: 1.5 }}>
                <Box sx={{
                  background: projectGradients[index % projectGradients.length],
                  color: "#fff",
                  borderRadius: 2,
                  width: 44,
                  height: 44,
                  flexShrink: 0,
                  display: "grid",
                  placeItems: "center",
                }}>
                  <AutoAwesomeIcon />
                </Box>
                <Typography sx={{ fontWeight: 700, flex: 1, minWidth: 0, overflowWrap: "anywhere" }}>
                  {item.label}
                </Typography>
                <IconButton
                  aria-label={`Settings for ${item.label}`}
                  aria-expanded={expandedId === item.id}
                  aria-controls={`project-actions-${item.id}`}
                  disabled={busy}
                  onClick={() => setExpandedId((current) => current === item.id ? null : item.id)}
                  sx={{ color: "primary.main" }}
                >
                  <SettingsIcon />
                </IconButton>
              </Stack>
              <Stack direction="row" sx={{ px: 1.5, pb: 1.5 }}>
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
                  sx={{ minWidth: 140, color: priorityColors[item.priority ?? "none"] }}
                >
                  <MenuItem value="none">No priority</MenuItem>
                  <MenuItem value="high" sx={{ color: "error.main" }}>High</MenuItem>
                  <MenuItem value="medium" sx={{ color: "warning.main" }}>Medium</MenuItem>
                  <MenuItem value="low" sx={{ color: "success.main" }}>Low</MenuItem>
                </Select>
              </Stack>
              <Collapse in={expandedId === item.id}>
                <Stack
                  id={`project-actions-${item.id}`}
                  direction="row"
                  spacing={1}
                  sx={{ px: 1.5, py: 1, bgcolor: "action.hover", justifyContent: "flex-end" }}
                >
                  <IconButton
                    aria-label={`Move ${item.label} up`}
                    disabled={busy || index === 0}
                    onClick={() => void move(item.id, -1)}
                  >
                    <ArrowUpwardIcon />
                  </IconButton>
                  <IconButton
                    aria-label={`Move ${item.label} down`}
                    disabled={busy || index === items.length - 1}
                    onClick={() => void move(item.id, 1)}
                  >
                    <ArrowDownwardIcon />
                  </IconButton>
                  <IconButton
                    aria-label={`Rename ${item.label}`}
                    disabled={busy}
                    onClick={() => {
                      setError(null);
                      setRenaming({ id: item.id, label: item.label });
                    }}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    aria-label={`Delete ${item.label}`}
                    color="error"
                    disabled={busy}
                    onClick={() => void changeItems((current) =>
                      current.filter((entry) => entry.id !== item.id)
                    )}
                  >
                    <DeleteOutlineIcon />
                  </IconButton>
                </Stack>
              </Collapse>
            </Card>
          ))}
        </Stack>
      )}
      <Dialog open={Boolean(renaming)} onClose={() => { if (!busy) setRenaming(null); }} fullWidth maxWidth="xs">
        <form onSubmit={rename}>
          <DialogTitle>Rename project</DialogTitle>
          <DialogContent>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <TextField
              autoFocus
              fullWidth
              label="Project name"
              value={renaming?.label ?? ""}
              onChange={(event) => setRenaming((current) =>
                current ? { ...current, label: event.target.value } : current
              )}
              disabled={busy}
              sx={{ mt: 1 }}
            />
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
