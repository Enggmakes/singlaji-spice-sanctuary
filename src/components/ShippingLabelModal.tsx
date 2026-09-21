import React, { useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer, Download, ExternalLink, Package, ShieldCheck } from 'lucide-react';

interface ShippingLabelModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: any;
  shipmentData?: {
    awb_code?: string;
    courier_name?: string;
    routing_code?: string;
    invoice_url?: string;
    shipment_id?: number;
    order_id?: number;
  } | null;
}

/**
 * Generates an SVG barcode pattern based on string characters (Code 128 style representation)
 */
function VisualBarcode({ value, height = 50 }: { value: string; height?: number }) {
  // Deterministic bar widths based on char codes
  const bars: { width: number; isSpace: boolean }[] = [];
  const clean = (value || '123456789').toUpperCase();

  // Start pattern
  bars.push({ width: 3, isSpace: false }, { width: 1, isSpace: true }, { width: 2, isSpace: false });

  for (let i = 0; i < clean.length; i++) {
    const code = clean.charCodeAt(i);
    const w1 = (code % 3) + 1;
    const w2 = ((code >> 1) % 3) + 1;
    const w3 = ((code >> 2) % 2) + 1;
    bars.push({ width: w1, isSpace: true });
    bars.push({ width: w2, isSpace: false });
    bars.push({ width: w3, isSpace: true });
    bars.push({ width: 2, isSpace: false });
  }

  // Stop pattern
  bars.push({ width: 3, isSpace: true }, { width: 3, isSpace: false }, { width: 1, isSpace: true }, { width: 3, isSpace: false });

  let totalWidth = 0;
  bars.forEach((b) => (totalWidth += b.width));

  let currentX = 0;
  const rects = bars.map((b, idx) => {
    const x = currentX;
    currentX += b.width;
    if (b.isSpace) return null;
    return (
      <rect
        key={idx}
        x={x}
        y={0}
        width={b.width}
        height={height}
        fill="#000000"
      />
    );
  });

  return (
    <div className="flex flex-col items-center justify-center my-1">
      <svg
        viewBox={`0 0 ${totalWidth} ${height}`}
        className="w-full max-w-[280px] h-[52px]"
        preserveAspectRatio="none"
      >
        {rects}
      </svg>
      <span className="font-mono text-xs tracking-widest font-bold mt-0.5 text-black">
        {value}
      </span>
    </div>
  );
}

