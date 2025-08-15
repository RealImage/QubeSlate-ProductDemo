import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface AddTargetGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: { name: string; validityStart?: Date; validityEnd?: Date }) => void;
}

export function AddTargetGroupDialog({ open, onOpenChange, onSave }: AddTargetGroupDialogProps) {
  const [tgName, setTgName] = useState("");
  const [validityStart, setValidityStart] = useState<Date>();
  const [validityEnd, setValidityEnd] = useState<Date>();

  const handleSave = () => {
    if (!tgName.trim()) return;
    
    onSave({
      name: tgName.trim(),
      validityStart,
      validityEnd
    });
    
    // Reset form
    setTgName("");
    setValidityStart(undefined);
    setValidityEnd(undefined);
    onOpenChange(false);
  };

  const handleCancel = () => {
    // Reset form
    setTgName("");
    setValidityStart(undefined);
    setValidityEnd(undefined);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Target Group</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="tg-name">
              TG Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="tg-name"
              value={tgName}
              onChange={(e) => setTgName(e.target.value)}
              placeholder="Enter target group name"
            />
          </div>
          
          <div className="space-y-2">
            <Label>Validity Start Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !validityStart && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {validityStart ? format(validityStart, "PPP") : "Select date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={validityStart}
                  onSelect={setValidityStart}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <div className="space-y-2">
            <Label>Validity End Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !validityEnd && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {validityEnd ? format(validityEnd, "PPP") : "Select date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={validityEnd}
                  onSelect={setValidityEnd}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!tgName.trim()}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}