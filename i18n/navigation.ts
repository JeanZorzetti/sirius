/**
 * Wrappers de navegação do next-intl.
 * Use estes em vez dos imports nativos do Next.js:
 *   - `Link` → de '@/i18n/navigation'
 *   - `redirect` → de '@/i18n/navigation'
 *   - `usePathname` → de '@/i18n/navigation'
 *   - `useRouter` → de '@/i18n/navigation'
 */
import { createNavigation } from 'next-intl/navigation';
import { routing } from './routing';

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
