import { useAuth } from "@/hooks/use-auth";
import { useGrievances } from "@/hooks/use-grievances";
import Layout from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { FilePlus, Search, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { PriorityBadge } from "@/components/priority-badge";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";

export default function StudentDashboard() {
  const { user } = useAuth();
  const { data: grievances, isLoading } = useGrievances();
  const [search, setSearch] = useState("");

  const filteredGrievances = grievances?.filter(g => 
    g.title.toLowerCase().includes(search.toLowerCase()) || 
    g.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-900">My Dashboard</h1>
          <p className="text-slate-500 mt-1">Welcome back, {user?.fullName}</p>
        </div>
        <Link href="/create-grievance">
          <Button className="shadow-lg shadow-primary/20 hover:shadow-primary/30">
            <FilePlus className="mr-2 h-4 w-4" />
            New Grievance
          </Button>
        </Link>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          label="Total Grievances" 
          value={grievances?.length || 0} 
          className="bg-blue-50 border-blue-100 text-blue-900" 
        />
        <StatCard 
          label="Pending Review" 
          value={grievances?.filter(g => g.status === 'pending').length || 0} 
          className="bg-amber-50 border-amber-100 text-amber-900" 
        />
        <StatCard 
          label="Resolved" 
          value={grievances?.filter(g => g.status === 'resolved').length || 0} 
          className="bg-emerald-50 border-emerald-100 text-emerald-900" 
        />
      </div>

      {/* Grievance List */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">Recent Grievances</h2>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Search..." 
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
          </div>
        ) : filteredGrievances?.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-dashed">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 mb-4">
              <FilePlus className="h-6 w-6 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900">No grievances found</h3>
            <p className="text-slate-500 mb-4">You haven't submitted any complaints yet.</p>
            <Link href="/create-grievance">
              <Button variant="outline">Submit your first grievance</Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredGrievances?.map(grievance => (
              <GrievanceCard key={grievance.id} grievance={grievance} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}

function StatCard({ label, value, className }: { label: string, value: number, className?: string }) {
  return (
    <Card className={`border shadow-sm ${className}`}>
      <CardContent className="p-6">
        <p className="text-sm font-medium opacity-80">{label}</p>
        <p className="text-3xl font-bold mt-2">{value}</p>
      </CardContent>
    </Card>
  );
}

function GrievanceCard({ grievance }: { grievance: any }) {
  return (
    <Link href={`/grievances/${grievance.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer group border-l-4 border-l-primary/50">
        <CardContent className="p-6">
          <div className="flex justify-between items-start gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-lg text-slate-900 group-hover:text-primary transition-colors">
                  {grievance.title}
                </h3>
                {grievance.isFlagged && (
                  <div className="text-rose-500" title="Flagged for review">
                    <AlertTriangle className="h-4 w-4" />
                  </div>
                )}
              </div>
              <p className="text-slate-500 line-clamp-2 text-sm">{grievance.description}</p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <StatusBadge status={grievance.status} />
              <span className="text-xs text-slate-400">
                {format(new Date(grievance.createdAt), "MMM d, yyyy")}
              </span>
            </div>
          </div>
          <CardFooter className="p-0 mt-4 flex items-center gap-4 text-xs text-slate-500 border-t pt-4">
            <div className="flex items-center gap-1">
              <span className="font-medium text-slate-700">Category:</span> {grievance.category}
            </div>
            <div className="flex items-center gap-1">
              <span className="font-medium text-slate-700">Priority:</span> <PriorityBadge priority={grievance.priority} />
            </div>
          </CardFooter>
        </CardContent>
      </Card>
    </Link>
  );
}
