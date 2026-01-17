import { pgTable, text, timestamp, integer, boolean, varchar, decimal, jsonb, uuid } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// --- FOUNDATION ---

export const users = pgTable('users', {
    id: uuid('id').primaryKey(),
    name: text('name').notNull(),
    email: text('email').notNull().unique(),
    role: varchar('role', { length: 50 }).notNull(), // sales_manager, sales_head, business_head, ceo, finance_controller, inventory_manager, service_engineer, sales_order_manager
    clerk_id: varchar('clerk_id', { length: 255 }).unique(),
    status: varchar('status', { length: 20 }).default('active'),
    created_at: timestamp('created_at').defaultNow().notNull(),
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
    created_at: timestamp('created_at').defaultNow().notNull(),
    updated_at: timestamp('updated_at').defaultNow().notNull(),
});

export const oems = pgTable('oems', {
    id: varchar('id', { length: 255 }).primaryKey(), // OEM-YYYYMMDD-SEQ
    business_entity_name: text('business_entity_name').notNull(),
    gstin: varchar('gstin', { length: 15 }).notNull().unique(),
    cin: varchar('cin', { length: 21 }).notNull(),
    bank_account_number: text('bank_account_number').notNull(),
    ifsc_code: varchar('ifsc_code', { length: 11 }).notNull(),
    bank_proof_url: text('bank_proof_url').notNull(),
    status: varchar('status', { length: 20 }).default('active').notNull(),
    created_by: uuid('created_by').references(() => users.id),
    created_at: timestamp('created_at').defaultNow().notNull(),
});

export const oemContacts = pgTable('oem_contacts', {
    id: varchar('id', { length: 255 }).primaryKey(), // OEM_ID-ROLE_SEQ
    oem_id: varchar('oem_id', { length: 255 }).references(() => oems.id).notNull(),
    contact_role: varchar('contact_role', { length: 50 }).notNull(), // sales_head, sales_manager, finance_manager
    contact_name: text('contact_name').notNull(),
    contact_phone: varchar('contact_phone', { length: 20 }).notNull(),
    contact_email: text('contact_email').notNull(),
    created_at: timestamp('created_at').defaultNow().notNull(),
});

export const inventory = pgTable('inventory', {
    id: varchar('id', { length: 255 }).primaryKey(), // INV-YYYYMMDD-SEQ
    product_id: varchar('product_id', { length: 255 }).references(() => productCatalog.id).notNull(),
    serial_number: varchar('serial_number', { length: 255 }),
    is_serialized: boolean('is_serialized').default(true).notNull(),
    inventory_amount: decimal('inventory_amount', { precision: 12, scale: 2 }).notNull(),
    gst_percent: integer('gst_percent').notNull(),
    gst_amount: decimal('gst_amount', { precision: 12, scale: 2 }).notNull(),
    final_amount: decimal('final_amount', { precision: 12, scale: 2 }).notNull(),
    status: varchar('status', { length: 20 }).default('available').notNull(), // available, pdi_pending, sold, defective
    uploaded_by: uuid('uploaded_by').references(() => users.id),
    uploaded_at: timestamp('uploaded_at').defaultNow().notNull(),
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
    created_at: timestamp('created_at').defaultNow().notNull(),
    updated_at: timestamp('updated_at').defaultNow().notNull(),
});

export const leadAssignments = pgTable('lead_assignments', {
    id: varchar('id', { length: 255 }).primaryKey(),
    lead_id: varchar('lead_id', { length: 255 }).references(() => leads.id).notNull(),
    lead_owner: varchar('lead_owner', { length: 255 }).references(() => users.id).notNull(),
    assigned_by: varchar('assigned_by', { length: 255 }).references(() => users.id).notNull(),
    created_at: timestamp('created_at').defaultNow().notNull(),
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
    created_by: varchar('created_by', { length: 255 }).references(() => users.id),
    created_at: timestamp('created_at').defaultNow().notNull(),
    updated_at: timestamp('updated_at').defaultNow().notNull(),
});

export const approvals = pgTable('approvals', {
    id: varchar('id', { length: 255 }).primaryKey(),
    entity_type: varchar('entity_type', { length: 50 }).notNull(), // deal, pi
    entity_id: varchar('entity_id', { length: 255 }).notNull(),
    level: integer('level').notNull(), // 1, 2, 3
    approver_role: varchar('approver_role', { length: 50 }).notNull(),
    status: varchar('status', { length: 20 }).default('pending').notNull(), // pending, approve, reject
    approver_id: varchar('approver_id', { length: 255 }).references(() => users.id),
    decision_at: timestamp('decision_at'),
    rejection_reason: text('rejection_reason'),
    created_at: timestamp('created_at').defaultNow().notNull(),
});

export const slas = pgTable('slas', {
    id: varchar('id', { length: 255 }).primaryKey(),
    workflow_step: varchar('workflow_step', { length: 100 }).notNull(),
    entity_type: varchar('entity_type', { length: 50 }).notNull(),
    entity_id: varchar('entity_id', { length: 255 }).notNull(),
    assigned_to: varchar('assigned_to', { length: 255 }).references(() => users.id),
    sla_deadline: timestamp('sla_deadline').notNull(),
    status: varchar('status', { length: 20 }).default('active').notNull(), // active, completed, breached
    completed_at: timestamp('completed_at'),
    escalated_to: varchar('escalated_to', { length: 255 }).references(() => users.id),
    escalated_at: timestamp('escalated_at'),
    created_at: timestamp('created_at').defaultNow().notNull(),
});

// --- PDI ---

export const oemInventoryForPDI = pgTable('oem_inventory_for_pdi', {
    id: varchar('id', { length: 255 }).primaryKey(),
    provision_id: varchar('provision_id', { length: 255 }).notNull(),
    product_id: varchar('product_id', { length: 255 }).references(() => productCatalog.id).notNull(),
    serial_number: varchar('serial_number', { length: 255 }),
    pdi_status: varchar('pdi_status', { length: 20 }).default('pending').notNull(), // pending, completed
    pdi_record_id: varchar('pdi_record_id', { length: 255 }),
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
    product_manual_url: text('product_manual_url'),
    warranty_document_url: text('warranty_document_url'),
    service_engineer_id: varchar('service_engineer_id', { length: 255 }).references(() => users.id).notNull(),
    inspected_at: timestamp('inspected_at').notNull(),
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
    assignments: many(leadAssignments),
    deals: many(deals),
}));

export const leadAssignmentsRelations = relations(leadAssignments, ({ one }) => ({
    lead: one(leads, { fields: [leadAssignments.lead_id], references: [leads.id] }),
    owner: one(users, { fields: [leadAssignments.lead_owner], references: [users.id], relationName: 'assigned_to_user' }),
    assigner: one(users, { fields: [leadAssignments.assigned_by], references: [users.id], relationName: 'assigned_by_user' }),
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
