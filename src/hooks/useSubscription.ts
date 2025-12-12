import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PlanLimits {
  patients: number;
  visits: number;
  appointments: number;
  knowledgeEntries: number;
  documentStorageMB: number;
  aiText: number;
  aiSpeech: number;
}

export const FREE_PLAN_LIMITS: PlanLimits = {
  patients: 50,
  visits: 100,
  appointments: 100,
  knowledgeEntries: 10,
  documentStorageMB: 50,
  aiText: 50,
  aiSpeech: 0,
};

export const PRO_PLAN_LIMITS: PlanLimits = {
  patients: Infinity,
  visits: Infinity,
  appointments: Infinity,
  knowledgeEntries: 100,
  documentStorageMB: 500,
  aiText: 500,
  aiSpeech: 100,
};

export interface Subscription {
  id: string;
  user_id: string;
  plan_type: "free" | "pro";
  status: "active" | "cancelled" | "expired";
  started_at: string;
  expires_at: string | null;
}

export interface UsageStats {
  patients: number;
  visits: number;
  appointments: number;
  knowledgeEntries: number;
  documentStorageMB: number;
  aiText: number;
  aiSpeech: number;
}

export function useSubscription() {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    getUser();
  }, []);

  const { data: subscription, isLoading: subscriptionLoading, refetch: refetchSubscription } = useQuery({
    queryKey: ["subscription", userId],
    queryFn: async () => {
      if (!userId) return null;
      
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
      
      if (error) throw error;
      
      // If no subscription exists, create a free one
      if (!data) {
        const { data: newSub, error: insertError } = await supabase
          .from("subscriptions")
          .insert({ user_id: userId, plan_type: "free", status: "active" })
          .select()
          .single();
        
        if (insertError) throw insertError;
        return newSub as Subscription;
      }
      
      return data as Subscription;
    },
    enabled: !!userId,
  });

  const { data: usage, isLoading: usageLoading, refetch: refetchUsage } = useQuery({
    queryKey: ["usage-stats", userId],
    queryFn: async () => {
      if (!userId) return null;

      // Get counts from various tables
      const [patientsRes, visitsRes, appointmentsRes, knowledgeRes, documentsRes, aiUsageRes] = await Promise.all([
        supabase.from("patients").select("id", { count: "exact", head: true }).eq("user_id", userId),
        supabase.from("visits").select("id", { count: "exact", head: true }).eq("user_id", userId),
        supabase.from("appointments").select("id", { count: "exact", head: true }).eq("user_id", userId),
        supabase.from("knowledge_articles").select("id", { count: "exact", head: true }).eq("user_id", userId),
        supabase.from("documents").select("file_size").eq("user_id", userId),
        supabase.from("ai_usage").select("*").eq("user_id", userId).gte("period_start", new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]).maybeSingle(),
      ]);

      // Calculate total document storage in MB
      const totalStorageBytes = documentsRes.data?.reduce((sum, doc) => sum + (doc.file_size || 0), 0) || 0;
      const totalStorageMB = totalStorageBytes / (1024 * 1024);

      return {
        patients: patientsRes.count || 0,
        visits: visitsRes.count || 0,
        appointments: appointmentsRes.count || 0,
        knowledgeEntries: knowledgeRes.count || 0,
        documentStorageMB: Math.round(totalStorageMB * 10) / 10,
        aiText: aiUsageRes.data?.ai_text_count || 0,
        aiSpeech: aiUsageRes.data?.ai_speech_count || 0,
      } as UsageStats;
    },
    enabled: !!userId,
  });

  const limits = subscription?.plan_type === "pro" ? PRO_PLAN_LIMITS : FREE_PLAN_LIMITS;

  return {
    subscription,
    usage,
    limits,
    isLoading: subscriptionLoading || usageLoading,
    isPro: subscription?.plan_type === "pro",
    refetch: () => {
      refetchSubscription();
      refetchUsage();
    },
  };
}
