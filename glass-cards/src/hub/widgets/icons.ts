import { svg, type TemplateResult } from 'lit';

const wrap = (body: TemplateResult): TemplateResult => svg`
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
    ${body}
  </svg>
`;

export const icons: Record<string, TemplateResult> = {
  lamp: wrap(svg`
    <path d="M12 3a6 6 0 0 0-4 10.4c.6.6 1 1.4 1 2.3v.3h6v-.3c0-.9.4-1.7 1-2.3A6 6 0 0 0 12 3z"></path>
    <path d="M10 19h4M10.5 21.5h3"></path>
  `),
  bolt: wrap(svg`
    <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8z"></path>
  `),
  home: wrap(svg`
    <path d="M3 11.5 12 4l9 7.5"></path>
    <path d="M5.5 10v9.5a1 1 0 0 0 1 1H9a1 1 0 0 0 1-1V15a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4.5a1 1 0 0 0 1 1h2.5a1 1 0 0 0 1-1V10"></path>
  `),
  vacuum: wrap(svg`
    <circle cx="12" cy="12" r="8"></circle>
    <circle cx="12" cy="12" r="2.2"></circle>
    <path d="M12 4v2M4 12h2M18 12h2M12 20v-2"></path>
  `),
  train: wrap(svg`
    <rect x="5" y="4" width="14" height="13" rx="4"></rect>
    <path d="M5 12h14"></path>
    <path d="M8 20l-1.5 2M16 20l1.5 2"></path>
    <circle cx="9" cy="17.5" r="0.9" fill="currentColor" stroke="none"></circle>
    <circle cx="15" cy="17.5" r="0.9" fill="currentColor" stroke="none"></circle>
  `),
  bus: wrap(svg`
    <rect x="4" y="4" width="16" height="13" rx="2.5"></rect>
    <path d="M4 12h16"></path>
    <path d="M4 8.5h16"></path>
    <path d="M7 20l-1 2M17 20l1 2"></path>
    <circle cx="8" cy="14.5" r="0.9" fill="currentColor" stroke="none"></circle>
    <circle cx="16" cy="14.5" r="0.9" fill="currentColor" stroke="none"></circle>
  `),
  note: wrap(svg`
    <circle cx="7" cy="18" r="2.3"></circle>
    <circle cx="16" cy="16" r="2.3"></circle>
    <path d="M9.3 18V5.5L18.3 4v11.5"></path>
  `),
  ring: wrap(svg`
    <path d="M14.7 4.5A8 8 0 0 1 12 20 8 8 0 0 1 9.3 4.5"></path>
  `),
  sun: wrap(svg`
    <circle cx="12" cy="12" r="4"></circle>
    <path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"></path>
  `),
  moon: wrap(svg`
    <path d="M20 14.5A8 8 0 0 1 9.5 4 6.5 6.5 0 1 0 20 14.5z"></path>
  `),
  power: wrap(svg`
    <path d="M12 3v8.5"></path>
    <path d="M6.7 6.9a8 8 0 1 0 10.6 0"></path>
  `),
  play: wrap(svg`
    <path d="M7 4.5v15l13-7.5-13-7.5z"></path>
  `),
  pause: wrap(svg`
    <rect x="7" y="5" width="3.5" height="14" rx="1"></rect>
    <rect x="13.5" y="5" width="3.5" height="14" rx="1"></rect>
  `),
  prev: wrap(svg`
    <path d="M18.5 5.5v13L9 12l9.5-6.5z"></path>
    <path d="M6 5v14"></path>
  `),
  next: wrap(svg`
    <path d="M5.5 5.5v13L15 12 5.5 5.5z"></path>
    <path d="M18 5v14"></path>
  `),
  speaker: wrap(svg`
    <rect x="6" y="3" width="12" height="18" rx="3"></rect>
    <circle cx="12" cy="14" r="3.2"></circle>
    <circle cx="12" cy="6.5" r="0.9" fill="currentColor" stroke="none"></circle>
  `),
  sofa: wrap(svg`
    <path d="M5 11V8a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v3"></path>
    <rect x="3" y="11" width="18" height="6" rx="2"></rect>
    <path d="M5 17v2M19 17v2"></path>
  `),
  pot: wrap(svg`
    <path d="M4 10h16"></path>
    <path d="M5 10v6a3 3 0 0 0 3 3h8a3 3 0 0 0 3-3v-6"></path>
    <path d="M2 10h2M20 10h2"></path>
    <path d="M9 10V7a3 3 0 0 1 6 0v3"></path>
  `),
  bed: wrap(svg`
    <path d="M3 18v-6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6"></path>
    <path d="M3 15h18"></path>
    <path d="M3 18v2M21 18v2"></path>
    <rect x="5" y="10" width="6" height="4" rx="1"></rect>
  `),
  door: wrap(svg`
    <rect x="6" y="3" width="12" height="18" rx="1"></rect>
    <circle cx="14.5" cy="12" r="0.8" fill="currentColor" stroke="none"></circle>
  `),
  desk: wrap(svg`
    <path d="M3 7h18v3H3z"></path>
    <path d="M5 10v9M19 10v9"></path>
  `),
  shower: wrap(svg`
    <path d="M8 4a5 5 0 0 1 9 3"></path>
    <path d="M5 9h14"></path>
    <path d="M7 12v2M11 12v2M15 12v2M19 12v2"></path>
    <path d="M7 17v2M11 17v2M15 17v2"></path>
  `),
  leaf: wrap(svg`
    <path d="M4 20c0-8 6-14 16-15C19 13 13 20 5 20a4 4 0 0 1-1 0z"></path>
    <path d="M4 20c3-5 7-8 12-9.5"></path>
  `),
  clock: wrap(svg`
    <circle cx="12" cy="12" r="8.5"></circle>
    <path d="M12 7.5V12l3 2"></path>
  `),
  expand: wrap(svg`
    <path d="M8 4H5a1 1 0 0 0-1 1v3"></path>
    <path d="M16 4h3a1 1 0 0 1 1 1v3"></path>
    <path d="M8 20H5a1 1 0 0 1-1-1v-3"></path>
    <path d="M16 20h3a1 1 0 0 0 1-1v-3"></path>
  `),
  compress: wrap(svg`
    <path d="M4 8h3a1 1 0 0 0 1-1V4"></path>
    <path d="M20 8h-3a1 1 0 0 1-1-1V4"></path>
    <path d="M4 16h3a1 1 0 0 1 1 1v3"></path>
    <path d="M20 16h-3a1 1 0 0 1-1 1v3"></path>
  `),
};
