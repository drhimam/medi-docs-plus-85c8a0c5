import { forwardRef } from "react";

interface PrintablePatientFormProps {
  data: any;
}

export const PrintablePatientForm = forwardRef<HTMLDivElement, PrintablePatientFormProps>(
  ({ data }, ref) => {
    const formatValue = (value: string | undefined) => value || "_______________";
    
    const formatEnum = (value: string) => {
      return value?.charAt(0) + value?.slice(1).toLowerCase().replace(/_/g, ' ') || "";
    };

    return (
      <div ref={ref} className="print-form bg-white text-black p-8 max-w-4xl mx-auto">
        <style>{`
          @media print {
            .print-form { 
              font-size: 12px; 
              line-height: 1.4;
            }
            .print-form h1 { font-size: 18px; }
            .print-form h2 { font-size: 14px; }
            .no-print { display: none !important; }
            @page { margin: 0.5in; }
          }
        `}</style>

        <div className="text-center mb-6 border-b-2 border-black pb-4">
          <h1 className="text-2xl font-bold">PATIENT INTAKE FORM</h1>
          <p className="text-sm mt-1">Please complete all sections. Use additional sheets if necessary.</p>
        </div>

        {/* Demographics Section */}
        <section className="mb-6">
          <h2 className="font-bold text-lg border-b border-gray-400 mb-3 pb-1">SECTION 1: DEMOGRAPHICS</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex gap-2">
              <span className="font-medium">First Name:</span>
              <span className="border-b border-dotted border-gray-400 flex-1">{formatValue(data.first_name)}</span>
            </div>
            <div className="flex gap-2">
              <span className="font-medium">Last Name:</span>
              <span className="border-b border-dotted border-gray-400 flex-1">{formatValue(data.last_name)}</span>
            </div>
            <div className="flex gap-2">
              <span className="font-medium">Date of Birth:</span>
              <span className="border-b border-dotted border-gray-400 flex-1">{formatValue(data.date_of_birth)}</span>
            </div>
            <div className="flex gap-2">
              <span className="font-medium">Gender:</span>
              <span className="flex gap-4">
                <label><input type="checkbox" checked={data.gender === "MALE"} readOnly /> Male</label>
                <label><input type="checkbox" checked={data.gender === "FEMALE"} readOnly /> Female</label>
                <label><input type="checkbox" checked={data.gender === "OTHER"} readOnly /> Other</label>
              </span>
            </div>
            <div className="flex gap-2">
              <span className="font-medium">Contact Number:</span>
              <span className="border-b border-dotted border-gray-400 flex-1">{formatValue(data.contact_number)}</span>
            </div>
            <div className="flex gap-2">
              <span className="font-medium">Email:</span>
              <span className="border-b border-dotted border-gray-400 flex-1">{formatValue(data.email)}</span>
            </div>
            <div className="flex gap-2 col-span-2">
              <span className="font-medium">Address:</span>
              <span className="border-b border-dotted border-gray-400 flex-1">{formatValue(data.address)}</span>
            </div>
            <div className="flex gap-2">
              <span className="font-medium">Blood Group:</span>
              <span className="border-b border-dotted border-gray-400 flex-1">{formatValue(data.blood_group)}</span>
            </div>
            <div className="flex gap-2">
              <span className="font-medium">Health Card #:</span>
              <span className="border-b border-dotted border-gray-400 flex-1">{formatValue(data.health_card_number)}</span>
            </div>
          </div>
        </section>

        {/* Medical History Section */}
        <section className="mb-6">
          <h2 className="font-bold text-lg border-b border-gray-400 mb-3 pb-1">SECTION 2: MEDICAL HISTORY</h2>
          <div className="space-y-3">
            <div>
              <span className="font-medium">Ongoing Medical Conditions:</span>
              <div className="border border-gray-300 min-h-[40px] p-2 mt-1">{data.medical_history_ongoing || ""}</div>
            </div>
            <div>
              <span className="font-medium">Past Medical Conditions:</span>
              <div className="border border-gray-300 min-h-[40px] p-2 mt-1">{data.medical_history_past || ""}</div>
            </div>
            <div>
              <span className="font-medium">Surgical History:</span>
              <div className="border border-gray-300 min-h-[40px] p-2 mt-1">{data.surgical_history || ""}</div>
            </div>
            <div>
              <span className="font-medium">Hospitalization History:</span>
              <div className="border border-gray-300 min-h-[40px] p-2 mt-1">{data.hospitalization_history || ""}</div>
            </div>
            <div>
              <span className="font-medium">Family History:</span>
              <div className="border border-gray-300 min-h-[40px] p-2 mt-1">{data.family_history || ""}</div>
            </div>
            <div>
              <span className="font-medium">Mental Health History:</span>
              <div className="border border-gray-300 min-h-[40px] p-2 mt-1">{data.mental_health_history || ""}</div>
            </div>
          </div>
        </section>

        {/* Medications Section */}
        <section className="mb-6">
          <h2 className="font-bold text-lg border-b border-gray-400 mb-3 pb-1">SECTION 3: MEDICATIONS & SUPPLEMENTS</h2>
          <div className="space-y-3">
            <div>
              <span className="font-medium">Current Medications:</span>
              <div className="border border-gray-300 min-h-[40px] p-2 mt-1">{data.ongoing_medications || ""}</div>
            </div>
            <div>
              <span className="font-medium">Supplements:</span>
              <div className="border border-gray-300 min-h-[40px] p-2 mt-1">{data.supplements || ""}</div>
            </div>
            <div>
              <span className="font-medium">Vaccinations:</span>
              <div className="border border-gray-300 min-h-[40px] p-2 mt-1">{data.vaccinations || ""}</div>
            </div>
          </div>
        </section>

        {/* Allergies Section */}
        <section className="mb-6">
          <h2 className="font-bold text-lg border-b border-gray-400 mb-3 pb-1">SECTION 4: ALLERGIES</h2>
          <div className="space-y-3">
            <div>
              <span className="font-medium">Drug Allergies:</span>
              <div className="border border-gray-300 min-h-[30px] p-2 mt-1">{data.allergic_history_drug || ""}</div>
            </div>
            <div>
              <span className="font-medium">Food Allergies:</span>
              <div className="border border-gray-300 min-h-[30px] p-2 mt-1">{data.allergic_history_food || ""}</div>
            </div>
            <div>
              <span className="font-medium">Environmental Allergies:</span>
              <div className="border border-gray-300 min-h-[30px] p-2 mt-1">{data.allergic_history_env || ""}</div>
            </div>
          </div>
        </section>

        {/* Social History Section */}
        <section className="mb-6">
          <h2 className="font-bold text-lg border-b border-gray-400 mb-3 pb-1">SECTION 5: SOCIAL HISTORY</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="font-medium">Smoking Status:</span>
              <span className="flex gap-3 mt-1">
                <label><input type="checkbox" checked={data.smoking_status === "NEVER"} readOnly /> Never</label>
                <label><input type="checkbox" checked={data.smoking_status === "FORMER"} readOnly /> Former</label>
                <label><input type="checkbox" checked={data.smoking_status === "CURRENT"} readOnly /> Current</label>
              </span>
            </div>
            <div>
              <span className="font-medium">Alcohol Consumption:</span>
              <span className="flex gap-2 mt-1 flex-wrap">
                <label><input type="checkbox" checked={data.alcohol_consumption === "NEVER"} readOnly /> Never</label>
                <label><input type="checkbox" checked={data.alcohol_consumption === "OCCASIONAL"} readOnly /> Occasional</label>
                <label><input type="checkbox" checked={data.alcohol_consumption === "MODERATE"} readOnly /> Moderate</label>
                <label><input type="checkbox" checked={data.alcohol_consumption === "HEAVY"} readOnly /> Heavy</label>
              </span>
            </div>
            <div className="flex gap-2">
              <span className="font-medium">Occupation:</span>
              <span className="border-b border-dotted border-gray-400 flex-1">{formatValue(data.occupation)}</span>
            </div>
            <div className="flex gap-2">
              <span className="font-medium">Exercise Habits:</span>
              <span className="border-b border-dotted border-gray-400 flex-1">{formatValue(data.exercise_habits)}</span>
            </div>
            <div className="flex gap-2 col-span-2">
              <span className="font-medium">Diet:</span>
              <span className="border-b border-dotted border-gray-400 flex-1">{formatValue(data.diet)}</span>
            </div>
          </div>
        </section>

        {/* Signature Section */}
        <section className="mt-8 pt-4 border-t-2 border-black">
          <div className="grid grid-cols-2 gap-8">
            <div>
              <p className="font-medium mb-8">Patient Signature:</p>
              <div className="border-b border-black"></div>
            </div>
            <div>
              <p className="font-medium mb-8">Date:</p>
              <div className="border-b border-black"></div>
            </div>
          </div>
        </section>
      </div>
    );
  }
);

PrintablePatientForm.displayName = "PrintablePatientForm";
