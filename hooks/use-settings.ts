"use client"

import { createContext, useContext, useEffect, useState } from "react"

export type AccentColor = "red" | "blue" | "yellow" | "green"
export type FontSize = "small" | "medium" | "large" | "extra-large"

interface Settings {
  autoSave: boolean
  accentColor: AccentColor
  fontSize: FontSize
}

interface SettingsContextType {
  settings: Settings
  updateSettings: (settings: Partial<Settings>) => void
}

const defaultSettings: Settings = {
  autoSave: true,
  accentColor: "red",
  fontSize: "medium",
}

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(defaultSettings)

  useEffect(() => {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem("app-settings")
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings))
      } catch (error) {
        console.error("Failed to load settings:", error)
      }
    }
  }, [])

  const updateSettings = (newSettings: Partial<Settings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings }
      localStorage.setItem("app-settings", JSON.stringify(updated))
      
      // Immediately apply accent color to DOM
      if (newSettings.accentColor) {
        document.documentElement.setAttribute("data-accent", newSettings.accentColor)
      }
      
      // Immediately apply font size to DOM
      if (newSettings.fontSize) {
        document.documentElement.setAttribute("data-font-size", newSettings.fontSize)
      }
      
      return updated
    })
  }

  return { settings, updateSettings }
}
