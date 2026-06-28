"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type PermissionStatusValue = "granted" | "denied" | "prompt" | "unsupported" | "unknown";

type ScanRecord = {
  id: string;
  index: number;
  lang: string | null;
  mediaType: string | null;
  payloadPreview: string | null;
  recordType: string;
  sizeBytes: number | null;
};

type ScanResult = {
  recordCount: number;
  records: ScanRecord[];
  scannedAt: string;
  serialNumber: string;
};

type WebNdefReader = {
  onreading: ((event: NDEFReadingEvent) => void) | null;
  onreadingerror: ((event: Event) => void) | null;
  scan: (options?: { signal?: AbortSignal }) => Promise<void>;
};

type WebNdefReaderConstructor = new () => WebNdefReader;

type WebNfcWindow = Window & {
  NDEFReader?: WebNdefReaderConstructor;
};

function decodeRecordPayload(record: NDEFRecord) {
  if (!record.data) {
    return null;
  }

  try {
    const buffer = record.data.buffer.slice(
      record.data.byteOffset,
      record.data.byteOffset + record.data.byteLength,
    );

    if (record.recordType === "url" || record.recordType === "text") {
      const decoder = new TextDecoder(record.encoding ?? "utf-8");
      return decoder.decode(buffer);
    }

    if (record.mediaType?.startsWith("text/")) {
      return new TextDecoder("utf-8").decode(buffer);
    }

    return `Binary payload (${record.data.byteLength} bytes)`;
  } catch {
    return "Payload could not be decoded on this device.";
  }
}

