import {
  LayoutDashboard,
  Users,
  FileText,
  FileSpreadsheet,
  Building2,
  Receipt,
  Shield,
  Settings,
  UserCog,
  GraduationCap,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Link, useLocation } from "wouter";
import { TenantSwitcher } from "./TenantSwitcher";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, User } from "lucide-react";

const menuItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboard,
    testId: "nav-dashboard",
  },
  {
    title: "Students",
    url: "/students",
    icon: Users,
    testId: "nav-students",
  },
  {
    title: "Contracts",
    url: "/contracts",
    icon: FileText,
    testId: "nav-contracts",
  },
  {
    title: "Devis",
    url: "/devis",
    icon: FileSpreadsheet,
    testId: "nav-devis",
  },
  {
    title: "OPCO",
    url: "/opco",
    icon: Building2,
    testId: "nav-opco",
  },
  {
    title: "RAC",
    url: "/rac",
    icon: Receipt,
    testId: "nav-rac",
  },
  {
    title: "Audit Logs",
    url: "/audit",
    icon: Shield,
    testId: "nav-audit",
  },
];

const adminMenuItems = [
  {
    title: "Schools",
    url: "/admin/schools",
    icon: Building2,
    testId: "nav-admin-schools",
  },
  {
    title: "Students",
    url: "/admin/students",
    icon: UserCog,
    testId: "nav-admin-students",
  },
  {
    title: "Programs",
    url: "/admin/programs",
    icon: GraduationCap,
    testId: "nav-admin-programs",
  },
  {
    title: "Users",
    url: "/admin/users",
    icon: Shield,
    testId: "nav-admin-users",
  },
  {
    title: "Activity",
    url: "/admin/activity",
    icon: Settings,
    testId: "nav-admin-activity",
  },
];

export function AppSidebar() {
  const [location] = useLocation();
  const { user } = useAuth();

  const getInitials = (user: any) => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return "U";
  };

  return (
    <Sidebar>
      <SidebarHeader className="border-b p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
            <Building2 className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">Filiz Admin</span>
            <span className="text-xs text-muted-foreground">Multi-School</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Tenant</SidebarGroupLabel>
          <SidebarGroupContent className="px-2">
            <TenantSwitcher />
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const isActive = location === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link href={item.url} data-testid={item.testId}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {user?.role === "OpsAdmin" && (
          <SidebarGroup>
            <SidebarGroupLabel>
              <Settings className="h-4 w-4 mr-1 inline" />
              Administration
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminMenuItems.map((item) => {
                  const isActive = location === item.url;
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild isActive={isActive}>
                        <Link href={item.url} data-testid={item.testId}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarFooter className="border-t p-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 hover-elevate"
              data-testid="button-user-menu"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage
                  src={user?.profileImageUrl || undefined}
                  alt={user?.email || "User"}
                  className="object-cover"
                />
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {getInitials(user)}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-start overflow-hidden">
                <span className="text-sm font-medium truncate max-w-[150px]">
                  {user?.firstName && user?.lastName
                    ? `${user.firstName} ${user.lastName}`
                    : user?.email || "User"}
                </span>
                <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                  {user?.role || "User"}
                </span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <a href="/api/logout" data-testid="button-logout">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </a>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
