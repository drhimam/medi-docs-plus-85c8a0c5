import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface DemographicsStepProps {
  register: any;
  watch: any;
  setValue: any;
  errors: any;
}

export const DemographicsStep = ({ register, watch, setValue, errors }: DemographicsStepProps) => {
  const gender = watch("gender");
  const bloodGroup = watch("blood_group");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Demographics</CardTitle>
        <CardDescription>Basic patient information and contact details</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="first_name">First Name *</Label>
            <Input
              id="first_name"
              {...register("first_name")}
            />
            {errors.first_name && (
              <p className="text-sm text-destructive mt-1">{errors.first_name.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="last_name">Last Name *</Label>
            <Input
              id="last_name"
              {...register("last_name")}
            />
            {errors.last_name && (
              <p className="text-sm text-destructive mt-1">{errors.last_name.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="date_of_birth">Date of Birth *</Label>
            <Input
              id="date_of_birth"
              type="date"
              {...register("date_of_birth")}
            />
            {errors.date_of_birth && (
              <p className="text-sm text-destructive mt-1">{errors.date_of_birth.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="gender">Gender *</Label>
            <Select
              value={gender}
              onValueChange={(value) => setValue("gender", value as "MALE" | "FEMALE" | "OTHER")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MALE">Male</SelectItem>
                <SelectItem value="FEMALE">Female</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="contact_number">Contact Number * (digits only)</Label>
            <Input
              id="contact_number"
              placeholder="1234567890"
              {...register("contact_number")}
            />
            {errors.contact_number && (
              <p className="text-sm text-destructive mt-1">{errors.contact_number.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-sm text-destructive mt-1">{errors.email.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="health_card_number">Health Card / Insurance No.</Label>
            <Input
              id="health_card_number"
              placeholder="Enter health card or insurance number"
              {...register("health_card_number")}
            />
          </div>
          <div>
            <Label htmlFor="blood_group">Blood Group</Label>
            <Select
              value={bloodGroup}
              onValueChange={(value) => setValue("blood_group", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select blood group" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="A+">A+</SelectItem>
                <SelectItem value="A-">A-</SelectItem>
                <SelectItem value="B+">B+</SelectItem>
                <SelectItem value="B-">B-</SelectItem>
                <SelectItem value="AB+">AB+</SelectItem>
                <SelectItem value="AB-">AB-</SelectItem>
                <SelectItem value="O+">O+</SelectItem>
                <SelectItem value="O-">O-</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div>
          <Label htmlFor="address">Address</Label>
          <Textarea
            id="address"
            {...register("address")}
            rows={3}
          />
        </div>
      </CardContent>
    </Card>
  );
};
