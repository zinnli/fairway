/**
 * 아이콘 정본 — 10_디자인.html의 인라인 SVG 38종에서 추출.
 * 규격: 20×20 viewBox · 선 굵기 1.5 · 색은 currentColor (00 문서 3-5).
 * 아이콘 라이브러리를 쓰지 말 것. 규격이 달라 화면이 미묘하게 어긋난다.
 */
import type { SVGProps } from 'react';

const P = {
  shield:       'M10 2.5L16.5 5V9.5C16.5 13.3 13.9 16.8 10 17.9C6.1 16.8 3.5 13.3 3.5 9.5V5L10 2.5Z',
  chevronRight: 'M8 5.5L12.5 10L8 14.5',
  chevronDown:  'M5.5 8L10 12.5L14.5 8',
  chevronUp:    'M5.5 12.5L10 8L14.5 12.5',
  plus:         'M10 4.5V15.5M4.5 10H15.5',
  close:        'M5.5 5.5L14.5 14.5M14.5 5.5L5.5 14.5',
  check:        'M4.5 10.5L8.5 14L15.5 6.5',
  checkSmall:   'M4.5 9.5L7.5 12.5L13.5 6',
  arrowUp:      'M10 15.5V4.5M5 9.5L10 4.5L15 9.5',
  arrowDown:    'M10 4.5V15.5M5 10.5L10 15.5L15 10.5',
  arrowRight:   'M4.5 10H15.5M10.5 5L15.5 10L10.5 15',
  menu:         'M3.5 6.5H16.5M3.5 10H16.5M3.5 13.5H16.5',
  pencil:       'M13.6 3.4L16.6 6.4L7.4 15.6H4.4V12.6L13.6 3.4Z',
  pencilAlt:    'M14 3.5L16.5 6L7.5 15L4 16L5 12.5L14 3.5Z',
  play:         'M7.5 5.5L14.5 10L7.5 14.5Z',
  download:     'M10 4V15M4.5 10.5L10 16L15.5 10.5',
  paperclip:    'M13.5 6.5L7.4 12.6C6.6 13.4 6.6 14.6 7.4 15.4C8.2 16.2 9.4 16.2 10.2 15.4L16.3 9.3C17.8 7.8 17.8 5.4 16.3 3.9C14.8 2.4 12.4 2.4 10.9 3.9L4.8 10C2.7 12.1 2.7 15.5 4.8 17.6',
} as const;

const MULTI = {
  file: ['M11.5 2.5H5.5C4.4 2.5 3.5 3.4 3.5 4.5V15.5C3.5 16.6 4.4 17.5 5.5 17.5H14.5C15.6 17.5 16.5 16.6 16.5 15.5V7.5L11.5 2.5Z', 'M11.5 2.5V7.5H16.5'],
  logout: ['M7.5 17.5H4.5C3.4 17.5 2.5 16.6 2.5 15.5V4.5C2.5 3.4 3.4 2.5 4.5 2.5H7.5', 'M13 6.5L16.5 10L13 13.5M16.5 10H7'],
  retry: ['M3.5 10C3.5 6.4 6.4 3.5 10 3.5C13.6 3.5 16.5 6.4 16.5 10C16.5 13.6 13.6 16.5 10 16.5C7.8 16.5 5.9 15.4 4.7 13.8', 'M3.5 16V12.5H7'],
  video: ['M3.5 6.5C3.5 5.4 4.4 4.5 5.5 4.5H11.5C12.6 4.5 13.5 5.4 13.5 6.5V13.5C13.5 14.6 12.6 15.5 11.5 15.5H5.5C4.4 15.5 3.5 14.6 3.5 13.5V6.5Z', 'M13.5 8.5L16.5 6.5V13.5L13.5 11.5'],
  send: ['M17.5 2.5L9.5 10.5', 'M17.5 2.5L12.5 17.5L9.5 10.5L2.5 7.5L17.5 2.5Z'],
  scale: ['M10 3.5V16.5M7 16.5H13', 'M4.5 6H15.5', 'M4.5 6L2.5 10.5C2.5 11.6 3.4 12.5 4.5 12.5C5.6 12.5 6.5 11.6 6.5 10.5L4.5 6Z', 'M15.5 6L13.5 10.5C13.5 11.6 14.4 12.5 15.5 12.5C16.6 12.5 17.5 11.6 17.5 10.5L15.5 6Z'],
} as const;

const CIRCLED = {
  clock:       'M10 6V10L12.5 12',
  checkCircle: 'M7 10.5L9 12.5L13 8',
} as const;

export type IconName =
  | keyof typeof P | keyof typeof MULTI | keyof typeof CIRCLED | 'more';

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'name'> {
  name: IconName;
  /** 보이는 크기. 터치 영역은 감싼 버튼이 책임진다 (모바일 44 / PC 32) */
  size?: number;
  strokeWidth?: number;
}

export function Icon({ name, size = 20, strokeWidth = 1.5, ...rest }: IconProps) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 20 20',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
    focusable: false,
    style: { display: 'block', flex: '0 0 auto' },
    ...rest,
  };

  if (name === 'more') {
    return (
      <svg {...common} stroke="none">
        <circle cx="4.5" cy="10" r="1.4" fill="currentColor" />
        <circle cx="10" cy="10" r="1.4" fill="currentColor" />
        <circle cx="15.5" cy="10" r="1.4" fill="currentColor" />
      </svg>
    );
  }
  if (name in CIRCLED) {
    return (
      <svg {...common}>
        <circle cx="10" cy="10" r="7.5" />
        <path d={CIRCLED[name as keyof typeof CIRCLED]} />
      </svg>
    );
  }
  if (name in MULTI) {
    return (
      <svg {...common}>
        {MULTI[name as keyof typeof MULTI].map((d) => <path key={d} d={d} />)}
      </svg>
    );
  }
  return <svg {...common}><path d={P[name as keyof typeof P]} /></svg>;
}
