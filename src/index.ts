import { Container } from './Container';
import { Tab } from './Tab';
import { TabFlatList } from './FlatList';
import { TabScrollView } from './ScrollView';
import { TabSectionList } from './SectionList';

export {
  Container,
  type ContainerProps,
  type CollapsingTabsRef,
  type TabBarRenderProps,
  type TabChangeEvent,
} from './Container';
export { Tab, type TabProps } from './Tab';
export { TabScrollView, type TabScrollViewProps } from './ScrollView';
export { TabFlatList, type TabFlatListProps } from './FlatList';
export { TabSectionList, type TabSectionListProps } from './SectionList';
export { DefaultTabBar, type DefaultTabBarProps } from './TabBar';
export {
  useActiveTabScrollY,
  useAnimatedTabIndex,
  useCollapseProgress,
  useCurrentTabScrollY,
  useFocusedTab,
  useHeaderMeasurements,
  useHeaderScrollY,
  useIsTabFocused,
  useTabIndex,
} from './hooks';
export {
  useRestoreTabOffset,
  useTabContentStyle,
  useTabScrollLifecycle,
} from './adapterUtils';
export { useRegisterTabList } from './hooks-internal';
export {
  useCollapsingTabsContext,
  useTabPageContext,
  type TabListHandle,
} from './context';

/**
 * Compound namespace mirroring react-native-collapsible-tab-view's API:
 *
 *   <Tabs.Container renderHeader={...}>
 *     <Tabs.Tab name="posts" label="Posts">
 *       <Tabs.FlatList ... />
 *     </Tabs.Tab>
 *   </Tabs.Container>
 *
 * FlashList and LegendList adapters live in subpath exports so the packages
 * stay optional: `@scanner/react-native-collapsible-tabs/flash-list` and
 * `@scanner/react-native-collapsible-tabs/legend-list`.
 */
export const Tabs = {
  Container,
  Tab,
  ScrollView: TabScrollView,
  FlatList: TabFlatList,
  SectionList: TabSectionList,
};
