import { z } from 'zod';

// Mirrors CreateSupplierCommand / UpdateSupplierCommand.
export const supplierSchema = z.object({
  name: z.string().min(1, { message: 'Name is required.' }).max(200),
  contactPhone: z.string().max(30).optional(),
  contactEmail: z.string().email({ message: 'Enter a valid email.' }).max(200).optional().or(z.literal('')),
  address: z.string().max(500).optional(),
});

export type SupplierSchemaType = z.infer<typeof supplierSchema>;

// Mirrors RecordCylinderPurchaseCommand — TotalKg/LineAmount/UnitPricePerKg/GrandTotal are all
// server-computed (see CylinderPurchase.cs), never entered or calculated client-side.
export const cylinderPurchaseSchema = z.object({
  supplierId: z.string().min(1, { message: 'Supplier is required.' }),
  invoiceNumber: z.string().min(1, { message: 'Invoice number is required.' }).max(100),
  purchaseDate: z.string().min(1, { message: 'Purchase date is required.' }),
  cylinderType: z.string().min(1, { message: 'Cylinder type is required.' }).max(50),
  quantity: z.coerce.number().int().positive({ message: 'Quantity must be positive.' }),
  cylinderWeightKg: z.coerce.number().positive({ message: 'Cylinder weight must be positive.' }),
  ratePerCylinder: z.coerce.number().min(0, { message: 'Rate cannot be negative.' }),
  deliveryOrOtherCost: z.coerce.number().min(0, { message: 'Delivery/other cost cannot be negative.' }),
  remarks: z.string().max(500).optional(),
});

export type CylinderPurchaseSchemaType = z.infer<typeof cylinderPurchaseSchema>;
