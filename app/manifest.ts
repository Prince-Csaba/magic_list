import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Magic List",
    short_name: "Magic List",
    description: "Daily tracker",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#6750a4",
    icons: [
      { src: "/icons/192", sizes: "192x192", type: "image/png" },
      { src: "/icons/512", sizes: "512x512", type: "image/png" },
      { src: "/icons/512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
