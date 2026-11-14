// src/components/ui/sonner.tsx
"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

export function Toaster({ ...props }: ToasterProps) {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-white dark:group-[.toaster]:bg-slate-900 group-[.toaster]:text-slate-900 dark:group-[.toaster]:text-slate-100 group-[.toaster]:border-slate-200 dark:group-[.toaster]:border-slate-800 group-[.toaster]:shadow-xl group-[.toaster]:rounded-2xl font-sans",
          description: "group-[.toast]:text-slate-500 dark:group-[.toast]:text-slate-400 text-xs",
          actionButton:
            "group-[.toast]:bg-blue-600 group-[.toast]:text-white font-bold rounded-xl text-xs px-3 py-1.5",
          cancelButton:
            "group-[.toast]:bg-slate-100 dark:group-[.toast]:bg-slate-800 group-[.toast]:text-slate-600 dark:group-[.toast]:text-slate-300 rounded-xl text-xs px-3 py-1.5",
        },
      }}
      {...props}
    />
  )
}
