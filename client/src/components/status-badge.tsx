import { Badge } from "@/components/ui/badge";

type Status = "pending" | "under_review" | "resolved" | "rejected";

export function StatusBadge({ status }: { status: Status }) {
  const styles = {
    pending: "bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200",
    under_review: "bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200",
    resolved: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200",
    rejected: "bg-rose-100 text-rose-700 hover:bg-rose-100 border-rose-200",
  };

  const labels = {
    pending: "Pending",
    under_review: "Under Review",
    resolved: "Resolved",
    rejected: "Rejected",
  };

  return (
    <Badge variant="outline" className={`${styles[status]} px-3 py-1 font-medium capitalize`}>
      {labels[status]}
    </Badge>
  );
}
