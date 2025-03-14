// Register Service Worker with update handling
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    // Check for existing service workers and unregister them
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (let registration of registrations) {
      await registration.unregister();
      console.log('ServiceWorker unregistered:', registration.scope);
    }
    
    // Clear caches to ensure fresh content
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
        console.log('All caches cleared');
      } catch (e) {
        console.error('Cache clearing error:', e);
      }
    }
    
    // Register new service worker
    navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' })
      .then(registration => {
        console.log('ServiceWorker registration successful with scope: ', registration.scope);
        
        // Check for updates every minute
        setInterval(() => {
          registration.update();
        }, 60000);
      })
      .catch(err => {
        console.log('ServiceWorker registration failed: ', err);
      });
  });
}

