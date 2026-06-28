import Image from "next/image";

export type KiddoImageDebugMode = "log" | "off" | "placeholders";

export function KiddoRouteImage({
  alt,
  className,
  debugLabel,
  height,
  imageDebugMode = "off",
  src,
  width,
}: {
  alt: string;
  className?: string;
  debugLabel: string;
  height: number;
  imageDebugMode?: KiddoImageDebugMode;
  src: string;
  width: number;
}) {
  const loadingMethod =
    imageDebugMode === "placeholders" ? "placeholder-div" : "next-image-unoptimized";

  if (imageDebugMode !== "off") {
    console.info(
      "[goodKiddo][image-debug]",
      JSON.stringify({
        alt,
        debugLabel,
        height,
        loadingMethod,
        src,
        width,
      }),
    );
  }

  if (imageDebugMode === "placeholders") {
    return (
      <div
        aria-label={alt}
        className={className}
        role="img"
        style={{
          aspectRatio: `${width} / ${height}`,
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.22), rgba(255,255,255,0.08))",
          border: "1px dashed rgba(255,255,255,0.28)",
        }}
      />
    );
  }

  return (
    <Image
      alt={alt}
      className={className}
      height={height}
      src={src}
      unoptimized
      width={width}
    />
  );
}
