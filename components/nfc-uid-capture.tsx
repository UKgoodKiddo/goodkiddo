"use client";

import type { ReactNode } from "react";
import { useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type ScanTone = "error" | "neutral" | "success";

type WebNdefReader = {
  onreading: ((event: NDEFReadingEvent) => void) | null;
  onreadingerror: ((event: Event) => void) | null;
  scan: (options?: { signal?: AbortSignal }) => Promise<void>;
};

type WebNdefReaderConstructor = new () => WebNdefReader;

type WebNfcWindow = Window & {
  NDEFReader?: WebNdefReaderConstructor;
};

export function NfcUidCapture({
  autoStart = false,
  autoSubmit = false,
  buttonLabel,
  buttonChildren,
  buttonClassName,
  defaultValue = "",
  helperText = "Scan with a compatible device, or type the supplier UID manually.",
  inputLabel = "Booper UID",
  inputName,
  onUidChange,
  required = false,
  scanningLabel = "Waiting for wristband...",
  showInput = true,
  showMessage = true,
  successMessage,
}: {
  autoStart?: boolean;
  autoSubmit?: boolean;
  buttonLabel: string;
  buttonChildren?: ReactNode;
  buttonClassName?: string;
  defaultValue?: string;
  helperText?: string;
  inputLabel?: string;
  inputName: string;
  onUidChange?: (uid: string) => void;
  required?: boolean;
  scanningLabel?: string;
  showInput?: boolean;
  showMessage?: boolean;
  successMessage?: string;
}) {
  const fieldId = useId();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [message, setMessage] = useState(helperText);
  const [tone, setTone] = useState<ScanTone>("neutral");
  const [uid, setUid] = useState(defaultValue);
  const hasAutoStartedRef = useRef(false);
  const startScanRef = useRef<(source?: "auto" | "manual") => Promise<void>>(async () => {});

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (!autoStart || hasAutoStartedRef.current) {
      return;
    }

    hasAutoStartedRef.current = true;
    void startScanRef.current("auto");
  }, [autoStart]);

  function updateUid(nextUid: string) {
    setUid(nextUid);
    onUidChange?.(nextUid);
  }

  function setFeedback(nextTone: ScanTone, nextMessage: string) {
    setTone(nextTone);
    setMessage(nextMessage);
  }

  async function startScan(source: "auto" | "manual" = "manual") {
    if (isScanning) {
      return;
    }

    const nfcWindow = window as WebNfcWindow;
    const Reader = nfcWindow.NDEFReader;

    if (!Reader) {
      setFeedback(
        "error",
        source === "auto"
          ? "This device does not support Web NFC. Tap the button below if you want to try again on another device."
          : "This browser or device does not support Web NFC. Chrome on Android works best.",
      );
      return;
    }

    abortRef.current?.abort();
    const abortController = new AbortController();
    abortRef.current = abortController;

    try {
      const reader = new Reader();
      reader.onreading = (event) => {
        const scannedUid = event.serialNumber?.trim() ?? "";

        if (!scannedUid) {
          setIsScanning(false);
          setFeedback(
            "error",
            "This tag did not expose a readable UID serial number. Type the supplier UID manually if needed.",
          );
          return;
        }

        updateUid(scannedUid);
        setIsScanning(false);

        if (autoSubmit) {
          setFeedback(
            "success",
            successMessage ?? "Booper detected. Assigning it now...",
          );
          requestAnimationFrame(() => {
            inputRef.current?.form?.requestSubmit();
          });
        } else {
          setFeedback(
            "success",
            successMessage ?? "Booper detected. Submit the form to continue.",
          );
        }

        abortController.abort();
      };

      reader.onreadingerror = () => {
        setIsScanning(false);
        setFeedback(
          "error",
          "The device saw an NFC tag but could not read its UID. Try again or type the supplier UID manually.",
        );
      };

      setIsScanning(true);
      setFeedback("neutral", "Hold the Booper wristband against this device now.");
      await reader.scan({ signal: abortController.signal });
    } catch (error) {
      setIsScanning(false);

      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      if (error instanceof DOMException && error.name === "NotAllowedError") {
        setFeedback(
          "error",
          source === "auto"
            ? "Tap “Scan your NFC Booper!” to activate NFC on this device."
            : "NFC permission was denied. Allow NFC access in the browser prompt, then try again.",
        );
        return;
      }

      if (error instanceof DOMException && error.name === "NotReadableError") {
        setFeedback(
          "error",
          "This device could not access NFC hardware right now. Try again, or use a compatible NFC-enabled device.",
        );
        return;
      }

      if (error instanceof DOMException && error.name === "InvalidStateError") {
        setFeedback(
          "error",
          "The NFC reader is not ready yet. Bring the page back into focus and try again.",
        );
        return;
      }

      setFeedback(
        "error",
        source === "auto"
          ? "Tap “Scan your NFC Booper!” to try again on this device."
          : "NFC scanning could not start on this device. Try again in Chrome on Android.",
      );
    }
  }

  useEffect(() => {
    startScanRef.current = startScan;
  });

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap gap-2">
        <button
          className={cn("btn btn-secondary", buttonClassName)}
          onClick={() => void startScan("manual")}
          type="button"
        >
          {isScanning ? scanningLabel : buttonChildren ?? buttonLabel}
        </button>
      </div>

      {showInput ? (
        <label className="grid gap-2" htmlFor={fieldId}>
          <span className="text-sm font-bold text-[color:var(--ink-soft)]">
            {inputLabel}
          </span>
          <input
            autoCapitalize="characters"
            autoCorrect="off"
            className="field"
            id={fieldId}
            name={inputName}
            onChange={(event) => updateUid(event.target.value)}
            placeholder="Scanned UID appears here"
            ref={inputRef}
            required={required}
            spellCheck={false}
            value={uid}
          />
        </label>
      ) : (
        <input
          name={inputName}
          ref={inputRef}
          required={required}
          type="hidden"
          value={uid}
        />
      )}

      {showMessage || tone === "error" ? (
        <p
          className={cn(
            "text-sm leading-6",
            tone === "error"
              ? "text-rose-700"
              : tone === "success"
                ? "text-[color:var(--secondary)]"
                : "text-[color:var(--ink-soft)]",
          )}
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}
