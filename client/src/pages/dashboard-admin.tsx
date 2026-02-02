import { useAuth } from "@/hooks/use-auth";
import { useGrievances } from "@/hooks/use-grievances";
import { useAdminStats } from "@/hooks/use-admin";
import Layout from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { PriorityBadge } from "@/components/priority-badge";
import { Link } from "wouter";
import { Search, Filter, BarChart3, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useState } from "react";

export default function AdminDashboard() {
  const { user } = useAuth();
  const { data: stats } = useAdminStats();
  const { data: grievances } = useGrievances();
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [search, setSearch] = useState("");

  const filteredGrievances = grievances?.filter(g => {
    const matchesSearch = g.title.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === "all" || g.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const chartData = stats ? Object.entries(stats.categoryStats).map(([name, value]) => ({ name, value })) : [];
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  return (
    <Layout>
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-900">Admin Dashboard</h1>
          <p className="text-slate-500 mt-1">Overview of grievance redressal metrics.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-slate-900 text-white border-none shadow-lg">
            <CardContent className="p-6">
              <p className="text-sm font-medium opacity-70">Total Grievances</p>
              <p className="text-4xl font-bold mt-2">{stats?.total || 0}</p>
            </CardContent>
          </Card>
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardContent className="p-6">
              <p className="text-sm font-medium text-slate-500">Pending</p>
              <p className="text-4xl font-bold mt-2 text-amber-600">{stats?.pending || 0}</p>
            </CardContent>
          </Card>
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardContent className="p-6">
              <p className="text-sm font-medium text-slate-500">Resolved</p>
              <p className="text-4xl font-bold mt-2 text-emerald-600">{stats?.resolved || 0}</p>
            </CardContent>
          </Card>
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardContent className="p-6">
              <p className="text-sm font-medium text-slate-500">Resolution Rate</p>
              <p className="text-4xl font-bold mt-2 text-blue-600">
                {stats ? Math.round((stats.resolved / stats.total) * 100) : 0}%
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts & List Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Chart */}
          <Card className="lg:col-span-1 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" /> Categories
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip 
                    cursor={{fill: 'transparent'}}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Grievance Table */}
          <Card className="lg:col-span-2 shadow-md flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle>All Grievances</CardTitle>
              <div className="flex gap-2">
                 <div className="relative w-40">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
                    <Input 
                      placeholder="Search..." 
                      className="h-8 pl-7 text-xs" 
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                 </div>
                 <Select value={filterStatus} onValueChange={setFilterStatus}>
                   <SelectTrigger className="h-8 w-32 text-xs">
                     <SelectValue placeholder="Filter" />
                   </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="all">All Status</SelectItem>
                     <SelectItem value="pending">Pending</SelectItem>
                     <SelectItem value="under_review">Reviewing</SelectItem>
                     <SelectItem value="resolved">Resolved</SelectItem>
                     <SelectItem value="rejected">Rejected</SelectItem>
                   </SelectContent>
                 </Select>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredGrievances?.map((g) => (
                    <TableRow key={g.id} className="group cursor-pointer hover:bg-slate-50">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {g.isFlagged && <AlertCircle className="h-4 w-4 text-rose-500" />}
                          <Link href={`/grievances/${g.id}`} className="hover:underline">
                            {g.title}
                          </Link>
                        </div>
                        <div className="text-xs text-slate-500 md:hidden">{format(new Date(g.createdAt), "MMM d")}</div>
                      </TableCell>
                      <TableCell>{g.category}</TableCell>
                      <TableCell><StatusBadge status={g.status} /></TableCell>
                      <TableCell><PriorityBadge priority={g.priority} /></TableCell>
                      <TableCell className="text-right">
                        <Link href={`/grievances/${g.id}`}>
                          <Button variant="ghost" size="sm">View</Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
