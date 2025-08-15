import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { CalendarIcon, Filter, Search, Download, MoreHorizontal, Plus, Eye, Edit, Trash, Split } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { AddTargetGroupDialog } from '@/components/AddTargetGroupDialog';
import { ManageScreensModal } from '@/components/ManageScreensModal';

const CreateCampaign = () => {
  const [currentStep, setCurrentStep] = useState(2); // Start at step 2 for Target Groups
  const [campaignData, setCampaignData] = useState({
    name: '',
    description: '',
    startDate: null as Date | null,
    endDate: null as Date | null,
    client: '',
    agency: '',
    budget: '',
    currency: 'INR'
  });

  // Target Groups state
  const [targetGroups, setTargetGroups] = useState([
    {
      id: 1,
      name: "Mumbai Metro Stations",
      screenCount: 45,
      theatreCount: 12,
      createdOn: "2024-01-15",
      createdBy: "John Doe",
      validFrom: "2024-02-01",
      validTill: "2024-02-29"
    },
    {
      id: 2,
      name: "Delhi Shopping Malls",
      screenCount: 78,
      theatreCount: 25,
      createdOn: "2024-01-18",
      createdBy: "Jane Smith",
      validFrom: "2024-02-01",
      validTill: "2024-02-29"
    }
  ]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showColumnDialog, setShowColumnDialog] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState({
    name: true,
    screenCount: true,
    theatreCount: true,
    createdOn: true,
    createdBy: true,
    validFrom: true,
    validTill: true
  });
  
  // Dialog states
  const [showAddTGDialog, setShowAddTGDialog] = useState(false);
  const [showManageScreensModal, setShowManageScreensModal] = useState(false);
  const [selectedTGForScreens, setSelectedTGForScreens] = useState<string>("");

  const filteredTargetGroups = targetGroups.filter(tg =>
    tg.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddTargetGroup = (data: { name: string; validityStart?: Date; validityEnd?: Date }) => {
    const newTG = {
      id: targetGroups.length + 1,
      name: data.name,
      screenCount: 0,
      theatreCount: 0,
      createdOn: format(new Date(), "yyyy-MM-dd"),
      createdBy: "Current User",
      validFrom: data.validityStart ? format(data.validityStart, "yyyy-MM-dd") : campaignData.startDate ? format(campaignData.startDate, "yyyy-MM-dd") : "",
      validTill: data.validityEnd ? format(data.validityEnd, "yyyy-MM-dd") : campaignData.endDate ? format(campaignData.endDate, "yyyy-MM-dd") : ""
    };
    setTargetGroups(prev => [...prev, newTG]);
  };

  const handleManageScreens = (tgName: string) => {
    setSelectedTGForScreens(tgName);
    setShowManageScreensModal(true);
  };

  const handleSaveScreens = (includedScreens: string[], excludedScreens: string[]) => {
    // Update the target group with new screen count
    setTargetGroups(prev => prev.map(tg => 
      tg.name === selectedTGForScreens 
        ? { ...tg, screenCount: includedScreens.length, theatreCount: Math.ceil(includedScreens.length / 3) }
        : tg
    ));
  };

  const renderStep2 = () => {
    return (
      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-semibold text-foreground mb-2">Target Groups</h2>
          <p className="text-muted-foreground">
            Define and manage Target Groups (TGs) for precise screen selection and campaign targeting.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">{targetGroups.length}</div>
              <div className="text-sm text-muted-foreground">Target Groups</div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">{targetGroups.reduce((acc, tg) => acc + tg.screenCount, 0)}</div>
              <div className="text-sm text-muted-foreground">Total Screens</div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">{targetGroups.reduce((acc, tg) => acc + tg.theatreCount, 0)}</div>
              <div className="text-sm text-muted-foreground">Total Theatres</div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">Ready</div>
              <div className="text-sm text-muted-foreground">TG Status</div>
            </div>
          </Card>
        </div>

        {/* Target Groups Management */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-foreground">Target Groups Management</h3>
            <div className="flex gap-2">
              <Button className="mb-4" onClick={() => setShowAddTGDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Target Group
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <Filter className="w-4 h-4 mr-2" />
                    Columns
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {Object.entries(visibleColumns).map(([key, visible]) => (
                    <DropdownMenuItem key={key} onClick={() => setVisibleColumns(prev => ({ ...prev, [key]: !visible }))}>
                      <Checkbox checked={visible} className="mr-2" />
                      {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search TG Name, Theatre, Screen..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline">
                    <Filter className="w-4 h-4 mr-2" />
                    Filters
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="space-y-4">
                    <div>
                      <Label>Created On</Label>
                      <div className="flex gap-2 mt-1">
                        <Input type="date" placeholder="From" />
                        <Input type="date" placeholder="To" />
                      </div>
                    </div>
                    <div>
                      <Label>Screen Count Range</Label>
                      <div className="flex gap-2 mt-1">
                        <Input type="number" placeholder="Min" />
                        <Input type="number" placeholder="Max" />
                      </div>
                    </div>
                    <div>
                      <Label>Created By</Label>
                      <Select>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select user" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="john">John Doe</SelectItem>
                          <SelectItem value="jane">Jane Smith</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Target Groups Table */}
          {filteredTargetGroups.length > 0 ? (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    {visibleColumns.name && <TableHead>TG Name</TableHead>}
                    {visibleColumns.screenCount && <TableHead>Screen Count</TableHead>}
                    {visibleColumns.theatreCount && <TableHead>Theatre Count</TableHead>}
                    {visibleColumns.createdOn && <TableHead>Created On</TableHead>}
                    {visibleColumns.createdBy && <TableHead>Created By</TableHead>}
                    {visibleColumns.validFrom && <TableHead>Valid From</TableHead>}
                    {visibleColumns.validTill && <TableHead>Valid Till</TableHead>}
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTargetGroups.map((tg) => (
                    <TableRow key={tg.id}>
                      {visibleColumns.name && (
                        <TableCell className="font-medium">
                          <Button variant="link" className="p-0 h-auto font-medium">
                            {tg.name}
                          </Button>
                        </TableCell>
                      )}
                      {visibleColumns.screenCount && (
                        <TableCell>
                          <Badge variant="secondary">{tg.screenCount}</Badge>
                        </TableCell>
                      )}
                      {visibleColumns.theatreCount && (
                        <TableCell>
                          <Badge variant="outline">{tg.theatreCount}</Badge>
                        </TableCell>
                      )}
                      {visibleColumns.createdOn && <TableCell>{tg.createdOn}</TableCell>}
                      {visibleColumns.createdBy && <TableCell>{tg.createdBy}</TableCell>}
                      {visibleColumns.validFrom && <TableCell>{tg.validFrom}</TableCell>}
                      {visibleColumns.validTill && <TableCell>{tg.validTill}</TableCell>}
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit Target Group
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleManageScreens(tg.name)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Manage Screens
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Split className="w-4 h-4 mr-2" />
                              Split Target Group
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
                              <Trash className="w-4 h-4 mr-2" />
                              Delete Group
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="border rounded-lg p-12 text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">No Target Groups Found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm ? "No target groups match your search criteria." : "Create your first Target Group to start defining screen selections."}
              </p>
              <Button onClick={() => setShowAddTGDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Target Group
              </Button>
            </div>
          )}
        </Card>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Create Campaign</h1>
          <p className="text-muted-foreground">
            Step 2: Define Target Groups for your campaign
          </p>
        </div>

        {renderStep2()}
      </div>
      
      {/* Dialogs */}
      <AddTargetGroupDialog
        open={showAddTGDialog}
        onOpenChange={setShowAddTGDialog}
        onSave={handleAddTargetGroup}
      />
      
      <ManageScreensModal
        open={showManageScreensModal}
        onOpenChange={setShowManageScreensModal}
        targetGroupName={selectedTGForScreens}
        onSave={handleSaveScreens}
      />
    </div>
  );
};

export default CreateCampaign;