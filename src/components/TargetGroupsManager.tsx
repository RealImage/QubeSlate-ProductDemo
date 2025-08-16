import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  Eye,
  Settings,
  Trash2,
  Split,
  ArrowUpDown,
  Building2,
  Monitor,
  Check
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface TargetGroup {
  id: string
  name: string
  screenCount: number
  theatreCount: number
  createdOn: string
  createdBy: string
  validFrom: string
  validTill: string
  status: 'active' | 'expired' | 'upcoming'
  isSelected?: boolean
}

interface TargetGroupsManagerProps {
  selectedGroups?: string[]
  onSelectionChange?: (selectedIds: string[]) => void
}

// Mock data - in real app this would come from API
const mockTargetGroups: TargetGroup[] = [
  {
    id: "tg-001",
    name: "Premium Metro Screens",
    screenCount: 45,
    theatreCount: 12,
    createdOn: "2024-01-15",
    createdBy: "John Smith",
    validFrom: "2024-02-01",
    validTill: "2024-03-31",
    status: 'active'
  },
  {
    id: "tg-002", 
    name: "Tier 2 City Multiplex",
    screenCount: 78,
    theatreCount: 25,
    createdOn: "2024-01-20",
    createdBy: "Sarah Johnson",
    validFrom: "2024-02-15", 
    validTill: "2024-04-15",
    status: 'active'
  },
  {
    id: "tg-003",
    name: "Weekend Prime Time",
    screenCount: 120,
    theatreCount: 40,
    createdOn: "2024-01-10",
    createdBy: "Mike Chen",
    validFrom: "2024-01-25",
    validTill: "2024-01-31",
    status: 'expired'
  },
  {
    id: "tg-004",
    name: "Summer Campaign Screens",
    screenCount: 95,
    theatreCount: 30,
    createdOn: "2024-02-01",
    createdBy: "Lisa Wong",
    validFrom: "2024-05-01",
    validTill: "2024-08-31",
    status: 'upcoming'
  }
]

