"use client"

import { useEffect, useState } from "react"
import { useSettings } from "@/hooks/use-settings"

export function AccentProvider() {
  const { settings } = useSettings()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    const root = document.documentElement
    root.setAttribute("data-accent", settings.accentColor)
    root.setAttribute("data-font-size", settings.fontSize)
  }, [settings.accentColor, settings.fontSize, mounted])

  return null
}
