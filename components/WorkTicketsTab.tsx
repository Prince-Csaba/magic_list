"use client";
import { useEffect, useMemo, useState } from "react";
import {
  collection,
  doc,
  increment,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import Alert from "@mui/material/Alert";
import Card from "@mui/material/Card";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { db } from "@/lib/firebase";
import { todayKey, type TabDoc } from "@/lib/types";

interface DailyTickets {
  date: string;
  morning: number;
  evening: number;
}

function formatDate(date: string) {
  const [, month, day] = date.split("-");
  return `${Number(month)}/${Number(day)}`;
}

export default function WorkTicketsTab({ uid, tab }: { uid: string; tab: TabDoc }) {
  const [records, setRecords] = useState<DailyTickets[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const today = todayKey();
  const history = useMemo(
    () => collection(db, "users", uid, "tabs", tab.id, "dailyTickets"),
    [uid, tab.id]
  );
  const todayRef = useMemo(() => doc(history, today), [history, today]);
  const todayRecord = records.find((record) => record.date === today);

  useEffect(() => {
    let active = true;
    const historyQuery = query(history, orderBy("date", "desc"));
    const unsubscribe = onSnapshot(
      historyQuery,
      async (snapshot) => {
        const dailyRecords = snapshot.docs.map((entry) => {
          const data = entry.data();
          return {
            date: data.date as string,
            morning: data.morning as number,
            evening: data.evening as number,
          };
        });
        if (active) setRecords(dailyRecords);

        try {
          const existingToday = dailyRecords.some((record) => record.date === today);
          if (!existingToday) {
            await runTransaction(db, async (transaction) => {
              const current = await transaction.get(todayRef);
              if (!current.exists()) {
                transaction.set(todayRef, {
                  date: today,
                  morning: dailyRecords.length === 0 ? (tab.value ?? 0) : 0,
                  evening: 0,
                  savedAt: serverTimestamp(),
                });
              }
            });
          }
          if (active) {
            setReady(true);
            setError(null);
          }
        } catch (initError) {
          if (active) {
            setError(
              initError instanceof Error ? initError.message : "Could not load today's ticket counts."
            );
            setReady(true);
          }
        }
      },
      (snapshotError) => {
        if (active) {
          setError(snapshotError.message);
          setReady(true);
        }
      }
    );

    return () => {
      active = false;
      unsubscribe();
    };
  }, [history, tab.value, today, todayRef]);

  const change = async (field: "morning" | "evening", amount: number) => {
    setError(null);
    try {
      await runTransaction(db, async (transaction) => {
        const current = await transaction.get(todayRef);
        if (!current.exists()) {
          throw new Error("Today's ticket counts are not ready yet. Please try again.");
        }
        const value = (current.data()[field] as number) ?? 0;
        if (value + amount < 0) return;
        transaction.update(todayRef, { [field]: increment(amount) });
      });
    } catch (changeError) {
      setError(changeError instanceof Error ? changeError.message : "Could not update ticket count.");
    }
  };

  return (
    <Stack spacing={2}>
      {error && <Alert severity="error">{error}</Alert>}
      <TicketCounter
        label="Open tickets morning"
        value={todayRecord?.morning ?? 0}
        disabled={!ready}
        onChange={(amount) => change("morning", amount)}
      />
      <TicketCounter
        label="Open tickets evening"
        value={todayRecord?.evening ?? 0}
        disabled={!ready}
        onChange={(amount) => change("evening", amount)}
      />
      <Stack spacing={0.5}>
        <Typography variant="h6">Previous days</Typography>
        {!ready ? (
          <Typography color="text.secondary">Loading ticket history…</Typography>
        ) : records.filter((record) => record.date < today).length === 0 ? (
          <Typography color="text.secondary">Previous daily counts will appear here.</Typography>
        ) : (
          <List disablePadding>
            {records
              .filter((record) => record.date < today)
              .map((record) => (
                <ListItem key={record.date} divider sx={{ px: 0 }}>
                  <Stack
                    direction="row"
                    spacing={2}
                    sx={{ width: "100%", justifyContent: "space-between" }}
                  >
                    <Typography sx={{ fontWeight: 700 }}>{formatDate(record.date)}</Typography>
                    <Typography variant="body2">
                      Morning {record.morning} · Evening {record.evening}
                    </Typography>
                  </Stack>
                </ListItem>
              ))}
          </List>
        )}
      </Stack>
    </Stack>
  );
}

function TicketCounter({
  label,
  value,
  disabled,
  onChange,
}: {
  label: string;
  value: number;
  disabled: boolean;
  onChange: (amount: number) => void;
}) {
  return (
    <Card variant="outlined" sx={{ p: 3 }}>
      <Stack spacing={2} sx={{ alignItems: "center" }}>
        <Typography variant="subtitle1">{label}</Typography>
        <Typography variant="h1" sx={{ fontWeight: 700 }}>
          {value}
        </Typography>
        <Stack direction="row" spacing={4}>
          <IconButton
            color="primary"
            size="large"
            disabled={disabled || value <= 0}
            onClick={() => onChange(-1)}
            sx={{ border: 1, width: 72, height: 72 }}
            aria-label={`decrease ${label}`}
          >
            <RemoveIcon fontSize="large" />
          </IconButton>
          <IconButton
            color="primary"
            size="large"
            disabled={disabled}
            onClick={() => onChange(1)}
            sx={{ border: 1, width: 72, height: 72 }}
            aria-label={`increase ${label}`}
          >
            <AddIcon fontSize="large" />
          </IconButton>
        </Stack>
      </Stack>
    </Card>
  );
}
