'use client';

import { useState } from 'react';
import DeliveryStatusModal from '@/components/DeliveryStatusModal';
import { getOrderStatus } from '@/actions/steadfast';

export default function DeliveryStatusPageClient({ initialOrder }) {
  const [order, setOrder] = useState(initialOrder);

  const handleRefresh = async () => {
    const fresh = await getOrderStatus(initialOrder.orderId.replace('#', ''));
    if (fresh) setOrder(fresh);
  };

  return (
    <div className="max-w-lg mx-auto">
      <DeliveryStatusModal
        order={order}
        isPage
        onRefreshFromServer={handleRefresh}
      />
    </div>
  );
}
