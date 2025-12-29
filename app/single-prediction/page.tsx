"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Upload, Loader2, CheckCircle2, XCircle, ImageIcon, ChevronDown, ChevronUp, Eye, BarChart3, FileText, Info } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { useSettings } from "@/hooks/use-settings"

interface PredictionResult {
  prediction: "viable" | "non-viable"
  confidence: number
  processingTime: number
  modelVersion: string
  imageSize: { width: number; height: number }
  timestamp: string
  attentionMap?: string
  featureAnalysis?: {
    edgeDetection: { density: number; image: string }
    rgbChannels: {
      red: { mean: number; std: number; image: string }
      green: { mean: number; std: number; image: string }
      blue: { mean: number; std: number; image: string }
    }
    brightness: number
    brightnessImage?: string
    colorDistribution?: {
      red: number[]
      green: number[]
      blue: number[]
    }
    texture: number
    textureVariation?: string
  }
  detailedAnalysis?: {
    confidenceLevel: string
    reliability: string
    actionRequired?: string
    confidenceColor?: string
    qualityAssessment?: string
    explanation: string
    keyIndicators?: string[]
    recommendation: string
    nextSteps?: string[]
    indicators: Array<{
      feature: string
      value: string
      interpretation: string
      significance: string
    }>
    modelBasis: {
      architecture: string
      trainedOn: string
      features: string
      decisionProcess: string
    }
  }
}

