import { useEvent, useHandler } from 'react-native-reanimated';
import { USE_REANIMATED_DEPENDENCIES } from './reanimatedCompat';

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
  // Reanimated 3 uses these on native; Reanimated 4+ only uses them on web.
  dependencies?: unknown[],
) {
  const { context, doDependenciesDiffer } = useHandler<
    PagerScrollEvent,
    Record<string, unknown>
  >(handlers as never, USE_REANIMATED_DEPENDENCIES ? dependencies : undefined);

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
