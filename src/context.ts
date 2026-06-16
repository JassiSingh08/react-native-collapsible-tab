import { createContext, useContext } from 'react';
import type Animated from 'react-native-reanimated';
import type { AnimatedRef, SharedValue } from 'react-native-reanimated';

/** Minimal handle each tab list registers so the container can sync offsets on tab switch. */
export type TabListHandle = {
  scrollToOffset: (params: { offset: number; animated?: boolean }) => unknown;
};

/**
 * Animated refs are typed against Animated.ScrollView for ergonomics, but any
 * scrollable Reanimated component (Animated.FlatList, animated FlashList, ...)
 * is accepted — Reanimated's scrollTo only needs a scrollable node.
 */
export type TabScrollRef = AnimatedRef<Animated.ScrollView>;

export type CollapsingTabsContextValue = {
  /**
   * One scroll-offset shared value per tab, written by each tab's list.
   * Stable per tab *name*, so adding/removing tabs preserves scroll positions.
   */
  offsets: SharedValue<number>[];
  activeIndexSV: SharedValue<number>;
  /** Name of the focused tab, updated on tab settle. */
  focusedTab: SharedValue<string>;
  /** Continuous pager position (page + offset fraction) for the tab bar indicator. */
  pagerPosition: SharedValue<number>;
  /** Target offset commanded by the header pan gesture / its decay. */
  dragTarget: SharedValue<number>;
  /**
   * Current header collapse in px [0..collapseRange]. Deliberately decoupled
   * from any tab's absolute offset: driven by scroll deltas of the active tab,
   * never moved by tab switches.
   */
  collapse: SharedValue<number>;
  /** collapseRange mirrored into a shared value for UI-thread worklets. */
  collapseRangeSV: SharedValue<number>;
  /** How many px of header collapse (headerHeight - minHeaderHeight). */
  collapseRange: number;
  /** Content padding so list content starts below header + tab bar. */
  paddingTop: number;
  containerHeight: number;
  headerHeight: number;
  tabBarHeight: number;
  /** When true, any upward scroll immediately reveals the header (Twitter-style). */
  revealHeaderOnScroll: boolean;
  registerListRef: (index: number, ref: TabListHandle | null) => void;
  /** Animated scroll-view refs per tab, for UI-thread scrollTo snaps on tab switch. */
  registerScrollRef: (index: number, ref: TabScrollRef | null) => void;
  /**
   * Cancels in-flight header-drag decay / snap animations. Safe to call from
   * either thread; adapters must call it when the user grabs a list directly.
   */
  cancelHeaderAnimations: () => void;
  /**
   * Snaps the header fully open/closed when it rests mid-collapse (no-op
   * unless `snapThreshold` is set). Worklet — adapters call it from scroll
   * handlers on drag/momentum end; safe from the JS thread too.
   */
  maybeSnap: () => void;
};

export const CollapsingTabsContext =
  createContext<CollapsingTabsContextValue | null>(null);

export function useCollapsingTabsContext(): CollapsingTabsContextValue {
  const ctx = useContext(CollapsingTabsContext);
  if (!ctx) {
    throw new Error(
      'Collapsing tabs components must be rendered inside <Tabs.Container>',
    );
  }
  return ctx;
}

export type TabPageContextValue = {
  index: number;
  name: string;
  scrollRef: TabScrollRef;
};

export const TabPageContext = createContext<TabPageContextValue | null>(null);

export function useTabPageContext(): TabPageContextValue {
  const ctx = useContext(TabPageContext);
  if (!ctx) {
    throw new Error(
      'Tab scroll components (Tabs.ScrollView / Tabs.FlatList / ...) must be rendered inside a <Tabs.Tab>',
    );
  }
  return ctx;
}

/**
 * JS-state mirror of the focused tab, kept out of the main context so tab
 * switches don't re-render every consumer of the animated context.
 */
export type ActiveTabContextValue = {
  activeIndex: number;
  tabNames: string[];
};

export const ActiveTabContext = createContext<ActiveTabContextValue | null>(
  null,
);

export function useActiveTabContext(): ActiveTabContextValue {
  const ctx = useContext(ActiveTabContext);
  if (!ctx) {
    throw new Error(
      'Collapsing tabs hooks must be used inside <Tabs.Container>',
    );
  }
  return ctx;
}
