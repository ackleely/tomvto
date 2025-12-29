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
  image?: string // base64 image if we want to store it
  attentionMap?: string
  featureAnalysis?: any
  detailedAnalysis?: any
  detectionType?: "single" | "multi" // Track if from single or multi-seed detection
  seedNumber?: number // For multi-seed detection, track which seed number
}

export async function GET() {
  try {
    const fileContents = await fs.readFile(PREDICTIONS_FILE, "utf8")
    const predictions = JSON.parse(fileContents) as Prediction[]
    return NextResponse.json(predictions)
  } catch (error) {
    console.error("[predictions] Load error:", error)
    return NextResponse.json({ error: "Failed to load predictions" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      prediction,
      confidence,
      processingTime,
      modelVersion,
      imageSize,
      timestamp,
      image,
      attentionMap,
      featureAnalysis,
      detailedAnalysis,
      detectionType,
      seedNumber
    } = body

    if (!prediction || typeof confidence !== "number" || !timestamp) {
      return NextResponse.json({ error: "Incomplete prediction data" }, { status: 400 })
    }

    // Read current predictions
    const fileContents = await fs.readFile(PREDICTIONS_FILE, "utf8")
    const predictions = JSON.parse(fileContents) as Prediction[]

    // Create new prediction with ID
    const newPrediction: Prediction = {
      id: Date.now().toString(), // Simple ID based on timestamp
      prediction,
      confidence,
      processingTime,
      modelVersion,
      imageSize,
      timestamp,
      image, // Include image if provided (for display in history)
      attentionMap,
      featureAnalysis,
      detailedAnalysis,
      detectionType: detectionType || "single",
      seedNumber
    }

    // Add to beginning of array (most recent first)
    predictions.unshift(newPrediction)

    // Keep only last 100 predictions to limit file size
    if (predictions.length > 100) {
      predictions.splice(100)
    }

    // Write back to file
    await fs.writeFile(PREDICTIONS_FILE, JSON.stringify(predictions, null, 2), "utf8")

    return NextResponse.json({ success: true, id: newPrediction.id })

  } catch (error) {
    console.error("[predictions] Save error:", error)
    return NextResponse.json({ error: "Failed to save prediction" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Prediction ID is required" }, { status: 400 })
    }

    // Read current predictions
    const fileContents = await fs.readFile(PREDICTIONS_FILE, "utf8")
    const predictions = JSON.parse(fileContents) as Prediction[]

    // Filter out the prediction with the given ID
    const filteredPredictions = predictions.filter((p) => p.id !== id)

    if (filteredPredictions.length === predictions.length) {
      return NextResponse.json({ error: "Prediction not found" }, { status: 404 })
    }

    // Write back to file
    await fs.writeFile(PREDICTIONS_FILE, JSON.stringify(filteredPredictions, null, 2), "utf8")

    return NextResponse.json({ success: true, id })

  } catch (error) {
    console.error("[predictions] Delete error:", error)
    return NextResponse.json({ error: "Failed to delete prediction" }, { status: 500 })
  }
}
