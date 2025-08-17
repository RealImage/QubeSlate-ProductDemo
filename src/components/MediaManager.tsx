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
import { Badge } from "@/components/ui/badge"
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  ArrowUpDown,
  Film,
  CheckCircle,
  AlertTriangle,
  Clock
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import AddMediaDialog from "./AddMediaDialog"

interface Media {
  id: string
  mediaName: string
  cplName: string
  cplUuid: string
  contentStatus: 'Available' | 'Missing' | 'Pending'
  contentStatusDate: string
  size?: string
  duration?: string
  updatedOn: string
  updatedBy: string
}

interface MediaManagerProps {
  selectedMedia?: string[]
  onSelectionChange?: (selectedIds: string[]) => void
}

// Mock data - in real app this would come from API
const mockMedia: Media[] = [
  {
    id: "med-001",
    mediaName: "Summer Blockbuster Trailer",
    cplName: "SUMMER_BLOCKBUSTER_MAIN_TRAILER_2024",
    cplUuid: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    contentStatus: "Available",
    contentStatusDate: "2024-01-15",
    size: "3.56 GB",
    duration: "2m 30s",
    updatedOn: "2024-01-15",
    updatedBy: "John Smith"
  },
  {
    id: "med-002", 
    mediaName: "Holiday Campaign Ad",
    cplName: "HOLIDAY_SPECIAL_PROMO_30SEC",
    cplUuid: "550e8400-e29b-41d4-a716-446655440000",
    contentStatus: "Missing",
    contentStatusDate: "2024-01-10",
    updatedOn: "2024-01-12",
    updatedBy: "Sarah Johnson"
  },
  {
    id: "med-003",
    mediaName: "Product Launch Teaser",
    cplName: "PRODUCT_LAUNCH_TEASER_15SEC",
    cplUuid: "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
    contentStatus: "Pending",
    contentStatusDate: "2024-01-20",
    updatedOn: "2024-01-20",
    updatedBy: "Mike Chen"
  }
]

const MediaManager = ({ selectedMedia = [], onSelectionChange }: MediaManagerProps) => {
  const { toast } = useToast()
  const [media, setMedia] = useState<Media[]>(mockMedia)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [dateFilter, setDateFilter] = useState<string>("all")
  const [sortField, setSortField] = useState<keyof Media>("updatedOn")
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)

  const filteredAndSortedMedia = media
    .filter(m => {
      const matchesSearch = searchQuery === "" || 
        m.mediaName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.cplName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.cplUuid.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesStatus = statusFilter === "all" || m.contentStatus === statusFilter
      
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
      
      return 0
    })

  const handleSort = (field: keyof Media) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const handleAddMedia = (newMedia: Omit<Media, 'id' | 'updatedOn' | 'updatedBy'>) => {
    const mediaItem: Media = {
      ...newMedia,
      id: `med-${Date.now()}`,
      updatedOn: new Date().toISOString().split('T')[0],
      updatedBy: "Current User"
    }
    
    setMedia(prev => [mediaItem, ...prev])
    setIsAddDialogOpen(false)
    
    toast({
      title: "Media Added",
      description: `${mediaItem.mediaName} has been added successfully`,
    })
  }

  const handleDeleteMedia = (mediaItem: Media) => {
    setMedia(prev => prev.filter(m => m.id !== mediaItem.id))
    toast({
      title: "Media Deleted",
      description: `${mediaItem.mediaName} has been deleted successfully`,
      variant: "destructive"
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getStatusIcon = (status: Media['contentStatus']) => {
    switch (status) {
      case 'Available':
        return <CheckCircle className="h-4 w-4 text-success" />
      case 'Missing':
        return <AlertTriangle className="h-4 w-4 text-destructive" />
      case 'Pending':
        return <Clock className="h-4 w-4 text-warning" />
    }
  }

  const getStatusBadge = (status: Media['contentStatus']) => {
    const variants = {
      Available: "bg-success/10 text-success border-success/20",
      Missing: "bg-destructive/10 text-destructive border-destructive/20", 
      Pending: "bg-warning/10 text-warning border-warning/20"
    }
    
    return (
      <Badge variant="outline" className={variants[status]}>
        {getStatusIcon(status)}
        <span className="ml-1">{status}</span>
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Media</CardTitle>
            <Film className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{media.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available</CardTitle>
            <CheckCircle className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {media.filter(m => m.contentStatus === 'Available').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Missing</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {media.filter(m => m.contentStatus === 'Missing').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">
              {media.filter(m => m.contentStatus === 'Pending').length}
            </div>
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
                  placeholder="Search by media name, CPL name, or CPL UUID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Available">Available</SelectItem>
                  <SelectItem value="Missing">Missing</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Media
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Media Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 font-semibold"
                    onClick={() => handleSort('mediaName')}
                  >
                    Media Name
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 font-semibold"
                    onClick={() => handleSort('cplName')}
                  >
                    CPL Name with UUID
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>Content Status with Date</TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 font-semibold"
                    onClick={() => handleSort('updatedOn')}
                  >
                    Updated On
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 font-semibold"
                    onClick={() => handleSort('updatedBy')}
                  >
                    Updated By
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead className="w-[50px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedMedia.map((mediaItem) => (
                <TableRow key={mediaItem.id}>
                  <TableCell className="font-medium">
                    <div>
                      <div>{mediaItem.mediaName}</div>
                      {mediaItem.size && mediaItem.duration && (
                        <div className="text-sm text-muted-foreground">
                          {mediaItem.size} • {mediaItem.duration}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{mediaItem.cplName}</div>
                      <div className="text-sm text-muted-foreground font-mono">
                        {mediaItem.cplUuid}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {getStatusBadge(mediaItem.contentStatus)}
                      <div className="text-xs text-muted-foreground">
                        Last validated: {formatDate(mediaItem.contentStatusDate)}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{formatDate(mediaItem.updatedOn)}</TableCell>
                  <TableCell>{mediaItem.updatedBy}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-popover border border-border z-50">
                        <DropdownMenuItem>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Media
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeleteMedia(mediaItem)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Media
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

      {filteredAndSortedMedia.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Film className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No media found</h3>
            <p className="text-muted-foreground text-center mb-4">
              {searchQuery || statusFilter !== "all" 
                ? "Try adjusting your search or filter criteria"
                : "Get started by adding your first media content"
              }
            </p>
            {(!searchQuery && statusFilter === "all") && (
              <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Media
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      <AddMediaDialog 
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onAddMedia={handleAddMedia}
      />
    </div>
  )
}

export default MediaManager