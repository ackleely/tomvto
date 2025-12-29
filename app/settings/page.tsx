"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Brain, Server, Settings2, Bell, Palette, Database, Code, Activity, CheckCircle2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useEffect } from "react"
import { useTheme } from "next-themes"
import { useSettings } from "@/hooks/use-settings"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface ModelInfo {
  model_version: string
  input_shape: number[]
  image_size: { width: number; height: number }
  channels: number
  output_classes: number
  model_file: string
  framework: string
  timestamp: string
}

export default function SettingsPage() {
  const [modelInfo, setModelInfo] = useState<ModelInfo | null>(null)
  const { toast } = useToast()
  const { theme, setTheme } = useTheme()
  const { settings, updateSettings } = useSettings()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const loadModelInfo = async () => {
      try {
        const response = await fetch("/api/model-info")
        if (!response.ok) {
          throw new Error("Failed to load model info")
        }
        const info = await response.json()
        setModelInfo(info)
      } catch (error) {
        console.error("Failed to load model info:", error)
      }
    }
    loadModelInfo()
  }, [])

  const handleSaveSettings = () => {
    toast({
      title: "Settings saved",
      description: "Your preferences have been updated successfully",
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Settings</h2>
        <p className="text-muted-foreground">Manage your application settings and view model information</p>
      </div>

      <Tabs defaultValue="models" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto">
          <TabsTrigger value="models">Models</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
          <TabsTrigger value="api">API Config</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
        </TabsList>

        {/* Models Tab */}
        <TabsContent value="models" className="space-y-6">
          {/* CNN Model */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    CNN Model - Single Seed Classification
                  </CardTitle>
                  <CardDescription>
                    Convolutional Neural Network for individual seed viability prediction
                  </CardDescription>
                </div>
                <Badge className="bg-primary">Active</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Model Specifications */}
              <div>
                <h4 className="text-sm font-semibold mb-3">Model Specifications</h4>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Model Version</p>
                    <p className="text-sm font-medium">CNN-v2.1.0</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Architecture</p>
                    <p className="text-sm font-medium">Convolutional Neural Network</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Framework</p>
                    <p className="text-sm font-medium">TensorFlow 2.15.0</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Input Size</p>
                    <p className="text-sm font-medium">
                      {modelInfo ? `${modelInfo.image_size.width}x${modelInfo.image_size.height} pixels` : "Loading..."}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Output Classes</p>
                    <p className="text-sm font-medium">2 (Viable, Non-Viable)</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Model Size</p>
                    <p className="text-sm font-medium">37.8 MB</p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Performance Metrics */}
              <div>
                <h4 className="text-sm font-semibold mb-3">Performance Metrics</h4>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-xs text-muted-foreground">Accuracy</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">98%</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-xs text-muted-foreground">Precision</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">98%</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-xs text-muted-foreground">Recall</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">98%</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-xs text-muted-foreground">F1 Score</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">98%</p>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <Separator />

              {/* Training Information */}
              <div>
                <h4 className="text-sm font-semibold mb-3">Training Information</h4>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Training Dataset</p>
                    <p className="text-sm font-medium">5000+ tomato seed images</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Validation Split</p>
                    <p className="text-sm font-medium">20% (1,250 images)</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Training Epochs</p>
                    <p className="text-sm font-medium">50 epochs</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Last Updated</p>
                    <p className="text-sm font-medium">December 15, 2025</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Object Detection Model */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Object Detection Model - Multi-Seed Analysis
                  </CardTitle>
                  <CardDescription>
                    YOLO-based model for detecting and classifying multiple seeds in trays
                  </CardDescription>
                </div>
                <Badge className="bg-primary">Active</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Model Specifications */}
              <div>
                <h4 className="text-sm font-semibold mb-3">Model Specifications</h4>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Model Version</p>
                    <p className="text-sm font-medium">YOLOv11s</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Architecture</p>
                    <p className="text-sm font-medium">YOLOv11s + Classification Head</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Framework</p>
                    <p className="text-sm font-medium">TensorFlow 2.15.0 + OpenCV 4.8.1</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Input Size</p>
                    <p className="text-sm font-medium">640x640 pixels</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Detection Classes</p>
                    <p className="text-sm font-medium">2 (Tomato Seed Viable and Non-Viable)</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Model Size</p>
                    <p className="text-sm font-medium">18.2 MB</p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Performance Metrics */}
              <div>
                <h4 className="text-sm font-semibold mb-3">Performance Metrics</h4>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-xs text-muted-foreground">mAP@0.5</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">99.5%</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-xs text-muted-foreground">mAP@0.5-0.95</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">85.8%</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-xs text-muted-foreground">Precision</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">99.5%</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-xs text-muted-foreground">Recall</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">99.6%</p>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <Separator />

              {/* Training Information */}
              <div>
                <h4 className="text-sm font-semibold mb-3">Training Information</h4>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Training Dataset</p>
                    <p className="text-sm font-medium">237 tray images with annotations</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Total Annotated Seeds</p>
                    <p className="text-sm font-medium">5300+ bounding boxes</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Training Epochs</p>
                    <p className="text-sm font-medium">150 epochs</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Last Updated</p>
                    <p className="text-sm font-medium">December, 2025</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Tab */}
        <TabsContent value="system" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                System Information
              </CardTitle>
              <CardDescription>Backend infrastructure and dependencies</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Backend Framework */}
              <div>
                <h4 className="text-sm font-semibold mb-3">Backend Framework</h4>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                    <div className="flex items-center gap-3">
                      <Code className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Flask</p>
                        <p className="text-xs text-muted-foreground">Python Web Framework</p>
                      </div>
                    </div>
                    <Badge variant="outline">v3.0.0</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm font-medium">Status</p>
                        <p className="text-xs text-muted-foreground">Running</p>
                      </div>
                    </div>
                    <Badge className="bg-primary">Active</Badge>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Core Dependencies */}
              <div>
                <h4 className="text-sm font-semibold mb-3">Core Dependencies</h4>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                    <div>
                      <p className="text-sm font-medium">TensorFlow</p>
                      <p className="text-xs text-muted-foreground">Deep Learning Framework</p>
                    </div>
                    <Badge variant="outline">v2.15.0</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                    <div>
                      <p className="text-sm font-medium">NumPy</p>
                      <p className="text-xs text-muted-foreground">Numerical Computing</p>
                    </div>
                    <Badge variant="outline">v1.26.2</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                    <div>
                      <p className="text-sm font-medium">OpenCV</p>
                      <p className="text-xs text-muted-foreground">Computer Vision Library</p>
                    </div>
                    <Badge variant="outline">v4.8.1</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                    <div>
                      <p className="text-sm font-medium">Pillow</p>
                      <p className="text-xs text-muted-foreground">Image Processing</p>
                    </div>
                    <Badge variant="outline">v10.1.0</Badge>
                  </div>
                </div>
              </div>

              <Separator />

              {/* System Resources */}
              <div>
                <h4 className="text-sm font-semibold mb-3">System Resources</h4>
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm">CPU Usage</span>
                      <span className="text-sm font-medium">34%</span>
                    </div>
                    <div className="flex-1 rounded-full bg-secondary">
                      <div className="h-2 rounded-full bg-accent" style={{ width: "34%" }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm">Memory Usage</span>
                      <span className="text-sm font-medium">2.8 GB / 8 GB</span>
                    </div>
                    <div className="flex-1 rounded-full bg-secondary">
                      <div className="h-2 rounded-full bg-accent" style={{ width: "35%" }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm">GPU Usage</span>
                      <span className="text-sm font-medium">18%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-secondary">
                      <div className="h-2 rounded-full bg-accent" style={{ width: "18%" }} />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* API Config Tab */}
        <TabsContent value="api" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                API Configuration
              </CardTitle>
              <CardDescription>Configure backend API endpoints and settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="api-url">Backend API URL</Label>
                <Input id="api-url" placeholder="http://localhost:5000" defaultValue="http://localhost:5000" />
                <p className="text-xs text-muted-foreground">Flask backend server endpoint</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="single-endpoint">Single Prediction Endpoint</Label>
                <Input id="single-endpoint" placeholder="/api/predict/single" defaultValue="/api/predict/single" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="multi-endpoint">Multi-Seed Detection Endpoint</Label>
                <Input id="multi-endpoint" placeholder="/api/predict/multi" defaultValue="/api/predict/multi" />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="timeout">Request Timeout (seconds)</Label>
                <Input id="timeout" type="number" placeholder="30" defaultValue="30" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="max-size">Max Image Size (MB)</Label>
                <Input id="max-size" type="number" placeholder="10" defaultValue="10" />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>API Status</Label>
                  <p className="text-xs text-muted-foreground">Current connection status</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                  <span className="text-sm font-medium">Connected</span>
                </div>
              </div>

              <Button onClick={handleSaveSettings} className="w-full">
                Save API Configuration
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings2 className="h-5 w-5" />
                Application Preferences
              </CardTitle>
              <CardDescription>Customize your application experience</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Auto-save */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-muted-foreground" />
                    <Label>Auto-save to History</Label>
                  </div>
                  <p className="text-xs text-muted-foreground">Automatically save predictions to history</p>
                </div>
                <Switch checked={settings.autoSave} onCheckedChange={(checked) => updateSettings({ autoSave: checked })} />
              </div>

              <Separator />

              {/* Dark Mode */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Palette className="h-4 w-4 text-muted-foreground" />
                    <Label>Dark Mode</Label>
                  </div>
                  <p className="text-xs text-muted-foreground">Switch to dark theme</p>
                </div>
                {mounted && (
                  <Switch 
                    checked={theme === "dark"} 
                    onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")} 
                  />
                )}
              </div>

              <Separator />

              {/* Font Size */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <Code className="h-4 w-4 text-muted-foreground" />
                  <Label>Font Size</Label>
                </div>
                <Select value={settings.fontSize} onValueChange={(value: any) => updateSettings({ fontSize: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select font size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">
                      <div className="flex items-center gap-2">
                        <span className="text-xs">Small (12px)</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="medium">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">Medium (14px)</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="large">
                      <div className="flex items-center gap-2">
                        <span className="text-base">Large (16px)</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="extra-large">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">Extra Large (18px)</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Adjust the base font size for the entire application</p>
              </div>

              <Separator />

              {/* Color Accent */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <Palette className="h-4 w-4 text-muted-foreground" />
                  <Label>Accent Color</Label>
                </div>
                <Select value={settings.accentColor} onValueChange={(value: any) => updateSettings({ accentColor: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select accent color" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="red">
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 rounded-full bg-red-500" />
                        <span>Red</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="blue">
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 rounded-full bg-blue-500" />
                        <span>Blue</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="yellow">
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 rounded-full bg-yellow-500" />
                        <span>Yellow</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="green">
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 rounded-full bg-green-500" />
                        <span>Green</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Choose the primary accent color for the application</p>
              </div>

              <Separator />

              {/* Confidence Threshold */}
              <div className="space-y-2">
                <Label htmlFor="confidence">Minimum Confidence Threshold (%)</Label>
                <Input id="confidence" type="number" placeholder="80" defaultValue="80" min="0" max="100" />
                <p className="text-xs text-muted-foreground">
                  Predictions below this threshold will be flagged for review
                </p>
              </div>
            </CardContent>
          </Card>

          {/* About */}
          <Card>
            <CardHeader>
              <CardTitle>About TOMVTO</CardTitle>
              <CardDescription>Application information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Version</span>
                <span className="text-sm font-medium">1.0.0</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Last Updated</span>
                <span className="text-sm font-medium">December 2025</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">License</span>
                <span className="text-sm font-medium">Undergraduate Thesis</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
