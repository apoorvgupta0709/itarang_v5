import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import * as schema from '@/lib/db/schema';

// Foundation
export type User = InferSelectModel<typeof schema.users>;
export type NewUser = InferInsertModel<typeof schema.users>;

// MVP Features
export type Product = InferSelectModel<typeof schema.productCatalog>;
export type NewProduct = InferInsertModel<typeof schema.productCatalog>;

export type OEM = InferSelectModel<typeof schema.oems>;
export type NewOEM = InferInsertModel<typeof schema.oems>;

export type OEMContact = InferSelectModel<typeof schema.oemContacts>;
export type NewOEMContact = InferInsertModel<typeof schema.oemContacts>;

export type Inventory = InferSelectModel<typeof schema.inventory>;
export type NewInventory = InferInsertModel<typeof schema.inventory>;

// Dealer Sales
export type Lead = InferSelectModel<typeof schema.leads>;
export type NewLead = InferInsertModel<typeof schema.leads>;

export type LeadAssignment = InferSelectModel<typeof schema.leadAssignments>;
export type Deal = InferSelectModel<typeof schema.deals>;
export type NewDeal = InferInsertModel<typeof schema.deals>;

export type Approval = InferSelectModel<typeof schema.approvals>;
export type OrderDispute = InferSelectModel<typeof schema.orderDisputes>;
export type SLA = InferSelectModel<typeof schema.slas>;

// PDI
export type PDIRecord = InferSelectModel<typeof schema.pdiRecords>;
export type NewPDIRecord = InferInsertModel<typeof schema.pdiRecords>;

// Procurement
export type Provision = InferSelectModel<typeof schema.provisions>;
export type Order = InferSelectModel<typeof schema.orders>;
export type Account = InferSelectModel<typeof schema.accounts>;

// Documents + Procurement (Phase 1)
export type Document = InferSelectModel<typeof schema.documents>;
export type NewDocument = InferInsertModel<typeof schema.documents>;

export type OrderPIVersion = InferSelectModel<typeof schema.orderPiVersions>;
export type NewOrderPIVersion = InferInsertModel<typeof schema.orderPiVersions>;

export type OrderInvoiceVersion = InferSelectModel<typeof schema.orderInvoiceVersions>;
export type NewOrderInvoiceVersion = InferInsertModel<typeof schema.orderInvoiceVersions>;

export type OrderPayment = InferSelectModel<typeof schema.orderPayments>;
export type NewOrderPayment = InferInsertModel<typeof schema.orderPayments>;

export type OrderCredit = InferSelectModel<typeof schema.orderCredits>;
export type NewOrderCredit = InferInsertModel<typeof schema.orderCredits>;

export type OrderChallan = InferSelectModel<typeof schema.orderChallans>;
export type NewOrderChallan = InferInsertModel<typeof schema.orderChallans>;