"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Wallet, TrendingUp, BarChart3, RefreshCw, AlertCircle, CheckCircle2, LogOut } from "lucide-react"
import Link from "next/link"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"

// Token color scheme
const TOKEN_COLORS = {
  "BUSD": "#F0B90B",
  "WBNB": "#F3BA2F",
  "default": "#8B5CF6"
};

// Strategy definitions
const strategies = [
  {
    id: "growth",
    name: "Growth",
    description: "Higher risk, higher potential returns",
    allocation: { WBNB: 70, BUSD: 30 },
  },
  {
    id: "balanced",
    name: "Balanced",
    description: "Moderate risk and returns",
    allocation: { WBNB: 50, BUSD: 50 },
  },
  {
    id: "conservative",
    name: "Conservative",
    description: "Lower risk, stable returns",
    allocation: { WBNB: 30, BUSD: 70 },
  },
]

// Custom circular progress component
function CircularProgress({ 
  value, 
  color, 
  size = 120, 
  strokeWidth = 8, 
  label, 
  sublabel 
}: { 
  value: number; 
  color: string; 
  size?: number; 
  strokeWidth?: number; 
  label: string; 
  sublabel: string; 
}) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const strokeDashoffset = circumference - (value / 100) * circumference

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="rotate-[-90deg]">
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255, 255, 255, 0.1)"
            strokeWidth={strokeWidth}
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold">{value}%</span>
        </div>
      </div>
      <div className="mt-2 text-center">
        <div className="font-medium text-lg">{label}</div>
        <div className="text-sm text-muted-foreground">{sublabel}</div>
      </div>
    </div>
  )
}

// Token allocation type
interface TokenAllocation {
  symbol: string;
  value: number;
  percentage: number;
  usdValue: number;
  color?: string;
}

// Portfolio data type
interface PortfolioData {
  address: string;
  balances: Record<string, string>;
  allocation: TokenAllocation[];
  totalValue: number;
}