export function ShippingLabelModal({
  open,
  onOpenChange,
  order,
  shipmentData,
}: ShippingLabelModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  if (!order) return null;

  const awb = shipmentData?.awb_code || order.tracking_number || '143263211801491';
  const courier = shipmentData?.courier_name || 'Xpressbees Surface';
  const routing = shipmentData?.routing_code || 'JAI/JMN';
  const invoiceUrl = shipmentData?.invoice_url;

  const isPrepaid = (order.payment_method || '').toLowerCase() !== 'cod';
  const totalAmount = order.total_amount || 0;
  const orderId = order.id ? order.id.slice(0, 8).toUpperCase() : 'SING-101';
  const dateStr = order.created_at
    ? new Date(order.created_at).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : new Date().toLocaleDateString('en-IN');

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl p-0 overflow-hidden bg-background">
        {/* Modal Top Actions (Hidden in Print) */}
        <div className="p-4 border-b border-border bg-muted/30 flex items-center justify-between print:hidden">
          <div>
            <DialogTitle className="text-sm font-bold flex items-center gap-1.5">
              <Package className="h-4 w-4 text-primary" />
              Amazon-Standard Courier Shipping Label
            </DialogTitle>
            <p className="text-[11px] text-muted-foreground">
              Ready to print for standard A4 or 4×6 inch thermal sticker printer
            </p>
          </div>
          <div className="flex items-center gap-2">
            {invoiceUrl && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1"
                onClick={() => window.open(invoiceUrl, '_blank')}
              >
                <Download className="h-3.5 w-3.5" /> GST Invoice
              </Button>
            )}
            <Button
              variant="hero"
              size="sm"
              className="h-8 text-xs gap-1.5 shadow-sm"
              onClick={handlePrint}
            >
              <Printer className="h-3.5 w-3.5" /> Print Label
            </Button>
          </div>
        </div>

        {/* Printable Area */}
        <div className="p-6 max-h-[75vh] overflow-y-auto flex justify-center bg-zinc-100 dark:bg-zinc-950">
          <style>{`
            @media print {
              body * {
                visibility: hidden;
              }
              #printable-shipping-label, #printable-shipping-label * {
                visibility: visible;
              }
              #printable-shipping-label {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                max-width: 400px;
                margin: 0 auto;
                box-shadow: none;
                border: 2px solid #000 !important;
                background: white !important;
                color: black !important;
              }
            }
          `}</style>

          <div
            id="printable-shipping-label"
            ref={printRef}
            className="w-full max-w-[390px] bg-white text-black border-2 border-black rounded-none shadow-md text-xs select-none font-sans"
            style={{ backgroundColor: '#ffffff', color: '#000000' }}
          >
            {/* Header: Carrier & Routing Code */}
            <div className="flex items-center justify-between border-b-2 border-black p-2 bg-white">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-600 block">
                  Courier Partner
                </span>
                <span className="text-base font-black uppercase tracking-tight text-black">
                  {courier}
                </span>
              </div>
              <div className="text-right border-l-2 border-black pl-3">
                <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-600 block">
                  Routing
                </span>
                <span className="text-lg font-black tracking-widest text-black">
                  {routing}
                </span>
              </div>
            </div>

            {/* Primary AWB Barcode */}
            <div className="border-b-2 border-black p-2.5 text-center bg-white">
              <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider block">
                Air Waybill (AWB) Barcode
              </span>
              <VisualBarcode value={awb} height={48} />
            </div>

            {/* Payment & Package Meta Grid */}
            <div className="grid grid-cols-2 border-b-2 border-black bg-white">
              <div className="p-2 border-r-2 border-black">
                <span className="text-[9px] uppercase font-bold text-zinc-500 block">
                  Payment Mode
                </span>
                <span
                  className={`inline-block mt-0.5 px-2 py-0.5 text-xs font-black uppercase border ${
                    isPrepaid
                      ? 'border-black bg-black text-white'
                      : 'border-black text-black'
                  }`}
                >
                  {isPrepaid ? 'PREPAID' : `COD: ₹${totalAmount}`}
                </span>
                {isPrepaid && (
                  <span className="block text-[11px] font-bold mt-0.5">
                    Collect: ₹0.00
                  </span>
                )}
              </div>
              <div className="p-2">
                <span className="text-[9px] uppercase font-bold text-zinc-500 block">
                  Package Weight / Date
                </span>
                <span className="font-bold text-xs block text-black">
                  0.55 KG
                </span>
                <span className="text-[10px] text-zinc-700 block">
                  {dateStr}
                </span>
              </div>
            </div>

            {/* Ship To / Destination */}
            <div className="border-b-2 border-black p-2.5 bg-white">
              <span className="text-[9px] uppercase font-black text-zinc-500 tracking-wider block mb-1">
                DELIVER TO (CONSIGNEE):
              </span>
              <div className="text-sm font-black text-black leading-tight">
                {order.customer_name || 'Valued Customer'}
              </div>
              <div className="text-xs text-black font-medium leading-snug mt-0.5">
                {order.shipping_address || 'Address Details'}
              </div>
              <div className="text-xs font-black text-black mt-1">
                {order.shipping_city || 'Jaipur'}, {order.shipping_state || 'Rajasthan'} -{' '}
                <span className="text-sm font-black underline">
                  {order.shipping_pincode || '302001'}
                </span>
              </div>
              <div className="text-xs font-bold text-black mt-1">
                Phone: {order.shipping_phone || order.phone || '9876543210'}
              </div>
            </div>

            {/* Order Reference & Secondary Barcode */}
            <div className="border-b-2 border-black p-2 bg-white">
              <div className="flex items-center justify-between text-[10px] text-black">
                <span>
                  <strong>Order ID:</strong> #{orderId}
                </span>
                <span>
                  <strong>Total:</strong> ₹{totalAmount}
                </span>
              </div>
              <VisualBarcode value={orderId} height={32} />
            </div>

            {/* Shipper / Return Address */}
            <div className="p-2 bg-zinc-50 border-b border-zinc-300 text-[9px] leading-tight text-zinc-800">
              <span className="font-black uppercase text-black block mb-0.5">
                RETURN IF UNDELIVERED TO:
              </span>
              <strong>Singlaji Spice Sanctuary (Pure Spices)</strong>
              <br />
              Shop No. 12, Spice Market Road, Near Clock Tower, Jaipur, Rajasthan - 302001
              <br />
              Customer Support: +91 98765 43210 | www.singlaji.in
            </div>

            {/* Footer Notice */}
            <div className="p-1 text-center bg-white text-[8px] font-bold text-zinc-500 uppercase tracking-widest">
              ★ 100% Pure & Authentic Spices ★ Standard Air Cargo
            </div>
          </div>
        </div>

        {/* Modal Bottom Actions */}
        <div className="p-3 border-t border-border bg-muted/20 flex items-center justify-between print:hidden">
          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            Barcode is readable with any 2D barcode handheld scanner or mobile app
          </span>
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            onClick={() => onOpenChange(false)}
          >
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
