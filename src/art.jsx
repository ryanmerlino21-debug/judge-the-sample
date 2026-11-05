import React from "react";

const HEART = "M12 21s-7-4.35-9.33-8.5C.8 9.1 2.6 5 6.3 5c2 0 3.2 1 3.7 2 .5-1 1.7-2 3.7-2 3.7 0 5.5 4.1 3.63 7.5C19 16.65 12 21 12 21z";

// Decorative healthcare-cost illustration for the banner.
export function BannerArt() {
  return (
    <svg viewBox="0 0 340 190" aria-hidden="true" className="art">
      <circle cx="170" cy="96" r="84" fill="#fff" opacity=".12" />
      <circle cx="170" cy="96" r="58" fill="#fff" opacity=".12" />
      <g transform="translate(110 36) scale(5)"><path d={HEART} fill="#ff6b81" /></g>
      <polyline points="40,100 110,100 130,100 142,66 158,138 174,84 186,104 300,104" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <g transform="translate(262 30) rotate(28)"><rect width="24" height="62" rx="12" fill="#fff" /><rect width="24" height="31" rx="12" fill="#ffd166" /></g>
      <g transform="translate(26 24)"><circle r="22" cx="22" cy="22" fill="#ffd166" /><circle r="17" cx="22" cy="22" fill="none" stroke="#e0a526" strokeWidth="2" /><text x="22" y="30" textAnchor="middle" fontSize="22" fontWeight="800" fill="#9a6a00" fontFamily="system-ui">$</text></g>
      <g transform="translate(270 128)"><rect width="46" height="46" rx="12" fill="#fff" opacity=".95" /><rect x="19" y="9" width="8" height="28" rx="3" fill="#2dd4bf" /><rect x="9" y="19" width="28" height="8" rx="3" fill="#2dd4bf" /></g>
      <g transform="translate(34 128)" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round"><path d="M8 4v18a14 14 0 0 0 28 0V4" /><circle cx="46" cy="32" r="7" fill="#fff" /><path d="M36 22q10 0 10 10" /></g>
    </svg>
  );
}
