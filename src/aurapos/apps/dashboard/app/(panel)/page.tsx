import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Main dashboard showing AI insights and quick metrics',
};

export default function PanelPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-sm text-gray-600">
          Overview of key metrics and AI-powered insights
        </p>
      </header>

      <div className="grid gap-6">
        {/* Quick Metrics */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Sales Metric */}
          <div className="bg-white rounded-xl shadow-sm p-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Today's Sales</h3>
                <p className="mt-1 text-2xl font-bold text-gray-900">$2,450</p>
                <p className="mt-1 text-sm text-green-600">
                  ▲ 12% from yesterday
                </p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center bg-green-50 rounded-md">
                <span className="text-green-600">📈</span>
              </div>
            </div>
          </div>

          {/* Orders Metric */}
          <div className="bg-white rounded-xl shadow-sm p-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Active Orders</h3>
                <p className="mt-1 text-2xl font-bold text-gray-900">24</p>
                <p className="mt-1 text-sm text-blue-600">
                  ▲ 8% from yesterday
                </p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center bg-blue-50 rounded-md">
                <span className="text-blue-600">📋</span>
              </div>
            </div>
          </div>

          {/* Customers Metric */}
          <div className="bg-white rounded-xl shadow-sm p-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Customers Served</h3>
                <p className="mt-1 text-2xl font-bold text-gray-900">156</p>
                <p className="mt-1 text-sm text-purple-600">
                  ▲ 5% from yesterday
                </p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center bg-purple-50 rounded-md">
                <span className="text-purple-600">👥</span>
              </div>
            </div>
          </div>

          {/* Revenue Metric */}
          <div className="bg-white rounded-xl shadow-sm p-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Monthly Revenue</h3>
                <p className="mt-1 text-2xl font-bold text-gray-900">$48,200</p>
                <p className="mt-1 text-sm text-indigo-600">
                  ▲ 18% from last month
                </p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center bg-indigo-50 rounded-md">
                <span className="text-indigo-600">💰</span>
              </div>
            </div>
          </div>
        </section>

        {/* AI Insights */}
        <section className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            AI-Powered Insights
          </h2>
          <div className="space-y-4">
            {/* Insight Card 1 */}
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 h-10 w-10 items-center justify-center bg-blue-50 rounded-md">
                <span className="text-blue-600">💡</span>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Peak Hours Prediction</h3>
                <p className="mt-1 text-sm text-gray-600">
                  Based on historical data, expect 30% more customers between 12-2 PM tomorrow. Consider increasing staff during this period.
                </p>
              </div>
            </div>

            {/* Insight Card 2 */}
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 h-10 w-10 items-center justify-center bg-green-50 rounded-md">
                <span className="text-green-600">🎯</span>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Menu Optimization</h3>
                <p className="mt-1 text-sm text-gray-600">
                  Items 'Grilled Salmon' and 'Caesar Salad' have 40% higher profit margin. Consider promoting these as chef's specials.
                </p>
              </div>
            </div>

            {/* Insight Card 3 */}
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 h-10 w-10 items-center justify-center bg-purple-50 rounded-md">
                <span className="text-purple-600">📊</span>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Inventory Alert</h3>
                <p className="mt-1 text-sm text-gray-600">
                  Running low on 'Organic Tomatoes' (current stock: 3kg). Recommended reorder: 5kg to avoid stockout during peak hours.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}