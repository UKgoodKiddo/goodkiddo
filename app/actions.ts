"use server";

import { File as NodeFile } from "node:buffer";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { z } from "zod";
import {
  buildChildStatusPath,
  CHILD_AVATAR_PRESET_URLS,
  CHILD_PAGE_ROUTES,
} from "@/lib/child-ui";
import { TASK_CARD_CATEGORY_ORDER } from "@/lib/task-card-utils";
import { getTaskWindowStartForTask } from "@/lib/tasks";
import {
  createSupabaseAdminClient,
  createSupabaseServerClient,
} from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/site-url";
import type { ActionState, TaskWeekday } from "@/lib/types";
import { areUidsEqual, normalizeUid } from "@/lib/uid";
import { isChildModeConfigured, isSupabaseConfigured } from "@/lib/env";
import {
  createStripeBillingPortalSession,
  createStripeCheckoutSession,
  isStripeConfigured,
  updateStripeSubscriptionCancelAtPeriodEnd,
} from "@/lib/stripe";
import { SUBSCRIPTION_PLAN_OPTIONS } from "@/lib/subscriptions";

const signInSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
  returnTo: z.string().trim().optional(),
});

const passwordResetRequestSchema = z.object({
  email: z.email(),
});

const signUpSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
  returnTo: z.string().trim().optional(),
});

const createFamilySchema = z.object({
  familyName: z.string().trim().min(2).max(80),
});

const createChildSchema = z.object({
  familyId: z.uuid(),
  displayName: z.string().trim().min(1).max(60),
  booperUid: z.string().trim().max(120).optional(),
  returnTo: z.enum(["/parent", "/parent/children"]).optional(),
});

const updateChildSchema = z.object({
  childProfileId: z.uuid(),
  displayName: z.string().trim().min(1).max(60),
});

const deleteChildSchema = z.object({
  childProfileId: z.uuid(),
  confirmName: z.string().trim().min(1).max(60),
});

const awardBoopsSchema = z.object({
  childProfileId: z.uuid(),
  amount: z.coerce.number().int().min(1).max(500),
  reason: z.string().trim().min(2).max(300),
});

const awardSurpriseBoopsInlineSchema = z.object({
  amount: z.coerce.number().int().min(1).max(500),
  childTarget: z.string().trim().min(1).max(40),
  reason: z.string().trim().min(2).max(300),
});

const rewardSchema = z.object({
  childProfileId: z.string().trim().optional(),
  title: z.string().trim().min(1).max(80),
  cost: z.coerce.number().int().min(1).max(5000),
  description: z.string().trim().max(240).optional(),
  active: z.union([z.literal("on"), z.literal("off"), z.literal("")]).optional(),
});

const pairBooperSchema = z.object({
  booperId: z.uuid(),
  childProfileId: z.string().trim().optional(),
});

const booperStatusSchema = z.object({
  booperId: z.uuid(),
  childProfileId: z.uuid().optional(),
  returnTo: z.enum(["/parent/boopers", "/parent/children"]).optional(),
  status: z.enum(["active", "lost"]),
});

const assignChildBooperSchema = z.object({
  childProfileId: z.uuid(),
  nfcUid: z.string().trim().min(4).max(120),
  returnTo: z.enum(["/parent/boopers", "/parent/children"]).optional(),
});

const childModeSchema = z.object({
  childProfileId: z.uuid(),
  familyId: z.uuid(),
  deviceLabel: z.string().trim().min(1).max(80).optional(),
});

const parentPinSchema = z.object({
  parentPin: z.string().trim().regex(/^\d{4}$/),
});

const nfcAwardSchema = z.object({
  nfcUid: z.string().trim().min(4).max(120),
  amount: z.coerce.number().int().min(1).max(500),
  reason: z.string().trim().min(2).max(160),
});

const taskSchema = z
  .object({
    taskId: z.string().trim().optional(),
    title: z.string().trim().min(1).max(80),
    description: z.string().trim().max(240).optional(),
    boopReward: z.coerce.number().int().min(1).max(500),
    recurringType: z.enum(["none", "daily", "weekly"]),
    returnTo: z.enum(["/parent", "/parent/tasks"]).optional(),
    weeklyDays: z
      .array(z.enum(["mon", "tue", "wed", "thu", "fri", "sat", "sun"]))
      .max(7)
      .optional(),
    active: z.union([z.literal("on"), z.literal("off"), z.literal("")]).optional(),
    childProfileId: z.string().trim().optional(),
  })
  .superRefine((value, context) => {
    if (value.recurringType === "weekly" && !(value.weeklyDays?.length)) {
      context.addIssue({
        code: "custom",
        message: "Choose at least one weekday for weekly tasks.",
        path: ["weeklyDays"],
      });
    }
  });

function normalizeTaskWeeklyDays(values: FormDataEntryValue[]): TaskWeekday[] {
  const weekdays = values
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.trim().toLowerCase())
    .filter((value): value is TaskWeekday =>
      ["mon", "tue", "wed", "thu", "fri", "sat", "sun"].includes(value),
    );

  return Array.from(new Set(weekdays));
}

function buildParentBooperRedirectPath({
  childProfileId,
  returnTo,
  status,
}: {
  childProfileId?: string;
  returnTo?: "/parent/boopers" | "/parent/children";
  status: string;
}) {
  const base = returnTo ?? "/parent/boopers";
  const params = new URLSearchParams({ status });

  if (childProfileId) {
    params.set("childId", childProfileId);
  }

  const hash = childProfileId && returnTo === "/parent/children" ? `#child-${childProfileId}` : "";

  return `${base}?${params.toString()}${hash}`;
}

const deleteTaskSchema = z.object({
  taskId: z.uuid(),
});

const taskCompletionSchema = z.object({
  taskId: z.uuid(),
});

export type SubmitTaskCompletionInlineState = {
  status: "already-submitted" | "error" | "idle" | "submitted";
};

export type CollectWaitingBoopsInlineState = {
  claimedCount?: number;
  claimedTotal?: number;
  status: "error" | "idle" | "no-boops-waiting" | "submitted" | "wrong-booper";
};

export type AwardSurpriseBoopsInlineState = {
  awardedChildren?: number;
  totalAwarded?: number;
  status: "error" | "idle" | "success";
};

const reviewTaskCompletionSchema = z.object({
  completionId: z.uuid(),
});

const rewardRequestSchema = z.object({
  rewardId: z.uuid(),
  returnTo: z.enum(CHILD_PAGE_ROUTES).optional(),
});

const claimPendingBoopsSchema = z.object({
  nfcUid: z.string().trim().min(4).max(120),
  returnTo: z.enum(CHILD_PAGE_ROUTES).optional(),
});

const parentClaimPendingBoopsSchema = z.object({
  childProfileId: z.uuid(),
  nfcUid: z.string().trim().min(4).max(120),
});

const childAvatarPresetSchema = z.object({
  avatarUrl: z.enum(CHILD_AVATAR_PRESET_URLS),
  returnTo: z.enum(CHILD_PAGE_ROUTES).optional(),
});

const reviewRedemptionSchema = z.object({
  redemptionId: z.uuid(),
});

const importBooperInventorySchema = z.object({
  batchNumber: z.string().trim().min(1).max(80),
  csvText: z.string().optional(),
  inventoryFile: z.unknown().optional(),
  ndefTextTemplate: z.string().trim().max(240).optional(),
  ndefUrlTemplate: z.string().trim().max(400).optional(),
});

const uploadTaskAssetSchema = z.object({
  category: z.enum(TASK_CARD_CATEGORY_ORDER),
  childAssetDataUrl: z.string().optional(),
  childAssetOriginalName: z.string().optional(),
  parentAssetDataUrl: z.string().optional(),
  parentAssetOriginalName: z.string().optional(),
  replaceExisting: z.union([z.literal("on"), z.literal("off"), z.literal("")]).optional(),
  taskName: z.string().trim().min(1).max(80),
});

const assignInventorySchema = z.object({
  familyId: z.uuid(),
  inventoryId: z.uuid(),
  returnTo: z.enum(["/superadmin/boopers", "/superadmin/families"]).optional(),
});

const unassignInventorySchema = z.object({
  inventoryId: z.uuid(),
  returnTo: z.enum(["/superadmin/boopers", "/superadmin/families"]).optional(),
});

const updateInventoryStatusSchema = z.object({
  inventoryId: z.uuid(),
  returnTo: z.enum(["/superadmin/boopers", "/superadmin/families"]),
  status: z.enum(["available", "assigned", "lost", "disabled", "retired"]),
});

const viewSuperAdminFamilySchema = z.object({
  familyId: z.uuid(),
});

const emptyStringToUndefined = (value: unknown) => {
  if (typeof value === "string" && value.trim() === "") {
    return undefined;
  }

  return value;
};

const normalizeCheckboxString = (value: unknown) => {
  if (value === true || value === "true" || value === "on" || value === 1 || value === "1") {
    return "true";
  }

  if (
    value === false ||
    value === "false" ||
    value === 0 ||
    value === "0" ||
    value == null ||
    value === ""
  ) {
    return "false";
  }

  return value;
};

function encodeRedirectDetails(message: string) {
  return encodeURIComponent(message.trim().slice(0, 240));
}

function buildSuperAdminFamiliesFailurePath(details: string) {
  return `/superadmin/families?status=subscription-save-failed&details=${encodeRedirectDetails(details)}`;
}

function formatSupabaseActionError(error: unknown) {
  if (!error || typeof error !== "object") {
    return "Unknown subscription save failure";
  }

  const maybeError = error as {
    code?: string;
    details?: string;
    hint?: string;
    message?: string;
  };

  return [
    maybeError.message,
    maybeError.details,
    maybeError.hint,
    maybeError.code ? `code=${maybeError.code}` : null,
  ]
    .filter((part): part is string => Boolean(part && part.trim()))
    .join(" | ");
}

function parseSubscriptionDateInput(value: string | undefined) {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const isoDate = new Date(`${trimmed}T00:00:00.000Z`);

    if (Number.isNaN(isoDate.getTime())) {
      throw new Error(`Unsupported renewal date "${trimmed}"`);
    }

    return isoDate.toISOString();
  }

  const dayMonthYearMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);

  if (dayMonthYearMatch) {
    const [, dayText, monthText, yearText] = dayMonthYearMatch;
    const day = Number(dayText);
    const month = Number(monthText);
    const year = Number(yearText);
    const normalized = new Date(Date.UTC(year, month - 1, day));

    if (
      Number.isNaN(normalized.getTime()) ||
      normalized.getUTCFullYear() !== year ||
      normalized.getUTCMonth() !== month - 1 ||
      normalized.getUTCDate() !== day
    ) {
      throw new Error(`Unsupported renewal date "${trimmed}"`);
    }

    return normalized.toISOString();
  }

  throw new Error(`Unsupported renewal date "${trimmed}"`);
}

const familySubscriptionSchema = z.object({
  familyId: z.uuid(),
  subscriptionPlan: z.string().trim().min(1).max(80),
  subscriptionStatus: z.enum([
    "inactive",
    "trialing",
    "active",
    "past_due",
    "unpaid",
    "incomplete",
    "incomplete_expired",
    "paused",
    "canceled",
  ]),
  subscriptionCurrentPeriodEnd: z.preprocess(
    emptyStringToUndefined,
    z.string().trim().optional(),
  ),
  subscriptionProvider: z.preprocess(
    emptyStringToUndefined,
    z.enum(["manual", "stripe"]).optional(),
  ),
  stripeCustomerId: z.preprocess(
    emptyStringToUndefined,
    z.string().trim().max(120).optional(),
  ),
  stripeSubscriptionId: z.preprocess(
    emptyStringToUndefined,
    z.string().trim().max(120).optional(),
  ),
  booperPackIncluded: z.preprocess(
    normalizeCheckboxString,
    z.union([z.literal("true"), z.literal("false")]),
  ),
  booperPackStatus: z.preprocess(
    emptyStringToUndefined,
    z.enum(["pending", "packed", "shipped", "delivered"]).optional(),
  ),
});

const startStripeCheckoutSchema = z.object({
  plan: z.enum(
    SUBSCRIPTION_PLAN_OPTIONS.map((plan) => plan.id) as [
      (typeof SUBSCRIPTION_PLAN_OPTIONS)[number]["id"],
      ...(typeof SUBSCRIPTION_PLAN_OPTIONS)[number]["id"][],
    ],
  ),
});

