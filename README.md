# react-native-collapsible-tab

Collapsible header tab view for React Native — with **per-tab scroll memory**, a **jump-free header**, and first-class adapters for **FlatList, ScrollView, SectionList, FlashList v2 and LegendList**.

## Demo

> Same gesture, same frame — iOS and Android side by side.

https://github.com/user-attachments/assets/f7fdfd2b-8899-4192-9343-120e3c7b505b


Built on `react-native-reanimated`, `react-native-gesture-handler` and `react-native-pager-view`. All animation runs on the UI thread. Works with Reanimated **3 and 4**, old and New Architecture (FlashList adapter requires New Architecture), and Expo (including Expo Go).

```tsx
import { Tabs } from 'react-native-collapsible-tab';

<Tabs.Container renderHeader={() => <MyHeader />}>
  <Tabs.Tab name="posts" label="Posts">
    <Tabs.FlatList data={posts} renderItem={renderPost} />
  </Tabs.Tab>
  <Tabs.Tab name="about" label="About">
    <Tabs.ScrollView>
      <About />
    </Tabs.ScrollView>
  </Tabs.Tab>
</Tabs.Container>
```

---

## Why another collapsible tab view?

The category's classic bugs come from one architectural decision in existing libraries: tying the header position directly to tab scroll offsets, then force-scrolling every tab to keep them in sync. This library decouples them:

- **The header position is its own animated value**, driven only by scroll *deltas* of the active tab. Tab switches never move the header — no flicker, no jump, no ghost blank space.
- **Each tab keeps its own scroll offset** (keyed by tab name). Switching back to a tab restores exactly where you were. Only the incoming tab is adjusted, only when needed to prevent a gap, and on the UI thread before the page becomes active.
- **The header is drag-to-scrollable *and* its buttons work.** A pan gesture on the header drives the active list (including release momentum) but only activates after 10px of vertical movement, so taps pass through to your touchables.

Pain points of `react-native-collapsible-tab-view` this library fixes or avoids by design:

