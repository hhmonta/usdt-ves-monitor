"use client";

import { useState, useEffect, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Activity,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Trash2,
  BarChart3,
  History,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

// Types
interface ExchangePrice {
  id: string;
  name: string;
  ask: number;
  totalAsk: number;
  bid: number;
  totalBid: number;
  time: number;
}

interface PriceData {
  timestamp: number;
  exchanges: ExchangePrice[];
  bestAsk: { exchange: string; name: string; price: number } | null;
  bestBid: { exchange: string; name: string; price: number } | null;
  avgAsk: number;
  avgBid: number;
  spread: number;
  spreadPercent: number;
}

interface Snapshot {
  id: string;
  exchange: string;
  ask: number;
  totalAsk: number;
  bid: number;
  totalBid: number;
  recordedAt: string;
}

interface BestPriceRecord {
  id: string;
  bestAsk: number;
  bestAskEx: string;
  bestBid: number;
  bestBidEx: string;
  avgAsk: number;
  avgBid: number;
  recordedAt: string;
}

interface HistoryData {
  snapshots: Snapshot[];
  bestPrices: BestPriceRecord[];
  total: number;
}

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

const EXCHANGE_COLORS: Record<string, string> = {
  binancep2p: "#F0B90B",
  okexp2p: "#2A5ADA",
  bybitp2p: "#F7A600",
  saldo: "#00C853",
  bitgetp2p: "#00F0FF",
  bingxp2p: "#FF6B35",
  coinexp2p: "#9C27B0",
  mexcp2p: "#E91E63",
};

function formatVES(value: number): string {
  return new Intl.NumberFormat("es-VE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString("es-VE", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString("es-VE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export default function Home() {
  const [priceData, setPriceData] = useState<PriceData | null>(null);
  const [historyData, setHistoryData] = useState<HistoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30);
  const [exchangeFilter, setExchangeFilter] = useState("all");
  const [prevBestAsk, setPrevBestAsk] = useState<number | null>(null);
  const [prevBestBid, setPrevBestBid] = useState<number | null>(null);

  const fetchPrices = useCallback(async () => {
    try {
      const res = await fetch("/api/prices");
      if (!res.ok) throw new Error("Error fetching prices");
      const data: PriceData = await res.json();
      
      setPrevBestAsk(priceData?.bestAsk?.price ?? null);
      setPrevBestBid(priceData?.bestBid?.price ?? null);
      setPriceData(data);
      setLastUpdate(new Date());
    } catch (err) {
      console.error("Error fetching prices:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await fetch(`/api/history?exchange=${exchangeFilter}&limit=200`);
      if (!res.ok) throw new Error("Error fetching history");
      const data: HistoryData = await res.json();
      setHistoryData(data);
    } catch (err) {
      console.error("Error fetching history:", err);
    } finally {
      setHistoryLoading(false);
    }
  }, [exchangeFilter]);

  const clearHistory = async () => {
    try {
      await fetch("/api/history/clear", { method: "DELETE" });
      setHistoryData(null);
      fetchHistory();
    } catch (err) {
      console.error("Error clearing history:", err);
    }
  };

  useEffect(() => {
    fetchPrices();
  }, [fetchPrices]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchPrices, refreshInterval * 1000);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchPrices]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const askDirection = prevBestAsk && priceData?.bestAsk?.price
    ? priceData.bestAsk.price > prevBestAsk ? "up" : priceData.bestAsk.price < prevBestAsk ? "down" : "same"
    : "same";
  
  const bidDirection = prevBestBid && priceData?.bestBid?.price
    ? priceData.bestBid.price > prevBestBid ? "up" : priceData.bestBid.price < prevBestBid ? "down" : "same"
    : "same";

  // Prepare chart data from bestPrices history
  const chartData = historyData?.bestPrices.map((bp) => ({
    time: new Date(bp.recordedAt).toLocaleTimeString("es-VE", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }),
    "Mejor Compra": bp.bestAsk,
    "Mejor Venta": bp.bestBid,
    "Promedio Compra": bp.avgAsk,
    "Promedio Venta": bp.avgBid,
  })) ?? [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-950/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">USDT/VES Monitor</h1>
              <p className="text-xs text-gray-400">Datos de CryptoYa</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {lastUpdate && (
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-gray-400">
                <Clock className="w-3.5 h-3.5" />
                <span>Actualizado: {formatTime(lastUpdate.getTime())}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Select
                value={refreshInterval.toString()}
                onValueChange={(v) => setRefreshInterval(parseInt(v))}
              >
                <SelectTrigger className="w-[70px] h-8 text-xs bg-gray-800 border-gray-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10s</SelectItem>
                  <SelectItem value="30">30s</SelectItem>
                  <SelectItem value="60">60s</SelectItem>
                  <SelectItem value="120">2m</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant={autoRefresh ? "default" : "outline"}
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
                className="h-8 text-xs"
              >
                {autoRefresh ? "Auto" : "Manual"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchPrices}
                className="h-8 text-xs"
                disabled={loading}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <Tabs defaultValue="monitor" className="space-y-6">
          <TabsList className="bg-gray-800/50 border border-gray-700">
            <TabsTrigger value="monitor" className="gap-2 data-[state=active]:bg-emerald-600/20 data-[state=active]:text-emerald-400">
              <BarChart3 className="w-4 h-4" />
              Monitor en Vivo
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2 data-[state=active]:bg-emerald-600/20 data-[state=active]:text-emerald-400">
              <History className="w-4 h-4" />
              Historial
            </TabsTrigger>
          </TabsList>

          {/* Monitor Tab */}
          <TabsContent value="monitor" className="space-y-6">
            {/* Best Price Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Best Ask */}
              <Card className="bg-gray-900/80 border-gray-800 overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 to-orange-500" />
                <CardHeader className="pb-2">
                  <CardDescription className="text-gray-400 text-xs flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5 text-red-400" />
                    MEJOR PRECIO DE COMPRA (ASK)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl sm:text-3xl font-bold text-white">
                      {priceData?.bestAsk ? formatVES(priceData.bestAsk.price) : "—"}
                    </span>
                    <span className="text-xs text-gray-500">VES</span>
                    {askDirection === "up" && <ArrowUpRight className="w-5 h-5 text-emerald-400" />}
                    {askDirection === "down" && <ArrowDownRight className="w-5 h-5 text-red-400" />}
                  </div>
                  {priceData?.bestAsk && (
                    <Badge variant="outline" className="mt-2 text-xs border-gray-700 text-gray-300">
                      {priceData.bestAsk.name}
                    </Badge>
                  )}
                </CardContent>
              </Card>

              {/* Best Bid */}
              <Card className="bg-gray-900/80 border-gray-800 overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
                <CardHeader className="pb-2">
                  <CardDescription className="text-gray-400 text-xs flex items-center gap-1">
                    <TrendingDown className="w-3.5 h-3.5 text-emerald-400" />
                    MEJOR PRECIO DE VENTA (BID)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl sm:text-3xl font-bold text-white">
                      {priceData?.bestBid ? formatVES(priceData.bestBid.price) : "—"}
                    </span>
                    <span className="text-xs text-gray-500">VES</span>
                    {bidDirection === "up" && <ArrowUpRight className="w-5 h-5 text-emerald-400" />}
                    {bidDirection === "down" && <ArrowDownRight className="w-5 h-5 text-red-400" />}
                  </div>
                  {priceData?.bestBid && (
                    <Badge variant="outline" className="mt-2 text-xs border-gray-700 text-gray-300">
                      {priceData.bestBid.name}
                    </Badge>
                  )}
                </CardContent>
              </Card>

              {/* Spread / Arbitrage */}
              <Card className="bg-gray-900/80 border-gray-800 overflow-hidden">
                <div className={`absolute top-0 left-0 right-0 h-1 ${priceData && priceData.spread < 0 ? "bg-gradient-to-r from-emerald-500 to-cyan-400" : "bg-gradient-to-r from-yellow-500 to-amber-500"}`} />
                <CardHeader className="pb-2">
                  <CardDescription className="text-gray-400 text-xs flex items-center gap-1">
                    <Activity className={`w-3.5 h-3.5 ${priceData && priceData.spread < 0 ? "text-emerald-400" : "text-yellow-400"}`} />
                    {priceData && priceData.spread < 0 ? "OPORTUNIDAD DE ARBITRAJE" : "SPREAD"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline gap-2">
                    <span className={`text-2xl sm:text-3xl font-bold ${priceData && priceData.spread < 0 ? "text-emerald-400" : "text-white"}`}>
                      {priceData ? formatVES(Math.abs(priceData.spread)) : "—"}
                    </span>
                    <span className="text-xs text-gray-500">VES</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-xs text-gray-500">
                      {priceData ? `${Math.abs(priceData.spreadPercent).toFixed(2)}%` : "—"}
                    </p>
                    {priceData && priceData.spread < 0 && (
                      <Badge className="bg-emerald-500/20 text-emerald-400 text-[10px] px-1.5 py-0">
                        ARBITRAJE
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Averages */}
              <Card className="bg-gray-900/80 border-gray-800 overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500" />
                <CardHeader className="pb-2">
                  <CardDescription className="text-gray-400 text-xs">
                    PROMEDIOS DEL MERCADO
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-400">Compra</span>
                      <span className="text-sm font-semibold text-red-400">
                        {priceData ? formatVES(priceData.avgAsk) : "—"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-400">Venta</span>
                      <span className="text-sm font-semibold text-emerald-400">
                        {priceData ? formatVES(priceData.avgBid) : "—"}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Exchanges Table */}
            <Card className="bg-gray-900/80 border-gray-800">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Activity className="w-5 h-5 text-emerald-400" />
                  Precios por Exchange
                </CardTitle>
                <CardDescription>
                  Comparación en tiempo real de todos los exchanges P2P disponibles
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-800 hover:bg-transparent">
                        <TableHead className="text-gray-400">Exchange</TableHead>
                        <TableHead className="text-right text-gray-400">
                          <div className="flex items-center justify-end gap-1">
                            <TrendingUp className="w-3.5 h-3.5 text-red-400" />
                            Compra (ASK)
                          </div>
                        </TableHead>
                        <TableHead className="text-right text-gray-400">
                          <div className="flex items-center justify-end gap-1">
                            <TrendingDown className="w-3.5 h-3.5 text-emerald-400" />
                            Venta (BID)
                          </div>
                        </TableHead>
                        <TableHead className="text-right text-gray-400">Spread</TableHead>
                        <TableHead className="text-center text-gray-400">Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        Array.from({ length: 6 }).map((_, i) => (
                          <TableRow key={i} className="border-gray-800">
                            <TableCell>
                              <div className="h-5 w-32 bg-gray-800 rounded animate-pulse" />
                            </TableCell>
                            <TableCell>
                              <div className="h-5 w-20 bg-gray-800 rounded animate-pulse ml-auto" />
                            </TableCell>
                            <TableCell>
                              <div className="h-5 w-20 bg-gray-800 rounded animate-pulse ml-auto" />
                            </TableCell>
                            <TableCell>
                              <div className="h-5 w-16 bg-gray-800 rounded animate-pulse ml-auto" />
                            </TableCell>
                            <TableCell>
                              <div className="h-5 w-16 bg-gray-800 rounded animate-pulse mx-auto" />
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        priceData?.exchanges
                          .filter((e) => e.ask > 0 || e.bid > 0)
                          .sort((a, b) => a.ask - b.ask)
                          .map((exchange) => {
                            const isBestAsk = priceData.bestAsk?.exchange === exchange.id;
                            const isBestBid = priceData.bestBid?.exchange === exchange.id;
                            const spread = exchange.ask > 0 && exchange.bid > 0
                              ? exchange.ask - exchange.bid
                              : 0;
                            const spreadPercent = exchange.ask > 0
                              ? (spread / exchange.ask * 100)
                              : 0;

                            return (
                              <TableRow
                                key={exchange.id}
                                className={`border-gray-800 ${
                                  isBestAsk || isBestBid
                                    ? "bg-emerald-950/20"
                                    : "hover:bg-gray-800/50"
                                }`}
                              >
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <div
                                      className="w-2.5 h-2.5 rounded-full"
                                      style={{
                                        backgroundColor: EXCHANGE_COLORS[exchange.id] || "#666",
                                      }}
                                    />
                                    <span className="font-medium">{exchange.name}</span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    {isBestAsk && (
                                      <Badge className="bg-red-500/20 text-red-400 text-[10px] px-1.5 py-0">
                                        MEJOR
                                      </Badge>
                                    )}
                                    <span className={`font-mono ${isBestAsk ? "text-red-400 font-bold" : "text-gray-200"}`}>
                                      {exchange.ask > 0 ? formatVES(exchange.ask) : "—"}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    {isBestBid && (
                                      <Badge className="bg-emerald-500/20 text-emerald-400 text-[10px] px-1.5 py-0">
                                        MEJOR
                                      </Badge>
                                    )}
                                    <span className={`font-mono ${isBestBid ? "text-emerald-400 font-bold" : "text-gray-200"}`}>
                                      {exchange.bid > 0 ? formatVES(exchange.bid) : "—"}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-right">
                                  <span className="font-mono text-xs text-gray-400">
                                    {exchange.ask > 0 && exchange.bid > 0 ? `${formatVES(spread)} (${spreadPercent.toFixed(1)}%)` : "—"}
                                  </span>
                                </TableCell>
                                <TableCell className="text-center">
                                  <Badge
                                    variant="outline"
                                    className={`text-[10px] ${
                                      isBestAsk || isBestBid
                                        ? "border-emerald-600 text-emerald-400"
                                        : "border-gray-700 text-gray-500"
                                    }`}
                                  >
                                    {isBestAsk && isBestBid ? "TOP" : isBestAsk || isBestBid ? "BEST" : "STD"}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            );
                          })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-6">
            {/* Chart */}
            <Card className="bg-gray-900/80 border-gray-800">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-emerald-400" />
                      Evolución de Precios
                    </CardTitle>
                    <CardDescription>
                      Mejor precio de compra y venta a lo largo del tiempo
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearHistory}
                    className="h-8 text-xs border-red-800 text-red-400 hover:bg-red-950/50"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1" />
                    Limpiar Historial
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {chartData.length > 1 ? (
                  <div className="h-[300px] sm:h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis
                          dataKey="time"
                          stroke="#6B7280"
                          fontSize={11}
                          tickLine={false}
                        />
                        <YAxis
                          stroke="#6B7280"
                          fontSize={11}
                          tickLine={false}
                          tickFormatter={(v) => formatVES(v)}
                          domain={["auto", "auto"]}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#1F2937",
                            border: "1px solid #374151",
                            borderRadius: "8px",
                            color: "#F3F4F6",
                            fontSize: "12px",
                          }}
                          formatter={(value: number) => [formatVES(value), ""]}
                          labelStyle={{ color: "#9CA3AF" }}
                        />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="Mejor Compra"
                          stroke="#EF4444"
                          strokeWidth={2}
                          dot={false}
                          activeDot={{ r: 4 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="Mejor Venta"
                          stroke="#10B981"
                          strokeWidth={2}
                          dot={false}
                          activeDot={{ r: 4 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="Promedio Compra"
                          stroke="#F87171"
                          strokeWidth={1}
                          strokeDasharray="4 4"
                          dot={false}
                        />
                        <Line
                          type="monotone"
                          dataKey="Promedio Venta"
                          stroke="#34D399"
                          strokeWidth={1}
                          strokeDasharray="4 4"
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[200px] flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <BarChart3 className="w-10 h-10 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Se necesitan más datos para mostrar el gráfico</p>
                      <p className="text-xs text-gray-600 mt-1">
                        Los datos se registrarán automáticamente con cada actualización
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* History Table */}
            <Card className="bg-gray-900/80 border-gray-800">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <History className="w-5 h-5 text-emerald-400" />
                      Historial de Movimientos
                    </CardTitle>
                    <CardDescription>
                      {historyData
                        ? `${historyData.total} registros en total`
                        : "Cargando..."}
                    </CardDescription>
                  </div>
                  <Select value={exchangeFilter} onValueChange={setExchangeFilter}>
                    <SelectTrigger className="w-[180px] h-8 text-xs bg-gray-800 border-gray-700">
                      <SelectValue placeholder="Filtrar exchange" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los Exchanges</SelectItem>
                      {Object.entries(EXCHANGE_NAMES).map(([key, name]) => (
                        <SelectItem key={key} value={key}>
                          {name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                {historyLoading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} className="h-10 bg-gray-800 rounded animate-pulse" />
                    ))}
                  </div>
                ) : historyData && historyData.snapshots.length > 0 ? (
                  <ScrollArea className="max-h-[500px]">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-gray-800 hover:bg-transparent">
                          <TableHead className="text-gray-400">Fecha/Hora</TableHead>
                          <TableHead className="text-gray-400">Exchange</TableHead>
                          <TableHead className="text-right text-gray-400">Compra (ASK)</TableHead>
                          <TableHead className="text-right text-gray-400">Venta (BID)</TableHead>
                          <TableHead className="text-right text-gray-400">Spread</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {historyData.snapshots.map((snap) => {
                          const spread = snap.ask > 0 && snap.bid > 0 ? snap.ask - snap.bid : 0;
                          const spreadPct = snap.ask > 0 ? (spread / snap.ask * 100) : 0;
                          return (
                            <TableRow key={snap.id} className="border-gray-800 hover:bg-gray-800/50">
                              <TableCell className="text-xs text-gray-400 font-mono">
                                {formatDateTime(snap.recordedAt)}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <div
                                    className="w-2 h-2 rounded-full"
                                    style={{
                                      backgroundColor: EXCHANGE_COLORS[snap.exchange] || "#666",
                                    }}
                                  />
                                  <span className="text-sm">
                                    {EXCHANGE_NAMES[snap.exchange] || snap.exchange}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="text-right font-mono text-red-400">
                                {snap.ask > 0 ? formatVES(snap.ask) : "—"}
                              </TableCell>
                              <TableCell className="text-right font-mono text-emerald-400">
                                {snap.bid > 0 ? formatVES(snap.bid) : "—"}
                              </TableCell>
                              <TableCell className="text-right font-mono text-xs text-gray-400">
                                {snap.ask > 0 && snap.bid > 0
                                  ? `${formatVES(spread)} (${spreadPct.toFixed(1)}%)`
                                  : "—"}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                ) : (
                  <div className="py-12 text-center text-gray-500">
                    <History className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No hay datos en el historial</p>
                    <p className="text-xs text-gray-600 mt-1">
                      Los precios se registrarán automáticamente con cada actualización
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-4 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center text-xs text-gray-600">
          Datos proporcionados por{" "}
          <a
            href="https://criptoya.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-500 hover:underline"
          >
            CryptoYa
          </a>
          {" "}• Precios referenciales P2P • Actualización cada {refreshInterval}s
        </div>
      </footer>
    </div>
  );
}
