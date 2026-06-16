import { useDerivedValue, type SharedValue } from 'react-native-reanimated';
import {
  useActiveTabContext,
  useCollapsingTabsContext,
  useTabPageContext,
} from './context';

/**
 * Header collapse in px (0 = fully expanded .. collapseRange), as a read-only
 * derived value. Drives header animations (parallax, fade, ...). Note it
 * tracks the HEADER, not any tab's raw offset: since collapse is decoupled
 * from per-tab offsets, a deep-scrolled tab can be active while the header
 * is expanded.
 */
export function useHeaderScrollY(): SharedValue<number> {
  const { collapse } = useCollapsingTabsContext();
  return useDerivedValue(() => collapse.value, [collapse]);
}

/** Header collapse normalized to 0 (expanded) .. 1 (collapsed). */
export function useCollapseProgress(): SharedValue<number> {
  const { collapse, collapseRangeSV } = useCollapsingTabsContext();
  return useDerivedValue(() => {
    const range = collapseRangeSV.value;
    return range > 0 ? Math.min(collapse.value / range, 1) : 0;
  }, [collapse, collapseRangeSV]);
}

/**
 * Compatible with react-native-collapsible-tab-view's hook of the same name:
 * `top` is the header's animated translateY (0 .. -collapseRange), `height`
 * its measured height.
 */
export function useHeaderMeasurements(): {
  top: SharedValue<number>;
  height: number;
} {
  const { collapse, collapseRangeSV, headerHeight } =
    useCollapsingTabsContext();
  const top = useDerivedValue(
    () => -Math.min(collapse.value, collapseRangeSV.value),
    [collapse, collapseRangeSV],
  );
  return { top, height: headerHeight };
}

/**
 * Raw scroll offset of the tab this hook is rendered inside.
 * Mirrors react-native-collapsible-tab-view's useCurrentTabScrollY.
 */
export function useCurrentTabScrollY(): SharedValue<number> {
  const { offsets } = useCollapsingTabsContext();
  const { index } = useTabPageContext();
  return useDerivedValue(() => offsets[index]?.value ?? 0, [offsets, index]);
}

/**
 * Raw scroll offset of whichever tab is focused — usable outside tab
 * content (e.g. in the header or tab bar).
 */
export function useActiveTabScrollY(): SharedValue<number> {
  const { offsets, activeIndexSV } = useCollapsingTabsContext();
  return useDerivedValue(() => {
    const sv = offsets[Math.round(activeIndexSV.value)];
    return sv ? sv.value : 0;
  }, [offsets, activeIndexSV]);
}

/** Name of the focused tab as a shared value (updates on tab settle). */
export function useFocusedTab(): SharedValue<string> {
  const { focusedTab } = useCollapsingTabsContext();
  return useDerivedValue(() => focusedTab.value, [focusedTab]);
}

/** Continuous pager position (fractional during swipes) as a shared value. */
export function useAnimatedTabIndex(): SharedValue<number> {
  const { pagerPosition } = useCollapsingTabsContext();
  return useDerivedValue(() => pagerPosition.value, [pagerPosition]);
}

/** JS-state focus check for the named tab (re-renders on tab switch). */
export function useIsTabFocused(name: string): boolean {
  const { activeIndex, tabNames } = useActiveTabContext();
  return tabNames[activeIndex] === name;
}

/** JS-state focused tab index (re-renders on tab switch). */
export function useTabIndex(): number {
  const { activeIndex } = useActiveTabContext();
  return activeIndex;
}
