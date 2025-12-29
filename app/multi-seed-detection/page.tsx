"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Upload, Loader2, CheckCircle2, XCircle, Grid3x3, ImageIcon, ChevronDown, Brain } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import Image from "next/image"
import { useSettings } from "@/hooks/use-settings"

interface SeedDetection {
  seedNumber: number
  bbox: { x1: number; y1: number; x2: number; y2: number }
  detectionConfidence: number
  classification: "viable" | "non-viable"
  viabilityConfidence: number
  seedImage: string
  attentionMap?: string
  featureAnalysis?: {
    edgeDetection?: {
      density: number
      image: string
    }
    rgbChannels?: {
      red: { mean: number; std: number; image: string }
      green: { mean: number; std: number; image: string }
      blue: { mean: number; std: number; image: string }
    }
    brightness?: number
    brightnessImage?: string
    colorDistribution?: {
      red: number[]
      green: number[]
      blue: number[]
    }
    texture?: number
    textureVariation?: string
  }
  detailedAnalysis?: {
    confidenceLevel: string
    reliability: string
    explanation: string
    keyIndicators: string[]
    recommendation: string
    indicators: Array<{
      feature: string
      value: string
      interpretation: string
      significance: string
    }>
  }
}

interface DetectionResult {
  totalSeeds: number
  viableSeeds: number
  nonViableSeeds: number
  viabilityRate: number
  detections: SeedDetection[]
  annotatedImage: string
  processingTime: number
  timestamp: string
}