async function getChildModeHelpers() {
  return import("@/lib/child-mode");
}

async function getAvatarUploadHelpers() {
  return import("@/lib/avatar-upload");
}

async function getWristbandImportHelpers() {
  return import("@/lib/wristband-import");
}

async function getTaskAssetHelpers() {
  return import("@/lib/task-card-assets");
}

async function getNfcHelpers() {
  return import("@/lib/nfc");
}

async function getSuperAdminHelpers() {
  return import("@/lib/super-admin");
}

async function getParentContextOrRedirect() {
  if (!isSupabaseConfigured()) {
    redirect("/parent?status=missing-supabase");
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: family } = await supabase
    .from("families")
    .select("*")
    .eq("parent_user_id", user.id)
    .maybeSingle();

  return { supabase, user, family };
}

function isUploadedFile(
  value: unknown,
): value is File & {
  arrayBuffer: () => Promise<ArrayBuffer>;
  text: () => Promise<string>;
} {
  return (
    typeof value === "object" &&
    value !== null &&
    "name" in value &&
    "size" in value &&
    "type" in value &&
    "arrayBuffer" in value &&
    "text" in value
  );
}

function getFormStringValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : undefined;
}

function buildFileNameFromOriginalName(originalName: string | undefined, fallbackStem: string) {
  const trimmed = originalName?.trim();

  if (!trimmed) {
    return `${fallbackStem}.upload`;
  }

  return trimmed;
}

function dataUrlMimeToExtension(mimeType: string) {
  switch (mimeType) {
    case "image/jpeg":
      return ".jpg";
    case "image/png":
      return ".png";
    case "image/webp":
      return ".webp";
    default:
      return ".img";
  }
}

function fileFromDataUrl(
  dataUrl: string | undefined,
  originalName: string | undefined,
  fallbackStem: string,
) {
  const trimmed = dataUrl?.trim();

  if (!trimmed) {
    return null;
  }

  const match = trimmed.match(/^data:(image\/(?:jpeg|png|webp));base64,(.+)$/);

  if (!match) {
    return null;
  }

  const mimeType = match[1];
  const base64Payload = match[2];
  const fileNameCandidate = buildFileNameFromOriginalName(originalName, fallbackStem);
  const hasExtension = /\.[a-z0-9]+$/i.test(fileNameCandidate);
  const fileName = hasExtension
    ? fileNameCandidate
    : `${fileNameCandidate}${dataUrlMimeToExtension(mimeType)}`;
  const buffer = Buffer.from(base64Payload, "base64");

  return new NodeFile([buffer], fileName, { type: mimeType });
}

async function getChildModeActionContextOrRedirect() {
  if (!isSupabaseConfigured() || !isChildModeConfigured()) {
    redirect("/child?status=action-failed");
  }

  const parentSupabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await parentSupabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const admin = createSupabaseAdminClient();
  const { resolveChildModeSessionForParent } = await getChildModeHelpers();
  const deviceMode = await resolveChildModeSessionForParent({
    admin,
    parentSupabase,
    parentUserId: user.id,
  });

  if (!deviceMode) {
    redirect("/child?status=child-mode-required");
  }

  const { data: family } = await parentSupabase
    .from("families")
    .select("*")
    .eq("id", deviceMode.familyId)
    .eq("parent_user_id", user.id)
    .maybeSingle();

  if (!family) {
    redirect("/auth/login");
  }

  return {
    admin,
    deviceMode: {
      child_profile_id: deviceMode.childProfileId,
      device_label: deviceMode.deviceLabel,
      family_id: deviceMode.familyId,
    },
    family,
    parentSupabase,
    user,
  };
}

function revalidateParentWorkspace() {
  revalidatePath("/parent");
  revalidatePath("/parent/children");
  revalidatePath("/parent/tasks");
  revalidatePath("/parent/approvals");
  revalidatePath("/parent/rewards");
  revalidatePath("/parent/boopers");
}

function revalidateChildWorkspace() {
  revalidatePath("/child");
  revalidatePath("/child/collect");
  revalidatePath("/child/rewards");
  revalidatePath("/child/activity");
  revalidatePath("/child/profile");
}

function getFamilyParentPin(parentPin: string | null | undefined) {
  return /^\d{4}$/.test(parentPin ?? "") ? parentPin! : "0000";
}

function sanitizeReturnToPath(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();

  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return null;
  }

  return trimmed;
}

