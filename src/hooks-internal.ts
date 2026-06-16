import { useEffect } from 'react';
import {
  useCollapsingTabsContext,
  useTabPageContext,
  type TabListHandle,
} from './context';

/** Registers a tab list's imperative handle for the container's offset syncs. */
export function useRegisterTabList(handle: TabListHandle) {
  const { registerListRef } = useCollapsingTabsContext();
  const { index } = useTabPageContext();
  useEffect(() => {
    registerListRef(index, handle);
    return () => registerListRef(index, null);
  }, [registerListRef, index, handle]);
}
