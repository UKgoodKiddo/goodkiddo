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
        src: "/icon.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/apple-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
