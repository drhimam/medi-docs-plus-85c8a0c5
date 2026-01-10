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
      {/* Modern rounded square background */}
      <rect
        x="2"
        y="2"
        width="20"
        height="20"
        rx="5"
        fill="currentColor"
        fillOpacity="0.1"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      {/* Medical cross */}
      <path
        d="M12 6V18M6 12H18"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Heartbeat pulse overlay */}
      <path
        d="M6 12L8.5 12L10 9L12 15L14 9L15.5 12L18 12"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
};

export default EDoctorDeskLogo;
