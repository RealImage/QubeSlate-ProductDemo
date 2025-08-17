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
import { Badge } from "@/components/ui/badge"
import { Loader2, CheckCircle, AlertTriangle, Search } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Media {
  id: string
  mediaName: string
  cplName: string
  cplUuid: string
  contentStatus: 'Available' | 'Missing'
  contentStatusDate: string
  size?: string
  duration?: string
  updatedOn: string
  updatedBy: string
}

interface AddMediaDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddMedia: (media: Omit<Media, 'id' | 'updatedOn' | 'updatedBy'>) => void
}

// Mock content library lookup
const mockContentLibraryLookup = async (cplUuid: string): Promise<{
  found: boolean
  size?: string
  duration?: string
}> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1500))
  
  // Mock some known UUIDs as found
  const knownUuids = [
    "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "550e8400-e29b-41d4-a716-446655440000"
  ]
  
  if (knownUuids.includes(cplUuid)) {
    return {
      found: true,
      size: "3.56 GB",
      duration: "2m 30s"
    }
  }
  
  return { found: false }
}

const AddMediaDialog = ({ open, onOpenChange, onAddMedia }: AddMediaDialogProps) => {
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    mediaName: "",
    cplName: "",
    cplUuid: ""
  })
  const [isSearching, setIsSearching] = useState(false)
  const [libraryResult, setLibraryResult] = useState<{
    searched: boolean
    found: boolean
    size?: string
    duration?: string
  }>({ searched: false, found: false })

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setFormData({ mediaName: "", cplName: "", cplUuid: "" })
      setLibraryResult({ searched: false, found: false })
      setIsSearching(false)
    }
  }, [open])

  // Auto-search when CPL UUID is entered
  useEffect(() => {
    const searchLibrary = async () => {
      if (formData.cplUuid && isValidUuid(formData.cplUuid) && !isSearching) {
        setIsSearching(true)
        try {
          const result = await mockContentLibraryLookup(formData.cplUuid)
          setLibraryResult({
            searched: true,
            found: result.found,
            size: result.size,
            duration: result.duration
          })
        } catch (error) {
          toast({
            title: "Search Error",
            description: "Failed to search content library",
            variant: "destructive"
          })
        } finally {
          setIsSearching(false)
        }
      }
    }

    const timeoutId = setTimeout(searchLibrary, 500) // Debounce search
    return () => clearTimeout(timeoutId)
  }, [formData.cplUuid, isSearching, toast])

  const isValidUuid = (uuid: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    return uuidRegex.test(uuid)
  }

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Reset library search when CPL UUID changes
    if (field === 'cplUuid') {
      setLibraryResult({ searched: false, found: false })
    }
  }

  const handleSave = () => {
    if (!formData.mediaName.trim() || !formData.cplName.trim() || !formData.cplUuid.trim()) {
      toast({
        title: "Missing Required Fields",
        description: "Please fill in all required fields",
        variant: "destructive"
      })
      return
    }

    if (!isValidUuid(formData.cplUuid)) {
      toast({
        title: "Invalid CPL UUID",
        description: "Please enter a valid UUID format",
        variant: "destructive"
      })
      return
    }

    const contentStatus: 'Available' | 'Missing' = 
      libraryResult.searched && libraryResult.found ? 'Available' : 'Missing'

    const newMedia = {
      mediaName: formData.mediaName.trim(),
      cplName: formData.cplName.trim(),
      cplUuid: formData.cplUuid.trim(),
      contentStatus,
      contentStatusDate: new Date().toISOString().split('T')[0],
      ...(libraryResult.found && {
        size: libraryResult.size,
        duration: libraryResult.duration
      })
    }

    onAddMedia(newMedia)
    onOpenChange(false)
  }

  const getSearchStatus = () => {
    if (isSearching) {
      return (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Searching Library...</span>
        </div>
      )
    }

    if (libraryResult.searched) {
      if (libraryResult.found) {
        return (
          <div className="flex items-center gap-2 text-success">
            <CheckCircle className="h-4 w-4" />
            <span>Content Found</span>
            <Badge variant="outline" className="bg-success/10 text-success border-success/20">
              Available
            </Badge>
          </div>
        )
      } else {
        return (
          <div className="flex items-center gap-2 text-warning">
            <AlertTriangle className="h-4 w-4" />
            <span>Content Not Found</span>
            <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
              Will activate when available
            </Badge>
          </div>
        )
      }
    }

    return null
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border border-border max-w-md">
        <DialogHeader>
          <DialogTitle>Add Media</DialogTitle>
          <DialogDescription>
            Add new media content to your campaign. The system will automatically check content availability.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Media Name */}
          <div className="space-y-2">
            <Label htmlFor="mediaName">
              Media Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="mediaName"
              placeholder="User-friendly label for the content"
              value={formData.mediaName}
              onChange={(e) => handleInputChange('mediaName', e.target.value)}
            />
          </div>

          {/* CPL Name / UUID */}
          <div className="space-y-2">
            <Label htmlFor="cplName">
              CPL Name / UUID <span className="text-destructive">*</span>
            </Label>
            <Input
              id="cplName"
              placeholder="CPL name or paste UUID"
              value={formData.cplName}
              onChange={(e) => handleInputChange('cplName', e.target.value)}
            />
          </div>

          {/* CPL UUID for library search */}
          <div className="space-y-2">
            <Label htmlFor="cplUuid">
              CPL UUID <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="cplUuid"
                placeholder="Enter CPL UUID for library lookup"
                value={formData.cplUuid}
                onChange={(e) => handleInputChange('cplUuid', e.target.value)}
                className="pl-10"
              />
            </div>
            {formData.cplUuid && !isValidUuid(formData.cplUuid) && (
              <p className="text-sm text-destructive">Invalid UUID format</p>
            )}
          </div>

          {/* Search Status */}
          {(isSearching || libraryResult.searched) && (
            <div className="p-3 rounded-lg border border-border bg-muted/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Library Search</span>
                {getSearchStatus()}
              </div>
              
              {libraryResult.found && libraryResult.size && libraryResult.duration && (
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">
                    <span className="font-medium">Size:</span> {libraryResult.size}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <span className="font-medium">Duration:</span> {libraryResult.duration}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Buttons */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={!formData.mediaName.trim() || !formData.cplName.trim() || !formData.cplUuid.trim() || !isValidUuid(formData.cplUuid) || isSearching}
            >
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default AddMediaDialog