import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  BarChart3, 
  Calendar, 
  CheckCircle, 
  Clock, 
  Megaphone, 
  Plus,
  TrendingUp,
  Users,
  AlertCircle
} from "lucide-react"
import { Link } from "react-router-dom"

const Dashboard = () => {
  const stats = [
    {
      title: "Active Campaigns",
      value: "24",
      change: "+12%",
      icon: Megaphone,
      trend: "up"
    },
    {
      title: "Pending Approvals",
      value: "8",
      change: "3 urgent",
      icon: Clock,
      trend: "warning"
    },
    {
      title: "This Month's Revenue",
      value: "$284K",
      change: "+18%",
      icon: TrendingUp,
      trend: "up"
    },
    {
      title: "Active Screens",
      value: "1,247",
      change: "+5%",
      icon: BarChart3,
      trend: "up"
    }
  ]

  const recentCampaigns = [
    {
      id: "CAM-001",
      name: "Summer Movie Festival",
      client: "Cineplex Entertainment",
      status: "Active",
      startDate: "2024-06-15",
      endDate: "2024-08-31",
      screens: 45,
      budget: "$25,000"
    },
    {
      id: "CAM-002", 
      name: "Horror Night Promo",
      client: "AMC Theatres",
      status: "Pending Approval",
      startDate: "2024-10-01",
      endDate: "2024-10-31",
      screens: 32,
      budget: "$18,500"
    },
    {
      id: "CAM-003",
      name: "Holiday Blockbusters",
      client: "Regal Cinemas", 
      status: "In Review",
      startDate: "2024-11-15",
      endDate: "2024-12-31",
      screens: 67,
      budget: "$42,000"
    }
  ]

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Active":
        return <Badge className="bg-success text-success-foreground">Active</Badge>
      case "Pending Approval":
        return <Badge className="bg-warning text-warning-foreground">Pending</Badge>
      case "In Review":
        return <Badge className="bg-accent-brand text-accent-brand-foreground">Review</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back! Here's what's happening with your campaigns.
          </p>
        </div>
        <Button asChild variant="primary" size="lg">
          <Link to="/campaigns/create">
            <Plus className="w-4 h-4 mr-2" />
            Create Campaign
          </Link>
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="p-6 hover:shadow-lg transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{stat.title}</p>
                <p className="text-2xl font-bold text-foreground mt-1">{stat.value}</p>
                <p className={`text-sm mt-1 ${
                  stat.trend === "up" ? "text-success" : 
                  stat.trend === "warning" ? "text-warning" : "text-muted-foreground"
                }`}>
                  {stat.change}
                </p>
              </div>
              <div className={`p-3 rounded-lg ${
                stat.trend === "up" ? "bg-success/10" :
                stat.trend === "warning" ? "bg-warning/10" : "bg-accent/10"
              }`}>
                <stat.icon className={`w-6 h-6 ${
                  stat.trend === "up" ? "text-success" :
                  stat.trend === "warning" ? "text-warning" : "text-accent-brand"
                }`} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Recent Campaigns */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-foreground">Recent Campaigns</h2>
          <Button variant="outline" asChild>
            <Link to="/campaigns">View All</Link>
          </Button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Campaign</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Client</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Duration</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Screens</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Budget</th>
              </tr>
            </thead>
            <tbody>
              {recentCampaigns.map((campaign) => (
                <tr key={campaign.id} className="border-b border-border hover:bg-accent/50 transition-colors">
                  <td className="py-4 px-4">
                    <div>
                      <div className="font-medium text-foreground">{campaign.name}</div>
                      <div className="text-sm text-muted-foreground">{campaign.id}</div>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-foreground">{campaign.client}</td>
                  <td className="py-4 px-4">{getStatusBadge(campaign.status)}</td>
                  <td className="py-4 px-4 text-sm text-muted-foreground">
                    {new Date(campaign.startDate).toLocaleDateString()} - {new Date(campaign.endDate).toLocaleDateString()}
                  </td>
                  <td className="py-4 px-4 text-foreground">{campaign.screens}</td>
                  <td className="py-4 px-4 font-medium text-foreground">{campaign.budget}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 hover:shadow-lg transition-all duration-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-accent-brand/10 rounded-lg">
              <AlertCircle className="w-6 h-6 text-accent-brand" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">Pending Approvals</h3>
              <p className="text-sm text-muted-foreground">8 campaigns need review</p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link to="/approvals/campaigns">Review</Link>
            </Button>
          </div>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-all duration-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-success/10 rounded-lg">
              <Calendar className="w-6 h-6 text-success" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">Upcoming Placements</h3>
              <p className="text-sm text-muted-foreground">12 start this week</p>
            </div>
            <Button variant="outline" size="sm">View Schedule</Button>
          </div>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-all duration-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-warning/10 rounded-lg">
              <Users className="w-6 h-6 text-warning" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">Client Updates</h3>
              <p className="text-sm text-muted-foreground">3 require responses</p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link to="/catalogue/clients">Manage</Link>
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default Dashboard