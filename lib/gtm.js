'use client'

function push(payload) {
  if (typeof window === 'undefined') return
  window.dataLayer = window.dataLayer || []
  window.dataLayer.push(payload)
}

export function trackEvent(eventName, params = {}) {
  push({ event: eventName, ...params })
}

export function trackPageView(url) {
  push({ event: 'page_view', page_path: url })
}

export function trackViewItem(item) {
  push({
    event: 'view_item',
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
  push({
    event: 'add_to_cart',
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
  push({
    event: 'begin_checkout',
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
  push({
    event: 'purchase',
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

export function trackSearch(term) {
  push({ event: 'search', search_term: term })
}

export function trackAddToWishlist(item) {
  push({
    event: 'add_to_wishlist',
    ecommerce: {
      currency: 'BDT',
      value: item.price,
      items: [{ item_id: item.id, item_name: item.name, price: item.price, quantity: 1 }],
    },
  })
}
