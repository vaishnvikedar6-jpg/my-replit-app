import { useGrievance, useUpdateGrievance } from "@/hooks/use-grievances";
import { useAuth } from "@/hooks/use-auth";
import { useRoute } from "wouter";
import Layout from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/status-badge";
import { PriorityBadge } from "@/components/priority-badge";
import { ArrowLeft, Clock, User, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";
import { useState } from "react";

export default function GrievanceDetails() {
  const [match, params] = useRoute("/grievances/:id");
  const id = parseInt(params?.id || "0");
  const { data: grievance, isLoading } = useGrievance(id);
  const { user } = useAuth();
  
  if (isLoading) return <LoadingSkeleton />;
  if (!grievance) return <div>Not found</div>;

  const isAdmin = user?.role === "admin" || user?.role === "staff";

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <Link href={isAdmin ? "/admin" : "/dashboard"} className="text-slate-500 hover:text-slate-900 transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <span className="text-slate-400">/</span>
          <span className="text-slate-600">Grievance #{grievance.id}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-6">
            <Card className="shadow-md border-t-4 border-t-primary">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle className="text-2xl font-bold text-slate-900">
                      {grievance.title}
                    </CardTitle>
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Clock className="h-4 w-4" />
                      {format(new Date(grievance.createdAt), "MMMM d, yyyy 'at' h:mm a")}
                    </div>
                  </div>
                  {isAdmin && grievance.isFlagged && (
                    <Badge variant="destructive" className="animate-pulse">
                      <AlertTriangle className="mr-1 h-3 w-3" /> Flagged by AI
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {isAdmin && grievance.isFlagged && (
                   <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 mb-6 text-sm text-rose-800">
                     <strong>Automated Flag:</strong> Possible inappropriate content detected. Review carefully.
                   </div>
                )}
                
                <div className="prose max-w-none text-slate-700 leading-relaxed">
                  {grievance.description}
                </div>

                <div className="mt-8 pt-6 border-t grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-500 block mb-1">Submitted By</span>
                    {grievance.isAnonymous ? (
                      <Badge variant="secondary">Anonymous Student</Badge>
                    ) : (
                      <div className="flex items-center gap-2 font-medium">
                        <User className="h-4 w-4 text-slate-400" />
                        Student ID: {grievance.userId}
                      </div>
                    )}
                  </div>
                  <div>
                    <span className="text-slate-500 block mb-1">Category</span>
                    <Badge variant="outline">{grievance.category}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Logs / Timeline */}
            <div className="space-y-4">
               <h3 className="text-lg font-bold">Activity Log</h3>
               <div className="relative border-l-2 border-slate-200 ml-4 space-y-8 pb-8">
                  {grievance.logs.length === 0 && (
                    <p className="text-slate-400 text-sm ml-6 italic">No activity yet.</p>
                  )}
                  {grievance.logs.map((log) => (
                    <div key={log.id} className="relative ml-6">
                      <div className="absolute -left-[31px] bg-slate-100 border-4 border-white h-6 w-6 rounded-full flex items-center justify-center">
                        <div className="h-2 w-2 rounded-full bg-slate-400"></div>
                      </div>
                      <div className="bg-white p-4 rounded-lg border shadow-sm">
                        <div className="flex justify-between text-xs text-slate-400 mb-1">
                           <span className="font-bold text-slate-700 capitalize">{log.action.replace('_', ' ')}</span>
                           <span>{format(new Date(log.createdAt), "MMM d, h:mm a")}</span>
                        </div>
                        <p className="text-sm text-slate-600">{log.content}</p>
                      </div>
                    </div>
                  ))}
               </div>
            </div>
          </div>

          {/* Sidebar Actions */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Current Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500">Status</span>
                  <StatusBadge status={grievance.status} />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500">Priority</span>
                  <PriorityBadge priority={grievance.priority} />
                </div>
                
                {isAdmin && (
                  <>
                    <Separator className="my-4" />
                    <UpdateStatusDialog grievance={grievance} />
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function UpdateStatusDialog({ grievance }: { grievance: any }) {
  const updateMutation = useUpdateGrievance();
  const [status, setStatus] = useState(grievance.status);
  const [priority, setPriority] = useState(grievance.priority);
  const [comment, setComment] = useState("");
  const [open, setOpen] = useState(false);

  const handleUpdate = () => {
    updateMutation.mutate({
      id: grievance.id,
      data: { status, priority, comment }
    }, {
      onSuccess: () => setOpen(false)
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full">Update Status</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Grievance</DialogTitle>
          <DialogDescription>
            Change the status or priority and add a note for the student.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="under_review">Under Review</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Priority</label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Resolution Note / Comment</label>
            <Textarea 
              placeholder="Add details about the action taken..." 
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
            {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function LoadingSkeleton() {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-[300px] w-full" />
      </div>
    </Layout>
  );
}
