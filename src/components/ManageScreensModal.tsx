import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Upload, Search, MoveRight, MoveLeft, Download } from "lucide-react";

interface ManageScreensModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetGroupName: string;
  onSave: (includedScreens: string[], excludedScreens: string[]) => void;
}

interface Screen {
  id: string;
  name: string;
  theatreName: string;
  location: string;
}

export function ManageScreensModal({ open, onOpenChange, targetGroupName, onSave }: ManageScreensModalProps) {
  const [activeTab, setActiveTab] = useState("screen-id");
  const [screenIds, setScreenIds] = useState("");
  const [theatreIds, setTheatreIds] = useState("");
  const [selectedCampaign, setSelectedCampaign] = useState("");
  const [selectedTG, setSelectedTG] = useState("");
  const [locationType, setLocationType] = useState("");
  const [locationValues, setLocationValues] = useState<string[]>([]);
  const [invalidIds, setInvalidIds] = useState<string[]>([]);
  
  // Mock data for screens
  const [includedScreens, setIncludedScreens] = useState<Screen[]>([]);
  const [excludedScreens, setExcludedScreens] = useState<Screen[]>([]);
  const [searchIncluded, setSearchIncluded] = useState("");
  const [searchExcluded, setSearchExcluded] = useState("");

  const mockCampaigns = ["Campaign A", "Campaign B", "Campaign C"];
  const mockTargetGroups = ["TG 1", "TG 2", "TG 3"];
  const mockLocations = {
    city: ["Mumbai", "Delhi", "Bangalore", "Chennai"],
    state: ["Maharashtra", "Delhi", "Karnataka", "Tamil Nadu"],
    country: ["India", "UAE", "Singapore"]
  };

  const filteredIncluded = includedScreens.filter(screen =>
    screen.id.toLowerCase().includes(searchIncluded.toLowerCase()) ||
    screen.name.toLowerCase().includes(searchIncluded.toLowerCase()) ||
    screen.theatreName.toLowerCase().includes(searchIncluded.toLowerCase())
  );

  const filteredExcluded = excludedScreens.filter(screen =>
    screen.id.toLowerCase().includes(searchExcluded.toLowerCase()) ||
    screen.name.toLowerCase().includes(searchExcluded.toLowerCase()) ||
    screen.theatreName.toLowerCase().includes(searchExcluded.toLowerCase())
  );

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, type: 'screen' | 'theatre') => {
    const file = event.target.files?.[0];
    if (file) {
      // Mock file processing logic
      console.log(`Processing ${type} file:`, file.name);
    }
  };

  const handleAddScreenIds = () => {
    const ids = screenIds.split(/[,\n]/).map(id => id.trim()).filter(Boolean);
    // Mock validation - some IDs are invalid
    const valid = ids.filter(id => !id.includes('X'));
    const invalid = ids.filter(id => id.includes('X'));
    
    setInvalidIds(invalid);
    
    // Convert valid IDs to screen objects (mock)
    const newScreens: Screen[] = valid.map(id => ({
      id,
      name: `Screen ${id}`,
      theatreName: `Theatre ${id.slice(0, 3)}`,
      location: "Mumbai"
    }));
    
    setIncludedScreens(prev => [...prev, ...newScreens]);
    setScreenIds("");
  };

  const handleAddTheatreIds = () => {
    const ids = theatreIds.split(/[,\n]/).map(id => id.trim()).filter(Boolean);
    // Mock: each theatre has 3 screens
    const newScreens: Screen[] = ids.flatMap(theatreId =>
      Array.from({ length: 3 }, (_, i) => ({
        id: `${theatreId}-${i + 1}`,
        name: `Screen ${i + 1}`,
        theatreName: `Theatre ${theatreId}`,
        location: "Mumbai"
      }))
    );
    
    setIncludedScreens(prev => [...prev, ...newScreens]);
    setTheatreIds("");
  };

  const handleImportFromPreviousCampaign = () => {
    if (selectedCampaign && selectedTG) {
      // Mock import logic
      const importedScreens: Screen[] = [
        { id: "IMP001", name: "Imported Screen 1", theatreName: "Imported Theatre 1", location: "Delhi" },
        { id: "IMP002", name: "Imported Screen 2", theatreName: "Imported Theatre 2", location: "Delhi" }
      ];
      setIncludedScreens(prev => [...prev, ...importedScreens]);
    }
  };

  const handleAddLocation = () => {
    if (locationType && locationValues.length > 0) {
      // Mock: each location has 5 screens
      const newScreens: Screen[] = locationValues.flatMap(location =>
        Array.from({ length: 5 }, (_, i) => ({
          id: `${location.slice(0, 3).toUpperCase()}${i + 1}`,
          name: `Screen ${i + 1}`,
          theatreName: `Theatre ${location} ${i + 1}`,
          location
        }))
      );
      
      setIncludedScreens(prev => [...prev, ...newScreens]);
      setLocationValues([]);
    }
  };

  const moveToExcluded = (screens: Screen[]) => {
    setIncludedScreens(prev => prev.filter(s => !screens.includes(s)));
    setExcludedScreens(prev => [...prev, ...screens]);
  };

  const moveToIncluded = (screens: Screen[]) => {
    setExcludedScreens(prev => prev.filter(s => !screens.includes(s)));
    setIncludedScreens(prev => [...prev, ...screens]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Manage Screens – {targetGroupName}</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 flex flex-col space-y-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="screen-id">Screen ID</TabsTrigger>
              <TabsTrigger value="theatre-id">Theatre ID</TabsTrigger>
              <TabsTrigger value="previous-campaign">Previous Campaign</TabsTrigger>
              <TabsTrigger value="location">Location</TabsTrigger>
            </TabsList>
            
            <div className="flex-1 flex space-x-4">
              <div className="w-1/3 space-y-4">
                <TabsContent value="screen-id" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Add Screen IDs</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Paste Screen IDs (comma or line separated)</Label>
                        <Textarea
                          value={screenIds}
                          onChange={(e) => setScreenIds(e.target.value)}
                          placeholder="SCR001, SCR002, SCR003..."
                          rows={4}
                        />
                      </div>
                      <div>
                        <Label>Or Upload File (CSV/XLSX)</Label>
                        <div className="flex items-center space-x-2">
                          <Input
                            type="file"
                            accept=".csv,.xlsx"
                            onChange={(e) => handleFileUpload(e, 'screen')}
                            className="hidden"
                            id="screen-file"
                          />
                          <Button
                            variant="outline"
                            onClick={() => document.getElementById('screen-file')?.click()}
                            className="w-full"
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            Upload File
                          </Button>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={handleAddScreenIds} className="flex-1">
                          Add to Excluded Screens
                        </Button>
                        <Button onClick={handleAddScreenIds} className="flex-1">
                          Add to Included Screens
                        </Button>
                      </div>
                      {invalidIds.length > 0 && (
                        <div className="p-3 bg-destructive/10 rounded-md">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-destructive">
                              {invalidIds.length} Invalid IDs found
                            </span>
                            <Button variant="outline" size="sm">
                              <Download className="w-4 h-4 mr-2" />
                              Download
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="theatre-id" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Add Theatre IDs</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Paste Theatre IDs</Label>
                        <Textarea
                          value={theatreIds}
                          onChange={(e) => setTheatreIds(e.target.value)}
                          placeholder="THR001, THR002, THR003..."
                          rows={4}
                        />
                      </div>
                      <div>
                        <Label>Or Upload File</Label>
                        <Button
                          variant="outline"
                          onClick={() => document.getElementById('theatre-file')?.click()}
                          className="w-full"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Upload File
                        </Button>
                        <Input
                          type="file"
                          accept=".csv,.xlsx"
                          onChange={(e) => handleFileUpload(e, 'theatre')}
                          className="hidden"
                          id="theatre-file"
                        />
                      </div>
                      <Button onClick={handleAddTheatreIds} className="w-full">
                        Add All Screens from Theatres
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="previous-campaign" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Import from Previous Campaign</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Select Campaign</Label>
                        <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose campaign" />
                          </SelectTrigger>
                          <SelectContent>
                            {mockCampaigns.map(campaign => (
                              <SelectItem key={campaign} value={campaign}>
                                {campaign}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Select Target Group</Label>
                        <Select value={selectedTG} onValueChange={setSelectedTG}>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose target group" />
                          </SelectTrigger>
                          <SelectContent>
                            {mockTargetGroups.map(tg => (
                              <SelectItem key={tg} value={tg}>
                                {tg}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button onClick={handleImportFromPreviousCampaign} className="w-full">
                        Import Screens
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="location" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Add by Location</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Location Type</Label>
                        <Select value={locationType} onValueChange={setLocationType}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="city">City</SelectItem>
                            <SelectItem value="state">State</SelectItem>
                            <SelectItem value="country">Country</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {locationType && (
                        <div>
                          <Label>Select Locations</Label>
                          <div className="space-y-2 max-h-32 overflow-y-auto">
                            {mockLocations[locationType as keyof typeof mockLocations]?.map(location => (
                              <label key={location} className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  checked={locationValues.includes(location)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setLocationValues(prev => [...prev, location]);
                                    } else {
                                      setLocationValues(prev => prev.filter(l => l !== location));
                                    }
                                  }}
                                />
                                <span className="text-sm">{location}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                      <Button onClick={handleAddLocation} className="w-full">
                        Add All Screens from Locations
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>
              </div>
              
              {/* Dual List UI */}
              <div className="flex-1 flex space-x-4">
                <Card className="flex-1">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">Included Screens</CardTitle>
                      <Badge variant="secondary">{includedScreens.length}</Badge>
                    </div>
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search included screens..."
                        value={searchIncluded}
                        onChange={(e) => setSearchIncluded(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {filteredIncluded.map(screen => (
                        <div
                          key={screen.id}
                          className="p-2 border rounded hover:bg-muted cursor-pointer"
                          onClick={() => moveToExcluded([screen])}
                        >
                          <div className="font-medium">{screen.id}</div>
                          <div className="text-sm text-muted-foreground">
                            {screen.theatreName} • {screen.location}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                
                <div className="flex flex-col justify-center space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => moveToExcluded(filteredIncluded)}
                  >
                    <MoveRight className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => moveToIncluded(filteredExcluded)}
                  >
                    <MoveLeft className="w-4 h-4" />
                  </Button>
                </div>
                
                <Card className="flex-1">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">Excluded Screens</CardTitle>
                      <Badge variant="secondary">{excludedScreens.length}</Badge>
                    </div>
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search excluded screens..."
                        value={searchExcluded}
                        onChange={(e) => setSearchExcluded(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {filteredExcluded.map(screen => (
                        <div
                          key={screen.id}
                          className="p-2 border rounded hover:bg-muted cursor-pointer"
                          onClick={() => moveToIncluded([screen])}
                        >
                          <div className="font-medium">{screen.id}</div>
                          <div className="text-sm text-muted-foreground">
                            {screen.theatreName} • {screen.location}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </Tabs>
          
          <Separator />
          
          {/* Bottom Actions */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {includedScreens.length} included • {excludedScreens.length} excluded
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  onSave(
                    includedScreens.map(s => s.id),
                    excludedScreens.map(s => s.id)
                  );
                  onOpenChange(false);
                }}
              >
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}