function buildAbsoluteSitePath(path: string) {
  return `${getSiteUrl().replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
}

function revalidateSuperAdminWorkspace() {
  revalidatePath("/superadmin");
  revalidatePath("/superadmin/boopers");
  revalidatePath("/superadmin/tasks");
  revalidatePath("/superadmin/families");
  revalidatePath("/superadmin/users");
  revalidatePath("/superadmin/audit");
  revalidatePath("/superadmin/wristbands");
  revalidatePath("/superadmin/subscriptions");
}

export async function signInAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!isSupabaseConfigured()) {
    return {
      status: "error",
      message:
        "Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY first.",
    };
  }

  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    returnTo: formData.get("returnTo"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Enter a valid email and an 8+ character password.",
    };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return {
      status: "error",
      message: error.message,
    };
  }

  redirect(sanitizeReturnToPath(parsed.data.returnTo) ?? "/parent");
}

export async function requestPasswordResetAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!isSupabaseConfigured()) {
    return {
      status: "error",
      message:
        "Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY first.",
    };
  }

  const parsed = passwordResetRequestSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Enter a valid parent email address.",
    };
  }

  const supabase = await createSupabaseServerClient();
  const redirectTo = buildAbsoluteSitePath("/auth/reset-password");

  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo,
  });

  if (error) {
    return {
      status: "error",
      message: error.message,
    };
  }

  return {
    status: "success",
    message: "Password reset email sent. Check your inbox to continue.",
  };
}

export async function signUpAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!isSupabaseConfigured()) {
    return {
      status: "error",
      message:
        "Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY first.",
    };
  }

  const parsed = signUpSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    returnTo: formData.get("returnTo"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Enter a valid email and an 8+ character password.",
    };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: buildAbsoluteSitePath("/auth/login?status=account-confirmed"),
    },
  });

  if (error) {
    return {
      status: "error",
      message: error.message,
    };
  }

  if (!data.session) {
    return {
      status: "success",
      message:
        "Account created. Check your email if confirmation is enabled, then sign in.",
    };
  }

  redirect(sanitizeReturnToPath(parsed.data.returnTo) ?? "/parent");
}

export async function signOutAction() {
  if (!isSupabaseConfigured()) {
    redirect("/");
  }

  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  const { clearChildModeSession } = await getChildModeHelpers();
  await clearChildModeSession();
  redirect("/");
}

export async function createFamilyAction(formData: FormData) {
  const parsed = createFamilySchema.safeParse({
    familyName: formData.get("familyName"),
  });

  if (!parsed.success) {
    redirect("/parent?status=action-failed");
  }

  const { supabase, user, family } = await getParentContextOrRedirect();

  if (family) {
    redirect("/parent");
  }

  const { error } = await supabase.from("families").insert({
    family_name: parsed.data.familyName,
    parent_user_id: user.id,
  });

  if (error) {
    redirect("/parent?status=action-failed");
  }

  revalidatePath("/parent");
  redirect("/parent/plan");
}

export async function startStripeCheckoutAction(formData: FormData) {
  const parsed = startStripeCheckoutSchema.safeParse({
    plan: formData.get("plan"),
  });

  if (!parsed.success) {
    redirect("/parent/plan?status=action-failed");
  }

  if (!isStripeConfigured()) {
    redirect("/parent/plan?status=action-failed");
  }

  const { user, family, supabase } = await getParentContextOrRedirect();

  if (!family) {
    redirect("/parent");
  }

  const { data: subscription } = await supabase
    .from("family_subscriptions")
    .select("*")
    .eq("family_id", family.id)
    .maybeSingle();

  const session = await createStripeCheckoutSession({
    existingCustomerId: subscription?.stripe_customer_id ?? null,
    familyId: family.id,
    familyName: family.family_name,
    plan: parsed.data.plan,
    userEmail: user.email ?? null,
  });

  if (!session.url) {
    redirect("/parent/plan?status=action-failed");
  }

  redirect(session.url);
}

export async function openStripeBillingPortalAction() {
  if (!isStripeConfigured()) {
    redirect("/parent/settings?status=billing-portal-unavailable");
  }

  const { family, supabase } = await getParentContextOrRedirect();

  if (!family) {
    redirect("/parent");
  }

  const { data: subscription } = await supabase
    .from("family_subscriptions")
    .select("*")
    .eq("family_id", family.id)
    .maybeSingle();

  if (
    !subscription ||
    subscription.subscription_provider !== "stripe" ||
    !subscription.stripe_customer_id
  ) {
    redirect("/parent/settings?status=billing-portal-unavailable");
  }

  const session = await createStripeBillingPortalSession({
    stripeCustomerId: subscription.stripe_customer_id,
  });

  redirect(session.url);
}

export async function toggleParentSubscriptionCancellationAction(formData: FormData) {
  if (!isStripeConfigured()) {
    redirect("/parent/settings?status=subscription-manage-failed");
  }

  const shouldCancel = formData.get("mode") === "cancel";
  const { family, supabase } = await getParentContextOrRedirect();

  if (!family) {
    redirect("/parent");
  }

  const { data: subscription } = await supabase
    .from("family_subscriptions")
    .select("*")
    .eq("family_id", family.id)
    .maybeSingle();

  if (
    !subscription ||
    subscription.subscription_provider !== "stripe" ||
    !subscription.stripe_subscription_id
  ) {
    redirect("/parent/settings?status=subscription-manage-failed");
  }

  await updateStripeSubscriptionCancelAtPeriodEnd({
    cancelAtPeriodEnd: shouldCancel,
    stripeSubscriptionId: subscription.stripe_subscription_id,
  });

  revalidatePath("/parent/settings");
  revalidatePath("/parent");
  redirect(
    shouldCancel
      ? "/parent/settings?status=subscription-cancel-pending"
      : "/parent/settings?status=subscription-cancel-removed",
  );
}

export async function createChildProfileAction(formData: FormData) {
  const parsed = createChildSchema.safeParse({
    familyId: formData.get("familyId"),
    displayName: formData.get("displayName"),
    booperUid: formData.get("booperUid"),
    returnTo: formData.get("returnTo"),
  });

  if (!parsed.success) {
    redirect("/parent?status=action-failed");
  }

  const returnTo = parsed.data.returnTo ?? "/parent";

  const { supabase, family } = await getParentContextOrRedirect();

  if (!family || family.id !== parsed.data.familyId) {
    redirect(`${returnTo}?status=family-required`);
  }

  const { data: childProfile, error } = await supabase
    .from("child_profiles")
    .insert({
      family_id: parsed.data.familyId,
      display_name: parsed.data.displayName,
    })
    .select("id")
    .single();

  if (error || !childProfile) {
    redirect(`${returnTo}?status=action-failed`);
  }

  const avatarFile = formData.get("avatarFile");

  if (avatarFile instanceof File && avatarFile.size > 0) {
    try {
      const { uploadChildAvatar } = await getAvatarUploadHelpers();
      const avatarUrl = await uploadChildAvatar({
        childProfileId: childProfile.id,
        familyId: parsed.data.familyId,
        file: avatarFile,
      });

      if (avatarUrl) {
        const { error: avatarError } = await supabase
          .from("child_profiles")
          .update({ avatar_url: avatarUrl })
          .eq("id", childProfile.id)
          .eq("family_id", parsed.data.familyId);

        if (avatarError) {
          redirect(`${returnTo}?status=action-failed`);
        }
      }
    } catch {
      redirect(`${returnTo}?status=avatar-upload-failed`);
    }
  }

  const requestedBooperUid = parsed.data.booperUid?.trim();

  if (requestedBooperUid) {
    const assignmentResult = await assignAvailableBooperToChild({
      actorUserId: family.parent_user_id,
      admin: createSupabaseAdminClient(),
      childProfileId: childProfile.id,
      familyId: parsed.data.familyId,
      nfcUid: requestedBooperUid,
    });

    if (assignmentResult.status === "success") {
      revalidateParentWorkspace();
      revalidateSuperAdminWorkspace();
      redirect(`${returnTo}?status=child-created-booper-assigned`);
    }

    revalidateParentWorkspace();
    revalidateSuperAdminWorkspace();
    redirect(`${returnTo}?status=child-created-booper-failed`);
  }

  revalidateParentWorkspace();
  redirect(`${returnTo}?status=child-created`);
}

export async function updateChildProfileAction(formData: FormData) {
  const parsed = updateChildSchema.safeParse({
    childProfileId: formData.get("childProfileId"),
    displayName: formData.get("displayName"),
  });

  if (!parsed.success) {
    redirect("/parent/children?status=action-failed");
  }

  const { supabase, family } = await getParentContextOrRedirect();

  if (!family) {
    redirect("/parent/children?status=family-required");
  }

  const { error } = await supabase
    .from("child_profiles")
    .update({
      display_name: parsed.data.displayName,
    })
    .eq("id", parsed.data.childProfileId)
    .eq("family_id", family.id);

  if (error) {
    redirect("/parent/children?status=action-failed");
  }

  const avatarFile = formData.get("avatarFile");

  if (avatarFile instanceof File && avatarFile.size > 0) {
    try {
      const { uploadChildAvatar } = await getAvatarUploadHelpers();
      const avatarUrl = await uploadChildAvatar({
        childProfileId: parsed.data.childProfileId,
        familyId: family.id,
        file: avatarFile,
      });

      if (avatarUrl) {
        const { error: avatarError } = await supabase
          .from("child_profiles")
          .update({ avatar_url: avatarUrl })
          .eq("id", parsed.data.childProfileId)
          .eq("family_id", family.id);

        if (avatarError) {
          redirect("/parent/children?status=action-failed");
        }
      }
    } catch {
      redirect("/parent/children?status=avatar-upload-failed");
    }
  }

  revalidateParentWorkspace();
  revalidateChildWorkspace();
  redirect("/parent/children?status=child-updated");
}

export async function deleteChildProfileAction(formData: FormData) {
  const parsed = deleteChildSchema.safeParse({
    childProfileId: formData.get("childProfileId"),
    confirmName: formData.get("confirmName"),
  });

  if (!parsed.success) {
    redirect("/parent/children?status=child-delete-confirm-required");
  }

  const { supabase, family } = await getParentContextOrRedirect();

  if (!family) {
    redirect("/parent/children?status=family-required");
  }

  const { data: childProfile, error: childError } = await supabase
    .from("child_profiles")
    .select("id, display_name")
    .eq("id", parsed.data.childProfileId)
    .eq("family_id", family.id)
    .maybeSingle();

  if (childError || !childProfile) {
    redirect("/parent/children?status=action-failed");
  }

  if (parsed.data.confirmName !== childProfile.display_name) {
    redirect("/parent/children?status=child-delete-name-mismatch");
  }

  const admin = createSupabaseAdminClient();

  const { error: boopersError } = await admin
    .from("boopers")
    .update({ child_profile_id: null })
    .eq("family_id", family.id)
    .eq("child_profile_id", childProfile.id);

  if (boopersError) {
    redirect("/parent/children?status=action-failed");
  }

  const { error: inventoryError } = await admin
    .from("booper_inventory")
    .update({ child_profile_id: null })
    .eq("family_id", family.id)
    .eq("child_profile_id", childProfile.id);

  if (inventoryError) {
    redirect("/parent/children?status=action-failed");
  }

  const { error: deleteError } = await supabase
    .from("child_profiles")
    .delete()
    .eq("id", childProfile.id)
    .eq("family_id", family.id);

  if (deleteError) {
    redirect("/parent/children?status=action-failed");
  }

  revalidateParentWorkspace();
  revalidateChildWorkspace();
  revalidateSuperAdminWorkspace();
  redirect("/parent/children?status=child-deleted");
}

export async function awardBoopsAction(formData: FormData) {
  const parsed = awardBoopsSchema.safeParse({
    childProfileId: formData.get("childProfileId"),
    amount: formData.get("amount"),
    reason: formData.get("reason"),
  });

  if (!parsed.success) {
    redirect("/parent?status=action-failed");
  }

  const { supabase, user, family } = await getParentContextOrRedirect();

  if (!family) {
    redirect("/parent?status=family-required");
  }

  const { error } = await createPendingBoopAwards({
    amount: parsed.data.amount,
    childProfileIds: [parsed.data.childProfileId],
    createdBy: user.id,
    familyId: family.id,
    reason: parsed.data.reason,
    sourceType: "manual",
    supabase,
  });

  if (error) {
    redirect("/parent?status=action-failed");
  }

  revalidateParentWorkspace();
  revalidateChildWorkspace();
  redirect("/parent?status=boops-awarded");
}

export async function awardSurpriseBoopsInlineAction(
  _previousState: AwardSurpriseBoopsInlineState,
  formData: FormData,
): Promise<AwardSurpriseBoopsInlineState> {
  const parsed = awardSurpriseBoopsInlineSchema.safeParse({
    amount: formData.get("amount"),
    childTarget: formData.get("childTarget"),
    reason: formData.get("reason"),
  });

  if (!parsed.success) {
    return { status: "error" };
  }

  const { supabase, user, family } = await getParentContextOrRedirect();

  if (!family) {
    return { status: "error" };
  }

  const targetChildren =
    parsed.data.childTarget === "all"
      ? await supabase
          .from("child_profiles")
          .select("id")
          .eq("family_id", family.id)
      : await supabase
          .from("child_profiles")
          .select("id")
          .eq("family_id", family.id)
          .eq("id", parsed.data.childTarget);

  if (targetChildren.error) {
    return { status: "error" };
  }

  const childProfileIds = (targetChildren.data ?? []).map((child) => child.id);

  if (!childProfileIds.length) {
    return { status: "error" };
  }

  const { error } = await createPendingBoopAwards({
    amount: parsed.data.amount,
    childProfileIds,
    createdBy: user.id,
    familyId: family.id,
    reason: parsed.data.reason,
    sourceType: "manual",
    supabase,
  });

  if (error) {
    return { status: "error" };
  }

  revalidateParentWorkspace();
  revalidateChildWorkspace();

  return {
    awardedChildren: childProfileIds.length,
    status: "success",
    totalAwarded: parsed.data.amount * childProfileIds.length,
  };
}

export async function createRewardAction(formData: FormData) {
  const parsed = rewardSchema.safeParse({
    active: formData.get("active") ?? "",
    childProfileId: formData.get("childProfileId"),
    cost: formData.get("cost"),
    description: formData.get("description"),
    title: formData.get("title"),
  });

  if (!parsed.success) {
    redirect("/parent/rewards?status=action-failed");
  }

  const { supabase, family } = await getParentContextOrRedirect();

  if (!family) {
    redirect("/parent/rewards?status=family-required");
  }

  const { error } = await supabase.from("rewards").insert({
    active: parsed.data.active === "on",
    cost: parsed.data.cost,
    child_profile_id: parsed.data.childProfileId || null,
    description: parsed.data.description || null,
    family_id: family.id,
    title: parsed.data.title,
  });

  if (error) {
    redirect("/parent/rewards?status=action-failed");
  }

  revalidateParentWorkspace();
  revalidateChildWorkspace();
  redirect("/parent/rewards?status=reward-created");
}

export async function updateRewardAction(formData: FormData) {
  const rewardId = formData.get("rewardId");
  const parsed = rewardSchema.safeParse({
    active: formData.get("active") ?? "",
    childProfileId: formData.get("childProfileId"),
    cost: formData.get("cost"),
    description: formData.get("description"),
    title: formData.get("title"),
  });

  if (!parsed.success || typeof rewardId !== "string") {
    redirect("/parent/rewards?status=action-failed");
  }

  const { supabase, family } = await getParentContextOrRedirect();

  if (!family) {
    redirect("/parent/rewards?status=family-required");
  }

  const { error } = await supabase
    .from("rewards")
    .update({
      active: parsed.data.active === "on",
      cost: parsed.data.cost,
      child_profile_id: parsed.data.childProfileId || null,
      description: parsed.data.description || null,
      title: parsed.data.title,
    })
    .eq("id", rewardId)
    .eq("family_id", family.id);

  if (error) {
    redirect("/parent/rewards?status=action-failed");
  }

  revalidateParentWorkspace();
  revalidateChildWorkspace();
  redirect("/parent/rewards?status=reward-updated");
}

export async function createTaskAction(formData: FormData) {
  const parsed = taskSchema.safeParse({
    active: formData.get("active") ?? "",
    boopReward: formData.get("boopReward"),
    childProfileId: formData.get("childProfileId"),
    description: formData.get("description"),
    recurringType: formData.get("recurringType"),
    returnTo: formData.get("returnTo"),
    title: formData.get("title"),
    weeklyDays: normalizeTaskWeeklyDays(formData.getAll("weeklyDays")),
  });

  if (!parsed.success) {
    redirect("/parent/tasks?status=action-failed");
  }

  const returnTo = parsed.data.returnTo ?? "/parent";

  const { supabase, family } = await getParentContextOrRedirect();

  if (!family) {
    redirect(`${returnTo}?status=family-required`);
  }

  const { error } = await supabase.from("tasks").insert({
    active: parsed.data.active === "on",
    boop_reward: parsed.data.boopReward,
    child_profile_id: parsed.data.childProfileId || null,
    description: parsed.data.description || null,
    family_id: family.id,
    recurring_type: parsed.data.recurringType,
    title: parsed.data.title,
    weekly_days:
      parsed.data.recurringType === "weekly" ? parsed.data.weeklyDays ?? [] : null,
  });

  if (error) {
    redirect(`${returnTo}?status=action-failed`);
  }

  revalidateParentWorkspace();
  revalidateChildWorkspace();
  redirect(`${returnTo}?status=task-created`);
}

export async function updateTaskAction(formData: FormData) {
  const parsed = taskSchema.safeParse({
    active: formData.get("active") ?? "",
    boopReward: formData.get("boopReward"),
    childProfileId: formData.get("childProfileId"),
    description: formData.get("description"),
    recurringType: formData.get("recurringType"),
    returnTo: formData.get("returnTo"),
    taskId: formData.get("taskId"),
    title: formData.get("title"),
    weeklyDays: normalizeTaskWeeklyDays(formData.getAll("weeklyDays")),
  });

  if (!parsed.success || !parsed.data.taskId) {
    redirect("/parent/tasks?status=action-failed");
  }

  const returnTo = parsed.data.returnTo ?? "/parent/tasks";

  const { supabase, family } = await getParentContextOrRedirect();

  if (!family) {
    redirect(`${returnTo}?status=family-required`);
  }

  const { error } = await supabase
    .from("tasks")
    .update({
      active: parsed.data.active === "on",
      boop_reward: parsed.data.boopReward,
      child_profile_id: parsed.data.childProfileId || null,
      description: parsed.data.description || null,
      recurring_type: parsed.data.recurringType,
      title: parsed.data.title,
      weekly_days:
        parsed.data.recurringType === "weekly" ? parsed.data.weeklyDays ?? [] : null,
    })
    .eq("id", parsed.data.taskId)
    .eq("family_id", family.id);

  if (error) {
    redirect(`${returnTo}?status=action-failed`);
  }

  revalidateParentWorkspace();
  revalidateChildWorkspace();
  redirect(`${returnTo}?status=task-updated`);
}

export async function deleteTaskAction(formData: FormData) {
  const parsed = deleteTaskSchema.safeParse({
    taskId: formData.get("taskId"),
  });

  if (!parsed.success) {
    redirect("/parent/tasks?status=action-failed");
  }

  const { supabase, family } = await getParentContextOrRedirect();

  if (!family) {
    redirect("/parent/tasks?status=family-required");
  }

  const { error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", parsed.data.taskId)
    .eq("family_id", family.id);

  if (error) {
    redirect("/parent/tasks?status=action-failed");
  }

  revalidateParentWorkspace();
  revalidateChildWorkspace();
  redirect("/parent/tasks?status=task-deleted");
}

export async function submitTaskCompletionAction(formData: FormData) {
  const result = await submitTaskCompletionInlineAction(
    { status: "idle" },
    formData,
  );

  if (result.status === "already-submitted") {
    redirect("/child?status=task-already-submitted");
  }

  if (result.status === "submitted") {
    redirect("/child?status=task-submitted");
  }

  redirect("/child?status=action-failed");
}

export async function submitTaskCompletionInlineAction(
  _previousState: SubmitTaskCompletionInlineState,
  formData: FormData,
): Promise<SubmitTaskCompletionInlineState> {
  const parsed = taskCompletionSchema.safeParse({
    taskId: formData.get("taskId"),
  });

  if (!parsed.success) {
    return { status: "error" };
  }

  let admin;
  let deviceMode;

  try {
    const context = await getChildModeActionContextOrRedirect();
    admin = context.admin;
    deviceMode = context.deviceMode;
  } catch {
    return { status: "error" };
  }

  const { data: task } = await admin
    .from("tasks")
    .select("*")
    .eq("id", parsed.data.taskId)
    .eq("family_id", deviceMode.family_id)
    .maybeSingle();

  if (
    !task ||
    !task.active ||
    (task.child_profile_id && task.child_profile_id !== deviceMode.child_profile_id)
  ) {
    return { status: "error" };
  }

  const { data: completions, error: completionError } = await admin
    .from("task_completions")
    .select("*")
    .eq("task_id", task.id)
    .eq("child_profile_id", deviceMode.child_profile_id)
      .order("submitted_at", { ascending: false });

  if (completionError) {
    return { status: "error" };
  }

  const effectiveWindowStart = getTaskWindowStartForTask(task);
  const relevantCompletions = (completions ?? []).filter((completion) => {
    if (!effectiveWindowStart) {
      return true;
    }

    return new Date(completion.submitted_at) >= effectiveWindowStart;
  });
  const latestRelevantCompletion = relevantCompletions[0];

  if (
    latestRelevantCompletion &&
    (latestRelevantCompletion.status === "pending" ||
      latestRelevantCompletion.status === "approved")
  ) {
    return { status: "already-submitted" };
  }

  const { error } = await admin.from("task_completions").insert({
    child_profile_id: deviceMode.child_profile_id,
    status: "pending",
    task_id: task.id,
  });

  if (error) {
    return { status: "error" };
  }

  revalidateParentWorkspace();
  revalidateChildWorkspace();
  return { status: "submitted" };
}

export async function approveTaskCompletionAction(formData: FormData) {
  const parsed = reviewTaskCompletionSchema.safeParse({
    completionId: formData.get("completionId"),
  });

  if (!parsed.success) {
    redirect("/parent/approvals?status=action-failed");
  }

  const { supabase } = await getParentContextOrRedirect();
  const { error } = await supabase.rpc("approve_task_completion", {
    target_completion_id: parsed.data.completionId,
  });

  if (error) {
    redirect("/parent/approvals?status=action-failed");
  }

  revalidateParentWorkspace();
  revalidateChildWorkspace();
  redirect("/parent/approvals?status=task-approved");
}

export async function rejectTaskCompletionAction(formData: FormData) {
  const parsed = reviewTaskCompletionSchema.safeParse({
    completionId: formData.get("completionId"),
  });

  if (!parsed.success) {
    redirect("/parent/approvals?status=action-failed");
  }

  const { supabase } = await getParentContextOrRedirect();
  const { error } = await supabase.rpc("reject_task_completion", {
    target_completion_id: parsed.data.completionId,
  });

  if (error) {
    redirect("/parent/approvals?status=action-failed");
  }

  revalidateParentWorkspace();
  revalidateChildWorkspace();
  redirect("/parent/approvals?status=task-rejected");
}

export async function requestRewardRedemptionAction(formData: FormData) {
  const parsed = rewardRequestSchema.safeParse({
    rewardId: formData.get("rewardId"),
    returnTo: formData.get("returnTo"),
  });

  const returnTo = parsed.success ? (parsed.data.returnTo ?? "/child") : "/child";

  if (!parsed.success) {
    redirect(buildChildStatusPath(returnTo, "action-failed"));
  }

  const { admin, deviceMode } = await getChildModeActionContextOrRedirect();
  const { data: reward } = await admin
    .from("rewards")
    .select("*")
    .eq("id", parsed.data.rewardId)
    .eq("family_id", deviceMode.family_id)
    .eq("active", true)
    .maybeSingle();

  if (
    !reward ||
    (reward.child_profile_id && reward.child_profile_id !== deviceMode.child_profile_id)
  ) {
    redirect(buildChildStatusPath(returnTo, "action-failed"));
  }

  const { data: transactionRows, error: transactionError } = await admin
    .from("boop_transactions")
    .select("amount")
    .eq("child_profile_id", deviceMode.child_profile_id);

  if (transactionError) {
    redirect(buildChildStatusPath(returnTo, "action-failed"));
  }

  const availableBoops = (transactionRows ?? []).reduce(
    (sum, transaction) => sum + transaction.amount,
    0,
  );

  if (availableBoops < reward.cost) {
    redirect(buildChildStatusPath(returnTo, "not-enough-boops"));
  }

  const { error } = await admin.from("redemptions").insert({
    child_profile_id: deviceMode.child_profile_id,
    cost_at_redemption: reward.cost,
    family_id: deviceMode.family_id,
    reward_id: reward.id,
    status: "pending",
  });

  if (error) {
    redirect(buildChildStatusPath(returnTo, "action-failed"));
  }

  revalidateParentWorkspace();
  revalidateChildWorkspace();
  redirect(buildChildStatusPath(returnTo, "reward-requested"));
}

export async function claimPendingBoopsAction(formData: FormData) {
  const parsed = claimPendingBoopsSchema.safeParse({
    nfcUid: formData.get("nfcUid"),
    returnTo: formData.get("returnTo"),
  });

  const returnTo = parsed.success ? (parsed.data.returnTo ?? "/child") : "/child";

  if (!parsed.success) {
    redirect(buildChildStatusPath(returnTo, "action-failed"));
  }

  const { admin, deviceMode } = await getChildModeActionContextOrRedirect();
  const { readNfcUid } = await getNfcHelpers();
  const nfcRead = await readNfcUid(parsed.data.nfcUid);

  if (!nfcRead.nfc_uid) {
    redirect(buildChildStatusPath(returnTo, "action-failed"));
  }

  const { data, error } = await admin.rpc("claim_pending_boop_awards", {
    target_booper_uid: nfcRead.nfc_uid,
    target_child_profile_id: deviceMode.child_profile_id,
    target_family_id: deviceMode.family_id,
  });

  if (error) {
    redirect(
      error.message.toLowerCase().includes("assigned booper")
        ? buildChildStatusPath(returnTo, "wrong-booper")
        : buildChildStatusPath(returnTo, "action-failed"),
    );
  }

  const claimResult = data?.[0];

  if (!claimResult || claimResult.claimed_count === 0) {
    redirect(buildChildStatusPath(returnTo, "no-boops-waiting"));
  }

  revalidateParentWorkspace();
  revalidateChildWorkspace();
  redirect(buildChildStatusPath(returnTo, "boops-collected"));
}

async function collectWaitingBoopsForParent(params: {
  actorUserId: string;
  admin: ReturnType<typeof createSupabaseAdminClient>;
  childProfileId: string;
  familyId: string;
  nfcUid: string;
}) {
  const { actorUserId, admin, childProfileId, familyId, nfcUid } = params;
  const { data: child } = await admin
    .from("child_profiles")
    .select("id, display_name")
    .eq("id", childProfileId)
    .eq("family_id", familyId)
    .maybeSingle();

  if (!child) {
    return { status: "error" as const };
  }

  const { readNfcUid } = await getNfcHelpers();
  const nfcRead = await readNfcUid(nfcUid);

  if (!nfcRead.nfc_uid) {
    return { status: "error" as const };
  }

  const { data, error } = await admin.rpc("claim_pending_boop_awards", {
    target_booper_uid: nfcRead.nfc_uid,
    target_child_profile_id: child.id,
    target_family_id: familyId,
  });

  if (error) {
    return {
      status: error.message.toLowerCase().includes("assigned booper")
        ? ("wrong-booper" as const)
        : ("error" as const),
    };
  }

  const claimResult = data?.[0];

  if (!claimResult || claimResult.claimed_count === 0) {
    return { status: "no-boops-waiting" as const };
  }

  const { writeSuperAdminAuditLog } = await getSuperAdminHelpers();
  await writeSuperAdminAuditLog({
    action: "pending_boops_collected_by_parent",
    actorUserId,
    metadata: {
      childDisplayName: child.display_name,
      childProfileId: child.id,
      claimedCount: claimResult.claimed_count,
      claimedTotal: claimResult.claimed_total,
      familyId,
      uid: nfcRead.nfc_uid,
    },
    targetId: child.id,
    targetType: "child_profiles",
  });

  return {
    childDisplayName: child.display_name,
    claimedCount: claimResult.claimed_count,
    claimedTotal: claimResult.claimed_total,
    status: "submitted" as const,
  };
}

export async function collectWaitingBoopsForChildAction(formData: FormData) {
  const parsed = parentClaimPendingBoopsSchema.safeParse({
    childProfileId: formData.get("childProfileId"),
    nfcUid: formData.get("nfcUid"),
  });

  if (!parsed.success) {
    redirect("/parent/boopers?status=action-failed");
  }

  const { family, user } = await getParentContextOrRedirect();

  if (!family) {
    redirect("/parent/boopers?status=family-required");
  }

  const admin = createSupabaseAdminClient();
  const result = await collectWaitingBoopsForParent({
    actorUserId: user.id,
    admin,
    childProfileId: parsed.data.childProfileId,
    familyId: family.id,
    nfcUid: parsed.data.nfcUid,
  });

  if (result.status === "wrong-booper") {
    redirect("/parent/boopers?status=wrong-booper");
  }

  if (result.status === "no-boops-waiting") {
    redirect("/parent/boopers?status=no-boops-waiting");
  }

  if (result.status !== "submitted") {
    redirect("/parent/boopers?status=action-failed");
  }

  revalidateParentWorkspace();
  revalidateChildWorkspace();
  redirect("/parent/boopers?status=boops-collected-parent");
}

export async function collectWaitingBoopsForChildInlineAction(
  _previousState: CollectWaitingBoopsInlineState,
  formData: FormData,
): Promise<CollectWaitingBoopsInlineState> {
  const parsed = parentClaimPendingBoopsSchema.safeParse({
    childProfileId: formData.get("childProfileId"),
    nfcUid: formData.get("nfcUid"),
  });

  if (!parsed.success) {
    return { status: "error" };
  }

  let family;
  let user;

  try {
    const context = await getParentContextOrRedirect();
    family = context.family;
    user = context.user;
  } catch {
    return { status: "error" };
  }

  if (!family) {
    return { status: "error" };
  }

  const admin = createSupabaseAdminClient();
  const result = await collectWaitingBoopsForParent({
    actorUserId: user.id,
    admin,
    childProfileId: parsed.data.childProfileId,
    familyId: family.id,
    nfcUid: parsed.data.nfcUid,
  });

  if (result.status !== "submitted") {
    return { status: result.status };
  }

  revalidateParentWorkspace();
  revalidateChildWorkspace();

  return {
    claimedCount: result.claimedCount,
    claimedTotal: result.claimedTotal,
    status: "submitted",
  };
}

export async function updateChildAvatarPresetAction(formData: FormData) {
  const parsed = childAvatarPresetSchema.safeParse({
    avatarUrl: formData.get("avatarUrl"),
    returnTo: formData.get("returnTo"),
  });

  const returnTo = parsed.success ? (parsed.data.returnTo ?? "/child/profile") : "/child/profile";

  if (!parsed.success) {
    redirect(buildChildStatusPath(returnTo, "action-failed"));
  }

  const { admin, deviceMode } = await getChildModeActionContextOrRedirect();
  const { error } = await admin
    .from("child_profiles")
    .update({ avatar_url: parsed.data.avatarUrl })
    .eq("id", deviceMode.child_profile_id)
    .eq("family_id", deviceMode.family_id);

  if (error) {
    redirect(buildChildStatusPath(returnTo, "action-failed"));
  }

  revalidateParentWorkspace();
  revalidateChildWorkspace();
  redirect(buildChildStatusPath(returnTo, "avatar-updated"));
}

export async function approveRedemptionAction(formData: FormData) {
  const parsed = reviewRedemptionSchema.safeParse({
    redemptionId: formData.get("redemptionId"),
  });

  if (!parsed.success) {
    redirect("/parent/approvals?status=action-failed");
  }

  const { supabase } = await getParentContextOrRedirect();
  const { error } = await supabase.rpc("approve_redemption", {
    target_redemption_id: parsed.data.redemptionId,
  });

  if (error) {
    redirect("/parent/approvals?status=action-failed");
  }

  revalidateParentWorkspace();
  revalidateChildWorkspace();
  redirect("/parent/approvals?status=redemption-approved");
}

export async function rejectRedemptionAction(formData: FormData) {
  const parsed = reviewRedemptionSchema.safeParse({
    redemptionId: formData.get("redemptionId"),
  });

  if (!parsed.success) {
    redirect("/parent/approvals?status=action-failed");
  }

  const { supabase } = await getParentContextOrRedirect();
  const { error } = await supabase.rpc("reject_redemption", {
    target_redemption_id: parsed.data.redemptionId,
  });

  if (error) {
    redirect("/parent/approvals?status=action-failed");
  }

  revalidateParentWorkspace();
  revalidateChildWorkspace();
  redirect("/parent/approvals?status=redemption-rejected");
}

export async function completeRedemptionAction(formData: FormData) {
  const parsed = reviewRedemptionSchema.safeParse({
    redemptionId: formData.get("redemptionId"),
  });

  if (!parsed.success) {
    redirect("/parent/approvals?status=action-failed");
  }

  const { supabase, family } = await getParentContextOrRedirect();

  if (!family) {
    redirect("/parent/approvals?status=family-required");
  }

  const { data: redemption, error: redemptionError } = await supabase
    .from("redemptions")
    .select("id, status")
    .eq("id", parsed.data.redemptionId)
    .eq("family_id", family.id)
    .maybeSingle();

  if (redemptionError || !redemption || redemption.status !== "approved") {
    redirect("/parent/approvals?status=action-failed");
  }

  const { error } = await supabase
    .from("redemptions")
    .update({ status: "completed" })
    .eq("id", parsed.data.redemptionId)
    .eq("family_id", family.id)
    .eq("status", "approved");

  if (error) {
    redirect("/parent/approvals?status=action-failed");
  }

  revalidateParentWorkspace();
  revalidateChildWorkspace();
  redirect("/parent/approvals");
}

export async function pairBooperAction(formData: FormData) {
  const parsed = pairBooperSchema.safeParse({
    booperId: formData.get("booperId"),
    childProfileId: formData.get("childProfileId"),
  });

  if (!parsed.success) {
    redirect("/parent/boopers?status=action-failed");
  }

  const { supabase, family } = await getParentContextOrRedirect();

  if (!family) {
    redirect("/parent/boopers?status=family-required");
  }

  const admin = createSupabaseAdminClient();

  const { data: booper } = await supabase
    .from("boopers")
    .select("id, nfc_uid")
    .eq("id", parsed.data.booperId)
    .eq("family_id", family.id)
    .single();

  if (!booper) {
    redirect("/parent/boopers?status=action-failed");
  }

  const nextChildProfileId = parsed.data.childProfileId || null;

  if (nextChildProfileId) {
    const { data: childProfile } = await supabase
      .from("child_profiles")
      .select("id")
      .eq("id", nextChildProfileId)
      .eq("family_id", family.id)
      .maybeSingle();

    if (!childProfile) {
      redirect("/parent/boopers?status=action-failed");
    }
  }

  const { inventoryBooper } = await findInventoryBooperByUid<{
    batch_number: string;
    family_id: string | null;
    id: string;
    status: "available" | "assigned" | "lost" | "disabled" | "retired";
    uid: string;
  }>({
    admin,
    familyId: family.id,
    select: "id, batch_number, family_id, status, uid",
    uid: booper.nfc_uid,
  });

  if (!inventoryBooper) {
    await admin.from("boopers").delete().eq("id", booper.id);
    redirect("/parent/boopers?status=booper-origin-required");
  }

  if (inventoryBooper.status !== "assigned") {
    redirect("/parent/boopers?status=booper-conflict");
  }

  const { error: inventoryError } = await admin
    .from("booper_inventory")
    .update({ child_profile_id: nextChildProfileId })
    .eq("id", inventoryBooper.id);

  if (inventoryError) {
    redirect("/parent/boopers?status=action-failed");
  }

  const pairResult = await syncInventoryWithParentBooper({
    admin,
    batchNumber: inventoryBooper.batch_number,
    childProfileId: nextChildProfileId,
    familyId: family.id,
    status: inventoryBooper.status,
    uid: inventoryBooper.uid,
  });

  if (pairResult.error) {
    redirect("/parent/boopers?status=action-failed");
  }

  const { writeSuperAdminAuditLog } = await getSuperAdminHelpers();
  await writeSuperAdminAuditLog({
    action: "booper_child_pairing_updated",
    actorUserId: family.parent_user_id,
    metadata: {
      familyId: family.id,
      uid: inventoryBooper.uid,
    },
    targetId: inventoryBooper.id,
    targetType: "booper_inventory",
  });

  revalidateParentWorkspace();
  revalidateSuperAdminWorkspace();
  redirect("/parent/boopers?status=booper-paired");
}

export async function assignBooperToChildAction(formData: FormData) {
  const parsed = assignChildBooperSchema.safeParse({
    childProfileId: formData.get("childProfileId"),
    nfcUid: formData.get("nfcUid"),
    returnTo: formData.get("returnTo"),
  });

  if (!parsed.success) {
    redirect(buildParentBooperRedirectPath({ status: "action-failed" }));
  }

  const { family, supabase } = await getParentContextOrRedirect();
  const redirectBase = parsed.data.returnTo;

  if (!family) {
    redirect(buildParentBooperRedirectPath({ returnTo: redirectBase, status: "family-required" }));
  }

  const { data: childProfile } = await supabase
    .from("child_profiles")
    .select("id")
    .eq("id", parsed.data.childProfileId)
    .eq("family_id", family.id)
    .maybeSingle();

  if (!childProfile) {
    redirect(
      buildParentBooperRedirectPath({
        childProfileId: parsed.data.childProfileId,
        returnTo: redirectBase,
        status: "action-failed",
      }),
    );
  }

  const assignmentResult = await assignAvailableBooperToChild({
    actorUserId: family.parent_user_id,
    admin: createSupabaseAdminClient(),
    childProfileId: parsed.data.childProfileId,
    familyId: family.id,
    nfcUid: parsed.data.nfcUid,
  });

  if (assignmentResult.status === "not-found") {
    redirect(
      buildParentBooperRedirectPath({
        childProfileId: parsed.data.childProfileId,
        returnTo: redirectBase,
        status: "booper-not-imported",
      }),
    );
  }

  if (assignmentResult.status === "not-available") {
    redirect(
      buildParentBooperRedirectPath({
        childProfileId: parsed.data.childProfileId,
        returnTo: redirectBase,
        status: "booper-not-available",
      }),
    );
  }

  if (assignmentResult.status !== "success") {
    redirect(
      buildParentBooperRedirectPath({
        childProfileId: parsed.data.childProfileId,
        returnTo: redirectBase,
        status: "action-failed",
      }),
    );
  }

  revalidateParentWorkspace();
  revalidateSuperAdminWorkspace();
  redirect(
    buildParentBooperRedirectPath({
      childProfileId: parsed.data.childProfileId,
      returnTo: redirectBase,
      status: "booper-assigned",
    }),
  );
}

export async function updateBooperStatusAction(formData: FormData) {
  const parsed = booperStatusSchema.safeParse({
    booperId: formData.get("booperId"),
    childProfileId: formData.get("childProfileId"),
    returnTo: formData.get("returnTo"),
    status: formData.get("status"),
  });

  if (!parsed.success) {
    redirect(buildParentBooperRedirectPath({ status: "action-failed" }));
  }

  const { supabase, family } = await getParentContextOrRedirect();
  const redirectBase = parsed.data.returnTo;

  if (!family) {
    redirect(buildParentBooperRedirectPath({ returnTo: redirectBase, status: "family-required" }));
  }

  const admin = createSupabaseAdminClient();

  const { data: booper } = await supabase
    .from("boopers")
    .select("id, nfc_uid")
    .eq("id", parsed.data.booperId)
    .eq("family_id", family.id)
    .maybeSingle();

  if (!booper) {
    redirect(
      buildParentBooperRedirectPath({
        childProfileId: parsed.data.childProfileId,
        returnTo: redirectBase,
        status: "action-failed",
      }),
    );
  }

  const { inventoryBooper } = await findInventoryBooperByUid<{
    batch_number: string;
    child_profile_id: string | null;
    family_id: string | null;
    id: string;
    status: "available" | "assigned" | "lost" | "disabled" | "retired";
    uid: string;
  }>({
    admin,
    familyId: family.id,
    select: "id, batch_number, child_profile_id, family_id, status, uid",
    uid: booper.nfc_uid,
  });

  if (!inventoryBooper) {
    await admin.from("boopers").delete().eq("id", booper.id);
    redirect(
      buildParentBooperRedirectPath({
        childProfileId: parsed.data.childProfileId,
        returnTo: redirectBase,
        status: "booper-origin-required",
      }),
    );
  }

  const nextInventoryStatus =
    parsed.data.status === "active"
      ? "assigned"
      : parsed.data.status === "lost"
        ? "lost"
        : "disabled";

  const { error } = await admin
    .from("booper_inventory")
    .update({ status: nextInventoryStatus })
    .eq("id", inventoryBooper.id);

  if (error) {
    redirect(
      buildParentBooperRedirectPath({
        childProfileId: parsed.data.childProfileId,
        returnTo: redirectBase,
        status: "action-failed",
      }),
    );
  }

  const syncResult = await syncInventoryWithParentBooper({
    admin,
    batchNumber: inventoryBooper.batch_number,
    childProfileId: inventoryBooper.child_profile_id,
    familyId: family.id,
    status: nextInventoryStatus,
    uid: inventoryBooper.uid,
  });

  if (syncResult.error) {
    redirect(
      buildParentBooperRedirectPath({
        childProfileId: parsed.data.childProfileId,
        returnTo: redirectBase,
        status: "action-failed",
      }),
    );
  }

  const { writeSuperAdminAuditLog } = await getSuperAdminHelpers();
  await writeSuperAdminAuditLog({
    action: "booper_status_updated_by_parent",
    actorUserId: family.parent_user_id,
    metadata: {
      familyId: family.id,
      status: nextInventoryStatus,
      uid: inventoryBooper.uid,
    },
    targetId: inventoryBooper.id,
    targetType: "booper_inventory",
  });

  revalidateParentWorkspace();
  revalidateSuperAdminWorkspace();
  redirect(
    buildParentBooperRedirectPath({
      childProfileId: parsed.data.childProfileId,
      returnTo: redirectBase,
      status: "booper-status-updated",
    }),
  );
}

export async function awardBoopFromNfcAction(formData: FormData) {
  const parsed = nfcAwardSchema.safeParse({
    amount: formData.get("amount"),
    nfcUid: formData.get("nfcUid"),
    reason: formData.get("reason"),
  });

  if (!parsed.success) {
    redirect("/parent/boopers?status=action-failed");
  }

  const { family, user } = await getParentContextOrRedirect();

  if (!family) {
    redirect("/parent/boopers?status=family-required");
  }

  const { awardBoopFromNfc, readNfcUid } = await getNfcHelpers();
  const nfcRead = await readNfcUid(parsed.data.nfcUid);

  if (!nfcRead.nfc_uid) {
    redirect("/parent/boopers?status=action-failed");
  }

  const awardResult = await awardBoopFromNfc(
    createSupabaseAdminClient(),
    nfcRead.nfc_uid,
    parsed.data.amount,
    parsed.data.reason,
    user.id,
    family.id,
  );

  if (awardResult.error) {
    redirect("/parent/boopers?status=nfc-award-failed");
  }

  revalidateParentWorkspace();
  revalidateChildWorkspace();
  redirect("/parent/boopers?status=nfc-boop-awarded");
}

export async function launchChildModeAction(formData: FormData) {
  const parsed = childModeSchema.safeParse({
    childProfileId: formData.get("childProfileId"),
    familyId: formData.get("familyId"),
    deviceLabel: formData.get("deviceLabel"),
  });

  if (!parsed.success || !isChildModeConfigured()) {
    redirect("/parent/child-mode?status=action-failed");
  }

  const { supabase, family } = await getParentContextOrRedirect();

  if (!family || family.id !== parsed.data.familyId) {
    redirect("/parent/child-mode?status=family-required");
  }

  const { data: child } = await supabase
    .from("child_profiles")
    .select("id, family_id")
    .eq("id", parsed.data.childProfileId)
    .eq("family_id", parsed.data.familyId)
    .maybeSingle();

  if (!child) {
    redirect("/parent/child-mode?status=action-failed");
  }

  const { setChildModeSelection, setChildModeSession } = await getChildModeHelpers();

  await supabase
    .from("device_child_mode")
    .insert({
      child_profile_id: parsed.data.childProfileId,
      device_label: parsed.data.deviceLabel || "House tablet",
      family_id: parsed.data.familyId,
    });

  await setChildModeSession({
    childProfileId: child.id,
    deviceLabel: parsed.data.deviceLabel || "House tablet",
    familyId: child.family_id,
  });
  await setChildModeSelection({ childProfileId: parsed.data.childProfileId });

  revalidateChildWorkspace();
  redirect("/child?status=child-mode-ready");
}

export async function updateParentPinAction(formData: FormData) {
  const parsed = z
    .object({
      confirmParentPin: z.string().trim().regex(/^\d{4}$/),
      parentPin: z.string().trim().regex(/^\d{4}$/),
    })
    .safeParse({
      confirmParentPin: formData.get("confirmParentPin"),
      parentPin: formData.get("parentPin"),
    });

  if (!parsed.success || parsed.data.parentPin !== parsed.data.confirmParentPin) {
    redirect("/parent?status=pin-invalid");
  }

  const { supabase, family } = await getParentContextOrRedirect();

  if (!family) {
    redirect("/parent?status=family-required");
  }

  if (typeof family.parent_pin !== "string") {
    redirect("/parent?status=pin-setup-required");
  }

  const { error } = await supabase
    .from("families")
    .update({ parent_pin: parsed.data.parentPin })
    .eq("id", family.id);

  if (error) {
    redirect(
      error.message.toLowerCase().includes("parent_pin")
        ? "/parent?status=pin-setup-required"
        : "/parent?status=action-failed",
    );
  }

  revalidateParentWorkspace();
  redirect("/parent?status=pin-updated");
}

export async function exitChildModeAction() {
  const { clearChildModeSession } = await getChildModeHelpers();
  await clearChildModeSession();
  redirect("/parent?status=child-mode-exited&unlock=1");
}

export async function unlockChildModeAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = parentPinSchema.safeParse({
    parentPin: formData.get("parentPin"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Enter the 4-digit parent PIN to unlock admin mode.",
    };
  }

  if (!isSupabaseConfigured()) {
    return {
      status: "error",
      message: "Supabase is not configured.",
    };
  }

  const { family } = await getParentContextOrRedirect();

  if (!family) {
    return {
      status: "error",
      message: "Create a family before using child mode unlock.",
    };
  }

  if (getFamilyParentPin(family.parent_pin) !== parsed.data.parentPin) {
    return {
      status: "error",
      message: "That PIN did not unlock parent mode.",
    };
  }

  const { clearChildModeSession } = await getChildModeHelpers();
  await clearChildModeSession();
  revalidateChildWorkspace();

  return {
    status: "success",
    message: "Parent mode unlocked.",
  };
}

export async function unlockChildModeWithRedirectAction(formData: FormData) {
  const parsed = parentPinSchema.safeParse({
    parentPin: formData.get("parentPin"),
  });

  if (!parsed.success) {
    redirect("/child/unlock?status=invalid-pin-format");
  }

  if (!isSupabaseConfigured()) {
    redirect("/child/unlock?status=missing-supabase");
  }

  const { family } = await getParentContextOrRedirect();

  if (!family) {
    redirect("/child/unlock?status=family-required");
  }

  if (getFamilyParentPin(family.parent_pin) !== parsed.data.parentPin) {
    redirect("/child/unlock?status=invalid-pin");
  }

  const { clearChildModeSession } = await getChildModeHelpers();
  await clearChildModeSession();
  revalidateChildWorkspace();
  redirect("/parent?unlock=1");
}

function getInventoryBooperLabel(batchNumber: string, uid: string) {
  return `Booper ${batchNumber} #${uid.slice(Math.max(0, uid.length - 6))}`;
}