export default function Dashboard() {
  const [selectedStrategy, setSelectedStrategy] = useState("balanced")
  const [isRebalancing, setIsRebalancing] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  const { data: session, status } = useSession()
  const router = useRouter()

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login")
    }
  }, [status, router])

  // Fetch portfolio data when session is available
  useEffect(() => {
    const fetchPortfolio = async () => {
      if (status === "authenticated" && session?.user?.walletAddress) {
        try {
          setIsLoading(true);
          setError(null);
          
          const response = await fetch("/api/portfolio", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              walletAddress: session.user.walletAddress,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Failed to fetch portfolio data");
          }

          const data = await response.json();
          
          // Add colors to the allocation data
          const allocationsWithColors = data.allocation.map((item: TokenAllocation) => ({
            ...item,
            color: TOKEN_COLORS[item.symbol as keyof typeof TOKEN_COLORS] || TOKEN_COLORS.default
          }));
          
          setPortfolio({
            ...data,
            allocation: allocationsWithColors
          });
        } catch (err) {
          console.error("Error fetching portfolio:", err);
          setError(err instanceof Error ? err.message : "Failed to fetch portfolio data");
        } finally {
          setIsLoading(false);
        }
      } else if (status === "authenticated" && !session?.user?.walletAddress) {
        setIsLoading(false);
        setError("No wallet connected. Please connect your wallet to view your portfolio.");
      }
    };

    fetchPortfolio();
  }, [session, status]);

  const handleRebalance = () => {
    setIsRebalancing(true)
    // Simulate rebalancing process
    setTimeout(() => {
      setIsRebalancing(false)
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 3000)
    }, 2000)
  }

  // Format wallet address for display
  const formatWalletAddress = (address: string | null | undefined) => {
    if (!address) return null
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white flex items-center justify-center">
        <div className="flex flex-col items-center">
          <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mb-4" />
          <p>Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-xl flex items-center justify-center mr-3">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
                Smart Portfolio Rebalancer
              </h1>
              <p className="text-sm text-gray-400">Dashboard</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {status === "authenticated" ? (
              <>
                <div className="hidden sm:flex items-center">
                  <span className="text-gray-400 mr-2 text-sm">{session.user.email}</span>
                </div>
                {session.user.walletAddress && (
                  <>
                    <Badge variant="outline" className="px-3 py-1 border-cyan-500/30 bg-cyan-500/10">
                      <span className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></span>
                      Wallet Connected
                    </Badge>
                    <div className="bg-gray-800 rounded-lg px-3 py-1 text-sm border border-gray-700">
                      {formatWalletAddress(session.user.walletAddress)}
                    </div>
                  </>
                )}
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="border-gray-700 text-white hover:bg-gray-800 flex items-center gap-2"
                  onClick={() => signOut({ callbackUrl: '/' })}
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Logout</span>
                </Button>
              </>
            ) : (
              <>
                <Link href="/auth/login">
                  <Button variant="outline" size="sm" className="border-gray-700 text-white hover:bg-gray-800">
                    Login
                  </Button>
                </Link>
                <Link href="/auth/signup">
                  <Button size="sm" className="bg-gradient-to-r from-purple-500 to-cyan-600 hover:from-purple-600 hover:to-cyan-700 border-0">
                    Sign Up
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Portfolio Overview Section */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold">Portfolio Overview</h2>
          <div className="grid grid-cols-1 gap-6">
            <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Portfolio Value</CardTitle>
                <CardDescription>Total assets on BNB Smart Chain</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {isLoading ? (
                  <div className="flex items-center space-x-2 animate-pulse">
                    <div className="h-8 w-32 bg-gray-700 rounded"></div>
                  </div>
                ) : error ? (
                  <div className="text-red-400 flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4" />
                    <span>{error}</span>
                  </div>
                ) : portfolio ? (
                  <>
                    <div className="text-3xl font-bold">
                      ${portfolio.totalValue.toLocaleString(undefined, { maximumFractionDigits: 3 })}
                    </div>
                    <div className="flex items-center text-green-500">
                      <TrendingUp className="w-4 h-4 mr-1" />
                      <span>Portfolio Balance</span>
                    </div>
                  </>
                ) : (
                  <div className="text-amber-400 flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4" />
                    <span>Connect wallet to view portfolio</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Allocation Analysis Section */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold">Allocation Analysis</h2>
          <div className="grid grid-cols-1 gap-6">
            {/* Current Allocation */}
            <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Current Allocation</CardTitle>
                <CardDescription>Your current token distribution</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {isLoading ? (
                  <div className="flex justify-center">
                    <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
                  </div>
                ) : error ? (
                  <div className="bg-gray-700/30 p-4 rounded-lg border border-gray-600 text-center">
                    <AlertCircle className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                    <p className="text-amber-300">{error}</p>
                  </div>
                ) : portfolio && portfolio.allocation.length > 0 ? (
                  <>
                    <div className="flex justify-center">
                      <div className="w-48 h-48">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={portfolio.allocation}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={2}
                              dataKey="percentage"
                            >
                              {portfolio.allocation.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {portfolio.allocation.map((token) => (
                        <div key={token.symbol} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div 
                                className="w-4 h-4 rounded-full mr-2" 
                                style={{ backgroundColor: token.color }}
                              ></div>
                              <span className="font-medium">{token.symbol}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="font-medium">{token.percentage.toFixed(3)}%</span>
                              <span className="text-sm text-gray-400">
                                ${token.usdValue.toFixed(3)}
                              </span>
                            </div>
                          </div>
                          <Progress value={token.percentage} className="h-2" />
                          <div className="text-xs text-gray-400 flex justify-between">
                            <span>Balance: {token.value.toFixed(6)} {token.symbol}</span>
                            <span>~${token.usdValue.toFixed(3)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="bg-gray-700/30 p-6 rounded-lg border border-gray-600 text-center">
                    <Wallet className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p>No tokens found in your wallet</p>
                    <p className="text-sm text-gray-400 mt-2">
                      Connect your wallet or add BUSD/WBNB tokens to your wallet
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Strategy and Rebalance Section */}
        <section className="space-y-6 pb-8">
          <h2 className="text-2xl font-bold">Strategy & Rebalancing</h2>
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Strategy Selection */}
            <Card className="xl:col-span-2 bg-gray-800/50 border-gray-700 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Investment Strategy</CardTitle>
                <CardDescription>Select your preferred risk profile</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Tabs defaultValue="balanced" onValueChange={setSelectedStrategy} className="w-full">
                  <TabsList className="grid grid-cols-3 w-full">
                    <TabsTrigger value="growth">Growth</TabsTrigger>
                    <TabsTrigger value="balanced">Balanced</TabsTrigger>
                    <TabsTrigger value="conservative">Conservative</TabsTrigger>
                  </TabsList>

                  {strategies.map((strategy) => (
                    <TabsContent key={strategy.id} value={strategy.id} className="mt-6">
                      <div className="bg-gray-700/30 rounded-lg p-6 border border-gray-700 space-y-6">
                        <div>
                          <h3 className="font-medium text-lg mb-2">{strategy.name} Strategy</h3>
                          <p className="text-gray-300">{strategy.description}</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          {Object.entries(strategy.allocation).map(([token, percentage]) => (
                            <div key={token} className="flex flex-col items-center">
                              <CircularProgress
                                value={percentage}
                                color={TOKEN_COLORS[token as keyof typeof TOKEN_COLORS] || TOKEN_COLORS.default}
                                label={token}
                                sublabel={`${percentage}%`}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>

            {/* Rebalance Action */}
            <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Rebalance Portfolio</CardTitle>
                <CardDescription>Optimize your assets with one click</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center space-y-6 py-8">
                {showSuccess ? (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex flex-col items-center text-center space-y-4"
                  >
                    <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
                      <CheckCircle2 className="w-8 h-8 text-green-500" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium mb-2">Rebalance Complete!</h3>
                      <p className="text-sm text-gray-300">
                        Your portfolio has been successfully rebalanced according to the {selectedStrategy} strategy.
                      </p>
                    </div>
                  </motion.div>
                ) : (
                  <>
                    <div className="w-24 h-24 rounded-full bg-gradient-to-r from-cyan-500/20 to-purple-500/20 flex items-center justify-center border-4 border-cyan-500/30">
                      <BarChart3 className="w-12 h-12 text-cyan-400" />
                    </div>
                    <div className="text-center space-y-4">
                      <p className="text-sm text-gray-300">
                        Rebalance your portfolio according to the{" "}
                        <span className="font-medium text-cyan-400">{selectedStrategy}</span> strategy.
                      </p>
                      <Button
                        size="lg"
                        onClick={handleRebalance}
                        disabled={isRebalancing || !portfolio || portfolio.allocation.length === 0}
                        className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 border-0 w-full"
                      >
                        {isRebalancing ? (
                          <>
                            <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                            Rebalancing...
                          </>
                        ) : (
                          "Rebalance Portfolio"
                        )}
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
              <CardFooter className="bg-gray-800/80 border-t border-gray-700">
                <div className="text-xs text-gray-400 text-center w-full">Estimated gas fee: 0.0012 BNB (~$0.50)</div>
              </CardFooter>
            </Card>
          </div>
        </section>
      </main>
    </div>
  )
}
