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
      {/* Stethoscope head (circular part) */}
      <circle
        cx="8"
        cy="16"
        r="3"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />
      {/* Stethoscope tubing */}
      <path
        d="M11 16C11 16 13 16 14 14C15 12 15 8 15 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M5 16C5 16 3 16 2 14C1 12 1 8 1 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      {/* Ear pieces */}
      <circle cx="15" cy="5" r="1.5" fill="currentColor" />
      <circle cx="1" cy="5" r="1.5" fill="currentColor" />
      {/* Digital/E element - representing electronic */}
      <rect
        x="17"
        y="8"
        width="6"
        height="8"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />
      {/* E letter inside the screen */}
      <path
        d="M19 10H21.5M19 12H21M19 14H21.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Heart pulse line connecting stethoscope to digital */}
      <path
        d="M8 13L9 11L10 13L11.5 9L13 13"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default EDoctorDeskLogo;
