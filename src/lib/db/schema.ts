import { pgTable, text, timestamp, integer, boolean, varchar, decimal, jsonb, uuid } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// --- FOUNDATION ---

export const users = pgTable('users', {
    id: uuid('id').primaryKey(),
    name: text('name').notNull(),
    email: text('email').notNull().unique(),
    role: varchar('role', { length: 50 }).notNull(), // sales_manager, sales_head, business_head, ceo, finance_controller, inventory_manager, service_engineer, sales_order_manager
    status: varchar('status', { length: 20 }).default('active'),
    full_name: text('full_name'),
    phone: text('phone'),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// --- PHASE 0: MVP ---

export const productCatalog = pgTable('product_catalog', {
    id: varchar('id', { length: 255 }).primaryKey(), // PCAT-YYYYMMDD-SEQ
    hsn_code: varchar('hsn_code', { length: 8 }).notNull(),
    asset_category: varchar('asset_category', { length: 20 }).notNull(), // 2W, 3W, Inverter
    asset_type: varchar('asset_type', { length: 50 }).notNull(), // Charger, Battery, SOC, Harness, Inverter
    model_type: text('model_type').notNull(),
    is_serialized: boolean('is_serialized').default(true).notNull(),
    warranty_months: integer('warranty_months').notNull(),
    status: varchar('status', { length: 20 }).default('active').notNull(),
    created_by: uuid('created_by').references(() => users.id),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    disabled_at: timestamp('disabled_at', { withTimezone: true }), // Added SOP 7.1
    disabled_by: uuid('disabled_by').references(() => users.id),   // Added SOP 7.1
});

export const oems = pgTable('oems', {
    id: varchar('id', { length: 255 }).primaryKey(), // OEM-YYYYMMDD-SEQ
    business_entity_name: text('business_entity_name').notNull(),
    gstin: varchar('gstin', { length: 15 }).notNull().unique(),
    pan: varchar('pan', { length: 10 }), // Added SOP 7.2
    cin: varchar('cin', { length: 21 }), // Made optional as PAN is preferred
    bank_account_number: text('bank_account_number').notNull(),
    ifsc_code: varchar('ifsc_code', { length: 11 }).notNull(),
    bank_proof_url: text('bank_proof_url').notNull(),
    status: varchar('status', { length: 20 }).default('active').notNull(),
    created_by: uuid('created_by').references(() => users.id),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const oemContacts = pgTable('oem_contacts', {
    id: varchar('id', { length: 255 }).primaryKey(), // OEM_ID-ROLE_SEQ
    oem_id: varchar('oem_id', { length: 255 }).references(() => oems.id).notNull(),
    contact_role: varchar('contact_role', { length: 50 }).notNull(), // sales_head, sales_manager, finance_manager
    contact_name: text('contact_name').notNull(),
    contact_phone: varchar('contact_phone', { length: 20 }).notNull(),
    contact_email: text('contact_email').notNull(),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const inventory = pgTable('inventory', {
    id: varchar('id', { length: 255 }).primaryKey(), // INV-YYYYMMDD-SEQ
    product_id: varchar('product_id', { length: 255 }).references(() => productCatalog.id).notNull(),
    oem_id: varchar('oem_id', { length: 255 }).references(() => oems.id).notNull(),

    // Denormalized Product Details (SOP 7.4)
    oem_name: text('oem_name'), // Added
    asset_category: text('asset_category'), // Added
    asset_type: text('asset_type'), // Added
    model_type: text('model_type'), // Added

    // Asset Identifiers
    serial_number: varchar('serial_number', { length: 255 }),
    batch_number: varchar('batch_number', { length: 255 }), // Added SOP 7.4
    is_serialized: boolean('is_serialized').default(true).notNull(),
    iot_imei_no: varchar('iot_imei_no', { length: 255 }),

    // Purchase Details
    quantity: integer('quantity').default(1).notNull(),
    warranty_months: integer('warranty_months').notNull(),
    manufacturing_date: timestamp('manufacturing_date'), // Added SOP 7.4
    expiry_date: timestamp('expiry_date'), // Added SOP 7.4

    // Invoice / Challan
    oem_invoice_number: text('oem_invoice_number'), // Renamed from invoice_number
    oem_invoice_date: timestamp('oem_invoice_date'), // Renamed from invoice_date
    oem_invoice_url: text('oem_invoice_url'), // Added SOP 7.4
    challan_number: text('challan_number'),
    challan_date: timestamp('challan_date'),

    // Documents
    product_manual_url: text('product_manual_url'), // Added SOP 7.4
    warranty_document_url: text('warranty_document_url'), // Added SOP 7.4

    // Financials
    inventory_amount: decimal('inventory_amount', { precision: 12, scale: 2 }).notNull(),
    gst_percent: integer('gst_percent').notNull(),
    gst_amount: decimal('gst_amount', { precision: 12, scale: 2 }).notNull(),
    final_amount: decimal('final_amount', { precision: 12, scale: 2 }).notNull(),

    status: varchar('status', { length: 20 }).default('available').notNull(), // available, pdi_pending, sold, defective
    warehouse_location: text('warehouse_location'), // Added SOP 7.4
    uploaded_by: uuid('uploaded_by').references(() => users.id),
    uploaded_at: timestamp('uploaded_at', { withTimezone: true }).defaultNow().notNull(),
});

// --- DEALER SALES ---

export const leads = pgTable('leads', {
    id: varchar('id', { length: 255 }).primaryKey(), // LEAD-YYYYMMDD-SEQ
    lead_source: varchar('lead_source', { length: 50 }).notNull(),
    owner_name: text('owner_name').notNull(),
    owner_contact: varchar('owner_contact', { length: 20 }).notNull(),
    state: varchar('state', { length: 100 }).notNull(),
    city: varchar('city', { length: 100 }).notNull(),
    interest_level: varchar('interest_level', { length: 20 }).notNull(), // cold, warm, hot
    interested_in: jsonb('interested_in'), // Array of product IDs
    lead_status: varchar('lead_status', { length: 50 }).default('new').notNull(),
    uploader_id: varchar('uploader_id', { length: 255 }).references(() => users.id),
    qualified_by: uuid('qualified_by').references(() => users.id),
    qualified_at: timestamp('qualified_at'),
    qualification_notes: text('qualification_notes'),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const leadAssignments = pgTable('lead_assignments', {
    id: varchar('id', { length: 255 }).primaryKey(),
    lead_id: varchar('lead_id', { length: 255 }).references(() => leads.id).notNull(),
    lead_owner: uuid('lead_owner').references(() => users.id).notNull(),
    assigned_by: uuid('assigned_by').references(() => users.id).notNull(),
    assigned_at: timestamp('assigned_at', { withTimezone: true }).defaultNow().notNull(),

    // Lead Actor (SOP 3.1)
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
    id: varchar('id', { length: 255 }).primaryKey(), // DEAL-YYYYMMDD-SEQ
    lead_id: varchar('lead_id', { length: 255 }).references(() => leads.id).notNull(),
    products: jsonb('products').notNull(), // Array of { product_id, quantity, unit_price, gst_percent }
    line_total: decimal('line_total', { precision: 12, scale: 2 }).notNull(),
    gst_amount: decimal('gst_amount', { precision: 12, scale: 2 }).notNull(),
    transportation_cost: decimal('transportation_cost', { precision: 12, scale: 2 }).default('0').notNull(),
    transportation_gst_percent: integer('transportation_gst_percent').default(18).notNull(),
    total_payable: decimal('total_payable', { precision: 12, scale: 2 }).notNull(),
    deal_status: varchar('deal_status', { length: 50 }).notNull(), // pending_approval_l1, pending_approval_l2, pending_approval_l3, payment_awaited, converted, rejected, expired
    payment_term: varchar('payment_term', { length: 20 }).notNull(), // cash, credit
    credit_period_months: integer('credit_period_months'),
    is_immutable: boolean('is_immutable').default(false).notNull(),
    created_by: uuid('created_by').references(() => users.id),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const approvals = pgTable('approvals', {
    id: varchar('id', { length: 255 }).primaryKey(),
    entity_type: varchar('entity_type', { length: 50 }).notNull(), // deal, pi
    entity_id: varchar('entity_id', { length: 255 }).notNull(),
    level: integer('level').notNull(), // 1, 2, 3
    approver_role: varchar('approver_role', { length: 50 }).notNull(),
    status: varchar('status', { length: 20 }).default('pending').notNull(), // pending, approve, reject
    approver_id: uuid('approver_id').references(() => users.id),
    decision_at: timestamp('decision_at'),
    rejection_reason: text('rejection_reason'),
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
    id: varchar('id', { length: 255 }).primaryKey(),
    provision_id: varchar('provision_id', { length: 255 }).notNull(),
    product_id: varchar('product_id', { length: 255 }).references(() => productCatalog.id).notNull(),
    oem_id: varchar('oem_id', { length: 255 }).references(() => oems.id).notNull(), // Added oem_id
    serial_number: varchar('serial_number', { length: 255 }),
    pdi_status: varchar('pdi_status', { length: 20 }).default('pending').notNull(), // pending, completed
    pdi_record_id: varchar('pdi_record_id', { length: 255 }),
    inventory_id: varchar('inventory_id', { length: 255 }).references(() => inventory.id), // Added missing link to inventory
});

export const pdiRecords = pgTable('pdi_records', {
    id: varchar('id', { length: 255 }).primaryKey(),
    oem_inventory_id: varchar('oem_inventory_id', { length: 255 }).references(() => oemInventoryForPDI.id).notNull(),
    provision_id: varchar('provision_id', { length: 255 }).notNull(),
    iot_imei_no: varchar('iot_imei_no', { length: 255 }),
    physical_condition: text('physical_condition').notNull(),
    discharging_connector: varchar('discharging_connector', { length: 20 }).notNull(),
    charging_connector: varchar('charging_connector', { length: 20 }).notNull(),
    productor_sticker: varchar('productor_sticker', { length: 50 }).notNull(),
    voltage: decimal('voltage', { precision: 5, scale: 2 }),
    soc: integer('soc'),
    latitude: decimal('latitude', { precision: 10, scale: 6 }).notNull(),
    longitude: decimal('longitude', { precision: 10, scale: 6 }).notNull(),
    pdi_status: varchar('pdi_status', { length: 20 }).notNull(), // pass, fail
    failure_reason: text('failure_reason'),

    // Battery Specific Fields (Mandatory for Batteries)
    capacity_ah: decimal('capacity_ah', { precision: 6, scale: 2 }),
    resistance_mohm: decimal('resistance_mohm', { precision: 6, scale: 2 }),
    temperature_celsius: decimal('temperature_celsius', { precision: 5, scale: 2 }),

    // Media & Docs
    pdi_photos: jsonb('pdi_photos'), // Array of photo URLs
    product_manual_url: text('product_manual_url'),
    warranty_document_url: text('warranty_document_url'),
    service_engineer_id: uuid('service_engineer_id').references(() => users.id).notNull(),
    inspected_at: timestamp('inspected_at').notNull(),
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
    id: varchar('id', { length: 255 }).primaryKey(), // ACC-YYYYMMDD-SEQ
    business_name: text('business_name').notNull(),
    owner_name: text('owner_name').notNull(),
    email: text('email'),
    phone: varchar('phone', { length: 20 }),
    gstin: varchar('gstin', { length: 15 }),
    billing_address: text('billing_address'),
    shipping_address: text('shipping_address'),
    status: varchar('status', { length: 20 }).default('active').notNull(),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    last_order_fulfilled_at: timestamp('last_order_fulfilled_at'), // SOP 3.6 Reorder Tracking
});

// --- PROCUREMENT ---

export const provisions = pgTable('provisions', {
    id: varchar('id', { length: 255 }).primaryKey(), // PROV-YYYYMMDD-SEQ
    oem_id: varchar('oem_id', { length: 255 }).references(() => oems.id).notNull(),
    oem_name: text('oem_name').notNull(),
    products: jsonb('products').notNull(), // Array of { product_id, quantity }
    expected_delivery_date: timestamp('expected_delivery_date').notNull(),
    status: varchar('status', { length: 20 }).default('pending').notNull(), // pending, acknowledged, in_production, ready_for_pdi, completed, cancelled
    remarks: text('remarks'),
    created_by: uuid('created_by').references(() => users.id).notNull(),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const orders = pgTable('orders', {
    id: varchar('id', { length: 255 }).primaryKey(), // ORD-YYYYMMDD-SEQ
    provision_id: varchar('provision_id', { length: 255 }).references(() => provisions.id).notNull(),
    oem_id: varchar('oem_id', { length: 255 }).references(() => oems.id).notNull(),
    account_id: varchar('account_id', { length: 255 }).references(() => accounts.id), // Added Link to Account

    // Order items (MUST be PDI Pass)
    order_items: jsonb('order_items').notNull(), // Array of { inventory_id, serial_number, amount }
    total_amount: decimal('total_amount', { precision: 12, scale: 2 }).notNull(),

    payment_term: varchar('payment_term', { length: 20 }).notNull(), // advance, credit
    credit_period_days: integer('credit_period_days'),

    // PI
    pi_url: text('pi_url'),
    pi_amount: decimal('pi_amount', { precision: 12, scale: 2 }),

    // Payment
    payment_status: varchar('payment_status', { length: 20 }).default('unpaid').notNull(), // unpaid, partial, paid
    payment_amount: decimal('payment_amount', { precision: 12, scale: 2 }),
    payment_mode: varchar('payment_mode', { length: 50 }), // cash, bank_transfer, cheque, online
    transaction_id: text('transaction_id'),
    payment_date: timestamp('payment_date'),

    // Delivery
    expected_delivery_date: timestamp('expected_delivery_date').notNull(),
    actual_delivery_date: timestamp('actual_delivery_date'),

    // GRN
    grn_id: text('grn_id'),
    grn_date: timestamp('grn_date'),
    reorder_tat_days: integer('reorder_tat_days'), // SOP 3.6

    // Status
    order_status: varchar('order_status', { length: 50 }).default('pi_awaited').notNull(), // pi_awaited, pi_approval_pending, pi_approved, pi_rejected, payment_made, in_transit, delivered, cancelled

    created_by: uuid('created_by').references(() => users.id).notNull(),
    created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// --- RELATIONS ---

export const usersRelations = relations(users, ({ many }) => ({
    productsCreated: many(productCatalog),
    oemsCreated: many(oems),
    inventoryUploaded: many(inventory),
    leadsUploaded: many(leads),
    assignmentsReceived: many(leadAssignments, { relationName: 'assigned_to_user' }),
    assignmentsGiven: many(leadAssignments, { relationName: 'assigned_by_user' }),
    dealsCreated: many(deals),
    approvalsHandled: many(approvals),
    slasAssigned: many(slas, { relationName: 'sla_assigned' }),
    slasEscalatedTo: many(slas, { relationName: 'sla_escalated' }),
    leadsQualified: many(leads, { relationName: 'qualified_by_user' }),
    pdiInspections: many(pdiRecords, { relationName: 'pdi_service_engineer' }),
}));

export const productCatalogRelations = relations(productCatalog, ({ one, many }) => ({
    creator: one(users, { fields: [productCatalog.created_by], references: [users.id] }),
    inventories: many(inventory),
}));

export const oemsRelations = relations(oems, ({ one, many }) => ({
    creator: one(users, { fields: [oems.created_by], references: [users.id] }),
    contacts: many(oemContacts),
}));

export const oemContactsRelations = relations(oemContacts, ({ one }) => ({
    oem: one(oems, { fields: [oemContacts.oem_id], references: [oems.id] }),
}));

export const inventoryRelations = relations(inventory, ({ one }) => ({
    product: one(productCatalog, { fields: [inventory.product_id], references: [productCatalog.id] }),
    uploader: one(users, { fields: [inventory.uploaded_by], references: [users.id] }),
}));

export const leadsRelations = relations(leads, ({ one, many }) => ({
    uploader: one(users, { fields: [leads.uploader_id], references: [users.id] }),
    qualifiedBy: one(users, { fields: [leads.qualified_by], references: [users.id], relationName: 'qualified_by_user' }),
    assignments: many(leadAssignments),
    deals: many(deals),
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
    creator: one(users, { fields: [deals.created_by], references: [users.id] }),
    approvals: many(approvals),
}));

export const approvalsRelations = relations(approvals, ({ one }) => ({
    approver: one(users, { fields: [approvals.approver_id], references: [users.id] }),
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

export const oemInventoryForPDIRelations = relations(oemInventoryForPDI, ({ one, many }) => ({
    product: one(productCatalog, { fields: [oemInventoryForPDI.product_id], references: [productCatalog.id] }),
    oem: one(oems, { fields: [oemInventoryForPDI.oem_id], references: [oems.id] }),
    // provision relation could be added if provisions table is defined and we want to link explicitly, though id is stored
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
    assignedTo: one(users, { fields: [orderDisputes.assigned_to], references: [users.id] }), // Assigned to resolve
    resolvedBy: one(users, { fields: [orderDisputes.resolved_by], references: [users.id] }),
    creator: one(users, { fields: [orderDisputes.created_by], references: [users.id] }),
}));

export const accountsRelations = relations(accounts, ({ many }) => ({
    orders: many(orders),
}));
