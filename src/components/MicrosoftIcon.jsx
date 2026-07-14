import React from "react";

export default function MicrosoftIcon({ className = "w-5 h-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M11.4 11.4H2V2h9.4v9.4z" fill="#F25022" />
      <path d="M22 11.4h-9.4V2H22v9.4z" fill="#7FBA00" />
      <path d="M11.4 22H2v-9.4h9.4V22z" fill="#00A4EF" />
      <path d="M22 22h-9.4v-9.4H22V22z" fill="#FFB900" />
    </svg>
  );
}