'use client'

export function trackEvent(eventName, params = {}) {
  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push({ event: eventName, ...params })
  }
}

export function trackPageView(url) {
  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push({ event: 'page_view', page_path: url })
  }
}

export function trackViewItem(item) {
  trackEvent('view_item', {
    ecommerce: {
      currency: 'BDT',
      value: item.price,
      items: [{
        item_id: item.id,
        item_name: item.name,
        item_category: item.category,
        price: item.price,
        quantity: 1,
      }],
    },
  })
}

export function trackAddToCart(item, quantity = 1) {
  trackEvent('add_to_cart', {
    ecommerce: {
      currency: 'BDT',
      value: item.price * quantity,
      items: [{
        item_id: item.id,
        item_name: item.name,
        item_category: item.category,
        price: item.price,
        quantity,
      }],
    },
  })
}

export function trackBeginCheckout(items, total) {
  trackEvent('begin_checkout', {
    ecommerce: {
      currency: 'BDT',
      value: total,
      items: items.map(i => ({
        item_id: i.id,
        item_name: i.name,
        price: i.price,
        quantity: i.quantity,
      })),
    },
  })
}

export function trackPurchase(orderId, items, total) {
  trackEvent('purchase', {
    ecommerce: {
      transaction_id: orderId,
      currency: 'BDT',
      value: total,
      items: items.map(i => ({
        item_id: i.id,
        item_name: i.name,
        price: i.price,
        quantity: i.quantity,
      })),
    },
  })
}
