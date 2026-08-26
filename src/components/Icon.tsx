import type { CSSProperties } from 'react';
import Dashboard from '../assets/icons/Dashboard.svg';
import Campaign from '../assets/icons/Campaign.svg';
import CampaignApproval from '../assets/icons/CampaignApproval.svg';
import Content from '../assets/icons/Content.svg';
import Movies from '../assets/icons/Movies.svg';
import List from '../assets/icons/List.svg';
import Reports from '../assets/icons/Reports.svg';
import MultipleUsers from '../assets/icons/MultipleUsers.svg';
import Settings from '../assets/icons/Settings.svg';
import Hamburger from '../assets/icons/Hamburger.svg';
import ChevronLeft from '../assets/icons/ChevronLeft.svg';
import ChevronRight from '../assets/icons/ChevronRight.svg';

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
  const maskValue = `url(${url}) center / contain no-repeat`;
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
