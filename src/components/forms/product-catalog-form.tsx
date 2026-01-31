"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

const ProductSchema = z.object({
    hsn_code: z.string().min(1, "HSN code is required"),
    asset_category: z.enum(["2W", "3W", "Inverter"]),
    asset_type: z.enum(["Charger", "Battery", "SOC", "Harness", "Inverter"]),
    model_type: z.string().min(1, "Model type is required"),
    is_serialized: z.boolean(),
    warranty_months: z.number().int().min(0, "Warranty must be at least 0 months"),
});

type ProductForm = z.infer<typeof ProductSchema>;

export default function ProductCatalogForm() {
    const queryClient = useQueryClient();
    const [banner, setBanner] = useState<{ type: "success" | "error"; msg: string } | null>(null);

    const form = useForm<ProductForm>({
        resolver: zodResolver(ProductSchema),
        defaultValues: {
            hsn_code: "",
            asset_category: "2W",
            asset_type: "Battery",
            model_type: "",
            is_serialized: true,
            warranty_months: 24,
        },
    });

    const createMutation = useMutation({
        mutationFn: async (values: ProductForm) => {
            setBanner(null);
            const res = await fetch("/api/product-catalog", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(values),
            });

            const json = await res.json();
            if (!res.ok || !json?.success) {
                throw new Error(json?.error?.message || "Failed to create product");
            }
            return json.data.item;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["product-catalog"] });
            form.reset();
            setBanner({ type: "success", msg: "Product created successfully." });
        },
        onError: (err: any) => {
            setBanner({ type: "error", msg: err?.message || "Something went wrong." });
        },
    });

    const onSubmit = (values: ProductForm) => {
        createMutation.mutate(values);
    };

    return (
        <Card className="rounded-2xl border border-gray-100 shadow-sm">
            <CardHeader>
                <CardTitle className="text-lg">Add Product to Catalog</CardTitle>
            </CardHeader>
            <CardContent>
                {banner && (
                    <div
                        className={`mb-4 rounded-xl px-4 py-3 text-sm ${banner.type === "success"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                            : "bg-rose-50 text-rose-700 border border-rose-100"
                            }`}
                    >
                        {banner.msg}
                    </div>
                )}

                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="hsn_code">HSN Code</Label>
                            <Input id="hsn_code" {...form.register("hsn_code")} />
                            <p className="text-xs text-rose-600 mt-1">{form.formState.errors.hsn_code?.message}</p>
                        </div>

                        <div>
                            <Label>Asset Category</Label>
                            <Select {...form.register("asset_category")}>
                                <option value="2W">2W</option>
                                <option value="3W">3W</option>
                                <option value="Inverter">Inverter</option>
                            </Select>
                            <p className="text-xs text-rose-600 mt-1">{form.formState.errors.asset_category?.message}</p>
                        </div>

                        <div>
                            <Label>Asset Type</Label>
                            <Select {...form.register("asset_type")}>
                                <option value="Battery">Battery</option>
                                <option value="Charger">Charger</option>
                                <option value="SOC">SOC</option>
                                <option value="Harness">Harness</option>
                                <option value="Inverter">Inverter</option>
                            </Select>
                            <p className="text-xs text-rose-600 mt-1">{form.formState.errors.asset_type?.message}</p>
                        </div>

                        <div>
                            <Label htmlFor="model_type">Model Type</Label>
                            <Input id="model_type" {...form.register("model_type")} />
                            <p className="text-xs text-rose-600 mt-1">{form.formState.errors.model_type?.message}</p>
                        </div>

                        <div>
                            <Label htmlFor="warranty_months">Warranty (months)</Label>
                            <Input id="warranty_months" type="number" {...form.register("warranty_months", { valueAsNumber: true })} />
                            <p className="text-xs text-rose-600 mt-1">{form.formState.errors.warranty_months?.message}</p>
                        </div>

                        <div className="flex items-center gap-3 pt-7">
                            <input
                                id="is_serialized"
                                type="checkbox"
                                checked={form.watch("is_serialized")}
                                onChange={(e) => form.setValue("is_serialized", e.target.checked)}
                                className="h-4 w-4"
                            />
                            <Label htmlFor="is_serialized">Serialized item</Label>
                        </div>
                    </div>

                    <Button type="submit" disabled={createMutation.isPending} className="w-full">
                        {createMutation.isPending ? "Creating..." : "Create Product"}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}