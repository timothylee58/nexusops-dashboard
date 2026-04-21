import { DashboardLayout } from "@/components/DashboardLayout";
import { DashboardFeed } from "@/components/DashboardFeed";
import { CorridorKPIChart } from "@/components/CorridorKPIChart";
import { AlertsPanel } from "@/components/AlertsPanel";

const Index = () => {
  return (
    <DashboardLayout>
      <h1 className="sr-only">NexusOps Payment Corridor Operations Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 flex flex-col gap-4">
          <DashboardFeed />
          <CorridorKPIChart />
        </div>
        <div className="md:col-span-2 lg:col-span-1">
          <AlertsPanel />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Index;
