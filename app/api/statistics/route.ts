import { type NextRequest, NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"

const PREDICTIONS_FILE = path.join(process.cwd(), "data", "predictions.json")

interface Prediction {
  id: string
  prediction: "viable" | "non-viable"
  confidence: number
  processingTime: number
  modelVersion: string
  imageSize: { width: number; height: number }
  timestamp: string
  image?: string
}

export async function GET() {
  try {
    const fileContents = await fs.readFile(PREDICTIONS_FILE, "utf8")
    const predictions: Prediction[] = JSON.parse(fileContents)

    // Calculate statistics
    const totalPredictions = predictions.length
    const viableCount = predictions.filter(p => p.prediction === "viable").length
    const nonViableCount = predictions.filter(p => p.prediction === "non-viable").length
    const viabilityRate = totalPredictions > 0 ? (viableCount / totalPredictions) * 100 : 0
    const avgConfidence = totalPredictions > 0
      ? predictions.reduce((sum, p) => sum + p.confidence, 0) / totalPredictions
      : 0
    const avgProcessingTime = totalPredictions > 0
      ? predictions.reduce((sum, p) => sum + p.processingTime, 0) / totalPredictions
      : 0

    const stats = {
      totalPredictions,
      viableCount,
      nonViableCount,
      viabilityRate: Math.round(viabilityRate * 10) / 10, // 1 decimal place
      avgConfidence: Math.round(avgConfidence * 10) / 10,
      avgProcessingTime: Math.round(avgProcessingTime * 10) / 10, // in ms
      recentPredictions: predictions.slice(0, 4).map(p => ({
        id: p.id,
        result: p.prediction,
        confidence: p.confidence,
        timestamp: p.timestamp,
      })),
      lastUpdated: new Date().toISOString()
    }

    return NextResponse.json(stats)

  } catch (error) {
    console.error("[statistics] Error:", error)
    // Return zeros if file doesn't exist or error
    return NextResponse.json({
      totalPredictions: 0,
      viableCount: 0,
      nonViableCount: 0,
      viabilityRate: 0,
      avgConfidence: 0,
      avgProcessingTime: 0,
      recentPredictions: [],
      lastUpdated: new Date().toISOString()
    })
  }
}
