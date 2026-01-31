// src/app/api/inventory/route.ts

import { db } from "@/lib/db";
import { inventory } from "@/lib/db/schema";
import { and, desc, eq, ilike, or } from "drizzle-orm";
import { withErrorHandler, successResponse } from "@/lib/api-utils";
import { requireAuth } from "@/lib/auth-utils";

export const GET = withErrorHandler(async (req: Request) => {
  await requireAuth();

  const url = new URL(req.url);
  const q = (url.searchParams.get("q") || "").trim();
  const status = (url.searchParams.get("status") || "").trim();
  const assetCategory = (url.searchParams.get("asset_category") || "").trim();
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "50", 10), 200);
  const offset = Math.max(parseInt(url.searchParams.get("offset") || "0", 10), 0);

  const whereParts: any[] = [];

    if (status && status !== "all") whereParts.push(eq(inventory.status, status));
  if (assetCategory) whereParts.push(eq(inventory.asset_category, assetCategory));

  if (q) {
    const like = `%${q}%`;
    whereParts.push(
      or(
        ilike(inventory.oem_name, like),
        ilike(inventory.model_type, like),
        ilike(inventory.serial_number, like),
        ilike(inventory.batch_number, like),
        ilike(inventory.iot_imei_no, like),
        ilike(inventory.challan_number, like),
        ilike(inventory.oem_invoice_number, like)
      )
    );
  }

  const rows = await db
    .select({
      id: inventory.id,
      product_id: inventory.product_id,
      oem_id: inventory.oem_id,

      // Denormalized
      oem_name: inventory.oem_name,
      asset_category: inventory.asset_category,
      asset_type: inventory.asset_type,
      model_type: inventory.model_type,

      // Serialization
      serial_number: inventory.serial_number,
      batch_number: inventory.batch_number,
      quantity: inventory.quantity,

      // Phase-A fields
      uploaded_at: inventory.uploaded_at,
      uploaded_by: inventory.uploaded_by,
      challan_number: inventory.challan_number,
      challan_date: inventory.challan_date,
      iot_imei_no: inventory.iot_imei_no,
      warranty_months: inventory.warranty_months,

      // Status
      status: inventory.status,
      created_at: inventory.created_at,
      updated_at: inventory.updated_at,
    })
    .from(inventory)
    .where(whereParts.length ? and(...whereParts) : undefined)
    .orderBy(desc(inventory.uploaded_at))
    .limit(limit)
    .offset(offset);

  return successResponse({ items: rows });
});