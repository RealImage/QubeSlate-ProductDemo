import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Wrench } from "lucide-react"
import { Link } from "react-router-dom"

interface PlaceholderPageProps {
  title: string
  description: string
  backLink?: string
  backText?: string
}

const PlaceholderPage = ({ 
  title, 
  description, 
  backLink = "/", 
  backText = "Back to Dashboard" 
}: PlaceholderPageProps) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to={backLink}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            {backText}
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">{title}</h1>
          <p className="text-muted-foreground mt-1">{description}</p>
        </div>
      </div>

      {/* Coming Soon Card */}
      <Card className="p-12 text-center">
        <div className="max-w-md mx-auto">
          <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-6">
            <Wrench className="w-8 h-8 text-primary-foreground" />
          </div>
          
          <h2 className="text-2xl font-semibold text-foreground mb-4">Coming Soon</h2>
          
          <p className="text-muted-foreground mb-6">
            This feature is currently under development and will be available in the next phase of the Qube Slate platform.
          </p>

          <div className="flex items-center justify-center gap-2 mb-6">
            <Badge variant="secondary">In Development</Badge>
            <Badge className="bg-accent-brand text-accent-brand-foreground">High Priority</Badge>
          </div>

          <Button variant="outline" asChild>
            <Link to="/">Return to Dashboard</Link>
          </Button>
        </div>
      </Card>
    </div>
  )
}

export default PlaceholderPage