import { db } from "@/lib/db";
import { productCatalog } from "@/lib/db/schema";
import { desc, eq, and, or, ilike } from "drizzle-orm";
import { requireAuth } from "@/lib/auth-utils";
import { generateId, successResponse, withErrorHandler } from "@/lib/api-utils";
import { z } from "zod";
import { triggerN8nWebhook } from "@/lib/n8n";

const CreateSchema = z.object({
    hsn_code: z.string().min(1),
    asset_category: z.enum(["2W", "3W", "Inverter"]),
    asset_type: z.enum(["Charger", "Battery", "SOC", "Harness", "Inverter"]),
    model_type: z.string().min(1),
    is_serialized: z.boolean().default(true),
    warranty_months: z.coerce.number().int().min(0),
});

export const GET = withErrorHandler(async (req: Request): Promise<Response> => {
    await requireAuth();

    const url = new URL(req.url);
    const status = (url.searchParams.get("status") || "active").toLowerCase(); // active | disabled | all
    const q = (url.searchParams.get("q") || "").trim();

    const filters: any[] = [];

    if (status !== "all") {
        filters.push(eq(productCatalog.status, status));
    }

    if (q) {
        const like = `%${q}%`;
        filters.push(
            or(
                ilike(productCatalog.id, like),
                ilike(productCatalog.hsn_code, like),
                ilike(productCatalog.asset_category, like),
                ilike(productCatalog.asset_type, like),
                ilike(productCatalog.model_type, like)
            )
        );
    }

    const whereClause = filters.length ? and(...filters) : undefined;

    const items = await db
        .select()
        .from(productCatalog)
        .where(whereClause)
        .orderBy(desc(productCatalog.created_at));

    return successResponse({ items });
});

export const POST = withErrorHandler(async (req: Request): Promise<Response> => {
    const user = await requireAuth();
    const body = await req.json();
    const parsed = CreateSchema.parse(body);

    const id = await generateId("PCAT", productCatalog);

    const now = new Date();

    const [created] = await db
        .insert(productCatalog)
        .values({
            id,
            ...parsed,
            status: "active",
            created_by: user.id,
            created_at: now,
        })
        .returning();

    // Optional webhook (non-blocking)
    try {
        await triggerN8nWebhook("product-catalog-created", {
            productId: id,
            createdBy: user.id,
        });
    } catch (e) {
        console.warn("[n8n] webhook failed:", e);
    }

    return successResponse({ item: created }, 201);
});