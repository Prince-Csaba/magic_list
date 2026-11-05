"use client";
import { useState } from "react";
import { doc, writeBatch } from "firebase/firestore";
import Button from "@mui/material/Button";
import { db } from "@/lib/firebase";

const id = () => Math.random().toString(36).slice(2, 9);
const items = (labels: string[]) => labels.map((label) => ({ id: id(), label }));

export default function SeedButton({ uid }: { uid: string }) {
  const [busy, setBusy] = useState(false);

  const seed = async () => {
    setBusy(true);
    const batch = writeBatch(db);
    const tab = (key: string, data: object) =>
      batch.set(doc(db, "users", uid, "tabs", key), data);

    tab("dating", {
      name: "Dating",
      type: "tally",
      order: 0,
      metrics: items(["Matches", "Conversations", "Contacts", "Dates"]),
    });
    tab("work", {
      name: "Work",
      type: "counter",
      order: 1,
      label: "Open tickets",
      value: 0,
    });
    tab("morning", {
      name: "Morning",
      type: "checklist",
      order: 2,
      items: items(["Wake up on time", "Drink water", "Exercise", "Shower", "Breakfast"]),
      doneIds: [],
    });

    await batch.commit();
    setBusy(false);
  };

  return (
    <Button variant="contained" onClick={seed} disabled={busy}>
      Create starter tabs
    </Button>
  );
}
