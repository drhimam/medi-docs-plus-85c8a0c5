import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useActivityLog } from "@/hooks/useActivityLog";
import { EDoctorDeskLogo } from "@/components/EDoctorDeskLogo";

const AcceptInvite = () => {
  const navigate = useNavigate();
  const { logActivity } = useActivityLog();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [inviteValid, setInviteValid] = useState(false);
  const [inviteData, setInviteData] = useState<any>(null);
  const [existingUser, setExistingUser] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    password: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (token) {
      validateInvite();
    } else {
      setLoading(false);
    }
  }, [token]);

  const validateInvite = async () => {
    try {
      // Token-scoped lookup (works for signed-out visitors)
      const { data, error } = await supabase.rpc("get_invite_by_token", {
        p_token: token,
      });

      const invite = Array.isArray(data) ? data[0] : data;

      if (error || !invite) {
        setInviteValid(false);
        setLoading(false);
        return;
      }

      setInviteData(invite);
      setInviteValid(true);

      // Check if user already exists
      const { data: { user } } = await supabase.auth.getUser();
      if (user && user.email?.toLowerCase() === invite.email.toLowerCase()) {
        setExistingUser(true);
      }
    } catch (error) {
      console.error("Error validating invite:", error);
      setInviteValid(false);
    } finally {
      setLoading(false);
    }
  };

  const acceptInvite = async () => {
    const { data: ownerId, error } = await supabase.rpc("accept_sub_user_invite", {
      p_token: token,
    });
    if (error) throw error;

    await logActivity(
      (ownerId as string) || inviteData.owner_id,
      "login",
      "session",
      undefined,
      "Sub-user joined team",
      "Accepted invitation and activated account"
    );
  };

  const handleAcceptAsExisting = async () => {
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please log in first");
        navigate("/login");
        return;
      }

      await acceptInvite();

      toast.success("Invitation accepted! You now have access to the team.");
      navigate("/dashboard");
    } catch (error: any) {
      console.error("Error accepting invite:", error);
      toast.error(error.message || "Failed to accept invitation");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegisterAndAccept = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (formData.password.length < 12) {
      toast.error("Password must be at least 12 characters");
      return;
    }

    if (!/[A-Z]/.test(formData.password)) {
      toast.error("Password must contain at least one uppercase letter");
      return;
    }

    if (!/[a-z]/.test(formData.password)) {
      toast.error("Password must contain at least one lowercase letter");
      return;
    }

    if (!/[0-9]/.test(formData.password)) {
      toast.error("Password must contain at least one number");
      return;
    }

    if (!/[^A-Za-z0-9]/.test(formData.password)) {
      toast.error("Password must contain at least one special character");
      return;
    }

    setSubmitting(true);
    try {
      // Register new user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: inviteData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
          },
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (authError) throw authError;

      if (authData.user) {
        if (!authData.session) {
          toast.success("Account created! Please confirm your email, then open this invitation link again.");
          return;
        }

        await acceptInvite();

        toast.success("Account created! Welcome to the team.");
        navigate("/dashboard");
      }
    } catch (error: any) {
      console.error("Error registering:", error);
      toast.error(error.message || "Failed to create account");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-secondary/20 to-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!token || !inviteValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-secondary/20 to-background p-4">
        <Card className="w-full max-w-md p-8 text-center">
          <XCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Invalid or Expired Invitation</h2>
          <p className="text-muted-foreground mb-6">
            This invitation link is no longer valid. It may have expired or already been used.
          </p>
          <div className="space-y-2">
            <Link to="/login">
              <Button className="w-full">Go to Login</Button>
            </Link>
            <Link to="/">
              <Button variant="outline" className="w-full">Back to Home</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  if (existingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-secondary/20 to-background p-4">
        <Card className="w-full max-w-md p-8 text-center">
          <CheckCircle className="h-16 w-16 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Accept Invitation</h2>
          <p className="text-muted-foreground mb-6">
            You've been invited to join a team. Click below to accept and gain access.
          </p>
          <Button onClick={handleAcceptAsExisting} disabled={submitting} className="w-full">
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Accepting...
              </>
            ) : (
              "Accept Invitation"
            )}
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-secondary/20 to-background p-4">
      <Card className="w-full max-w-md p-8">
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <EDoctorDeskLogo className="h-10 w-10" />
            <h1 className="text-3xl font-bold text-primary">eDoctorDesk</h1>
          </div>
          <h2 className="text-2xl font-semibold text-foreground">Join the Team</h2>
          <p className="text-muted-foreground mt-2">
            Create your account to accept the invitation
          </p>
          <p className="text-sm text-primary mt-1">{inviteData?.email}</p>
        </div>

        <form onSubmit={handleRegisterAndAccept} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              placeholder="Your full name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
            <p className="text-xs text-muted-foreground">
              Must be 12+ characters with uppercase, lowercase, number, and special character
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating Account...
              </>
            ) : (
              "Create Account & Join"
            )}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm">
          <span className="text-muted-foreground">Already have an account? </span>
          <Link to="/login" className="text-primary hover:underline font-medium">
            Sign in
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default AcceptInvite;
