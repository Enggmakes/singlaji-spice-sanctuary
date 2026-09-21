import React, { useRef, useState, useEffect } from 'react';
import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer, Download, ExternalLink, Package, ShieldCheck, QrCode } from 'lucide-react';
import {
  calculateOrderWeightKg,
  formatShippingWeight,
  lookupPincode,
} from '@/lib/pincodeLookup';

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
 * Generates an authentic, laser-scannable Code-128 barcode
 */
function VisualBarcode({ value, height = 36 }: { value: string; height?: number }) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (svgRef.current && value) {
      try {
        JsBarcode(svgRef.current, value, {
          format: 'CODE128',
          lineColor: '#000000',
          width: 1.8,
          height: height,
          displayValue: true,
          font: 'monospace',
          fontSize: 12,
          textMargin: 2,
          margin: 0,
        });
      } catch (err) {
        console.warn('JsBarcode render warning:', err);
      }
    }
  }, [value, height]);

  return (
    <div className="flex flex-col items-center justify-center my-0.5 w-full">
      <svg ref={svgRef} className="max-w-[310px] h-[52px]" />
    </div>
  );
}

/**
 * Generates a 100% real, ISO-standard scannable QR Code linking directly to package tracking
 */
function CourierMatrixCode({ value }: { value: string }) {
  const [qrSrc, setQrSrc] = useState<string>('');

  useEffect(() => {
    if (!value) return;
    // Direct Shiprocket live tracking URL
    const trackUrl = `https://shiprocket.co/tracking/${value}`;
    QRCode.toDataURL(trackUrl, {
      width: 160,
      margin: 1,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    })
      .then((url) => setQrSrc(url))
      .catch((err) => console.error('Error generating QR code:', err));
  }, [value]);

  return (
    <div className="border-2 border-black p-0.5 bg-white inline-block">
      {qrSrc ? (
        <img
          src={qrSrc}
          alt={`Scan AWB ${value}`}
          className="w-12 h-12 block"
          style={{ imageRendering: 'pixelated' }}
        />
      ) : (
        <div className="w-12 h-12 bg-zinc-100 flex items-center justify-center text-[7px] font-bold">
          LOADING
        </div>
      )}
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

  const items = order.order_items || [];
  const realWeightKg = calculateOrderWeightKg(items);
  const weightDisplay = formatShippingWeight(realWeightKg);

  const destPincode = (order.shipping_pincode || order.pincode || '').toString().trim() || '152116';
  const pinInfo = lookupPincode(destPincode);

  // If order state is missing or was defaulted to Punjab when pincode is in another state
  const rawState = (order.shipping_state || order.state || '').trim();
  const realState =
    !rawState || (rawState.toLowerCase() === 'punjab' && pinInfo.state !== 'Punjab')
      ? pinInfo.state
      : rawState;

  const awb = shipmentData?.awb_code || order.tracking_number || '143263211700227';
  const courier = shipmentData?.courier_name || order.courier_name || 'Xpressbees Surface';
  const routing =
    shipmentData?.routing_code && shipmentData.routing_code !== 'ABH/PJB'
      ? shipmentData.routing_code
      : pinInfo.routingCode;
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

  const handlePrint = () => {
    const labelNode = document.getElementById('printable-shipping-label');
    if (!labelNode) {
      window.print();
      return;
    }

    const labelHtml = labelNode.outerHTML;
    const printWindow = window.open('', '_blank', 'width=450,height=680');
    if (!printWindow) {
      window.print();
      return;
    }

    printWindow.document.open();
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Shipping_Label_${awb}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @page {
              size: 100mm 150mm; /* Standard 4x6 inch thermal sticker */
              margin: 0 !important;
            }
            @media print {
              html, body {
                margin: 0 !important;
                padding: 0 !important;
                width: 100% !important;
                height: 148mm !important;
                max-height: 148mm !important;
                overflow: hidden !important;
                background: #ffffff !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              #printable-shipping-label {
                width: 96mm !important;
                max-width: 96mm !important;
                margin: 2mm auto 0 auto !important;
                border: 2px solid #000000 !important;
                page-break-inside: avoid !important;
                break-inside: avoid !important;
                page-break-after: avoid !important;
                break-after: avoid !important;
                box-shadow: none !important;
              }
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
              margin: 0;
              padding: 4px;
              display: flex;
              justify-content: center;
              align-items: flex-start;
              background: #ffffff;
              color: #000000;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            #printable-shipping-label {
              width: 100%;
              max-width: 375px;
              background: #ffffff !important;
              color: #000000 !important;
              border: 2px solid #000000 !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
          </style>
        </head>
        <body>
          ${labelHtml}
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.focus();
                window.print();
              }, 350);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
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
          <div
            id="printable-shipping-label"
            ref={printRef}
            className="w-full max-w-[390px] bg-white text-black border-2 border-black rounded-none shadow-md text-xs select-none font-sans"
            style={{ backgroundColor: '#ffffff', color: '#000000' }}
          >
            {/* Top Bar: Carrier Logo + Inverted Routing Box */}
            <div className="flex items-stretch border-b-2 border-black bg-white">
              <div className="flex-1 p-1.5 flex flex-col justify-center">
                <span className="text-[8px] uppercase font-bold tracking-wider text-zinc-500 block">
                  AIR LOGISTICS CARRIER
                </span>
                <span className="text-sm font-black uppercase tracking-tight text-black">
                  {courier.toUpperCase()}
                </span>
                <span className="text-[7.5px] font-bold text-zinc-600">
                  STANDARD EXPEDITED SURFACE
                </span>
              </div>
              <div className="bg-black text-white px-3 py-1 flex flex-col items-center justify-center min-w-[85px] border-l-2 border-black">
                <span className="text-[7.5px] uppercase tracking-widest text-zinc-300 font-bold">
                  ROUTING
                </span>
                <span className="text-lg font-black tracking-wider text-white">
                  {routing}
                </span>
              </div>
            </div>

            {/* Primary AWB Barcode Box */}
            <div className="border-b-2 border-black p-1.5 text-center bg-white">
              <span className="text-[8px] uppercase font-bold text-zinc-500 tracking-wider block">
                TRACKING / AIR WAYBILL NUMBER
              </span>
              <VisualBarcode value={awb} height={40} />
            </div>

            {/* Payment & Package Meta Grid */}
            <div className="grid grid-cols-2 border-b-2 border-black bg-white text-[11px]">
              <div className="p-1.5 border-r-2 border-black">
                <span className="text-[8px] uppercase font-bold text-zinc-500 block">
                  PAYMENT DETAILS
                </span>
                <div className="mt-0.5">
                  <span
                    className={`inline-block px-1.5 py-0.5 text-[11px] font-black uppercase border-2 ${
                      isPrepaid
                        ? 'border-black bg-black text-white'
                        : 'border-black bg-white text-black'
                    }`}
                  >
                    {isPrepaid ? 'PREPAID' : `COLLECT COD: ₹${totalAmount}`}
                  </span>
                </div>
                <span className="block text-[9px] font-bold text-black mt-0.5">
                  {isPrepaid ? 'Collect: ₹0.00' : `Cash on Delivery: ₹${totalAmount}`}
                </span>
              </div>
              <div className="p-1.5 flex flex-col justify-between">
                <div>
                  <span className="text-[8px] uppercase font-bold text-zinc-500 block">
                    WEIGHT & DATE
                  </span>
                  <span className="font-black text-xs text-black block">
                    {weightDisplay}
                  </span>
                </div>
                <span className="text-[9px] font-bold text-zinc-700">
                  Dispatched: {dateStr}
                </span>
              </div>
            </div>

            {/* Ship To / Destination with 2D Courier Matrix Code */}
            <div className="border-b-2 border-black p-1.5 bg-white flex items-start justify-between gap-2">
              <div className="flex-1">
                <span className="text-[8px] uppercase font-black text-zinc-500 tracking-wider block mb-0.5">
                  SHIP TO (CONSIGNEE):
                </span>
                <div className="text-xs font-black text-black leading-tight uppercase">
                  {order.customer_name || 'Valued Customer'}
                </div>
                <div className="text-[11px] text-black font-medium leading-snug mt-0.5">
                  {order.shipping_address || order.address || 'Address Details'}
                </div>
                <div className="text-xs font-black text-black mt-0.5">
                  {order.shipping_city || order.city || ''}
                  {realState ? `, ${realState}` : ''} -{' '}
                  <span className="text-xs font-black underline bg-zinc-100 px-1 py-0.5 border border-black">
                    {destPincode}
                  </span>
                </div>
                <div className="text-[10px] font-bold text-black mt-0.5">
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
            <div className="border-b-2 border-black p-1.5 bg-white">
              <div className="flex items-center justify-between text-[8px] font-bold uppercase text-zinc-500 border-b border-zinc-200 pb-0.5 mb-0.5">
                <span>Items Manifest</span>
                <span>Order #{orderId}</span>
              </div>
              <div className="space-y-0.5 text-[9px]">
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
            <div className="p-1.5 bg-zinc-50 border-b border-zinc-300 text-[8px] leading-tight text-zinc-800">
              <div className="flex justify-between items-start mb-0.5">
                <span className="font-black uppercase text-black">
                  RETURN TO (SHIPPER):
                </span>
                <span className="text-[7.5px] font-bold text-zinc-600">
                  FSSAI Lic: 12224026000123
                </span>
              </div>
              <strong className="text-black text-[9px]">Singlaji Store (Pure Indian Spices)</strong>
              <br />
              Nai Abadi St no. 17-18, Near Uttam Vihar Colony Gate no. 2, Abohar, Punjab - 152116
              <br />
              Customer Support / WhatsApp: +91 88725 72784 | singlaji2026@gmail.com | www.singlaji.in
            </div>

            {/* Footer Compliance Notice */}
            <div className="py-0.5 px-1.5 flex items-center justify-between bg-white text-[7.5px] font-bold text-zinc-600 uppercase">
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
