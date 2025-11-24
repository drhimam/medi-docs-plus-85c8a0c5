import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const newPatientSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  date_of_birth: z.string().min(1, "Date of birth is required"),
  gender: z.string().min(1, "Gender is required"),
  contact_number: z.string().min(1, "Contact number is required"),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().optional(),
  health_card_number: z.string().optional(),
  smoking_status: z.string().default("NEVER"),
  alcohol_consumption: z.string().default("NEVER"),
  birth_history: z.string().max(1000).optional(),
  developmental_history: z.string().max(1000).optional(),
  childhood_illnesses: z.string().max(1000).optional(),
  accidents_injuries: z.string().max(1000).optional(),
  menstrual_pregnancy_history: z.string().max(1000).optional(),
  preventive_screening_history: z.string().max(1000).optional(),
});

type NewPatientFormData = z.infer<typeof newPatientSchema>;

interface NewPatientFormProps {
  onDataChange: (data: NewPatientFormData | null) => void;
}

export function NewPatientForm({ onDataChange }: NewPatientFormProps) {
  const {
    register,
    watch,
    control,
    formState: { errors, isValid },
  } = useForm<NewPatientFormData>({
    resolver: zodResolver(newPatientSchema),
    mode: "onChange",
    defaultValues: {
      smoking_status: "NEVER",
      alcohol_consumption: "NEVER",
    },
  });

  const formData = watch();

  useEffect(() => {
    if (isValid) {
      onDataChange(formData);
    } else {
      onDataChange(null);
    }
  }, [formData, isValid, onDataChange]);

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Patient Demographics</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="first_name">First Name *</Label>
            <Input id="first_name" {...register("first_name")} />
            {errors.first_name && (
              <p className="text-sm text-destructive">{errors.first_name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="last_name">Last Name *</Label>
            <Input id="last_name" {...register("last_name")} />
            {errors.last_name && (
              <p className="text-sm text-destructive">{errors.last_name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="date_of_birth">Date of Birth *</Label>
            <Input id="date_of_birth" type="date" {...register("date_of_birth")} />
            {errors.date_of_birth && (
              <p className="text-sm text-destructive">{errors.date_of_birth.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="gender">Gender *</Label>
            <Controller
              name="gender"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger id="gender">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MALE">Male</SelectItem>
                    <SelectItem value="FEMALE">Female</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.gender && (
              <p className="text-sm text-destructive">{errors.gender.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact_number">Contact Number *</Label>
            <Input id="contact_number" {...register("contact_number")} />
            {errors.contact_number && (
              <p className="text-sm text-destructive">{errors.contact_number.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...register("email")} />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2 col-span-2">
            <Label htmlFor="address">Address</Label>
            <Input id="address" {...register("address")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="health_card_number">Health Card Number</Label>
            <Input id="health_card_number" {...register("health_card_number")} />
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Medical History</h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="birth_history">Birth History</Label>
            <Textarea 
              id="birth_history" 
              {...register("birth_history")}
              placeholder="Describe birth history"
              className="min-h-[80px]"
            />
            {errors.birth_history && (
              <p className="text-sm text-destructive">{errors.birth_history.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="developmental_history">Developmental History</Label>
            <Textarea 
              id="developmental_history" 
              {...register("developmental_history")}
              placeholder="Describe developmental milestones"
              className="min-h-[80px]"
            />
            {errors.developmental_history && (
              <p className="text-sm text-destructive">{errors.developmental_history.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="childhood_illnesses">Childhood Illnesses</Label>
            <Textarea 
              id="childhood_illnesses" 
              {...register("childhood_illnesses")}
              placeholder="List significant childhood illnesses"
              className="min-h-[80px]"
            />
            {errors.childhood_illnesses && (
              <p className="text-sm text-destructive">{errors.childhood_illnesses.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="accidents_injuries">Accidents or Injuries</Label>
            <Textarea 
              id="accidents_injuries" 
              {...register("accidents_injuries")}
              placeholder="Describe major accidents or injuries"
              className="min-h-[80px]"
            />
            {errors.accidents_injuries && (
              <p className="text-sm text-destructive">{errors.accidents_injuries.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="menstrual_pregnancy_history">Menstrual and Pregnancy History (if applicable)</Label>
            <Textarea 
              id="menstrual_pregnancy_history" 
              {...register("menstrual_pregnancy_history")}
              placeholder="Detail menstrual and pregnancy history"
              className="min-h-[80px]"
            />
            {errors.menstrual_pregnancy_history && (
              <p className="text-sm text-destructive">{errors.menstrual_pregnancy_history.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="preventive_screening_history">Preventive Screening History</Label>
            <Textarea 
              id="preventive_screening_history" 
              {...register("preventive_screening_history")}
              placeholder="e.g., mammograms, colonoscopies"
              className="min-h-[80px]"
            />
            {errors.preventive_screening_history && (
              <p className="text-sm text-destructive">{errors.preventive_screening_history.message}</p>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
