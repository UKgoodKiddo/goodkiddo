import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "goodKiddo",
    short_name: "goodKiddo",
    description:
      "A parent-controlled reward app where children collect boops with NFC Boopers.",
    start_url: "/",
    display: "standalone",
    background_color: "#fff9ef",
    theme_color: "#ff8659",
    icons: [
      {
        src: "/goodkiddo/app-icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/goodkiddo/app-icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/goodkiddo/app-icon-maskable-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/goodkiddo/app-icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/apple-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
