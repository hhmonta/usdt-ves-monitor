import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const exchange = searchParams.get("exchange");
    const limit = parseInt(searchParams.get("limit") || "100");
    const offset = parseInt(searchParams.get("offset") || "0");

    const where: Prisma.PriceSnapshotWhereInput = {};
    if (exchange && exchange !== "all") {
      where.exchange = exchange;
    }

    const [snapshots, total] = await Promise.all([
      db.priceSnapshot.findMany({
        where,
        orderBy: { recordedAt: "desc" },
        take: limit,
        skip: offset,
      }),
      db.priceSnapshot.count({ where }),
    ]);

    // Also get best price history for charting
    const bestPrices = await db.bestPrice.findMany({
      orderBy: { recordedAt: "desc" },
      take: 50,
    });

    return NextResponse.json({
      snapshots,
      bestPrices: bestPrices.reverse(),
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Error fetching history:", error);
    return NextResponse.json(
      { error: "Error al obtener historial" },
      { status: 500 }
    );
  }
}
