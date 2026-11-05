"use client";
import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  cssVariables: true,
  colorSchemes: { light: true, dark: true },
  palette: { primary: { main: "#6750a4" } },
  shape: { borderRadius: 16 },
});
