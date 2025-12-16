import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Heart, Pill, AlertTriangle, Users } from "lucide-react";

interface ReviewStepProps {
  watch: any;
}

export const ReviewStep = ({ watch }: ReviewStepProps) => {
  const data = watch();

  const formatValue = (value: string | undefined) => {
    return value || <span className="text-muted-foreground italic">Not provided</span>;
  };

  const formatEnum = (value: string) => {
    return value.charAt(0) + value.slice(1).toLowerCase().replace(/_/g, ' ');
  };

  const Section = ({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) => (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Icon className="h-5 w-5 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3">{children}</CardContent>
    </Card>
  );

  const Field = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      <span className="text-sm text-foreground text-right">{value}</span>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="text-center pb-4 border-b">
        <h2 className="text-xl font-semibold">Review Patient Information</h2>
        <p className="text-muted-foreground text-sm mt-1">Please review all the information before submitting</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Demographics */}
        <Section title="Demographics" icon={User}>
          <Field label="Name" value={`${data.first_name} ${data.last_name}`} />
          <Field label="Date of Birth" value={formatValue(data.date_of_birth)} />
          <Field label="Gender" value={formatEnum(data.gender)} />
          <Field label="Contact Number" value={formatValue(data.contact_number)} />
          <Field label="Email" value={formatValue(data.email)} />
          <Field label="Address" value={formatValue(data.address)} />
          <Field label="Blood Group" value={formatValue(data.blood_group)} />
          <Field label="Health Card #" value={formatValue(data.health_card_number)} />
        </Section>

        {/* Medical History */}
        <Section title="Medical History" icon={Heart}>
          <Field label="Ongoing Conditions" value={formatValue(data.medical_history_ongoing)} />
          <Field label="Past Conditions" value={formatValue(data.medical_history_past)} />
          <Field label="Surgical History" value={formatValue(data.surgical_history)} />
          <Field label="Hospitalization" value={formatValue(data.hospitalization_history)} />
          <Field label="Family History" value={formatValue(data.family_history)} />
          <Field label="Mental Health" value={formatValue(data.mental_health_history)} />
          <Field label="Birth History" value={formatValue(data.birth_history)} />
          <Field label="Developmental History" value={formatValue(data.developmental_history)} />
          <Field label="Childhood Illnesses" value={formatValue(data.childhood_illnesses)} />
          <Field label="Accidents/Injuries" value={formatValue(data.accidents_injuries)} />
          {data.gender === "FEMALE" && (
            <Field label="Menstrual/Pregnancy" value={formatValue(data.menstrual_pregnancy_history)} />
          )}
          <Field label="Preventive Screening" value={formatValue(data.preventive_screening_history)} />
        </Section>

        {/* Medications */}
        <Section title="Medications & Supplements" icon={Pill}>
          <Field label="Ongoing Medications" value={formatValue(data.ongoing_medications)} />
          <Field label="Supplements" value={formatValue(data.supplements)} />
          <Field label="Vaccinations" value={formatValue(data.vaccinations)} />
        </Section>

        {/* Allergies */}
        <Section title="Allergies" icon={AlertTriangle}>
          <Field label="Drug Allergies" value={formatValue(data.allergic_history_drug)} />
          <Field label="Food Allergies" value={formatValue(data.allergic_history_food)} />
          <Field label="Environmental Allergies" value={formatValue(data.allergic_history_env)} />
        </Section>

        {/* Social History */}
        <Section title="Social History" icon={Users}>
          <Field label="Smoking Status" value={<Badge variant="outline">{formatEnum(data.smoking_status)}</Badge>} />
          <Field label="Alcohol Consumption" value={<Badge variant="outline">{formatEnum(data.alcohol_consumption)}</Badge>} />
          <Field label="Recreational Drugs" value={formatValue(data.recreational_drug_use)} />
          <Field label="Exercise Habits" value={formatValue(data.exercise_habits)} />
          <Field label="Diet" value={formatValue(data.diet)} />
          <Field label="Occupation" value={formatValue(data.occupation)} />
          <Field label="Living Environment" value={formatValue(data.living_environment)} />
        </Section>
      </div>
    </div>
  );
};
