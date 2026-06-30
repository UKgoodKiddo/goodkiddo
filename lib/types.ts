export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Family = {
  id: string;
  parent_user_id: string;
  family_name: string;
  parent_pin: string;
  created_at: string;
};

export type SuperAdminRole = "super_admin";

export type SuperAdminUser = {
  id: string;
  user_id: string;
  email: string;
  role: SuperAdminRole;
  active: boolean;
  created_at: string;
};

export type ChildProfile = {
  id: string;
  family_id: string;
  display_name: string;
  avatar_url: string | null;
  boop_balance: number;
  created_at: string;
};

export type BooperStatus = "active" | "lost" | "disabled";

export type BooperInventoryStatus =
  | "available"
  | "assigned"
  | "lost"
  | "disabled"
  | "retired";

export type Booper = {
  id: string;
  family_id: string;
  child_profile_id: string | null;
  nfc_uid: string;
  label: string;
  status: BooperStatus;
  created_at: string;
};

export type BooperInventory = {
  id: string;
  uid: string;
  serial_label: string;
  batch_number: string;
  ndef_url: string | null;
  ndef_text: string | null;
  status: BooperInventoryStatus;
  family_id: string | null;
  child_profile_id: string | null;
  imported_by: string | null;
  imported_at: string;
  assigned_at: string | null;
  notes: string | null;
};

export type BoopTransaction = {
  id: string;
  family_id: string;
  child_profile_id: string;
  amount: number;
  reason: string;
  created_by: string;
  created_at: string;
};

export type PendingBoopAwardSource =
  | "manual"
  | "task_approval"
  | "nfc_award"
  | "daily_bonus";

export type PendingBoopAward = {
  id: string;
  family_id: string;
  child_profile_id: string;
  amount: number;
  reason: string;
  awarded_by: string;
  source_type: PendingBoopAwardSource;
  created_at: string;
  claimed_at: string | null;
  claimed_booper_uid: string | null;
};

export type ChildDailyCheckIn = {
  id: string;
  family_id: string;
  child_profile_id: string;
  checkin_date: string;
  created_at: string;
};

export type ChildDailyBonusMilestone = "five_of_seven" | "seven_of_seven";

export type ChildDailyBonusAward = {
  id: string;
  family_id: string;
  child_profile_id: string;
  week_start: string;
  milestone_type: ChildDailyBonusMilestone;
  awarded_amount: number;
  created_at: string;
};

export type ChildCheckInDay = {
  label: string;
  date: string;
  checkedIn: boolean;
};

export type TaskRecurringType = "none" | "daily" | "weekly";

export type Task = {
  id: string;
  family_id: string;
  child_profile_id: string | null;
  title: string;
  description: string | null;
  boop_reward: number;
  recurring_type: TaskRecurringType;
  active: boolean;
  created_at: string;
};

export type TaskCompletionStatus = "pending" | "approved" | "rejected";

export type TaskCompletion = {
  id: string;
  task_id: string;
  child_profile_id: string;
  status: TaskCompletionStatus;
  submitted_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
};

export type Reward = {
  id: string;
  family_id: string;
  title: string;
  cost: number;
  description: string | null;
  active: boolean;
  created_at: string;
};

export type RedemptionStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "completed";

export type SubscriptionStatus =
  | "trial"
  | "active"
  | "past_due"
  | "cancelled";

export type Redemption = {
  id: string;
  family_id: string;
  child_profile_id: string;
  reward_id: string;
  cost_at_redemption: number;
  status: RedemptionStatus;
  created_at: string;
};

export type FamilySubscription = {
  id: string;
  family_id: string;
  plan_code: string;
  status: SubscriptionStatus;
  renewal_date: string | null;
  provider_customer_id: string | null;
  provider_subscription_id: string | null;
  created_at: string;
  updated_at: string;
};

export type AuditLog = {
  id: string;
  actor_user_id: string;
  action: string;
  target_type: string;
  target_id: string | null;
  metadata: Json;
  created_at: string;
};

export type DeviceChildMode = {
  id: string;
  family_id: string;
  child_profile_id: string;
  device_label: string | null;
  created_at: string;
};

export type BoopTransactionView = BoopTransaction & {
  childName: string | null;
};

