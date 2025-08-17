import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { Save, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Theatre {
  id: string
  name: string
  location: {
    city: string
    state: string
    country: string
  }
  screens: Screen[]
}

interface Screen {
  id: string
  name: string
  addedOn: string
}

interface TargetGroup {
  id: string
  name: string
  screenCount: number
  theatreCount: number
  createdBy: string
  validFrom: string
  validTill: string
  updatedBy: string
  updatedOn: string
  isSelected?: boolean
}

interface TargetGroupDetailsDialogProps {
  targetGroup: TargetGroup | null
  isOpen: boolean
  onClose: () => void
  onSave: (updatedGroup: TargetGroup) => void
}

// Mock theatre and screen data
const mockTheatreData: Theatre[] = [
  {
    id: "th-001",
    name: "PVR Cinemas Phoenix",
    location: { city: "Mumbai", state: "Maharashtra", country: "India" },
    screens: [
      { id: "scr-001", name: "Screen 1", addedOn: "2024-01-15" },
      { id: "scr-002", name: "Screen 2", addedOn: "2024-01-15" },
      { id: "scr-003", name: "Screen 3", addedOn: "2024-01-20" }
    ]
  },
  {
    id: "th-002", 
    name: "INOX Megaplex",
    location: { city: "Delhi", state: "Delhi", country: "India" },
    screens: [
      { id: "scr-004", name: "Screen A", addedOn: "2024-01-18" },
      { id: "scr-005", name: "Screen B", addedOn: "2024-01-18" }
    ]
  },
  {
    id: "th-003",
    name: "Cinepolis Fun Mall",
    location: { city: "Bangalore", state: "Karnataka", country: "India" },
    screens: [
      { id: "scr-006", name: "Screen 1", addedOn: "2024-01-22" },
      { id: "scr-007", name: "Screen 2", addedOn: "2024-01-22" },
      { id: "scr-008", name: "Screen 3", addedOn: "2024-01-25" },
      { id: "scr-009", name: "Screen 4", addedOn: "2024-01-25" }
    ]
  }
]

const TargetGroupDetailsDialog = ({ 
  targetGroup, 
  isOpen, 
  onClose, 
  onSave 
}: TargetGroupDetailsDialogProps) => {
  const { toast } = useToast()
  const [editedName, setEditedName] = useState(targetGroup?.name || "")

  // Reset name when target group changes
  useEffect(() => {
    if (targetGroup) {
      setEditedName(targetGroup.name)
    }
  }, [targetGroup])

  const handleSave = () => {
    if (targetGroup && editedName.trim()) {
      const updatedGroup = {
        ...targetGroup,
        name: editedName.trim(),
        updatedBy: "Current User",
        updatedOn: new Date().toISOString().split('T')[0]
      }
      
      onSave(updatedGroup)
      toast({
        title: "Target Group Updated",
        description: `${updatedGroup.name} has been updated successfully`,
      })
      onClose()
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatLocation = (location: { city: string; state: string; country: string }) => {
    return `${location.city}, ${location.state}, ${location.country}`
  }

  // Create flattened data for table display
  const tableData = mockTheatreData.flatMap(theatre =>
    theatre.screens.map(screen => ({
      theatreName: theatre.name,
      screenName: screen.name,
      theatreId: theatre.id,
      screenId: screen.id,
      location: formatLocation(theatre.location),
      addedOn: screen.addedOn
    }))
  )

  if (!targetGroup) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-card border border-border">
        <DialogHeader>
          <DialogTitle>Target Group Details</DialogTitle>
          <DialogDescription>
            View and edit target group information and manage associated theatres and screens.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Edit Target Group Name */}
          <div className="space-y-2">
            <Label htmlFor="group-name">Target Group Name</Label>
            <div className="flex gap-2">
              <Input
                id="group-name"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                placeholder="Enter target group name"
              />
              <Button onClick={handleSave} className="gap-2">
                <Save className="h-4 w-4" />
                Save
              </Button>
            </div>
          </div>

          {/* Theatres and Screens Table */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Theatres & Screens</h3>
              <div className="text-sm text-muted-foreground">
                {mockTheatreData.length} theatres • {tableData.length} screens
              </div>
            </div>

            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Theatre Name</TableHead>
                    <TableHead>Screen Name</TableHead>
                    <TableHead>Theatre ID</TableHead>
                    <TableHead>Screen ID</TableHead>
                    <TableHead>Theatre Location</TableHead>
                    <TableHead>Added On</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tableData.map((row, index) => (
                    <TableRow key={`${row.theatreId}-${row.screenId}`}>
                      <TableCell className="font-medium">{row.theatreName}</TableCell>
                      <TableCell>{row.screenName}</TableCell>
                      <TableCell className="font-mono text-sm">{row.theatreId}</TableCell>
                      <TableCell className="font-mono text-sm">{row.screenId}</TableCell>
                      <TableCell>{row.location}</TableCell>
                      <TableCell>{formatDate(row.addedOn)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default TargetGroupDetailsDialog