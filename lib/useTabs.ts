"use client";
import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { TabDoc } from "@/lib/types";

export function useTabs(uid: string) {
  const [tabs, setTabs] = useState<TabDoc[] | null>(null);

  useEffect(() => {
    const q = query(collection(db, "users", uid, "tabs"), orderBy("order"));
    return onSnapshot(q, (snap) =>
      setTabs(snap.docs.map((d) => ({ ...(d.data() as Omit<TabDoc, "id">), id: d.id })))
    );
  }, [uid]);

  return tabs;
}