export type PendingBoopAwardView = PendingBoopAward & {
  childName: string | null;
};

export type TaskCompletionView = TaskCompletion & {
  boopReward: number;
  childName: string | null;
  recurringType: TaskRecurringType;
  taskTitle: string | null;
};

export type ChildTaskStatus = "ready" | TaskCompletionStatus;

export type ChildTaskView = Task & {
  canMarkComplete: boolean;
  currentStatus: ChildTaskStatus;
  lastSubmittedAt: string | null;
  reviewedAt: string | null;
};

export type RedemptionView = Redemption & {
  childName: string | null;
  rewardTitle: string | null;
};

export type ParentDashboardData = {
  family: Family | null;
  userEmail: string | null;
  children: ChildProfile[];
  boopers: Booper[];
  tasks: Task[];
  taskCompletions: TaskCompletion[];
  pendingTaskCompletions: TaskCompletionView[];
  transactions: BoopTransactionView[];
  rewards: Reward[];
  redemptions: RedemptionView[];
  pendingBoopAwards: PendingBoopAwardView[];
  pendingBoopTotal: number;
  deviceModes: DeviceChildMode[];
  requiresAuth: boolean;
  usingDemoMode: boolean;
  childModeReady: boolean;
};

export type SuperAdminFamilySummary = {
  familyId: string;
  familyName: string;
  parentEmail: string | null;
  parentUserId: string;
  createdAt: string;
  assignedInventoryCount: number;
  booperCount: number;
  subscription: FamilySubscription | null;
};

export type SuperAdminUserView = SuperAdminUser & {
  authEmail: string | null;
};

export type AuditLogView = AuditLog & {
  actorEmail: string | null;
};

export type SuperAdminDashboardData = {
  families: SuperAdminFamilySummary[];
  inventory: BooperInventory[];
  subscriptions: FamilySubscription[];
  superAdminUsers: SuperAdminUserView[];
  auditLogs: AuditLogView[];
  totalFamilies: number;
  totalAssignedInventory: number;
  totalInventory: number;
  totalSubscriptionsActive: number;
  viewerEmail: string | null;
};

export type ChildModeData = {
  assigned: boolean;
  child: ChildProfile | null;
  tasks: ChildTaskView[];
  rewards: Reward[];
  redemptions: RedemptionView[];
  recentTransactions: BoopTransactionView[];
  pendingBoopAwards: PendingBoopAward[];
  pendingBoopTotal: number;
  dailyCheckInWeek: ChildCheckInDay[];
  deviceLabel: string | null;
  familyName: string | null;
  setupMessage: string | null;
  usingDemoMode: boolean;
};

export type ActionState = {
  status: "idle" | "error" | "success";
  message: string;
};

