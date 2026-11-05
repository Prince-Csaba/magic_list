"use client";
import { doc, increment, updateDoc } from "firebase/firestore";
import Card from "@mui/material/Card";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import { db } from "@/lib/firebase";
import type { TabDoc } from "@/lib/types";

export default function CounterTab({ uid, tab }: { uid: string; tab: TabDoc }) {
  const value = tab.value ?? 0;
  const change = (n: number) =>
    updateDoc(doc(db, "users", uid, "tabs", tab.id), { value: increment(n) });

  return (
    <Card variant="outlined" sx={{ p: 3 }}>
      <Stack spacing={2} sx={{ alignItems: "center" }}>
        <Typography variant="subtitle1">{tab.label ?? tab.name}</Typography>
        <Typography variant="h1" sx={{ fontWeight: 700 }}>
          {value}
        </Typography>
        <Stack direction="row" spacing={4}>
          <IconButton
            color="primary"
            size="large"
            disabled={value <= 0}
            onClick={() => change(-1)}
            sx={{ border: 1, width: 72, height: 72 }}
            aria-label="decrease"
          >
            <RemoveIcon fontSize="large" />
          </IconButton>
          <IconButton
            color="primary"
            size="large"
            onClick={() => change(1)}
            sx={{ border: 1, width: 72, height: 72 }}
            aria-label="increase"
          >
            <AddIcon fontSize="large" />
          </IconButton>
        </Stack>
      </Stack>
    </Card>
  );
}
