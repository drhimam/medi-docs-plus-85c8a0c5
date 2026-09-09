import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { toast } from "sonner";
import { Users, UserPlus, Mail, Trash2, Settings2, Loader2, Clock, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { useSubUser, SubUserPermissions } from "@/hooks/useSubUser";
import { format } from "date-fns";

const MAX_SUB_USERS = 4;

interface PermissionSwitchProps {
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
}

const PermissionSwitch = ({ label, description, checked, onCheckedChange, disabled }: PermissionSwitchProps) => (
  <div className="flex items-center justify-between py-2">
    <div className="space-y-0.5">
      <Label className="text-sm">{label}</Label>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
    <Switch checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} />
  </div>
);

export const SubUserManagement = () => {
  const { subUsers, fetchMySubUsers, isSubUser, DEFAULT_PERMISSIONS } = useSubUser();
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingSubUser, setEditingSubUser] = useState<any>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [permissions, setPermissions] = useState<SubUserPermissions>(DEFAULT_PERMISSIONS);
  const [editPermissions, setEditPermissions] = useState<SubUserPermissions>(DEFAULT_PERMISSIONS);
  const [savingPermissions, setSavingPermissions] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [resendingId, setResendingId] = useState<string | null>(null);

  useEffect(() => {
    if (!isSubUser) {
      fetchMySubUsers();
    }
  }, [isSubUser, fetchMySubUsers]);

  const handleInvite = async () => {
    if (!inviteEmail.trim()) {
      toast.error("Please enter an email address");
      return;
    }

    if (subUsers.length >= MAX_SUB_USERS) {
      toast.error(`You can only have up to ${MAX_SUB_USERS} sub-users`);
      return;
    }

    setInviteLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Check if email already exists as sub-user
      const existing = subUsers.find(su => su.email.toLowerCase() === inviteEmail.toLowerCase());
      if (existing) {
        toast.error("This email is already invited");
        return;
      }

      // Create sub-user record
      const { data: subUserData, error: subUserError } = await supabase
        .from("sub_users")
        .insert({
          owner_id: user.id,
          email: inviteEmail.toLowerCase(),
          status: "pending",
        })
        .select()
        .single();

      if (subUserError) throw subUserError;

      // Create permissions record
      const { error: permError } = await supabase
        .from("sub_user_permissions")
        .insert({
          sub_user_id: subUserData.id,
          ...permissions,
        });

      if (permError) throw permError;

      // Send invitation email via edge function
      const { error: inviteError } = await supabase.functions.invoke("send-sub-user-invite", {
        body: {
          email: inviteEmail,
          inviteToken: subUserData.invite_token,
          ownerEmail: user.email,
          appUrl: window.location.origin,
        },
      });

      if (inviteError) {
        console.warn("Email sending failed, but invite created:", inviteError);
        toast.warning("Invite created, but the email could not be sent. You can resend it.");
      } else {
        toast.success("Invitation sent successfully!");
      }

      setIsInviteOpen(false);
      setInviteEmail("");
      setPermissions(DEFAULT_PERMISSIONS);
      fetchMySubUsers();
    } catch (error: any) {
      console.error("Error inviting sub-user:", error);
      toast.error(error.message || "Failed to send invitation");
    } finally {
      setInviteLoading(false);
    }
  };

  const handleResendInvite = async (subUser: any) => {
    setResendingId(subUser.id);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Generate new token and expiry
      const { error: updateError } = await supabase
        .from("sub_users")
        .update({
          invite_token: crypto.randomUUID(),
          invite_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .eq("id", subUser.id);

      if (updateError) throw updateError;

      // Get updated record
      const { data: updatedSubUser } = await supabase
        .from("sub_users")
        .select("invite_token")
        .eq("id", subUser.id)
        .single();

      // Send new invitation email
      await supabase.functions.invoke("send-sub-user-invite", {
        body: {
          email: subUser.email,
          inviteToken: updatedSubUser?.invite_token,
          ownerEmail: user.email,
          appUrl: window.location.origin,
        },
      });

      toast.success("Invitation resent!");
      fetchMySubUsers();
    } catch (error: any) {
      console.error("Error resending invite:", error);
      toast.error("Failed to resend invitation");
    } finally {
      setResendingId(null);
    }
  };

  const handleDelete = async (subUserId: string) => {
    setDeletingId(subUserId);
    try {
      const { error } = await supabase
        .from("sub_users")
        .delete()
        .eq("id", subUserId);

      if (error) throw error;

      toast.success("Sub-user removed");
      fetchMySubUsers();
    } catch (error: any) {
      console.error("Error deleting sub-user:", error);
      toast.error("Failed to remove sub-user");
    } finally {
      setDeletingId(null);
    }
  };

  const handleEditPermissions = (subUser: any) => {
    setEditingSubUser(subUser);
    setEditPermissions(subUser.permissions || DEFAULT_PERMISSIONS);
    setIsEditOpen(true);
  };

  const handleSavePermissions = async () => {
    if (!editingSubUser) return;

    setSavingPermissions(true);
    try {
      const { error } = await supabase
        .from("sub_user_permissions")
        .update(editPermissions)
        .eq("sub_user_id", editingSubUser.id);

      if (error) throw error;

      toast.success("Permissions updated");
      setIsEditOpen(false);
      fetchMySubUsers();
    } catch (error: any) {
      console.error("Error updating permissions:", error);
      toast.error("Failed to update permissions");
    } finally {
      setSavingPermissions(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="default" className="gap-1"><CheckCircle className="h-3 w-3" /> Active</Badge>;
      case "pending":
        return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" /> Pending</Badge>;
      case "revoked":
        return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" /> Revoked</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isSubUser) {
    return null; // Sub-users can't manage other sub-users
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Users className="h-5 w-5" />
          Team Members (Sub-Users)
        </CardTitle>
        <CardDescription>
          Invite up to {MAX_SUB_USERS} team members with restricted access ({subUsers.length}/{MAX_SUB_USERS} used)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Sub-users list */}
        {subUsers.length > 0 ? (
          <div className="space-y-3">
            {subUsers.map((subUser) => (
              <div
                key={subUser.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">{subUser.email}</p>
                    <p className="text-xs text-muted-foreground">
                      Added {format(new Date(subUser.created_at), "MMM d, yyyy")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(subUser.status)}
                  {subUser.status === "pending" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleResendInvite(subUser)}
                      disabled={resendingId === subUser.id}
                    >
                      {resendingId === subUser.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEditPermissions(subUser)}
                  >
                    <Settings2 className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remove Sub-User</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to remove {subUser.email}? They will lose access to your account.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(subUser.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {deletingId === subUser.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "Remove"
                          )}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No team members yet</p>
            <p className="text-sm">Invite team members to help manage your practice</p>
          </div>
        )}

        {/* Invite button */}
        <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
          <DialogTrigger asChild>
            <Button
              className="w-full"
              disabled={subUsers.length >= MAX_SUB_USERS}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Invite Team Member
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Invite Team Member</DialogTitle>
              <DialogDescription>
                Send an invitation email to add a new team member with restricted access.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Email Address</Label>
                <Input
                  type="email"
                  placeholder="team.member@email.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>

              <Accordion type="single" collapsible defaultValue="pages">
                <AccordionItem value="pages">
                  <AccordionTrigger>Page Access</AccordionTrigger>
                  <AccordionContent className="space-y-2">
                    <PermissionSwitch
                      label="Patients"
                      description="View patient list and details"
                      checked={permissions.can_access_patients}
                      onCheckedChange={(checked) => setPermissions({ ...permissions, can_access_patients: checked })}
                    />
                    <PermissionSwitch
                      label="Appointments"
                      description="View and manage appointments"
                      checked={permissions.can_access_appointments}
                      onCheckedChange={(checked) => setPermissions({ ...permissions, can_access_appointments: checked })}
                    />
                    <PermissionSwitch
                      label="Clinical Documentation"
                      description="Access SOAP notes and prescriptions"
                      checked={permissions.can_access_clinical_docs}
                      onCheckedChange={(checked) => setPermissions({ ...permissions, can_access_clinical_docs: checked })}
                    />
                    <PermissionSwitch
                      label="Knowledge Base"
                      description="Access medical articles and references"
                      checked={permissions.can_access_knowledge_base}
                      onCheckedChange={(checked) => setPermissions({ ...permissions, can_access_knowledge_base: checked })}
                    />
                    <PermissionSwitch
                      label="AI Tools"
                      description="Use transcription and AI features"
                      checked={permissions.can_access_ai_tools}
                      onCheckedChange={(checked) => setPermissions({ ...permissions, can_access_ai_tools: checked })}
                    />
                    <PermissionSwitch
                      label="Settings"
                      description="Access account settings"
                      checked={permissions.can_access_settings}
                      onCheckedChange={(checked) => setPermissions({ ...permissions, can_access_settings: checked })}
                    />
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="actions">
                  <AccordionTrigger>Actions</AccordionTrigger>
                  <AccordionContent className="space-y-2">
                    <PermissionSwitch
                      label="Create Patients"
                      description="Add new patients"
                      checked={permissions.can_create_patients}
                      onCheckedChange={(checked) => setPermissions({ ...permissions, can_create_patients: checked })}
                    />
                    <PermissionSwitch
                      label="Edit Patients"
                      description="Modify patient information"
                      checked={permissions.can_edit_patients}
                      onCheckedChange={(checked) => setPermissions({ ...permissions, can_edit_patients: checked })}
                    />
                    <PermissionSwitch
                      label="Delete Patients"
                      description="Remove patients from the system"
                      checked={permissions.can_delete_patients}
                      onCheckedChange={(checked) => setPermissions({ ...permissions, can_delete_patients: checked })}
                    />
                    <PermissionSwitch
                      label="Create Visits"
                      description="Add new patient visits"
                      checked={permissions.can_create_visits}
                      onCheckedChange={(checked) => setPermissions({ ...permissions, can_create_visits: checked })}
                    />
                    <PermissionSwitch
                      label="Edit Visits"
                      description="Modify visit records"
                      checked={permissions.can_edit_visits}
                      onCheckedChange={(checked) => setPermissions({ ...permissions, can_edit_visits: checked })}
                    />
                    <PermissionSwitch
                      label="Delete Visits"
                      description="Remove visit records"
                      checked={permissions.can_delete_visits}
                      onCheckedChange={(checked) => setPermissions({ ...permissions, can_delete_visits: checked })}
                    />
                    <PermissionSwitch
                      label="Create Appointments"
                      description="Schedule new appointments"
                      checked={permissions.can_create_appointments}
                      onCheckedChange={(checked) => setPermissions({ ...permissions, can_create_appointments: checked })}
                    />
                    <PermissionSwitch
                      label="Edit Appointments"
                      description="Modify appointment details"
                      checked={permissions.can_edit_appointments}
                      onCheckedChange={(checked) => setPermissions({ ...permissions, can_edit_appointments: checked })}
                    />
                    <PermissionSwitch
                      label="Delete Appointments"
                      description="Cancel/remove appointments"
                      checked={permissions.can_delete_appointments}
                      onCheckedChange={(checked) => setPermissions({ ...permissions, can_delete_appointments: checked })}
                    />
                    <PermissionSwitch
                      label="Export Data"
                      description="Download PDFs, CSVs, etc."
                      checked={permissions.can_export}
                      onCheckedChange={(checked) => setPermissions({ ...permissions, can_export: checked })}
                    />
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsInviteOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleInvite} disabled={inviteLoading}>
                {inviteLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Send Invitation
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Permissions Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Permissions</DialogTitle>
              <DialogDescription>
                Modify access permissions for {editingSubUser?.email}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Accordion type="single" collapsible defaultValue="pages">
                <AccordionItem value="pages">
                  <AccordionTrigger>Page Access</AccordionTrigger>
                  <AccordionContent className="space-y-2">
                    <PermissionSwitch
                      label="Patients"
                      description="View patient list and details"
                      checked={editPermissions.can_access_patients}
                      onCheckedChange={(checked) => setEditPermissions({ ...editPermissions, can_access_patients: checked })}
                    />
                    <PermissionSwitch
                      label="Appointments"
                      description="View and manage appointments"
                      checked={editPermissions.can_access_appointments}
                      onCheckedChange={(checked) => setEditPermissions({ ...editPermissions, can_access_appointments: checked })}
                    />
                    <PermissionSwitch
                      label="Clinical Documentation"
                      description="Access SOAP notes and prescriptions"
                      checked={editPermissions.can_access_clinical_docs}
                      onCheckedChange={(checked) => setEditPermissions({ ...editPermissions, can_access_clinical_docs: checked })}
                    />
                    <PermissionSwitch
                      label="Knowledge Base"
                      description="Access medical articles and references"
                      checked={editPermissions.can_access_knowledge_base}
                      onCheckedChange={(checked) => setEditPermissions({ ...editPermissions, can_access_knowledge_base: checked })}
                    />
                    <PermissionSwitch
                      label="AI Tools"
                      description="Use transcription and AI features"
                      checked={editPermissions.can_access_ai_tools}
                      onCheckedChange={(checked) => setEditPermissions({ ...editPermissions, can_access_ai_tools: checked })}
                    />
                    <PermissionSwitch
                      label="Settings"
                      description="Access account settings"
                      checked={editPermissions.can_access_settings}
                      onCheckedChange={(checked) => setEditPermissions({ ...editPermissions, can_access_settings: checked })}
                    />
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="actions">
                  <AccordionTrigger>Actions</AccordionTrigger>
                  <AccordionContent className="space-y-2">
                    <PermissionSwitch
                      label="Create Patients"
                      description="Add new patients"
                      checked={editPermissions.can_create_patients}
                      onCheckedChange={(checked) => setEditPermissions({ ...editPermissions, can_create_patients: checked })}
                    />
                    <PermissionSwitch
                      label="Edit Patients"
                      description="Modify patient information"
                      checked={editPermissions.can_edit_patients}
                      onCheckedChange={(checked) => setEditPermissions({ ...editPermissions, can_edit_patients: checked })}
                    />
                    <PermissionSwitch
                      label="Delete Patients"
                      description="Remove patients from the system"
                      checked={editPermissions.can_delete_patients}
                      onCheckedChange={(checked) => setEditPermissions({ ...editPermissions, can_delete_patients: checked })}
                    />
                    <PermissionSwitch
                      label="Create Visits"
                      description="Add new patient visits"
                      checked={editPermissions.can_create_visits}
                      onCheckedChange={(checked) => setEditPermissions({ ...editPermissions, can_create_visits: checked })}
                    />
                    <PermissionSwitch
                      label="Edit Visits"
                      description="Modify visit records"
                      checked={editPermissions.can_edit_visits}
                      onCheckedChange={(checked) => setEditPermissions({ ...editPermissions, can_edit_visits: checked })}
                    />
                    <PermissionSwitch
                      label="Delete Visits"
                      description="Remove visit records"
                      checked={editPermissions.can_delete_visits}
                      onCheckedChange={(checked) => setEditPermissions({ ...editPermissions, can_delete_visits: checked })}
                    />
                    <PermissionSwitch
                      label="Create Appointments"
                      description="Schedule new appointments"
                      checked={editPermissions.can_create_appointments}
                      onCheckedChange={(checked) => setEditPermissions({ ...editPermissions, can_create_appointments: checked })}
                    />
                    <PermissionSwitch
                      label="Edit Appointments"
                      description="Modify appointment details"
                      checked={editPermissions.can_edit_appointments}
                      onCheckedChange={(checked) => setEditPermissions({ ...editPermissions, can_edit_appointments: checked })}
                    />
                    <PermissionSwitch
                      label="Delete Appointments"
                      description="Cancel/remove appointments"
                      checked={editPermissions.can_delete_appointments}
                      onCheckedChange={(checked) => setEditPermissions({ ...editPermissions, can_delete_appointments: checked })}
                    />
                    <PermissionSwitch
                      label="Export Data"
                      description="Download PDFs, CSVs, etc."
                      checked={editPermissions.can_export}
                      onCheckedChange={(checked) => setEditPermissions({ ...editPermissions, can_export: checked })}
                    />
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSavePermissions} disabled={savingPermissions}>
                {savingPermissions && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};