function renderInventoryTemplate(template: string, uid: string) {
  return template
    .replace(/\{\{\s*uid\s*\}\}/gi, uid)
    .replace(/\{\s*uid\s*\}/gi, uid)
    .trim();
}

async function findInventoryBooperByUid<T extends { uid: string | null }>(params: {
  admin: ReturnType<typeof createSupabaseAdminClient>;
  familyId?: string | null;
  select: string;
  uid: string;
}) {
  let query = params.admin.from("booper_inventory").select(params.select);

  if (params.familyId) {
    query = query.eq("family_id", params.familyId);
  }

  const { data, error } = await query;

  if (error) {
    return { error, inventoryBooper: null };
  }

  const normalizedUid = normalizeUid(params.uid);
  const inventoryBooper =
    (data ?? []).find((row) => {
      if (!row || typeof row !== "object" || !("uid" in row)) {
        return false;
      }

      const rowUid = (row as { uid: string | null }).uid;
      return areUidsEqual(rowUid, normalizedUid);
    }) ?? null;

  return { error: null, inventoryBooper: inventoryBooper as T | null };
}

async function findBoopersByUid<T extends { nfc_uid: string | null }>(params: {
  admin: ReturnType<typeof createSupabaseAdminClient>;
  select: string;
  uid: string;
}) {
  const { data, error } = await params.admin.from("boopers").select(params.select);

  if (error) {
    return { boopers: [] as T[], error };
  }

  const normalizedUid = normalizeUid(params.uid);
  const boopers = (data ?? []).filter((row) => {
    if (!row || typeof row !== "object" || !("nfc_uid" in row)) {
      return false;
    }

    const rowUid = (row as { nfc_uid: string | null }).nfc_uid;
    return areUidsEqual(rowUid, normalizedUid);
  });

  return { boopers: boopers as unknown as T[], error: null };
}