export function NfcHardwareTest() {
  const abortRef = useRef<AbortController | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [message, setMessage] = useState(
    "Start a scan on Chrome for Android, then hold an NTAG213 Booper against the phone.",
  );
  const [permissionState, setPermissionState] = useState<PermissionStatusValue>("unknown");
  const [result, setResult] = useState<ScanResult | null>(null);
  const [scanCount, setScanCount] = useState(0);
  const [secureContext] = useState(
    () => typeof window !== "undefined" && window.isSecureContext,
  );
  const [supportsWebNfc] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    const nfcWindow = window as WebNfcWindow;
    return Boolean(nfcWindow.NDEFReader);
  });

  async function syncPermissionState() {
    if (!("permissions" in navigator) || typeof navigator.permissions.query !== "function") {
      setPermissionState("unsupported");
      return;
    }

    try {
      const status = await navigator.permissions.query({
        name: "nfc" as PermissionName,
      });
      setPermissionState(status.state);
    } catch {
      setPermissionState("unsupported");
    }
  }

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  function resetScan() {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsScanning(false);
    setMessage("Scan stopped.");
  }

  async function startScan() {
    const nfcWindow = window as WebNfcWindow;
    const Reader = nfcWindow.NDEFReader;

    if (!window.isSecureContext) {
      setMessage("Web NFC needs HTTPS in production. Localhost is fine for development.");
      return;
    }

    if (!Reader) {
      setMessage(
        "This browser/device does not expose Web NFC. Chrome on Android is the main supported path.",
      );
      return;
    }

    abortRef.current?.abort();
    const abortController = new AbortController();
    abortRef.current = abortController;

    try {
      const reader = new Reader();
      reader.onreading = (event) => {
        const records = event.message.records.map((record, index) => ({
          id: record.id?.trim() || `record-${index + 1}`,
          index,
          lang: record.lang ?? null,
          mediaType: record.mediaType ?? null,
          payloadPreview: decodeRecordPayload(record),
          recordType: record.recordType,
          sizeBytes: record.data?.byteLength ?? null,
        }));

        setResult({
          recordCount: records.length,
          records,
          scannedAt: new Date().toISOString(),
          serialNumber: event.serialNumber || "",
        });
        setScanCount((count) => count + 1);
        setMessage(
          event.serialNumber
            ? "NTAG213 scanned successfully. UID/serial number was exposed."
            : "Tag scanned, but this device/browser did not expose a serial number.",
        );
      };

      reader.onreadingerror = () => {
        setMessage("A tag was detected, but Chrome could not read it as Web NFC/NDEF.");
      };

      await reader.scan({ signal: abortController.signal });
      setIsScanning(true);
      await syncPermissionState();
      setMessage("Scanning started. Hold the NTAG213 wristband against the phone.");
    } catch (error) {
      setIsScanning(false);
      await syncPermissionState();

      if (error instanceof DOMException && error.name === "NotAllowedError") {
        setMessage("NFC permission was denied. Allow access and try again.");
        return;
      }

      if (error instanceof DOMException && error.name === "NotReadableError") {
        setMessage("NFC hardware is unavailable right now. Check that NFC is turned on.");
        return;
      }

      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      setMessage("Scan could not start on this device.");
    }
  }

  const environmentFacts = useMemo(
    () => [
      { label: "Secure context", value: secureContext ? "Yes" : "No" },
      { label: "Web NFC support", value: supportsWebNfc ? "Detected" : "Not detected" },
      { label: "Permission", value: permissionState },
      { label: "Scan session", value: isScanning ? "Running" : "Idle" },
      { label: "Successful scans", value: String(scanCount) },
    ],
    [isScanning, permissionState, scanCount, secureContext, supportsWebNfc],
  );

  return (
    <div className="grid gap-6">
      <div className="parent-soft-panel rounded-[1.6rem] p-5">
        <div className="flex flex-wrap gap-3">
          <button className="btn btn-primary" onClick={() => void startScan()} type="button">
            {isScanning ? "Restart scan" : "Start NFC scan"}
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => void syncPermissionState()}
            type="button"
          >
            Refresh capability
          </button>
          <button className="btn btn-ghost" onClick={resetScan} type="button">
            Stop scan
          </button>
        </div>
        <p className="mt-4 text-sm leading-6 text-[color:var(--ink-soft)]">{message}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {environmentFacts.map((fact) => (
          <div className="metric-tile rounded-[1.4rem] p-4" key={fact.label}>
            <p className="text-sm font-bold text-[color:var(--ink-soft)]">{fact.label}</p>
            <p className="mt-2 text-lg font-extrabold">{fact.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <section className="shell-card rounded-[2rem] p-6">
          <h3 className="text-2xl font-extrabold">Latest scan</h3>
          {result ? (
            <div className="mt-5 space-y-3 text-sm leading-7 text-[color:var(--ink-soft)]">
              <p>
                UID / serial:{" "}
                <span className="font-black text-[color:var(--foreground)]">
                  {result.serialNumber || "Not exposed by this device/browser"}
                </span>
              </p>
              <p>
                Scanned at:{" "}
                <span className="font-black text-[color:var(--foreground)]">
                  {new Date(result.scannedAt).toLocaleString()}
                </span>
              </p>
              <p>
                NDEF records:{" "}
                <span className="font-black text-[color:var(--foreground)]">
                  {result.recordCount}
                </span>
              </p>
            </div>
          ) : (
            <p className="mt-5 text-sm leading-6 text-[color:var(--ink-soft)]">
              No scan result yet. On a compatible Android phone, this should show the NTAG213
              serial number and any NDEF records after a successful tap.
            </p>
          )}
        </section>

        <section className="shell-card rounded-[2rem] p-6">
          <h3 className="text-2xl font-extrabold">Record inspector</h3>
          <div className="mt-5 space-y-3">
            {result?.records.length ? (
              result.records.map((record) => (
                <div className="list-row rounded-[1.4rem] p-4" key={`${record.id}-${record.index}`}>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-extrabold">{record.recordType}</p>
                    {record.mediaType ? (
                      <span className="pill bg-[rgba(20,86,216,0.1)] text-[color:var(--primary)]">
                        {record.mediaType}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 text-sm text-[color:var(--ink-soft)]">
                    Record id: {record.id}
                  </p>
                  <p className="mt-1 text-sm text-[color:var(--ink-soft)]">
                    Payload: {record.payloadPreview ?? "No preview"}
                  </p>
                  <p className="mt-1 text-sm text-[color:var(--ink-soft)]">
                    {record.sizeBytes !== null ? `${record.sizeBytes} bytes` : "Unknown size"}
                    {record.lang ? ` · lang ${record.lang}` : ""}
                  </p>
                </div>
              ))
            ) : (
              <div className="rounded-[1.4rem] border border-dashed border-[color:var(--line-strong)] p-5 text-sm leading-6 text-[color:var(--ink-soft)]">
                If the tag contains NDEF data, the records will appear here. If you only care about
                the Booper UID, the main value to watch is the serial number above.
              </div>
            )}
          </div>
        </section>
      </div>

      <section className="shell-card rounded-[2rem] p-6">
        <h3 className="text-2xl font-extrabold">What to look for with NTAG213</h3>
        <div className="mt-5 grid gap-3 text-sm leading-7 text-[color:var(--ink-soft)]">
          <p>1. Chrome on Android should prompt for NFC permission the first time you start scanning.</p>
          <p>2. A successful tap should ideally expose a serial number. That is the Booper lookup value we want.</p>
          <p>3. If serial number is blank but NDEF records appear, the tag is readable but UID exposure is limited on that device/browser pairing.</p>
          <p>4. If nothing reads at all, verify the phone has NFC enabled and test over HTTPS in production.</p>
        </div>
      </section>
    </div>
  );
}
