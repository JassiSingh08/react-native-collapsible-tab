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
import { AnimatedLegendList } from '@legendapp/list/reanimated';
import type { AnimatedLegendListProps } from '@legendapp/list/reanimated';
import { useCollapsingTabsContext, useTabPageContext } from './context';
import {
  useRestoreTabOffset,
  useTabContentStyle,
  useTabScrollLifecycle,
} from './adapterUtils';
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
  const { offsets, paddingTop } = useCollapsingTabsContext();
  const { index, scrollRef } = useTabPageContext();

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
  useRestoreTabOffset(scrollToOffset);

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