function mapInventoryStatusToBooperStatus(
  status: "available" | "assigned" | "lost" | "disabled" | "retired",
) {
  if (status === "lost") {
    return "lost" as const;
  }

  if (status === "disabled" || status === "retired") {
    return "disabled" as const;
  }

  return "active" as const;
}

async function createPendingBoopAward(params: {
  amount: number;
  childProfileId: string;
  createdBy: string;
  familyId: string;
  reason: string;
  sourceType: "manual" | "task_approval" | "nfc_award" | "daily_bonus";
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>> | ReturnType<typeof createSupabaseAdminClient>;
}) {
  return params.supabase.from("pending_boop_awards").insert({
    amount: params.amount,
    awarded_by: params.createdBy,
    child_profile_id: params.childProfileId,
    family_id: params.familyId,
    reason: params.reason,
    source_type: params.sourceType,
  });
}

async function createPendingBoopAwards(params: {
  amount: number;
  childProfileIds: string[];
  createdBy: string;
  familyId: string;
  reason: string;
  sourceType: "manual" | "task_approval" | "nfc_award" | "daily_bonus";
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>> | ReturnType<typeof createSupabaseAdminClient>;
}) {
  if (params.childProfileIds.length === 1) {
    return createPendingBoopAward({
      amount: params.amount,
      childProfileId: params.childProfileIds[0],
      createdBy: params.createdBy,
      familyId: params.familyId,
      reason: params.reason,
      sourceType: params.sourceType,
      supabase: params.supabase,
    });
  }

  return params.supabase.from("pending_boop_awards").insert(
    params.childProfileIds.map((childProfileId) => ({
      amount: params.amount,
      awarded_by: params.createdBy,
      child_profile_id: childProfileId,
      family_id: params.familyId,
      reason: params.reason,
      source_type: params.sourceType,
    })),
  );
}

