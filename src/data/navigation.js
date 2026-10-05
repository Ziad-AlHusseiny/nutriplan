// Site navigation (PRD §2.1, plus Shopping and Your data: BUILD-LOG).

import { CalendarDays, Calculator, House, ShoppingBasket, UtensilsCrossed } from 'lucide-react';

export const navLinks = [
  { id: 'home', to: '/', icon: House, end: true },
  { id: 'recipes', to: '/recipes', icon: UtensilsCrossed },
  { id: 'planner', to: '/planner', icon: CalendarDays },
  { id: 'shopping', to: '/shopping', icon: ShoppingBasket },
  { id: 'calculator', to: '/calculator', icon: Calculator },
];

/** The phone tab bar: the four tools (Home is the logo). */
export const tabLinks = navLinks.filter((l) => l.id !== 'home');

export const footerLinks = [...navLinks, { id: 'privacy', to: '/privacy' }];

export const HELPLINE_URL = 'https://findahelpline.com';
export const GITHUB_URL = 'https://github.com/Ziad-AlHusseiny';
export const SOURCE_URL = 'https://github.com/Ziad-AlHusseiny/front-end-portfolio/tree/main/nutriplan';