export default function MultiSeedDetectionPage() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [result, setResult] = useState<DetectionResult | null>(null)
  const [selectedSeed, setSelectedSeed] = useState<number | null>(null)
  const [openSections, setOpenSections] = useState({
    attentionMap: false,
    featureAnalysis: false,
    detailedAnalysis: false,
    modelInfo: false,
  })
  const { toast } = useToast()
  const { settings } = useSettings()

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Invalid file type",
          description: "Please upload an image file",
          variant: "destructive",
        })
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string)
        setResult(null)
        setSelectedSeed(null)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleAnalyze = async () => {
    if (!selectedImage) return

    setIsAnalyzing(true)
    setResult(null)
    setSelectedSeed(null)

    try {
      const response = await fetch("/api/detect/multi", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          image: selectedImage,
          confidence: 0.25 
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || data.details || "Detection failed")
      }

      setResult(data)

      // Auto-save to history if enabled
      if (settings.autoSave) {
        try {
          for (const seed of data.detections) {
            await fetch("/api/predictions", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                prediction: seed.classification,
                confidence: seed.viabilityConfidence,
                processingTime: data.processingTime / data.totalSeeds,
                modelVersion: "YOLO + CNN",
                imageSize: { width: 128, height: 128 },
                timestamp: data.timestamp,
                image: seed.seedImage,
                attentionMap: seed.attentionMap,
                featureAnalysis: seed.featureAnalysis,
                detailedAnalysis: seed.detailedAnalysis,
                detectionType: "multi" as const,
                seedNumber: seed.seedNumber,
              }),
            })
          }
        } catch (error) {
          console.error("Auto-save failed:", error)
        }
      }

      toast({
        title: "Detection complete",
        description: `Found ${data.totalSeeds} seeds: ${data.viableSeeds} viable, ${data.nonViableSeeds} non-viable`,
      })
    } catch (error) {
      console.error("Detection error:", error)
      toast({
        title: "Detection failed",
        description: error instanceof Error ? error.message : "Failed to detect seeds in the image. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleReset = () => {
    setSelectedImage(null)
    setResult(null)
    setSelectedSeed(null)
  }

  const handleSaveToHistory = async () => {
    if (!result) return

    setIsSaving(true)
    try {
      // Save each seed detection as a separate history entry
      for (const seed of result.detections) {
        const predictionData = {
          prediction: seed.classification,
          confidence: seed.viabilityConfidence,
          processingTime: result.processingTime / result.totalSeeds, // Average time per seed
          modelVersion: "YOLO + CNN",
          imageSize: { width: 128, height: 128 },
          timestamp: result.timestamp,
          image: seed.seedImage,
          attentionMap: seed.attentionMap,
          featureAnalysis: seed.featureAnalysis,
          detailedAnalysis: seed.detailedAnalysis,
          detectionType: "multi" as const,
          seedNumber: seed.seedNumber
        }

        const response = await fetch("/api/predictions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(predictionData),
        })

        if (!response.ok) {
          throw new Error(`Failed to save seed ${seed.seedNumber}`)
        }
      }

      toast({
        title: "Saved to History",
        description: `All ${result.totalSeeds} seed predictions saved successfully`,
      })
    } catch (error) {
      toast({
        title: "Save failed",
        description: error instanceof Error ? error.message : "Failed to save predictions to history",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Multi-Seed Detection</h2>
        <p className="text-muted-foreground">
          Upload a tray image with multiple seeds for batch viability classification using object detection
        </p>
      </div>

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Seed Tray Image</CardTitle>
          <CardDescription>Select an image containing multiple tomato seeds for batch analysis</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!selectedImage ? (
            <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-border rounded-lg cursor-pointer bg-muted/50 hover:bg-muted transition-colors">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-12 h-12 mb-3 text-muted-foreground" />
                <p className="mb-2 text-sm text-foreground font-medium">Click to upload seed tray image</p>
                <p className="text-xs text-muted-foreground">PNG, JPG, JPEG (MAX. 10MB)</p>
              </div>
              <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
            </label>
          ) : (
            <div className="space-y-4">
              <div className="relative w-full h-96 rounded-lg overflow-hidden bg-muted">
                <Image 
                  src={result ? result.annotatedImage : selectedImage || "/placeholder.svg"} 
                  alt={result ? "Annotated seed detection" : "Selected tray"} 
                  fill 
                  className="object-contain" 
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleAnalyze} disabled={isAnalyzing} className="flex-1">
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Detecting Seeds...
                    </>
                  ) : (
                    <>
                      <Grid3x3 className="mr-2 h-4 w-4" />
                      Detect & Analyze
                    </>
                  )}
                </Button>
                <Button onClick={handleReset} variant="outline" disabled={isAnalyzing}>
                  Reset
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {result && (
        <>
          {/* Summary Statistics */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Seeds</CardTitle>
                <Grid3x3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{result.totalSeeds}</div>
                <p className="text-xs text-muted-foreground">Detected in tray</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Viable Seeds</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{result.viableSeeds}</div>
                <p className="text-xs text-muted-foreground">
                  {((result.viableSeeds / result.totalSeeds) * 100).toFixed(1)}% of total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Non-Viable Seeds</CardTitle>
                <XCircle className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{result.nonViableSeeds}</div>
                <p className="text-xs text-muted-foreground">
                  {((result.nonViableSeeds / result.totalSeeds) * 100).toFixed(1)}% of total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Processing Time</CardTitle>
                <ImageIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{result.processingTime}ms</div>
                <p className="text-xs text-muted-foreground">Viability Rate: {result.viabilityRate}%</p>
              </CardContent>
            </Card>
          </div>

          {/* Individual Seed Detections */}
          <Card>
            <CardHeader>
              <CardTitle>Individual Seed Results</CardTitle>
              <CardDescription>Click on a seed in the image or list to view details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {result.detections.map((detection) => (
                  <button
                    type="button"
                    key={detection.seedNumber}
                    onClick={() => setSelectedSeed(detection.seedNumber)}
                    className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
                      selectedSeed === detection.seedNumber
                        ? "border-primary bg-primary/5"
                        : "border-border bg-card hover:bg-muted"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {detection.classification === "viable" ? (
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                      ) : (
                        <XCircle className="h-5 w-5 text-destructive" />
                      )}
                      <div className="text-left">
                        <p className="text-sm font-medium">Seed #{detection.seedNumber}</p>
                        <p className="text-xs text-muted-foreground capitalize">{detection.classification}</p>
                      </div>
                    </div>
                    <Badge variant={detection.classification === "viable" ? "default" : "destructive"}>
                      {detection.viabilityConfidence}%
                    </Badge>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Selected Seed Details */}
          {selectedSeed !== null && (
            <Card>
              <CardHeader>
                <CardTitle>Seed #{selectedSeed} Details</CardTitle>
                <CardDescription>Detailed information about the selected seed</CardDescription>
              </CardHeader>
              <CardContent>
                {(() => {
                  const seed = result.detections.find((d) => d.seedNumber === selectedSeed)
                  if (!seed) return null

                  return (
                    <div className="space-y-6">
                      {/* Basic Info */}
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-3">
                          <div>
                            <p className="text-sm font-medium mb-1">Classification</p>
                            <div className="flex items-center gap-2">
                              {seed.classification === "viable" ? (
                                <CheckCircle2 className="h-5 w-5 text-primary" />
                              ) : (
                                <XCircle className="h-5 w-5 text-destructive" />
                              )}
                              <span className="text-lg font-semibold capitalize">{seed.classification}</span>
                            </div>
                          </div>
                          <div>
                            <p className="text-sm font-medium mb-1">Viability Confidence</p>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 rounded-full bg-secondary">
                                <div
                                  className={`h-2 rounded-full ${seed.classification === "viable" ? "bg-primary" : "bg-destructive"}`}
                                  style={{ width: `${seed.viabilityConfidence}%` }}
                                />
                              </div>
                              <span className="text-sm font-medium">{seed.viabilityConfidence}%</span>
                            </div>
                          </div>
                          <div>
                            <p className="text-sm font-medium mb-1">Detection Confidence</p>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 rounded-full bg-secondary">
                                <div
                                  className="h-2 rounded-full bg-blue-500"
                                  style={{ width: `${seed.detectionConfidence}%` }}
                                />
                              </div>
                              <span className="text-sm font-medium">{seed.detectionConfidence}%</span>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <p className="text-sm font-medium mb-1">Seed Image</p>
                            <div className="relative w-full h-32 rounded-lg overflow-hidden bg-muted border">
                              <Image 
                                src={seed.seedImage || "/placeholder.svg"} 
                                alt={`Seed ${seed.seedNumber}`} 
                                fill 
                                className="object-contain" 
                              />
                            </div>
                          </div>
                          <div>
                            <p className="text-sm font-medium mb-1">Seed Number</p>
                            <p className="text-sm text-muted-foreground">#{seed.seedNumber}</p>
                          </div>
                        </div>
                      </div>

                      {/* Advanced Features */}
                      {seed.attentionMap && (
                        <Collapsible
                          open={openSections.attentionMap}
                          onOpenChange={(open) => setOpenSections((prev) => ({ ...prev, attentionMap: open }))}
                        >
                          <CollapsibleTrigger className="flex items-center justify-between w-full p-3 rounded-lg border border-border hover:bg-muted transition-colors">
                            <span className="text-sm font-medium">Attention Map</span>
                            <ChevronDown
                              className={`h-4 w-4 transition-transform ${openSections.attentionMap ? "rotate-180" : ""}`}
                            />
                          </CollapsibleTrigger>
                          <CollapsibleContent className="mt-3">
                            <div className="relative w-full h-64 rounded-lg overflow-hidden bg-muted border">
                              <Image
                                src={seed.attentionMap}
                                alt="Model attention heatmap"
                                fill
                                className="object-contain"
                              />
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                              Saliency-based visualization showing regions the model focuses on
                            </p>
                          </CollapsibleContent>
                        </Collapsible>
                      )}

                      {seed.featureAnalysis && (
                        <Collapsible
                          open={openSections.featureAnalysis}
                          onOpenChange={(open) => setOpenSections((prev) => ({ ...prev, featureAnalysis: open }))}
                        >
                          <CollapsibleTrigger className="flex items-center justify-between w-full p-3 rounded-lg border border-border hover:bg-muted transition-colors">
                            <span className="text-sm font-medium">Feature Analysis</span>
                            <ChevronDown
                              className={`h-4 w-4 transition-transform ${openSections.featureAnalysis ? "rotate-180" : ""}`}
                            />
                          </CollapsibleTrigger>
                          <CollapsibleContent className="mt-3 space-y-4">
                            {seed.featureAnalysis.edgeDetection && (
                              <div>
                                <p className="text-sm font-medium mb-2">Edge Detection</p>
                                <div className="relative w-full h-48 rounded-lg overflow-hidden bg-muted border">
                                  <Image
                                    src={seed.featureAnalysis.edgeDetection.image}
                                    alt="Edge detection analysis"
                                    fill
                                    className="object-contain"
                                  />
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Edge Density: {seed.featureAnalysis.edgeDetection.density.toFixed(3)}
                                </p>
                              </div>
                            )}

                            {seed.featureAnalysis.rgbChannels && (
                              <div>
                                <p className="text-sm font-medium mb-2">RGB Channel Analysis</p>
                                <div className="grid grid-cols-3 gap-2">
                                  <div>
                                    <p className="text-xs text-muted-foreground mb-1">Red Channel</p>
                                    <div className="relative w-full h-32 rounded-lg overflow-hidden bg-muted border">
                                      <Image
                                        src={seed.featureAnalysis.rgbChannels.red.image}
                                        alt="Red channel"
                                        fill
                                        className="object-contain"
                                      />
                                    </div>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground mb-1">Green Channel</p>
                                    <div className="relative w-full h-32 rounded-lg overflow-hidden bg-muted border">
                                      <Image
                                        src={seed.featureAnalysis.rgbChannels.green.image}
                                        alt="Green channel"
                                        fill
                                        className="object-contain"
                                      />
                                    </div>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground mb-1">Blue Channel</p>
                                    <div className="relative w-full h-32 rounded-lg overflow-hidden bg-muted border">
                                      <Image
                                        src={seed.featureAnalysis.rgbChannels.blue.image}
                                        alt="Blue channel"
                                        fill
                                        className="object-contain"
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {seed.featureAnalysis.brightnessImage && (
                              <div>
                                <p className="text-sm font-medium mb-2">Brightness Analysis</p>
                                <div className="relative w-full h-48 rounded-lg overflow-hidden bg-muted border">
                                  <Image
                                    src={seed.featureAnalysis.brightnessImage}
                                    alt="Brightness analysis"
                                    fill
                                    className="object-contain"
                                  />
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Brightness: {seed.featureAnalysis.brightness?.toFixed(1)}
                                </p>
                              </div>
                            )}

                            {seed.featureAnalysis.colorDistribution && (
                              <div>
                                <p className="text-sm font-medium mb-3">Color Distribution</p>
                                <div className="space-y-3">
                                  {/* Red Channel Distribution */}
                                  <div>
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="text-xs font-medium text-red-700 dark:text-red-400">Red Channel</span>
                                      <span className="text-xs text-muted-foreground">
                                        Max: {Math.max(...seed.featureAnalysis.colorDistribution.red)}
                                      </span>
                                    </div>
                                    <div className="flex gap-0.5 h-12 items-end">
                                      {seed.featureAnalysis.colorDistribution.red.map((value, idx) => {
                                        const maxVal = Math.max(...(seed.featureAnalysis?.colorDistribution?.red ?? [0]))
                                        const height = maxVal > 0 ? (value / maxVal) * 100 : 0
                                        return (
                                          <div
                                            key={idx}
                                            className="flex-1 bg-red-500 rounded-t"
                                            style={{ height: `${height}%` }}
                                            title={`Bin ${idx}: ${value}`}
                                          />
                                        )
                                      })}
                                    </div>
                                  </div>

                                  {/* Green Channel Distribution */}
                                  <div>
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="text-xs font-medium text-green-700 dark:text-green-400">Green Channel</span>
                                      <span className="text-xs text-muted-foreground">
                                        Max: {Math.max(...seed.featureAnalysis.colorDistribution.green)}
                                      </span>
                                    </div>
                                    <div className="flex gap-0.5 h-12 items-end">
                                      {seed.featureAnalysis.colorDistribution.green.map((value, idx) => {
                                        const maxVal = Math.max(...(seed.featureAnalysis?.colorDistribution?.green ?? [0]))
                                        const height = maxVal > 0 ? (value / maxVal) * 100 : 0
                                        return (
                                          <div
                                            key={idx}
                                            className="flex-1 bg-green-500 rounded-t"
                                            style={{ height: `${height}%` }}
                                            title={`Bin ${idx}: ${value}`}
                                          />
                                        )
                                      })}
                                    </div>
                                  </div>

                                  {/* Blue Channel Distribution */}
                                  <div>
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="text-xs font-medium text-blue-700 dark:text-blue-400">Blue Channel</span>
                                      <span className="text-xs text-muted-foreground">
                                        Max: {Math.max(...seed.featureAnalysis.colorDistribution.blue)}
                                      </span>
                                    </div>
                                    <div className="flex gap-0.5 h-12 items-end">
                                      {seed.featureAnalysis.colorDistribution.blue.map((value, idx) => {
                                        const maxVal = Math.max(...(seed.featureAnalysis?.colorDistribution?.blue ?? [0]))
                                        const height = maxVal > 0 ? (value / maxVal) * 100 : 0
                                        return (
                                          <div
                                            key={idx}
                                            className="flex-1 bg-blue-500 rounded-t"
                                            style={{ height: `${height}%` }}
                                            title={`Bin ${idx}: ${value}`}
                                          />
                                        )
                                      })}
                                    </div>
                                  </div>
                                </div>
                                <p className="text-xs text-muted-foreground mt-2">
                                  Histogram showing the distribution of RGB pixel intensities across 16 bins
                                </p>
                              </div>
                            )}

                            {seed.featureAnalysis.textureVariation && (
                              <div>
                                <p className="text-sm font-medium mb-2">Texture Variation</p>
                                <div className="relative w-full h-48 rounded-lg overflow-hidden bg-muted border">
                                  <Image
                                    src={seed.featureAnalysis.textureVariation}
                                    alt="Texture variation"
                                    fill
                                    className="object-contain"
                                  />
                                </div>
                              </div>
                            )}
                          </CollapsibleContent>
                        </Collapsible>
                      )}

                      {seed.detailedAnalysis && (
                        <Collapsible
                          open={openSections.detailedAnalysis}
                          onOpenChange={(open) => setOpenSections((prev) => ({ ...prev, detailedAnalysis: open }))}
                        >
                          <CollapsibleTrigger className="flex items-center justify-between w-full p-3 rounded-lg border border-border hover:bg-muted transition-colors">
                            <span className="text-sm font-medium">Detailed Analysis</span>
                            <ChevronDown
                              className={`h-4 w-4 transition-transform ${openSections.detailedAnalysis ? "rotate-180" : ""}`}
                            />
                          </CollapsibleTrigger>
                          <CollapsibleContent className="mt-3 space-y-4">
                            {/* Confidence Level */}
                            <div className="p-4 rounded-lg bg-muted">
                              <div className="flex items-center justify-between mb-2">
                                <p className="text-sm font-medium">Confidence Level</p>
                                <span className="text-sm font-bold">{seed.detailedAnalysis.confidenceLevel ? 
                                  seed.detailedAnalysis.confidenceLevel.charAt(0).toUpperCase() + seed.detailedAnalysis.confidenceLevel.slice(1) : 
                                  'N/A'
                                }</span>
                              </div>
                              <p className="text-sm text-muted-foreground">{seed.detailedAnalysis.reliability}</p>
                            </div>

                            {/* Explanation */}
                            <div>
                              <p className="text-sm font-medium mb-2">Explanation</p>
                              <p className="text-sm text-muted-foreground">{seed.detailedAnalysis.explanation}</p>
                            </div>

                            {/* Key Characteristics */}
                            {seed.detailedAnalysis.keyIndicators && seed.detailedAnalysis.keyIndicators.length > 0 && (
                              <div>
                                <p className="text-sm font-medium mb-2">Key Characteristics:</p>
                                <ul className="list-disc list-inside space-y-1">
                                  {seed.detailedAnalysis.keyIndicators.map((indicator, idx) => (
                                    <li key={idx} className="text-sm text-muted-foreground">
                                      {indicator}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Recommendation */}
                            {seed.detailedAnalysis.recommendation && (
                              <div className="p-4 rounded-lg border-l-4 border-primary bg-muted/50">
                                <p className="text-sm font-medium mb-1">Recommendation</p>
                                <p className="text-sm text-muted-foreground">{seed.detailedAnalysis.recommendation}</p>
                              </div>
                            )}

                            {/* Key Indicators */}
                            {seed.detailedAnalysis.indicators && seed.detailedAnalysis.indicators.length > 0 && (
                              <div>
                                <p className="text-sm font-medium mb-2">Key Indicators</p>
                                <div className="space-y-2">
                                  {seed.detailedAnalysis.indicators.map((indicator, idx) => (
                                    <div key={idx} className="p-3 rounded-lg border">
                                      <div className="flex items-center justify-between mb-1">
                                        <p className="text-sm font-medium">{indicator.feature}</p>
                                        <span className={`px-2 py-0.5 text-xs rounded-full ${
                                          indicator.significance === 'positive' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                                          indicator.significance === 'negative' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                                          'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                                        }`}>
                                          {indicator.significance}
                                        </span>
                                      </div>
                                      <p className="text-xs text-muted-foreground mb-1">Value: {indicator.value}</p>
                                      <p className="text-xs text-muted-foreground">{indicator.interpretation}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </CollapsibleContent>
                        </Collapsible>
                      )}
                    </div>
                  )
                })()}
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 bg-transparent" onClick={handleReset}>
              Analyze Another Tray
            </Button>
            <Button variant="default" className="flex-1" onClick={handleSaveToHistory} disabled={!result || isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save All Results to History"
              )}
            </Button>
          </div>
        </>
      )}

      {/* Model Information */}
      <Card>
        <CardHeader>
          <CardTitle>How the Multi-Seed Detection System Works</CardTitle>
          <CardDescription>Two-stage pipeline for batch seed viability analysis</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Pipeline Overview */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                1
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium mb-1">Seed Detection (YOLO)</p>
                <p className="text-sm text-muted-foreground">
                  YOLOv11 object detection model scans the entire tray image and identifies individual seeds
                  by drawing bounding boxes around each one. This custom-trained model can detect multiple
                  seeds simultaneously with high precision.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                2
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium mb-1">Individual Classification (CNN)</p>
                <p className="text-sm text-muted-foreground">
                  Each detected seed is cropped and passed to the fully-trained CNN classifier, which
                  analyzes viability based on color, texture, edge patterns, and other morphological features
                  learned during training.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                3
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium mb-1">Advanced Analysis</p>
                <p className="text-sm text-muted-foreground">
                  For each seed, the system generates attention maps to visualize decision-making areas,
                  performs feature analysis (edge detection, RGB channels, brightness, color distribution,
                  texture), and provides detailed explanations with key viability indicators.
                </p>
              </div>
            </div>
          </div>

          {/* Technical Details */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-1">
              <p className="text-sm font-medium">Detection Model</p>
              <p className="text-sm text-muted-foreground">YOLOv11s Custom Trained</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Classification Model</p>
              <p className="text-sm text-muted-foreground">CNN (Fully Trained)</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Training Dataset</p>
              <p className="text-sm text-muted-foreground">5000+ seed images</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Detection Accuracy</p>
              <p className="text-sm text-muted-foreground">High precision seed localization</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Framework</p>
              <p className="text-sm text-muted-foreground">Ultralytics YOLO + TensorFlow</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Last Updated</p>
              <p className="text-sm text-muted-foreground">December 2025</p>
            </div>
          </div>

          {/* Model Architecture */}
          <Collapsible
            open={openSections.modelInfo}
            onOpenChange={(open) => setOpenSections((prev) => ({ ...prev, modelInfo: open }))}
          >
            <CollapsibleTrigger className="flex items-center justify-between w-full p-3 rounded-lg border border-border hover:bg-muted transition-colors">
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4" />
                <span className="text-sm font-medium">Model Architecture Details</span>
              </div>
              <ChevronDown
                className={`h-4 w-4 transition-transform ${openSections.modelInfo ? "rotate-180" : ""}`}
              />
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3 space-y-4">
              <div>
                <p className="text-sm font-medium mb-2">YOLO Detection Network</p>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Real-time object detection with bounding box regression</li>
                  <li>Trained on custom tomato seed dataset with thousands of annotated images</li>
                  <li>Optimized for detecting seeds in various tray configurations and lighting</li>
                  <li>Supports batch processing with consistent seed ordering</li>
                </ul>
              </div>
              <div>
                <p className="text-sm font-medium mb-2">CNN Classification Network</p>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Custom architecture: 4 convolutional blocks + 3 dense layers</li>
                  <li>9,914,309 trainable parameters optimized for seed viability prediction</li>
                  <li>Input: 128x128 RGB images normalized to [0,1] range</li>
                  <li>Output: Binary classification (viable/non-viable) with confidence score</li>
                  <li>Trained with focal loss to handle class imbalance</li>
                </ul>
              </div>
              <div>
                <p className="text-sm font-medium mb-2">Advanced Features</p>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Saliency-based attention maps using edge, color, and texture analysis</li>
                  <li>Multi-dimensional feature extraction: edges, RGB channels, brightness, color distribution</li>
                  <li>Automated detailed analysis generation with key indicator identification</li>
                  <li>Consistent predictions for reproducible results</li>
                </ul>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>
    </div>
  )
}