async function syncInventoryWithParentBooper(params: {
  admin: ReturnType<typeof createSupabaseAdminClient>;
  familyId: string | null;
  childProfileId: string | null;
  status: "available" | "assigned" | "lost" | "disabled" | "retired";
  uid: string;
  batchNumber: string;
}) {
  const { admin, batchNumber, childProfileId, familyId, status, uid } = params;
  const label = getInventoryBooperLabel(batchNumber, uid);
  const booperStatus = mapInventoryStatusToBooperStatus(status);

  const { boopers: existingBoopers, error: existingError } = await findBoopersByUid<{
    family_id: string | null;
    id: string;
    nfc_uid: string | null;
  }>({
    admin,
    select: "id, family_id, nfc_uid",
    uid,
  });

  if (existingError) {
    return { error: existingError };
  }

  if (!familyId || status === "retired") {
    if (existingBoopers?.length) {
      const booperIds = existingBoopers
        .map((booper) => ("id" in booper ? String(booper.id) : null))
        .filter((booperId): booperId is string => Boolean(booperId));
      const { error } = await admin.from("boopers").delete().in("id", booperIds);

      if (error) {
        return { error };
      }
    }

    return { error: null };
  }

  const matchingBooper = existingBoopers?.find((booper) => booper.family_id === familyId) ?? null;

  if (matchingBooper && existingBoopers?.length === 1) {
    const { error } = await admin
      .from("boopers")
      .update({
        child_profile_id: childProfileId,
        label,
        status: booperStatus,
      })
      .eq("id", matchingBooper.id);

    return { error };
  }

  if (existingBoopers?.length) {
    const booperIds = existingBoopers
      .map((booper) => ("id" in booper ? String(booper.id) : null))
      .filter((booperId): booperId is string => Boolean(booperId));
    const { error } = await admin.from("boopers").delete().in("id", booperIds);

    if (error) {
      return { error };
    }
  }

  const { error } = await admin.from("boopers").insert({
    child_profile_id: childProfileId,
    family_id: familyId,
    label,
    nfc_uid: uid,
    status: booperStatus,
  });

  return { error };
}

async function assignAvailableBooperToChild(params: {
  actorUserId: string;
  admin: ReturnType<typeof createSupabaseAdminClient>;
  childProfileId: string;
  familyId: string;
  nfcUid: string;
}) {
  const { actorUserId, admin, childProfileId, familyId, nfcUid } = params;
  const { readNfcUid } = await getNfcHelpers();
  const { writeSuperAdminAuditLog } = await getSuperAdminHelpers();
  const nfcRead = await readNfcUid(nfcUid);

  if (!nfcRead.nfc_uid) {
    return { status: "invalid" as const };
  }

  const { inventoryBooper } = await findInventoryBooperByUid<{
    assigned_at: string | null;
    batch_number: string;
    child_profile_id: string | null;
    family_id: string | null;
    id: string;
    imported_at: string;
    imported_by: string;
    ndef_text: string | null;
    ndef_url: string | null;
    notes: string | null;
    serial_label: string;
    status: "available" | "assigned" | "lost" | "disabled" | "retired";
    uid: string;
  }>({
    admin,
    select: "*",
    uid: nfcRead.nfc_uid,
  });

  if (!inventoryBooper) {
    return { status: "not-found" as const };
  }

  if (
    inventoryBooper.status !== "available" ||
    inventoryBooper.family_id ||
    inventoryBooper.child_profile_id
  ) {
    return { status: "not-available" as const };
  }

  const { data: updatedInventoryBooper, error: updateError } = await admin
    .from("booper_inventory")
    .update({
      assigned_at: new Date().toISOString(),
      child_profile_id: childProfileId,
      family_id: familyId,
      status: "assigned",
    })
    .eq("id", inventoryBooper.id)
    .eq("status", "available")
    .is("family_id", null)
    .is("child_profile_id", null)
    .select("*")
    .single();

  if (updateError || !updatedInventoryBooper) {
    return { status: "not-available" as const };
  }

  const syncResult = await syncInventoryWithParentBooper({
    admin,
    batchNumber: updatedInventoryBooper.batch_number,
    childProfileId,
    familyId,
    status: updatedInventoryBooper.status,
    uid: updatedInventoryBooper.uid,
  });

  if (syncResult.error) {
    return { status: "failed" as const };
  }

  await writeSuperAdminAuditLog({
    action: "booper_assigned_by_parent",
    actorUserId,
    metadata: {
      familyId,
      uid: updatedInventoryBooper.uid,
    },
    targetId: updatedInventoryBooper.id,
    targetType: "booper_inventory",
  });

  return {
    inventoryBooper: updatedInventoryBooper,
    status: "success" as const,
  };
}

