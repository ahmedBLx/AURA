// Runtime polyfills for older browsers — notably iOS Safari < 15.4 and
// older iPhones stuck on iOS 12–14.
//
// React 19 / Next 15 emit modern JS runtime APIs (e.g. Array.prototype.at,
// Object.hasOwn, structuredClone, String.prototype.replaceAll) that these
// engines lack and that Next.js does NOT polyfill on its own. On such devices
// the app's JavaScript throws during hydration, and Next's App Router "recovers"
// by hard-reloading the page — producing the flicker → refresh-loop → tab-crash
// behavior reported on old iPhones.
//
// Importing core-js/stable fills those gaps. It is imported from the outermost
// client provider (ThemeContext) so it evaluates before any other client code.
import 'core-js/stable';