const TargetGroupsManager = ({ selectedGroups = [], onSelectionChange }: TargetGroupsManagerProps) => {
  const { toast } = useToast()
  const [targetGroups, setTargetGroups] = useState<TargetGroup[]>(
    mockTargetGroups.map(tg => ({
      ...tg,
      isSelected: selectedGroups.includes(tg.id)
    }))
  )
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [sortField, setSortField] = useState<keyof TargetGroup>("createdOn")
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newGroupName, setNewGroupName] = useState("")

  const filteredAndSortedGroups = targetGroups
    .filter(tg => {
      const matchesSearch = searchQuery === "" || 
        tg.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tg.createdBy.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesStatus = statusFilter === "all" || tg.status === statusFilter
      
      return matchesSearch && matchesStatus
    })
    .sort((a, b) => {
      const aValue = a[sortField]
      const bValue = b[sortField]
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue)
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue
      }
      
      return 0
    })

  const handleSort = (field: keyof TargetGroup) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const handleSelectionChange = (groupId: string, isSelected: boolean) => {
    setTargetGroups(prev => 
      prev.map(tg => 
        tg.id === groupId ? { ...tg, isSelected } : tg
      )
    )

    const updatedSelection = isSelected 
      ? [...selectedGroups, groupId]
      : selectedGroups.filter(id => id !== groupId)
    
    onSelectionChange?.(updatedSelection)
  }

  const handleViewDetails = (tg: TargetGroup) => {
    toast({
      title: "View Details",
      description: `Viewing details for ${tg.name}`,
    })
  }

  const handleManageScreens = (tg: TargetGroup) => {
    toast({
      title: "Manage Screens",
      description: `Managing screens for ${tg.name}`,
    })
  }

  const handleDeleteGroup = (tg: TargetGroup) => {
    setTargetGroups(prev => prev.filter(group => group.id !== tg.id))
    toast({
      title: "Target Group Deleted",
      description: `${tg.name} has been deleted successfully`,
      variant: "destructive"
    })
  }

  const handleSplitGroup = (tg: TargetGroup) => {
    toast({
      title: "Split Target Group",
      description: `Splitting ${tg.name} into multiple groups`,
    })
  }

  const handleAddTargetGroup = () => {
    if (newGroupName.trim()) {
      const newGroup: TargetGroup = {
        id: `tg-${Date.now()}`,
        name: newGroupName.trim(),
        screenCount: 0,
        theatreCount: 0,
        createdOn: new Date().toISOString().split('T')[0],
        createdBy: "Current User",
        validFrom: new Date().toISOString().split('T')[0],
        validTill: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'upcoming',
        isSelected: false
      }
      
      setTargetGroups(prev => [newGroup, ...prev])
      setNewGroupName("")
      setIsAddDialogOpen(false)
      
      toast({
        title: "Target Group Created",
        description: `${newGroup.name} has been created successfully`,
      })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-success text-success-foreground">Active</Badge>
      case 'expired':
        return <Badge variant="secondary" className="bg-muted text-muted-foreground">Expired</Badge>
      case 'upcoming':
        return <Badge variant="outline" className="border-warning text-warning">Upcoming</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const selectedCount = targetGroups.filter(tg => tg.isSelected).length

  return (
    <div className="space-y-6">
      {/* Selection Summary */}
      {selectedCount > 0 && (
        <Card className="border-primary bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5 text-primary" />
              <span className="font-medium">
                {selectedCount} Target Group{selectedCount !== 1 ? 's' : ''} selected for this campaign
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Groups</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{targetGroups.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Screens</CardTitle>
            <Monitor className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {targetGroups
                .filter(tg => tg.isSelected)
                .reduce((sum, tg) => sum + tg.screenCount, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {targetGroups.reduce((sum, tg) => sum + tg.screenCount, 0)} total available
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Theatres</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {targetGroups
                .filter(tg => tg.isSelected)
                .reduce((sum, tg) => sum + tg.theatreCount, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {targetGroups.reduce((sum, tg) => sum + tg.theatreCount, 0)} total available
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-1 gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by TG name, theatre name/ID, screen name/ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent className="bg-popover border border-border z-50">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Target Group
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border border-border">
                <DialogHeader>
                  <DialogTitle>Create New Target Group</DialogTitle>
                  <DialogDescription>
                    Enter a name for your new target group. You can add screens and theatres after creation.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    placeholder="Enter target group name"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddTargetGroup()}
                  />
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddTargetGroup} disabled={!newGroupName.trim()}>
                      Create Group
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Target Groups Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">Select</TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 font-semibold"
                    onClick={() => handleSort('name')}
                  >
                    TG Name
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 font-semibold"
                    onClick={() => handleSort('screenCount')}
                  >
                    Screen Count
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 font-semibold"
                    onClick={() => handleSort('theatreCount')}
                  >
                    Theatre Count
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 font-semibold"
                    onClick={() => handleSort('createdOn')}
                  >
                    Created On
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[50px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedGroups.map((tg) => (
                <TableRow key={tg.id} className={tg.isSelected ? "bg-primary/5" : ""}>
                  <TableCell>
                    <Checkbox
                      checked={tg.isSelected}
                      onCheckedChange={(checked) => 
                        handleSelectionChange(tg.id, checked as boolean)
                      }
                    />
                  </TableCell>
                  <TableCell className="font-medium">{tg.name}</TableCell>
                  <TableCell>{tg.screenCount}</TableCell>
                  <TableCell>{tg.theatreCount}</TableCell>
                  <TableCell>{formatDate(tg.createdOn)}</TableCell>
                  <TableCell>{getStatusBadge(tg.status)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-popover border border-border z-50">
                        <DropdownMenuItem onClick={() => handleViewDetails(tg)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleManageScreens(tg)}>
                          <Settings className="mr-2 h-4 w-4" />
                          Manage Screens
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleSplitGroup(tg)}>
                          <Split className="mr-2 h-4 w-4" />
                          Split Target Group
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeleteGroup(tg)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Group
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {filteredAndSortedGroups.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No target groups found</h3>
            <p className="text-muted-foreground text-center mb-4">
              {searchQuery || statusFilter !== "all" 
                ? "Try adjusting your search or filter criteria"
                : "Get started by creating your first target group"
              }
            </p>
            {(!searchQuery && statusFilter === "all") && (
              <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Target Group
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default TargetGroupsManager