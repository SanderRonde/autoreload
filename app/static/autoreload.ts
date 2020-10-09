declare const PORT: number;

{
	function getCookie<V extends string>(name: string): string | V | undefined {
		if (typeof document === undefined || !('cookie' in document)) {
			return undefined;
		}

		const cookies = document.cookie.split(';').map((cookieString) => {
			const [key, ...rest] = cookieString.trim().split('=');
			return {
				key,
				value: rest.join('='),
			};
		});

		for (const { key, value } of cookies) {
			if (key === name) return value;
		}

		return undefined;
	}

	type WSMessage =
		| {
				type: 'version';
				index: number;
		  }
		| {
				type: 'reload';
				index: number;
		  };

	function reload(index: number) {
		document.cookie = `__autoreload=${index}`;
		location.reload();
	}

	function onMessage(str: string) {
		const data = JSON.parse(str) as WSMessage;

		if (data.type === 'version') {
			const value = getCookie('__autoreload');
			if (value && value !== data.index + '') {
				reload(data.index);
			}
		} else if (data.type === 'reload') {
			reload(data.index);
		}
	}

	function connect() {
		const ws = new WebSocket(
			`ws://${location.hostname}:${PORT}/__autoreload`
		);
		ws.onclose = () => window.setTimeout(connect, 1500);

		ws.onmessage = (message) => {
			onMessage(message.data);
		};
	}

	connect();
}
