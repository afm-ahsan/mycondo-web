import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { SupplierSelect } from '@/components/shared/SupplierSelect';
import { cylinderPurchaseSchema, type CylinderPurchaseSchemaType } from '../schemas/gasCylinderSchema';

interface CylinderPurchaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isSubmitting?: boolean;
  onSubmit: (values: CylinderPurchaseSchemaType) => void;
}

/** Quantity/weight/rate/delivery cost are entered; TotalKg, LineAmount, UnitPricePerKg, GrandTotal are
 * all server-computed (spec §5.14) and shown only after the record is created, never calculated here. */
export function CylinderPurchaseDialog({ open, onOpenChange, isSubmitting, onSubmit }: CylinderPurchaseDialogProps) {
  const form = useForm<CylinderPurchaseSchemaType>({
    resolver: zodResolver(cylinderPurchaseSchema),
    defaultValues: {
      supplierId: '',
      invoiceNumber: '',
      purchaseDate: new Date().toISOString().slice(0, 10),
      cylinderType: '',
      quantity: 0,
      cylinderWeightKg: 0,
      ratePerCylinder: 0,
      deliveryOrOtherCost: 0,
      remarks: '',
    },
  });

  function handleOpenChange(next: boolean) {
    if (!next) form.reset();
    onOpenChange(next);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Record Cylinder Purchase</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="supplierId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Supplier</FormLabel>
                  <FormControl>
                    <SupplierSelect value={field.value} onValueChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="invoiceNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Invoice / challan number</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="purchaseDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Purchase date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="cylinderType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cylinder type</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. LPG-12kg" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity</FormLabel>
                  <FormControl>
                    <Input type="number" min={1} step="1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="cylinderWeightKg"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cylinder weight (kg)</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} step="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="ratePerCylinder"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rate per cylinder</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} step="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="deliveryOrOtherCost"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Delivery / other cost</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} step="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="remarks"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Remarks (optional)</FormLabel>
                  <FormControl>
                    <Textarea rows={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Recording…' : 'Record Purchase'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
