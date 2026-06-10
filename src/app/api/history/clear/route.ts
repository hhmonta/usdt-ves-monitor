import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function DELETE() {
  try {
    await db.priceSnapshot.deleteMany();
    await db.bestPrice.deleteMany();
    return NextResponse.json({ success: true, message: "Historial eliminado" });
  } catch (error) {
    console.error("Error clearing history:", error);
    return NextResponse.json(
      { error: "Error al limpiar historial" },
      { status: 500 }
    );
  }
}
