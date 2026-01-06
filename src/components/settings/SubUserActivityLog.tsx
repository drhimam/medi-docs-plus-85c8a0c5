import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Activity, User, Calendar, FileText, Stethoscope, Download, LogIn, RefreshCw, Loader2 } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { useActivityLog, ActivityLogEntry } from "@/hooks/useActivityLog";
import { useSubUser } from "@/hooks/useSubUser";

const actionIcons: Record<string, React.ReactNode> = {
  create: <span className="text-green-600">+</span>,
  update: <span className="text-blue-600">✎</span>,
  delete: <span className="text-red-600">×</span>,
  view: <span className="text-gray-600">👁</span>,
  export: <Download className="h-3 w-3 text-purple-600" />,
  login: <LogIn className="h-3 w-3 text-teal-600" />,
};

const entityIcons: Record<string, React.ReactNode> = {
  patient: <User className="h-4 w-4" />,
  visit: <Stethoscope className="h-4 w-4" />,
  appointment: <Calendar className="h-4 w-4" />,
  document: <FileText className="h-4 w-4" />,
  prescription: <FileText className="h-4 w-4" />,
  session: <LogIn className="h-4 w-4" />,
};

const getActionColor = (action: string) => {
  switch (action) {
    case "create": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    case "update": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    case "delete": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    case "view": return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
    case "export": return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
    case "login": return "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200";
    default: return "bg-muted text-muted-foreground";
  }
};

interface SubUserInfo {
  id: string;
  email: string;
  sub_user_id: string | null;
}

export const SubUserActivityLog = () => {
  const { fetchActivityLogs } = useActivityLog();
  const { subUsers, isSubUser } = useSubUser();
  const [logs, setLogs] = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterSubUser, setFilterSubUser] = useState<string>("all");
  const [filterAction, setFilterAction] = useState<string>("all");
  const [subUserMap, setSubUserMap] = useState<Record<string, SubUserInfo>>({});

  const loadLogs = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const data = await fetchActivityLogs(100);
      setLogs(data);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!isSubUser) {
      loadLogs();
    }
  }, [isSubUser]);

  useEffect(() => {
    // Build a map of sub_user_id to email
    const map: Record<string, SubUserInfo> = {};
    subUsers.forEach((su) => {
      if (su.sub_user_id) {
        map[su.sub_user_id] = { id: su.id, email: su.email, sub_user_id: su.sub_user_id };
      }
    });
    setSubUserMap(map);
  }, [subUsers]);

  const getSubUserEmail = (subUserId: string) => {
    return subUserMap[subUserId]?.email || subUserId.slice(0, 8) + "...";
  };

  const filteredLogs = logs.filter((log) => {
    if (filterSubUser !== "all" && log.sub_user_id !== filterSubUser) return false;
    if (filterAction !== "all" && log.action_type !== filterAction) return false;
    return true;
  });

  const activeSubUsers = subUsers.filter(su => su.sub_user_id);

  if (isSubUser) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Activity Log
            </CardTitle>
            <CardDescription>
              Track actions performed by team members
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => loadLogs(true)}
            disabled={refreshing}
          >
            {refreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex gap-2 flex-wrap">
          <Select value={filterSubUser} onValueChange={setFilterSubUser}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All team members" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All team members</SelectItem>
              {activeSubUsers.map((su) => (
                <SelectItem key={su.sub_user_id} value={su.sub_user_id!}>
                  {su.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterAction} onValueChange={setFilterAction}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="All actions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All actions</SelectItem>
              <SelectItem value="create">Create</SelectItem>
              <SelectItem value="update">Update</SelectItem>
              <SelectItem value="delete">Delete</SelectItem>
              <SelectItem value="view">View</SelectItem>
              <SelectItem value="export">Export</SelectItem>
              <SelectItem value="login">Login</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Activity list */}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No activity logged yet</p>
            <p className="text-sm">Actions by team members will appear here</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                    {entityIcons[log.entity_type] || <Activity className="h-4 w-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm truncate">
                        {getSubUserEmail(log.sub_user_id)}
                      </span>
                      <Badge variant="secondary" className={`text-xs ${getActionColor(log.action_type)}`}>
                        {log.action_type}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {log.entity_type}
                      </Badge>
                    </div>
                    {log.entity_name && (
                      <p className="text-sm text-muted-foreground mt-1 truncate">
                        {log.entity_name}
                      </p>
                    )}
                    {log.details && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {log.details}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })} •{" "}
                      {format(new Date(log.created_at), "MMM d, yyyy h:mm a")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};
