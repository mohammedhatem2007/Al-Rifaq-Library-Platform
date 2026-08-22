/**
 * CSV Helper & Sanitization Utility
 * 
 * Protects against CSV Injection (Formula Injection) and handles proper
 * escaping of special characters (commas, double-quotes, newlines) for RFC 4180
 * compliant CSV generation with full UTF-8 support for Arabic text.
 */

import { Order } from '../types';

/**
 * Characters that can trigger formula execution in spreadsheet programs
 * (Excel, Google Sheets, LibreOffice Calc) when placed at the start of a cell.
 */
const FORMULA_PREFIXES = ['=', '+', '-', '@', '\t', '\r', '|', '%'];

/**
 * Sanitizes a single cell value for CSV export:
 * 1. Converts null/undefined to empty string
 * 2. Prevents CSV Formula Injection by prepending a single quote (') if the field starts with formula trigger characters
 * 3. Escapes existing double-quotes by doubling them ("" -> """")
 * 4. Encloses in quotes if the string contains quotes, commas, newlines, or leading formula prefixes
 * 
 * @param value Raw cell value (string, number, boolean, null, undefined)
 * @returns RFC 4180 compliant and injection-safe CSV cell string
 */
export function sanitizeCsvCell(value: unknown): string {
  if (value === null || value === undefined) {
    return '""';
  }

  let str = String(value);

  // Trim extraneous whitespace from boundaries for security check while preserving content
  const trimmed = str.trimStart();

  // Check for CSV / Formula Injection vulnerabilities
  let isFormulaRisk = false;
  if (trimmed.length > 0 && FORMULA_PREFIXES.some((prefix) => trimmed.startsWith(prefix))) {
    isFormulaRisk = true;
    // Prefix with single quote to force spreadsheet applications to treat it as raw text
    str = `'${str}`;
  }

  // Escape any existing double quotes by doubling them per RFC 4180
  const escapedQuotes = str.replace(/"/g, '""');

  // Check if quoting the entire field is required:
  // Required if it contains commas, double-quotes, newlines, carriage returns, or was flagged as formula risk
  const needsQuotes =
    isFormulaRisk ||
    escapedQuotes.includes(',') ||
    escapedQuotes.includes('"') ||
    escapedQuotes.includes('\n') ||
    escapedQuotes.includes('\r');

  if (needsQuotes) {
    return `"${escapedQuotes}"`;
  }

  return escapedQuotes;
}

/**
 * Converts a list of Orders into a secure, sanitized CSV string.
 * Includes UTF-8 BOM (\uFEFF) to guarantee Arabic text renders correctly in Excel.
 * 
 * @param orders Array of Order objects
 * @returns UTF-8 encoded, sanitized CSV string
 */
export function convertOrdersToCSV(orders: Order[]): string {
  const headers = [
    'رقم الطلب',
    'تاريخ الطلب',
    'اسم العميل',
    'رقم الهاتف',
    'طريقة الاستلام',
    'العنوان / المنطقة',
    'وسيلة الدفع',
    'المبلغ الإجمالي (₪)',
    'حالة الطلب',
    'ملاحظات العميل',
    'ملخص البنود والملفات'
  ];

  const headerRow = headers.map(sanitizeCsvCell).join(',');

  const rows = orders.map((order) => {
    // Format items and print jobs safely
    const printJobsSummary = (order.printJobs || [])
      .map(
        (j) =>
          `[طباعة: ${j.paperSize} ${j.printType === 'bw' ? 'أبيض وأسود' : 'ملون'} - ${j.pageCount}ص × ${j.copyCount}ن - تجليد: ${j.binding}]`
      )
      .join(' ; ');

    const cartItemsSummary = (order.cartItems || [])
      .map((item) => `[منتج: ${item.product.name} × ${item.quantity}]`)
      .join(' ; ');

    const allItemsSummary = [printJobsSummary, cartItemsSummary].filter(Boolean).join(' | ') || 'لا توجد بنود';

    // Status in Arabic
    const statusArabic =
      order.status === 'new'
        ? 'جديد'
        : order.status === 'processing' || order.status === 'printing'
        ? 'قيد المعالجة'
        : order.status === 'ready'
        ? 'جاهز'
        : order.status === 'delivered'
        ? 'مكتمل'
        : 'ملغي';

    // Delivery method in Arabic
    const deliveryArabic =
      order.customer.deliveryMethod === 'pickup' ? 'استلام من الفرع' : 'توصيل للعنوان';

    // Payment method in Arabic
    const paymentArabic =
      order.paymentMethod === 'cod' ? 'الدفع عند الاستلام' : 'تحويل إلكتروني / بنكي';

    const orderDate = order.createdAt ? new Date(order.createdAt).toLocaleString('ar-EG') : 'غير محدد';

    const rowValues = [
      order.orderNumber || order.id,
      orderDate,
      order.customer.fullName || '',
      order.customer.phone || '',
      deliveryArabic,
      order.customer.deliveryMethod === 'delivery'
        ? `${order.customer.area || ''} - ${order.customer.address || ''}`.trim()
        : 'الفرع الرئيسي',
      paymentArabic,
      order.totalAmount,
      statusArabic,
      order.customer.notes || '',
      allItemsSummary
    ];

    return rowValues.map(sanitizeCsvCell).join(',');
  });

  // Prepend UTF-8 Byte Order Mark (BOM) so Excel opens Arabic correctly
  return `\uFEFF${headerRow}\r\n${rows.join('\r\n')}`;
}

/**
 * Generates and triggers browser download of the sanitized CSV file.
 * 
 * @param orders Array of Order objects to export
 * @param filename Custom file name (defaults to rifaq_orders_YYYY-MM-DD.csv)
 */
export function downloadOrdersCSV(orders: Order[], filename?: string): void {
  const csvContent = convertOrdersToCSV(orders);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const defaultName = `rifaq_orders_${new Date().toISOString().slice(0, 10)}.csv`;
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename || defaultName);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
