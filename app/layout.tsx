import type { Metadata, Viewport } from "next";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { theme } from "./theme";
import RegisterSW from "@/components/RegisterSW";

export const metadata: Metadata = {
  title: "Magic List",
  description: "Daily tracker",
  appleWebApp: { capable: true, title: "Magic List", statusBarStyle: "default" },
  icons: { apple: "/icons/180" },
};

export const viewport: Viewport = {
  themeColor: "#6750a4",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <AppRouterCacheProvider>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            {children}
            <RegisterSW />
          </ThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