| Pain point (issue refs) | Here |
|---|---|
| Buttons in header block scrolling (#361, #356, #449 — most-requested, never fixed) | Works: pan gesture + tap pass-through |
| Blank space / ghost header on tab switch (#259, #354, #490) | Structurally impossible: header decoupled from offsets |
| Non-ASCII tab names break sync (#354) | `name` is pure identity; display text goes in `label` |
| Breaks on every Reanimated/Expo bump (#463, #491, #453, #400) | Public Reanimated APIs only; no shared-value reads during render; v3 & v4 compatible |
| `lazy={false}` ignored (#472) | Honest: `lazy` defaults to `false` and means it |
| Jumping to a far tab mounts every intermediate tab (#417) | Only the destination mounts; intermediates stay placeholders |
| `onTabChange` fires for every intermediate tab (#430) | Fires once, for the settled destination |
| `snapThreshold` freezes screen on New Arch (#468) | Snap is plain shared-value animation — no UI-thread scroll deadlock |
| FlashList: header won't collapse, short lists break (#400, #335, #446, #477) | Dedicated v2 adapter: real `Animated.ScrollView` under FlashList via `renderScrollComponent`, footer spacer instead of unsupported `minHeight`, mVCP disabled by default |
| Can't wrap `Tabs.Tab` in your own component (#422) | Children are duck-typed on the `name` prop, not element type |
| Dynamic tabs reset scroll positions (#259 et al.) | Offsets keyed by tab name survive add/remove |
| No scroll-to-top-all-tabs (#38, #267), no scroll position outside tabs (#359) | `ref.scrollAllToTop()`, `useActiveTabScrollY()` |
| Reading shared values during render → warnings, Jest loops (#453, #240) | Never done |

## Installation

```sh
npm install react-native-collapsible-tab
# peer dependencies (you likely have them):
npx expo install react-native-reanimated react-native-gesture-handler react-native-pager-view
```

Optional list backends (only if you use their adapters):

```sh
npx expo install @shopify/flash-list   # v2+, New Architecture only
npm  install @legendapp/list
```

Your app must be wrapped in `<GestureHandlerRootView>` (Expo Router does this for you).

**Requirements:** react-native-reanimated ≥ 3.6, react-native-gesture-handler ≥ 2, react-native-pager-view ≥ 6. iOS & Android (no web — pager-view is native-only).

## Quick start

```tsx
import { Tabs } from 'react-native-collapsible-tab';

function Profile() {
  return (
    <Tabs.Container
      renderHeader={() => <ProfileHeader />}   // measured automatically
      minHeaderHeight={insets.top}             // px that stays visible when collapsed
      lazy                                     // mount tabs on first focus
      snapThreshold={0.5}                      // optional: snap open/closed
    >
      <Tabs.Tab name="posts" label="Posts">
        <Tabs.FlatList
          data={posts}
          renderItem={({ item }) => <Post post={item} />}
          keyExtractor={(item) => item.id}
        />
      </Tabs.Tab>
      <Tabs.Tab name="media" label="Media">
        <Tabs.ScrollView>
          <MediaGrid />
        </Tabs.ScrollView>
      </Tabs.Tab>
    </Tabs.Container>
  );
}
```

FlashList / LegendList come from subpath exports so the packages stay optional:

```tsx
import { TabFlashList } from 'react-native-collapsible-tab/flash-list';
import { TabLegendList } from 'react-native-collapsible-tab/legend-list';
```

## API

### `<Tabs.Container>`

| Prop | Type | Default | Description |
|---|---|---|---|
| `renderHeader` | `() => ReactNode` | — | Collapsible header. Omit for a plain pinned tab bar. Height is measured — no `headerHeight` prop needed. |
| `renderTabBar` | `(props: TabBarRenderProps) => ReactNode` | `DefaultTabBar` | Custom tab bar. |
| `minHeaderHeight` | `number` | `0` | Header px that stays visible when fully collapsed (e.g. safe-area top). |
| `headerBackgroundColor` | `string` | `'#fff'` | Solid backing behind header + tab bar (see [Translucent headers](#design-notes)). |
| `headerContainerStyle` | `StyleProp<ViewStyle>` | — | Extra styles on the animated header wrapper. |
| `containerStyle` | `StyleProp<ViewStyle>` | — | Styles for the outer container. |
| `initialTabName` | `string` | first tab | Tab to focus on mount. |
| `lazy` | `boolean` | `false` | Mount tab content on first focus. Swiping pre-mounts the neighbor; tapping a far tab mounts only the destination. |
| `renderLazyPlaceholder` | `({ name, index }) => ReactNode` | `null` | Shown for unmounted lazy tabs. |
| `revealHeaderOnScroll` | `boolean` | `false` | Any upward scroll reveals the header immediately (Twitter-style). Default: header re-appears when content scrolls back to it. |
| `snapThreshold` | `number \| null` | `null` | When set (0..1), a header released mid-collapse animates fully open or closed. |
| `onIndexChange` | `(index: number) => void` | — | Fires when a tab switch settles. |
| `onTabChange` | `({ prevIndex, index, prevTabName, tabName }) => void` | — | Same timing, richer payload. Never fires for intermediate pages. |
| `pagerProps` | `PagerView` props | — | Escape hatch to the underlying pager (`keyboardDismissMode`, `overdrag`, ...). |

**Ref** (`useRef<CollapsingTabsRef>`): `jumpToTab(name, animated?)`, `setIndex(index, animated?)`, `getFocusedTab()`, `getCurrentIndex()`, `scrollToTop(animated?)`, `scrollAllToTop()`.

### `<Tabs.Tab>`

| Prop | Type | Description |
|---|---|---|
| `name` | `string` | Stable identity (scroll memory, `jumpToTab`). Keep it ASCII-simple; localized text goes in `label`. |
| `label` | `string?` | Display text for the tab bar. Defaults to `name`. |
| `lazy` | `boolean?` | Per-tab override of the container's `lazy`. |
| `swipeEnabled` | `boolean?` | While this tab is focused, disables pager swiping (for horizontal carousels inside). |

You can wrap `Tabs.Tab` in your own component — the container detects children by their `name` prop, not element type. Just forward `name` (and `children`) to the element you return.

### Scrollable components

Drop-in replacements, same props as the underlying component (minus `onScroll`, which the adapter owns):

- `Tabs.ScrollView`
- `Tabs.FlatList`
- `Tabs.SectionList`
- `TabFlashList` from `react-native-collapsible-tab/flash-list` — FlashList **v2** (New Architecture only). `maintainVisibleContentPosition` is disabled by default (it issues animated corrective scrolls that fight tab-switch sync); pass your own to opt back in.
- `TabLegendList` from `react-native-collapsible-tab/legend-list`

Each adapter automatically: pads content below the header + tab bar, guarantees short content can still fully collapse the header, restores saved offsets when a lazy tab mounts, sets sensible `scrollIndicatorInsets` / `progressViewOffset`, and feeds the header collapse + snap logic.

Building your own adapter? The contract is small — see `useTabContentStyle`, `useRegisterTabList`, `useRestoreTabOffset`, `useTabScrollLifecycle` and the `LegendList.tsx` source (~100 lines).

### Hooks

All hooks must be used inside `<Tabs.Container>` (header, tab bar, and tab content all qualify).

| Hook | Returns | Use for |
|---|---|---|
| `useHeaderScrollY()` | `SharedValue<number>` px collapsed | Header animations (parallax, fade) |
| `useCollapseProgress()` | `SharedValue<number>` 0..1 | Normalized header animations |
| `useHeaderMeasurements()` | `{ top: SharedValue, height: number }` | Migration-compatible with collapsible-tab-view |
| `useCurrentTabScrollY()` | `SharedValue<number>` | Raw offset of the tab you're inside |
| `useActiveTabScrollY()` | `SharedValue<number>` | Raw offset of the focused tab, usable in the header |
| `useFocusedTab()` | `SharedValue<string>` | Focused tab name on the UI thread |
| `useAnimatedTabIndex()` | `SharedValue<number>` | Fractional pager position (tab bar indicators) |
| `useIsTabFocused(name)` / `useTabIndex()` | `boolean` / `number` | JS-state focus (re-renders on switch) |

### `DefaultTabBar`

Used when you don't pass `renderTabBar`. Accessible (`tablist`/`tab` roles, selected state) and stylable: `scrollable` (default `true`; `false` = equal-width tabs), `backgroundColor`, `activeColor`, `inactiveColor`, `indicatorColor`, `style`, `tabStyle`, `labelStyle`, `indicatorStyle`, `renderLabel`.

## Example app

The [`example/`](./example) folder is a standalone Expo app (SDK 54, New Architecture, runs in Expo Go) with one screen per feature: basic, snap, reveal-on-scroll, lazy, custom tab bar, dynamic tabs + imperative ref, SectionList, FlashList v2 and LegendList.

```sh
cd example
npm install
npx expo start
```

The example resolves the library from `../src` via Metro config, so library edits hot-reload without a build step.

## Design notes

**Header collapse rules.** Scrolling down collapses the header in sync. Scrolling up (default) keeps it collapsed until the content top reaches it again, then expands in sync — so the header never detaches from content. With `revealHeaderOnScroll`, any upward delta expands it immediately. Snap (when enabled) animates whichever transition keeps content gapless.

**Translucent headers.** The header needs a solid `headerBackgroundColor` because per-tab scroll memory means deep-scrolled content can legitimately sit underneath an expanded header. That trade is what makes tab switches jump-free.

**Sticky section headers** stick to the real viewport top, which sits under the collapsible header until it collapses. This matches native sticky behavior; design section headers with that in mind.

**Sticky / pinned header content.** A custom header animation should fade or scale **in place** — don't translate header content *upward* as it collapses, or it rides past `minHeaderHeight` into the safe-area / status-bar region and overlaps it. Likewise, content that must stay visible while the header collapses (a reading-progress bar, a search field) belongs in the **tab bar** (`renderTabBar`), not the header — the header scrolls away, the tab bar stays pinned.

**Gotcha — scroll offsets go negative on overscroll.** `useCurrentTabScrollY()` / `useActiveTabScrollY()` return the list's raw `contentOffset.y`, which goes **negative on iOS** when the user bounces past the top. (Android doesn't bounce — its offset stays clamped at 0, see below.) If you map a scroll offset to a width, opacity, or progress, clamp the **low** end too — not just the high end:

```ts
// ❌ negative offset → negative width; during bounce-back the bar can flash full
width: `${Math.min((scrollY.value / TOTAL) * 100, 100)}%`

// ✅ clamp both ends so overscroll reads as 0%
width: `${Math.max(0, Math.min((scrollY.value / TOTAL) * 100, 100))}%`
```

Setting `bounces={false}` hides the symptom, but clamping is the real fix and keeps the native bounce.

**Gotcha — pull-to-refresh is platform-split.** Because content is padded below the header, the native `RefreshControl` spinner renders at the content origin — tucked *behind* the header. The robust recipe differs by platform, because the two overscroll differently:

- **Android** — lists don't bounce (the offset stays clamped at 0; you get a stretch/glow). An offset-driven custom pull therefore **can't** work here. Use the native `RefreshControl` and let the adapter's default `progressViewOffset` (= header height) push its spinner below the header, or set it yourself.
- **iOS** — lists bounce, so `contentOffset.y` goes negative past the top. Read that pull distance from `useCurrentTabScrollY()` and drive your **own** spinner pinned in the visible area (below the header) — the native iOS spinner would be hidden behind the header.

```tsx
const scrollY = useCurrentTabScrollY();   // negative on iOS = pull distance
const { height } = useHeaderMeasurements();

<Tabs.FlatList
  refreshControl={
    Platform.OS === 'android'
      ? <RefreshControl refreshing={busy} onRefresh={refresh}
          progressViewOffset={height} />
      : undefined   // iOS: render a custom spinner driven by scrollY instead
  }
/>
```

**Web** is not supported (react-native-pager-view is native-only).

## License

MIT
