import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  contact_number: string;
  date_of_birth: string;
  health_card_number: string | null;
}

interface ExistingPatientSearchProps {
  selectedPatientId: string | null;
  onSelectPatient: (patientId: string) => void;
}

export function ExistingPatientSearch({
  selectedPatientId,
  onSelectPatient,
}: ExistingPatientSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const searchPatients = async () => {
      if (searchQuery.length < 2) {
        setPatients([]);
        return;
      }

      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from("patients")
          .select("id, first_name, last_name, contact_number, date_of_birth, health_card_number")
          .eq("user_id", user.id)
          .or(`first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,contact_number.ilike.%${searchQuery}%,health_card_number.ilike.%${searchQuery}%`)
          .limit(10);

        if (error) throw error;
        setPatients(data || []);
      } catch (error) {
        console.error("Error searching patients:", error);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(searchPatients, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  return (
    <div className="space-y-4">
      <div>
        <Label>Search Patient</Label>
        <div className="relative mt-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, contact, DOB, or health card..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {patients.length > 0 && (
        <Card className="p-4 max-h-[300px] overflow-y-auto">
          <RadioGroup value={selectedPatientId || ""} onValueChange={onSelectPatient}>
            {patients.map((patient) => (
              <div
                key={patient.id}
                className="flex items-start space-x-3 py-3 border-b last:border-0"
              >
                <RadioGroupItem value={patient.id} id={patient.id} className="mt-1" />
                <Label htmlFor={patient.id} className="flex-1 cursor-pointer space-y-1">
                  <div className="font-medium">
                    {patient.first_name} {patient.last_name}
                  </div>
                  <div className="text-sm text-muted-foreground space-y-0.5">
                    <div>Contact: {patient.contact_number}</div>
                    <div>DOB: {format(new Date(patient.date_of_birth), "MMM dd, yyyy")}</div>
                    {patient.health_card_number && (
                      <div>Health Card: {patient.health_card_number}</div>
                    )}
                  </div>
                </Label>
              </div>
            ))}
          </RadioGroup>
        </Card>
      )}

      {searchQuery.length >= 2 && patients.length === 0 && !loading && (
        <div className="text-center py-8 text-muted-foreground">
          No patients found matching your search
        </div>
      )}
    </div>
  );
}
