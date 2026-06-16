import { useCallback, useEffect, useMemo, useRef } from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import type {
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { useCollapsingTabsContext, useTabPageContext } from './context';

function numeric(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

/**
 * Merges the container's layout requirements into a user-provided
 * contentContainerStyle: top padding so content starts below header + tab
 * bar, and (optionally) a minHeight so even short tabs can fully collapse
 * the header.
 */
export function useTabContentStyle(
  contentContainerStyle: StyleProp<ViewStyle> | undefined,
  { minHeight = true }: { minHeight?: boolean } = {},
): ViewStyle {
  const { paddingTop, collapseRange, containerHeight } =
    useCollapsingTabsContext();

  return useMemo<ViewStyle>(() => {
    const user = StyleSheet.flatten(contentContainerStyle) ?? {};
    const userTop = numeric(
      user.paddingTop ?? user.paddingVertical ?? user.padding,
    );
    const merged: ViewStyle = {
      ...user,
      paddingTop: paddingTop + userTop,
    };
    if (minHeight) {
      merged.minHeight = Math.max(
        numeric(user.minHeight),
        containerHeight + collapseRange,
      );
    }
    return merged;
  }, [
    contentContainerStyle,
    paddingTop,
    containerHeight,
    collapseRange,
    minHeight,
  ]);
}

type ScrollEvent = NativeSyntheticEvent<NativeScrollEvent>;

type UserScrollHandlers = {
  onScrollBeginDrag?: (e: ScrollEvent) => void;
  onScrollEndDrag?: (e: ScrollEvent) => void;
  onMomentumScrollEnd?: (e: ScrollEvent) => void;
};

/**
 * JS-thread scroll lifecycle handlers for adapters whose scroll offset is
 * tracked elsewhere (e.g. LegendList's sharedValues): cancel header
 * drag/snap animations when the user grabs the list, snap on rest.
 */
export function useTabScrollLifecycle(user: UserScrollHandlers) {
  const { cancelHeaderAnimations, maybeSnap } = useCollapsingTabsContext();
  const userRef = useRef(user);
  userRef.current = user;

  const onScrollBeginDrag = useCallback(
    (e: ScrollEvent) => {
      cancelHeaderAnimations();
      userRef.current.onScrollBeginDrag?.(e);
    },
    [cancelHeaderAnimations],
  );
  const onScrollEndDrag = useCallback(
    (e: ScrollEvent) => {
      const vy = e.nativeEvent.velocity?.y ?? 0;
      if (Math.abs(vy) < 0.05) maybeSnap();
      userRef.current.onScrollEndDrag?.(e);
    },
    [maybeSnap],
  );
  const onMomentumScrollEnd = useCallback(
    (e: ScrollEvent) => {
      maybeSnap();
      userRef.current.onMomentumScrollEnd?.(e);
    },
    [maybeSnap],
  );

  return { onScrollBeginDrag, onScrollEndDrag, onMomentumScrollEnd };
}

/**
 * Restores a tab's saved scroll offset when its list mounts. Needed for lazy
 * tabs: syncTab may have written this tab's offset (so the header/content
 * geometry is gapless on arrival) while the list didn't exist yet.
 */
export function useRestoreTabOffset(
  scrollToOffset: (offset: number) => void,
) {
  const { offsets } = useCollapsingTabsContext();
  const { index } = useTabPageContext();
  const fnRef = useRef(scrollToOffset);
  fnRef.current = scrollToOffset;

  useEffect(() => {
    const initial = offsets[index]?.value ?? 0;
    if (initial <= 0.5) return undefined;
    // rAF: lists can't scroll before their first layout pass.
    const id = requestAnimationFrame(() => fnRef.current(initial));
    return () => cancelAnimationFrame(id);
    // Mount-only by design: restores once, never re-scrolls on re-render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
