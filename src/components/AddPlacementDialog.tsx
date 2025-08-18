import React, { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Plus, AlertTriangle, CheckCircle, CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

interface AddPlacementDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (placementData: any) => void
}

const AddPlacementDialog = ({ open, onOpenChange, onSave }: AddPlacementDialogProps) => {
  const [formData, setFormData] = useState({
    targetGroup: '',
    media: '',
    placementStartDate: undefined as Date | undefined,
    placementStartTime: '',
    placementEndDate: undefined as Date | undefined,
    placementEndTime: '',
    playlistPack: '',
    segment: '',
    position: '',
    positionUnavailability: '',
    playbackMode: 'Weekly',
    weeklyPlayCount: '',
    billableWeeklyPlayCount: '',
    playBackToBack: false,
    advancedGrid: {
      'Morning': { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 },
      'Afternoon': { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 },
      'Evening': { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 },
      'Night': { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 },
      'Others': { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 }
    }
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Mock data - replace with actual data from your state management
  const targetGroups = [
    { id: '1', name: 'Premium Multiplexes - Mumbai', status: 'Active', theatres: 45, screens: 180 },
    { id: '2', name: 'Single Screens - Delhi NCR', status: 'Active', theatres: 120, screens: 120 },
    { id: '3', name: 'Mall Cinemas - Bangalore', status: 'Active', theatres: 32, screens: 156 }
  ]

  const mediaList = [
    { id: '1', name: 'Summer Campaign Video', cplUuid: 'CPL-123-ABC-456', status: 'Available', size: '2.4 GB', duration: '45s' },
    { id: '2', name: 'Product Launch Teaser', cplUuid: 'CPL-789-DEF-012', status: 'Missing', size: '', duration: '' },
    { id: '3', name: 'Brand Awareness Static', cplUuid: 'CPL-345-GHI-678', status: 'Available', size: '15 MB', duration: '10s' }
  ]

  const preShowSegments = [
    'Pre Show Slides', 'Pre Show Private', 'Pre Show Government', 
    'Pre Show Contact', 'Pre Show Countdown'
  ]

  const intermissionSegments = [
    'Intermission Start', 'Intermission Slides', 'Intermission Private',
    'Intermission Premium', 'Intermission Government', 'Intermission Contact', 'Intermission Countdown'
  ]

  const positions = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'Normal']
  
  const positionUnavailabilityOptions = [
    'Play in next available position followed by Normal position',
    'Play in Normal Position',
    'Do Not Play'
  ]

  const shows = ['Morning', 'Afternoon', 'Evening', 'Night', 'Others']
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }))
    }
  }

  const handleGridChange = (show: string, day: string, value: string) => {
    const numValue = parseInt(value) || 0
    setFormData(prev => ({
      ...prev,
      advancedGrid: {
        ...prev.advancedGrid,
        [show]: {
          ...prev.advancedGrid[show],
          [day]: numValue
        }
      }
    }))
  }

  const calculateWeeklyPlayCount = () => {
    let total = 0
    Object.values(formData.advancedGrid).forEach(showData => {
      Object.values(showData).forEach(dayValue => {
        total += dayValue
      })
    })
    return total
  }

  const getSelectedTargetGroup = () => {
    return targetGroups.find(tg => tg.id === formData.targetGroup)
  }

  const getSelectedMedia = () => {
    return mediaList.find(media => media.id === formData.media)
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.targetGroup) {
      newErrors.targetGroup = 'Target Group is required'
    }

    if (!formData.media) {
      newErrors.media = 'Media is required'
    }

    if (!formData.playlistPack) {
      newErrors.playlistPack = 'Playlist Pack is required'
    }

    if (!formData.segment) {
      newErrors.segment = 'Segment is required'
    }

    if (!formData.position) {
      newErrors.position = 'Position is required'
    }

    if (!formData.positionUnavailability) {
      newErrors.positionUnavailability = 'Position Unavailability is required'
    }

    if (!formData.placementStartDate) {
      newErrors.placementStartDate = 'Placement Start Date is required'
    }

    if (!formData.placementStartTime) {
      newErrors.placementStartTime = 'Placement Start Time is required'
    }

    if (!formData.placementEndDate) {
      newErrors.placementEndDate = 'Placement End Date is required'
    }

    if (!formData.placementEndTime) {
      newErrors.placementEndTime = 'Placement End Time is required'
    }

    // Validate that end date/time is after start date/time
    if (formData.placementStartDate && formData.placementEndDate && formData.placementStartTime && formData.placementEndTime) {
      const startDateTime = new Date(formData.placementStartDate)
      const endDateTime = new Date(formData.placementEndDate)
      
      const [startHour, startMinute] = formData.placementStartTime.split(':').map(Number)
      const [endHour, endMinute] = formData.placementEndTime.split(':').map(Number)
      
      startDateTime.setHours(startHour, startMinute)
      endDateTime.setHours(endHour, endMinute)
      
      if (endDateTime <= startDateTime) {
        newErrors.placementEndDate = 'End date and time must be after start date and time'
      }
    }

    if (formData.playbackMode === 'Weekly') {
      const weeklyCount = parseInt(formData.weeklyPlayCount)
      if (!formData.weeklyPlayCount || weeklyCount <= 0) {
        newErrors.weeklyPlayCount = 'Weekly Play Count must be greater than 0'
      }
    }

    if (formData.billableWeeklyPlayCount) {
      const billableCount = parseInt(formData.billableWeeklyPlayCount)
      const totalWeeklyCount = formData.playbackMode === 'Weekly' 
        ? parseInt(formData.weeklyPlayCount) 
        : calculateWeeklyPlayCount()
      
      if (billableCount > totalWeeklyCount) {
        newErrors.billableWeeklyPlayCount = 'Billable Weekly Play Count cannot be greater than Weekly Play Count'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = () => {
    if (!validateForm()) return

    const placementData = {
      ...formData,
      weeklyPlayCount: formData.playbackMode === 'Weekly' 
        ? parseInt(formData.weeklyPlayCount) 
        : calculateWeeklyPlayCount()
    }

    onSave(placementData)
    onOpenChange(false)
    
    // Reset form
    setFormData({
      targetGroup: '',
      media: '',
      placementStartDate: undefined,
      placementStartTime: '',
      placementEndDate: undefined,
      placementEndTime: '',
      playlistPack: '',
      segment: '',
      position: '',
      positionUnavailability: '',
      playbackMode: 'Weekly',
      weeklyPlayCount: '',
      billableWeeklyPlayCount: '',
      playBackToBack: false,
      advancedGrid: {
        'Morning': { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 },
        'Afternoon': { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 },
        'Evening': { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 },
        'Night': { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 },
        'Others': { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 }
      }
    })
    setErrors({})
  }

  const selectedTargetGroup = getSelectedTargetGroup()
  const selectedMedia = getSelectedMedia()
  const availableSegments = formData.playlistPack === 'Pre Show' ? preShowSegments : intermissionSegments

  return (
    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Add New Placement</DialogTitle>
        <DialogDescription>
          Create a new placement by selecting target group, media, and configuring playback parameters.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-6">
        {/* Placement Parameters Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Placement Parameters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Target Group Selection */}
              <div>
                <Label htmlFor="targetGroup">Target Group *</Label>
                <Select value={formData.targetGroup} onValueChange={(value) => handleInputChange('targetGroup', value)}>
                  <SelectTrigger className={`mt-1 ${errors.targetGroup ? 'border-destructive' : ''}`}>
                    <SelectValue placeholder="Select target group" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border border-border shadow-lg z-50">
                    {targetGroups.map((tg) => (
                      <SelectItem key={tg.id} value={tg.id}>
                        <div className="flex items-center justify-between w-full">
                          <span>{tg.name}</span>
                          <Badge variant="secondary" className="ml-2">{tg.status}</Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.targetGroup && <p className="text-sm text-destructive mt-1">{errors.targetGroup}</p>}
                {selectedTargetGroup && (
                  <div className="mt-2 p-2 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      {selectedTargetGroup.theatres} theatres • {selectedTargetGroup.screens} screens
                    </p>
                  </div>
                )}
              </div>

              {/* Media Selection */}
              <div>
                <Label htmlFor="media">Media *</Label>
                <Select value={formData.media} onValueChange={(value) => handleInputChange('media', value)}>
                  <SelectTrigger className={`mt-1 ${errors.media ? 'border-destructive' : ''}`}>
                    <SelectValue placeholder="Select media" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border border-border shadow-lg z-50">
                    {mediaList.map((media) => (
                      <SelectItem key={media.id} value={media.id}>
                        <div className="flex items-center justify-between w-full">
                          <div>
                            <span>{media.name}</span>
                            <p className="text-xs text-muted-foreground">{media.cplUuid}</p>
                          </div>
                          <div className="flex items-center ml-2">
                            {media.status === 'Available' ? (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            ) : (
                              <AlertTriangle className="w-4 h-4 text-orange-500" />
                            )}
                            <Badge variant={media.status === 'Available' ? 'default' : 'secondary'} className="ml-1">
                              {media.status}
                            </Badge>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.media && <p className="text-sm text-destructive mt-1">{errors.media}</p>}
                {selectedMedia && (
                  <div className="mt-2">
                    {selectedMedia.status === 'Missing' && (
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          This media is not yet available. Placement will be inactive until content becomes available.
                        </AlertDescription>
                      </Alert>
                    )}
                    {selectedMedia.status === 'Available' && (
                      <div className="p-2 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">
                          {selectedMedia.size} • {selectedMedia.duration}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Placement Date & Time Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Placement Start Date */}
              <div>
                <Label htmlFor="placementStartDate">Placement Start Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal mt-1",
                        !formData.placementStartDate && "text-muted-foreground",
                        errors.placementStartDate ? 'border-destructive' : ''
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.placementStartDate ? format(formData.placementStartDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.placementStartDate}
                      onSelect={(date) => handleInputChange('placementStartDate', date)}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
                {errors.placementStartDate && <p className="text-sm text-destructive mt-1">{errors.placementStartDate}</p>}
              </div>

              {/* Placement Start Time */}
              <div>
                <Label htmlFor="placementStartTime">Placement Start Time *</Label>
                <Input
                  id="placementStartTime"
                  type="time"
                  value={formData.placementStartTime}
                  onChange={(e) => handleInputChange('placementStartTime', e.target.value)}
                  className={`mt-1 ${errors.placementStartTime ? 'border-destructive' : ''}`}
                />
                {errors.placementStartTime && <p className="text-sm text-destructive mt-1">{errors.placementStartTime}</p>}
              </div>

              {/* Placement End Date */}
              <div>
                <Label htmlFor="placementEndDate">Placement End Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal mt-1",
                        !formData.placementEndDate && "text-muted-foreground",
                        errors.placementEndDate ? 'border-destructive' : ''
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.placementEndDate ? format(formData.placementEndDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.placementEndDate}
                      onSelect={(date) => handleInputChange('placementEndDate', date)}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
                {errors.placementEndDate && <p className="text-sm text-destructive mt-1">{errors.placementEndDate}</p>}
              </div>

              {/* Placement End Time */}
              <div>
                <Label htmlFor="placementEndTime">Placement End Time *</Label>
                <Input
                  id="placementEndTime"
                  type="time"
                  value={formData.placementEndTime}
                  onChange={(e) => handleInputChange('placementEndTime', e.target.value)}
                  className={`mt-1 ${errors.placementEndTime ? 'border-destructive' : ''}`}
                />
                {errors.placementEndTime && <p className="text-sm text-destructive mt-1">{errors.placementEndTime}</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Position Details Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Position Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="playlistPack">Playlist Pack *</Label>
                <Select value={formData.playlistPack} onValueChange={(value) => {
                  handleInputChange('playlistPack', value)
                  handleInputChange('segment', '') // Reset segment when playlist pack changes
                }}>
                  <SelectTrigger className={`mt-1 ${errors.playlistPack ? 'border-destructive' : ''}`}>
                    <SelectValue placeholder="Select playlist pack" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border border-border shadow-lg z-50">
                    <SelectItem value="Pre Show">Pre Show</SelectItem>
                    <SelectItem value="Intermission">Intermission</SelectItem>
                  </SelectContent>
                </Select>
                {errors.playlistPack && <p className="text-sm text-destructive mt-1">{errors.playlistPack}</p>}
              </div>

              <div>
                <Label htmlFor="segment">Segment *</Label>
                <Select 
                  value={formData.segment} 
                  onValueChange={(value) => handleInputChange('segment', value)}
                  disabled={!formData.playlistPack}
                >
                  <SelectTrigger className={`mt-1 ${errors.segment ? 'border-destructive' : ''}`}>
                    <SelectValue placeholder="Select segment" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border border-border shadow-lg z-50">
                    {availableSegments.map((segment) => (
                      <SelectItem key={segment} value={segment}>{segment}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.segment && <p className="text-sm text-destructive mt-1">{errors.segment}</p>}
              </div>

              <div>
                <Label htmlFor="position">Position *</Label>
                <Select value={formData.position} onValueChange={(value) => handleInputChange('position', value)}>
                  <SelectTrigger className={`mt-1 ${errors.position ? 'border-destructive' : ''}`}>
                    <SelectValue placeholder="Select position" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border border-border shadow-lg z-50">
                    {positions.map((position) => (
                      <SelectItem key={position} value={position}>{position}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.position && <p className="text-sm text-destructive mt-1">{errors.position}</p>}
              </div>

              <div>
                <Label htmlFor="positionUnavailability">Position Unavailability *</Label>
                <Select value={formData.positionUnavailability} onValueChange={(value) => handleInputChange('positionUnavailability', value)}>
                  <SelectTrigger className={`mt-1 ${errors.positionUnavailability ? 'border-destructive' : ''}`}>
                    <SelectValue placeholder="Select unavailability rule" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border border-border shadow-lg z-50">
                    {positionUnavailabilityOptions.map((option) => (
                      <SelectItem key={option} value={option}>{option}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.positionUnavailability && <p className="text-sm text-destructive mt-1">{errors.positionUnavailability}</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Playback Details Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Playback Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="playbackMode">Playback Mode</Label>
              <Select value={formData.playbackMode} onValueChange={(value) => handleInputChange('playbackMode', value)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background border border-border shadow-lg z-50">
                  <SelectItem value="Weekly">Weekly</SelectItem>
                  <SelectItem value="Advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.playbackMode === 'Weekly' ? (
              <div>
                <Label htmlFor="weeklyPlayCount">Weekly Play Count *</Label>
                <Input
                  id="weeklyPlayCount"
                  type="number"
                  min="1"
                  placeholder="Enter weekly play count"
                  value={formData.weeklyPlayCount}
                  onChange={(e) => handleInputChange('weeklyPlayCount', e.target.value)}
                  className={`mt-1 ${errors.weeklyPlayCount ? 'border-destructive' : ''}`}
                />
                {errors.weeklyPlayCount && <p className="text-sm text-destructive mt-1">{errors.weeklyPlayCount}</p>}
              </div>
            ) : (
              <div>
                <Label>Advanced Playback Grid</Label>
                <div className="mt-2 overflow-x-auto">
                  <table className="w-full border border-border rounded-lg">
                    <thead>
                      <tr className="bg-muted">
                        <th className="p-2 text-left border-r border-border">Show Time</th>
                        {days.map(day => (
                          <th key={day} className="p-2 text-center border-r border-border last:border-r-0">{day}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {shows.map((show, showIndex) => (
                        <tr key={show} className={showIndex % 2 === 0 ? 'bg-background' : 'bg-muted/50'}>
                          <td className="p-2 font-medium border-r border-border">
                            {show}
                            {show === 'Morning' && <span className="text-xs text-muted-foreground block">6 AM - 12 PM</span>}
                            {show === 'Afternoon' && <span className="text-xs text-muted-foreground block">12 PM - 6 PM</span>}
                            {show === 'Evening' && <span className="text-xs text-muted-foreground block">6 PM - 9 PM</span>}
                            {show === 'Night' && <span className="text-xs text-muted-foreground block">9 PM - 12 AM</span>}
                          </td>
                          {days.map(day => (
                            <td key={`${show}-${day}`} className="p-1 border-r border-border last:border-r-0">
                              <Input
                                type="number"
                                min="0"
                                value={formData.advancedGrid[show][day]}
                                onChange={(e) => handleGridChange(show, day, e.target.value)}
                                className="w-16 h-8 text-center text-sm"
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-2 p-2 bg-muted rounded-lg">
                  <p className="text-sm font-medium">
                    Weekly Play Count (Calculated): {calculateWeeklyPlayCount()}
                  </p>
                </div>
              </div>
            )}

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="playBackToBack"
                  checked={formData.playBackToBack}
                  onCheckedChange={(checked) => handleInputChange('playBackToBack', checked)}
                />
                <Label htmlFor="playBackToBack">Play back-to-back when applicable</Label>
              </div>

              <div>
                <Label htmlFor="billableWeeklyPlayCount">Billable Weekly Play Count</Label>
                <Input
                  id="billableWeeklyPlayCount"
                  type="number"
                  min="0"
                  placeholder="Enter billable play count (optional)"
                  value={formData.billableWeeklyPlayCount}
                  onChange={(e) => handleInputChange('billableWeeklyPlayCount', e.target.value)}
                  className={`mt-1 ${errors.billableWeeklyPlayCount ? 'border-destructive' : ''}`}
                />
                {errors.billableWeeklyPlayCount && <p className="text-sm text-destructive mt-1">{errors.billableWeeklyPlayCount}</p>}
                <p className="text-xs text-muted-foreground mt-1">
                  Must be ≤ Weekly Play Count ({formData.playbackMode === 'Weekly' ? formData.weeklyPlayCount || '0' : calculateWeeklyPlayCount()})
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <DialogFooter className="pt-6">
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button onClick={handleSave}>
          Save Placement
        </Button>
      </DialogFooter>
    </DialogContent>
  )
}

export default AddPlacementDialog