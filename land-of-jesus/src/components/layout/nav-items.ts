import { BookOpen, Compass, HandHeart, House, MapPin, type LucideIcon } from 'lucide-react';

export type NavKey = 'home' | 'explore' | 'projects' | 'stories' | 'visit';

export interface NavItem {
  href: string;
  /** Key in the `Navigation` messages. */
  key: NavKey;
  icon: LucideIcon;
  /** Other path prefixes that belong to this destination. */
  also?: readonly string[];
}

/** Primary destinations (existing routes only), shared by TopBar and BottomTabBar. */
export const NAV_ITEMS: readonly NavItem[] = [
  { href: '/', key: 'home', icon: House },
  { href: '/explore', key: 'explore', icon: Compass, also: ['/churches'] },
  { href: '/projects', key: 'projects', icon: HandHeart },
  { href: '/stories', key: 'stories', icon: BookOpen },
  { href: '/visit', key: 'visit', icon: MapPin },
];

/** Is `item` the active destination for a locale-less pathname such as "/churches/x"? */
export function isActivePath(pathname: string, item: Pick<NavItem, 'href' | 'also'>): boolean {
  if (item.href === '/') return pathname === '/';
  return [item.href, ...(item.also ?? [])].some((p) => pathname === p || pathname.startsWith(`${p}/`));
}
