# It's an image comparison
<a href="https://www.npmjs.com/package/its-an-image-comparison" aria-label="go to NPM package" title="go to NPM package">
    <img src="https://omarcastro.github.io/its-an-image-comparison/reports/npm-version-badge-a11y.svg"></img>
</a><a href="https://github.com/OmarCastro/its-an-image-comparison/releases/latest" aria-label="go to release page" title="go to release page">
    <img src="https://omarcastro.github.io/its-an-image-comparison/reports/repo-release-a11y.svg"></img>
</a><a href="https://github.com/OmarCastro/its-an-image-comparison" aria-label="go to Github repository" title="go to Github repository">
    <img src="https://omarcastro.github.io/its-an-image-comparison/reports/license-badge-a11y.svg">
</a><a href="https://omarcastro.github.io/its-an-image-comparison/reports/playwright-report" aria-label="Show test results">
    <img src="https://omarcastro.github.io/its-an-image-comparison/reports/test-results/test-results-badge-a11y.svg">
</a><a href="https://omarcastro.github.io/its-an-image-comparison/reports/coverage/final" aria-label="Show test code coverage information">
    <img src="https://omarcastro.github.io/its-an-image-comparison/reports/coverage/final/coverage-badge-a11y.svg">
</a>

"It's an image comparison" is a web component that compares 2 images

## Getting started 

### CDN

To use a CDN all you need is to add the following code in the HTML page:

```html
<script type="module" src="https://cdn.jsdelivr.net/gh/OmarCastro/its-an-image-comparison@0.1.0/dist/image-comparison.element.min.js?named=image-comparison"></script>
```


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
