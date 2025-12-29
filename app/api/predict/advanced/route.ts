import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { image } = body

    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 })
    }

    // Call the Python ML service advanced endpoint
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
        console.error("[advanced] ML service error:", response.status, errorData)
        return NextResponse.json({ error: "Advanced prediction failed" }, { status: 500 })
      }

      const result = await response.json()
      return NextResponse.json(result)

    } catch (serviceError) {
      console.error("[advanced] Failed to connect to ML service:", serviceError)
      return NextResponse.json({ error: "ML service unavailable" }, { status: 503 })
    }

  } catch (error) {
    console.error("[advanced] Advanced prediction error:", error)
    return NextResponse.json({ error: "Advanced prediction failed" }, { status: 500 })
  }
}
