import { cn } from "@/lib/utils";

interface EDoctorDeskLogoProps {
  className?: string;
  animate?: boolean;
}

export const EDoctorDeskLogo = ({ className, animate = false }: EDoctorDeskLogoProps) => {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(
        "text-primary",
        animate && "animate-pulse",
        className
      )}
    >
      {/* Simple stethoscope icon */}
      <path
        d="M4.5 4.5C4.5 3.67 5.17 3 6 3C6.83 3 7.5 3.67 7.5 4.5V10C7.5 12.48 9.52 14.5 12 14.5C14.48 14.5 16.5 12.48 16.5 10V4.5C16.5 3.67 17.17 3 18 3C18.83 3 19.5 3.67 19.5 4.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle
        cx="12"
        cy="18"
        r="3"
        stroke="currentColor"
        strokeWidth="2"
        fill="currentColor"
        fillOpacity="0.2"
      />
      <path
        d="M12 14.5V15"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
};

export default EDoctorDeskLogo;
