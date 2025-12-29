import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { image, confidence } = body

    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 })
    }

    // Call the Python ML service multi-seed detection endpoint
    const PYTHON_SERVICE_URL = process.env.PYTHON_ML_SERVICE_URL || "http://localhost:5000"

    try {
      const response = await fetch(`${PYTHON_SERVICE_URL}/detect/multi`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          image,
          confidence: confidence || 0.25 
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error("[multi-detect] ML service error:", response.status, errorData)
        return NextResponse.json({ 
          error: errorData.error || "Multi-seed detection failed",
          details: errorData.details 
        }, { status: 500 })
      }

      const result = await response.json()
      return NextResponse.json(result)

    } catch (serviceError) {
      console.error("[multi-detect] Failed to connect to ML service:", serviceError)
      return NextResponse.json({ error: "ML service unavailable" }, { status: 503 })
    }

  } catch (error) {
    console.error("[multi-detect] Multi-seed detection error:", error)
    return NextResponse.json({ error: "Multi-seed detection failed" }, { status: 500 })
  }
}
