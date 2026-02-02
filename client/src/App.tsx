import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

import NotFound from "@/pages/not-found";
import LandingPage from "@/pages/landing-page";
import AuthPage from "@/pages/auth-page";
import StudentDashboard from "@/pages/dashboard-student";
import AdminDashboard from "@/pages/dashboard-admin";
import CreateGrievance from "@/pages/create-grievance";
import GrievanceDetails from "@/pages/grievance-details";

function ProtectedRoute({ 
  component: Component, 
  requiredRole 
}: { 
  component: React.ComponentType<any>, 
  requiredRole?: "admin" | "student" 
}) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/auth" />;
  }

  if (requiredRole === "admin" && user.role !== "admin" && user.role !== "staff") {
    return <Redirect to="/dashboard" />;
  }

  if (requiredRole === "student" && user.role === "admin") {
    return <Redirect to="/admin" />;
  }

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/auth" component={AuthPage} />
      
      {/* Student Routes */}
      <Route path="/dashboard">
        <ProtectedRoute component={StudentDashboard} requiredRole="student" />
      </Route>
      <Route path="/create-grievance">
        <ProtectedRoute component={CreateGrievance} requiredRole="student" />
      </Route>

      {/* Admin Routes */}
      <Route path="/admin">
        <ProtectedRoute component={AdminDashboard} requiredRole="admin" />
      </Route>
      <Route path="/admin/grievances">
        <ProtectedRoute component={AdminDashboard} requiredRole="admin" />
      </Route>

      {/* Shared Route */}
      <Route path="/grievances/:id">
        <ProtectedRoute component={GrievanceDetails} />
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