export default function SinglePredictionPage() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [result, setResult] = useState<PredictionResult | null>(null)
  const [showAttention, setShowAttention] = useState(false)
  const [showFeatures, setShowFeatures] = useState(false)
  const [showDetailed, setShowDetailed] = useState(false)
  const [showHowItWorks, setShowHowItWorks] = useState(false)
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
      }
      reader.readAsDataURL(file)
    }
  }

  const handleAnalyze = async () => {
    if (!selectedImage) return

    setIsAnalyzing(true)
    setResult(null)

    try {
      // Call advanced prediction endpoint
      const response = await fetch("/api/predict/advanced", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ image: selectedImage }),
      })

      if (!response.ok) {
        throw new Error("Prediction failed")
      }

      const data = await response.json()
      setResult(data)

      // Auto-save to history if enabled
      if (settings.autoSave) {
        try {
          await fetch("/api/predictions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              ...data,
              image: selectedImage,
              detectionType: "single" as const,
            }),
          })
        } catch (error) {
          console.error("Auto-save failed:", error)
        }
      }

      toast({
        title: "Analysis complete",
        description: `Seed classified as ${data.prediction} with ${data.confidence}% confidence`,
      })
    } catch (error) {
      toast({
        title: "Analysis failed",
        description: "Failed to analyze the seed image. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleReset = () => {
    setSelectedImage(null)
    setResult(null)
    setShowAttention(false)
    setShowFeatures(false)
    setShowDetailed(false)
  }

  const handleSaveToHistory = async () => {
    if (!result) return

    setIsSaving(true)
    try {
      const response = await fetch("/api/predictions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...result,
          image: selectedImage, // Include the image for history display
          detectionType: "single" as const,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to save prediction")
      }

      toast({
        title: "Saved to History",
        description: "Prediction has been saved successfully",
      })
    } catch (error) {
      toast({
        title: "Save failed",
        description: "Failed to save prediction to history",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Single Seed Prediction</h2>
        <p className="text-muted-foreground">
          Upload a single tomato seed image for viability classification using CNN model
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle>Upload Seed Image</CardTitle>
            <CardDescription>Select a clear image of a single tomato seed for analysis</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!selectedImage ? (
              <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-border rounded-lg cursor-pointer bg-muted/50 hover:bg-muted transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-12 h-12 mb-3 text-muted-foreground" />
                  <p className="mb-2 text-sm text-foreground font-medium">Click to upload seed image</p>
                  <p className="text-xs text-muted-foreground">PNG, JPG, JPEG (MAX. 10MB)</p>
                </div>
                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
              </label>
            ) : (
              <div className="space-y-4">
                <div className="relative w-full h-64 rounded-lg overflow-hidden bg-muted">
                  <Image
                    src={selectedImage || "/placeholder.svg"}
                    alt="Selected seed"
                    fill
                    className="object-contain"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleAnalyze} disabled={isAnalyzing} className="flex-1">
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <ImageIcon className="mr-2 h-4 w-4" />
                        Analyze Seed
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

        {/* Results Section */}
        <Card>
          <CardHeader>
            <CardTitle>Prediction Results</CardTitle>
            <CardDescription>CNN model classification output</CardDescription>
          </CardHeader>
          <CardContent>
            {!result ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <ImageIcon className="w-16 h-16 text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">Upload and analyze a seed image to see results</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Main Result */}
                <div className="flex items-center justify-center p-6 rounded-lg bg-muted">
                  <div className="text-center">
                    {result.prediction === "viable" ? (
                      <CheckCircle2 className="w-16 h-16 text-primary mx-auto mb-3" />
                    ) : (
                      <XCircle className="w-16 h-16 text-destructive mx-auto mb-3" />
                    )}
                    <h3 className="text-2xl font-bold capitalize mb-1">{result.prediction}</h3>
                    <p className="text-sm text-muted-foreground">Seed Classification</p>
                  </div>
                </div>

                {/* Confidence Score */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Confidence Score</span>
                    <span className="text-sm font-bold">{result.confidence}%</span>
                  </div>
                  <div className="h-3 w-full rounded-full bg-secondary">
                    <div
                      className={`h-3 rounded-full ${result.prediction === "viable" ? "bg-primary" : "bg-destructive"}`}
                      style={{ width: `${result.confidence}%` }}
                    />
                  </div>
                </div>

                {/* Additional Details */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Processing Time</p>
                    <p className="text-sm font-medium">{result.processingTime}ms</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Model Version</p>
                    <p className="text-sm font-medium">{result.modelVersion}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Image Size</p>
                    <p className="text-sm font-medium">
                      {result.imageSize.width}x{result.imageSize.height}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Model Type</p>
                    <p className="text-sm font-medium">CNN</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-4">
                  <Button variant="outline" className="flex-1 bg-transparent" onClick={handleReset}>
                    Analyze Another
                  </Button>
                  <Button variant="default" className="flex-1" onClick={handleSaveToHistory} disabled={!result || isSaving}>
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save to History"
                    )}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Advanced Analysis Sections */}
      {result && (
        <div className="space-y-4">
          {/* Attention Map */}
          <Collapsible open={showAttention} onOpenChange={setShowAttention}>
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Eye className="w-5 h-5 text-primary" />
                      <CardTitle>Attention Map</CardTitle>
                    </div>
                    {showAttention ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </div>
                  <CardDescription>Visual representation of model focus areas</CardDescription>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent>
                  {result.attentionMap ? (
                    <div className="space-y-4">
                      <div className="relative w-full h-64 rounded-lg overflow-hidden bg-muted">
                        <Image
                          src={result.attentionMap || "/placeholder.svg"}
                          alt="Attention map"
                          fill
                          className="object-contain"
                        />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        The heatmap highlights areas the model focused on when making its prediction. 
                        Red/yellow areas indicate high attention, while blue areas show low attention.
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Attention map not available</p>
                  )}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Feature Analysis */}
          <Collapsible open={showFeatures} onOpenChange={setShowFeatures}>
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-primary" />
                      <CardTitle>Feature Analysis</CardTitle>
                    </div>
                    {showFeatures ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </div>
                  <CardDescription>Detailed image characteristics and properties</CardDescription>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent>
                  {result.featureAnalysis ? (
                    <div className="space-y-6">
                      {/* Edge Detection */}
                      <div>
                        <h4 className="font-semibold mb-2">Edge Detection</h4>
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="relative w-full h-48 rounded-lg overflow-hidden bg-muted">
                            <Image
                              src={result.featureAnalysis.edgeDetection.image || "/placeholder.svg"}
                              alt="Edge detection"
                              fill
                              className="object-contain"
                            />
                          </div>
                          <div className="flex flex-col justify-center space-y-2">
                            <p className="text-sm">
                              <span className="font-medium">Edge Density:</span>{" "}
                              {result.featureAnalysis.edgeDetection.density.toFixed(3)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Measures the structural definition and boundaries of the seed
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* RGB Channels */}
                      <div>
                        <h4 className="font-semibold mb-2">RGB Channel Analysis</h4>
                        
                        {/* RGB Channel Visualizations */}
                        <div className="grid grid-cols-3 gap-4 mb-4">
                          <div>
                            <p className="text-xs font-medium text-red-700 dark:text-red-400 mb-2">Red Channel</p>
                            <div className="relative w-full h-32 rounded-lg overflow-hidden bg-muted border">
                              <Image
                                src={result.featureAnalysis.rgbChannels.red.image || "/placeholder.svg"}
                                alt="Red channel"
                                fill
                                className="object-contain"
                              />
                            </div>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-green-700 dark:text-green-400 mb-2">Green Channel</p>
                            <div className="relative w-full h-32 rounded-lg overflow-hidden bg-muted border">
                              <Image
                                src={result.featureAnalysis.rgbChannels.green.image || "/placeholder.svg"}
                                alt="Green channel"
                                fill
                                className="object-contain"
                              />
                            </div>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-blue-700 dark:text-blue-400 mb-2">Blue Channel</p>
                            <div className="relative w-full h-32 rounded-lg overflow-hidden bg-muted border">
                              <Image
                                src={result.featureAnalysis.rgbChannels.blue.image || "/placeholder.svg"}
                                alt="Blue channel"
                                fill
                                className="object-contain"
                              />
                            </div>
                          </div>
                        </div>

                        {/* RGB Channel Statistics */}
                        <div className="grid grid-cols-3 gap-4">
                          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20">
                            <p className="text-xs font-medium text-red-700 dark:text-red-400">Red Channel</p>
                            <p className="text-sm font-bold">{result.featureAnalysis.rgbChannels.red.mean.toFixed(1)}</p>
                            <p className="text-xs text-muted-foreground">±{result.featureAnalysis.rgbChannels.red.std.toFixed(1)}</p>
                          </div>
                          <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/20">
                            <p className="text-xs font-medium text-green-700 dark:text-green-400">Green Channel</p>
                            <p className="text-sm font-bold">{result.featureAnalysis.rgbChannels.green.mean.toFixed(1)}</p>
                            <p className="text-xs text-muted-foreground">±{result.featureAnalysis.rgbChannels.green.std.toFixed(1)}</p>
                          </div>
                          <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20">
                            <p className="text-xs font-medium text-blue-700 dark:text-blue-400">Blue Channel</p>
                            <p className="text-sm font-bold">{result.featureAnalysis.rgbChannels.blue.mean.toFixed(1)}</p>
                            <p className="text-xs text-muted-foreground">±{result.featureAnalysis.rgbChannels.blue.std.toFixed(1)}</p>
                          </div>
                        </div>
                      </div>

                      {/* Brightness & Texture */}
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-4 rounded-lg border">
                          <h4 className="font-semibold mb-1">Brightness</h4>
                          <p className="text-2xl font-bold">{result.featureAnalysis.brightness.toFixed(1)}</p>
                          <div className="mt-2 h-2 rounded-full bg-gradient-to-r from-black to-white" />
                          <p className="text-xs text-muted-foreground mt-1">Overall image luminosity</p>
                        </div>
                        <div className="p-4 rounded-lg border">
                          <h4 className="font-semibold mb-1">Texture Score</h4>
                          <p className="text-2xl font-bold">{result.featureAnalysis.texture.toFixed(1)}</p>
                          <p className="text-xs text-muted-foreground mt-1">Surface variation and detail</p>
                        </div>
                      </div>

                      {/* Color Distribution */}
                      {result.featureAnalysis.colorDistribution && (
                        <div>
                          <h4 className="font-semibold mb-3">Color Distribution</h4>
                          <div className="space-y-3">
                            {/* Red Channel Distribution */}
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-medium text-red-700 dark:text-red-400">Red Channel</span>
                                <span className="text-xs text-muted-foreground">
                                  Max: {Math.max(...result.featureAnalysis.colorDistribution.red)}
                                </span>
                              </div>
                              <div className="flex gap-0.5 h-16 items-end">
                                {result.featureAnalysis.colorDistribution.red.map((value, idx) => {
                                  const maxVal = Math.max(...(result.featureAnalysis?.colorDistribution?.red ?? [0]))
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
                                  Max: {Math.max(...result.featureAnalysis.colorDistribution.green)}
                                </span>
                              </div>
                              <div className="flex gap-0.5 h-16 items-end">
                                {result.featureAnalysis.colorDistribution.green.map((value, idx) => {
                                  const maxVal = Math.max(...(result.featureAnalysis?.colorDistribution?.green ?? [0]))
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
                                  Max: {Math.max(...result.featureAnalysis.colorDistribution.blue)}
                                </span>
                              </div>
                              <div className="flex gap-0.5 h-16 items-end">
                                {result.featureAnalysis.colorDistribution.blue.map((value, idx) => {
                                  const maxVal = Math.max(...(result.featureAnalysis?.colorDistribution?.blue ?? [0]))
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
                            Histogram showing the distribution of red, green, and blue pixel intensities across 16 bins
                          </p>
                        </div>
                      )}

                      {/* Texture Variation */}
                      {result.featureAnalysis.textureVariation && (
                        <div>
                          <h4 className="font-semibold mb-2">Texture Variation</h4>
                          <div className="relative w-full h-48 rounded-lg overflow-hidden bg-muted border">
                            <Image
                              src={result.featureAnalysis.textureVariation}
                              alt="Texture variation map"
                              fill
                              className="object-contain"
                            />
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            Local texture variation map showing surface detail patterns
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Feature analysis not available</p>
                  )}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Detailed Analysis */}
          <Collapsible open={showDetailed} onOpenChange={setShowDetailed}>
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-primary" />
                      <CardTitle>Detailed Analysis</CardTitle>
                    </div>
                    {showDetailed ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </div>
                  <CardDescription>Comprehensive explanation of the prediction</CardDescription>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent>
                  {result.detailedAnalysis ? (
                    <div className="space-y-6">
                      {/* Confidence Level */}
                      <div className="p-4 rounded-lg bg-muted border-l-4 border-primary">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold">Confidence Level</h4>
                          <span className="text-sm font-bold capitalize px-3 py-1 rounded-full bg-primary/20 text-primary">
                            {result.detailedAnalysis.confidenceLevel}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{result.detailedAnalysis.reliability}</p>
                        {result.detailedAnalysis.qualityAssessment && (
                          <div className="mt-2">
                            <span className="text-xs font-semibold text-foreground">
                              Quality: {result.detailedAnalysis.qualityAssessment}
                            </span>
                          </div>
                        )}
                        {result.detailedAnalysis.actionRequired && (
                          <div className="mt-3 p-3 rounded-md bg-background border">
                            <p className="text-xs font-medium text-foreground">
                              <span className="font-bold">Action Required:</span> {result.detailedAnalysis.actionRequired}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Explanation */}
                      <div>
                        <h4 className="font-semibold mb-2">Explanation</h4>
                        <p className="text-sm leading-relaxed mb-3">{result.detailedAnalysis.explanation}</p>
                        
                        {/* Key Indicators List */}
                        {result.detailedAnalysis.keyIndicators && result.detailedAnalysis.keyIndicators.length > 0 && (
                          <div className="mt-4">
                            <h5 className="text-sm font-medium mb-2">Key Characteristics:</h5>
                            <ul className="space-y-1.5 ml-1">
                              {result.detailedAnalysis.keyIndicators.map((indicator: string, index: number) => (
                                <li key={index} className="flex items-start gap-2 text-sm">
                                  <span className="text-primary mt-1">•</span>
                                  <span className="flex-1">{indicator}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      {/* Recommendation */}
                      <div className="p-4 rounded-lg border-l-4 border-primary bg-primary/5">
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <span>Recommendation</span>
                        </h4>
                        <p className="text-sm font-medium leading-relaxed">{result.detailedAnalysis.recommendation}</p>
                      </div>

                      {/* Next Steps */}
                      {result.detailedAnalysis.nextSteps && result.detailedAnalysis.nextSteps.length > 0 && (
                        <div className="p-4 rounded-lg border bg-card">
                          <h4 className="font-semibold mb-3 text-foreground">Recommended Next Steps</h4>
                          <ol className="space-y-2">
                            {result.detailedAnalysis.nextSteps.map((step: string, index: number) => (
                              <li key={index} className="flex items-start gap-3 text-sm">
                                <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold">
                                  {index + 1}
                                </span>
                                <span className="flex-1 pt-0.5">{step}</span>
                              </li>
                            ))}
                          </ol>
                        </div>
                      )}

                      {/* Indicators */}
                      {result.detailedAnalysis.indicators && result.detailedAnalysis.indicators.length > 0 && (
                        <div>
                          <h4 className="font-semibold mb-3">Key Indicators</h4>
                          <div className="space-y-3">
                            {result.detailedAnalysis.indicators.map((indicator, index) => (
                              <div key={index} className="p-3 rounded-lg border">
                                <div className="flex items-start justify-between mb-1">
                                  <h5 className="font-medium text-sm">{indicator.feature}</h5>
                                  <span
                                    className={`text-xs px-2 py-1 rounded ${
                                      indicator.significance === "positive"
                                        ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400"
                                        : indicator.significance === "negative"
                                        ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400"
                                        : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
                                    }`}
                                  >
                                    {indicator.significance}
                                  </span>
                                </div>
                                <p className="text-xs text-muted-foreground mb-1">Value: {indicator.value}</p>
                                <p className="text-sm">{indicator.interpretation}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Detailed analysis not available</p>
                  )}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* How the Model Works */}
          <Collapsible open={showHowItWorks} onOpenChange={setShowHowItWorks}>
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Info className="w-5 h-5 text-primary" />
                      <CardTitle>How the Model Works</CardTitle>
                    </div>
                    {showHowItWorks ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </div>
                  <CardDescription>Understanding the AI decision process</CardDescription>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent>
                  {result.detailedAnalysis?.modelBasis ? (
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold mb-2">Architecture</h4>
                        <p className="text-sm text-muted-foreground">{result.detailedAnalysis.modelBasis.architecture}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Training Data</h4>
                        <p className="text-sm text-muted-foreground">{result.detailedAnalysis.modelBasis.trainedOn}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Features Learned</h4>
                        <p className="text-sm text-muted-foreground">{result.detailedAnalysis.modelBasis.features}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Decision Process</h4>
                        <p className="text-sm text-muted-foreground">{result.detailedAnalysis.modelBasis.decisionProcess}</p>
                      </div>
                      <div className="p-4 rounded-lg bg-muted">
                        <h4 className="font-semibold mb-2">How Predictions Are Made</h4>
                        <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                          <li>Image is preprocessed and normalized to 128x128 pixels</li>
                          <li>Convolutional layers extract visual features (edges, textures, colors)</li>
                          <li>Pooling layers reduce dimensionality while preserving important features</li>
                          <li>Dense layers combine features to make final classification</li>
                          <li>Output probability indicates viable (&gt;0.5) or non-viable (≤0.5)</li>
                        </ol>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        The CNN model analyzes seed images through multiple layers of processing to determine viability.
                      </p>
                    </div>
                  )}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        </div>
      )}

      {/* Model Information */}
      <Card>
        <CardHeader>
          <CardTitle>CNN Model Information</CardTitle>
          <CardDescription>Details about the single seed classification model</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-1">
              <p className="text-sm font-medium">Architecture</p>
              <p className="text-sm text-muted-foreground">Convolutional Neural Network (CNN)</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Training Dataset</p>
              <p className="text-sm text-muted-foreground">5000+ tomato seed images</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Accuracy</p>
              <p className="text-sm text-muted-foreground">98%</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Input Size</p>
              <p className="text-sm text-muted-foreground">128x128 pixels</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Framework</p>
              <p className="text-sm text-muted-foreground">TensorFlow 2.15</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Last Updated</p>
              <p className="text-sm text-muted-foreground">December 2025</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
