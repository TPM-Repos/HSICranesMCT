// Register Service Worker with improved update handling
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Register the service worker
    navigator.serviceWorker.register('./sw.js')
      .then(registration => {
        console.log('ServiceWorker registration successful with scope: ', registration.scope);
        
        // Check for updates on page load
        registration.update();
        
        // Handle service worker updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          console.log('New service worker installing...');
          
          newWorker.addEventListener('statechange', () => {
            console.log('Service worker state changed to:', newWorker.state);
            
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('New service worker installed, but waiting to activate');
              
              // Notify user about the update and offer to refresh
              if (confirm('New version available! Reload to update?')) {
                window.location.reload();
              }
            }
          });
        });
      })
      .catch(err => {
        console.log('ServiceWorker registration failed: ', err);
      });
      
    // Listen for messages from the service worker
    navigator.serviceWorker.addEventListener('message', event => {
      if (event.data && event.data.action === 'cacheCleared') {
        console.log('Cache was cleared by service worker');
      }
    });
  });
  
  // Add a function to manually clear the cache
  window.clearPWACache = function() {
    if (navigator.serviceWorker.controller) {
      console.log('Sending clear cache message to service worker');
      navigator.serviceWorker.controller.postMessage({
        action: 'clearCache'
      });
      
      // Force update of the service worker
      navigator.serviceWorker.ready.then(registration => {
        registration.update();
      });
    }
  };
}