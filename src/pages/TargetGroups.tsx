import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { 
  Search,
  Filter,
  Download,
  Plus,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Split,
  Settings,
  ChevronUp,
  ChevronDown,
  ArrowLeft
} from "lucide-react"
import { Link } from "react-router-dom"

// Mock data for Target Groups
const mockTargetGroups = [
  {
    id: 1,
    name: "Mumbai Metro Cinemas",
    screenCount: 45,
    theatreCount: 12,
    createdOn: "2024-01-15",
    createdBy: "John Doe",
    validFrom: "2024-02-01",
    validTill: "2024-02-28"
  },
  {
    id: 2,
    name: "Delhi Premium Theatres",
    screenCount: 32,
    theatreCount: 8,
    createdOn: "2024-01-12",
    createdBy: "Jane Smith", 
    validFrom: "2024-02-01",
    validTill: "2024-02-28"
  },
  {
    id: 3,
    name: "Bangalore IT Corridor",
    screenCount: 28,
    theatreCount: 7,
    createdOn: "2024-01-10",
    createdBy: "Mike Johnson",
    validFrom: "2024-01-20",
    validTill: "2024-03-15"
  },
  {
    id: 4,
    name: "Chennai Beach Road Screens",
    screenCount: 18,
    theatreCount: 5,
    createdOn: "2024-01-08",
    createdBy: "Sarah Wilson",
    validFrom: "2024-02-01",
    validTill: "2024-02-28"
  }
]

