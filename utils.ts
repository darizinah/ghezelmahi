import { Order, PreparationType } from "./types";
import { PRICE_PER_KG, DAMAGE_PRICE_PER_KG, STAFF_DISCOUNT_RATE } from "./constants";

// Formatters
export const formatPrice = (price: number): string => {
  if (price === 0) return 'رایگان';
  return new Intl.NumberFormat('fa-IR').format(Math.round(price)) + ' تومان';
};

export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('fa-IR').format(num);
};

export const getPersianDate = (): string => {
  return new Intl.DateTimeFormat('fa-IR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  }).format(new Date());
};

// Invoice Number Generator
export const getNextInvoiceNumber = (): string => {
  const START_NUMBER = 6311;
  const STORAGE_KEY = 'fishMarket_lastInvoice';
  
  const last = localStorage.getItem(STORAGE_KEY);
  let next = last ? parseInt(last) + 1 : START_NUMBER;
  
  // Ensure sequence jumps to new start number if current history is lower
  if (next < START_NUMBER) {
    next = START_NUMBER;
  }
  
  localStorage.setItem(STORAGE_KEY, next.toString());
  
  return next.toString();
};

// Pricing Logic
export interface PriceDetails {
  baseUnitPrice: number;
  discountAmount: number; // per unit
  finalUnitPrice: number;
  totalPrice: number;
}

export const calculateOrderDetails = (
  weight: number, 
  prepType: PreparationType | string, 
  hasDiscount: boolean,
  isFree: boolean = false
): PriceDetails => {
  // Support new enum value AND legacy "فروش تلفات" string from old data
  const isDamage = prepType === PreparationType.DAMAGE || prepType === "فروش تلفات";
  
  // 1. Determine Base Unit Price
  const baseUnitPrice = isDamage ? DAMAGE_PRICE_PER_KG : PRICE_PER_KG;
  
  // 2. Calculate Discount (Only for non-damage)
  let discountAmount = 0;
  if (hasDiscount && !isDamage && !isFree) {
    discountAmount = baseUnitPrice * STAFF_DISCOUNT_RATE;
  }
  
  // 3. Final Unit Price
  let finalUnitPrice = baseUnitPrice - discountAmount;
  
  // 4. Total
  let totalPrice = weight * finalUnitPrice;

  // 5. Apply Free Logic override
  if (isFree) {
    totalPrice = 0;
    // We keep baseUnitPrice for reference, but final unit effective price is 0
  }

  return {
    baseUnitPrice,
    discountAmount,
    finalUnitPrice: isFree ? 0 : finalUnitPrice,
    totalPrice
  };
};

export const calculatePrice = (
  weight: number, 
  prepType: PreparationType | string, 
  hasDiscount: boolean, 
  isFree: boolean = false
): number => {
  return calculateOrderDetails(weight, prepType, hasDiscount, isFree).totalPrice;
};

// Invoice Printing
export const printInvoice = (order: Order) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  // Use delivery weight if available, otherwise requested weight
  const finalWeight = (order.deliveryWeight && order.deliveryWeight > 0) 
    ? order.deliveryWeight 
    : order.requestedWeight;

  const { baseUnitPrice, finalUnitPrice, totalPrice } = calculateOrderDetails(
    finalWeight, 
    order.preparationType, 
    order.hasStaffDiscount,
    order.isFree
  );

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="fa" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>فاکتور فروش - ${order.invoiceNumber}</title>
      <style>
        body { font-family: 'Tahoma', 'Segoe UI', sans-serif; padding: 20px; max-width: 80mm; margin: 0 auto; }
        .header { text-align: center; border-bottom: 2px dashed #000; padding-bottom: 10px; margin-bottom: 15px; }
        .title { font-size: 18px; font-weight: bold; margin: 5px 0; }
        .meta { font-size: 12px; color: #555; }
        .row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; }
        .divider { border-top: 1px solid #ddd; margin: 10px 0; }
        .total { font-weight: bold; font-size: 16px; border-top: 2px solid #000; padding-top: 10px; margin-top: 10px; }
        .footer { text-align: center; font-size: 11px; margin-top: 20px; color: #666; }
        .desc { font-size: 12px; color: #444; background: #f9f9f9; padding: 5px; border-radius: 4px; border: 1px solid #eee; margin: 5px 0 10px 0; }
        @media print {
          @page { margin: 0; size: auto; }
          body { margin: 10px; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="title">شرکت قزل ماهی بنار</div>
        <div style="font-size: 12px;">شماره ثبت: 2878</div>
        <div class="meta" style="margin-top: 8px;">تاریخ: ${order.date}</div>
        <div class="meta">شماره فاکتور: <span style="color: red; font-weight: bold;">${order.invoiceNumber}</span></div>
        <div class="meta">ثبت کننده: ${order.orderer}</div>
      </div>

      <div class="details">
        <div class="row"><span>مشتری:</span><span>${order.customerName}</span></div>
        <div class="row"><span>تلفن:</span><span>${order.customerPhone}</span></div>
        
        <div class="divider"></div>
        
        <div class="row"><span>محصول:</span><span>ماهی (${order.preparationType})</span></div>
        ${order.quantity ? `<div class="row"><span>تعداد:</span><span>${order.quantity} عدد</span></div>` : ''}
        ${order.description ? `<div class="desc"><strong>توضیحات:</strong><br/>${order.description}</div>` : ''}
        
        <div class="row" style="margin-top: 8px;"><span>وزن:</span><span>${formatNumber(finalWeight)} کیلوگرم</span></div>
        
        <div class="row">
          <span>فی پایه:</span>
          <span>${formatNumber(baseUnitPrice)} تومان</span>
        </div>
        
        ${order.isFree ? `
           <div class="row" style="color: green; font-weight: bold;">
             <span>وضعیت:</span>
             <span>سفارش رایگان</span>
           </div>
        ` : `
          ${order.hasStaffDiscount && order.preparationType !== PreparationType.DAMAGE && (order.preparationType as string) !== "فروش تلفات" ? `
          <div class="row" style="color: red;">
            <span>تخفیف پرسنل (${STAFF_DISCOUNT_RATE * 100}%):</span>
            <span>اعمال شده</span>
          </div>
          <div class="row">
             <span>فی نهایی:</span>
             <span>${formatNumber(finalUnitPrice)} تومان</span>
          </div>
          ` : ''}
        `}

        <div class="row total">
          <span>مبلغ قابل پرداخت:</span>
          <span>${order.isFree ? 'رایگان' : formatPrice(totalPrice)}</span>
        </div>
        
        <div class="row">
          <span>وضعیت:</span>
          <span>${order.paymentStatus}</span>
        </div>
      </div>

      <div class="footer">
        <p>از خرید شما سپاسگزاریم</p>
      </div>
      <script>window.onload = function() { window.print(); }</script>
    </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
};