import { pgTable, text, timestamp, integer, boolean, varchar, decimal, jsonb, uuid, index, bigint, serial, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// --- FOUNDATION ---

export const users = pgTable('users', {
    id: uuid('id').primaryKey(),
    email: text('email').notNull().unique(),
    name: text('name').notNull(),
    role: varchar('role', { length: 50 }).notNull(), // ceo, business_head, sales_head, sales_manager, sales_executive, finance_controller, inventory_manager, service_engineer
    phone: text('phone'),
    avatar_url: text('avatar_url'),
    is_active: boolean('is_active').notNull().default(true),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// --- PHASE 0: MVP ---

export const productCatalog = pgTable('product_catalog', {
    id: varchar('id', { length: 255 }).primaryKey(), // PCAT-YYYYMMDD-SEQ
    hsn_code: varchar('hsn_code', { length: 8 }).notNull(),
    asset_category: varchar('asset_category', { length: 20 }).notNull(),
    asset_type: varchar('asset_type', { length: 50 }).notNull(),
    model_type: text('model_type').notNull(),
    is_serialized: boolean('is_serialized').default(true).notNull(),
    warranty_months: integer('warranty_months').notNull(),
    status: varchar('status', { length: 20 }).default('active').notNull(),
    created_by: uuid('created_by').references(() => users.id),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),

    // ✅ ADD THIS
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),

    disabled_at: timestamp('disabled_at', { withTimezone: true }),
    disabled_by: uuid('disabled_by').references(() => users.id),
});

export const oems = pgTable('oems', {
    id: varchar('id', { length: 255 }).primaryKey(), // OEM-YYYYMMDD-SEQ
    business_entity_name: text('business_entity_name').notNull(),
    gstin: varchar('gstin', { length: 15 }).notNull().unique(),
    pan: varchar('pan', { length: 10 }),
    cin: varchar('cin', { length: 21 }), // <-- ADDED (BRD field)

    address_line1: text('address_line1'),
    address_line2: text('address_line2'),
    city: text('city'),
    state: text('state'),
    pincode: varchar('pincode', { length: 6 }),

    bank_name: text('bank_name'),
    bank_account_number: text('bank_account_number').notNull(),
    ifsc_code: varchar('ifsc_code', { length: 11 }).notNull(),
    bank_proof_url: text('bank_proof_url'),

    status: varchar('status', { length: 20 }).default('active').notNull(), // active, inactive
    created_by: uuid('created_by').references(() => users.id),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const oemContacts = pgTable('oem_contacts', {
    id: varchar('id', { length: 255 }).primaryKey(), // OEM_ID-ROLE_SEQ
    oem_id: varchar('oem_id', { length: 255 }).references(() => oems.id, { onDelete: 'cascade' }).notNull(),
    contact_role: varchar('contact_role', { length: 50 }).notNull(), // sales_head, sales_manager, finance_manager
    contact_name: text('contact_name').notNull(),
    contact_phone: varchar('contact_phone', { length: 20 }).notNull(),
    contact_email: text('contact_email').notNull(),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const inventory = pgTable('inventory', {
    id: varchar('id', { length: 255 }).primaryKey(), // INV-YYYYMMDD-XXX
    product_id: varchar('product_id', { length: 255 }).references(() => productCatalog.id).notNull(),
    oem_id: varchar('oem_id', { length: 255 }).references(() => oems.id).notNull(),

    // Denormalized Product Details (SOP 7.4)
    oem_name: text('oem_name').notNull(),
    asset_category: text('asset_category').notNull(),
    asset_type: text('asset_type').notNull(),
    model_type: text('model_type').notNull(),

    // NEW (Phase-A)
    uploaded_at: timestamp('uploaded_at', { withTimezone: true }).defaultNow().notNull(),
    uploaded_by: uuid('uploaded_by').references(() => users.id).notNull(),
    challan_number: text('challan_number'),
    challan_date: timestamp('challan_date', { withTimezone: true }),
    iot_imei_no: varchar('iot_imei_no', { length: 255 }).unique(),
    warranty_months: integer('warranty_months').notNull(),

    // Serialization
    is_serialized: boolean('is_serialized').default(true).notNull(),
    serial_number: varchar('serial_number', { length: 255 }).unique(),
    batch_number: varchar('batch_number', { length: 255 }),
    quantity: integer('quantity'),

    // Dates
    manufacturing_date: timestamp('manufacturing_date', { withTimezone: true }).notNull(),
    expiry_date: timestamp('expiry_date', { withTimezone: true }).notNull(),

    // Financials
    inventory_amount: decimal('inventory_amount', { precision: 12, scale: 2 }).notNull(),
    gst_percent: decimal('gst_percent', { precision: 5, scale: 2 }).notNull(),
    gst_amount: decimal('gst_amount', { precision: 12, scale: 2 }).notNull(),
    final_amount: decimal('final_amount', { precision: 12, scale: 2 }).notNull(),

    // Invoicing
    oem_invoice_number: text('oem_invoice_number').notNull(),
    oem_invoice_date: timestamp('oem_invoice_date', { withTimezone: true }).notNull(),
    oem_invoice_url: text('oem_invoice_url'),

    // Documents
    product_manual_url: text('product_manual_url'),
    warranty_document_url: text('warranty_document_url'),

    // Status
    status: varchar('status', { length: 20 }).default('in_transit').notNull(), // in_transit, pdi_pending, pdi_failed, available, reserved, sold, damaged, returned
    warehouse_location: text('warehouse_location'),

    // Metadata
    created_by: uuid('created_by').references(() => users.id).notNull(),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
// --- DEALER SALES ---

export const leads = pgTable('leads', {
    id: varchar('id', { length: 255 }).primaryKey(), // LEAD-YYYYMMDD-SEQ
    lead_source: varchar('lead_source', { length: 50 }).notNull(), // call_center, ground_sales, digital_marketing, database_upload, dealer_referral
    interest_level: varchar('interest_level', { length: 20 }).default('cold').notNull(), // cold, warm, hot
    lead_status: varchar('lead_status', { length: 50 }).default('new').notNull(), // new, assigned, contacted, qualified, converted, lost

    // Dealer Info
    owner_name: text('owner_name').notNull(),
    owner_contact: varchar('owner_contact', { length: 20 }).notNull(),
    business_name: text('business_name'),
    owner_email: text('owner_email'),

    // Location
    state: varchar('state', { length: 100 }).notNull(),
    city: varchar('city', { length: 100 }).notNull(),
    shop_address: text('shop_address'),

    // Business Details
    interested_in: jsonb('interested_in'), // Array of product IDs
    battery_order_expected: integer('battery_order_expected'),
    investment_capacity: decimal('investment_capacity', { precision: 12, scale: 2 }),
    business_type: varchar('business_type', { length: 50 }), // retail, wholesale, distributor

    // Qualification
    qualified_by: uuid('qualified_by').references(() => users.id),
    qualified_at: timestamp('qualified_at', { withTimezone: true }),
    qualification_notes: text('qualification_notes'),

    // Conversion
    converted_deal_id: varchar('converted_deal_id', { length: 255 }),
    converted_at: timestamp('converted_at', { withTimezone: true }),

    // Metadata
    uploader_id: uuid('uploader_id').references(() => users.id).notNull(),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => {
    return {
        leadsSourceIdx: index('leads_source_idx').on(table.lead_source),
        leadsInterestIdx: index('leads_interest_idx').on(table.interest_level),
        leadsStatusIdx: index('leads_status_idx').on(table.lead_status),
    };
});

export const leadAssignments = pgTable('lead_assignments', {
    id: varchar('id', { length: 255 }).primaryKey(),
    lead_id: varchar('lead_id', { length: 255 }).references(() => leads.id).notNull(),
    lead_owner: uuid('lead_owner').references(() => users.id).notNull(), // Sales Head MUST assign
    assigned_by: uuid('assigned_by').references(() => users.id).notNull(),
    assigned_at: timestamp('assigned_at', { withTimezone: true }).defaultNow().notNull(),

    // Lead Actor (Owner or Sales Head can assign)
    lead_actor: uuid('lead_actor').references(() => users.id),
    actor_assigned_by: uuid('actor_assigned_by').references(() => users.id),
    actor_assigned_at: timestamp('actor_assigned_at', { withTimezone: true }),

    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const assignmentChangeLogs = pgTable('assignment_change_logs', {
    id: varchar('id', { length: 255 }).primaryKey(),
    lead_id: varchar('lead_id', { length: 255 }).references(() => leads.id).notNull(),
    change_type: varchar('change_type', { length: 50 }).notNull(), // owner_assigned, owner_changed, actor_assigned, actor_changed, actor_removed
    old_user_id: uuid('old_user_id').references(() => users.id),
    new_user_id: uuid('new_user_id').references(() => users.id),
    changed_by: uuid('changed_by').references(() => users.id).notNull(),
    change_reason: text('change_reason'),
    changed_at: timestamp('changed_at', { withTimezone: true }).defaultNow().notNull(),
});

export const deals = pgTable('deals', {
    id: varchar('id', { length: 255 }).primaryKey(), // DEAL-YYYYMMDD-XXX
    lead_id: varchar('lead_id', { length: 255 }).references(() => leads.id).notNull(),

    // Products & Pricing
    products: jsonb('products').notNull(), // Array of { product_id, quantity, unit_price, gst_percent }
    line_total: decimal('line_total', { precision: 12, scale: 2 }).notNull(),
    gst_amount: decimal('gst_amount', { precision: 12, scale: 2 }).notNull(),
    transportation_cost: decimal('transportation_cost', { precision: 10, scale: 2 }).default('0').notNull(),
    transportation_gst_percent: integer('transportation_gst_percent').default(18).notNull(),
    total_payable: decimal('total_payable', { precision: 12, scale: 2 }).notNull(),

    // Payment Terms
    payment_term: varchar('payment_term', { length: 20 }).notNull(), // cash, credit
    credit_period_months: integer('credit_period_months'),

    // Status
    deal_status: varchar('deal_status', { length: 50 }).default('pending_approval_l1').notNull(), // pending_approval_l1, pending_approval_l2, pending_approval_l3, approved, rejected, payment_awaited, converted, expired

    // Immutability (after invoice)
    is_immutable: boolean('is_immutable').default(false).notNull(),
    invoice_number: text('invoice_number'),
    invoice_url: text('invoice_url'),
    invoice_issued_at: timestamp('invoice_issued_at', { withTimezone: true }),

    // Expiry
    expires_at: timestamp('expires_at', { withTimezone: true }),
    expired_by: uuid('expired_by').references(() => users.id),
    expired_at: timestamp('expired_at', { withTimezone: true }),
    expiry_reason: text('expiry_reason'),

    // Rejection
    rejected_by: uuid('rejected_by').references(() => users.id),
    rejected_at: timestamp('rejected_at', { withTimezone: true }),
    rejection_reason: text('rejection_reason'),

    created_by: uuid('created_by').references(() => users.id).notNull(),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const approvals = pgTable('approvals', {
    id: varchar('id', { length: 255 }).primaryKey(),
    entity_type: varchar('entity_type', { length: 50 }).notNull(), // deal, order, provision
    entity_id: varchar('entity_id', { length: 255 }).notNull(),

    level: integer('level').notNull(), // 1, 2, 3
    approver_role: varchar('approver_role', { length: 50 }).notNull(), // sales_head, business_head, finance_controller

    status: varchar('status', { length: 20 }).default('pending').notNull(), // pending, approved, rejected

    approver_id: uuid('approver_id').references(() => users.id),
    decision_at: timestamp('decision_at', { withTimezone: true }),
    rejection_reason: text('rejection_reason'),
    comments: text('comments'),

    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const orderDisputes = pgTable('order_disputes', {
    id: varchar('id', { length: 255 }).primaryKey(), // DISP-YYYYMMDD-SEQ
    order_id: varchar('order_id', { length: 255 }).references(() => orders.id).notNull(),
    dispute_type: varchar('dispute_type', { length: 50 }).notNull(), // damage, shortage, delivery_failure
    description: text('description').notNull(),
    photos_urls: jsonb('photos_urls'), // Array of photo URLs
    assigned_to: uuid('assigned_to').references(() => users.id).notNull(),
    resolution_status: varchar('resolution_status', { length: 50 }).default('open').notNull(), // open, investigating, resolved, closed
    resolution_details: text('resolution_details'), // Added from SOP 9.6
    action_taken: text('action_taken'),           // Added from SOP 9.6
    resolved_by: uuid('resolved_by').references(() => users.id),
    resolved_at: timestamp('resolved_at'),
    created_by: uuid('created_by').references(() => users.id).notNull(),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const slas = pgTable('slas', {
    id: varchar('id', { length: 255 }).primaryKey(),
    workflow_step: varchar('workflow_step', { length: 100 }).notNull(),
    entity_type: varchar('entity_type', { length: 50 }).notNull(),
    entity_id: varchar('entity_id', { length: 255 }).notNull(),
    assigned_to: uuid('assigned_to').references(() => users.id),
    sla_deadline: timestamp('sla_deadline').notNull(),
    status: varchar('status', { length: 20 }).default('active').notNull(), // active, completed, breached
    completed_at: timestamp('completed_at'),
    escalated_to: uuid('escalated_to').references(() => users.id),
    escalated_at: timestamp('escalated_at'),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// --- PDI ---

export const oemInventoryForPDI = pgTable('oem_inventory_for_pdi', {
    id: varchar('id', { length: 255 }).primaryKey(), // PDIREQ-YYYYMMDD-XXX
    provision_id: varchar('provision_id', { length: 255 }).notNull(),
    inventory_id: varchar('inventory_id', { length: 255 }).references(() => inventory.id).notNull(),
    serial_number: varchar('serial_number', { length: 255 }),
    oem_id: varchar('oem_id', { length: 255 }).references(() => oems.id).notNull(),
    pdi_status: varchar('pdi_status', { length: 20 }).default('pending').notNull(), // pending, in_progress, completed
    pdi_record_id: varchar('pdi_record_id', { length: 255 }),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const pdiRecords = pgTable('pdi_records', {
    id: varchar('id', { length: 255 }).primaryKey(), // PDI-YYYYMMDD-XXX
    oem_inventory_id: varchar('oem_inventory_id', { length: 255 }).references(() => oemInventoryForPDI.id).notNull(),
    provision_id: varchar('provision_id', { length: 255 }).notNull(),
    service_engineer_id: uuid('service_engineer_id').references(() => users.id).notNull(),

    // Physical Inspection
    iot_imei_no: varchar('iot_imei_no', { length: 255 }),
    physical_condition: text('physical_condition').notNull(), // OK - No issues, Minor scratches, Damaged exterior, Severely damaged
    discharging_connector: varchar('discharging_connector', { length: 20 }).notNull(), // SB75, SB50
    charging_connector: varchar('charging_connector', { length: 20 }).notNull(), // SB75, SB50
    productor_sticker: varchar('productor_sticker', { length: 50 }).notNull(), // Available - damage, Available - OK, Unavailable

    // Technical Fields
    voltage: decimal('voltage', { precision: 5, scale: 2 }),
    soc: integer('soc'),
    capacity_ah: decimal('capacity_ah', { precision: 6, scale: 2 }),
    resistance_mohm: decimal('resistance_mohm', { precision: 6, scale: 2 }),
    temperature_celsius: decimal('temperature_celsius', { precision: 5, scale: 2 }),

    // GPS
    latitude: decimal('latitude', { precision: 10, scale: 8 }).notNull(),
    longitude: decimal('longitude', { precision: 11, scale: 8 }).notNull(),
    location_address: text('location_address'),

    // Documents
    product_manual_url: text('product_manual_url'),
    warranty_document_url: text('warranty_document_url'),
    pdi_photos: jsonb('pdi_photos'),

    // Result
    pdi_status: varchar('pdi_status', { length: 20 }).notNull(), // pass, fail
    failure_reason: text('failure_reason'),

    inspected_at: timestamp('inspected_at', { withTimezone: true }).defaultNow().notNull(),
});

export const auditLogs = pgTable('audit_logs', {
    id: varchar('id', { length: 255 }).primaryKey(), // AUDIT-YYYYMMDD-SEQ
    entity_type: varchar('entity_type', { length: 50 }).notNull(),
    entity_id: varchar('entity_id', { length: 255 }).notNull(),
    action: varchar('action', { length: 50 }).notNull(), // create, update, delete, approve, reject, assign, complete
    changes: jsonb('changes'),
    performed_by: uuid('performed_by').references(() => users.id).notNull(),
    timestamp: timestamp('timestamp').defaultNow().notNull(),
});

// --- ACCOUNTS ---

export const accounts = pgTable('accounts', {
    id: varchar('id', { length: 255 }).primaryKey(), // ACC-YYYYMMDD-XXX
    business_name: text('business_name').notNull(),
    owner_name: text('owner_name').notNull(),
    email: text('email'),
    phone: varchar('phone', { length: 20 }),
    gstin: varchar('gstin', { length: 15 }),
    billing_address: text('billing_address'),
    shipping_address: text('shipping_address'),
    status: varchar('status', { length: 20 }).default('active').notNull(),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    last_order_fulfilled_at: timestamp('last_order_fulfilled_at', { withTimezone: true }),
});

// --- PROCUREMENT ---

export const provisions = pgTable('provisions', {
    id: varchar('id', { length: 255 }).primaryKey(), // PROV-YYYYMMDD-XXX
    oem_id: varchar('oem_id', { length: 255 }).references(() => oems.id).notNull(),
    oem_name: text('oem_name').notNull(),
    products: jsonb('products').notNull(), // Array of { product_id, quantity }
    expected_delivery_date: timestamp('expected_delivery_date', { withTimezone: true }).notNull(),
    status: varchar('status', { length: 20 }).default('pending').notNull(), // pending, acknowledged, in_production, ready_for_pdi, completed, cancelled
    remarks: text('remarks'),
    created_by: uuid('created_by').references(() => users.id).notNull(),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const orders = pgTable('orders', {
    id: varchar('id', { length: 255 }).primaryKey(), // ORD-YYYYMMDD-XXX
    provision_id: varchar('provision_id', { length: 255 }).references(() => provisions.id).notNull(),
    oem_id: varchar('oem_id', { length: 255 }).references(() => oems.id).notNull(),
    account_id: varchar('account_id', { length: 255 }).references(() => accounts.id),

    // Order items
    order_items: jsonb('order_items').notNull(), // Array of { inventory_id, serial_number, amount }
    total_amount: decimal('total_amount', { precision: 12, scale: 2 }).notNull(),

    payment_term: varchar('payment_term', { length: 20 }).notNull(), // advance, credit
    credit_period_days: integer('credit_period_days'),

    // Documents
    pi_url: text('pi_url'),
    pi_amount: decimal('pi_amount', { precision: 12, scale: 2 }),
    invoice_url: text('invoice_url'),
    grn_id: text('grn_id'),
    grn_date: timestamp('grn_date', { withTimezone: true }),

    // Payment Tracking
    payment_status: varchar('payment_status', { length: 20 }).default('unpaid').notNull(), // unpaid, partial, paid
    payment_amount: decimal('payment_amount', { precision: 12, scale: 2 }).default('0').notNull(),
    payment_mode: varchar('payment_mode', { length: 50 }),
    transaction_id: text('transaction_id'),
    payment_date: timestamp('payment_date', { withTimezone: true }),

    // Status
    order_status: varchar('order_status', { length: 50 }).default('pi_awaited').notNull(), // pi_awaited, pi_approval_pending, pi_approved, pi_rejected, payment_made, in_transit, delivered, cancelled
    delivery_status: varchar('delivery_status', { length: 20 }).default('pending').notNull(), // pending, in_transit, delivered, failed

    // Dates
    expected_delivery_date: timestamp('expected_delivery_date', { withTimezone: true }),
    actual_delivery_date: timestamp('actual_delivery_date', { withTimezone: true }),

    created_by: uuid('created_by').references(() => users.id).notNull(),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => {
    return {
        ordersCreatedAtIdx: index('orders_created_at_idx').on(table.created_at),
        ordersPaymentStatusIdx: index('orders_payment_status_idx').on(table.payment_status),
    };
});

// --- DOCUMENT MANAGEMENT (Phase 1) ---

export const documents = pgTable('documents', {
    id: varchar('id', { length: 255 }).primaryKey(), // DOC-YYYYMMDD-SEQ
    document_type: varchar('document_type', { length: 50 }).notNull(), // pi, invoice, challan, warranty, manual, other
    source: varchar('source', { length: 50 }).notNull(), // oem_email, whatsapp, upload
    url: text('url').notNull(),

    uploaded_by: uuid('uploaded_by').references(() => users.id).notNull(),
    uploaded_at: timestamp('uploaded_at', { withTimezone: true }).defaultNow().notNull(),

    version: integer('version').default(1).notNull(),
    is_active: boolean('is_active').default(true).notNull(),

    // Polymorphic linkage
    entity_type: varchar('entity_type', { length: 50 }).notNull(), // provision, order, pi, invoice, grn, inventory, etc.
    entity_id: varchar('entity_id', { length: 255 }).notNull(),
}, (table) => {
    return {
        docsEntityIdx: index('documents_entity_idx').on(table.entity_type, table.entity_id),
        docsTypeIdx: index('documents_type_idx').on(table.document_type),
    };
});

// --- PROCUREMENT: PI / INVOICE VERSIONING (Phase 1) ---
// BRD rule: Approved PI/Invoice are immutable; revisions create a NEW version.

export const orderPiVersions = pgTable('order_pi_versions', {
    id: varchar('id', { length: 255 }).primaryKey(), // PI-YYYYMMDD-SEQ
    order_id: varchar('order_id', { length: 255 }).references(() => orders.id).notNull(),
    document_id: varchar('document_id', { length: 255 }).references(() => documents.id).notNull(),

    pi_number: text('pi_number'),
    pi_date: timestamp('pi_date', { withTimezone: true }),
    amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),

    version: integer('version').notNull(),
    is_active: boolean('is_active').default(true).notNull(),

    status: varchar('status', { length: 20 }).default('uploaded').notNull(), // uploaded, approved, rejected, superseded
    rejection_reason: text('rejection_reason'),

    created_by: uuid('created_by').references(() => users.id).notNull(),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    approved_by: uuid('approved_by').references(() => users.id),
    approved_at: timestamp('approved_at', { withTimezone: true }),
}, (table) => {
    return {
        piOrderIdx: index('order_pi_versions_order_idx').on(table.order_id),
        piActiveIdx: index('order_pi_versions_active_idx').on(table.order_id, table.is_active),
    };
});

export const orderInvoiceVersions = pgTable('order_invoice_versions', {
    id: varchar('id', { length: 255 }).primaryKey(), // INVV-YYYYMMDD-SEQ
    order_id: varchar('order_id', { length: 255 }).references(() => orders.id).notNull(),
    document_id: varchar('document_id', { length: 255 }).references(() => documents.id).notNull(),

    invoice_number: text('invoice_number'),
    invoice_date: timestamp('invoice_date', { withTimezone: true }),
    amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),

    version: integer('version').notNull(),
    is_active: boolean('is_active').default(true).notNull(),

    status: varchar('status', { length: 20 }).default('uploaded').notNull(), // uploaded, approved, rejected, superseded
    rejection_reason: text('rejection_reason'),

    created_by: uuid('created_by').references(() => users.id).notNull(),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    approved_by: uuid('approved_by').references(() => users.id),
    approved_at: timestamp('approved_at', { withTimezone: true }),
}, (table) => {
    return {
        invOrderIdx: index('order_invoice_versions_order_idx').on(table.order_id),
        invActiveIdx: index('order_invoice_versions_active_idx').on(table.order_id, table.is_active),
    };
});

// --- PROCUREMENT: PAYMENT / CREDIT / CHALLAN (Phase 1) ---
// BRD rule: multiple payments, multiple credits; challan is a document linked to the order.

export const orderPayments = pgTable('order_payments', {
    id: varchar('id', { length: 255 }).primaryKey(), // PAY-YYYYMMDD-SEQ
    order_id: varchar('order_id', { length: 255 }).references(() => orders.id).notNull(),
    invoice_version_id: varchar('invoice_version_id', { length: 255 }).references(() => orderInvoiceVersions.id),

    amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
    mode: varchar('mode', { length: 50 }).notNull(), // cash, bank_transfer, cheque, online
    utr: text('utr').notNull(),
    paid_at: timestamp('paid_at', { withTimezone: true }).notNull(),

    created_by: uuid('created_by').references(() => users.id).notNull(),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => {
    return {
        payOrderIdx: index('order_payments_order_idx').on(table.order_id),
    };
});

export const orderCredits = pgTable('order_credits', {
    id: varchar('id', { length: 255 }).primaryKey(), // CRED-YYYYMMDD-SEQ
    order_id: varchar('order_id', { length: 255 }).references(() => orders.id).notNull(),
    invoice_version_id: varchar('invoice_version_id', { length: 255 }).references(() => orderInvoiceVersions.id),

    amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
    status: varchar('status', { length: 20 }).default('active').notNull(), // active, settled
    notes: text('notes'),

    approved_by: uuid('approved_by').references(() => users.id),
    approved_at: timestamp('approved_at', { withTimezone: true }),

    created_by: uuid('created_by').references(() => users.id).notNull(),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => {
    return {
        credOrderIdx: index('order_credits_order_idx').on(table.order_id),
        credStatusIdx: index('order_credits_status_idx').on(table.status),
    };
});

export const orderChallans = pgTable('order_challans', {
    id: varchar('id', { length: 255 }).primaryKey(), // CHLN-YYYYMMDD-SEQ
    order_id: varchar('order_id', { length: 255 }).references(() => orders.id).notNull(),
    document_id: varchar('document_id', { length: 255 }).references(() => documents.id).notNull(),

    challan_number: text('challan_number'),
    challan_date: timestamp('challan_date', { withTimezone: true }),
    ewaybill_number: text('ewaybill_number'),
    ewaybill_date: timestamp('ewaybill_date', { withTimezone: true }),

    status: varchar('status', { length: 20 }).default('uploaded').notNull(), // uploaded, superseded

    uploaded_by: uuid('uploaded_by').references(() => users.id).notNull(),
    uploaded_at: timestamp('uploaded_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => {
    return {
        challanOrderIdx: index('order_challans_order_idx').on(table.order_id),
    };
});

export const bolnaCalls = pgTable('bolna_calls', {
    id: varchar('id', { length: 255 }).primaryKey(),
    bolna_call_id: varchar('bolna_call_id', { length: 255 }).notNull().unique(),
    lead_id: varchar('lead_id', { length: 255 }).references(() => leads.id),
    status: varchar('status', { length: 20 }).default('initiated').notNull(),
    current_phase: varchar('current_phase', { length: 100 }),
    started_at: timestamp('started_at', { withTimezone: true }),
    ended_at: timestamp('ended_at', { withTimezone: true }),
    transcript_chunk: text('transcript_chunk'),
    chunk_received_at: timestamp('chunk_received_at', { withTimezone: true }),
    full_transcript: text('full_transcript'),
    transcript_fetched_at: timestamp('transcript_fetched_at', { withTimezone: true }),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => {
    return {
        bolnaCallIdIdx: index('bolna_calls_bolna_call_id_idx').on(table.bolna_call_id),
        leadIdIdx: index('bolna_calls_lead_id_idx').on(table.lead_id),
        statusIdx: index('bolna_calls_status_idx').on(table.status),
        startedAtIdx: index('bolna_calls_started_at_idx').on(table.started_at),
    };
});

// --- RELATIONS ---

export const usersRelations = relations(users, ({ many }) => ({
    productsCreated: many(productCatalog, { relationName: 'product_creator' }),
    oemsCreated: many(oems, { relationName: 'oem_creator' }),
    inventoryCreated: many(inventory, { relationName: 'inventory_creator' }),
    leadsUploaded: many(leads, { relationName: 'lead_uploader' }),
    assignmentsReceived: many(leadAssignments, { relationName: 'assigned_to_user' }),
    assignmentsGiven: many(leadAssignments, { relationName: 'assigned_by_user' }),
    dealsCreated: many(deals, { relationName: 'deal_creator' }),
    approvalsHandled: many(approvals, { relationName: 'approver_user' }),
    slasAssigned: many(slas, { relationName: 'sla_assigned' }),
    slasEscalatedTo: many(slas, { relationName: 'sla_escalated' }),
    leadsQualified: many(leads, { relationName: 'qualified_by_user' }),
    pdiInspections: many(pdiRecords, { relationName: 'pdi_service_engineer' }),
}));

export const productCatalogRelations = relations(productCatalog, ({ one, many }) => ({
    creator: one(users, { fields: [productCatalog.created_by], references: [users.id], relationName: 'product_creator' }),
    inventories: many(inventory),
}));

export const oemsRelations = relations(oems, ({ one, many }) => ({
    creator: one(users, { fields: [oems.created_by], references: [users.id], relationName: 'oem_creator' }),
    contacts: many(oemContacts),
}));

export const oemContactsRelations = relations(oemContacts, ({ one }) => ({
    oem: one(oems, { fields: [oemContacts.oem_id], references: [oems.id] }),
}));

export const inventoryRelations = relations(inventory, ({ one }) => ({
    product: one(productCatalog, { fields: [inventory.product_id], references: [productCatalog.id] }),
    creator: one(users, { fields: [inventory.created_by], references: [users.id], relationName: 'inventory_creator' }),
}));

export const leadsRelations = relations(leads, ({ one, many }) => ({
    uploader: one(users, { fields: [leads.uploader_id], references: [users.id], relationName: 'lead_uploader' }),
    qualifiedBy: one(users, { fields: [leads.qualified_by], references: [users.id], relationName: 'qualified_by_user' }),
    assignments: many(leadAssignments),
    deals: many(deals),
    bolnaCalls: many(bolnaCalls),
}));

export const leadAssignmentsRelations = relations(leadAssignments, ({ one }) => ({
    lead: one(leads, { fields: [leadAssignments.lead_id], references: [leads.id] }),
    owner: one(users, { fields: [leadAssignments.lead_owner], references: [users.id], relationName: 'assigned_to_user' }),
    assigner: one(users, { fields: [leadAssignments.assigned_by], references: [users.id], relationName: 'assigned_by_user' }),
    actor: one(users, { fields: [leadAssignments.lead_actor], references: [users.id], relationName: 'lead_actor_user' }),
    actorAssigner: one(users, { fields: [leadAssignments.actor_assigned_by], references: [users.id], relationName: 'actor_assigned_by_user' }),
}));

export const dealsRelations = relations(deals, ({ one, many }) => ({
    lead: one(leads, { fields: [deals.lead_id], references: [leads.id] }),
    creator: one(users, { fields: [deals.created_by], references: [users.id], relationName: 'deal_creator' }),
    approvals: many(approvals),
}));

export const approvalsRelations = relations(approvals, ({ one }) => ({
    approver: one(users, { fields: [approvals.approver_id], references: [users.id], relationName: 'approver_user' }),
}));

export const slasRelations = relations(slas, ({ one }) => ({
    assignedUser: one(users, { fields: [slas.assigned_to], references: [users.id], relationName: 'sla_assigned' }),
    escalatedUser: one(users, { fields: [slas.escalated_to], references: [users.id], relationName: 'sla_escalated' }),
}));

export const provisionsRelations = relations(provisions, ({ one, many }) => ({
    oem: one(oems, { fields: [provisions.oem_id], references: [oems.id] }),
    creator: one(users, { fields: [provisions.created_by], references: [users.id] }),
    orders: many(orders),
}));

export const ordersRelations = relations(orders, ({ one }) => ({
    provision: one(provisions, { fields: [orders.provision_id], references: [provisions.id] }),
    oem: one(oems, { fields: [orders.oem_id], references: [oems.id] }),
    creator: one(users, { fields: [orders.created_by], references: [users.id] }),
    account: one(accounts, { fields: [orders.account_id], references: [accounts.id] }),
}));

export const oemInventoryForPDIRelations = relations(oemInventoryForPDI, ({ one }) => ({
    inventory: one(inventory, { fields: [oemInventoryForPDI.inventory_id], references: [inventory.id] }),
    oem: one(oems, { fields: [oemInventoryForPDI.oem_id], references: [oems.id] }),
    pdiRecord: one(pdiRecords, { fields: [oemInventoryForPDI.pdi_record_id], references: [pdiRecords.id] }),
}));

export const pdiRecordsRelations = relations(pdiRecords, ({ one }) => ({
    oemInventory: one(oemInventoryForPDI, { fields: [pdiRecords.oem_inventory_id], references: [oemInventoryForPDI.id] }),
    serviceEngineer: one(users, { fields: [pdiRecords.service_engineer_id], references: [users.id], relationName: 'pdi_service_engineer' }),
}));

export const assignmentChangeLogsRelations = relations(assignmentChangeLogs, ({ one }) => ({
    lead: one(leads, { fields: [assignmentChangeLogs.lead_id], references: [leads.id] }),
    oldUser: one(users, { fields: [assignmentChangeLogs.old_user_id], references: [users.id] }),
    newUser: one(users, { fields: [assignmentChangeLogs.new_user_id], references: [users.id] }),
    changedBy: one(users, { fields: [assignmentChangeLogs.changed_by], references: [users.id] }),
}));

export const orderDisputesRelations = relations(orderDisputes, ({ one }) => ({
    order: one(orders, { fields: [orderDisputes.order_id], references: [orders.id] }),
    resolvedBy: one(users, { fields: [orderDisputes.resolved_by], references: [users.id] }),
    creator: one(users, { fields: [orderDisputes.created_by], references: [users.id] }),
}));

export const accountsRelations = relations(accounts, ({ many }) => ({
    orders: many(orders),
}));

export const bolnaCallsRelations = relations(bolnaCalls, ({ one }) => ({
    lead: one(leads, { fields: [bolnaCalls.lead_id], references: [leads.id] }),
}));

export const intellicarPulls = pgTable('intellicar_pulls', {
    id: varchar('id', { length: 255 }).primaryKey(), // e.g. INTC-YYYYMMDD-001
    endpoint: text('endpoint').notNull(),            // e.g. /api/xxx/vehicledata
    status: varchar('status', { length: 20 }).notNull(), // success | failed
    pulled_at: timestamp('pulled_at', { withTimezone: true }).defaultNow().notNull(),
    payload: jsonb('payload'),                       // raw response
    error: text('error'),                            // error message if failed
});

// --- INTELLICAR (TELEMATICS) ---

/**
 * One row per sync run (every 5 minutes).
 * CEO dashboard reads this to show: last run status, duration, errors, vehicles updated.
 */
export const intellicarSyncRuns = pgTable('intellicar_sync_runs', {
    id: uuid('id').defaultRandom().primaryKey(),
    trigger: varchar('trigger', { length: 20 }).notNull().default('cron'), // cron | manual | backfill
    status: varchar('status', { length: 20 }).notNull().default('running'), // running | success | partial | failed
    started_at: timestamp('started_at', { withTimezone: true }).defaultNow().notNull(),
    finished_at: timestamp('finished_at', { withTimezone: true }),
    window_start_ms: bigint('window_start_ms', { mode: 'number' }),
    window_end_ms: bigint('window_end_ms', { mode: 'number' }),
    vehicles_discovered: integer('vehicles_discovered').notNull().default(0),
    vehicles_updated: integer('vehicles_updated').notNull().default(0),
    endpoints_called: integer('endpoints_called').notNull().default(0),
    records_written: integer('records_written').notNull().default(0),
    errors_count: integer('errors_count').notNull().default(0),
    errors: jsonb('errors'), // array of { endpoint, vehicleno?, message }
    app_version: text('app_version'),
}, (table) => ({
    intellicarSyncRunsStartedAtIdx: index('intellicar_sync_runs_started_at_idx').on(table.started_at),
    intellicarSyncRunsStatusStartedIdx: index('intellicar_sync_runs_status_started_idx').on(table.status, table.started_at),
}));

/**
 * Optional but very useful for debugging:
 * One row per (sync_run, endpoint, vehicle) call.
 */
export const intellicarSyncRunItems = pgTable('intellicar_sync_run_items', {
    id: serial('id').primaryKey(),
    sync_run_id: uuid('sync_run_id').references(() => intellicarSyncRuns.id, { onDelete: 'cascade' }).notNull(),
    endpoint: text('endpoint').notNull(), // e.g. /api/standard/getlastgpsstatus
    vehicleno: text('vehicleno'),
    status: varchar('status', { length: 20 }).notNull(), // success | failed
    pulled_at: timestamp('pulled_at', { withTimezone: true }).defaultNow().notNull(),
    error: text('error'),
    payload: jsonb('payload'), // keep compact; full raw still stored in intellicar_pulls
}, (table) => ({
    intellicarSyncRunItemsRunIdx: index('intellicar_sync_run_items_run_idx').on(table.sync_run_id),
    intellicarSyncRunItemsEndpointIdx: index('intellicar_sync_run_items_endpoint_idx').on(table.endpoint, table.pulled_at),
    intellicarSyncRunItemsVehicleEndpointIdx: index('intellicar_sync_run_items_vehicle_endpoint_idx').on(table.vehicleno, table.endpoint, table.pulled_at),
}));

/**
 * Mapping: vehicleno -> deviceno (from listvehicledevicemapping)
 */
export const intellicarVehicleDeviceMap = pgTable('intellicar_vehicle_device_map', {
    vehicleno: text('vehicleno').primaryKey(),
    deviceno: text('deviceno').notNull(),
    active: boolean('active').notNull().default(true),
    first_seen_at: timestamp('first_seen_at', { withTimezone: true }).defaultNow().notNull(),
    last_seen_at: timestamp('last_seen_at', { withTimezone: true }).defaultNow().notNull(),
    last_sync_run_id: uuid('last_sync_run_id').references(() => intellicarSyncRuns.id),
    raw: jsonb('raw'),
}, (table) => ({
    intellicarVehicleDeviceMapDevicenoIdx: index('intellicar_vehicle_device_map_deviceno_idx').on(table.deviceno),
    intellicarVehicleDeviceMapActiveIdx: index('intellicar_vehicle_device_map_active_idx').on(table.active),
    intellicarVehicleDeviceMapLastSeenIdx: index('intellicar_vehicle_device_map_last_seen_idx').on(table.last_seen_at),
}));

/**
 * Latest GPS snapshot per vehicle (from getlastgpsstatus)
 */
export const intellicarGpsLatest = pgTable('intellicar_gps_latest', {
    vehicleno: text('vehicleno').primaryKey().references(() => intellicarVehicleDeviceMap.vehicleno, { onDelete: 'cascade' }),

    commtime_epoch: bigint('commtime_epoch', { mode: 'number' }).notNull(),
    lat: decimal('lat', { precision: 10, scale: 7 }).notNull(),
    lng: decimal('lng', { precision: 10, scale: 7 }).notNull(),
    alti: decimal('alti', { precision: 10, scale: 2 }),
    devbattery: decimal('devbattery', { precision: 10, scale: 2 }),
    vehbattery: decimal('vehbattery', { precision: 10, scale: 2 }),
    speed: decimal('speed', { precision: 10, scale: 2 }),
    heading: decimal('heading', { precision: 10, scale: 2 }),
    ignstatus: integer('ignstatus'),
    mobili: integer('mobili'),
    dout_1: integer('dout_1'),
    dout_2: integer('dout_2'),

    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    last_sync_run_id: uuid('last_sync_run_id').references(() => intellicarSyncRuns.id),
    raw: jsonb('raw').notNull(),
}, (table) => ({
    intellicarGpsLatestUpdatedAtIdx: index('intellicar_gps_latest_updated_at_idx').on(table.updated_at),
    intellicarGpsLatestCommtimeIdx: index('intellicar_gps_latest_commtime_idx').on(table.commtime_epoch),
}));

/**
 * Latest CAN snapshot per vehicle (from getlatestcan)
 */
export const intellicarCanLatest = pgTable('intellicar_can_latest', {
    vehicleno: text('vehicleno').primaryKey().references(() => intellicarVehicleDeviceMap.vehicleno, { onDelete: 'cascade' }),

    soc_value: decimal('soc_value', { precision: 10, scale: 2 }),
    soc_ts_epoch: bigint('soc_ts_epoch', { mode: 'number' }),

    battery_temp_value: decimal('battery_temp_value', { precision: 10, scale: 2 }),
    battery_temp_ts_epoch: bigint('battery_temp_ts_epoch', { mode: 'number' }),

    battery_voltage_value: decimal('battery_voltage_value', { precision: 10, scale: 2 }),
    battery_voltage_ts_epoch: bigint('battery_voltage_ts_epoch', { mode: 'number' }),

    current_value: decimal('current_value', { precision: 10, scale: 2 }),
    current_ts_epoch: bigint('current_ts_epoch', { mode: 'number' }),

    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    last_sync_run_id: uuid('last_sync_run_id').references(() => intellicarSyncRuns.id),
    raw: jsonb('raw').notNull(),
}, (table) => ({
    intellicarCanLatestUpdatedAtIdx: index('intellicar_can_latest_updated_at_idx').on(table.updated_at),
}));

/**
 * Latest Fuel snapshot per vehicle (from getlastfuelstatus)
 */
export const intellicarFuelLatest = pgTable('intellicar_fuel_latest', {
    vehicleno: text('vehicleno').primaryKey().references(() => intellicarVehicleDeviceMap.vehicleno, { onDelete: 'cascade' }),

    fueltime_epoch: bigint('fueltime_epoch', { mode: 'number' }).notNull(),
    fuellevel_pct: decimal('fuellevel_pct', { precision: 10, scale: 2 }),
    fuellevel_litres: decimal('fuellevel_litres', { precision: 12, scale: 3 }),

    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    last_sync_run_id: uuid('last_sync_run_id').references(() => intellicarSyncRuns.id),
    raw: jsonb('raw').notNull(),
}, (table) => ({
    intellicarFuelLatestUpdatedAtIdx: index('intellicar_fuel_latest_updated_at_idx').on(table.updated_at),
    intellicarFuelLatestFuelTimeIdx: index('intellicar_fuel_latest_fueltime_idx').on(table.fueltime_epoch),
}));

export const intellicarGpsHistory = pgTable('intellicar_gps_history', {
    id: serial('id').primaryKey(),
    vehicleno: text('vehicleno').notNull().references(() => intellicarVehicleDeviceMap.vehicleno, { onDelete: 'cascade' }),
    commtime_ms: bigint('commtime_ms', { mode: 'number' }).notNull(),
    lat: decimal('lat', { precision: 10, scale: 7 }).notNull(),
    lng: decimal('lng', { precision: 10, scale: 7 }).notNull(),
    alti: decimal('alti', { precision: 10, scale: 2 }),
    speed: decimal('speed', { precision: 10, scale: 2 }),
    heading: decimal('heading', { precision: 10, scale: 2 }),
    ignstatus: integer('ignstatus'),
    mobili: integer('mobili'),
    devbattery: decimal('devbattery', { precision: 10, scale: 2 }),
    vehbattery: decimal('vehbattery', { precision: 10, scale: 2 }),
    raw: jsonb('raw'),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    intellicarGpsHistoryVehTimeUnique: uniqueIndex('intellicar_gps_history_veh_time_unique').on(table.vehicleno, table.commtime_ms),
    intellicarGpsHistoryVehTimeIdx: index('intellicar_gps_history_veh_time_idx').on(table.vehicleno, table.commtime_ms),
}));

export const intellicarCanHistory = pgTable('intellicar_can_history', {
    id: serial('id').primaryKey(),
    vehicleno: text('vehicleno').notNull().references(() => intellicarVehicleDeviceMap.vehicleno, { onDelete: 'cascade' }),
    time_ms: bigint('time_ms', { mode: 'number' }).notNull(),
    soc: decimal('soc', { precision: 10, scale: 2 }),
    soh: decimal('soh', { precision: 10, scale: 2 }),
    battery_temp: decimal('battery_temp', { precision: 10, scale: 2 }),
    battery_voltage: decimal('battery_voltage', { precision: 10, scale: 2 }),
    current: decimal('current', { precision: 10, scale: 2 }),
    charge_cycle: integer('charge_cycle'),
    raw: jsonb('raw'),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    intellicarCanHistoryVehTimeUnique: uniqueIndex('intellicar_can_history_veh_time_unique').on(table.vehicleno, table.time_ms),
    intellicarCanHistoryVehTimeIdx: index('intellicar_can_history_veh_time_idx').on(table.vehicleno, table.time_ms),
}));

export const intellicarFuelHistory = pgTable('intellicar_fuel_history', {
    id: serial('id').primaryKey(),
    vehicleno: text('vehicleno').notNull().references(() => intellicarVehicleDeviceMap.vehicleno, { onDelete: 'cascade' }),
    time_ms: bigint('time_ms', { mode: 'number' }).notNull(),
    in_litres: boolean('in_litres').notNull(),
    value: decimal('value', { precision: 12, scale: 3 }),
    raw: jsonb('raw'),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    intellicarFuelHistoryVehTimeUnique: uniqueIndex('intellicar_fuel_history_veh_time_unique').on(table.vehicleno, table.time_ms, table.in_litres),
    intellicarFuelHistoryVehTimeIdx: index('intellicar_fuel_history_veh_time_idx').on(table.vehicleno, table.time_ms),
}));

export const intellicarDistanceWindows = pgTable('intellicar_distance_windows', {
    id: serial('id').primaryKey(),
    vehicleno: text('vehicleno').notNull().references(() => intellicarVehicleDeviceMap.vehicleno, { onDelete: 'cascade' }),
    start_ms: bigint('start_ms', { mode: 'number' }).notNull(),
    end_ms: bigint('end_ms', { mode: 'number' }).notNull(),
    distance: decimal('distance', { precision: 12, scale: 3 }),
    raw: jsonb('raw'),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    intellicarDistanceWindowsVehRangeUnique: uniqueIndex('intellicar_distance_windows_veh_range_unique').on(table.vehicleno, table.start_ms, table.end_ms),
    intellicarDistanceWindowsVehStartIdx: index('intellicar_distance_windows_veh_start_idx').on(table.vehicleno, table.start_ms),
}));

export const intellicarHistoryCheckpoints = pgTable('intellicar_history_checkpoints', {
    id: serial('id').primaryKey(),
    vehicleno: text('vehicleno').notNull().references(() => intellicarVehicleDeviceMap.vehicleno, { onDelete: 'cascade' }),
    dataset: text('dataset').notNull(), // 'gps', 'can', 'fuel_pct', 'fuel_litres', 'distance'
    last_synced_end_ms: bigint('last_synced_end_ms', { mode: 'number' }).notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    intellicarHistoryCheckpointsVehDatasetUnique: uniqueIndex('intellicar_history_checkpoints_veh_dataset_unique').on(table.vehicleno, table.dataset),
    intellicarHistoryCheckpointsDatasetEndIdx: index('intellicar_history_checkpoints_dataset_end_idx').on(table.dataset, table.last_synced_end_ms),
    intellicarHistoryCheckpointsVehIdx: index('intellicar_history_checkpoints_veh_idx').on(table.vehicleno),
}));

export const intellicarHistoryJobControl = pgTable('intellicar_history_job_control', {
    id: integer('id').primaryKey().default(1),
    status: text('status', { enum: ['running', 'paused', 'idle'] }).notNull().default('idle'),
    historical_start_ms: bigint('historical_start_ms', { mode: 'number' }).notNull().default(1725148800000), // 2025-09-01T00:00:00Z
    max_windows_per_run: integer('max_windows_per_run').notNull().default(48),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
