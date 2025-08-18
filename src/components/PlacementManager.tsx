import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Dialog, DialogTrigger } from '@/components/ui/dialog'
import AddPlacementDialog from '@/components/AddPlacementDialog'
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Copy, 
  Download, 
  Play, 
  Pause, 
  ChevronDown,
  ChevronRight,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react'

interface Placement {
  id: string
  targetGroup: string
  mediaName: string
  cplUuid: string
  playlistPack: 'Pre Show' | 'Intermission'
  segment: string
  position: string
  positionUnavailability: string
  weeklyPlayCount: number
  billableWeeklyPlayCount: number
  status: 'Active' | 'Pending' | 'Inactive'
  updatedOn: string
  updatedBy: string
  // Additional details for expandable view
  targetGroupSize: {
    theatres: number
    screens: number
  }
  mediaDetails: {
    size: string
    duration: string
    contentStatus: 'Available' | 'Missing'
  }
}

const PlacementManager: React.FC = () => {
  const [placements, setPlacements] = useState<Placement[]>([
    {
      id: '1',
      targetGroup: 'Metro Cities Premium',
      mediaName: 'Summer Campaign Ad',
      cplUuid: '123e4567-e89b-12d3-a456-426614174000',
      playlistPack: 'Pre Show',
      segment: 'Pre Show Slides',
      position: 'A',
      positionUnavailability: 'Play in Normal Position',
      weeklyPlayCount: 42,
      billableWeeklyPlayCount: 40,
      status: 'Active',
      updatedOn: '2024-01-15 14:30',
      updatedBy: 'John Smith',
      targetGroupSize: { theatres: 25, screens: 85 },
      mediaDetails: { size: '2.1 GB', duration: '30s', contentStatus: 'Available' }
    },
    {
      id: '2',
      targetGroup: 'Tier 2 Cities',
      mediaName: 'Product Launch Teaser',
      cplUuid: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
      playlistPack: 'Intermission',
      segment: 'Intermission Premium',
      position: 'B',
      positionUnavailability: 'Skip if Unavailable',
      weeklyPlayCount: 28,
      billableWeeklyPlayCount: 28,
      status: 'Pending',
      updatedOn: '2024-01-14 09:15',
      updatedBy: 'Sarah Connor',
      targetGroupSize: { theatres: 18, screens: 42 },
      mediaDetails: { size: '1.8 GB', duration: '15s', contentStatus: 'Missing' }
    }
  ])

  const [selectedPlacements, setSelectedPlacements] = useState<string[]>([])
  const [expandedRows, setExpandedRows] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [playlistPackFilter, setPlaylistPackFilter] = useState('all')
  const [segmentFilter, setSegmentFilter] = useState('all')
  const [addPlacementOpen, setAddPlacementOpen] = useState(false)

  const filteredPlacements = placements.filter(placement => {
    const matchesSearch = 
      placement.targetGroup.toLowerCase().includes(searchTerm.toLowerCase()) ||
      placement.mediaName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      placement.cplUuid.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || placement.status === statusFilter
    const matchesPlaylistPack = playlistPackFilter === 'all' || placement.playlistPack === playlistPackFilter
    const matchesSegment = segmentFilter === 'all' || placement.segment === segmentFilter

    return matchesSearch && matchesStatus && matchesPlaylistPack && matchesSegment
  })

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedPlacements(filteredPlacements.map(p => p.id))
    } else {
      setSelectedPlacements([])
    }
  }

  const handleSelectPlacement = (placementId: string, checked: boolean) => {
    if (checked) {
      setSelectedPlacements([...selectedPlacements, placementId])
    } else {
      setSelectedPlacements(selectedPlacements.filter(id => id !== placementId))
    }
  }

  const toggleRowExpansion = (placementId: string) => {
    if (expandedRows.includes(placementId)) {
      setExpandedRows(expandedRows.filter(id => id !== placementId))
    } else {
      setExpandedRows([...expandedRows, placementId])
    }
  }

  const getStatusIcon = (status: Placement['status']) => {
    switch (status) {
      case 'Active':
        return <CheckCircle className="h-4 w-4 text-success" />
      case 'Pending':
        return <Clock className="h-4 w-4 text-warning" />
      case 'Inactive':
        return <XCircle className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getStatusBadge = (status: Placement['status']) => {
    const variants = {
      Active: "bg-success/10 text-success border-success/20",
      Pending: "bg-warning/10 text-warning border-warning/20",
      Inactive: "bg-muted text-muted-foreground border-muted"
    }
    
    return (
      <Badge variant="outline" className={variants[status]}>
        {getStatusIcon(status)}
        <span className="ml-1">{status}</span>
      </Badge>
    )
  }

  const handleDelete = (placementId: string) => {
    setPlacements(placements.filter(p => p.id !== placementId))
  }

  const handleBulkDelete = () => {
    setPlacements(placements.filter(p => !selectedPlacements.includes(p.id)))
    setSelectedPlacements([])
  }

  const handleBulkStatusChange = (newStatus: 'Active' | 'Inactive') => {
    setPlacements(placements.map(p => 
      selectedPlacements.includes(p.id) 
        ? { ...p, status: newStatus, updatedOn: new Date().toISOString().slice(0, 16).replace('T', ' '), updatedBy: 'Current User' }
        : p
    ))
    setSelectedPlacements([])
  }

  const handleAddPlacement = (placementData: any) => {
    const newPlacement: Placement = {
      id: Date.now().toString(),
      ...placementData,
      status: placementData.media && getSelectedMedia(placementData.media)?.status === 'Available' ? 'Active' : 'Pending',
      updatedOn: new Date().toISOString().slice(0, 16).replace('T', ' '),
      updatedBy: 'Current User',
      targetGroupSize: { theatres: 25, screens: 85 }, // Mock data
      mediaDetails: { size: '2.1 GB', duration: '30s', contentStatus: 'Available' } // Mock data
    }
    setPlacements([...placements, newPlacement])
  }

  const getSelectedMedia = (mediaId: string) => {
    const mediaList = [
      { id: '1', name: 'Summer Campaign Video', cplUuid: 'CPL-123-ABC-456', status: 'Available', size: '2.4 GB', duration: '45s' },
      { id: '2', name: 'Product Launch Teaser', cplUuid: 'CPL-789-DEF-012', status: 'Missing', size: '', duration: '' },
      { id: '3', name: 'Brand Awareness Static', cplUuid: 'CPL-345-GHI-678', status: 'Available', size: '15 MB', duration: '10s' }
    ]
    return mediaList.find(media => media.id === mediaId)
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Placements</CardTitle>
            <Plus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{placements.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <CheckCircle className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {placements.filter(p => p.status === 'Active').length}
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
              {placements.filter(p => p.status === 'Pending').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">
              {placements.filter(p => p.status === 'Inactive').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter Bar */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by Target Group, Media Name, or CPL UUID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <Select value={playlistPackFilter} onValueChange={setPlaylistPackFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Playlist Pack" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Packs</SelectItem>
                  <SelectItem value="Pre Show">Pre Show</SelectItem>
                  <SelectItem value="Intermission">Intermission</SelectItem>
                </SelectContent>
              </Select>
              <Select value={segmentFilter} onValueChange={setSegmentFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Segment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Segments</SelectItem>
                  <SelectItem value="Pre Show Slides">Pre Show Slides</SelectItem>
                  <SelectItem value="Intermission Premium">Intermission Premium</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions Bar */}
      {selectedPlacements.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {selectedPlacements.length} placement(s) selected
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handleBulkStatusChange('Active')}>
                  <Play className="h-4 w-4 mr-1" />
                  Activate
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleBulkStatusChange('Inactive')}>
                  <Pause className="h-4 w-4 mr-1" />
                  Deactivate
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-1" />
                  Export CSV
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Placements</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete {selectedPlacements.length} placement(s)? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleBulkDelete}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Placement Button */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Placements</h3>
        <Dialog open={addPlacementOpen} onOpenChange={setAddPlacementOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Placement
            </Button>
          </DialogTrigger>
          <AddPlacementDialog
            open={addPlacementOpen}
            onOpenChange={setAddPlacementOpen}
            onSave={handleAddPlacement}
          />
        </Dialog>
      </div>

      {/* Placements Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <Checkbox
                    checked={selectedPlacements.length === filteredPlacements.length && filteredPlacements.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead className="w-[50px]"></TableHead>
                <TableHead>Target Group</TableHead>
                <TableHead>Media</TableHead>
                <TableHead>Playlist Pack</TableHead>
                <TableHead>Segment</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Weekly Play Count</TableHead>
                <TableHead>Billable Count</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Updated On</TableHead>
                <TableHead>Updated By</TableHead>
                <TableHead className="w-[70px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPlacements.map((placement) => (
                <React.Fragment key={placement.id}>
                  <TableRow>
                    <TableCell>
                      <Checkbox
                        checked={selectedPlacements.includes(placement.id)}
                        onCheckedChange={(checked) => handleSelectPlacement(placement.id, checked as boolean)}
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleRowExpansion(placement.id)}
                      >
                        {expandedRows.includes(placement.id) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>
                    <TableCell className="font-medium">{placement.targetGroup}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{placement.mediaName}</div>
                        <div className="text-sm text-muted-foreground">{placement.cplUuid}</div>
                      </div>
                    </TableCell>
                    <TableCell>{placement.playlistPack}</TableCell>
                    <TableCell>{placement.segment}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{placement.position}</div>
                        <div className="text-sm text-muted-foreground">{placement.positionUnavailability}</div>
                      </div>
                    </TableCell>
                    <TableCell>{placement.weeklyPlayCount}</TableCell>
                    <TableCell>{placement.billableWeeklyPlayCount}</TableCell>
                    <TableCell>{getStatusBadge(placement.status)}</TableCell>
                    <TableCell>{placement.updatedOn}</TableCell>
                    <TableCell>{placement.updatedBy}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Copy className="h-4 w-4 mr-2" />
                            Clone
                          </DropdownMenuItem>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Placement</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this placement? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(placement.id)}>
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                  {expandedRows.includes(placement.id) && (
                    <TableRow>
                      <TableCell colSpan={13} className="bg-muted/50">
                        <div className="p-4 space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <h4 className="font-semibold text-sm mb-2">Target Group Details</h4>
                              <div className="text-sm space-y-1">
                                <div>Theatres: {placement.targetGroupSize.theatres}</div>
                                <div>Screens: {placement.targetGroupSize.screens}</div>
                              </div>
                            </div>
                            <div>
                              <h4 className="font-semibold text-sm mb-2">Media Details</h4>
                              <div className="text-sm space-y-1">
                                <div>Size: {placement.mediaDetails.size}</div>
                                <div>Duration: {placement.mediaDetails.duration}</div>
                                <div className="flex items-center gap-1">
                                  Content: 
                                  <Badge variant="outline" className={
                                    placement.mediaDetails.contentStatus === 'Available'
                                      ? "bg-success/10 text-success border-success/20"
                                      : "bg-destructive/10 text-destructive border-destructive/20"
                                  }>
                                    {placement.mediaDetails.contentStatus}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            <div>
                              <h4 className="font-semibold text-sm mb-2">Playback Summary</h4>
                              <div className="text-sm space-y-1">
                                <div>Position: {placement.position}</div>
                                <div>Rule: {placement.positionUnavailability}</div>
                                <div>Pack: {placement.playlistPack}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

export default PlacementManager