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
  autoSubmit = false,
  buttonLabel,
  buttonChildren,
  buttonClassName,
  defaultValue = "",
  helperText = "Scan with a compatible device, or type the supplier UID manually.",
  inputLabel = "Booper UID",
  inputName,
  required = false,
  showInput = true,
  showMessage = true,
}: {
  autoSubmit?: boolean;
  buttonLabel: string;
  buttonChildren?: ReactNode;
  buttonClassName?: string;
  defaultValue?: string;
  helperText?: string;
  inputLabel?: string;
  inputName: string;
  required?: boolean;
  showInput?: boolean;
  showMessage?: boolean;
}) {
  const fieldId = useId();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [message, setMessage] = useState(helperText);
  const [tone, setTone] = useState<ScanTone>("neutral");
  const [uid, setUid] = useState(defaultValue);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  function updateUid(nextUid: string) {
    setUid(nextUid);
  }

  function setFeedback(nextTone: ScanTone, nextMessage: string) {
    setTone(nextTone);
    setMessage(nextMessage);
  }

  async function startScan() {
    const nfcWindow = window as WebNfcWindow;
    const Reader = nfcWindow.NDEFReader;

    if (!Reader) {
      setFeedback(
        "error",
        "This browser or device does not support Web NFC. Chrome/Edge on Android works best. You can still type the supplier UID manually.",
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
          setFeedback("success", "Booper detected. Assigning it now...");
          requestAnimationFrame(() => {
            inputRef.current?.form?.requestSubmit();
          });
        } else {
          setFeedback("success", "Booper detected. Submit the form to continue.");
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
          "NFC permission was denied. Allow NFC access in the browser prompt, then try again.",
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
        "NFC scanning could not start on this device. You can still type the supplier UID manually.",
      );
    }
  }

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap gap-2">
        <button
          className={cn("btn btn-secondary", buttonClassName)}
          onClick={() => void startScan()}
          type="button"
        >
          {isScanning
            ? "Waiting for wristband..."
            : buttonChildren ?? buttonLabel}
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
