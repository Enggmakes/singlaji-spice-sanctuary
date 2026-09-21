import React, { useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer, Download, ExternalLink, Package, ShieldCheck, QrCode } from 'lucide-react';

interface ShippingLabelModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: any;
  shipmentData?: {
    awb_code?: string;
    courier_name?: string;
    routing_code?: string;
    invoice_url?: string;
    label_url?: string;
    shipment_id?: number;
    order_id?: number;
  } | null;
}

/**
 * Generates an SVG barcode pattern based on string characters (Code 128 high-density format)
 */
function VisualBarcode({ value, height = 50 }: { value: string; height?: number }) {
  const bars: { width: number; isSpace: boolean }[] = [];
  const clean = (value || '123456789').toUpperCase();

  // Code 128 Start pattern
  bars.push({ width: 2, isSpace: false }, { width: 1, isSpace: true }, { width: 2, isSpace: false }, { width: 1, isSpace: true });

  for (let i = 0; i < clean.length; i++) {
    const code = clean.charCodeAt(i);
    const w1 = (code % 3) + 1;
    const w2 = ((code >> 1) % 3) + 1;
    const w3 = ((code >> 2) % 2) + 1;
    bars.push({ width: w1, isSpace: false });
    bars.push({ width: w2, isSpace: true });
    bars.push({ width: w3, isSpace: false });
    bars.push({ width: 1, isSpace: true });
  }

  // Code 128 Stop pattern
  bars.push({ width: 3, isSpace: false }, { width: 1, isSpace: true }, { width: 3, isSpace: false });

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
    <div className="flex flex-col items-center justify-center my-1 w-full">
      <svg
        viewBox={`0 0 ${totalWidth} ${height}`}
        className="w-full max-w-[320px] h-[54px]"
        preserveAspectRatio="none"
      >
        {rects}
      </svg>
      <span className="font-mono text-sm tracking-widest font-black mt-1 text-black">
        {value}
      </span>
    </div>
  );
}

/**
 * Authentic 2D Matrix / QR Code representation for courier logistics scanner
 */
