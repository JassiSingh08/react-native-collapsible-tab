import {
  forwardRef,
  isValidElement,
  useCallback,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type MutableRefObject,
  type ReactElement,
  type Ref,
} from 'react';
import { View, type ScrollViewProps } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import type { FlashListProps, FlashListRef } from '@shopify/flash-list';
import Animated, {
  useAnimatedReaction,
  useScrollViewOffset,
} from 'react-native-reanimated';
import * as Reanimated from 'react-native-reanimated';
import {
  useCollapsingTabsContext,
  useTabPageContext,
  type TabListHandle,
  type TabScrollRef,
} from './context';
import {
  useRestoreTabOffset,
  useTabContentStyle,
  useTabScrollLifecycle,
} from './adapterUtils';
import { useRegisterTabList } from './hooks-internal';

// useScrollViewOffset was renamed to useScrollOffset; prefer the new name
// when present so Reanimated 4 users don't get deprecation warnings.
const useScrollOffsetCompat: typeof useScrollViewOffset =
  (Reanimated as { useScrollOffset?: typeof useScrollViewOffset })
    .useScrollOffset ?? useScrollViewOffset;

export type TabFlashListProps<ItemT> = Omit<
  FlashListProps<ItemT>,
  'renderScrollComponent'
>;

/**
 * Mutable box read by the injected scroll component, so its identity never
 * changes across renders (a new renderScrollComponent would remount
 * FlashList's underlying ScrollView and drop scroll position).
 */
type ScrollComponentBox = {
  scrollRef: TabScrollRef;
  paddingTop: number;
  lifecycle: {
    onScrollBeginDrag: NonNullable<ScrollViewProps['onScrollBeginDrag']>;
    onScrollEndDrag: NonNullable<ScrollViewProps['onScrollEndDrag']>;
    onMomentumScrollEnd: NonNullable<ScrollViewProps['onMomentumScrollEnd']>;
  };
  onContentHeight: (height: number) => void;
};

function createScrollComponent(box: ScrollComponentBox) {
  return forwardRef<Animated.ScrollView, ScrollViewProps>(
    function TabFlashListScrollView(props, flashListRef) {
      const setRefs = (node: Animated.ScrollView | null) => {
        // Both FlashList's internal ref and our animated ref must point at
        // the real ScrollView: FlashList drives virtualization through its
        // ref, we drive UI-thread scrollTo through ours.
        (box.scrollRef as unknown as (n: Animated.ScrollView | null) => void)(
          node,
        );
        if (typeof flashListRef === 'function') flashListRef(node);
        else if (flashListRef)
          (flashListRef as MutableRefObject<Animated.ScrollView | null>).current =
            node;
      };
      return (
        <Animated.ScrollView
          {...props}
          ref={setRefs}
          scrollIndicatorInsets={
            props.scrollIndicatorInsets ?? { top: box.paddingTop }
          }
          onScrollBeginDrag={(e) => {
            box.lifecycle.onScrollBeginDrag(e);
            props.onScrollBeginDrag?.(e);
          }}
          onScrollEndDrag={(e) => {
            box.lifecycle.onScrollEndDrag(e);
            props.onScrollEndDrag?.(e);
          }}
          onMomentumScrollEnd={(e) => {
            box.lifecycle.onMomentumScrollEnd(e);
            props.onMomentumScrollEnd?.(e);
          }}
          onContentSizeChange={(w, h) => {
            box.onContentHeight(h);
            props.onContentSizeChange?.(w, h);
          }}
        />
      );
    },
  );
}

function renderFooter(
  footer: FlashListProps<unknown>['ListFooterComponent'],
): ReactElement | null {
  if (!footer) return null;
  if (isValidElement(footer)) return footer;
  const FooterComponent = footer as ComponentType;
  return <FooterComponent />;
}

