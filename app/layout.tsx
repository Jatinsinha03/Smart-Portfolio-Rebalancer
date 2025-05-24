import "@/app/globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { SessionProvider } from "../components/SessionProvider"

export const metadata = {
  title: "Smart Portfolio Rebalancer - Dashboard",
  description: "AI-Powered Crypto Portfolio Management on BNB Smart Chain",
  generator: 'v0.dev'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <SessionProvider>
          <ThemeProvider attribute="class" defaultTheme="dark">
            {children}
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
