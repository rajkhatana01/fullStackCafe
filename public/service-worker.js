self.addEventListener('push', function(event) {
    const data = event.data ? event.data.json() : {};
    const title = data.title || 'FullStack Cafe';
    const options = {
        body: data.body || 'You have a new notification.',
        icon: '/images/default-food.png',
        badge: '/images/default-food.png'
    };

    event.waitUntil(self.registration.showNotification(title, options));
});