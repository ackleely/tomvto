"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, CheckCircle2, XCircle, TrendingUp, Loader2, BarChart3, Clock, Zap } from "lucide-react"
import { useState, useEffect } from "react"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Area, AreaChart, Bar, BarChart, Line, LineChart, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from "recharts"

interface Stats {
  totalPredictions: number
  viableCount: number
  nonViableCount: number
  viabilityRate: number
  avgConfidence: number
  avgProcessingTime: number
  recentPredictions: Array<{
    id: string
    result: string
    confidence: number
    timestamp: string
  }>
  lastUpdated: string
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [chartColors, setChartColors] = useState({
    primary: '#000000',
    destructive: '#000000'
  })

  useEffect(() => {
    // Get actual CSS variable values
    const updateColors = () => {
      const root = document.documentElement
      const style = getComputedStyle(root)
      
      // Get the raw oklch values and convert to rgb for Recharts
      const primaryRaw = style.getPropertyValue('--primary').trim()
      const destructiveRaw = style.getPropertyValue('--destructive').trim()
      
      // Create a temporary element to get computed color
      const temp = document.createElement('div')
      temp.style.color = `oklch(${primaryRaw})`
      document.body.appendChild(temp)
      const primaryRgb = getComputedStyle(temp).color
      document.body.removeChild(temp)
      
      const temp2 = document.createElement('div')
      temp2.style.color = `oklch(${destructiveRaw})`
      document.body.appendChild(temp2)
      const destructiveRgb = getComputedStyle(temp2).color
      document.body.removeChild(temp2)
      
      setChartColors({
        primary: primaryRgb,
        destructive: destructiveRgb
      })
    }
    
    updateColors()
    
    // Listen for attribute changes to update colors when accent changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'data-accent') {
          setTimeout(updateColors, 50) // Small delay to ensure CSS has updated
        }
      })
    })
    
    observer.observe(document.documentElement, { attributes: true })
    
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const loadStats = async () => {
      try {
        const response = await fetch("/api/statistics")
        if (!response.ok) {
          throw new Error("Failed to load stats")
        }
        const data = await response.json()
        setStats(data)
      } catch (error) {
        console.error("Failed to load statistics:", error)
      } finally {
        setIsLoading(false)
      }
    }
    
    // Load stats immediately
    loadStats()
    
    // Set up auto-refresh every 10 seconds for realtime updates
    const intervalId = setInterval(loadStats, 10000)
    
    // Cleanup interval on component unmount
    return () => clearInterval(intervalId)
  }, [])

  const formatTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = diffMs / (1000 * 60 * 60)
    const diffMinutes = diffMs / (1000 * 60)

    if (diffMinutes < 60) {
      return `${Math.round(diffMinutes)}m ago`
    } else {
      return `${Math.round(diffHours)}h ago`
    }
  }

  // Process data for charts
  const getTimeSeriesData = () => {
    if (!stats?.recentPredictions) return []
    
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (6 - i))
      return {
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        viable: 0,
        nonViable: 0,
        total: 0
      }
    })

    stats.recentPredictions.forEach(pred => {
      const predDate = new Date(pred.timestamp)
      const dayIndex = Math.floor((Date.now() - predDate.getTime()) / (1000 * 60 * 60 * 24))
      if (dayIndex >= 0 && dayIndex < 7) {
        const dataIndex = 6 - dayIndex
        if (pred.result === 'viable') {
          last7Days[dataIndex].viable++
        } else {
          last7Days[dataIndex].nonViable++
        }
        last7Days[dataIndex].total++
      }
    })

    return last7Days
  }

  const getConfidenceDistribution = () => {
    if (!stats?.recentPredictions) return []
    
    const ranges = [
      { range: '0-50%', min: 0, max: 50, count: 0 },
      { range: '50-70%', min: 50, max: 70, count: 0 },
      { range: '70-85%', min: 70, max: 85, count: 0 },
      { range: '85-95%', min: 85, max: 95, count: 0 },
      { range: '95-100%', min: 95, max: 100, count: 0 },
    ]

    stats.recentPredictions.forEach(pred => {
      const confidence = pred.confidence
      const rangeItem = ranges.find(r => confidence >= r.min && confidence < r.max) || ranges[ranges.length - 1]
      rangeItem.count++
    })

    return ranges
  }

  const timeSeriesData = getTimeSeriesData()
  const confidenceData = getConfidenceDistribution()

  const chartConfig = {
    viable: {
      label: "Viable",
      color: "hsl(var(--primary))",
    },
    nonViable: {
      label: "Non-Viable",
      color: "hsl(var(--destructive))",
    },
    total: {
      label: "Total",
      color: "hsl(var(--accent))",
    },
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h2>
          <p className="text-muted-foreground">Overview of your seed viability predictions and system performance</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h2>
        <p className="text-muted-foreground">Overview of your seed viability predictions and system performance</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Predictions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalPredictions || 0}</div>
            <p className="text-xs text-muted-foreground">Ready for analysis</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Viable Seeds</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.viableCount || 0}</div>
            <p className="text-xs text-muted-foreground">{stats?.viabilityRate || 0}% viability rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Non-Viable Seeds</CardTitle>
            <XCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.nonViableCount || 0}</div>
            <p className="text-xs text-muted-foreground">{stats ? 100 - stats.viabilityRate : 0}% rejection rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Confidence</CardTitle>
            <TrendingUp className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.avgConfidence || 0}%</div>
            <p className="text-xs text-muted-foreground">Model accuracy</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Predictions</CardTitle>
            <CardDescription>Latest seed viability assessments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.recentPredictions?.length ? stats.recentPredictions.map((prediction) => (
                <div key={prediction.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-2 w-2 rounded-full ${
                        prediction.result === "viable"
                          ? "bg-primary"
                          : "bg-destructive"
                      }`}
                    />
                    <div>
                      <p className="text-sm font-medium">Single Prediction</p>
                      <p className="text-xs text-muted-foreground">{formatTimeAgo(prediction.timestamp)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium capitalize">{prediction.result}</p>
                    <p className="text-xs text-muted-foreground">{prediction.confidence}%</p>
                  </div>
                </div>
              )) : (
                <p className="text-sm text-muted-foreground text-center py-4">No predictions yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Model Performance</CardTitle>
            <CardDescription>Current model accuracy metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">CNN and YOLO Model Accuracy</span>
                  <span className="text-sm text-muted-foreground">{stats?.avgConfidence || 0}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-secondary">
                  <div className="h-2 rounded-full bg-primary" style={{ width: `${stats?.avgConfidence || 0}%` }} />
                </div>
              </div>

              <div className="pt-4 border-t border-border">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Viability Rate</p>
                    <p className="text-lg font-semibold">{stats?.viabilityRate || 0}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Avg Confidence</p>
                    <p className="text-lg font-semibold">{stats?.avgConfidence || 0}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total Predictions</p>
                    <p className="text-lg font-semibold">{stats?.totalPredictions || 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Avg Inference Time</p>
                    <p className="text-lg font-semibold">{stats?.avgProcessingTime ? `${(stats.avgProcessingTime / 1000).toFixed(1)}s` : "0.0s"}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Predictions Over Time */}
        <Card>
          <CardHeader>
            <CardTitle>Predictions Over Time</CardTitle>
            <CardDescription>Last 7 days prediction activity</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <AreaChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="date" 
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis 
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area 
                  type="monotone" 
                  dataKey="viable" 
                  stackId="1"
                  stroke={chartColors.primary}
                  fill={chartColors.primary}
                  fillOpacity={0.3}
                  name="Viable"
                />
                <Area 
                  type="monotone" 
                  dataKey="nonViable" 
                  stackId="1"
                  stroke={chartColors.destructive}
                  fill={chartColors.destructive}
                  fillOpacity={0.3}
                  name="Non-Viable"
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Confidence Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Confidence Distribution</CardTitle>
            <CardDescription>Prediction confidence levels breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <BarChart data={confidenceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="range" 
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis 
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar 
                  dataKey="count" 
                  fill={chartColors.primary}
                  radius={[4, 4, 0, 0]}
                  name="Predictions"
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Metrics</CardTitle>
          <CardDescription>System performance and processing statistics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center gap-4 p-4 rounded-lg border">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Avg Processing Speed</p>
                <p className="text-2xl font-bold">{stats?.avgProcessingTime || 0}ms</p>
                <p className="text-xs text-muted-foreground">Per prediction</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-lg border">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Success Rate</p>
                <p className="text-2xl font-bold">{stats?.avgConfidence || 0}%</p>
                <p className="text-xs text-muted-foreground">Model confidence</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-lg border">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Total Runtime</p>
                <p className="text-2xl font-bold">{stats?.totalPredictions ? ((stats.avgProcessingTime * stats.totalPredictions) / 1000).toFixed(1) : 0}s</p>
                <p className="text-xs text-muted-foreground">Cumulative</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
