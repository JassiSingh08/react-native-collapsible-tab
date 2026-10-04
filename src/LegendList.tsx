import {
  forwardRef,
  useCallback,
  useMemo,
  useRef,
  type MutableRefObject,
  type ReactElement,
  type Ref,
} from 'react';
import type { LegendListRef } from '@legendapp/list/react-native';
import {
  runOnUI,
  scrollTo,
  useAnimatedReaction,
  useSharedValue,
} from 'react-native-reanimated';
import { AnimatedLegendList } from '@legendapp/list/reanimated';
import type { AnimatedLegendListProps } from '@legendapp/list/reanimated';
import {
  useCollapsingTabsContext,
  useTabPageContext,
} from './context';
import { useTabContentStyle, useTabScrollLifecycle } from './adapterUtils';
import { useRegisterTabList } from './hooks-internal';

export type TabLegendListProps<ItemT> = Omit<
  AnimatedLegendListProps<ItemT>,
  'refScrollView' | 'sharedValues'
>;

function TabLegendListInner<ItemT>(
  {
    contentContainerStyle,
    scrollIndicatorInsets,
    progressViewOffset,
    onScrollBeginDrag,
    onScrollEndDrag,
    onMomentumScrollEnd,
    ...rest
  }: TabLegendListProps<ItemT>,
  ref: Ref<LegendListRef>,
) {
  const { offsets, paddingTop, containerHeight } = useCollapsingTabsContext();
  const { index, scrollRef } = useTabPageContext();

  // useRestoreTabOffset goes through LegendList's own
  // scrollToOffset, which LegendList clamps to its ITEM-based content size —
  // zero while a tab shows only its empty state — so a tab mounted mid-swipe
  // stayed at 0 under a collapsed header: a gap the height of the collapse
  // during the peek, snapping into place only on landing. LegendList's
  // Reanimated integration also writes its own scroll (0) into the shared value
  // at mount, and the order of that write, the first content size and the first
  // native scroll event differs by platform. So the restore is a HOLD, not a
  // one-shot: the target is read at mount (the seed syncTab left), and a
  // UI-thread reaction re-applies a native scrollTo — the one scroll LegendList's
  // clamp never sees — whenever the tracker reports the list short of it, once
  // the content can hold it, bounded to a few attempts. It releases the moment a
  // report confirms the position (or syncTab lands the tab). The shared value is
  // never written here: it must keep reporting the list's real position, or
  // syncTab would skip the very scroll that fixes a tab it believes is in sync.
    const restoreTarget = useSharedValue(offsets[index]?.value ?? 0);
  const restoreReady = useSharedValue(false);
  const restoreAttempts = useSharedValue(0);
  const applyRestore = useCallback(() => {
    'worklet';
    if (restoreTarget.value <= 0.5 || !restoreReady.value) return;
    if (restoreAttempts.value >= 6) {
      restoreTarget.value = 0;
      return;
    }
    restoreAttempts.value += 1;
    scrollTo(scrollRef, 0, restoreTarget.value, false);
  }, [restoreTarget, restoreReady, restoreAttempts, scrollRef]);
  useAnimatedReaction(
    () => offsets[index]?.value ?? 0,
    (position, previous) => {
      // The first run only sees the seed itself, not a report from the list.
      if (previous === null || restoreTarget.value <= 0.5) return;
        if (position >= restoreTarget.value - 1) {
        restoreTarget.value = 0;
        return;
      }
      applyRestore();
    },
    [index, applyRestore],
  );
  const handleContentSizeChange = useCallback(
    (width: number, height: number) => {
      rest.onContentSizeChange?.(width, height);
      const target = restoreTarget.value;
      const ready = height >= target + containerHeight - 1;
        if (target <= 0.5 || !ready) return;
      runOnUI(() => {
        'worklet';
        restoreReady.value = true;
        applyRestore();
      })();
    },
    [rest.onContentSizeChange, containerHeight, restoreTarget, restoreReady, applyRestore],
  );
  const listRef = useRef<LegendListRef | null>(null);
  const setListRefs = useCallback(
    (node: LegendListRef | null) => {
      listRef.current = node;
      if (typeof ref === 'function') ref(node);
      else if (ref)
        (ref as MutableRefObject<LegendListRef | null>).current = node;
    },
    [ref],
  );

  const scrollToOffset = useCallback(
    (offset: number, animated = false) =>
      listRef.current?.scrollToOffset({ offset, animated }),
    [],
  );
  useRegisterTabList(
    useMemo(
      () => ({
        scrollToOffset: ({
          offset,
          animated,
        }: {
          offset: number;
          animated?: boolean;
        }) => scrollToOffset(offset, animated ?? false),
      }),
      [scrollToOffset],
    ),
  );
  // useRestoreTabOffset is not called here. It restores
  // through LegendList's scrollToOffset, which LegendList clamps to its
  // item-based content size — 0 for a tab showing only its empty state — so a
  // frame after the native restore in handleContentSizeChange it would scroll
  // the list straight back to 0. The native restore is the whole restore.

  // LegendList owns writes into these shared values — the list's offset
  // feeds the header collapse without touching its onScroll pipeline.
  const sharedValues = useMemo(
    () => ({ scrollOffset: offsets[index] }),
    [offsets, index],
  );

  const lifecycle = useTabScrollLifecycle({
    onScrollBeginDrag,
    onScrollEndDrag,
    onMomentumScrollEnd,
  });

  const mergedContentStyle = useTabContentStyle(contentContainerStyle);

  return (
    <AnimatedLegendList
      {...rest}
      onContentSizeChange={handleContentSizeChange}
      ref={setListRefs as never}
      refScrollView={scrollRef}
      sharedValues={sharedValues}
      contentContainerStyle={mergedContentStyle}
      scrollIndicatorInsets={scrollIndicatorInsets ?? { top: paddingTop }}
      progressViewOffset={progressViewOffset ?? paddingTop}
      onScrollBeginDrag={lifecycle.onScrollBeginDrag}
      onScrollEndDrag={lifecycle.onScrollEndDrag}
      onMomentumScrollEnd={lifecycle.onMomentumScrollEnd}
    />
  );
}

/**
 * LegendList wired into the collapsing-tabs container.
 * Requires @legendapp/list (optional peer dependency).
 */
export const TabLegendList = forwardRef(TabLegendListInner) as <ItemT>(
  props: TabLegendListProps<ItemT> & { ref?: Ref<LegendListRef> },
) => ReactElement;
