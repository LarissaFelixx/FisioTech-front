import type { ReactNode } from 'react';
import Svg, { Circle, Line, Path, Polyline, Rect } from 'react-native-svg';

/** Ícones de `core/ui/icon/icon.ts` do Angular (mesmos paths SVG, 24×24, traço). */
export type IconName =
  | 'home'
  | 'users'
  | 'calendar'
  | 'chat'
  | 'user'
  | 'briefcase'
  | 'trash'
  | 'plus'
  | 'arrow-left'
  | 'clipboard'
  | 'user-plus'
  | 'menu'
  | 'lock'
  | 'calendar-plus'
  | 'check'
  | 'search'
  | 'chevron-left'
  | 'chevron-right'
  | 'x'
  | 'heart'
  | 'credit-card';

const ICONS: Record<IconName, { strokeWidth: number; body: ReactNode }> = {
  home: {
    strokeWidth: 2,
    body: (
      <>
        <Path d="M3 11l9-8 9 8" />
        <Path d="M5 10v10a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V10" />
      </>
    ),
  },
  users: {
    strokeWidth: 2,
    body: (
      <>
        <Circle cx="9" cy="7" r="3" />
        <Path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
        <Circle cx="17" cy="7" r="2.5" />
        <Path d="M17 13a3.5 3.5 0 0 1 3.5 3.5V21" />
      </>
    ),
  },
  calendar: {
    strokeWidth: 2,
    body: (
      <>
        <Rect x="3" y="5" width="18" height="16" rx="2" />
        <Line x1="3" y1="10" x2="21" y2="10" />
        <Line x1="8" y1="3" x2="8" y2="7" />
        <Line x1="16" y1="3" x2="16" y2="7" />
      </>
    ),
  },
  chat: {
    strokeWidth: 2,
    body: (
      <>
        <Path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z" />
      </>
    ),
  },
  user: {
    strokeWidth: 2,
    body: (
      <>
        <Circle cx="12" cy="8" r="4" />
        <Path d="M4 21v-2a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v2" />
      </>
    ),
  },
  briefcase: {
    strokeWidth: 2,
    body: (
      <>
        <Rect x="3" y="7" width="18" height="13" rx="2" />
        <Path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        <Line x1="3" y1="13" x2="21" y2="13" />
      </>
    ),
  },
  trash: {
    strokeWidth: 2,
    body: (
      <>
        <Polyline points="3 6 5 6 21 6" />
        <Path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
        <Path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
        <Line x1="10" y1="11" x2="10" y2="17" />
        <Line x1="14" y1="11" x2="14" y2="17" />
      </>
    ),
  },
  plus: {
    strokeWidth: 2,
    body: (
      <>
        <Line x1="12" y1="5" x2="12" y2="19" />
        <Line x1="5" y1="12" x2="19" y2="12" />
      </>
    ),
  },
  'arrow-left': {
    strokeWidth: 2,
    body: (
      <>
        <Line x1="19" y1="12" x2="5" y2="12" />
        <Polyline points="12 19 5 12 12 5" />
      </>
    ),
  },
  clipboard: {
    strokeWidth: 2,
    body: (
      <>
        <Rect x="5" y="4" width="14" height="17" rx="2" />
        <Path d="M9 4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1H9V4Z" />
        <Line x1="8" y1="11" x2="16" y2="11" />
        <Line x1="8" y1="15" x2="13" y2="15" />
      </>
    ),
  },
  'user-plus': {
    strokeWidth: 2,
    body: (
      <>
        <Circle cx="9" cy="8" r="4" />
        <Path d="M2 21v-2a5 5 0 0 1 5-5h4a5 5 0 0 1 1.5 0.22" />
        <Line x1="18" y1="9" x2="18" y2="15" />
        <Line x1="15" y1="12" x2="21" y2="12" />
      </>
    ),
  },
  menu: {
    strokeWidth: 2,
    body: (
      <>
        <Line x1="3" y1="6" x2="21" y2="6" />
        <Line x1="3" y1="12" x2="21" y2="12" />
        <Line x1="3" y1="18" x2="21" y2="18" />
      </>
    ),
  },
  lock: {
    strokeWidth: 2,
    body: (
      <>
        <Rect x="5" y="11" width="14" height="10" rx="2" />
        <Path d="M8 11V7a4 4 0 0 1 8 0v4" />
      </>
    ),
  },
  'calendar-plus': {
    strokeWidth: 2,
    body: (
      <>
        <Rect x="3" y="5" width="18" height="16" rx="2" />
        <Line x1="3" y1="10" x2="21" y2="10" />
        <Line x1="8" y1="3" x2="8" y2="7" />
        <Line x1="16" y1="3" x2="16" y2="7" />
        <Line x1="12" y1="14" x2="12" y2="19" />
        <Line x1="9.5" y1="16.5" x2="14.5" y2="16.5" />
      </>
    ),
  },
  check: {
    strokeWidth: 2.5,
    body: (
      <>
        <Polyline points="5 13 10 18 19 7" />
      </>
    ),
  },
  search: {
    strokeWidth: 2,
    body: (
      <>
        <Circle cx="11" cy="11" r="7" />
        <Line x1="21" y1="21" x2="16.65" y2="16.65" />
      </>
    ),
  },
  'chevron-left': {
    strokeWidth: 2,
    body: (
      <>
        <Polyline points="15 6 9 12 15 18" />
      </>
    ),
  },
  'chevron-right': {
    strokeWidth: 2,
    body: (
      <>
        <Polyline points="9 6 15 12 9 18" />
      </>
    ),
  },
  x: {
    strokeWidth: 2,
    body: (
      <>
        <Line x1="18" y1="6" x2="6" y2="18" />
        <Line x1="6" y1="6" x2="18" y2="18" />
      </>
    ),
  },
  heart: {
    strokeWidth: 2,
    body: (
      <>
        <Path d="M12 21s-7.5-4.9-10-9.3C.4 8.3 2 4.5 5.6 4a4.9 4.9 0 0 1 6.4 2.3A4.9 4.9 0 0 1 18.4 4c3.6.5 5.2 4.3 3.6 7.7C19.5 16.1 12 21 12 21Z" />
      </>
    ),
  },
  'credit-card': {
    strokeWidth: 2,
    body: (
      <>
        <Rect x="2" y="5" width="20" height="14" rx="2" />
        <Line x1="2" y1="10" x2="22" y2="10" />
      </>
    ),
  },
};

type Props = {
  name: IconName;
  size?: number;
  color: string;
  testID?: string;
};

export function Icon({ name, size = 20, color, testID }: Props) {
  const icon = ICONS[name];
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={icon.strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      testID={testID}
    >
      {icon.body}
    </Svg>
  );
}

export const ICON_NAMES = Object.keys(ICONS) as IconName[];
