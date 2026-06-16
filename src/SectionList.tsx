import {
  forwardRef,
  useCallback,
  useEffect,
  type MutableRefObject,
  type ReactElement,
  type Ref,
} from 'react';
import { SectionList } from 'react-native';
import type {
  DefaultSectionT,
  ScrollView,
  SectionListProps,
} from 'react-native';
import Animated, { useAnimatedScrollHandler } from 'react-native-reanimated';
import {
  useCollapsingTabsContext,
  useTabPageContext,
  type TabListHandle,
} from './context';
import { useRestoreTabOffset, useTabContentStyle } from './adapterUtils';

const AnimatedSectionList = Animated.createAnimatedComponent(
  SectionList,
) as unknown as typeof SectionList;

export type TabSectionListProps<ItemT, SectionT = DefaultSectionT> = Omit<
  SectionListProps<ItemT, SectionT>,
  'onScroll'
>;

function scrollListTo(
  list: SectionList<unknown, DefaultSectionT> | null,
  offset: number,
  animated: boolean,
) {
  // SectionList has no scrollToOffset — go through its scroll responder.
  const responder = list?.getScrollResponder() as ScrollView | undefined;
  responder?.scrollTo({ y: offset, animated });
}

function TabSectionListInner<ItemT, SectionT = DefaultSectionT>(
  {
    contentContainerStyle,
    scrollIndicatorInsets,
    progressViewOffset,
    ...rest
  }: TabSectionListProps<ItemT, SectionT>,
  ref: Ref<SectionList<ItemT, SectionT>>,
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
    (node: SectionList<ItemT, SectionT> | null) => {
      (
        scrollRef as unknown as (
          node: SectionList<ItemT, SectionT> | null,
        ) => void
      )(node);
      if (typeof ref === 'function') ref(node);
      else if (ref)
        (ref as MutableRefObject<SectionList<ItemT, SectionT> | null>).current =
          node;
    },
    [scrollRef, ref],
  );

  useEffect(() => {
    const handle: TabListHandle = {
      scrollToOffset: ({ offset, animated }) =>
        scrollListTo(
          scrollRef.current as unknown as SectionList<
            unknown,
            DefaultSectionT
          > | null,
          offset,
          animated ?? false,
        ),
    };
    registerListRef(index, handle);
    return () => registerListRef(index, null);
  }, [registerListRef, index, scrollRef]);

  useRestoreTabOffset(
    useCallback(
      (offset: number) =>
        scrollListTo(
          scrollRef.current as unknown as SectionList<
            unknown,
            DefaultSectionT
          > | null,
          offset,
          false,
        ),
      [scrollRef],
    ),
  );

  const mergedContentStyle = useTabContentStyle(contentContainerStyle);

  return (
    <AnimatedSectionList
      {...(rest as unknown as SectionListProps<unknown, DefaultSectionT>)}
      ref={setRefs as never}
      onScroll={scrollHandler as never}
      scrollEventThrottle={16}
      contentContainerStyle={mergedContentStyle}
      scrollIndicatorInsets={scrollIndicatorInsets ?? { top: paddingTop }}
      progressViewOffset={progressViewOffset ?? paddingTop}
    />
  );
}

/** SectionList wired into the collapsing-tabs container. */
export const TabSectionList = forwardRef(TabSectionListInner) as <
  ItemT,
  SectionT = DefaultSectionT,
>(
  props: TabSectionListProps<ItemT, SectionT> & {
    ref?: Ref<SectionList<ItemT, SectionT>>;
  },
) => ReactElement;
