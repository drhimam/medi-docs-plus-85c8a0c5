import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type ActionType = "create" | "update" | "delete" | "view" | "export" | "login";
export type EntityType = "patient" | "visit" | "appointment" | "document" | "prescription" | "session";

export interface ActivityLogEntry {
  id: string;
  owner_id: string;
  sub_user_id: string;
  action_type: ActionType;
  entity_type: EntityType;
  entity_id: string | null;
  entity_name: string | null;
  details: string | null;
  created_at: string;
}

export function useActivityLog() {
  const logActivity = useCallback(async (
    ownerId: string,
    actionType: ActionType,
    entityType: EntityType,
    entityId?: string,
    entityName?: string,
    details?: string
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from("sub_user_activity_log")
        .insert({
          owner_id: ownerId,
          sub_user_id: user.id,
          action_type: actionType,
          entity_type: entityType,
          entity_id: entityId || null,
          entity_name: entityName || null,
          details: details || null,
        });
    } catch (error) {
      console.error("Error logging activity:", error);
    }
  }, []);

  const fetchActivityLogs = useCallback(async (limit = 50): Promise<ActivityLogEntry[]> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("sub_user_activity_log")
        .select("*")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as ActivityLogEntry[];
    } catch (error) {
      console.error("Error fetching activity logs:", error);
      return [];
    }
  }, []);

  return {
    logActivity,
    fetchActivityLogs,
  };
}