const TargetGroups = () => {
  const [searchTerm, setSearchTerm] = useState("")
  const [sortField, setSortField] = useState<string>("")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [selectedColumns, setSelectedColumns] = useState({
    name: true,
    screenCount: true,
    theatreCount: true,
    createdOn: true,
    createdBy: true,
    validFrom: true,
    validTill: true
  })
  const [filteredData, setFilteredData] = useState(mockTargetGroups)

  const columns = [
    { key: "name", label: "TG Name", sortable: true },
    { key: "screenCount", label: "Screen Count", sortable: true },
    { key: "theatreCount", label: "Theatre Count", sortable: true },
    { key: "createdOn", label: "Created On", sortable: true },
    { key: "createdBy", label: "Created By", sortable: true },
    { key: "validFrom", label: "Valid From", sortable: true },
    { key: "validTill", label: "Valid Till", sortable: true }
  ]

  const handleSort = (field: string) => {
    const direction = sortField === field && sortDirection === "asc" ? "desc" : "asc"
    setSortField(field)
    setSortDirection(direction)
    
    const sorted = [...filteredData].sort((a, b) => {
      const aVal = a[field as keyof typeof a]
      const bVal = b[field as keyof typeof b]
      
      if (direction === "asc") {
        return aVal > bVal ? 1 : -1
      } else {
        return aVal < bVal ? 1 : -1
      }
    })
    
    setFilteredData(sorted)
  }

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    if (!value) {
      setFilteredData(mockTargetGroups)
      return
    }
    
    const filtered = mockTargetGroups.filter(tg =>
      tg.name.toLowerCase().includes(value.toLowerCase()) ||
      tg.createdBy.toLowerCase().includes(value.toLowerCase())
    )
    setFilteredData(filtered)
  }

  const handleAction = (action: string, tgId: number) => {
    console.log(`${action} action for TG ID: ${tgId}`)
    // Implement action handlers
  }

  const exportToCsv = () => {
    console.log("Exporting to CSV...")
  }

  const toggleColumn = (columnKey: string) => {
    setSelectedColumns(prev => ({
      ...prev,
      [columnKey]: !prev[columnKey as keyof typeof prev]
    }))
  }

  const getSortIcon = (field: string) => {
    if (sortField !== field) return null
    return sortDirection === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/campaigns/create">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Campaign
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Target Groups</h1>
          <p className="text-muted-foreground">Manage Target Groups for your campaign</p>
        </div>
      </div>

      {/* Controls */}
      <Card className="p-6">
        <div className="flex flex-col lg:flex-row gap-4 justify-between">
          {/* Search */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search TG name, theatre, screen..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            {/* Filters */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Filter className="w-4 h-4 mr-2" />
                  Filters
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-80 p-4">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Created Date Range</label>
                    <div className="flex gap-2 mt-1">
                      <Input type="date" placeholder="From" />
                      <Input type="date" placeholder="To" />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Screen Count Range</label>
                    <div className="flex gap-2 mt-1">
                      <Input type="number" placeholder="Min" />
                      <Input type="number" placeholder="Max" />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Created By</label>
                    <Select>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select user" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="john">John Doe</SelectItem>
                        <SelectItem value="jane">Jane Smith</SelectItem>
                        <SelectItem value="mike">Mike Johnson</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button className="w-full">Apply Filters</Button>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Column Visibility */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Settings className="w-4 h-4 mr-2" />
                  Columns
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {columns.map((column) => (
                  <DropdownMenuItem
                    key={column.key}
                    className="flex items-center gap-2"
                    onSelect={() => toggleColumn(column.key)}
                  >
                    <Checkbox
                      checked={selectedColumns[column.key as keyof typeof selectedColumns]}
                      onChange={() => toggleColumn(column.key)}
                    />
                    {column.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Export */}
            <Button variant="outline" onClick={exportToCsv}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>

            {/* Add Target Group */}
            <Button variant="primary">
              <Plus className="w-4 h-4 mr-2" />
              Add Target Group
            </Button>
          </div>
        </div>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">{filteredData.length}</div>
            <div className="text-sm text-muted-foreground">Total Target Groups</div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">
              {filteredData.reduce((sum, tg) => sum + tg.screenCount, 0)}
            </div>
            <div className="text-sm text-muted-foreground">Total Screens</div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">
              {filteredData.reduce((sum, tg) => sum + tg.theatreCount, 0)}
            </div>
            <div className="text-sm text-muted-foreground">Total Theatres</div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">Active</div>
            <div className="text-sm text-muted-foreground">Campaign Status</div>
          </div>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => 
                selectedColumns[column.key as keyof typeof selectedColumns] && (
                  <TableHead 
                    key={column.key}
                    className={column.sortable ? "cursor-pointer hover:bg-accent" : ""}
                    onClick={() => column.sortable && handleSort(column.key)}
                  >
                    <div className="flex items-center gap-2">
                      {column.label}
                      {column.sortable && getSortIcon(column.key)}
                    </div>
                  </TableHead>
                )
              )}
              <TableHead className="w-[50px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.map((tg) => (
              <TableRow key={tg.id} className="hover:bg-accent/50">
                {selectedColumns.name && (
                  <TableCell className="font-medium">
                    <Link 
                      to={`/campaigns/target-groups/${tg.id}`}
                      className="text-primary hover:underline"
                    >
                      {tg.name}
                    </Link>
                  </TableCell>
                )}
                {selectedColumns.screenCount && (
                  <TableCell>
                    <Badge variant="secondary">{tg.screenCount}</Badge>
                  </TableCell>
                )}
                {selectedColumns.theatreCount && (
                  <TableCell>
                    <Badge variant="secondary">{tg.theatreCount}</Badge>
                  </TableCell>
                )}
                {selectedColumns.createdOn && (
                  <TableCell>{new Date(tg.createdOn).toLocaleDateString()}</TableCell>
                )}
                {selectedColumns.createdBy && (
                  <TableCell>{tg.createdBy}</TableCell>
                )}
                {selectedColumns.validFrom && (
                  <TableCell>{new Date(tg.validFrom).toLocaleDateString()}</TableCell>
                )}
                {selectedColumns.validTill && (
                  <TableCell>{new Date(tg.validTill).toLocaleDateString()}</TableCell>
                )}
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleAction("view", tg.id)}>
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleAction("edit", tg.id)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Target Group
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleAction("split", tg.id)}>
                        <Split className="w-4 h-4 mr-2" />
                        Split Target Group
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleAction("delete", tg.id)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Group
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Empty State */}
      {filteredData.length === 0 && (
        <Card className="p-12">
          <div className="text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No Target Groups Found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm ? "No target groups match your search criteria." : "Get started by creating your first target group."}
            </p>
            <Button variant="primary">
              <Plus className="w-4 h-4 mr-2" />
              Add Target Group
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}

export default TargetGroups