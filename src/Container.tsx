import React, {
  Children,
  forwardRef,
  isValidElement,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';
import {
  StyleSheet,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import PagerView from 'react-native-pager-view';
import Animated, {
  cancelAnimation,
  makeMutable,
  runOnUI,
  scrollTo,
  useAnimatedStyle,
  useSharedValue,
  withDecay,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import {
  ActiveTabContext,
  CollapsingTabsContext,
  type ActiveTabContextValue,
  type CollapsingTabsContextValue,
  type TabListHandle,
  type TabScrollRef,
} from './context';
import type { TabProps } from './Tab';
import { DefaultTabBar } from './TabBar';
import { TabPage } from './TabPage';
import { usePagerScrollHandler } from './usePagerScrollHandler';

const AnimatedPagerView = Animated.createAnimatedComponent(PagerView);

const SNAP_TIMING = { duration: 250 };

export type TabBarRenderProps = {
  tabNames: string[];
  /** Display labels keyed by tab name (falls back to the name itself). */
  tabLabels: Record<string, string>;
  focusedTab: SharedValue<string>;
  /** Continuous pager position (fractional during swipes). */
  indexDecimal: SharedValue<number>;
  /** React-state mirror of the focused tab index. */
  activeIndex: number;
  onTabPress: (name: string) => void;
};

export type TabChangeEvent = {
  prevIndex: number;
  index: number;
  prevTabName: string;
  tabName: string;
};

export type CollapsingTabsRef = {
  /** Switch to a tab by name. */
  jumpToTab: (name: string, animated?: boolean) => void;
  /** Switch to a tab by index. */
  setIndex: (index: number, animated?: boolean) => void;
  getFocusedTab: () => string;
  getCurrentIndex: () => number;
  /** Scroll the focused tab to the top (expands the header). */
  scrollToTop: (animated?: boolean) => void;
  /** Reset every tab's scroll position and expand the header. */
  scrollAllToTop: () => void;
};

export type ContainerProps = {
  /** Omit for a plain pinned tab bar with no collapsible header. */
  renderHeader?: () => ReactNode;
  renderTabBar?: (props: TabBarRenderProps) => ReactNode;
  /** Header px that stays visible when fully collapsed (e.g. safe-area top). */
  minHeaderHeight?: number;
  /**
   * Solid backing behind header + tab bar. Since collapse is decoupled from
   * per-tab offsets, scrolled content can legitimately sit underneath an
   * expanded header — translucent headers would show it bleeding through.
   */
  headerBackgroundColor?: string;
  /** Extra styles for the animated header+tab-bar wrapper. */
  headerContainerStyle?: StyleProp<ViewStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  initialTabName?: string;
  /**
   * Mount tab content only when the tab is first focused (or its neighbor is
   * being dragged in). `false` mounts everything up front — and means it.
   */
  lazy?: boolean;
  /** Rendered in place of a lazy tab's content until it mounts. */
  renderLazyPlaceholder?: (props: { name: string; index: number }) => ReactNode;
  /** Any upward scroll reveals the header immediately (Twitter-style). */
  revealHeaderOnScroll?: boolean;
  /**
   * When set (0..1), a header released mid-collapse animates fully open or
   * closed. E.g. 0.5 snaps to whichever edge is closer. Omit to disable.
   */
  snapThreshold?: number | null;
  onIndexChange?: (index: number) => void;
  /** Fires once per settled tab switch — never for intermediate pages. */
  onTabChange?: (event: TabChangeEvent) => void;
  /** Escape hatch passed straight to the underlying PagerView. */
  pagerProps?: Omit<
    React.ComponentProps<typeof PagerView>,
    | 'children'
    | 'initialPage'
    | 'onPageSelected'
    | 'onPageScroll'
    | 'onPageScrollStateChanged'
  >;
  children: ReactNode;
};

function extractTabs(children: ReactNode): ReactElement<TabProps>[] {
  // Duck-typed on a string `name` prop rather than element type, so users can
  // wrap <Tabs.Tab> in their own components (as long as they forward
  // name/label/children onto the wrapper element).
  const out: ReactElement<TabProps>[] = [];
  Children.toArray(children).forEach((child) => {
    if (!isValidElement(child)) return;
    const props = child.props as Partial<TabProps>;
    if (typeof props.name === 'string') {
      out.push(child as ReactElement<TabProps>);
    } else if (__DEV__) {
      console.warn(
        '[@scanner/react-native-collapsible-tabs] Ignored a Container child without a string `name` prop. ' +
          'Every child must be a <Tabs.Tab name="..."> (or forward a `name` prop).',
      );
    }
  });
  if (__DEV__) {
    const seen = new Set<string>();
    for (const tab of out) {
      if (seen.has(tab.props.name)) {
        console.warn(
          `[@scanner/react-native-collapsible-tabs] Duplicate tab name "${tab.props.name}" — names must be unique.`,
        );
      }
      seen.add(tab.props.name);
    }
  }
  return out;
}

export const Container = forwardRef<CollapsingTabsRef, ContainerProps>(
  function Container(
    {
      renderHeader,
      renderTabBar,
      minHeaderHeight = 0,
      headerBackgroundColor = '#fff',
      headerContainerStyle,
      containerStyle,
      initialTabName,
      lazy = false,
      renderLazyPlaceholder,
      revealHeaderOnScroll = false,
      snapThreshold = null,
      onIndexChange,
      onTabChange,
      pagerProps,
      children,
    },
    ref,
  ) {
    const tabChildren = useMemo(() => extractTabs(children), [children]);

    // Key tabNames by content so parent re-renders don't churn identities.
    // NUL separator: tab names may contain any printable character.
    const namesKey = tabChildren.map((c) => c.props.name).join('\u0000');
    const tabNames = useMemo(
      () => (namesKey ? namesKey.split('\u0000') : []),
      [namesKey],
    );
    const tabNamesRef = useRef(tabNames);
    tabNamesRef.current = tabNames;
    const tabCount = tabNames.length;

    const tabLabels = useMemo(() => {
      const labels: Record<string, string> = {};
      for (const c of tabChildren) {
        labels[c.props.name] = c.props.label ?? c.props.name;
      }
      return labels;
    }, [tabChildren]);

    const [initialIndex] = useState(() =>
      Math.max(0, initialTabName ? tabNames.indexOf(initialTabName) : 0),
    );

    // makeMutable instead of useSharedValue: tab count is dynamic, hooks can't
    // loop. Keyed by tab name so add/remove preserves scroll positions.
    const offsetsStore = useRef(new Map<string, SharedValue<number>>());
    const offsets = useMemo(
      () =>
        tabNames.map((name) => {
          let sv = offsetsStore.current.get(name);
          if (!sv) {
            sv = makeMutable(0);
            offsetsStore.current.set(name, sv);
          }
          return sv;
        }),
      [tabNames],
    );

    const activeIndexSV = useSharedValue(initialIndex);
    const pagerPosition = useSharedValue(initialIndex);
    const dragTarget = useSharedValue(0);
    const panStartOffset = useSharedValue(0);
    const focusedTab = useSharedValue(tabNames[initialIndex] ?? '');
    const collapse = useSharedValue(0);
    const collapseRangeSV = useSharedValue(0);

    const [activeIndex, setActiveIndex] = useState(initialIndex);
    const activeIndexRef = useRef(initialIndex);
    const pagerRef = useRef<PagerView>(null);
    const listRefs = useRef(new Map<number, TabListHandle>());
    const scrollRefs = useRef(new Map<number, TabScrollRef>());

    const [mountedTabs, setMountedTabs] = useState<ReadonlySet<string>>(
      () => new Set(tabNames[initialIndex] ? [tabNames[initialIndex]] : []),
    );
    const mountTab = useCallback((index: number) => {
      const name = tabNamesRef.current[index];
      if (!name) return;
      setMountedTabs((prev) => {
        if (prev.has(name)) return prev;
        const next = new Set(prev);
        next.add(name);
        return next;
      });
    }, []);

    const [containerHeight, setContainerHeight] = useState(0);
    const [headerHeight, setHeaderHeight] = useState<number | null>(null);
    const [tabBarHeight, setTabBarHeight] = useState<number | null>(null);

    const collapseRange = Math.max(0, (headerHeight ?? 0) - minHeaderHeight);
    const paddingTop = (headerHeight ?? 0) + (tabBarHeight ?? 0);

    useEffect(() => {
      collapseRangeSV.value = collapseRange;
    }, [collapseRange, collapseRangeSV]);

    const ready =
      containerHeight > 0 && headerHeight !== null && tabBarHeight !== null;

    const onContainerLayout = useCallback((e: LayoutChangeEvent) => {
      setContainerHeight(e.nativeEvent.layout.height);
    }, []);
    const onHeaderLayout = useCallback((e: LayoutChangeEvent) => {
      const h = e.nativeEvent.layout.height;
      setHeaderHeight((prev) =>
        prev !== null && Math.abs(prev - h) < 1 ? prev : h,
      );
    }, []);
    const onTabBarLayout = useCallback((e: LayoutChangeEvent) => {
      const h = e.nativeEvent.layout.height;
      setTabBarHeight((prev) =>
        prev !== null && Math.abs(prev - h) < 1 ? prev : h,
      );
    }, []);

    const registerListRef = useCallback(
      (index: number, handle: TabListHandle | null) => {
        if (handle) listRefs.current.set(index, handle);
        else listRefs.current.delete(index);
      },
      [],
    );

    const registerScrollRef = useCallback(
      (index: number, scrollRef: TabScrollRef | null) => {
        if (scrollRef) scrollRefs.current.set(index, scrollRef);
        else scrollRefs.current.delete(index);
      },
      [],
    );

    const cancelHeaderAnimations = useCallback(() => {
      'worklet';
      cancelAnimation(dragTarget);
      cancelAnimation(collapse);
    }, [dragTarget, collapse]);

    const maybeSnap = useCallback(() => {
      'worklet';
      if (snapThreshold === null || snapThreshold === undefined) return;
      const range = collapseRangeSV.value;
      if (range <= 0) return;
      const current = collapse.value;
      if (current <= 0.5 || current >= range - 0.5) return;
      if (current >= range * snapThreshold) {
        const sv = offsets[Math.round(activeIndexSV.value)];
        const offset = sv ? sv.value : 0;
        if (offset >= range) {
          collapse.value = withTiming(range, SNAP_TIMING);
        } else {
          // Content hasn't scrolled past the header yet — drive the list
          // itself so collapse follows via scroll deltas and no gap can open.
          dragTarget.value = offset;
          dragTarget.value = withTiming(range, SNAP_TIMING);
        }
      } else {
        collapse.value = withTiming(0, SNAP_TIMING);
      }
    }, [
      snapThreshold,
      collapseRangeSV,
      collapse,
      offsets,
      activeIndexSV,
      dragTarget,
    ]);

    /**
     * The header never moves on a tab switch; only the incoming tab is
     * adjusted, and only when its saved offset is "inside" the current
     * collapse (which would otherwise leave a gap between header and content).
     * Offsets at or beyond the collapse are preserved untouched — per-tab
     * scroll memory, with deep content simply sitting under the (possibly
     * expanded) header.
     *
     * Must always run BEFORE activeIndex flips: the offset jump it produces is
     * then ignored by the inactive guard in TabPage's collapse-delta reaction.
     */
    const syncTab = useCallback(
      (index: number) => {
        if (index < 0 || index >= offsets.length) return;
        if (index === activeIndexRef.current) return;
        const target = collapse.value;
        const offsetSV = offsets[index];
        if (!offsetSV || offsetSV.value >= target) return;
        offsetSV.value = target;
        const animatedRef = scrollRefs.current.get(index);
        if (animatedRef) {
          // UI-thread snap: a JS-side scrollToOffset lands frames late,
          // letting the incoming page flash its un-synced position mid-swipe.
          runOnUI((scrollRef: TabScrollRef, offset: number) => {
            'worklet';
            scrollTo(scrollRef, 0, offset, false);
          })(animatedRef, target);
        } else {
          listRefs.current
            .get(index)
            ?.scrollToOffset({ offset: target, animated: false });
        }
      },
      [offsets, collapse],
    );

    const goToIndex = useCallback(
      (index: number, animated = true) => {
        const from = activeIndexRef.current;
        const lo = Math.min(from, index);
        const hi = Math.max(from, index);
        // setPage animates through intermediate pages — sync them all, but
        // only mount the destination (intermediates stay lazy placeholders).
        for (let i = lo; i <= hi; i++) syncTab(i);
        mountTab(index);
        if (animated) pagerRef.current?.setPage(index);
        else pagerRef.current?.setPageWithoutAnimation(index);
      },
      [syncTab, mountTab],
    );

    const onTabPress = useCallback(
      (name: string) => {
        const index = tabNamesRef.current.indexOf(name);
        if (index >= 0) goToIndex(index);
      },
      [goToIndex],
    );

    const handlePageSelected = useCallback(
      (e: { nativeEvent: { position: number } }) => {
        const index = e.nativeEvent.position;
        const prevIndex = activeIndexRef.current;
        syncTab(index);
        mountTab(index);
        activeIndexRef.current = index;
        activeIndexSV.value = index;
        const names = tabNamesRef.current;
        focusedTab.value = names[index] ?? '';
        setActiveIndex(index);
        if (index !== prevIndex) {
          onIndexChange?.(index);
          onTabChange?.({
            prevIndex,
            index,
            prevTabName: names[prevIndex] ?? '',
            tabName: names[index] ?? '',
          });
        }
      },
      [syncTab, mountTab, activeIndexSV, focusedTab, onIndexChange, onTabChange],
    );

    const handlePageScrollStateChanged = useCallback(
      (e: { nativeEvent: { pageScrollState: string } }) => {
        if (e.nativeEvent.pageScrollState === 'dragging') {
          const current = activeIndexRef.current;
          syncTab(current - 1);
          syncTab(current + 1);
          // Mount neighbors so a swipe never reveals a blank page.
          mountTab(current - 1);
          mountTab(current + 1);
        }
      },
      [syncTab, mountTab],
    );

    // Keep state consistent when tabs are added/removed at runtime.
    useEffect(() => {
      if (tabCount === 0) return;
      const current = activeIndexRef.current;
      if (current >= tabCount) {
        const clamped = tabCount - 1;
        activeIndexRef.current = clamped;
        activeIndexSV.value = clamped;
        setActiveIndex(clamped);
        pagerRef.current?.setPageWithoutAnimation(clamped);
      }
      focusedTab.value = tabNames[activeIndexRef.current] ?? '';
    }, [tabCount, tabNames, activeIndexSV, focusedTab]);

    const pagerScrollHandler = usePagerScrollHandler(
      {
        onPageScroll: (e) => {
          'worklet';
          pagerPosition.value = e.position + e.offset;
        },
      },
      [pagerPosition],
    );

    useImperativeHandle(
      ref,
      () => ({
        jumpToTab: (name, animated = true) => {
          const index = tabNamesRef.current.indexOf(name);
          if (index >= 0) goToIndex(index, animated);
        },
        setIndex: (index, animated = true) => {
          if (index >= 0 && index < tabNamesRef.current.length) {
            goToIndex(index, animated);
          }
        },
        getFocusedTab: () =>
          tabNamesRef.current[activeIndexRef.current] ?? '',
        getCurrentIndex: () => activeIndexRef.current,
        scrollToTop: (animated = true) => {
          cancelHeaderAnimations();
          listRefs.current
            .get(activeIndexRef.current)
            ?.scrollToOffset({ offset: 0, animated });
        },
        scrollAllToTop: () => {
          cancelHeaderAnimations();
          offsets.forEach((sv, i) => {
            const handle = listRefs.current.get(i);
            if (handle) handle.scrollToOffset({ offset: 0, animated: false });
            else sv.value = 0;
          });
          collapse.value = 0;
        },
      }),
      [goToIndex, cancelHeaderAnimations, offsets, collapse],
    );

    // Scrolling that starts on the header drags the active list, so collapse,
    // list scroll, and release momentum are all one continuous gesture. Taps
    // still reach buttons inside the header: the pan only activates after
    // 10px of vertical movement.
    const headerPan = useMemo(
      () =>
        Gesture.Pan()
          .activeOffsetY([-10, 10])
          .failOffsetX([-15, 15])
          .onTouchesDown(() => {
            'worklet';
            cancelAnimation(dragTarget);
            cancelAnimation(collapse);
          })
          .onStart(() => {
            'worklet';
            const sv = offsets[Math.round(activeIndexSV.value)];
            panStartOffset.value = sv ? sv.value : 0;
          })
          .onUpdate((e) => {
            'worklet';
            dragTarget.value = Math.max(
              0,
              panStartOffset.value - e.translationY,
            );
          })
          .onEnd((e) => {
            'worklet';
            dragTarget.value = withDecay(
              { velocity: -e.velocityY, clamp: [0, 1e9] },
              (finished) => {
                if (finished) maybeSnap();
              },
            );
          }),
      [offsets, dragTarget, collapse, activeIndexSV, panStartOffset, maybeSnap],
    );

    // Header position is the standalone `collapse` value — constant during
    // pager swipes and tab switches, only moved by active-tab scroll deltas.
    const headerTranslateStyle = useAnimatedStyle(
      () => ({
        transform: [
          // Re-clamp in case the header re-measures smaller than the current collapse.
          { translateY: -Math.min(collapse.value, collapseRangeSV.value) },
        ],
      }),
      [collapse, collapseRangeSV],
    );

    const ctxValue = useMemo<CollapsingTabsContextValue>(
      () => ({
        offsets,
        activeIndexSV,
        focusedTab,
        pagerPosition,
        dragTarget,
        collapse,
        collapseRangeSV,
        collapseRange,
        paddingTop,
        containerHeight,
        headerHeight: headerHeight ?? 0,
        tabBarHeight: tabBarHeight ?? 0,
        revealHeaderOnScroll,
        registerListRef,
        registerScrollRef,
        cancelHeaderAnimations,
        maybeSnap,
      }),
      [
        offsets,
        activeIndexSV,
        focusedTab,
        pagerPosition,
        dragTarget,
        collapse,
        collapseRangeSV,
        collapseRange,
        paddingTop,
        containerHeight,
        headerHeight,
        tabBarHeight,
        revealHeaderOnScroll,
        registerListRef,
        registerScrollRef,
        cancelHeaderAnimations,
        maybeSnap,
      ],
    );

    const activeTabValue = useMemo<ActiveTabContextValue>(
      () => ({ activeIndex, tabNames }),
      [activeIndex, tabNames],
    );

    const tabBarNode = renderTabBar ? (
      renderTabBar({
        tabNames,
        tabLabels,
        focusedTab,
        indexDecimal: pagerPosition,
        activeIndex,
        onTabPress,
      })
    ) : (
      <DefaultTabBar
        tabNames={tabNames}
        tabLabels={tabLabels}
        focusedTab={focusedTab}
        indexDecimal={pagerPosition}
        activeIndex={activeIndex}
        onTabPress={onTabPress}
      />
    );

    const activeTabProps = tabChildren[activeIndex]?.props;
    const pagerScrollEnabled =
      activeTabProps?.swipeEnabled ?? pagerProps?.scrollEnabled ?? true;

    return (
      <CollapsingTabsContext.Provider value={ctxValue}>
        <ActiveTabContext.Provider value={activeTabValue}>
          <View
            style={[styles.container, containerStyle]}
            onLayout={onContainerLayout}
          >
            {ready && (
              <AnimatedPagerView
                {...pagerProps}
                ref={pagerRef}
                style={[styles.pager, pagerProps?.style]}
                scrollEnabled={pagerScrollEnabled}
                initialPage={initialIndex}
                // useEvent returns a worklet handler the static prop types don't know about
                onPageScroll={
                  pagerScrollHandler as unknown as React.ComponentProps<
                    typeof PagerView
                  >['onPageScroll']
                }
                onPageSelected={handlePageSelected}
                onPageScrollStateChanged={handlePageScrollStateChanged}
              >
                {tabChildren.map((child, i) => {
                  const { name, lazy: tabLazy, children: tabContent } =
                    child.props;
                  const mount =
                    !(tabLazy ?? lazy) || mountedTabs.has(name);
                  return (
                    <View key={name} style={styles.page} collapsable={false}>
                      <TabPage
                        index={i}
                        name={name}
                        mount={mount}
                        placeholder={renderLazyPlaceholder?.({
                          name,
                          index: i,
                        })}
                      >
                        {tabContent}
                      </TabPage>
                    </View>
                  );
                })}
              </AnimatedPagerView>
            )}
            <View style={styles.headerArea} pointerEvents="box-none">
              <GestureDetector gesture={headerPan}>
                <Animated.View
                  style={[
                    { backgroundColor: headerBackgroundColor },
                    headerContainerStyle,
                    headerTranslateStyle,
                  ]}
                >
                  <View onLayout={onHeaderLayout}>
                    {renderHeader ? renderHeader() : null}
                  </View>
                  <View onLayout={onTabBarLayout}>{tabBarNode}</View>
                </Animated.View>
              </GestureDetector>
            </View>
          </View>
        </ActiveTabContext.Provider>
      </CollapsingTabsContext.Provider>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  pager: {
    flex: 1,
  },
  page: {
    flex: 1,
  },
  headerArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
});
