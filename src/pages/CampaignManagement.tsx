import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Search, Plus, Filter, Eye, Edit, Copy } from "lucide-react"
import { Link } from "react-router-dom"

const CampaignManagement = () => {
  const campaigns = [
    {
      id: "CAM-001",
      name: "Summer Movie Festival",
      client: "Cineplex Entertainment",
      status: "Active",
      startDate: "2024-06-15",
      endDate: "2024-08-31",
      screens: 45,
      budget: "$25,000",
      approved: true
    },
    {
      id: "CAM-002", 
      name: "Horror Night Promo",
      client: "AMC Theatres",
      status: "Pending Approval",
      startDate: "2024-10-01",
      endDate: "2024-10-31",
      screens: 32,
      budget: "$18,500",
      approved: false
    },
    {
      id: "CAM-003",
      name: "Holiday Blockbusters",
      client: "Regal Cinemas", 
      status: "In Review",
      startDate: "2024-11-15",
      endDate: "2024-12-31",
      screens: 67,
      budget: "$42,000",
      approved: false
    },
    {
      id: "CAM-004",
      name: "Local Theatre Showcase",
      client: "Independent Theatres",
      status: "Draft",
      startDate: "2024-12-01",
      endDate: "2024-12-15",
      screens: 12,
      budget: "$8,000",
      approved: false
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
      case "Draft":
        return <Badge variant="secondary">Draft</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Campaign Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage all your theatrical advertising campaigns in one place.
          </p>
        </div>
        <Button asChild variant="primary" size="lg">
          <Link to="/campaigns/create">
            <Plus className="w-4 h-4 mr-2" />
            Create Campaign
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search campaigns..."
              className="pl-10"
            />
          </div>
          <Button variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
        </div>
      </Card>

      {/* Campaigns Table */}
      <Card className="p-6">
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
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((campaign) => (
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
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

export default CampaignManagement