# vite-plugin-dynamic-prefetch
![License](https://img.shields.io/badge/license-MIT-green)
<img src='https://cdn.rawgit.com/sindresorhus/awesome/d7305f38d29fed78fa85652e3a63e154dd8e8829/media/badge.svg' alt='Awesome'>

`vite-plugin-dynamic-prefetch` is a Vite plugin that enhances the performance of web applications by supporting prefetching for dynamic imports **at runtime**. This plugin allows developers to optimize loading times by prefetching resources that are likely to be needed in the near future.

## The Problem It Solves
In modern web applications, dynamic imports are often used to load modules on demand. However, this can lead to delays in loading critical resources, negatively impacting the user experience. This plugin addresses this issue by automatically generating prefetch links for dynamic imports when used with `import()` syntax, a feature not natively supported by the current version of Vite. The syntax of this plugin is inspired by Webpack's hint comment in the prefetch module feature.


## How to Install It
To install `vite-plugin-dynamic-prefetch`, run the following command in your project directory:
```
npm install --save-dev vite-plugin-dynamic-prefetch
```

## Usage
Inject `vite-plugin-dynamic-prefetch` in the Vite config:
```js

import { defineConfig } from 'vite'
import dynamicPrefetch from 'vite-plugin-dynamic-prefetch'

export default defineConfig({
  plugins: [dynamicPrefetch()],
})
```
Add the hint comment `/* vitePrefetch: true */` right before the module path in the import statement:
```js

import { lazy } from 'react';

const ComponentA = lazy(() => import(/* vitePrefetch: true */ 'path/to/ComponentA'))

```
## Limitations
The current version has the following limitations:
- Compatible only with Vite 4.0.0 and above.
- Does not support variable import paths.
- Works for bundled code (not in development mode).
## License
MIT
