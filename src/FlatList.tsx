import {
  forwardRef,
  useCallback,
  useEffect,
  type ComponentProps,
  type MutableRefObject,
  type ReactElement,
  type Ref,
} from 'react';
import type { FlatList, FlatListProps } from 'react-native';
import Animated, { useAnimatedScrollHandler } from 'react-native-reanimated';
import {
  useCollapsingTabsContext,
  useTabPageContext,
  type TabListHandle,
} from './context';
import { useRestoreTabOffset, useTabContentStyle } from './adapterUtils';

export type TabFlatListProps<ItemT> = Omit<FlatListProps<ItemT>, 'onScroll'>;

function TabFlatListInner<ItemT>(
  {
    contentContainerStyle,
    scrollIndicatorInsets,
    progressViewOffset,
    ...rest
  }: TabFlatListProps<ItemT>,
  ref: Ref<FlatList<ItemT>>,
) {
  const {
    offsets,
    paddingTop,
    registerListRef,
    cancelHeaderAnimations,
    maybeSnap,
  } = useCollapsingTabsContext();
  const { index, scrollRef } = useTabPageContext();

  const scrollHandler = useAnimatedScrollHandler(
    {
      onScroll: (e) => {
        const sv = offsets[index];
        if (sv) sv.value = e.contentOffset.y;
      },
      onBeginDrag: () => {
        cancelHeaderAnimations();
      },
      onEndDrag: (e) => {
        const vy = e.velocity?.y ?? 0;
        if (Math.abs(vy) < 0.05) maybeSnap();
      },
      onMomentumEnd: () => {
        maybeSnap();
      },
    },
    [offsets, index, cancelHeaderAnimations, maybeSnap],
  );

  const setRefs = useCallback(
    (node: FlatList<ItemT> | null) => {
      // The TabPage animated ref accepts any scrollable for UI-thread scrollTo.
      (scrollRef as unknown as (node: FlatList<ItemT> | null) => void)(node);
      if (typeof ref === 'function') ref(node);
      else if (ref)
        (ref as MutableRefObject<FlatList<ItemT> | null>).current = node;
    },
    [scrollRef, ref],
  );

  useEffect(() => {
    const handle: TabListHandle = {
      scrollToOffset: ({ offset, animated }) =>
        (
          scrollRef.current as unknown as FlatList<ItemT> | null
        )?.scrollToOffset({ offset, animated: animated ?? false }),
    };
    registerListRef(index, handle);
    return () => registerListRef(index, null);
  }, [registerListRef, index, scrollRef]);

  useRestoreTabOffset(
    useCallback(
      (offset: number) =>
        (
          scrollRef.current as unknown as FlatList<ItemT> | null
        )?.scrollToOffset({ offset, animated: false }),
      [scrollRef],
    ),
  );

  const mergedContentStyle = useTabContentStyle(contentContainerStyle);

  return (
    <Animated.FlatList
      // Generic ItemT doesn't survive Animated.FlatList's wrapper types.
      {...(rest as unknown as ComponentProps<typeof Animated.FlatList>)}
      ref={setRefs as never}
      onScroll={scrollHandler}
      scrollEventThrottle={16}
      contentContainerStyle={mergedContentStyle}
      scrollIndicatorInsets={scrollIndicatorInsets ?? { top: paddingTop }}
      progressViewOffset={progressViewOffset ?? paddingTop}
    />
  );
}

/** FlatList wired into the collapsing-tabs container. */
export const TabFlatList = forwardRef(TabFlatListInner) as <ItemT>(
  props: TabFlatListProps<ItemT> & { ref?: Ref<FlatList<ItemT>> },
) => ReactElement;
