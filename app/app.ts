import * as chokidar from 'chokidar';
import * as WebSocket from 'ws';
import * as kleur from 'kleur';
import * as path from 'path';
import * as http from 'http';
import * as fs from 'fs';

const DEFAULT_WS_PORT = 1238;
const DEFAULT_SERVE_PATH = '/__autoreload.js';

export interface SharedOptions {
	/**
	 * What port to use for the websocket endpoint
	 */
	port?: number;
}

export interface ServeOptions extends SharedOptions {
	/**
	 * At what path to serve the __autoreload.js file
	 */
	servePath?: string;
}

export interface WatchPathConfig {
	/**
	 * The path to watch
	 */
	watchPath: string;
	/**
	 * Events to listen for
	 */
	events?: ('change' | 'add' | 'addDir')[];
	/**
	 * Options for chokidar
	 */
	options?: chokidar.WatchOptions;
}

export interface WatcherOptions extends SharedOptions {
	/**
	 * Configurations for logging
	 */
	log?: {
		/**
		 * Whether to log that autoreload is listening and where
		 */
		listen?: boolean;
		/**
		 * Whether to log when a reload takes place
		 */
		reload?: boolean;
		/**
		 * Whether to log what file(s) changed
		 */
		file?: boolean;
	};
	/**
	 * The paths to watch
	 */
	paths?: (WatchPathConfig | string)[];
}

/**
 * Serve the auto reload file using your regular endpoint. This is needed
 * to make sure the frontend can fetch the autoreload JS
 *
 * @param {ServeOptions} [options] - Options for this serve function
 * @param {number} [options.port] - The port on which to listen
 * @param {string} [options.servePath] - The path at which to serve
 * 	the __autoreload.js file
 *
 * @returns {(req: http.IncomingMessage, res: http.ServerResponse, next: (err?: Error) => void) => void} A connect-style function
 */
export function serveReload(
	options?: ServeOptions
): (
	req: http.IncomingMessage,
	res: http.ServerResponse,
	next: (err?: Error) => void
) => void {
	const port = options?.port || DEFAULT_WS_PORT;
	const servePath = options?.servePath || DEFAULT_SERVE_PATH;

	const rawFile = fs.readFileSync(
		path.join(__dirname, 'static', 'autoreload.js'),
		{
			encoding: 'utf8',
		}
	);
	const file = rawFile.replace(/PORT/, port + '');

	return (
		req: http.IncomingMessage,
		res: http.ServerResponse,
		next: (err?: Error) => void
	) => {
		if (!req.url || req.url !== servePath) {
			return next();
		}

		res.setHeader('Content-Type', 'application/javascript; charset=UTF-8');
		res.setHeader('Content-Length', file.length);
		res.write(file);
		res.end();
	};
}

function log(msg: string) {
	process.stdout.write(`${kleur.blue('[ autoreload ]')} - ${msg}\n`);
}

/**
 * Sets up the file watcher and actual reloader.
 *
 * @param {WatcherOptions} [options] - Options for this function
 * @param {number} [options.port] - The port on which to listen
 * @param {WatcherOptions['log']} [options.log] - A config for logging
 * @param {boolean} [options.log.listen] - Whether to log that autoreload is listening and where
 * @param {boolean} [options.log.reload] - Whether to log when a reload takes place
 * @param {boolean} [options.log.file] - Whether to log what file(s) changed
 * @param {WatcherOptions['paths']} [options.paths] - The paths to watch
 */
export function autoReloadWatcher(options?: WatcherOptions) {
	// IO
	const port = options?.port || DEFAULT_WS_PORT;
	const paths = options?.paths || [];

	const logSettings: Required<WatcherOptions['log']> = {
		file:
			typeof options?.log?.file === 'boolean'
				? options?.log?.file
				: false,
		listen:
			typeof options?.log?.listen === 'boolean'
				? options?.log?.listen
				: true,
		reload:
			typeof options?.log?.reload === 'boolean'
				? options?.log?.reload
				: true,
	};

	// Record sessions
	const wsServer = new WebSocket.Server({ port });
	const sessions: Set<WebSocket> = new Set();
	let versionIndex: number = 0;
	wsServer.on('connection', (ws) => {
		sessions.add(ws);
		ws.on('close', () => sessions.delete(ws));

		ws.send(
			JSON.stringify({
				type: 'version',
				index: versionIndex,
			})
		);
	});
	if (logSettings.listen) {
		wsServer.on('listening', () => {
			log(`WS server listening on port ${port}`);
		});
	}

	// Watch
	paths.forEach((watchPathConfig) => {
		const { watchPath, events, options } = ((): Required<
			WatchPathConfig
		> => {
			if (typeof watchPathConfig === 'string') {
				return {
					watchPath: watchPathConfig,
					events: ['change'],
					options: {},
				};
			}
			return {
				watchPath: watchPathConfig.watchPath,
				events: watchPathConfig.events || ['change'],
				options: watchPathConfig.options || {},
			};
		})();
		const watcher = chokidar.watch(watchPath, options);
		events.forEach((event) => {
			watcher.on(event, (changePath) => {
				versionIndex++;

				if (logSettings.file) {
					if (event === 'add') {
						log(`File "${changePath}" added`);
					} else if (event === 'addDir') {
						log(`Dir "${changePath}" added`);
					} else if (event === 'change') {
						log(`File "${changePath}" changed`);
					}
				}
				if (logSettings.reload) {
					log('File changed, reloading client...');
				}

				sessions.forEach((session) => {
					session.send(
						JSON.stringify({
							type: 'reload',
							index: versionIndex,
						})
					);
				});
			});
		});
	});
}

/**
 * Serve the auto reload file using your regular endpoint as well as
 * start the watcher. This is basically just a wrapper function for the
 * serveReload and autoReloadWatcher functions for when you want to start
 * them both at the same time.
 *
 * @param {WatcherOptions} options - Options for the autoreload watcher and server
 *
 * @returns {(req: http.IncomingMessage, res: http.ServerResponse, next: (err?: Error) => void) => void} A connect-style function
 */
export function autoReload(
	options?: WatcherOptions
): (
	req: http.IncomingMessage,
	res: http.ServerResponse,
	next: (err?: Error) => void
) => void {
	autoReloadWatcher(options);
	return serveReload(options);
}

export const includeHTML = '<script src="/__autoreload.js"></script>';
