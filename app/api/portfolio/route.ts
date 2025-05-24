// File: /app/api/portfolio/route.ts
import { NextRequest, NextResponse } from "next/server";
import { JsonRpcProvider, Contract, formatUnits } from "ethers";

// Define ERC-20 token addresses on BNB Testnet
const TOKENS = [
  {
    symbol: "BUSD",
    address: "0xaB1a4d4f1D656d2450692D237fdD6C7f9146e814", // BUSD (testnet)
    decimals: 18
  },
  {
    symbol: "WBNB",
    address: "0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd", // WBNB (testnet)
    decimals: 18
  },
  {
    symbol: "CAKE",
    address: "0xFa60D973F7642B748046464e165A65B7323b0DEE", // CAKE (testnet mock address)
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

    const provider = new JsonRpcProvider("https://bsc-testnet.publicnode.com");

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
      "WBNB": 420.69,
      "CAKE": 2.457
    };

    const tokenValues: Record<string, number> = {};
    let totalValue = 0;

    for (const [symbol, balance] of Object.entries(tokenBalances)) {
      if (symbol in tokenPrices) {
        const value = parseFloat(balance) * tokenPrices[symbol];
        tokenValues[symbol] = value;
        totalValue += value;
      }
    }

    // Calculate allocation percentages with higher precision
    const allocation = Object.entries(tokenValues).map(([symbol, value]) => {
      const percentage = totalValue > 0 ? (value / totalValue) * 100 : 0;
      return {
        symbol,
        value: parseFloat(parseFloat(tokenBalances[symbol]).toFixed(8)),
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
