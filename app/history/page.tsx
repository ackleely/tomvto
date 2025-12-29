"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Search, Filter, Download, Trash2, Eye, CheckCircle2, XCircle, ImageIcon, BarChart3, FileText, Info } from "lucide-react"
import Image from "next/image"
import { useToast } from "@/hooks/use-toast"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

interface PredictionHistory {
  id: string
  prediction: "viable" | "non-viable"
  confidence: number
  processingTime: number
  modelVersion: string
  imageSize: { width: number; height: number }
  timestamp: string
  image?: string
  attentionMap?: string
  featureAnalysis?: any
  detailedAnalysis?: any
  detectionType?: "single" | "multi"
  seedNumber?: number
}

export default function HistoryPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [resultFilter, setResultFilter] = useState<string>("all")
  const [selectedPrediction, setSelectedPrediction] = useState<PredictionHistory | null>(null)
  const [history, setHistory] = useState<PredictionHistory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAttention, setShowAttention] = useState(false)
  const [showFeatures, setShowFeatures] = useState(false)
  const [showDetailed, setShowDetailed] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const response = await fetch("/api/predictions")
        if (!response.ok) {
          throw new Error("Failed to load history")
        }
        const predictions = await response.json()
        setHistory(predictions)
      } catch (error) {
        toast({
          title: "Failed to load history",
          description: "Unable to load prediction history",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }
    loadHistory()
  }, [toast])

  const filteredHistory = history.filter((item) => {
    const matchesSearch = item.id.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesResult = resultFilter === "all" || item.prediction === resultFilter
    return matchesSearch && matchesResult
  })

  const handleExport = () => {
    toast({
      title: "Export started",
      description: "Your prediction history is being exported to CSV",
    })
  }

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/predictions?id=${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete prediction")
      }

      // Remove from local state
      setHistory((prev) => prev.filter((p) => p.id !== id))

      toast({
        title: "Prediction deleted",
        description: `Prediction ${id} has been removed from history`,
      })
    } catch (error) {
      toast({
        title: "Delete failed",
        description: "Failed to delete prediction from history",
        variant: "destructive",
      })
    }
  }

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Prediction History</h2>
        <p className="text-muted-foreground">View and manage all your seed viability predictions</p>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Filter & Search</CardTitle>
          <CardDescription>Find specific predictions in your history</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row md:items-end">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Search by ID</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search prediction ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>



            <div className="w-full md:w-48">
              <label className="text-sm font-medium mb-2 block">Result</label>
              <Select value={resultFilter} onValueChange={setResultFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Results</SelectItem>
                  <SelectItem value="viable">Viable</SelectItem>
                  <SelectItem value="non-viable">Non-Viable</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={handleExport} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* History Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Predictions ({filteredHistory.length})</CardTitle>
          <CardDescription>All your seed viability assessments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Filter className="h-12 w-12 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">No predictions found matching your filters</p>
              </div>
            ) : (
              filteredHistory.map((prediction) => (
                <div
                  key={prediction.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border bg-card hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    {/* Icon */}
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                      <ImageIcon className="h-5 w-5 text-foreground" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium">{prediction.id}</p>
                        <Badge variant="outline" className="text-xs">
                          {prediction.detectionType === "multi" 
                            ? `Multi-Seed ${prediction.seedNumber ? `#${prediction.seedNumber}` : ""}` 
                            : "Single Seed"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{formatDate(prediction.timestamp)}</p>
                    </div>

                    {/* Result */}
                    <div className="hidden md:flex items-center gap-2">
                      {prediction.prediction === "viable" ? (
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                      ) : (
                        <XCircle className="h-4 w-4 text-destructive" />
                      )}
                      <span className="text-sm font-medium capitalize">{prediction.prediction}</span>
                    </div>

                    {/* Confidence */}
                    <div className="hidden lg:block">
                      <Badge>{prediction.confidence}%</Badge>
                    </div>

                    {/* Processing Time */}
                    <div className="hidden xl:block text-sm text-muted-foreground">
                      {prediction.processingTime}ms
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 ml-4">
                    <Button variant="ghost" size="icon" onClick={() => setSelectedPrediction(prediction)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(prediction.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={selectedPrediction !== null} onOpenChange={() => setSelectedPrediction(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Prediction Details</DialogTitle>
            <DialogDescription>Complete information about this prediction</DialogDescription>
          </DialogHeader>

          {selectedPrediction && (
            <div className="space-y-4 pb-4">{/* Image Display if available */}
              {/* Image Display if available */}
              {selectedPrediction.image && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Seed Image</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="relative w-full h-48 rounded-lg overflow-hidden bg-muted">
                      <Image
                        src={selectedPrediction.image || "/placeholder.svg"}
                        alt="Seed image"
                        fill
                        className="object-contain"
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Header Info */}
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted">
                <div>
                  <p className="text-sm font-medium mb-1">{selectedPrediction.id}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(selectedPrediction.timestamp)}</p>
                </div>
                <Badge variant="outline" className="text-sm">
                  {selectedPrediction.detectionType === "multi" 
                    ? `Multi-Seed Detection ${selectedPrediction.seedNumber ? `- Seed #${selectedPrediction.seedNumber}` : ""}` 
                    : "Single Seed"}
                </Badge>
              </div>

              {/* Result */}
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Classification Result</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      {selectedPrediction.prediction === "viable" ? (
                        <CheckCircle2 className="h-6 w-6 text-primary" />
                      ) : (
                        <XCircle className="h-6 w-6 text-destructive" />
                      )}
                      <span className="text-lg font-semibold capitalize">{selectedPrediction.prediction}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Confidence Score</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="text-lg font-semibold">{selectedPrediction.confidence}%</div>
                      <div className="h-2 w-full rounded-full bg-secondary">
                        <div
                          className="h-2 rounded-full bg-primary"
                          style={{ width: `${selectedPrediction.confidence}%` }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Advanced Analysis Sections */}
              {selectedPrediction.attentionMap && (
                <Collapsible open={showAttention} onOpenChange={setShowAttention}>
                  <Card>
                    <CollapsibleTrigger asChild>
                      <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm">Attention Map</CardTitle>
                          <Eye className="h-4 w-4" />
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent>
                        <div className="relative w-full h-48 rounded-lg overflow-hidden bg-muted">
                          <Image
                            src={selectedPrediction.attentionMap || "/placeholder.svg"}
                            alt="Attention map"
                            fill
                            className="object-contain"
                          />
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              )}

              {selectedPrediction.featureAnalysis && (
                <Collapsible open={showFeatures} onOpenChange={setShowFeatures}>
                  <Card>
                    <CollapsibleTrigger asChild>
                      <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm">Feature Analysis</CardTitle>
                          <BarChart3 className="h-4 w-4" />
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-3 gap-2">
                          <div className="p-2 rounded bg-red-50 dark:bg-red-950/20">
                            <p className="text-xs text-red-700 dark:text-red-400">Red</p>
                            <p className="text-sm font-bold">{selectedPrediction.featureAnalysis.rgbChannels?.red?.mean?.toFixed(1)}</p>
                          </div>
                          <div className="p-2 rounded bg-green-50 dark:bg-green-950/20">
                            <p className="text-xs text-green-700 dark:text-green-400">Green</p>
                            <p className="text-sm font-bold">{selectedPrediction.featureAnalysis.rgbChannels?.green?.mean?.toFixed(1)}</p>
                          </div>
                          <div className="p-2 rounded bg-blue-50 dark:bg-blue-950/20">
                            <p className="text-xs text-blue-700 dark:text-blue-400">Blue</p>
                            <p className="text-sm font-bold">{selectedPrediction.featureAnalysis.rgbChannels?.blue?.mean?.toFixed(1)}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <p className="text-xs text-muted-foreground">Brightness</p>
                            <p className="text-sm font-medium">{selectedPrediction.featureAnalysis.brightness?.toFixed(1)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Edge Density</p>
                            <p className="text-sm font-medium">{selectedPrediction.featureAnalysis.edgeDetection?.density?.toFixed(3)}</p>
                          </div>
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              )}

              {selectedPrediction.detailedAnalysis && (
                <Collapsible open={showDetailed} onOpenChange={setShowDetailed}>
                  <Card>
                    <CollapsibleTrigger asChild>
                      <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm">Detailed Analysis</CardTitle>
                          <FileText className="h-4 w-4" />
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="space-y-3">
                        <div>
                          <p className="text-xs font-medium mb-1">Confidence: {selectedPrediction.detailedAnalysis.confidenceLevel}</p>
                          <p className="text-xs text-muted-foreground">{selectedPrediction.detailedAnalysis.reliability}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium mb-1">Explanation</p>
                          <p className="text-xs leading-relaxed mb-2">{selectedPrediction.detailedAnalysis.explanation}</p>
                          
                          {/* Key Indicators List */}
                          {selectedPrediction.detailedAnalysis.keyIndicators && selectedPrediction.detailedAnalysis.keyIndicators.length > 0 && (
                            <div className="mt-3">
                              <p className="text-xs font-medium mb-1.5">Key Characteristics:</p>
                              <ul className="space-y-1 ml-1">
                                {selectedPrediction.detailedAnalysis.keyIndicators.map((indicator: string, index: number) => (
                                  <li key={index} className="flex items-start gap-2 text-xs">
                                    <span className="text-primary mt-0.5">•</span>
                                    <span className="flex-1">{indicator}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                        <div className="p-2 rounded-lg border-l-2 border-primary bg-primary/5">
                          <p className="text-xs font-medium mb-1">Recommendation</p>
                          <p className="text-xs">{selectedPrediction.detailedAnalysis.recommendation}</p>
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              )}

              {/* Technical Details */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Technical Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Model Version</p>
                      <p className="text-sm font-medium">{selectedPrediction.modelVersion}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Processing Time</p>
                      <p className="text-sm font-medium">{selectedPrediction.processingTime}ms</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Model Type</p>
                      <p className="text-sm font-medium">CNN</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Prediction ID</p>
                      <p className="text-sm font-medium font-mono">{selectedPrediction.id}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Image Size</p>
                      <p className="text-sm font-medium">
                        {selectedPrediction.imageSize.width}x{selectedPrediction.imageSize.height}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 bg-transparent" onClick={() => setSelectedPrediction(null)}>
                  Close
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    handleDelete(selectedPrediction.id)
                    setSelectedPrediction(null)
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
