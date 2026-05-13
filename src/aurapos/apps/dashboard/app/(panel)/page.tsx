import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Main dashboard showing AI insights and quick metrics',
};

export default function PanelPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      
      <div className="grid gap-6 mb-8">
        {/* Quick Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h3 className="text-sm font-medium text-gray-500">Total Sales</h3>
            <p className="mt-2 text-2xl font-bold">$0</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h3 className="text-sm font-medium text-gray-500">Today's Orders</h3>
            <p className="mt-2 text-2xl font-bold">0</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h3 className="text-sm font-medium text-gray-500">Avg. Order Value</h3>
            <p className="mt-2 text-2xl font-bold">$0</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h3 className="text-sm font-medium text-gray-500">New Customers</h3>
            <p className="mt-2 text-2xl font-bold">0</p>
          </div>
        </div>
        
        {/* AI Insights */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold mb-4">AI Insights</h2>
          <div className="space-y-3">
            <div className="bg-white rounded-xl shadow-sm p-4">
              <h3 className="font-medium">Sales Trend Prediction</h3>
              <p className="mt-1 text-sm text-gray-600">
                Based on last 30 days, sales expected to increase 15% next week.
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4">
              <h3 className="font-medium">Inventory Optimization</h3>
              <p className="mt-1 text-sm text-gray-600">
                Top 3 selling items: Burger, Fries, Coke. Consider increasing stock.
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4">
              <h3 className="font-medium">Customer Behavior</h3>
              <p className="mt-1 text-sm text-gray-600">
                Peak hours: 12-2 PM and 6-8 PM. Schedule extra staff during these times.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}