import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Users,
  UserPlus,
  CreditCard,
  BarChart3,
  ClipboardList,
  UserCog,
  Settings,
  LogOut,
  Bell,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

const menuItems = [
  { title: "Dashboard", url: "/dashboard/admin", icon: LayoutDashboard },
  { title: "Families", url: "/dashboard/admin/families", icon: Users },
  { title: "Members", url: "/dashboard/admin/members", icon: UserPlus },
  { title: "Payments", url: "/dashboard/admin/payments", icon: CreditCard },
  { title: "Reports", url: "/dashboard/admin/reports", icon: BarChart3 },
  { title: "Pending Requests", url: "/dashboard/admin/requests", icon: ClipboardList },
  { title: "Users", url: "/dashboard/admin/users", icon: UserCog },
  { title: "Settings", url: "/dashboard/admin/settings", icon: Settings },
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const fetchPending = async () => {
      const { count } = await supabase
        .from("pending_requests")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending");
      setPendingCount(count ?? 0);
    };
    fetchPending();
    const interval = setInterval(fetchPending, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarContent className="pt-6">
        {!collapsed && (
          <div className="px-6 mb-8">
            <h1 className="text-lg font-bold tracking-tight text-sidebar-primary-foreground">
              Family Ledger
            </h1>
            <p className="text-xs text-sidebar-foreground mt-0.5">Admin Panel</p>
          </div>
        )}

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const isActive =
                  item.url === "/dashboard/admin"
                    ? location.pathname === "/dashboard/admin"
                    : location.pathname.startsWith(item.url);

                const showBadge = item.title === "Pending Requests" && pendingCount > 0;

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        end={item.url === "/dashboard/admin"}
                        className="hover:bg-sidebar-accent/60"
                        activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                      >
                        <item.icon className="mr-2 h-4 w-4" />
                        {!collapsed && (
                          <span className="flex-1 flex items-center justify-between">
                            {item.title}
                            {showBadge && (
                              <span className="ml-auto flex items-center gap-1 rounded-full bg-destructive px-2 py-0.5 text-[10px] font-bold text-destructive-foreground">
                                <Bell className="h-3 w-3" />
                                {pendingCount}
                              </span>
                            )}
                          </span>
                        )}
                        {collapsed && showBadge && (
                          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-destructive" />
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout} className="hover:bg-sidebar-accent/60">
              <LogOut className="mr-2 h-4 w-4" />
              {!collapsed && <span>Logout</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
