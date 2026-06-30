import { NextResponse } from "next/server";
import { buildTagWriterLinkCsv, normalizeTagWriterBaseUrl } from "@/lib/tagwriter-export";
import { requireSuperAdmin, writeSuperAdminAuditLog } from "@/lib/super-admin";
import type { BooperInventory } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { admin, user } = await requireSuperAdmin();
  const { searchParams } = new URL(request.url);
  const batchNumber = searchParams.get("batchNumber")?.trim() || "";
  const baseUrlInput = searchParams.get("baseUrl")?.trim() || "https://goodkiddo.co.uk/b";

  let baseUrl = "";

  try {
    baseUrl = normalizeTagWriterBaseUrl(baseUrlInput);
  } catch (error) {
    return new NextResponse(
      error instanceof Error ? error.message : "Invalid TagWriter base URL.",
      { status: 400 },
    );
  }

  let query = admin
    .from("booper_inventory")
    .select("uid, serial_label, ndef_url, ndef_text, batch_number")
    .order("batch_number", { ascending: true })
    .order("serial_label", { ascending: true })
    .order("uid", { ascending: true });

  if (batchNumber) {
    query = query.eq("batch_number", batchNumber);
  }

  const { data, error } = await query;

  if (error) {
    return new NextResponse("Could not load booper inventory for export.", {
      status: 500,
    });
  }

  const inventory = (data ?? []) as Pick<
    BooperInventory,
    "batch_number" | "ndef_text" | "ndef_url" | "serial_label" | "uid"
  >[];

  if (!inventory.length) {
    return new NextResponse("No booper inventory matched this export.", {
      status: 404,
    });
  }

  const csv = buildTagWriterLinkCsv(inventory, baseUrl);
  const fileLabel = batchNumber || "all-boopers";

  await writeSuperAdminAuditLog({
    action: "ndef_csv_exported",
    actorUserId: user.id,
    metadata: {
      baseUrl,
      batchNumber: batchNumber || null,
      exportedCount: inventory.length,
      format: "tagwriter_link_csv",
    },
    targetType: "booper_inventory",
  });

  return new NextResponse(`\uFEFF${csv}`, {
    headers: {
      "Content-Disposition": `attachment; filename="goodkiddo-tagwriter-${fileLabel}.csv"`,
      "Content-Type": "text/csv; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
