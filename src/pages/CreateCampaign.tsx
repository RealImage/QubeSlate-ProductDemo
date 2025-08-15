import { useState, createElement } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { 
  ArrowLeft,
  ArrowRight,
  Calendar,
  Check,
  FileText,
  MapPin,
  Megaphone,
  Users,
  Plus,
  Trash2
} from "lucide-react"
import { Link } from "react-router-dom"

const CreateCampaign = () => {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState({
    // Campaign Information
    campaignName: "",
    campaignType: "",
    clients: [],
    validityStartDate: "",
    validityEndDate: "",
    countries: [],
    campaignValue: "",
    campaignCurrency: "USD",
    
    // Contact Details
    clientContacts: [{ name: "", email: "", phone: "" }],
    salesContacts: [{ name: "", email: "", phone: "" }],
    
    // Billing Details
    billingCompanyName: "",
    billingCompanyAddress: "",
    billingCycle: "",
    advancePaymentRequired: false,
    
    // Media Agency Details
    orderRegion: "",
    orderType: "",
    orderId: ""
  })

  const steps = [
    { number: 1, title: "Campaign Details", icon: FileText },
    { number: 2, title: "Target Groups", icon: MapPin },
    { number: 3, title: "Media Selection", icon: Megaphone },
    { number: 4, title: "Placement Planning", icon: Calendar },
    { number: 5, title: "Review & Publish", icon: Check }
  ]

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const addContact = (type: 'client' | 'sales') => {
    const field = type === 'client' ? 'clientContacts' : 'salesContacts'
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], { name: "", email: "", phone: "" }]
    }))
  }

  const removeContact = (type: 'client' | 'sales', index: number) => {
    const field = type === 'client' ? 'clientContacts' : 'salesContacts'
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }))
  }

  const updateContact = (type: 'client' | 'sales', index: number, field: string, value: string) => {
    const contactField = type === 'client' ? 'clientContacts' : 'salesContacts'
    setFormData(prev => ({
      ...prev,
      [contactField]: prev[contactField].map((contact, i) => 
        i === index ? { ...contact, [field]: value } : contact
      )
    }))
  }

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-semibold text-foreground mb-2">Campaign Details</h2>
              <p className="text-muted-foreground">
                Configure your theatrical advertising campaign with detailed information across all sections.
              </p>
            </div>

            {/* Section 1: Campaign Information */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Campaign Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="campaignName">Campaign Name *</Label>
                  <Input
                    id="campaignName"
                    placeholder="e.g. Summer Blockbuster Promotion"
                    value={formData.campaignName}
                    onChange={(e) => handleInputChange("campaignName", e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="campaignType">Campaign Type *</Label>
                  <Select value={formData.campaignType} onValueChange={(value) => handleInputChange("campaignType", value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select campaign type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="private">Private</SelectItem>
                      <SelectItem value="political">Political</SelectItem>
                      <SelectItem value="psu">PSU</SelectItem>
                      <SelectItem value="government-central">Government - Central</SelectItem>
                      <SelectItem value="government-state">Government - State</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="clients">Clients</Label>
                  <Input
                    id="clients"
                    placeholder="Search & Select clients (optional)"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="validityStartDate">Validity Start Date *</Label>
                  <Input
                    id="validityStartDate"
                    type="date"
                    value={formData.validityStartDate}
                    onChange={(e) => handleInputChange("validityStartDate", e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="validityEndDate">Validity End Date *</Label>
                  <Input
                    id="validityEndDate"
                    type="date"
                    value={formData.validityEndDate}
                    onChange={(e) => handleInputChange("validityEndDate", e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="campaignCurrency">Currency</Label>
                    <Select value={formData.campaignCurrency} onValueChange={(value) => handleInputChange("campaignCurrency", value)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="INR">INR</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="GBP">GBP</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="campaignValue">Campaign Value</Label>
                    <Input
                      id="campaignValue"
                      placeholder="0.00"
                      type="number"
                      value={formData.campaignValue}
                      onChange={(e) => handleInputChange("campaignValue", e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="countries">Country *</Label>
                  <Input
                    id="countries"
                    placeholder="Search & Select countries (multi-select)"
                    className="mt-1"
                  />
                </div>
              </div>
            </Card>

            {/* Section 2: Contact Details */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Contact Details</h3>
              
              {/* Client Contacts */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-base">Client Contact</Label>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={() => addContact('client')}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Contact
                  </Button>
                </div>
                <div className="space-y-3">
                  {formData.clientContacts.map((contact, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-3 p-3 border border-border rounded-lg">
                      <Input
                        placeholder="Name"
                        value={contact.name}
                        onChange={(e) => updateContact('client', index, 'name', e.target.value)}
                      />
                      <Input
                        placeholder="Email"
                        type="email"
                        value={contact.email}
                        onChange={(e) => updateContact('client', index, 'email', e.target.value)}
                      />
                      <Input
                        placeholder="Phone"
                        value={contact.phone}
                        onChange={(e) => updateContact('client', index, 'phone', e.target.value)}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeContact('client', index)}
                        disabled={formData.clientContacts.length === 1}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <Separator className="my-6" />

              {/* Sales Representative Contacts */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-base">Sales Representative Contact</Label>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={() => addContact('sales')}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Contact
                  </Button>
                </div>
                <div className="space-y-3">
                  {formData.salesContacts.map((contact, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-3 p-3 border border-border rounded-lg">
                      <Input
                        placeholder="Name"
                        value={contact.name}
                        onChange={(e) => updateContact('sales', index, 'name', e.target.value)}
                      />
                      <Input
                        placeholder="Email"
                        type="email"
                        value={contact.email}
                        onChange={(e) => updateContact('sales', index, 'email', e.target.value)}
                      />
                      <Input
                        placeholder="Phone"
                        value={contact.phone}
                        onChange={(e) => updateContact('sales', index, 'phone', e.target.value)}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeContact('sales', index)}
                        disabled={formData.salesContacts.length === 1}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {/* Section 3: Billing Details */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Billing Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="billingCompanyName">Billing Company Name</Label>
                  <Input
                    id="billingCompanyName"
                    placeholder="Company Name"
                    value={formData.billingCompanyName}
                    onChange={(e) => handleInputChange("billingCompanyName", e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="billingCycle">Billing Cycle</Label>
                  <Select value={formData.billingCycle} onValueChange={(value) => handleInputChange("billingCycle", value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select billing cycle" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="fortnightly">Fortnightly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="on-completion">On Campaign Completion</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="billingCompanyAddress">Billing Company Address</Label>
                  <Textarea
                    id="billingCompanyAddress"
                    placeholder="Complete billing address"
                    value={formData.billingCompanyAddress}
                    onChange={(e) => handleInputChange("billingCompanyAddress", e.target.value)}
                    className="mt-1"
                    rows={3}
                  />
                </div>

                <div className="md:col-span-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="advancePaymentRequired"
                      checked={formData.advancePaymentRequired}
                      onCheckedChange={(checked) => handleInputChange("advancePaymentRequired", checked)}
                    />
                    <Label htmlFor="advancePaymentRequired">Advance Payment Required</Label>
                  </div>
                </div>
              </div>
            </Card>

            {/* Section 4: Media Agency Details */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Media Agency Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="orderRegion">Order Region</Label>
                  <Select value={formData.orderRegion} onValueChange={(value) => handleInputChange("orderRegion", value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select region" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ahmedabad">Ahmedabad</SelectItem>
                      <SelectItem value="bangalore">Bangalore</SelectItem>
                      <SelectItem value="chennai">Chennai</SelectItem>
                      <SelectItem value="hyderabad">Hyderabad</SelectItem>
                      <SelectItem value="kerala">Kerala</SelectItem>
                      <SelectItem value="kolkata">Kolkata</SelectItem>
                      <SelectItem value="mumbai">Mumbai</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="orderType">Order Type</Label>
                    <Select value={formData.orderType} onValueChange={(value) => handleInputChange("orderType", value)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select order type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="purchase-order">Purchase Order ID</SelectItem>
                        <SelectItem value="davp-order">DAVP Order ID</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="orderId">Order ID</Label>
                    <Input
                      id="orderId"
                      placeholder="Enter order ID"
                      value={formData.orderId}
                      onChange={(e) => handleInputChange("orderId", e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )
      default:
        return (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
              {createElement(steps[currentStep - 1].icon, { className: "w-8 h-8 text-primary-foreground" })}
            </div>
            <h2 className="text-2xl font-semibold text-foreground mb-2">
              {steps[currentStep - 1].title}
            </h2>
            <p className="text-muted-foreground">
              This step will be implemented in the next phase of development.
            </p>
          </div>
        )
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/campaigns">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Campaigns
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Create New Campaign</h1>
          <p className="text-muted-foreground mt-1">
            Follow the guided workflow to set up your theatrical advertising campaign.
          </p>
        </div>
      </div>

      {/* Progress Steps */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-8">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all ${
                currentStep >= step.number
                  ? "bg-accent-brand border-accent-brand text-accent-brand-foreground"
                  : currentStep === step.number - 1
                  ? "border-accent-brand text-accent-brand"
                  : "border-border text-muted-foreground"
              }`}>
                {currentStep > step.number ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <step.icon className="w-5 h-5" />
                )}
              </div>
              <div className="ml-3 hidden md:block">
                <div className={`font-medium transition-colors ${
                  currentStep >= step.number ? "text-foreground" : "text-muted-foreground"
                }`}>
                  {step.title}
                </div>
                <div className="text-sm text-muted-foreground">Step {step.number}</div>
              </div>
              {index < steps.length - 1 && (
                <div className={`hidden md:block w-16 h-0.5 ml-6 transition-colors ${
                  currentStep > step.number ? "bg-accent-brand" : "bg-border"
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        {renderStepContent()}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 1}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>

          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              Step {currentStep} of {steps.length}
            </Badge>
          </div>

          <Button
            variant="primary"
            onClick={handleNext}
            disabled={currentStep === steps.length}
          >
            {currentStep === steps.length ? "Publish Campaign" : "Next Step"}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </Card>
    </div>
  )
}

export default CreateCampaign