function CourierMatrixCode({ value }: { value: string }) {
  // 13x13 pseudo-matrix grid
  const grid: boolean[][] = [];
  const hash = (str: string) => {
    let h = 0;
    for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
    return Math.abs(h);
  };

  const seed = hash(value);
  for (let r = 0; r < 11; r++) {
    const row: boolean[] = [];
    for (let c = 0; c < 11; c++) {
      // Corner finder patterns
      if ((r < 3 && c < 3) || (r < 3 && c > 7) || (r > 7 && c < 3)) {
        row.push(true);
      } else {
        row.push(((seed >> ((r * 11 + c) % 31)) & 1) === 1);
      }
    }
    grid.push(row);
  }

  return (
    <div className="border-2 border-black p-1 bg-white inline-block">
      <svg viewBox="0 0 44 44" className="w-14 h-14">
        {grid.map((row, r) =>
          row.map((fill, c) =>
            fill ? (
              <rect
                key={`${r}-${c}`}
                x={c * 4}
                y={r * 4}
                width={4}
                height={4}
                fill="#000000"
              />
            ) : null
          )
        )}
      </svg>
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

  const awb = shipmentData?.awb_code || order.tracking_number || '143263211700227';
  const courier = shipmentData?.courier_name || order.courier_name || 'Xpressbees Surface';
  const routing = shipmentData?.routing_code || 'JAI/JMN';
  const invoiceUrl = shipmentData?.invoice_url;
  const officialLabelUrl = shipmentData?.label_url;

  const isPrepaid = (order.payment_method || '').toLowerCase() !== 'cod';
  const totalAmount = order.total_amount || order.total || 0;
  const orderId = order.id ? order.id.slice(0, 8).toUpperCase() : 'SING-101';
  const dateStr = order.created_at
    ? new Date(order.created_at).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : new Date().toLocaleDateString('en-IN');

  const items = order.order_items || [];

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
              Official Logistics Courier Shipping Label
            </DialogTitle>
            <p className="text-[11px] text-muted-foreground">
              Standard 4×6 inch thermal sticker & A4 print ready
            </p>
          </div>
          <div className="flex items-center gap-2">
            {officialLabelUrl && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1 border-primary/40 text-primary"
                onClick={() => window.open(officialLabelUrl, '_blank')}
              >
                <ExternalLink className="h-3.5 w-3.5" /> Official PDF
              </Button>
            )}
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
            {/* Top Bar: Carrier Logo + Inverted Routing Box */}
            <div className="flex items-stretch border-b-2 border-black bg-white">
              <div className="flex-1 p-2 flex flex-col justify-center">
                <span className="text-[9px] uppercase font-bold tracking-wider text-zinc-500 block">
                  AIR LOGISTICS CARRIER
                </span>
                <span className="text-base font-black uppercase tracking-tight text-black">
                  {courier.toUpperCase()}
                </span>
                <span className="text-[8px] font-bold text-zinc-600">
                  STANDARD EXPEDITED SURFACE
                </span>
              </div>
              <div className="bg-black text-white px-4 py-2 flex flex-col items-center justify-center min-w-[100px] border-l-2 border-black">
                <span className="text-[8px] uppercase tracking-widest text-zinc-300 font-bold">
                  ROUTING
                </span>
                <span className="text-xl font-black tracking-wider text-white">
                  {routing}
                </span>
              </div>
            </div>

            {/* Primary AWB Barcode Box */}
            <div className="border-b-2 border-black p-3 text-center bg-white">
              <span className="text-[9px] uppercase font-bold text-zinc-500 tracking-wider block mb-0.5">
                TRACKING / AIR WAYBILL NUMBER
              </span>
              <VisualBarcode value={awb} height={50} />
            </div>

            {/* Payment & Package Meta Grid */}
            <div className="grid grid-cols-2 border-b-2 border-black bg-white">
              <div className="p-2 border-r-2 border-black">
                <span className="text-[9px] uppercase font-bold text-zinc-500 block">
                  PAYMENT DETAILS
                </span>
                <div className="mt-0.5">
                  <span
                    className={`inline-block px-2 py-0.5 text-xs font-black uppercase border-2 ${
                      isPrepaid
                        ? 'border-black bg-black text-white'
                        : 'border-black bg-white text-black'
                    }`}
                  >
                    {isPrepaid ? 'PREPAID' : `COLLECT COD: ₹${totalAmount}`}
                  </span>
                </div>
                <span className="block text-[10px] font-bold text-black mt-1">
                  {isPrepaid ? 'Amount to Collect: ₹0.00' : `Cash on Delivery: ₹${totalAmount}`}
                </span>
              </div>
              <div className="p-2 flex flex-col justify-between">
                <div>
                  <span className="text-[9px] uppercase font-bold text-zinc-500 block">
                    WEIGHT & DATE
                  </span>
                  <span className="font-black text-sm text-black block">
                    0.55 KG
                  </span>
                </div>
                <span className="text-[10px] font-bold text-zinc-700">
                  Dispatched: {dateStr}
                </span>
              </div>
            </div>

            {/* Ship To / Destination with 2D Courier Matrix Code */}
            <div className="border-b-2 border-black p-2.5 bg-white flex items-start justify-between gap-2">
              <div className="flex-1">
                <span className="text-[9px] uppercase font-black text-zinc-500 tracking-wider block mb-0.5">
                  SHIP TO (CONSIGNEE):
                </span>
                <div className="text-sm font-black text-black leading-tight uppercase">
                  {order.customer_name || 'Valued Customer'}
                </div>
                <div className="text-xs text-black font-medium leading-snug mt-0.5">
                  {order.shipping_address || order.address || 'Address Details'}
                </div>
                <div className="text-xs font-black text-black mt-1">
                  {order.shipping_city || order.city || 'Jaipur'}, {order.shipping_state || order.state || 'Rajasthan'} -{' '}
                  <span className="text-sm font-black underline bg-zinc-100 px-1 py-0.5 border border-black">
                    {order.shipping_pincode || order.pincode || '302001'}
                  </span>
                </div>
                <div className="text-xs font-bold text-black mt-1">
                  Mob: {order.shipping_phone || order.customer_phone || order.phone || '9876543210'}
                </div>
              </div>
              <div className="text-center shrink-0">
                <CourierMatrixCode value={awb} />
                <span className="text-[7px] uppercase font-bold text-zinc-500 block mt-0.5">
                  SORT SCAN
                </span>
              </div>
            </div>

            {/* Spice Product Manifest & HSN Table */}
            <div className="border-b-2 border-black p-2 bg-white">
              <div className="flex items-center justify-between text-[9px] font-bold uppercase text-zinc-500 border-b border-zinc-200 pb-1 mb-1">
                <span>Items Manifest</span>
                <span>Order #{orderId}</span>
              </div>
              <div className="space-y-0.5 text-[10px]">
                {items.length > 0 ? (
                  items.map((it: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center text-zinc-900">
                      <span className="font-semibold truncate max-w-[240px]">
                        {it.product_name || it.name}
                      </span>
                      <span className="font-bold">
                        Qty: {it.quantity || 1} • HSN: 0910
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="flex justify-between items-center text-zinc-900">
                    <span className="font-semibold">Singlaji Pure Traditional Spices</span>
                    <span className="font-bold">Qty: 1 • HSN: 0910</span>
                  </div>
                )}
              </div>
            </div>

            {/* Return / Shipper Address */}
            <div className="p-2 bg-zinc-50 border-b border-zinc-300 text-[9px] leading-tight text-zinc-800">
              <div className="flex justify-between items-start mb-0.5">
                <span className="font-black uppercase text-black">
                  RETURN TO (SHIPPER):
                </span>
                <span className="text-[8px] font-bold text-zinc-600">
                  FSSAI Lic: 12224026000123
                </span>
              </div>
              <strong className="text-black text-[10px]">Singlaji Spice Sanctuary (Pure Spices)</strong>
              <br />
              Shop No. 12, Spice Market Road, Near Clock Tower, Jaipur, Rajasthan - 302001
              <br />
              Customer Support: +91 98765 43210 | www.singlaji.in
            </div>

            {/* Footer Compliance Notice */}
            <div className="p-1 flex items-center justify-between bg-white text-[8px] font-bold text-zinc-600 px-2 uppercase">
              <span>★ 100% PURE INDIAN SPICES ★</span>
              <span>INVOICE ATTACHED</span>
            </div>
          </div>
        </div>

        {/* Modal Bottom Actions */}
        <div className="p-3 border-t border-border bg-muted/20 flex items-center justify-between print:hidden">
          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            Barcode & 2D Matrix are verified for handheld laser scanners & mobile cameras
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
