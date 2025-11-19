import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
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
  smoking_status: z.string().default("unknown"),
  alcohol_consumption: z.string().default("unknown"),
});

type NewPatientFormData = z.infer<typeof newPatientSchema>;

interface NewPatientFormProps {
  onDataChange: (data: NewPatientFormData | null) => void;
}

export function NewPatientForm({ onDataChange }: NewPatientFormProps) {
  const {
    register,
    watch,
    setValue,
    formState: { errors, isValid },
  } = useForm<NewPatientFormData>({
    resolver: zodResolver(newPatientSchema),
    mode: "onChange",
    defaultValues: {
      smoking_status: "unknown",
      alcohol_consumption: "unknown",
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
          <Select onValueChange={(value) => setValue("gender", value)}>
            <SelectTrigger id="gender">
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Male">Male</SelectItem>
              <SelectItem value="Female">Female</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
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
  );
}
