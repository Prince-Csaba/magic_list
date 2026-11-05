"use client";
import { useEffect, useState } from "react";
import Typography from "@mui/material/Typography";
import { todayKey } from "@/lib/types";

interface Quote {
  quote: string;
  author: string;
}

const FALLBACK: Quote = {
  quote: "The secret of getting ahead is getting started.",
  author: "Mark Twain",
};
const KEY = "magic-list-quote";

export default function DailyQuote() {
  const [q, setQ] = useState<Quote>(FALLBACK);

  useEffect(() => {
    const cached = localStorage.getItem(KEY);
    const hit = cached ? (JSON.parse(cached) as { day: string; quote: Quote }) : null;
    const request =
      hit && hit.day === todayKey()
        ? Promise.resolve(hit.quote)
        : fetch("https://dummyjson.com/quotes/random")
            .then((r) => r.json())
            .then((data: Quote) => {
              const quote = { quote: data.quote, author: data.author };
              localStorage.setItem(KEY, JSON.stringify({ day: todayKey(), quote }));
              return quote;
            });
    request.then(setQ).catch(() => {});
  }, []);

  return (
    <Typography variant="caption" sx={{ display: "block", opacity: 0.85, pb: 1, lineHeight: 1.3 }}>
      “{q.quote}” — {q.author}
    </Typography>
  );
}
