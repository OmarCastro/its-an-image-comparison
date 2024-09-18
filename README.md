# It's an image comparison

[![npm version](https://omarcastro.github.io/its-an-image-comparison/reports/npm-version-badge-a11y.svg)](https://www.npmjs.com/package/its-an-image-comparison)
[![latest version](https://omarcastro.github.io/its-an-image-comparison/reports/repo-release-a11y.svg)](https://github.com/OmarCastro/its-an-image-comparison/releases/latest)
[![License](https://omarcastro.github.io/its-an-image-comparison/reports/license-badge-a11y.svg)](https://github.com/OmarCastro/its-an-image-comparison/blob/main/LICENSE)
[![Continuous Integration Test Report](https://omarcastro.github.io/its-an-image-comparison/reports/test-results/test-results-badge-a11y.svg)](https://omarcastro.github.io/its-an-image-comparison/reports/playwright-report)
[![Test Coverage Report](https://omarcastro.github.io/its-an-image-comparison/reports/coverage/final/coverage-badge-a11y.svg)](https://omarcastro.github.io/its-an-image-comparison/reports/coverage/final)


"It's an image comparison" is a web component that compares 2 images

## Getting started 

### CDN

To use a CDN all you need is to add the following code in the HTML page:

```html
<script type="module" src="https://cdn.jsdelivr.net/gh/OmarCastro/its-an-image-comparison/dist/image-comparison.element.min.js?named=image-comparison"></script>
```

The query string `named` automatically registers the component with the value defined

### NPM

If you wish to import from npm and use a bundler, you can install the `its-an-image-comparison` package

```bash
npm install its-an-image-comparison
```

Not all bundlers support query strings, it is recommended to import and register the component, like the following code:

```js
import element from 'its-an-image-comparison'
customElements.define('image-comparison', element)
```


## Documentation

This project uses Github page to show the documentation, it is in https://omarcastro.github.io/its-an-image-comparison
