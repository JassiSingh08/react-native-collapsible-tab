import { useCallback, useEffect, type ComponentProps } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, { useAnimatedScrollHandler } from 'react-native-reanimated';
import {
  useCollapsingTabsContext,
  useTabPageContext,
  type TabListHandle,
} from './context';
import { useRestoreTabOffset, useTabContentStyle } from './adapterUtils';

export type TabScrollViewProps = Omit<
  ComponentProps<typeof Animated.ScrollView>,
  'onScroll'
>;

/** ScrollView wired into the collapsing-tabs container. */
export function TabScrollView({
  children,
  contentContainerStyle,
  scrollIndicatorInsets,
  ...rest
}: TabScrollViewProps) {
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

  const scrollToOffset = useCallback(
    (offset: number, animated = false) => {
      scrollRef.current?.scrollTo({ y: offset, animated });
    },
    [scrollRef],
  );

  useEffect(() => {
    const handle: TabListHandle = {
      scrollToOffset: ({ offset, animated }) =>
        scrollToOffset(offset, animated ?? false),
    };
    registerListRef(index, handle);
    return () => registerListRef(index, null);
  }, [registerListRef, index, scrollToOffset]);

  useRestoreTabOffset(scrollToOffset);

  // Static styles only — the adapter owns paddingTop, so animated
  // contentContainerStyle values can't be merged anyway.
  const mergedContentStyle = useTabContentStyle(
    contentContainerStyle as StyleProp<ViewStyle>,
  );

  return (
    <Animated.ScrollView
      {...rest}
      ref={scrollRef}
      onScroll={scrollHandler}
      scrollEventThrottle={16}
      contentContainerStyle={mergedContentStyle}
      scrollIndicatorInsets={scrollIndicatorInsets ?? { top: paddingTop }}
    >
      {children}
    </Animated.ScrollView>
  );
}
