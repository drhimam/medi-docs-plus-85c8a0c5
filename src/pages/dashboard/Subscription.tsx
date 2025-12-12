import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useSubscription, FREE_PLAN_LIMITS, PRO_PLAN_LIMITS } from "@/hooks/useSubscription";
import { format } from "date-fns";

const UsageCard = ({ 
  label, 
  current, 
  limit, 
  unit = "" 
}: { 
  label: string; 
  current: number; 
  limit: number; 
  unit?: string;
}) => {
  const isUnlimited = !isFinite(limit);
  const percentage = isUnlimited ? 0 : Math.min((current / limit) * 100, 100);
  const displayLimit = isUnlimited ? "Unlimited" : `${limit}${unit}`;
  
  return (
    <Card className="bg-muted/30">
      <CardContent className="pt-4 pb-4">
        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{label}</p>
        <p className="text-lg font-semibold">
          {current}{unit} / {displayLimit}
        </p>
        {!isUnlimited && (
          <Progress value={percentage} className="h-1.5 mt-2" />
        )}
      </CardContent>
    </Card>
  );
};

const AIUsageCard = ({ 
  textCurrent, 
  textLimit, 
  speechCurrent, 
  speechLimit 
}: { 
  textCurrent: number; 
  textLimit: number; 
  speechCurrent: number; 
  speechLimit: number;
}) => {
  return (
    <Card className="bg-amber-50 dark:bg-amber-950/20">
      <CardContent className="pt-4 pb-4">
        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">AI USAGE</p>
        <p className="text-sm">Text: {textCurrent} / {textLimit}</p>
        <p className="text-sm">Speech: {speechCurrent} / {speechLimit}</p>
      </CardContent>
    </Card>
  );
};

export default function Subscription() {
  const { subscription, usage, limits, isLoading, isPro } = useSubscription();
  const [changePlanOpen, setChangePlanOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Subscription & Billing</h1>
          <p className="text-muted-foreground">Manage your subscription and billing information</p>
        </div>
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Subscription & Billing</h1>
        <p className="text-muted-foreground">Manage your subscription and billing information</p>
      </div>

      {/* Current Plan Card */}
      <Card className="bg-blue-50 dark:bg-blue-950/20 border-l-4 border-l-primary">
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="font-semibold text-lg">
                Current Plan: {isPro ? "Pro Plan" : "Free Plan"}
              </p>
              <p className="text-sm text-muted-foreground">
                This plan is managed manually. Billing is not yet connected.
              </p>
              <p className="text-sm">
                Status: <span className="text-green-600 font-medium">Active</span>
              </p>
              {subscription?.started_at && (
                <p className="text-xs text-muted-foreground">
                  Started: {format(new Date(subscription.started_at), "yyyy-MM-dd")}
                </p>
              )}
              {subscription?.expires_at && (
                <p className="text-xs text-muted-foreground">
                  Expires: {format(new Date(subscription.expires_at), "yyyy-MM-dd")}
                </p>
              )}
            </div>
            <Dialog open={changePlanOpen} onOpenChange={setChangePlanOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">Change Plan</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Change Your Plan</DialogTitle>
                  <DialogDescription>
                    To change your plan, please contact support.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <Card className={isPro ? "border-primary" : ""}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center gap-2">
                        Pro Plan
                        {isPro && <Badge>Current</Badge>}
                      </CardTitle>
                      <CardDescription>Unlimited patients, visits, appointments</CardDescription>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">
                      <ul className="list-disc list-inside space-y-1">
                        <li>Unlimited patients</li>
                        <li>Unlimited visits</li>
                        <li>Unlimited appointments</li>
                        <li>100 knowledge entries</li>
                        <li>500 MB document storage</li>
                        <li>500 AI text requests/month</li>
                        <li>100 AI speech requests/month</li>
                      </ul>
                    </CardContent>
                  </Card>
                  <Card className={!isPro ? "border-primary" : ""}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center gap-2">
                        Free Plan
                        {!isPro && <Badge>Current</Badge>}
                      </CardTitle>
                      <CardDescription>Great for getting started</CardDescription>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">
                      <ul className="list-disc list-inside space-y-1">
                        <li>50 patients</li>
                        <li>100 visits</li>
                        <li>100 appointments</li>
                        <li>10 knowledge entries</li>
                        <li>50 MB document storage</li>
                        <li>50 AI text requests/month</li>
                        <li>No AI speech</li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* PayPal Upgrade Section (only for free users) */}
      {!isPro && (
        <Card className="bg-amber-50 dark:bg-amber-950/20 border-l-4 border-l-amber-500">
          <CardContent className="pt-4 pb-4 space-y-3">
            <p className="font-medium">
              Upgrade from Free to Pro using PayPal (manual activation, may require up to 24 hours).
            </p>
            <p className="text-sm text-muted-foreground">
              1. Complete the payment via PayPal using the button below. 2. Then email us your aiMedipedia account email and PayPal receipt so we can upgrade your plan.
            </p>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <Button 
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => window.open("https://paypal.me/", "_blank")}
              >
                Pay with PayPal
              </Button>
              <p className="text-xs text-muted-foreground">
                For users in Bangladesh or regions without PayPal access, please contact us via WhatsApp +1 647-428-7540, email support@aimedipedia.com, or the contact form on the Contact page to arrange payment and activation.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Usage Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <UsageCard 
          label="PATIENTS" 
          current={usage?.patients || 0} 
          limit={limits.patients} 
        />
        <UsageCard 
          label="VISITS" 
          current={usage?.visits || 0} 
          limit={limits.visits} 
        />
        <UsageCard 
          label="APPOINTMENTS" 
          current={usage?.appointments || 0} 
          limit={limits.appointments} 
        />
        <UsageCard 
          label="KNOWLEDGE ENTRIES" 
          current={usage?.knowledgeEntries || 0} 
          limit={limits.knowledgeEntries} 
        />
        <UsageCard 
          label="DOCUMENT STORAGE" 
          current={usage?.documentStorageMB || 0} 
          limit={limits.documentStorageMB}
          unit=" MB"
        />
        <AIUsageCard
          textCurrent={usage?.aiText || 0}
          textLimit={limits.aiText}
          speechCurrent={usage?.aiSpeech || 0}
          speechLimit={limits.aiSpeech}
        />
      </div>
    </div>
  );
}
