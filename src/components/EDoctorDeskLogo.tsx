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
        "text-primary group",
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
        className="transition-all duration-300 group-hover:fillOpacity-20"
      />
      {/* DNA double helix with hover animation */}
      <g className="origin-center transition-transform duration-500 group-hover:rotate-[360deg]">
        {/* DNA rungs */}
        <path
          d="M8 5C8 5 10 7 12 7C14 7 16 5 16 5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M8 9C8 9 10 11 12 11C14 11 16 9 16 9"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M8 13C8 13 10 15 12 15C14 15 16 13 16 13"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M8 17C8 17 10 19 12 19C14 19 16 17 16 17"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
        />
        {/* DNA vertical strands */}
        <path
          d="M8 5V17"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M16 5V17"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
};

export default EDoctorDeskLogo;
