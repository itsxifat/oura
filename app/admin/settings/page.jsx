import { Settings } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center p-6">
      <div className="bg-gray-100 p-6 rounded-2xl mb-6">
        <Settings size={48} className="text-gray-600" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 font-classic">System Settings</h2>
      <p className="text-gray-500 max-w-md mt-2">
        Manage your admin password and site SEO configurations here.
      </p>
    </div>
  );
}