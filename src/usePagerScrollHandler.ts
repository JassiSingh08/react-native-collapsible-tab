import { useEvent, useHandler } from 'react-native-reanimated';

export type PagerScrollEvent = {
  position: number;
  offset: number;
  eventName: string;
};

type Handlers = {
  onPageScroll: (event: PagerScrollEvent, context: unknown) => void;
};

// PagerView has no reanimated bindings — bridge its onPageScroll native event
// to a UI-thread worklet via useEvent (pattern from react-native-pager-view docs).
export function usePagerScrollHandler(
  handlers: Handlers,
  dependencies?: unknown[],
) {
  const { context, doDependenciesDiffer } = useHandler<
    PagerScrollEvent,
    Record<string, unknown>
  >(handlers as never, dependencies as never);

  return useEvent<PagerScrollEvent>(
    (event) => {
      'worklet';
      const { onPageScroll } = handlers;
      if (onPageScroll && event.eventName.endsWith('onPageScroll')) {
        onPageScroll(event, context);
      }
    },
    ['onPageScroll'],
    doDependenciesDiffer,
  );
}
