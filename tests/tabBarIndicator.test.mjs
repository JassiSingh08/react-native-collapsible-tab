import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const packageRoot = new URL('../', import.meta.url);

// Execute the tab bar with hook doubles. No layout events are
// delivered unless a test explicitly sends them, matching the first render.
function mount(entry, { count = 4, position = 0, scrollable = false } = {}) {
    let evaluateIndicator;
    const indexDecimal = { value: position };
    const react = {
        useCallback: (fn) => fn,
        useEffect: () => {},
        useRef: (current) => ({ current }),
        useState: (value) => [value, () => {}],
    };
    const native = {
        Platform: { OS: 'ios' }, View: 'View', ScrollView: 'ScrollView', Pressable: 'Pressable', Text: 'Text',
        StyleSheet: { create: (styles) => styles, hairlineWidth: 1 },
    };
    const animated = {
        View: 'AnimatedView',
        useSharedValue: (value) => ({ value }),
        useAnimatedStyle: (fn) => { evaluateIndicator = fn; return fn(); },
    };
    const source = readFileSync(new URL(entry, packageRoot), 'utf8');
    const code = ts.transpileModule(source, {
        fileName: entry,
        compilerOptions: {
            module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
            jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true,
        },
    }).outputText;
    const exports = {};
    vm.runInNewContext(code, {
        exports,
        require: (id) => {
            if (id === 'react') return react;
            if (id === 'react-native') return native;
            if (id === 'react-native-reanimated') return animated;
            if (id === 'react/jsx-runtime') {
                const jsx = (type, props) => ({ type, props });
                return { jsx, jsxs: jsx };
            }
            return require(id);
        },
    });
    const tree = exports.DefaultTabBar({
        tabNames: Array.from({ length: count }, (_, i) => `tab-${i}`),
        indexDecimal, activeIndex: Math.floor(position), scrollable,
        onTabPress: () => {}, focusedTab: { value: 'tab-0' },
    });
    return { tree, indexDecimal, style: () => JSON.parse(JSON.stringify(evaluateIndicator())) };
}

for (const entry of ['src/TabBar.tsx']) {
    test(`${entry}: fixed indicator is visible before any layout event`, () => {
        for (const count of [1, 3, 4]) {
            const bar = mount(entry, { count });
            assert.equal(bar.style().opacity, 1);
            assert.equal(bar.style().width, `${100 / count}%`);
            assert.equal(bar.style().left, '0%');
        }
    });
    test(`${entry}: fixed indicator tracks swipes and clamps overscroll without measurements`, () => {
        const bar = mount(entry, { position: 2 });
        assert.equal(bar.style().left, '50%');
        bar.indexDecimal.value = 1.5;
        assert.equal(bar.style().left, '37.5%');
        bar.indexDecimal.value = -1;
        assert.equal(bar.style().left, '0%');
        bar.indexDecimal.value = 5;
        assert.equal(bar.style().left, '75%');
    });
    test(`${entry}: empty tab bar stays hidden with finite geometry`, () => {
        const bar = mount(entry, { count: 0 });
        assert.equal(bar.style().opacity, 0);
        assert.equal(bar.style().width, 0);
    });
    test(`${entry}: scrollable indicator retains measured interpolation`, () => {
        const bar = mount(entry, { count: 2, scrollable: true, position: 0.5 });
        assert.equal(bar.style().opacity, 0);
        const items = bar.tree.props.children.props.children[0];
        items[0].props.onLayout({ nativeEvent: { layout: { x: 12, width: 80 } } });
        assert.equal(bar.style().opacity, 0);
        items[1].props.onLayout({ nativeEvent: { layout: { x: 92, width: 120 } } });
        assert.equal(bar.style().opacity, 1);
        assert.equal(bar.style().width, 100);
        assert.equal(bar.style().transform[0].translateX, 52);
    });
}
