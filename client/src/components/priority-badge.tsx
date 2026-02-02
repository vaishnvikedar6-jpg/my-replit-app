import { Badge } from "@/components/ui/badge";
import { AlertCircle, Clock } from "lucide-react";

type Priority = "normal" | "urgent";

export function PriorityBadge({ priority }: { priority: Priority }) {
  if (priority === "normal") {
    return (
      <Badge variant="secondary" className="gap-1 font-normal">
        <Clock className="h-3 w-3" /> Normal
      </Badge>
    );
  }

  return (
    <Badge variant="destructive" className="gap-1 font-medium bg-rose-600">
      <AlertCircle className="h-3 w-3" /> Urgent
    </Badge>
  );
}
