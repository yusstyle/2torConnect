import { useState } from "react";
import { useListUsers, useUpdateUser } from "@workspace/api-client-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { format } from "date-fns";
import { Search, Loader2, CheckCircle, XCircle, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const statusColors: Record<string, string> = {
  active: "bg-green-500/20 text-green-400",
  pending: "bg-yellow-500/20 text-yellow-400",
  suspended: "bg-red-500/20 text-red-400",
  rejected: "bg-gray-500/20 text-gray-400",
};

const roleColors: Record<string, string> = {
  student: "bg-blue-500/20 text-blue-400",
  tutor: "bg-purple-500/20 text-purple-400",
  admin: "bg-accent/20 text-accent",
};

export default function AdminUsersPage() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading, refetch } = useListUsers(
    { search: search || undefined, role: (roleFilter as any) || undefined, page, limit: 20 }
  );

  const updateMutation = useUpdateUser({
    mutation: {
      onSuccess: () => { toast({ title: "User updated" }); refetch(); },
      onError: () => toast({ variant: "destructive", title: "Failed to update user" }),
    },
  });

  const users = data?.users ?? [];
  const total = data?.total ?? 0;

  return (
    <DashboardLayout role="admin" title="User Management">
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-3 w-5 h-5 text-muted-foreground" />
            <input
              type="search"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by name or email..."
              className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-white/30 focus:outline-none focus:border-accent transition-all"
            />
          </div>
          <select value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1); }}
            className="bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-accent">
            <option value="">All Roles</option>
            <option value="student">Students</option>
            <option value="tutor">Tutors</option>
            <option value="admin">Admins</option>
          </select>
        </div>

        <div className="glass-panel rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-white/5 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{total} total users</span>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-accent" /></div>
          ) : users.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">No users found.</p>
          ) : (
            <div className="divide-y divide-white/5">
              {users.map(user => (
                <div key={user.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-3 hover:bg-white/2 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-white font-medium">{user.name}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${roleColors[user.role] ?? ""}`}>{user.role}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusColors[user.status] ?? ""}`}>{user.status}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{user.email} · Joined {format(new Date(user.createdAt), "MMM d, yyyy")}</p>
                  </div>
                  <div className="flex gap-2">
                    {user.status !== "active" && (
                      <button onClick={() => updateMutation.mutate({ id: user.id, data: { status: "active" } })}
                        disabled={updateMutation.isPending}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 text-xs font-medium transition-colors disabled:opacity-50">
                        <CheckCircle className="w-3.5 h-3.5" /> Activate
                      </button>
                    )}
                    {user.status === "active" && (
                      <button onClick={() => updateMutation.mutate({ id: user.id, data: { status: "suspended" } })}
                        disabled={updateMutation.isPending}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs font-medium transition-colors disabled:opacity-50">
                        <XCircle className="w-3.5 h-3.5" /> Suspend
                      </button>
                    )}
                    {user.status === "pending" && (
                      <button onClick={() => updateMutation.mutate({ id: user.id, data: { status: "rejected" } })}
                        disabled={updateMutation.isPending}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 text-xs font-medium transition-colors disabled:opacity-50">
                        <Clock className="w-3.5 h-3.5" /> Reject
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {total > 20 && (
          <div className="flex justify-center gap-2">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
              className="px-4 py-2 rounded-lg bg-black/40 border border-white/10 text-white disabled:opacity-40 hover:bg-white/5 transition-colors">
              Previous
            </button>
            <span className="px-4 py-2 text-muted-foreground text-sm">Page {page} of {Math.ceil(total / 20)}</span>
            <button disabled={page >= Math.ceil(total / 20)} onClick={() => setPage(p => p + 1)}
              className="px-4 py-2 rounded-lg bg-black/40 border border-white/10 text-white disabled:opacity-40 hover:bg-white/5 transition-colors">
              Next
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
