import { useState } from "react"
import { 
  LayoutDashboard,
  Megaphone,
  CheckCircle,
  FileText,
  Building2,
  BookOpen,
  BarChart3,
  Users,
  Settings,
  Plus,
  Search,
  ChevronDown,
  ChevronRight
} from "lucide-react"
import { NavLink, useLocation } from "react-router-dom"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

const navigationItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Campaigns",
    icon: Megaphone,
    items: [
      { title: "Create Campaign", url: "/campaigns/create", icon: Plus },
      { title: "Campaign Management", url: "/campaigns", icon: Search },
      { title: "Campaign Rate Bias", url: "/campaigns/rate-bias", icon: BarChart3 },
    ]
  },
  {
    title: "Approvals",
    icon: CheckCircle,
    items: [
      { title: "Campaign Approvals", url: "/approvals/campaigns", icon: CheckCircle },
      { title: "Brand Approvals", url: "/approvals/brands", icon: CheckCircle },
      { title: "Client Approvals", url: "/approvals/clients", icon: CheckCircle },
    ]
  },
  {
    title: "Content",
    icon: FileText,
    items: [
      { title: "Compositions", url: "/content/compositions", icon: FileText },
      { title: "Unmapped Compositions", url: "/content/unmapped", icon: FileText },
      { title: "Archived Content", url: "/content/archived", icon: FileText },
    ]
  },
  {
    title: "Inventory",
    icon: Building2,
    items: [
      { title: "Network Theatres & Screens", url: "/inventory/theatres", icon: Building2 },
      { title: "Playlist Templates", url: "/inventory/templates", icon: FileText },
    ]
  },
  {
    title: "Catalogue",
    icon: BookOpen,
    items: [
      { title: "Brands", url: "/catalogue/brands", icon: BookOpen },
      { title: "Clients", url: "/catalogue/clients", icon: Users },
    ]
  },
  {
    title: "Reports",
    url: "/reports",
    icon: BarChart3,
  },
  {
    title: "User Management",
    url: "/users",
    icon: Users,
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
  },
]

export function AppSidebar() {
  const { state } = useSidebar()
  const isCollapsed = state === "collapsed"
  const location = useLocation()
  const currentPath = location.pathname

  const [openGroups, setOpenGroups] = useState<string[]>([
    "Campaigns" // Keep campaigns open by default
  ])

  const isActive = (path: string) => currentPath === path
  const isGroupActive = (items: any[]) => items?.some(item => isActive(item.url))

  const toggleGroup = (title: string) => {
    setOpenGroups(prev => 
      prev.includes(title) 
        ? prev.filter(group => group !== title)
        : [...prev, title]
    )
  }

  const getNavClassName = (isActive: boolean) =>
    isActive 
      ? "bg-accent-brand text-accent-brand-foreground font-medium" 
      : "hover:bg-accent hover:text-accent-foreground"

  return (
    <Sidebar className={isCollapsed ? "w-16" : "w-64"} collapsible="icon">
      <SidebarContent className="bg-card-elevated border-r border-border">
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">QS</span>
            </div>
            {!isCollapsed && (
              <div>
                <div className="font-semibold text-foreground">Qube Slate</div>
                <div className="text-xs text-muted-foreground">Campaign Manager</div>
              </div>
            )}
          </div>
        </div>

        <SidebarGroup>
          <SidebarMenu>
            {navigationItems.map((item) => (
              <SidebarMenuItem key={item.title}>
                {item.items ? (
                  <Collapsible 
                    open={openGroups.includes(item.title)} 
                    onOpenChange={() => toggleGroup(item.title)}
                  >
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton 
                        className={`w-full ${isGroupActive(item.items) ? getNavClassName(true) : getNavClassName(false)}`}
                      >
                        <item.icon className="w-4 h-4" />
                        {!isCollapsed && (
                          <>
                            <span>{item.title}</span>
                            {openGroups.includes(item.title) ? (
                              <ChevronDown className="w-4 h-4 ml-auto" />
                            ) : (
                              <ChevronRight className="w-4 h-4 ml-auto" />
                            )}
                          </>
                        )}
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    {!isCollapsed && (
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {item.items.map((subItem) => (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton asChild>
                                <NavLink 
                                  to={subItem.url} 
                                  className={({ isActive }) => getNavClassName(isActive)}
                                >
                                  <subItem.icon className="w-4 h-4" />
                                  <span>{subItem.title}</span>
                                </NavLink>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    )}
                  </Collapsible>
                ) : (
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      className={({ isActive }) => getNavClassName(isActive)}
                    >
                      <item.icon className="w-4 h-4" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                )}
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}