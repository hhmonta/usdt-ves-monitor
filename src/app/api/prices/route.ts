import { NextResponse } from "next/server";
import { db } from "@/lib/db";

interface ExchangeData {
  ask: number;
  totalAsk: number;
  bid: number;
  totalBid: number;
  time: number;
}

type CryptoYaResponse = Record<string, ExchangeData>;

const EXCHANGE_NAMES: Record<string, string> = {
  binancep2p: "Binance P2P",
  okexp2p: "OKX P2P",
  bybitp2p: "Bybit P2P",
  saldo: "Saldo",
  bitgetp2p: "Bitget P2P",
  bingxp2p: "BingX P2P",
  coinexp2p: "CoinEx P2P",
  mexcp2p: "MEXC P2P",
};

export async function GET() {
  try {
    const response = await fetch("https://criptoya.com/api/USDT/VES", {
      next: { revalidate: 0 },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`CryptoYa API error: ${response.status}`);
    }

    const data: CryptoYaResponse = await response.json();

    const exchanges = Object.entries(data).map(([key, value]) => ({
      id: key,
      name: EXCHANGE_NAMES[key] || key,
      ask: value.ask,
      totalAsk: value.totalAsk,
      bid: value.bid,
      totalBid: value.totalBid,
      time: value.time,
    }));

    // Calculate best prices
    const validAsks = exchanges.filter((e) => e.ask > 0);
    const validBids = exchanges.filter((e) => e.bid > 0);

    const bestAsk = validAsks.length > 0
      ? validAsks.reduce((min, e) => (e.ask < min.ask ? e : min), validAsks[0])
      : null;
    const bestBid = validBids.length > 0
      ? validBids.reduce((max, e) => (e.bid > max.bid ? e : max), validBids[0])
      : null;

    const avgAsk = validAsks.length > 0
      ? validAsks.reduce((sum, e) => sum + e.ask, 0) / validAsks.length
      : 0;
    const avgBid = validBids.length > 0
      ? validBids.reduce((sum, e) => sum + e.bid, 0) / validBids.length
      : 0;

    // Save to database
    try {
      for (const exchange of exchanges) {
        if (exchange.ask > 0 || exchange.bid > 0) {
          await db.priceSnapshot.create({
            data: {
              exchange: exchange.id,
              ask: exchange.ask,
              totalAsk: exchange.totalAsk,
              bid: exchange.bid,
              totalBid: exchange.totalBid,
            },
          });
        }
      }

      if (bestAsk && bestBid) {
        await db.bestPrice.create({
          data: {
            bestAsk: bestAsk.ask,
            bestAskEx: bestAsk.id,
            bestBid: bestBid.bid,
            bestBidEx: bestBid.id,
            avgAsk,
            avgBid,
          },
        });
      }
    } catch (dbError) {
      console.error("Database save error:", dbError);
    }

    return NextResponse.json({
      timestamp: Date.now(),
      exchanges,
      bestAsk: bestAsk ? { exchange: bestAsk.id, name: bestAsk.name, price: bestAsk.ask } : null,
      bestBid: bestBid ? { exchange: bestBid.id, name: bestBid.name, price: bestBid.bid } : null,
      avgAsk,
      avgBid,
      spread: bestAsk && bestBid ? bestAsk.ask - bestBid.bid : 0,
      spreadPercent: bestAsk && bestBid
        ? ((bestAsk.ask - bestBid.bid) / bestAsk.ask * 100)
        : 0,
    });
  } catch (error) {
    console.error("Error fetching prices:", error);
    return NextResponse.json(
      { error: "Error al obtener precios de CryptoYa" },
      { status: 500 }
    );
  }
}