export async function importBooperInventoryAction(formData: FormData) {
  const parsed = importBooperInventorySchema.safeParse({
    batchNumber: formData.get("batchNumber"),
    csvText: formData.get("csvText"),
    inventoryFile: formData.get("inventoryFile"),
    ndefTextTemplate: formData.get("ndefTextTemplate"),
    ndefUrlTemplate: formData.get("ndefUrlTemplate"),
  });

  const csvText = parsed.success ? parsed.data.csvText?.trim() ?? "" : "";
  const inventoryFile = parsed.success ? parsed.data.inventoryFile : undefined;
  const uploadedFile = isUploadedFile(inventoryFile) ? inventoryFile : null;
  const hasUpload = Boolean(uploadedFile && uploadedFile.size > 0);

  if (!parsed.success || (!csvText && !hasUpload)) {
    redirect("/superadmin/boopers?status=uid-import-failed");
  }

  const {
    isValidImportedNdefUrl,
    isValidImportedUid,
    parseBooperInventoryCsvFile,
    parseBooperInventoryCsvText,
  } = await getWristbandImportHelpers();
  const { requireSuperAdmin, writeSuperAdminAuditLog } = await getSuperAdminHelpers();
  const { admin, user } = await requireSuperAdmin();

  let rows;

  try {
    rows = csvText
      ? parseBooperInventoryCsvText(csvText)
      : await parseBooperInventoryCsvFile(uploadedFile as File);
  } catch {
    redirect("/superadmin/boopers?status=uid-import-failed");
  }

  const seenUids = new Set<string>();
  const validRows: {
    ndefText: string | null;
    ndefUrl: string | null;
    serialLabel: string;
    uid: string;
  }[] = [];
  let invalidCount = 0;
  let skippedCount = 0;

  for (const row of rows) {
    if (!isValidImportedUid(row.uid)) {
      invalidCount += 1;
      continue;
    }

    if (seenUids.has(row.uid)) {
      skippedCount += 1;
      continue;
    }

    seenUids.add(row.uid);

    const generatedNdefUrl = parsed.data.ndefUrlTemplate
      ? renderInventoryTemplate(parsed.data.ndefUrlTemplate, row.uid)
      : "";
    const generatedNdefText = parsed.data.ndefTextTemplate
      ? renderInventoryTemplate(parsed.data.ndefTextTemplate, row.uid)
      : "";
    const ndefUrl = row.ndefUrl?.trim() || generatedNdefUrl || null;
    const ndefText = row.ndefText?.trim() || generatedNdefText || null;

    if (ndefUrl && !isValidImportedNdefUrl(ndefUrl)) {
      invalidCount += 1;
      continue;
    }

    validRows.push({
      ndefText,
      ndefUrl,
      serialLabel:
        row.label?.trim() ||
        `${parsed.data.batchNumber}-${row.uid.slice(Math.max(0, row.uid.length - 6))}`,
      uid: row.uid,
    });
  }

  if (!validRows.length) {
    redirect("/superadmin/boopers?status=uid-import-failed");
  }

  const { data: existingRows } = await admin.from("booper_inventory").select("uid");
  const existingUidSet = new Set((existingRows ?? []).map((row) => normalizeUid(row.uid)));
  const rowsToInsert = validRows.filter((row) => !existingUidSet.has(normalizeUid(row.uid)));
  const duplicateCount = validRows.length - rowsToInsert.length;
  const addedCount = rowsToInsert.length;

  if (rowsToInsert.length) {
    const { error } = await admin.from("booper_inventory").insert(
      rowsToInsert.map((row) => ({
        assigned_at: null,
        batch_number: parsed.data.batchNumber,
        child_profile_id: null,
        family_id: null,
        imported_at: new Date().toISOString(),
        imported_by: user.id,
        ndef_text: row.ndefText,
        ndef_url: row.ndefUrl,
        notes: null,
        serial_label: row.serialLabel,
        status: "available" as const,
        uid: row.uid,
      })),
    );

    if (error) {
      redirect("/superadmin/boopers?status=uid-import-failed");
    }
  }

  await writeSuperAdminAuditLog({
    action: "uid_import",
    actorUserId: user.id,
    metadata: {
      addedCount,
      batchNumber: parsed.data.batchNumber,
      duplicateCount,
      fileName: hasUpload ? uploadedFile?.name ?? null : null,
      invalidCount,
      ndefTextTemplate: parsed.data.ndefTextTemplate || null,
      ndefUrlTemplate: parsed.data.ndefUrlTemplate || null,
      ndefValuesPrepared: rowsToInsert.filter((row) => row.ndefUrl || row.ndefText).length,
      rowCount: rows.length,
      skippedCount,
      source: csvText ? "paste" : "upload",
    },
    targetType: "booper_inventory",
  });

  revalidateSuperAdminWorkspace();
  redirect(
    `/superadmin/boopers?status=uid-imported&added=${addedCount}&duplicates=${duplicateCount}&skipped=${skippedCount}&invalid=${invalidCount}`,
  );
}

