import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { image } = body

    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 })
    }

    // Simulate processing time for object detection
    await new Promise((resolve) => setTimeout(resolve, 2500))

    // Mock detection results
    // In production, this would call your Flask/TensorFlow/OpenCV backend
    // Example: const response = await fetch('http://your-flask-api/detect', { ... })

    const numSeeds = Math.floor(Math.random() * 8) + 8 // 8-15 seeds
    const detections = Array.from({ length: numSeeds }, (_, i) => {
      const confidence = Math.random() * 20 + 80 // 80-100%
      return {
        id: i + 1,
        bbox: {
          x: Math.random() * 70 + 5, // 5-75%
          y: Math.random() * 70 + 5, // 5-75%
          width: Math.random() * 8 + 4, // 4-12%
          height: Math.random() * 8 + 4, // 4-12%
        },
        prediction: confidence > 85 ? ("viable" as const) : ("non-viable" as const),
        confidence: Number.parseFloat(confidence.toFixed(1)),
      }
    })

    const viableSeeds = detections.filter((d) => d.prediction === "viable").length
    const nonViableSeeds = detections.filter((d) => d.prediction === "non-viable").length

    const result = {
      totalSeeds: numSeeds,
      viableSeeds,
      nonViableSeeds,
      detections,
      processingTime: Math.floor(Math.random() * 1000 + 1500), // 1500-2500ms
      modelVersion: "YOLO-v8.2.0",
      imageSize: {
        width: 1920,
        height: 1080,
      },
      timestamp: new Date().toISOString(),
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("[v0] Multi-seed detection error:", error)
    return NextResponse.json({ error: "Detection failed" }, { status: 500 })
  }
}
