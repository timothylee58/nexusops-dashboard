import { DashboardLayout } from "@/components/DashboardLayout";
import { Protected } from "@/components/Protected";
import { AuditLogViewer } from "@/components/AuditLogViewer";

const Audit = () => {
  return (
    <DashboardLayout>
      <Protected allowedRoles={["admin"]}>
        <AuditLogViewer />
      </Protected>
    </DashboardLayout>
  );
};

export default Audit;