export async function uploadTaskAssetAction(formData: FormData) {
  const parsed = uploadTaskAssetSchema.safeParse({
    category: getFormStringValue(formData, "category"),
    childAssetDataUrl: getFormStringValue(formData, "childAssetDataUrl"),
    childAssetOriginalName: getFormStringValue(formData, "childAssetOriginalName"),
    parentAssetDataUrl: getFormStringValue(formData, "parentAssetDataUrl"),
    parentAssetOriginalName: getFormStringValue(formData, "parentAssetOriginalName"),
    replaceExisting: getFormStringValue(formData, "replaceExisting"),
    taskName: getFormStringValue(formData, "taskName"),
  });

  if (!parsed.success) {
    const flattened = parsed.error.flatten();
    const firstFieldError =
      Object.entries(flattened.fieldErrors).find(([, errors]) => errors?.length)?.[1]?.[0] ??
      flattened.formErrors[0] ??
      "schema-parse-failed";

    console.error("uploadTaskAssetAction: schema parse failed", flattened);
    redirect(
      `/superadmin/tasks?status=task-asset-upload-failed&details=${encodeURIComponent(firstFieldError)}`,
    );
  }

  const parentAssetFile = fileFromDataUrl(
    parsed.data.parentAssetDataUrl,
    parsed.data.parentAssetOriginalName,
    "parent-task-asset",
  );
  const childAssetFile = fileFromDataUrl(
    parsed.data.childAssetDataUrl,
    parsed.data.childAssetOriginalName,
    "child-task-asset",
  );

  if (
    !isUploadedFile(parentAssetFile) ||
    parentAssetFile.size <= 0 ||
    !isUploadedFile(childAssetFile) ||
    childAssetFile.size <= 0
  ) {
    console.error("uploadTaskAssetAction: uploaded file missing or empty", {
      childAssetFile:
        childAssetFile && typeof childAssetFile === "object"
          ? {
              name: "name" in childAssetFile ? childAssetFile.name : null,
              size: "size" in childAssetFile ? childAssetFile.size : null,
              type: "type" in childAssetFile ? childAssetFile.type : null,
            }
          : childAssetFile,
      parentAssetFile:
        parentAssetFile && typeof parentAssetFile === "object"
          ? {
              name: "name" in parentAssetFile ? parentAssetFile.name : null,
              size: "size" in parentAssetFile ? parentAssetFile.size : null,
              type: "type" in parentAssetFile ? parentAssetFile.type : null,
            }
          : parentAssetFile,
    });
    redirect("/superadmin/tasks?status=task-asset-upload-failed&details=missing-image-data");
  }

  const {
    canonicalizeTaskAssetTitle,
    validateTaskAssetUpload,
    taskAssetExists,
    uploadTaskAssetPair,
  } = await getTaskAssetHelpers();
  const { requireSuperAdmin, writeSuperAdminAuditLog } = await getSuperAdminHelpers();
  const { user } = await requireSuperAdmin();

  let canonicalTaskName: string;

  try {
    canonicalTaskName = canonicalizeTaskAssetTitle(parsed.data.taskName);
  } catch {
    redirect("/superadmin/tasks?status=task-asset-name-invalid");
  }

  const [parentIsValidImage, childIsValidImage] = await Promise.all([
    validateTaskAssetUpload(parentAssetFile),
    validateTaskAssetUpload(childAssetFile),
  ]);

  if (!parentIsValidImage || !childIsValidImage) {
    const detail = [
      !parentIsValidImage
        ? `parent=${encodeURIComponent(parentAssetFile.name || "unknown")}:${encodeURIComponent(parentAssetFile.type || "unknown")}`
        : null,
      !childIsValidImage
        ? `child=${encodeURIComponent(childAssetFile.name || "unknown")}:${encodeURIComponent(childAssetFile.type || "unknown")}`
        : null,
    ]
      .filter(Boolean)
      .join(",");

    console.error("uploadTaskAssetAction: image validation failed", {
      child: { name: childAssetFile.name, size: childAssetFile.size, type: childAssetFile.type },
      parent: { name: parentAssetFile.name, size: parentAssetFile.size, type: parentAssetFile.type },
    });
    redirect(`/superadmin/tasks?status=task-asset-file-invalid&details=${detail}`);
  }

  const alreadyExists = await taskAssetExists({
    category: parsed.data.category,
    taskName: canonicalTaskName,
  });
  const replaceExisting = parsed.data.replaceExisting === "on";

  if (alreadyExists && !replaceExisting) {
    redirect(
      `/superadmin/tasks?status=task-asset-exists&taskName=${encodeURIComponent(
        canonicalTaskName,
      )}&category=${encodeURIComponent(parsed.data.category)}`,
    );
  }

  let uploadedAssetFileNames: {
    childFileName: string;
    parentFileName: string;
  };

  try {
    uploadedAssetFileNames = await uploadTaskAssetPair({
      category: parsed.data.category,
      childAssetFile,
      parentAssetFile,
      taskName: canonicalTaskName,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown upload failure";
    console.error("uploadTaskAssetAction: uploadTaskAssetPair failed", {
      category: parsed.data.category,
      childAssetFile: { name: childAssetFile.name, size: childAssetFile.size, type: childAssetFile.type },
      message,
      parentAssetFile: { name: parentAssetFile.name, size: parentAssetFile.size, type: parentAssetFile.type },
      taskName: canonicalTaskName,
    });
    redirect(
      `/superadmin/tasks?status=task-asset-upload-failed&details=${encodeURIComponent(message)}`,
    );
  }

  await writeSuperAdminAuditLog({
    action: replaceExisting ? "task_asset_replaced" : "task_asset_uploaded",
    actorUserId: user.id,
    metadata: {
      category: parsed.data.category,
      childFileName: uploadedAssetFileNames.childFileName,
      originalChildFileName: childAssetFile.name,
      originalParentFileName: parentAssetFile.name,
      parentFileName: uploadedAssetFileNames.parentFileName,
      taskName: canonicalTaskName,
    },
    targetId: `${parsed.data.category}:${canonicalTaskName}`,
    targetType: "task_assets",
  });

  revalidateParentWorkspace();
  revalidateChildWorkspace();
  revalidateSuperAdminWorkspace();
  redirect(
    `/superadmin/tasks?status=${
      replaceExisting ? "task-asset-replaced" : "task-asset-uploaded"
    }&taskName=${encodeURIComponent(canonicalTaskName)}`,
  );
}

export async function assignInventoryToFamilyAction(formData: FormData) {
  const parsed = assignInventorySchema.safeParse({
    familyId: formData.get("familyId"),
    inventoryId: formData.get("inventoryId"),
    returnTo: formData.get("returnTo"),
  });

  if (!parsed.success) {
    redirect("/superadmin/boopers?status=action-failed");
  }

  const returnTo = parsed.data.returnTo ?? "/superadmin/boopers";
  const redirectBase =
    returnTo === "/superadmin/families"
      ? `/superadmin/families?familyId=${parsed.data.familyId}`
      : returnTo;
  const { requireSuperAdmin, writeSuperAdminAuditLog } = await getSuperAdminHelpers();
  const { admin, user } = await requireSuperAdmin();

  const [{ data: inventory }, { data: family }] = await Promise.all([
    admin
      .from("booper_inventory")
      .select("*")
      .eq("id", parsed.data.inventoryId)
      .single(),
    admin
      .from("families")
      .select("id, family_name")
      .eq("id", parsed.data.familyId)
      .single(),
  ]);

  if (!inventory || !family) {
    redirect(`${redirectBase}${redirectBase.includes("?") ? "&" : "?"}status=action-failed`);
  }

  if (inventory.status === "retired") {
    redirect(`${redirectBase}${redirectBase.includes("?") ? "&" : "?"}status=booper-conflict`);
  }

  const nextStatus = inventory.status === "available" ? "assigned" : inventory.status;

  const updateInventory = await admin
    .from("booper_inventory")
    .update({
      assigned_at: new Date().toISOString(),
      family_id: family.id,
      status: nextStatus,
    })
    .eq("id", inventory.id);

  if (updateInventory.error) {
    redirect(`${redirectBase}${redirectBase.includes("?") ? "&" : "?"}status=action-failed`);
  }

  const syncResult = await syncInventoryWithParentBooper({
    admin,
    batchNumber: inventory.batch_number,
    childProfileId: inventory.child_profile_id,
    familyId: family.id,
    status: nextStatus,
    uid: inventory.uid,
  });

  if (syncResult.error) {
    redirect(`${redirectBase}${redirectBase.includes("?") ? "&" : "?"}status=booper-conflict`);
  }

  await writeSuperAdminAuditLog({
    action: "booper_reassigned",
    actorUserId: user.id,
    metadata: {
      familyId: family.id,
      familyName: family.family_name,
      previousFamilyId: inventory.family_id,
      uid: inventory.uid,
    },
    targetId: inventory.id,
    targetType: "booper_inventory",
  });

  revalidateSuperAdminWorkspace();
  revalidateParentWorkspace();
  redirect(`${redirectBase}${redirectBase.includes("?") ? "&" : "?"}status=booper-reassigned`);
}

export async function releaseInventoryFromFamilyAction(formData: FormData) {
  const parsed = unassignInventorySchema.safeParse({
    inventoryId: formData.get("inventoryId"),
    returnTo: formData.get("returnTo"),
  });

  if (!parsed.success) {
    redirect("/superadmin/boopers?status=action-failed");
  }

  const returnTo = parsed.data.returnTo ?? "/superadmin/boopers";
  const { requireSuperAdmin, writeSuperAdminAuditLog } = await getSuperAdminHelpers();
  const { admin, user } = await requireSuperAdmin();

  const { data: inventory } = await admin
    .from("booper_inventory")
    .select("*")
    .eq("id", parsed.data.inventoryId)
    .single();

  if (!inventory) {
    redirect(`${returnTo}?status=action-failed`);
  }

  const redirectBase =
    returnTo === "/superadmin/families" && inventory.family_id
      ? `/superadmin/families?familyId=${inventory.family_id}`
      : returnTo;

  const updateInventory = await admin
    .from("booper_inventory")
    .update({
      assigned_at: null,
      child_profile_id: null,
      family_id: null,
      status: inventory.status === "retired" ? "retired" : "available",
    })
    .eq("id", inventory.id);

  if (updateInventory.error) {
    redirect(`${redirectBase}${redirectBase.includes("?") ? "&" : "?"}status=action-failed`);
  }

  const syncResult = await syncInventoryWithParentBooper({
    admin,
    batchNumber: inventory.batch_number,
    childProfileId: null,
    familyId: null,
    status: inventory.status === "retired" ? "retired" : "available",
    uid: inventory.uid,
  });

  if (syncResult.error) {
    redirect(`${redirectBase}${redirectBase.includes("?") ? "&" : "?"}status=action-failed`);
  }

  await writeSuperAdminAuditLog({
    action: "booper_released",
    actorUserId: user.id,
    metadata: {
      previousFamilyId: inventory.family_id,
      uid: inventory.uid,
    },
    targetId: inventory.id,
    targetType: "booper_inventory",
  });

  revalidateSuperAdminWorkspace();
  revalidateParentWorkspace();
  redirect(`${redirectBase}${redirectBase.includes("?") ? "&" : "?"}status=booper-released`);
}

export async function updateInventoryStatusAction(formData: FormData) {
  const parsed = updateInventoryStatusSchema.safeParse({
    inventoryId: formData.get("inventoryId"),
    returnTo: formData.get("returnTo"),
    status: formData.get("status"),
  });

  if (!parsed.success) {
    redirect("/superadmin/boopers?status=action-failed");
  }

  const { requireSuperAdmin, writeSuperAdminAuditLog } = await getSuperAdminHelpers();
  const { admin, user } = await requireSuperAdmin();

  const { data: inventory } = await admin
    .from("booper_inventory")
    .select("*")
    .eq("id", parsed.data.inventoryId)
    .single();

  if (!inventory) {
    redirect(`${parsed.data.returnTo}?status=action-failed`);
  }

  const redirectBase =
    parsed.data.returnTo === "/superadmin/families" && inventory.family_id
      ? `/superadmin/families?familyId=${inventory.family_id}`
      : parsed.data.returnTo;

  if (parsed.data.status === "assigned" && !inventory.family_id) {
    redirect(`${redirectBase}${redirectBase.includes("?") ? "&" : "?"}status=action-failed`);
  }

  const { error } = await admin
    .from("booper_inventory")
    .update({
      status: parsed.data.status,
    })
    .eq("id", inventory.id);

  if (error) {
    redirect(`${redirectBase}${redirectBase.includes("?") ? "&" : "?"}status=action-failed`);
  }

  const syncResult = await syncInventoryWithParentBooper({
    admin,
    batchNumber: inventory.batch_number,
    childProfileId: inventory.child_profile_id,
    familyId: inventory.family_id,
    status: parsed.data.status,
    uid: inventory.uid,
  });

  if (syncResult.error) {
    redirect(`${redirectBase}${redirectBase.includes("?") ? "&" : "?"}status=action-failed`);
  }

  const statusAction =
    parsed.data.status === "disabled"
      ? "booper_disabled"
      : parsed.data.status === "lost"
        ? "booper_lost"
        : "booper_status_updated";

  await writeSuperAdminAuditLog({
    action: statusAction,
    actorUserId: user.id,
    metadata: {
      familyId: inventory.family_id,
      status: parsed.data.status,
      uid: inventory.uid,
    },
    targetId: inventory.id,
    targetType: "booper_inventory",
  });

  revalidateSuperAdminWorkspace();
  revalidateParentWorkspace();

  const statusCode =
    parsed.data.status === "disabled"
      ? "booper-disabled"
      : parsed.data.status === "lost"
        ? "booper-lost"
        : "booper-status-updated";

  redirect(`${redirectBase}${redirectBase.includes("?") ? "&" : "?"}status=${statusCode}`);
}

export async function viewSuperAdminFamilyAction(formData: FormData) {
  const parsed = viewSuperAdminFamilySchema.safeParse({
    familyId: formData.get("familyId"),
  });

  if (!parsed.success) {
    redirect("/superadmin/families?status=action-failed");
  }

  const { requireSuperAdmin, writeSuperAdminAuditLog } = await getSuperAdminHelpers();
  const { admin, user } = await requireSuperAdmin();

  const { data: family } = await admin
    .from("families")
    .select("id, family_name")
    .eq("id", parsed.data.familyId)
    .single();

  if (!family) {
    redirect("/superadmin/families?status=action-failed");
  }

  await writeSuperAdminAuditLog({
    action: "family_viewed",
    actorUserId: user.id,
    metadata: {
      familyId: family.id,
      familyName: family.family_name,
    },
    targetId: family.id,
    targetType: "families",
  });

  redirect(`/superadmin/families?familyId=${family.id}&status=family-viewed`);
}

export async function upsertFamilySubscriptionAction(formData: FormData) {
  const parsed = familySubscriptionSchema.safeParse({
    familyId: formData.get("familyId"),
    subscriptionPlan: formData.get("subscriptionPlan"),
    subscriptionStatus: formData.get("subscriptionStatus"),
    subscriptionCurrentPeriodEnd: formData.get("subscriptionCurrentPeriodEnd"),
    subscriptionProvider: formData.get("subscriptionProvider"),
    stripeCustomerId: formData.get("stripeCustomerId"),
    stripeSubscriptionId: formData.get("stripeSubscriptionId"),
    booperPackIncluded: formData.get("booperPackIncluded"),
    booperPackStatus: formData.get("booperPackStatus"),
  });

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    const firstError = Object.values(fieldErrors)
      .flat()
      .find((message): message is string => Boolean(message));

    redirect(
      buildSuperAdminFamiliesFailurePath(firstError ?? "The submitted subscription details were invalid."),
    );
  }

  try {
    const { requireSuperAdmin, writeSuperAdminAuditLog } = await getSuperAdminHelpers();
    const { admin, user } = await requireSuperAdmin();

    const subscriptionCurrentPeriodEnd = parseSubscriptionDateInput(
      parsed.data.subscriptionCurrentPeriodEnd,
    );
    const normalizedSubscriptionStatus: "trial" | "active" | "past_due" | "cancelled" =
      parsed.data.subscriptionStatus === "trialing"
        ? "trial"
        : parsed.data.subscriptionStatus === "active"
          ? "active"
          : parsed.data.subscriptionStatus === "past_due" ||
              parsed.data.subscriptionStatus === "unpaid" ||
              parsed.data.subscriptionStatus === "incomplete" ||
              parsed.data.subscriptionStatus === "paused"
            ? "past_due"
            : "cancelled";

    const subscriptionPatch = {
      family_id: parsed.data.familyId,
      plan_code: parsed.data.subscriptionPlan,
      provider_customer_id: parsed.data.stripeCustomerId || null,
      provider_subscription_id: parsed.data.stripeSubscriptionId || null,
      renewal_date: subscriptionCurrentPeriodEnd,
      status: normalizedSubscriptionStatus,
      subscription_current_period_end: subscriptionCurrentPeriodEnd,
      subscription_plan: parsed.data.subscriptionPlan,
      subscription_provider: parsed.data.subscriptionProvider ?? "manual",
      subscription_status: parsed.data.subscriptionStatus,
      stripe_customer_id: parsed.data.stripeCustomerId || null,
      stripe_subscription_id: parsed.data.stripeSubscriptionId || null,
      booper_pack_included: parsed.data.booperPackIncluded === "true",
      booper_pack_status: parsed.data.booperPackStatus ?? null,
    };

    const { error } = await admin
      .from("family_subscriptions")
      .upsert(subscriptionPatch, { onConflict: "family_id" });

    if (error) {
      console.error("Superadmin subscription save failed", {
        error,
        familyId: parsed.data.familyId,
        patch: subscriptionPatch,
      });
      redirect(buildSuperAdminFamiliesFailurePath(formatSupabaseActionError(error)));
    }

    await writeSuperAdminAuditLog({
      action: "subscription_changed",
      actorUserId: user.id,
      metadata: {
        booperPackIncluded: parsed.data.booperPackIncluded === "true",
        booperPackStatus: parsed.data.booperPackStatus ?? null,
        familyId: parsed.data.familyId,
        planCode: parsed.data.subscriptionPlan,
        provider: parsed.data.subscriptionProvider ?? "manual",
        renewalDate: subscriptionCurrentPeriodEnd,
        status: parsed.data.subscriptionStatus,
      },
      targetId: parsed.data.familyId,
      targetType: "family_subscriptions",
    });

    revalidateSuperAdminWorkspace();
    redirect(`/superadmin/families?familyId=${parsed.data.familyId}&status=subscription-saved`);
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }

    console.error("Superadmin subscription save threw", {
      error,
      familyId: parsed.data.familyId,
      submitted: parsed.data,
    });
    const message = error instanceof Error ? error.message : "Unknown subscription save failure";
    redirect(buildSuperAdminFamiliesFailurePath(message));
  }
}
