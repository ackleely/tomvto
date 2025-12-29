import { type NextRequest, NextResponse } from "next/server"

export async function GET() {
  try {
    // Call the Python ML service
    const PYTHON_SERVICE_URL = process.env.PYTHON_ML_SERVICE_URL || "http://localhost:5000"

    try {
      const response = await fetch(`${PYTHON_SERVICE_URL}/model-info`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`ML service returned ${response.status}`)
      }

      const modelInfo = await response.json()
      return NextResponse.json(modelInfo)

    } catch (serviceError) {
      console.error("[model-info] Failed to connect to ML service:", serviceError)

      // Fallback to mock data if service is unavailable
      console.log("[model-info] Falling back to mock model info due to service unavailability")
      console.log("Falling back to mock model info due to service unavailability")
      return generateMockModelInfo()
    }

  } catch (error) {
    console.error("[model-info] Error:", error)
    return NextResponse.json({ error: "Failed to get model information" }, { status: 500 })
  }
}

// Fallback mock model info function (for development/testing)
function generateMockModelInfo() {
  return NextResponse.json({
    model_version: "CNN-v2.1.0",
    input_shape: [null, 128, 128, 3],
    image_size: {
      width: 128,
      height: 128
    },
    channels: 3,
    output_classes: 2,
    model_file: "references/saved_custom_cnn_two_model.keras",
    framework: "TensorFlow",
    timestamp: new Date().toISOString()
  })
}
