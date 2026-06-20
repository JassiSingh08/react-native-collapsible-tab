import React, { useEffect, useMemo, type ReactNode } from 'react';
import {
  scrollTo,
  useAnimatedReaction,
  useAnimatedRef,
} from 'react-native-reanimated';
import type Animated from 'react-native-reanimated';
import {
  TabPageContext,
  useCollapsingTabsContext,
  type TabPageContextValue,
} from './context';

// Resolved once; Container already guards windowed against this being present,
// so by the time `windowed` is true here, Activity is guaranteed defined.
const Activity:
  | React.ComponentType<{ mode: 'visible' | 'hidden'; children: ReactNode }>
  | undefined =
  (React as unknown as { Activity?: never }).Activity ??
  (React as unknown as { unstable_Activity?: never }).unstable_Activity;

type TabPageProps = {
  index: number;
  name: string;
  /** False while a lazy tab hasn't been focused yet — renders the placeholder instead. */
  mount: boolean;
  /** Container has an active windowConfig (and <Activity> is available). */
  windowed: boolean;
  /** Whether this tab is inside the live window. Only meaningful when windowed. */
  active: boolean;
  placeholder?: ReactNode;
  children: ReactNode;
};

/**
 * Per-tab wrapper. Owns the animated ref to the tab's scroll view so the
 * header pan gesture (which writes `dragTarget`) can drive this list via
 * scrollTo entirely on the UI thread.
 */
export function TabPage({
  index,
  name,
  mount,
  windowed,
  active,
  placeholder,
  children,
}: TabPageProps) {
  const {
    dragTarget,
    activeIndexSV,
    offsets,
    collapse,
    collapseRangeSV,
    revealHeaderOnScroll,
    registerScrollRef,
  } = useCollapsingTabsContext();
  const scrollRef = useAnimatedRef<Animated.ScrollView>();

  useEffect(() => {
    if (!mount) return;
    registerScrollRef(index, scrollRef);
    return () => registerScrollRef(index, null);
  }, [registerScrollRef, index, scrollRef, mount]);

  useAnimatedReaction(
    () => dragTarget.value,
    (target, prev) => {
      if (prev === null || target === prev) return;
      if (Math.round(activeIndexSV.value) !== index) return;
      scrollTo(scrollRef, 0, target, false);
    },
    [index],
  );

  // Collapse rule, applied to scroll deltas of the active tab only:
  // scrolling down collapses the header; scrolling up either reveals it
  // immediately (revealHeaderOnScroll) or keeps it put until the content
  // rises back up to it (offset < collapse), then expands in sync.
  // Tab switches never move the header — the inactive guard skips the offset
  // jump produced by syncTab snaps (which always land before activeIndex flips).
  useAnimatedReaction(
    () => offsets[index]?.value ?? 0,
    (curr, prev) => {
      if (prev === null || curr === prev) return;
      if (Math.round(activeIndexSV.value) !== index) return;
      // Clamp at 0 so iOS top-bounce rebounds don't read as scroll-down.
      const offset = Math.max(curr, 0);
      const delta = offset - Math.max(prev, 0);
      if (delta > 0) {
        collapse.value = Math.min(
          collapse.value + delta,
          collapseRangeSV.value,
        );
      } else if (delta < 0) {
        if (revealHeaderOnScroll) {
          collapse.value = Math.max(collapse.value + delta, 0);
        } else {
          collapse.value = Math.max(Math.min(collapse.value, offset), 0);
        }
      }
    },
    [index, offsets, revealHeaderOnScroll],
  );

  const value = useMemo<TabPageContextValue>(
    () => ({ index, name, scrollRef }),
    [index, name, scrollRef],
  );

  return (
    <TabPageContext.Provider value={value}>
      {!mount ? (
        (placeholder ?? null)
      ) : windowed && Activity ? (
        <Activity mode={active ? 'visible' : 'hidden'}>{children}</Activity>
      ) : (
        children
      )}
    </TabPageContext.Provider>
  );
}
