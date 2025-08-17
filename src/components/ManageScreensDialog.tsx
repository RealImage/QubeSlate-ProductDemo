import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Search,
  Plus,
  Trash2,
  Upload,
  Building2,
  Monitor,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Screen {
  id: string
  theatreName: string
  screenName: string
  theatreId: string
  screenId: string
  location: string
  previousCampaign?: string
  isSelected?: boolean
  isInTargetGroup?: boolean
}

interface ManageScreensDialogProps {
  isOpen: boolean
  onClose: () => void
  targetGroupName: string
  onSave: (screens: Screen[]) => void
}

// Mock data for available screens
const mockScreens: Screen[] = [
  {
    id: "s-001",
    theatreName: "PVR Cinemas",
    screenName: "Screen 1",
    theatreId: "TH-001",
    screenId: "SC-001",
    location: "Mumbai, Maharashtra, India",
    previousCampaign: "Summer Blockbuster",
    isInTargetGroup: true
  },
  {
    id: "s-002", 
    theatreName: "PVR Cinemas",
    screenName: "Screen 2",
    theatreId: "TH-001",
    screenId: "SC-002",
    location: "Mumbai, Maharashtra, India",
    previousCampaign: "Holiday Special",
    isInTargetGroup: true
  },
  {
    id: "s-003",
    theatreName: "INOX Leisure",
    screenName: "Screen 1",
    theatreId: "TH-002",
    screenId: "SC-003",
    location: "Delhi, Delhi, India",
    previousCampaign: "Festive Campaign",
    isInTargetGroup: false
  },
  {
    id: "s-004",
    theatreName: "INOX Leisure",
    screenName: "Screen 2", 
    theatreId: "TH-002",
    screenId: "SC-004",
    location: "Delhi, Delhi, India",
    previousCampaign: "Spring Promotion",
    isInTargetGroup: false
  },
  {
    id: "s-005",
    theatreName: "Cinepolis",
    screenName: "Screen 1",
    theatreId: "TH-003",
    screenId: "SC-005",
    location: "Bangalore, Karnataka, India",
    isInTargetGroup: false
  }
]

const ManageScreensDialog = ({ isOpen, onClose, targetGroupName, onSave }: ManageScreensDialogProps) => {
  const { toast } = useToast()
  const [screens, setScreens] = useState<Screen[]>(mockScreens)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchFilter, setSearchFilter] = useState("all")

  const filteredScreens = screens.filter(screen => {
    const matchesSearch = searchQuery === "" || 
      screen.theatreName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      screen.screenName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      screen.theatreId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      screen.screenId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      screen.location.toLowerCase().includes(searchQuery.toLowerCase())
    
    if (searchFilter === "in-group") return matchesSearch && screen.isInTargetGroup
    if (searchFilter === "available") return matchesSearch && !screen.isInTargetGroup
    
    return matchesSearch
  })

  const handleToggleScreen = (screenId: string) => {
    setScreens(prev => 
      prev.map(screen => 
        screen.id === screenId 
          ? { ...screen, isInTargetGroup: !screen.isInTargetGroup }
          : screen
      )
    )
  }

  const handleSave = () => {
    onSave(screens)
    toast({
      title: "Screens Updated",
      description: `Screen assignments for ${targetGroupName} have been updated successfully`,
    })
    onClose()
  }

  const handleUploadTheatreList = () => {
    toast({
      title: "Upload Theatre List",
      description: "Theatre list upload functionality would be implemented here",
    })
  }

  const screensInGroup = screens.filter(s => s.isInTargetGroup).length
  const totalScreens = screens.length

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] bg-card border border-border">
        <DialogHeader>
          <DialogTitle>Manage Screens - {targetGroupName}</DialogTitle>
          <DialogDescription>
            Add or remove screens from this target group. Use the search filters to find specific screens.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Stats */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Screens in Group</CardTitle>
                <Monitor className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{screensInGroup}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Available Screens</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalScreens - screensInGroup}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Screens</CardTitle>
                <Monitor className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalScreens}</div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search by Theatre Name, Theatre ID, Screen ID, or Location..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={searchFilter} onValueChange={setSearchFilter}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Screens</SelectItem>
                    <SelectItem value="in-group">In Target Group</SelectItem>
                    <SelectItem value="available">Available Screens</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleUploadTheatreList} variant="outline" className="gap-2">
                  <Upload className="h-4 w-4" />
                  Upload Theatre List
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Screens Table */}
          <Card>
            <CardContent className="p-0">
              <div className="max-h-[400px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">Action</TableHead>
                      <TableHead>Theatre Name</TableHead>
                      <TableHead>Screen Name</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredScreens.map((screen) => (
                      <TableRow key={screen.id} className={screen.isInTargetGroup ? "bg-primary/5" : ""}>
                        <TableCell>
                          {screen.isInTargetGroup ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleToggleScreen(screen.id)}
                              className="gap-1 text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
                            >
                              <Trash2 className="h-3 w-3" />
                              Remove
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleToggleScreen(screen.id)}
                              className="gap-1"
                            >
                              <Plus className="h-3 w-3" />
                              Add
                            </Button>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{screen.theatreName}</div>
                          <div className="text-sm text-muted-foreground">{screen.theatreId}</div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{screen.screenName}</div>
                          <div className="text-sm text-muted-foreground">{screen.screenId}</div>
                        </TableCell>
                        <TableCell>{screen.location}</TableCell>
                        <TableCell>
                          {screen.isInTargetGroup ? (
                            <Badge variant="default">In Group</Badge>
                          ) : (
                            <Badge variant="secondary">Available</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default ManageScreensDialog