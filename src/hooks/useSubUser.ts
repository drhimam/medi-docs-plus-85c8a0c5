import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface SubUserPermissions {
  can_access_patients: boolean;
  can_access_appointments: boolean;
  can_access_clinical_docs: boolean;
  can_access_knowledge_base: boolean;
  can_access_ai_tools: boolean;
  can_access_settings: boolean;
  can_create_patients: boolean;
  can_edit_patients: boolean;
  can_delete_patients: boolean;
  can_create_visits: boolean;
  can_edit_visits: boolean;
  can_delete_visits: boolean;
  can_create_appointments: boolean;
  can_edit_appointments: boolean;
  can_delete_appointments: boolean;
  can_export: boolean;
}

export interface SubUser {
  id: string;
  owner_id: string;
  sub_user_id: string | null;
  email: string;
  status: "pending" | "active" | "revoked";
  invite_token: string | null;
  invite_expires_at: string | null;
  created_at: string;
  permissions?: SubUserPermissions;
}

const DEFAULT_PERMISSIONS: SubUserPermissions = {
  can_access_patients: true,
  can_access_appointments: true,
  can_access_clinical_docs: false,
  can_access_knowledge_base: false,
  can_access_ai_tools: false,
  can_access_settings: false,
  can_create_patients: false,
  can_edit_patients: false,
  can_delete_patients: false,
  can_create_visits: false,
  can_edit_visits: false,
  can_delete_visits: false,
  can_create_appointments: true,
  can_edit_appointments: true,
  can_delete_appointments: false,
  can_export: false,
};

export function useSubUser() {
  const [isSubUser, setIsSubUser] = useState(false);
  const [isOwner, setIsOwner] = useState(true);
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<SubUserPermissions | null>(null);
  const [loading, setLoading] = useState(true);
  const [subUsers, setSubUsers] = useState<SubUser[]>([]);
  const [role, setRole] = useState<"owner" | "sub_user" | null>(null);

  const fetchSubUserStatus = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Check if current user is a sub-user
      const { data: subUserData } = await supabase
        .from("sub_users")
        .select(`
          *,
          sub_user_permissions (*)
        `)
        .eq("sub_user_id", user.id)
        .eq("status", "active")
        .maybeSingle();

      const { data: roleRows } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
      const roles = (roleRows || []).map((r: any) => r.role);
      setRole(roles.includes("sub_user") ? "sub_user" : roles.includes("owner") ? "owner" : null);

      if (subUserData) {
        setIsSubUser(true);
        setIsOwner(false);
        setOwnerId(subUserData.owner_id);
        
        const perms = subUserData.sub_user_permissions?.[0];
        if (perms) {
          setPermissions({
            can_access_patients: perms.can_access_patients,
            can_access_appointments: perms.can_access_appointments,
            can_access_clinical_docs: perms.can_access_clinical_docs,
            can_access_knowledge_base: perms.can_access_knowledge_base,
            can_access_ai_tools: perms.can_access_ai_tools,
            can_access_settings: perms.can_access_settings,
            can_create_patients: perms.can_create_patients,
            can_edit_patients: perms.can_edit_patients,
            can_delete_patients: perms.can_delete_patients,
            can_create_visits: perms.can_create_visits,
            can_edit_visits: perms.can_edit_visits,
            can_delete_visits: perms.can_delete_visits,
            can_create_appointments: perms.can_create_appointments,
            can_edit_appointments: perms.can_edit_appointments,
            can_delete_appointments: perms.can_delete_appointments,
            can_export: perms.can_export,
          });
        }
      } else {
        setIsSubUser(false);
        setIsOwner(true);
        setOwnerId(null);
        setPermissions(null);
      }
    } catch (error) {
      console.error("Error fetching sub-user status:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMySubUsers = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("sub_users")
        .select(`
          *,
          sub_user_permissions (*)
        `)
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const formattedSubUsers: SubUser[] = (data || []).map((su: any) => ({
        id: su.id,
        owner_id: su.owner_id,
        sub_user_id: su.sub_user_id,
        email: su.email,
        status: su.status,
        invite_token: su.invite_token,
        invite_expires_at: su.invite_expires_at,
        created_at: su.created_at,
        permissions: su.sub_user_permissions?.[0] || DEFAULT_PERMISSIONS,
      }));

      setSubUsers(formattedSubUsers);
    } catch (error) {
      console.error("Error fetching sub-users:", error);
    }
  }, []);

  const canAccess = useCallback((page: string): boolean => {
    if (!isSubUser || !permissions) return true;

    switch (page) {
      case "patients":
        return permissions.can_access_patients;
      case "appointments":
        return permissions.can_access_appointments;
      case "clinical-docs":
        return permissions.can_access_clinical_docs;
      case "knowledge":
        return permissions.can_access_knowledge_base;
      case "ai-tools":
        return permissions.can_access_ai_tools;
      case "settings":
        return permissions.can_access_settings;
      default:
        return true;
    }
  }, [isSubUser, permissions]);

  const canPerformAction = useCallback((action: string): boolean => {
    if (!isSubUser || !permissions) return true;

    switch (action) {
      case "create-patient":
        return permissions.can_create_patients;
      case "edit-patient":
        return permissions.can_edit_patients;
      case "delete-patient":
        return permissions.can_delete_patients;
      case "create-visit":
        return permissions.can_create_visits;
      case "edit-visit":
        return permissions.can_edit_visits;
      case "delete-visit":
        return permissions.can_delete_visits;
      case "create-appointment":
        return permissions.can_create_appointments;
      case "edit-appointment":
        return permissions.can_edit_appointments;
      case "delete-appointment":
        return permissions.can_delete_appointments;
      case "export":
        return permissions.can_export;
      default:
        return true;
    }
  }, [isSubUser, permissions]);

  useEffect(() => {
    fetchSubUserStatus();
  }, [fetchSubUserStatus]);

  // Helper to get owner_id for activity logging (returns current user id if owner, or ownerId if sub-user)
  const getOwnerIdForLogging = useCallback(async (): Promise<string | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    return ownerId || user.id;
  }, [ownerId]);

  return {
    isSubUser,
    isOwner,
    role,
    ownerId,
    permissions,
    loading,
    subUsers,
    canAccess,
    canPerformAction,
    fetchMySubUsers,
    refetch: fetchSubUserStatus,
    getOwnerIdForLogging,
    DEFAULT_PERMISSIONS,
  };
}