export type Database = {
  public: {
    Tables: {
      families: {
        Row: Family;
        Insert: {
          id?: string;
          parent_user_id: string;
          family_name: string;
          parent_pin?: string;
          created_at?: string;
        };
        Update: Partial<Family>;
        Relationships: [];
      };
      super_admin_users: {
        Row: SuperAdminUser;
        Insert: {
          id?: string;
          user_id: string;
          email: string;
          role?: SuperAdminRole;
          active?: boolean;
          created_at?: string;
        };
        Update: Partial<SuperAdminUser>;
        Relationships: [];
      };
      child_profiles: {
        Row: ChildProfile;
        Insert: {
          id?: string;
          family_id: string;
          display_name: string;
          avatar_url?: string | null;
          boop_balance?: number;
          created_at?: string;
        };
        Update: Partial<ChildProfile>;
        Relationships: [];
      };
      booper_inventory: {
        Row: BooperInventory;
        Insert: {
          id?: string;
          uid: string;
          serial_label: string;
          batch_number: string;
          ndef_url?: string | null;
          ndef_text?: string | null;
          status?: BooperInventoryStatus;
          family_id?: string | null;
          child_profile_id?: string | null;
          imported_by?: string | null;
          imported_at?: string;
          assigned_at?: string | null;
          notes?: string | null;
        };
        Update: Partial<BooperInventory>;
        Relationships: [];
      };
      boopers: {
        Row: Booper;
        Insert: {
          id?: string;
          family_id: string;
          child_profile_id?: string | null;
          nfc_uid: string;
          label: string;
          status?: BooperStatus;
          created_at?: string;
        };
        Update: Partial<Booper>;
        Relationships: [];
      };
      boop_transactions: {
        Row: BoopTransaction;
        Insert: {
          id?: string;
          family_id: string;
          child_profile_id: string;
          amount: number;
          reason: string;
          created_by: string;
          created_at?: string;
        };
        Update: Partial<BoopTransaction>;
        Relationships: [];
      };
      pending_boop_awards: {
        Row: PendingBoopAward;
        Insert: {
          id?: string;
          family_id: string;
          child_profile_id: string;
          amount: number;
          reason: string;
          awarded_by: string;
          source_type?: PendingBoopAwardSource;
          created_at?: string;
          claimed_at?: string | null;
          claimed_booper_uid?: string | null;
        };
        Update: Partial<PendingBoopAward>;
        Relationships: [];
      };
      child_daily_checkins: {
        Row: ChildDailyCheckIn;
        Insert: {
          id?: string;
          family_id: string;
          child_profile_id: string;
          checkin_date: string;
          created_at?: string;
        };
        Update: Partial<ChildDailyCheckIn>;
        Relationships: [];
      };
      child_daily_bonus_awards: {
        Row: ChildDailyBonusAward;
        Insert: {
          id?: string;
          family_id: string;
          child_profile_id: string;
          week_start: string;
          milestone_type: ChildDailyBonusMilestone;
          awarded_amount: number;
          created_at?: string;
        };
        Update: Partial<ChildDailyBonusAward>;
        Relationships: [];
      };
      tasks: {
        Row: Task;
        Insert: {
          id?: string;
          family_id: string;
          child_profile_id?: string | null;
          title: string;
          description?: string | null;
          boop_reward: number;
          recurring_type?: TaskRecurringType;
          active?: boolean;
          created_at?: string;
        };
        Update: Partial<Task>;
        Relationships: [];
      };
      task_completions: {
        Row: TaskCompletion;
        Insert: {
          id?: string;
          task_id: string;
          child_profile_id: string;
          status?: TaskCompletionStatus;
          submitted_at?: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
        };
        Update: Partial<TaskCompletion>;
        Relationships: [];
      };
      rewards: {
        Row: Reward;
        Insert: {
          id?: string;
          family_id: string;
          title: string;
          cost: number;
          description?: string | null;
          active?: boolean;
          created_at?: string;
        };
        Update: Partial<Reward>;
        Relationships: [];
      };
      redemptions: {
        Row: Redemption;
        Insert: {
          id?: string;
          family_id: string;
          child_profile_id: string;
          reward_id: string;
          cost_at_redemption: number;
          status?: RedemptionStatus;
          created_at?: string;
        };
        Update: Partial<Redemption>;
        Relationships: [];
      };
      family_subscriptions: {
        Row: FamilySubscription;
        Insert: {
          id?: string;
          family_id: string;
          plan_code: string;
          status?: SubscriptionStatus;
          renewal_date?: string | null;
          provider_customer_id?: string | null;
          provider_subscription_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<FamilySubscription>;
        Relationships: [];
      };
      audit_logs: {
        Row: AuditLog;
        Insert: {
          id?: string;
          actor_user_id: string;
          action: string;
          target_type: string;
          target_id?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: Partial<AuditLog>;
        Relationships: [];
      };
      device_child_mode: {
        Row: DeviceChildMode;
        Insert: {
          id?: string;
          family_id: string;
          child_profile_id: string;
          device_label?: string | null;
          created_at?: string;
        };
        Update: Partial<DeviceChildMode>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      approve_redemption: {
        Args: {
          target_redemption_id: string;
        };
        Returns: void;
      };
      claim_pending_boop_awards: {
        Args: {
          target_booper_uid: string;
          target_child_profile_id: string;
          target_family_id: string;
        };
        Returns: {
          claimed_count: number;
          claimed_total: number;
        }[];
      };
      approve_task_completion: {
        Args: {
          target_completion_id: string;
        };
        Returns: void;
      };
      reject_redemption: {
        Args: {
          target_redemption_id: string;
        };
        Returns: void;
      };
      reject_task_completion: {
        Args: {
          target_completion_id: string;
        };
        Returns: void;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
