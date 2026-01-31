import { withErrorHandler } from "@/lib/api-utils";
import { requireAuth } from "@/lib/auth-utils";
import * as XLSX from "xlsx";

export const GET = withErrorHandler(async () => {
  // keep it protected (dashboard-only)
  await requireAuth();

  const headers = [
    "hsn_code",
    "oem_name",
    "inventory_amount",
    "gst_percent",
    "serial_number",
    "is_serialized",
    "iot_imei_no",
    "warranty_months",
    "manufacturing_date",
    "expiry_date",
    "batch_number",
    "oem_invoice_number",
    "oem_invoice_date",
    "challan_number",
    "challan_date",
    "quantity",
    "warehouse_location",
  ];

  const sampleRow = [
    "85076000",
    "Exide Industries",
    "15000",
    "18",
    "BAT-001",
    "true",
    "123456789012345",
    "12",
    "2024-01-01",
    "2025-01-01",
    "BATCH-001",
    "INV-001",
    "2024-01-01",
    "CH-001",
    "2024-01-01",
    "1",
    "Warehouse A",
  ];

  const ws = XLSX.utils.aoa_to_sheet([headers, sampleRow]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Template");

  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new Response(buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition":
        'attachment; filename="inventory_upload_template.xlsx"',
      "Cache-Control": "no-store",
    },
  });
});