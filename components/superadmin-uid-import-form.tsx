"use client";

import { useRef, useState } from "react";
import { LoadingSubmitButton } from "@/components/loading-submit-button";
import { getBooperBaseUrl } from "@/lib/site-url";

type SuperAdminUidImportFormProps = {
  action: (formData: FormData) => void | Promise<void>;
};

export function SuperAdminUidImportForm({
  action,
}: SuperAdminUidImportFormProps) {
  const booperBaseUrl = getBooperBaseUrl();
  const [csvText, setCsvText] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileStatus, setFileStatus] = useState<string | null>(null);
  const [isReadingFile, setIsReadingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];

    if (!file) {
      setFileName(null);
      setFileStatus(null);
      return;
    }

    setIsReadingFile(true);
    setFileName(file.name);
    setFileStatus("Reading CSV file...");

    try {
      const text = await file.text();
      const normalizedText = text.trim();
      const rowCount = Math.max(0, normalizedText.split(/\r?\n/).length - 1);

      setCsvText(normalizedText);
      setFileStatus(`Loaded ${rowCount} UID row${rowCount === 1 ? "" : "s"} from file.`);
    } catch {
      setCsvText("");
      setFileStatus("That file could not be read. Please try again or paste the CSV data.");
    } finally {
      setIsReadingFile(false);
    }
  }

  return (
    <form action={action} className="mt-6 grid gap-3">
      <input
        className="field"
        name="batchNumber"
        placeholder="Batch number e.g. JULY-2026-A"
        required
      />
      <input
        className="field"
        name="ndefUrlTemplate"
        placeholder={`Optional NDEF URL template e.g. ${booperBaseUrl}/{uid}`}
      />
      <input
        className="field"
        name="ndefTextTemplate"
        placeholder="Optional NDEF text template e.g. goodKiddo Booper {uid}"
      />
      <textarea
        className="field min-h-36"
        name="csvText"
        onChange={(event) => setCsvText(event.currentTarget.value)}
        placeholder={
          `Paste CSV here if you do not want to upload a file.\nuid,ndef_url,ndef_text\n04A224FF9911,${booperBaseUrl}/04A224FF9911,goodKiddo Booper 04A224FF9911`
        }
        value={csvText}
      />
      <input
        accept=".csv,text/csv"
        className="field"
        name="inventoryFile"
        onChange={handleFileChange}
        ref={fileInputRef}
        type="file"
      />
      {fileName ? (
        <div className="rounded-[1.2rem] border border-[color:var(--line)] bg-white/70 px-4 py-3 text-sm text-[color:var(--ink-soft)]">
          <p className="font-bold text-[color:var(--foreground)]">{fileName}</p>
          {fileStatus ? <p className="mt-1">{fileStatus}</p> : null}
        </div>
      ) : null}
      <LoadingSubmitButton
        className="btn btn-primary"
        disabled={isReadingFile}
        pendingLabel="Preparing CSV..."
        pendingOverride={isReadingFile}
      >
        Import booper UIDs
      </LoadingSubmitButton>
    </form>
  );
}
