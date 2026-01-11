import { LayoutDashboard } from 'lucide-react';

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-classic font-bold text-gray-900">Dashboard</h2>
        <p className="text-gray-500 mt-1">Welcome back to the admin panel.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Placeholder Stats */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="bg-blue-100 p-4 rounded-xl text-blue-600">
            <LayoutDashboard size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">System Status</p>
            <p className="text-2xl font-bold text-gray-900">Active</p>
          </div>
        </div>
      </div>
    </div>
  );
}