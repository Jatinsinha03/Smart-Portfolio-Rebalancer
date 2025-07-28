// File: /app/api/portfolio/route.ts
import { NextRequest, NextResponse } from "next/server";
import { JsonRpcProvider, Contract, formatUnits } from "ethers";

// Define ERC-20 token addresses on BNB Testnet
const TOKENS = [
  {
    symbol: "BUSD",
    address: "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56", // BUSD (mainnet)
    decimals: 18
  },
  {
    symbol: "WBNB",
    address: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c", // WBNB (mainnet)
    decimals: 18
  },
  {
    symbol: "CAKE",
    address: "0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82", // CAKE (mainnet address)
    decimals: 18
  },
];

const erc20Abi = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)"
];

export async function POST(req: NextRequest) {
  try {
    const { walletAddress } = await req.json();

    if (!walletAddress) {
      return NextResponse.json({ error: "Missing walletAddress" }, { status: 400 });
    }

    const provider = new JsonRpcProvider("https://bsc-dataseed.binance.org/");

    const tokenBalances: Record<string, string> = {};

    for (const token of TOKENS) {
      try {
        const contract = new Contract(token.address, erc20Abi, provider);
        const balance = await contract.balanceOf(walletAddress);
        tokenBalances[token.symbol] = formatUnits(balance, token.decimals);
      } catch (error) {
        console.error(`Error fetching ${token.symbol} balance:`, error);
        tokenBalances[token.symbol] = "0";
      }
    }

    // Use more precise token prices
    const tokenPrices: Record<string, number> = {
      "BUSD": 1.0,
      "WBNB": 842,
      "CAKE": 3.05
    };

    const tokenValues: Record<string, number> = {};
    let totalValue = 0;

    for (const [symbol, balance] of Object.entries(tokenBalances)) {
      if (symbol in tokenPrices) {
        const value = parseFloat(balance) * tokenPrices[symbol];
        tokenValues[symbol] = value;
        totalValue += value;
        console.log(`${symbol}: ${Number(balance).toFixed(5)} * $${tokenPrices[symbol]} = $${value.toFixed(6)}`);

      }
    }
    

    // Calculate allocation percentages with higher precision
    const allocation = Object.entries(tokenValues).map(([symbol, value]) => {
      const percentage = totalValue > 0 ? (value / totalValue) * 100 : 0;
      return {
        symbol,
        value: parseFloat(Number(tokenBalances[symbol]).toFixed(5)),  // 🔁 Changed to 5 decimals
        percentage: parseFloat(percentage.toFixed(6)),
        usdValue: parseFloat(value.toFixed(6))
      };
    });
    

    return NextResponse.json({
      address: walletAddress,
      balances: tokenBalances,
      allocation,
      totalValue: parseFloat(totalValue.toFixed(6))
    });
  } catch (error) {
    console.error("Portfolio fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch portfolio" }, { status: 500 });
  }
}
