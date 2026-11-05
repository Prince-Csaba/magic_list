"use client";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import GoogleIcon from "@mui/icons-material/Google";

export default function LoginScreen({ onSignIn }: { onSignIn: () => void }) {
  return (
    <Stack
      spacing={3}
      sx={{ alignItems: "center", justifyContent: "center", minHeight: "100dvh", p: 3 }}
    >
      <Typography variant="h4" sx={{ fontWeight: 700 }}>
        Magic List
      </Typography>
      <Button variant="contained" size="large" startIcon={<GoogleIcon />} onClick={onSignIn}>
        Sign in with Google
      </Button>
    </Stack>
  );
}
