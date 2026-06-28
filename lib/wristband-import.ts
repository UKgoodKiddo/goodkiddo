import "server-only";

import * as XLSX from "xlsx";

export type ParsedBooperInventoryRow = {
  label: string | null;
  rowNumber: number;
  uid: string;
};

const UID_HEADER_PATTERNS = [
  /^uid$/i,
  /^nfc[_\s-]*uid$/i,
  /^wristband[_\s-]*uid$/i,
  /^tag[_\s-]*uid$/i,
  /^booper[_\s-]*uid$/i,
];

const LABEL_HEADER_PATTERNS = [
  /^label$/i,
  /^serial$/i,
  /^serial[_\s-]*label$/i,
  /^serial[_\s-]*(number|no)$/i,
  /^booper$/i,
  /^name$/i,
];

function normalizeText(value: unknown) {
  return String(value ?? "").trim();
}

export function normalizeImportedUid(value: string) {
  return value.replace(/\s+/g, "").toUpperCase();
}

export function isValidImportedUid(value: string) {
  return /^[A-Z0-9:_-]{4,120}$/i.test(value);
}

function findMatchingHeader(headers: string[], patterns: RegExp[]) {
  return headers.find((header) =>
    patterns.some((pattern) => pattern.test(header)),
  );
}

function parseWorksheet(sheet: XLSX.WorkSheet) {
  const objectRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
  });

  if (objectRows.length) {
    const headers = Object.keys(objectRows[0]);
    const uidHeader = findMatchingHeader(headers, UID_HEADER_PATTERNS);
    const labelHeader = findMatchingHeader(headers, LABEL_HEADER_PATTERNS);

    if (uidHeader) {
      return objectRows
        .map((row, index) => ({
          label: labelHeader ? normalizeText(row[labelHeader]) || null : null,
          rowNumber: index + 2,
          uid: normalizeImportedUid(normalizeText(row[uidHeader])),
        }))
        .filter((row) => row.uid.length > 0);
    }
  }

  const gridRows = XLSX.utils.sheet_to_json<(string | number | null)[]>(sheet, {
    defval: "",
    header: 1,
  });

  return gridRows
    .slice(1)
    .map((row, index) => ({
      label: normalizeText(row[1]) || null,
      rowNumber: index + 2,
      uid: normalizeImportedUid(normalizeText(row[0])),
    }))
    .filter((row) => row.uid.length > 0);
}

export async function parseBooperInventoryCsvFile(file: File) {
  const text = await file.text();
  const workbook = XLSX.read(text, { type: "string" });
  const firstSheetName = workbook.SheetNames[0];

  if (!firstSheetName) {
    throw new Error("The CSV file did not contain any rows.");
  }

  return parseWorksheet(workbook.Sheets[firstSheetName]);
}

export function parseBooperInventoryCsvText(csvText: string) {
  const workbook = XLSX.read(csvText, { type: "string" });
  const firstSheetName = workbook.SheetNames[0];

  if (!firstSheetName) {
    throw new Error("The pasted CSV data did not contain any rows.");
  }

  return parseWorksheet(workbook.Sheets[firstSheetName]);
}
