export default function DashboardPage() {
    return (
        <div className="container mx-auto p-6">
            <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="card-parcel">
                    <h3 className="text-lg font-semibold mb-2">Inventory</h3>
                    <p className="text-gray-600">Manage your product inventory</p>
                </div>
                <div className="card-parcel">
                    <h3 className="text-lg font-semibold mb-2">Orders</h3>
                    <p className="text-gray-600">View and process orders</p>
                </div>
                <div className="card-parcel">
                    <h3 className="text-lg font-semibold mb-2">Analytics</h3>
                    <p className="text-gray-600">Track performance metrics</p>
                </div>
            </div>
        </div>
    );
}
