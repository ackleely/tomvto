import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { image } = body

    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 })
    }

    // Call the Python ML service
    const PYTHON_SERVICE_URL = process.env.PYTHON_ML_SERVICE_URL || "http://localhost:5000"

    try {
      const response = await fetch(`${PYTHON_SERVICE_URL}/predict/advanced`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ image }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error("[v0] ML service error:", response.status, errorData)

        // Fallback to mock data if ML service fails
        console.log("[v0] Falling back to mock prediction due to service error")
        return generateMockPrediction()
      }

      const result = await response.json()
      return NextResponse.json(result)

    } catch (serviceError) {
      console.error("[v0] Failed to connect to ML service:", serviceError)

      // Fallback to mock data if service is unavailable
      console.log("[v0] Falling back to mock prediction due to service unavailability")
      return generateMockPrediction()
    }

  } catch (error) {
    console.error("[v0] Single prediction error:", error)
    return NextResponse.json({ error: "Prediction failed" }, { status: 500 })
  }
}

// Fallback mock prediction function (for development/testing)
function generateMockPrediction() {
  // Simulate processing time
  const processingTime = Math.floor(Math.random() * 500 + 200) // 200-700ms

  const mockConfidence = Math.random() * 20 + 80 // 80-100%
  const mockPrediction = mockConfidence > 85 ? "viable" : "non-viable"

  const result = {
    prediction: mockPrediction,
    confidence: Number.parseFloat(mockConfidence.toFixed(1)),
    processingTime: processingTime,
    modelVersion: "CNN-Fully-Trained-v1.0",
    imageSize: {
      width: 128,
      height: 128,
    },
    timestamp: new Date().toISOString(),
    note: "Mock prediction - ML service unavailable"
  }

  return NextResponse.json(result)
}
