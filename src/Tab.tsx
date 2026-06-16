import type { ReactNode } from 'react';

export type TabProps = {
  /**
   * Stable identity for this tab. Used for scroll-position memory and
   * `jumpToTab` — never displayed when `label` is set, so non-ASCII or
   * localized text belongs in `label`, not here.
   */
  name: string;
  /** Display text for the tab bar. Defaults to `name`. */
  label?: string;
  /** Per-tab override of the container's `lazy` prop. */
  lazy?: boolean;
  /** When this tab is focused, disables pager swiping (e.g. for horizontal carousels inside). */
  swipeEnabled?: boolean;
  children: ReactNode;
};

/** Declarative marker — never rendered itself; the container extracts its children. */
export function Tab(_props: TabProps) {
  return null;
}
