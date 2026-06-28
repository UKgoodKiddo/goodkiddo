import "server-only";

import { redirect } from "next/navigation";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";
import { isServiceRoleConfigured, isSupabaseConfigured } from "@/lib/env";
import type {
  AuditLog,
  AuditLogView,
  Booper,
  BooperInventory,
  Family,
  FamilySubscription,
  Json,
  SuperAdminDashboardData,
  SuperAdminFamilySummary,
  SuperAdminUser,
  SuperAdminUserView,
} from "@/lib/types";

export async function getSuperAdminViewer() {
  if (!isSupabaseConfigured()) {
    return {
      configured: false,
      isSuperAdmin: false,
      user: null,
    };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      configured: true,
      isSuperAdmin: false,
      user: null,
    };
  }

  const { data: membership } = await supabase
    .from("super_admin_users")
    .select("*")
    .eq("user_id", user.id)
    .eq("active", true)
    .maybeSingle();

  return {
    configured: true,
    isSuperAdmin: Boolean(membership),
    membership: membership ?? null,
    user,
  };
}

export async function requireSuperAdmin() {
  if (!isSupabaseConfigured()) {
    redirect("/auth/login");
  }

  const viewer = await getSuperAdminViewer();

  if (!viewer.user) {
    redirect("/auth/login");
  }

  if (!viewer.isSuperAdmin) {
    redirect("/parent");
  }

  if (!isServiceRoleConfigured()) {
    redirect("/parent?status=action-failed");
  }

  return {
    admin: createSupabaseAdminClient(),
    membership: viewer.membership,
    user: viewer.user,
  };
}

export async function writeSuperAdminAuditLog(input: {
  action: string;
  actorUserId: string;
  metadata?: Json;
  targetId?: string | null;
  targetType: string;
}) {
  if (!isServiceRoleConfigured()) {
    return;
  }

  const admin = createSupabaseAdminClient();

  await admin.from("audit_logs").insert({
    action: input.action,
    actor_user_id: input.actorUserId,
    metadata: input.metadata ?? {},
    target_id: input.targetId ?? null,
    target_type: input.targetType,
  });
}

export async function getSuperAdminDashboardData(): Promise<SuperAdminDashboardData> {
  const { admin, user } = await requireSuperAdmin();

  const [
    familiesResult,
    subscriptionsResult,
    inventoryResult,
    boopersResult,
    auditResult,
    superAdminUsersResult,
    usersResult,
  ] = await Promise.all([
    admin.from("families").select("*").order("created_at", { ascending: false }),
    admin
      .from("family_subscriptions")
      .select("*")
      .order("updated_at", { ascending: false }),
    admin
      .from("booper_inventory")
      .select("*")
      .order("imported_at", { ascending: false }),
    admin.from("boopers").select("*").order("created_at", { ascending: false }),
    admin
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(40),
    admin
      .from("super_admin_users")
      .select("*")
      .order("created_at", { ascending: true }),
    admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
  ]);

  const families = (familiesResult.data ?? []) as Family[];
  const subscriptions = (subscriptionsResult.data ?? []) as FamilySubscription[];
  const inventory = (inventoryResult.data ?? []) as BooperInventory[];
  const boopers = (boopersResult.data ?? []) as Booper[];
  const auditLogs = (auditResult.data ?? []) as AuditLog[];
  const superAdminUsers = (superAdminUsersResult.data ?? []) as SuperAdminUser[];

  const userEmailLookup = new Map<string, string>();
  for (const authUser of usersResult.data?.users ?? []) {
    if (authUser.id) {
      userEmailLookup.set(authUser.id, authUser.email ?? "");
    }
  }

  const subscriptionLookup = new Map(
    subscriptions.map((subscription) => [subscription.family_id, subscription]),
  );

  const inventoryCountByFamily = new Map<string, number>();
  for (const wristband of inventory) {
    if (!wristband.family_id) {
      continue;
    }

    inventoryCountByFamily.set(
      wristband.family_id,
      (inventoryCountByFamily.get(wristband.family_id) ?? 0) + 1,
    );
  }

  const booperCountByFamily = new Map<string, number>();
  for (const booper of boopers) {
    booperCountByFamily.set(
      booper.family_id,
      (booperCountByFamily.get(booper.family_id) ?? 0) + 1,
    );
  }

  const familySummaries: SuperAdminFamilySummary[] = families.map((family) => ({
    assignedInventoryCount: inventoryCountByFamily.get(family.id) ?? 0,
    booperCount: booperCountByFamily.get(family.id) ?? 0,
    createdAt: family.created_at,
    familyId: family.id,
    familyName: family.family_name,
    parentEmail: userEmailLookup.get(family.parent_user_id) ?? null,
    parentUserId: family.parent_user_id,
    subscription: subscriptionLookup.get(family.id) ?? null,
  }));

  const auditLogViews: AuditLogView[] = auditLogs.map((entry) => ({
    ...entry,
    actorEmail: userEmailLookup.get(entry.actor_user_id) ?? null,
  }));

  const superAdminUserViews: SuperAdminUserView[] = superAdminUsers.map((entry) => ({
    ...entry,
    authEmail: userEmailLookup.get(entry.user_id) ?? null,
  }));

  return {
    auditLogs: auditLogViews,
    families: familySummaries,
    inventory,
    subscriptions,
    superAdminUsers: superAdminUserViews,
    totalAssignedInventory: inventory.filter((item) => item.family_id).length,
    totalFamilies: familySummaries.length,
    totalInventory: inventory.length,
    totalSubscriptionsActive: subscriptions.filter((item) => item.status === "active").length,
    viewerEmail: user.email ?? null,
  };
}
