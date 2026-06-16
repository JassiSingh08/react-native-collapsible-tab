# Migrating from react-native-collapsible-tab-view

Most code maps one-to-one. The biggest behavioral difference is an upgrade: tab switches never move the header, and every tab remembers its own scroll position.

## Imports

```diff
-import { Tabs, MaterialTabBar } from 'react-native-collapsible-tab-view';
+import { Tabs, DefaultTabBar } from '@scanner/react-native-collapsible-tabs';
```

FlashList moves to a subpath (and requires FlashList v2 / New Architecture):

```diff
-<Tabs.FlashList ... />
+import { TabFlashList } from '@scanner/react-native-collapsible-tabs/flash-list';
+<TabFlashList ... />
```

## Container props

| collapsible-tab-view | collapsing-tabs |
|---|---|
| `renderHeader` | `renderHeader` (no props injected — use hooks instead) |
| `headerHeight` | not needed — measured automatically |
| `minHeaderHeight` | `minHeaderHeight` |
| `snapThreshold` | `snapThreshold` |
| `revealHeaderOnScroll` | `revealHeaderOnScroll` |
| `lazy` / `cancelLazyFadeIn` | `lazy` (no fade; use `renderLazyPlaceholder`) |
| `initialTabName` | `initialTabName` |
| `onIndexChange` / `onTabChange` | same names; `onTabChange` fires once per settled switch, never for intermediate tabs |
| `pagerProps` | `pagerProps` |
| `containerStyle` | `containerStyle` |
| `headerContainerStyle` | `headerContainerStyle` + `headerBackgroundColor` |
| `allowHeaderOverscroll` | not needed (different architecture) |
| `width` / `minHeaderHeight` measurement quirks | gone — everything is measured |

## Tab props

`<Tabs.Tab name label>` — same. New here: per-tab `lazy` and `swipeEnabled`. If you used non-ASCII strings as `name` (the incumbent's #354 workaround territory), put them in `label` and keep `name` simple.

## Ref methods

| collapsible-tab-view | collapsing-tabs |
|---|---|
| `jumpToTab(name)` | `jumpToTab(name, animated?)` |
| `setIndex(index)` | `setIndex(index, animated?)` |
| `getFocusedTab()` | `getFocusedTab()` |
| `getCurrentIndex()` | `getCurrentIndex()` |
| — | `scrollToTop(animated?)`, `scrollAllToTop()` |

## Hooks

| collapsible-tab-view | collapsing-tabs |
|---|---|
| `useCurrentTabScrollY()` | `useCurrentTabScrollY()` (same semantics) — or `useActiveTabScrollY()` outside tab content |
| `useHeaderMeasurements()` | `useHeaderMeasurements()` |
| `useFocusedTab()` | `useFocusedTab()` |
| `useAnimatedTabIndex()` | `useAnimatedTabIndex()` |
| `useCollapsibleStyle()` | usually unnecessary; adapters handle padding. For custom adapters: `useTabContentStyle()` |
| — | `useHeaderScrollY()`, `useCollapseProgress()`, `useIsTabFocused(name)`, `useTabIndex()` |

## Tab bar

`MaterialTabBar` → `DefaultTabBar`. Prop mapping: `labelStyle`→`labelStyle`, `indicatorStyle`→`indicatorStyle`, `activeColor`/`inactiveColor` same, `scrollEnabled`→`scrollable`. For anything fancier, `renderTabBar` receives `{ tabNames, tabLabels, focusedTab, indexDecimal, activeIndex, onTabPress }`.

## Behavioral differences to expect

1. **Tab switches don't scroll other tabs to match the header.** Each tab keeps its position; the incoming tab is only nudged when needed to avoid a gap. Users coming from the incumbent will perceive this as a fix.
2. **Header animations should use `useHeaderScrollY()`/`useCollapseProgress()`** (header state), not the active tab's raw offset — a deep-scrolled tab can be active while the header is expanded.
3. **The header needs a solid background color** (`headerBackgroundColor`), since content may sit under it.
