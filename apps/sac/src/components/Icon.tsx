import type { CSSProperties } from 'react';
import Dashboard from '@slate/ui/assets/icons/Dashboard.svg';
import Campaign from '@slate/ui/assets/icons/Campaign.svg';
import CampaignApproval from '@slate/ui/assets/icons/CampaignApproval.svg';
import Content from '@slate/ui/assets/icons/Content.svg';
import Movies from '@slate/ui/assets/icons/Movies.svg';
import List from '@slate/ui/assets/icons/List.svg';
import Reports from '@slate/ui/assets/icons/Reports.svg';
import MultipleUsers from '@slate/ui/assets/icons/MultipleUsers.svg';
import Settings from '@slate/ui/assets/icons/Settings.svg';
import Hamburger from '@slate/ui/assets/icons/Hamburger.svg';
import ChevronLeft from '@slate/ui/assets/icons/ChevronLeft.svg';
import ChevronRight from '@slate/ui/assets/icons/ChevronRight.svg';

const ICONS: Record<string, string> = {
  Dashboard, Campaign, CampaignApproval, Content, Movies, List, Reports,
  MultipleUsers, Settings, Hamburger, ChevronLeft, ChevronRight
};

export interface IconProps {
  name: keyof typeof ICONS | string;
  size?: number;
  color?: string;
  style?: CSSProperties;
}

/**
 * Renders an icon as a CSS-masked <span>, matching the original
 * `mask: url(assets/icons/X.svg) center / contain no-repeat; background: currentColor`
 * technique — lets the icon be recolored per active/inactive nav state.
 */
export function Icon({ name, size = 20, color, style }: IconProps) {
  const url = ICONS[name];
  if (!url) return null;
  const maskValue = `url("${url}") center / contain no-repeat`;
  return (
    <span
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        flex: '0 0 auto',
        background: color || 'currentColor',
        WebkitMask: maskValue,
        mask: maskValue,
        ...style
      }}
    />
  );
}
