import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type InsertGrievance, type UpdateGrievanceRequest } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

export function useGrievances(filters?: { status?: string; category?: string }) {
  return useQuery({
    queryKey: [api.grievances.list.path, filters],
    queryFn: async () => {
      const url = filters 
        ? `${api.grievances.list.path}?${new URLSearchParams(filters as Record<string, string>).toString()}`
        : api.grievances.list.path;
      
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch grievances");
      return api.grievances.list.responses[200].parse(await res.json());
    },
  });
}

export function useGrievance(id: number) {
  return useQuery({
    queryKey: [api.grievances.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.grievances.get.path, { id });
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch grievance details");
      return api.grievances.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

export function useCreateGrievance() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertGrievance) => {
      const res = await fetch(api.grievances.create.path, {
        method: api.grievances.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        if (res.status === 400) {
           const error = api.grievances.create.responses[400].parse(await res.json());
           throw new Error(error.message);
        }
        throw new Error("Failed to create grievance");
      }
      return api.grievances.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.grievances.list.path] });
      toast({
        title: "Grievance Submitted",
        description: "Your complaint has been logged successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Submission Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useUpdateGrievance() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: z.infer<typeof api.grievances.update.input> }) => {
      const url = buildUrl(api.grievances.update.path, { id });
      const res = await fetch(url, {
        method: api.grievances.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error("Failed to update grievance");
      return api.grievances.update.responses[200].parse(await res.json());
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [api.grievances.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.grievances.get.path, data.id] });
      toast({
        title: "Grievance Updated",
        description: "The status has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
