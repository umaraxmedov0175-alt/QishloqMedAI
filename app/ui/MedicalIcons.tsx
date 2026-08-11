import type { SVGProps } from "react";
export { EMERGENCY_MARKER_SVG_HTML, NEAREST_HOSPITAL_SVG_HTML } from "@/lib/medical-icon-constants";

export function EmergencyMarkerIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <circle cx="24" cy="24" r="20" fill="#EF4444" fillOpacity="0.2"/>
      <circle cx="24" cy="24" r="12" fill="#DC2626"/>
      <path d="M24 16V26M24 30H24.01" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  );
}

export function MobileLabBadgeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <rect width="32" height="32" rx="8" fill="#0EA5E9"/>
      <path d="M8 20V11C8 9.89543 8.89543 9 10 9H18L22 13V20M8 20H24M8 20C8 21.1046 8.89543 22 10 22C11.1046 22 12 21.1046 12 20M24 20C24 21.1046 23.1046 22 22 22C20.8954 22 20 21.1046 20 20" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M14 13H16M15 12V14" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

export function NearestHospitalIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <rect width="32" height="32" rx="8" fill="#10B981"/>
      <path d="M16 8V24M8 16H24" stroke="white" strokeWidth="3" strokeLinecap="round"/>
    </svg>
  );
}

export function InnerChatIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <rect width="40" height="40" rx="10" fill="#0F172A"/>
      <path d="M12 15C12 13.3431 13.3431 12 15 12H25C26.6569 12 28 13.3431 28 15V22C28 23.6569 26.6569 25 25 25H18L13 28V25C12.4477 25 12 24.5523 12 24V15Z" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="17" cy="18.5" r="1" fill="#38BDF8"/>
      <circle cx="20" cy="18.5" r="1" fill="#38BDF8"/>
      <circle cx="23" cy="18.5" r="1" fill="#38BDF8"/>
    </svg>
  );
}

export function DispatchLauncherIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <rect width="56" height="56" rx="16" fill="url(#paint0_linear_launcher)"/>
      <path d="M28 18V38M18 28H38" stroke="white" strokeWidth="3.5" strokeLinecap="round"/>
      <defs>
        <linearGradient id="paint0_linear_launcher" x1="0" y1="0" x2="56" y2="56" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2563EB"/>
          <stop offset="1" stopColor="#1D4ED8"/>
        </linearGradient>
      </defs>
    </svg>
  );
}
