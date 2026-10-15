if (typeof window !== 'undefined' && 'serviceWorker' in navigator && import.meta.env && import.meta.env.PROD) {
	window.addEventListener('load', () => {
		navigator.serviceWorker.register('/service-worker.js').catch((error) => {
			console.error('Error during service worker registration:', error);
		});
	});
}
