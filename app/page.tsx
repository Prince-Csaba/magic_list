"use client";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import { useAuth } from "@/lib/useAuth";
import LoginScreen from "@/components/LoginScreen";
import TabsShell from "@/components/TabsShell";

export default function Home() {
  const { user, loading, signIn, signOut } = useAuth();

  if (loading)
    return (
      <Box sx={{ display: "grid", placeItems: "center", minHeight: "100dvh" }}>
        <CircularProgress />
      </Box>
    );
  if (!user) return <LoginScreen onSignIn={signIn} />;
  return <TabsShell uid={user.uid} onSignOut={signOut} />;
}
