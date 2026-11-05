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
import WorkTicketsTab from "./WorkTicketsTab";
import ChecklistTab from "./ChecklistTab";
import SeedButton from "./SeedButton";
import DailyQuote from "./DailyQuote";

function TabContent({ uid, tab }: { uid: string; tab: TabDoc }) {
  switch (tab.type) {
    case "tally":
      return <TallyTab uid={uid} tab={tab} />;
    case "counter":
      if (tab.id === "work") return <WorkTicketsTab uid={uid} tab={tab} />;
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
      <AppBar
        position="sticky"
        elevation={2}
        sx={{ background: "linear-gradient(135deg, #6750a4 0%, #d0479b 100%)", color: "#fff" }}
      >
        <Toolbar sx={{ alignItems: "flex-start", pt: 1.5, pb: 0.5 }}>
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>
              Magic List
            </Typography>
            <DailyQuote />
          </Box>
          <IconButton aria-label="sign out" color="inherit" onClick={onSignOut}>
            <LogoutIcon />
          </IconButton>
        </Toolbar>
        {tabs && tabs.length > 0 && (
          <Tabs
            value={Math.min(index, tabs.length - 1)}
            onChange={(_, v) => setIndex(v)}
            variant="fullWidth"
            textColor="inherit"
            slotProps={{ indicator: { sx: { bgcolor: "#fff", height: 3 } } }}
          >
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
