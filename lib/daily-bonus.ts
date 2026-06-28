import type { SupabaseClient } from "@supabase/supabase-js";
import type { ChildCheckInDay, Database } from "@/lib/types";

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

function parseIsoDate(dateString: string) {
  const [year, month, day] = dateString.split("-").map(Number);

  return new Date(Date.UTC(year, month - 1, day));
}

function formatIsoDate(date: Date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function getServerLocalDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function getWeekStartForDate(dateString: string) {
  const date = parseIsoDate(dateString);
  const dayIndex = date.getUTCDay();
  const mondayOffset = dayIndex === 0 ? -6 : 1 - dayIndex;

  date.setUTCDate(date.getUTCDate() + mondayOffset);

  return formatIsoDate(date);
}

export function getWeekDates(weekStart: string) {
  const start = parseIsoDate(weekStart);

  return DAY_LABELS.map((_, index) => {
    const day = new Date(start);
    day.setUTCDate(start.getUTCDate() + index);

    return formatIsoDate(day);
  });
}

export function buildChildCheckInWeek(checkInDates: string[], referenceDate: string) {
  const weekStart = getWeekStartForDate(referenceDate);
  const weekDates = getWeekDates(weekStart);
  const checkInSet = new Set(checkInDates);

  return weekDates.map((date, index) => ({
    checkedIn: checkInSet.has(date),
    date,
    label: DAY_LABELS[index],
  })) satisfies ChildCheckInDay[];
}

export function countCheckedInDays(week: ChildCheckInDay[]) {
  return week.filter((day) => day.checkedIn).length;
}

export async function recordDailyChildCheckIn(params: {
  admin: SupabaseClient<Database>;
  childProfileId: string;
  familyId: string;
  localDate: string;
  actorUserId: string;
}) {
  const { admin, actorUserId, childProfileId, familyId, localDate } = params;
  const weekStart = getWeekStartForDate(localDate);
  const weekDates = getWeekDates(weekStart);
  const weekEnd = weekDates[6];

  let createdCheckIn = false;

  const { error: insertError } = await admin.from("child_daily_checkins").insert({
    checkin_date: localDate,
    child_profile_id: childProfileId,
    family_id: familyId,
  });

  if (insertError) {
    if (insertError.code !== "23505") {
      throw insertError;
    }
  } else {
    createdCheckIn = true;
  }

  const { data: checkInRows, error: checkInError } = await admin
    .from("child_daily_checkins")
    .select("checkin_date")
    .eq("family_id", familyId)
    .eq("child_profile_id", childProfileId)
    .gte("checkin_date", weekStart)
    .lte("checkin_date", weekEnd)
    .order("checkin_date");

  if (checkInError) {
    throw checkInError;
  }

  const checkedDates = (checkInRows ?? []).map((row: { checkin_date: string }) => row.checkin_date);
  const checkedWeek = buildChildCheckInWeek(checkedDates, localDate);
  const daysChecked = countCheckedInDays(checkedWeek);

  const { data: bonusRows, error: bonusError } = await admin
    .from("child_daily_bonus_awards")
    .select("milestone_type")
    .eq("family_id", familyId)
    .eq("child_profile_id", childProfileId)
    .eq("week_start", weekStart);

  if (bonusError) {
    throw bonusError;
  }

  const awardedMilestones = new Set(
    (bonusRows ?? []).map((row: { milestone_type: string }) => row.milestone_type),
  );

  let awardedAmount = 0;
  let awardedMilestone: "five_of_seven" | "seven_of_seven" | null = null;
  let awardReason = "";

  if (daysChecked === 7 && !awardedMilestones.has("seven_of_seven")) {
    awardedAmount = awardedMilestones.has("five_of_seven") ? 5 : 10;
    awardedMilestone = "seven_of_seven";
    awardReason = awardedMilestones.has("five_of_seven")
      ? "Daily bonus top-up: perfect 7-day week"
      : "Daily bonus: perfect 7-day week";
  } else if (daysChecked >= 5 && !awardedMilestones.has("five_of_seven")) {
    awardedAmount = 5;
    awardedMilestone = "five_of_seven";
    awardReason = "Daily bonus: 5 days this week";
  }

  if (awardedAmount > 0 && awardedMilestone) {
    const { error: pendingAwardError } = await admin.from("pending_boop_awards").insert({
      amount: awardedAmount,
      awarded_by: actorUserId,
      child_profile_id: childProfileId,
      family_id: familyId,
      reason: awardReason,
      source_type: "daily_bonus",
    });

    if (pendingAwardError) {
      throw pendingAwardError;
    }

    const { error: bonusInsertError } = await admin.from("child_daily_bonus_awards").insert({
      awarded_amount: awardedAmount,
      child_profile_id: childProfileId,
      family_id: familyId,
      milestone_type: awardedMilestone,
      week_start: weekStart,
    });

    if (bonusInsertError) {
      throw bonusInsertError;
    }
  }

  return {
    awardedAmount,
    checkedWeek,
    createdCheckIn,
    daysChecked,
    weekStart,
  };
}