function TabFlashListInner<ItemT>(
  {
    contentContainerStyle,
    ListFooterComponent,
    maintainVisibleContentPosition,
    ...rest
  }: TabFlashListProps<ItemT>,
  ref: Ref<FlashListRef<ItemT>>,
) {
  const { offsets, containerHeight, collapseRange, paddingTop } =
    useCollapsingTabsContext();
  const { index, scrollRef } = useTabPageContext();

  const listRef = useRef<FlashListRef<ItemT> | null>(null);
  const setListRefs = useCallback(
    (node: FlashListRef<ItemT> | null) => {
      listRef.current = node;
      if (typeof ref === 'function') ref(node);
      else if (ref)
        (ref as MutableRefObject<FlashListRef<ItemT> | null>).current = node;
    },
    [ref],
  );

  const scrollToOffset = useCallback(
    (offset: number, animated = false) =>
      listRef.current?.scrollToOffset({ offset, animated }),
    [],
  );
  useRegisterTabList(
    useMemo<TabListHandle>(
      () => ({
        scrollToOffset: ({ offset, animated }) =>
          scrollToOffset(offset, animated ?? false),
      }),
      [scrollToOffset],
    ),
  );
  useRestoreTabOffset(scrollToOffset);

  // FlashList's own onScroll must keep flowing for virtualization, so the
  // offset is observed via the animated ref instead of an onScroll handler.
  const scrollOffset = useScrollOffsetCompat(
    scrollRef as Parameters<typeof useScrollViewOffset>[0],
  );
  useAnimatedReaction(
    () => scrollOffset.value,
    (value, prev) => {
      if (prev === null || value === prev) return;
      const sv = offsets[index];
      if (sv) sv.value = value;
    },
    [offsets, index],
  );

  const lifecycle = useTabScrollLifecycle({});

  // FlashList v2 ignores contentContainerStyle.minHeight, so short tabs get
  // a footer spacer instead — sized so content always reaches
  // containerHeight + collapseRange and the header can fully collapse.
  const [spacerHeight, setSpacerHeight] = useState(0);
  const spacerRef = useRef(0);
  spacerRef.current = spacerHeight;
  const geometry = useRef({ containerHeight, collapseRange });
  geometry.current = { containerHeight, collapseRange };
  const onContentHeight = useCallback((height: number) => {
    const { containerHeight: ch, collapseRange: cr } = geometry.current;
    const contentWithoutSpacer = height - spacerRef.current;
    const needed = Math.max(0, ch + cr - contentWithoutSpacer);
    setSpacerHeight((prev) => (Math.abs(prev - needed) <= 1 ? prev : needed));
  }, []);

  const box = useRef<ScrollComponentBox>({
    scrollRef,
    paddingTop,
    lifecycle,
    onContentHeight,
  }).current;
  box.scrollRef = scrollRef;
  box.paddingTop = paddingTop;
  box.lifecycle = lifecycle;
  box.onContentHeight = onContentHeight;
  const [ScrollComponent] = useState(() => createScrollComponent(box));

  const mergedContentStyle = useTabContentStyle(contentContainerStyle, {
    minHeight: false,
  });

  const footerWithSpacer = useCallback(
    () => (
      <>
        {renderFooter(
          ListFooterComponent as FlashListProps<unknown>['ListFooterComponent'],
        )}
        {spacerHeight > 0 ? <View style={{ height: spacerHeight }} /> : null}
      </>
    ),
    [ListFooterComponent, spacerHeight],
  );

  return (
    <FlashList
      {...rest}
      ref={setListRefs}
      renderScrollComponent={ScrollComponent}
      contentContainerStyle={mergedContentStyle}
      ListFooterComponent={footerWithSpacer}
      // mVCP issues animated corrective scrolls that fight tab-switch offset
      // sync; opt back in explicitly if you know you need it.
      maintainVisibleContentPosition={
        maintainVisibleContentPosition ?? { disabled: true }
      }
    />
  );
}

/**
 * FlashList v2 wired into the collapsing-tabs container.
 * Requires @shopify/flash-list >= 2 (New Architecture only).
 */
export const TabFlashList = forwardRef(TabFlashListInner) as <ItemT>(
  props: TabFlashListProps<ItemT> & { ref?: Ref<FlashListRef<ItemT>> },
) => ReactElement;
