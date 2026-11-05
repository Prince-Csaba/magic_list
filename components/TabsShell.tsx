"use client";
import { useState } from "react";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Container from "@mui/material/Container";
import IconButton from "@mui/material/IconButton";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Stack from "@mui/material/Stack";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import LogoutIcon from "@mui/icons-material/Logout";
import { useTabs } from "@/lib/useTabs";
import type { TabDoc } from "@/lib/types";
import TallyTab from "./TallyTab";
import CounterTab from "./CounterTab";
import ChecklistTab from "./ChecklistTab";
import SeedButton from "./SeedButton";

function TabContent({ uid, tab }: { uid: string; tab: TabDoc }) {
  switch (tab.type) {
    case "tally":
      return <TallyTab uid={uid} tab={tab} />;
    case "counter":
      return <CounterTab uid={uid} tab={tab} />;
    case "checklist":
      return <ChecklistTab uid={uid} tab={tab} />;
  }
}

export default function TabsShell({ uid, onSignOut }: { uid: string; onSignOut: () => void }) {
  const tabs = useTabs(uid);
  const [index, setIndex] = useState(0);
  const current = tabs?.[Math.min(index, (tabs?.length ?? 1) - 1)];

  return (
    <Box sx={{ minHeight: "100dvh" }}>
      <AppBar position="sticky" color="default" elevation={1}>
        <Toolbar variant="dense" sx={{ gap: 1 }}>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700 }}>
            Magic List
          </Typography>
          <IconButton aria-label="sign out" onClick={onSignOut}>
            <LogoutIcon />
          </IconButton>
        </Toolbar>
        {tabs && tabs.length > 0 && (
          <Tabs value={Math.min(index, tabs.length - 1)} onChange={(_, v) => setIndex(v)} variant="fullWidth">
            {tabs.map((t) => (
              <Tab key={t.id} label={t.name} />
            ))}
          </Tabs>
        )}
      </AppBar>
      <Container maxWidth="sm" sx={{ py: 2 }}>
        {tabs === null && (
          <Box sx={{ textAlign: "center", pt: 6 }}>
            <CircularProgress />
          </Box>
        )}
        {tabs?.length === 0 && (
          <Stack spacing={2} sx={{ alignItems: "center", pt: 6 }}>
            <Typography sx={{ color: "text.secondary" }}>No tabs yet.</Typography>
            <SeedButton uid={uid} />
          </Stack>
        )}
        {current && <TabContent key={current.id} uid={uid} tab={current} />}
      </Container>
    </Box>
  );
}
