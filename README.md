# Autoreload

A simple package for reloading your frontend when something changes. Where other similar packages only reload after something changes, this one always makes sure you're using the latest version. This way you'll never have to manually reload because the change happened during a previous reload.

## Installation

Run `npm install @sanderronde/autoreload --save` or `yarn add @sanderronde/autoreload`

## How to use

There are two steps to getting this working. The first is to get the watcher and file server working, the second is to include the HTML into your response.

To get the added HTML line into your response, you can either paste the raw string into your HTML file (`<script src="/__autoreload.js"></script>`) or you could import the `includeHTML` string from the package to write/include it somewhere. If you want to change this URL you can, [see the options section](#options).

```html
...
<body>
	<main-app></main-app>
	<script src="/__autoreload.js"></script>
</body>
...
```

To get the actual server and watcher runing, you'll want to call the `autoReload()` function somewhere in your routing setup, such that the handler it returns can be... handled. Example:

```ts
import { autoReload } from '@sanderronde/autoreload';

const app = express(); // or any other connect-style middleware
app.use(autoReload());
```

That's it. Now of course you'll want to configure what files will be watched and maybe you're running into port issues. To choose the port on which the websocket server is listening, pass the `port` option.

```ts
app.use(autoReload({ port: 1234 }));
```

To configure the paths you can use either a raw path or you can pass additional options to the underlying `chokidar` listener. Some examples:

```ts
app.use(autoReload({
	paths: [
		'app/client/build/', // Watch a raw path for changes
		{
			watchPath: 'app/client/src/',
			events?: ['change', 'add', 'addDir'], // Maybe listen for multiple events
			options?: { // Or pass some options to chokidar
				persistent: true,
				ignoreInitial: true
				...
			}
		}
	]
}));
```

For more info about what the `chokidar` config looks like, check out [its github page](https://github.com/paulmillr/chokidar#persistence).

## API

`includeHTML` - A simple string of HTML that should be in some way included into your final HTML bundle.

`serveReload([options])` - Sets up the file server. Split up version of `autoReload` in case you want to do both steps at different places.

-   `[options]` (object) Optional options object
-   `[options.port]` (number, default: 1238) The port on which to host the websocket server
-   `[options.servePath]` (string, default: `__autoreload.js`) The path at which to serve the file the client will download
-   `returns` a connect-style handler that should be used by your app.

`autoReloadWatcher([options])` - Sets up the watcher and reloader. Split up version of `autoReload` in case you want to do both steps at different places.

-   `[options]` (object) Optional options object
-   `[options.port]` (number, default: 1238) The port on which to host the websocket server
-   `[options.log]` (object) Several options regarding logging
-   `[options.log.listen]` (boolean, default: true) Log when starting to listen
-   `[options.log.reload]` (boolean, default: true) Log when reloading
-   `[options.log.file]` (boolean, default: false) Log what file has changed
-   `[options.paths]` (string or object[], default: []) An array describing what paths you want to listen to.
-   `options.paths[0]` (string or object) Strings are passed to `chokidar` with event type `change` and with no options object. See below for when an object is passed.
-   `options.paths[0].watchPath` (string) The path to watch
-   `[options.paths[0].events]` (string[]) Events to listen for. An array that can have the following values: `change`, `add` and `addDir`.
-   `[options.paths[0].options]` (object) Options object that is passed to `chokidar`. See [chokidar documentation](https://github.com/paulmillr/chokidar#persistence) for more info.

`autoReload([options])` - Sets up the file server, watcher and reloader. Basically a wrapper that calls both `autoReloadWatcher` and `serveReload` and returns the latter.

-   `[options]` (object) Optional options object
-   `[options.port]` (number, default: 1238) The port on which to host the websocket server
-   `[options.log]` (object) Several options regarding logging
-   `[options.log.listen]` (boolean, default: true) Log when starting to listen
-   `[options.log.reload]` (boolean, default: true) Log when reloading
-   `[options.log.file]` (boolean, default: false) Log what file has changed
-   `[options.paths]` (string or object[], default: []) An array describing what paths you want to listen to.
-   `options.paths[0]` (string or object) Strings are passed to `chokidar` with event type `change` and with no options object. See below for when an object is passed.
-   `options.paths[0].watchPath` (string) The path to watch
-   `[options.paths[0].events]` (string[]) Events to listen for. An array that can have the following values: `change`, `add` and `addDir`.
-   `[options.paths[0].options]` (object) Options object that is passed to `chokidar`. See [chokidar documentation](https://github.com/paulmillr/chokidar#persistence) for more info.
-   `[options.servePath]` (string, default: `__autoreload.js`) The path at which to serve the file the client will download
-   `returns` a connect-style handler that should be used by your app.

## License

```text
The MIT License (MIT)

Copyright (c) 2020 Sander Ronde

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
