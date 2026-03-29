export const IcoCheck = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M2.5 7L5.5 10L11.5 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const IcoChevron = ({ open }) => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
       style={{ transform:open?"rotate(180deg)":"none", transition:"transform .2s" }}>
    <path d="M3 5L7 9L11 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const IcoUpload = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="M10 3v10M6 7l4-4 4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M3 14v1a2 2 0 002 2h10a2 2 0 002-2v-1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
);

export const IcoSpinner = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="spinner">
    <circle cx="8" cy="8" r="6" stroke="rgba(255,255,255,0.2)" strokeWidth="2"/>
    <path d="M8 2a6 6 0 016 6" stroke="white" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

export const IcoExcel = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <rect x="1" y="1" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.4"/>
    <path d="M5 5l2 3-2 3M8 11h3M9.5 8h2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
  </svg>
);

export const IcoPdf = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <rect x="1" y="1" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.4"/>
    <path d="M4 9.5c0 .8.6 1.5 1.5 1.5S7 10.3 7 9.5 6.4 8 5.5 8H4V12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M9 8h1a1.5 1.5 0 010 3H9V8z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 8v4M11 8h2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
  </svg>
);

export const IcoArrow = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const IcoBack = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M13 8H3M7 12l-4-4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
