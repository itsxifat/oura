import { getShopSettings } from '@/actions/settings';
import ShopSettingsClient from '@/components/admin/ShopSettingsClient';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const shopSettings = await getShopSettings();

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-8">
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">Shop Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage delivery pricing and payment methods.</p>
      </div>
      <ShopSettingsClient initialSettings={shopSettings} />
    </div>
  );
}
