import React, { useState, useId } from 'react';
import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { 
  UploadCloud, 
  FileText, 
  Trash2, 
  Plus, 
  Minus, 
  AlertTriangle,
  ShoppingCart,
  ArrowLeft
} from 'lucide-react';
import { PrintJob, PrintType, PaperSize, SinglePageLayout, BindingOption, UploadedPrintFile, PricingConfig } from '../types';

interface PrintingCalculatorProps {
  pricing: PricingConfig;
  isAvailable: boolean;
  offlineMessage?: string;
  onAddPrintJobToCart: (job: PrintJob) => void;
  onDirectCheckout: (job: PrintJob) => void;
}

export const PrintingCalculator: React.FC<PrintingCalculatorProps> = ({
  pricing,
  isAvailable,
  offlineMessage,
  onAddPrintJobToCart,
  onDirectCheckout,
}) => {
  GlobalWorkerOptions.workerSrc = pdfWorker;
  const fileInputId = useId();

  // State
  const [uploadedFiles, setUploadedFiles] = useState<UploadedPrintFile[]>([]);
  const [printType, setPrintType] = useState<PrintType>('bw');
  const [paperSize, setPaperSize] = useState<PaperSize>('A4');
  const [layout, setLayout] = useState<SinglePageLayout>('1_per_page');
  const [customLayoutPages, setCustomLayoutPages] = useState<number>(() => pricing.layoutDivisorCustomDefault || 6);
  const [binding, setBinding] = useState<BindingOption>('none');
  const [bindingQuantity, setBindingQuantity] = useState<number>(1);
  const [pageCount, setPageCount] = useState<number>(1);
  const [copyCount, setCopyCount] = useState<number>(1);
  const [notes, setNotes] = useState<string>('');
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [showSuccessToast, setShowSuccessToast] = useState<boolean>(false);

  // Layout multiplier / Division Factor configurable from Admin
  const getLayoutDivisor = () => {
    switch (layout) {
      case '2_per_page':
        return Math.max(1, pricing.layoutDivisor2PerPage ?? 2);
      case '4_per_page':
        return Math.max(1, pricing.layoutDivisor4PerPage ?? 4);
      case 'custom':
        return Math.max(1, customLayoutPages);
      case '1_per_page':
      default:
        return Math.max(1, pricing.layoutDivisor1PerPage ?? 1);
    }
  };

  // Base price per physical sheet
  const getSheetPrice = () => {
    if (paperSize === 'A4') {
      return printType === 'color' ? pricing.colorPriceA4 : pricing.bwPriceA4;
    }
    if (paperSize === 'A5') {
      return printType === 'color' ? pricing.colorPriceA5 : pricing.bwPriceA5;
    }
    if (paperSize === 'A3') {
      return printType === 'color' ? pricing.colorPriceA3 : pricing.bwPriceA3;
    }
    return pricing.bwPriceA4;
  };

  // Binding fee
  const getBindingFee = () => {
    switch (binding) {
      case 'spiral':
        return pricing.bindingSpiralPrice;
      case 'thermal':
        return pricing.bindingThermalPrice;
      case 'hardcover':
        return pricing.bindingHardcoverPrice;
      case 'none':
      default:
        return 0;
    }
  };

  // Physical sheets count
  const divisor = getLayoutDivisor();
  const physicalSheetsCount = Math.ceil(pageCount / divisor);
  
  // Single copy print cost
  const singleCopyPaperCost = physicalSheetsCount * getSheetPrice();
  const bindingPricePerUnit = getBindingFee();
  const totalBindingCost = bindingPricePerUnit * (binding === 'none' ? 0 : bindingQuantity);
  const unitPrice = parseFloat(singleCopyPaperCost.toFixed(2));
  
  // Total price across all copies
  const grandTotal = parseFloat((unitPrice * copyCount + totalBindingCost).toFixed(2));

  const countPdfPages = async (file: File): Promise<number> => {
    try {
      const pdf = await getDocument({ data: await file.arrayBuffer() }).promise;
      return Math.max(1, pdf.numPages);
    } catch (error) {
      console.warn('PDF page count failed; using one page:', error);
      return 1;
    }
  };

  const readFileAsDataUrl = (file: File): Promise<string | undefined> => new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (event) => resolve(event.target?.result as string | undefined);
    reader.onerror = () => resolve(undefined);
    reader.readAsDataURL(file);
  });

  // Handle File Upload
  const handleFiles = async (filesList: FileList | null) => {
    if (!filesList || filesList.length === 0) return;

    const newFiles = (await Promise.all(Array.from(filesList).map(async (file): Promise<UploadedPrintFile | null> => {
      if (file.size > 500 * 1024 * 1024) return null;

      const fileId = `file-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      const measuredPages = file.type.includes('pdf') ? await countPdfPages(file) : 1;

      let previewUrl: string | undefined = undefined;
      if (file.type.includes('image')) {
        previewUrl = URL.createObjectURL(file);
      }

      return {
        id: fileId,
        name: file.name,
        size: file.size,
        type: file.type || 'application/octet-stream',
        previewUrl,
        pageCount: measuredPages,
        dataBase64: await readFileAsDataUrl(file),
        uploadedAt: new Date().toISOString(),
      };
    }))).filter((file): file is UploadedPrintFile => file !== null);

    setUploadedFiles((prev) => {
      const updated = [...prev, ...newFiles];
      const sumPages = updated.reduce((acc, f) => acc + f.pageCount, 0);
      if (sumPages > 0) setPageCount(sumPages);
      return updated;
    });
  };

  const removeFile = (id: string) => {
    setUploadedFiles((prev) => {
      const remaining = prev.filter((f) => f.id !== id);
      const sumPages = remaining.reduce((acc, f) => acc + f.pageCount, 0);
      if (sumPages > 0) {
        setPageCount(sumPages);
      } else {
        setPageCount(1);
      }
      return remaining;
    });
  };

  const updateIndividualFilePages = (id: string, newPages: number) => {
    const valid = Math.max(1, newPages);
    setUploadedFiles((prev) => {
      const updated = prev.map((f) => (f.id === id ? { ...f, pageCount: valid } : f));
      const sum = updated.reduce((acc, f) => acc + f.pageCount, 0);
      setPageCount(sum);
      return updated;
    });
  };

  const constructPrintJob = (): PrintJob => {
    return {
      id: `print-job-${Date.now()}`,
      files: uploadedFiles,
      printType,
      paperSize,
      layout,
      customLayoutPages: layout === 'custom' ? customLayoutPages : undefined,
      binding,
      bindingQuantity: binding === 'none' ? 0 : bindingQuantity,
      pageCount,
      copyCount,
      unitPrice,
      totalPrice: grandTotal,
      notes,
    };
  };

  const handleAddToCart = () => {
    const job = constructPrintJob();
    onAddPrintJobToCart(job);
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 3000);
  };

  const handleProceedCheckout = () => {
    const job = constructPrintJob();
    onDirectCheckout(job);
  };

  if (!isAvailable) {
    return (
      <section id="calculator" className="py-12 px-4 max-w-7xl mx-auto">
        <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-8 text-center shadow-sm">
          <AlertTriangle className="w-12 h-12 text-amber-600 mx-auto mb-3" />
          <h3 className="text-xl font-bold text-slate-800 font-heading">حاسبة الطباعة غير متاحة حالياً (خارج الخدمة)</h3>
          <p className="text-slate-600 mt-2 max-w-xl mx-auto">
            {offlineMessage || 'نعتذر عن تقديم خدمة الحاسبة الآلية في الوقت الراهن للصيانة. يُرجى التواصل معنا مباشرة عبر واتساب.'}
          </p>
          <a
            href="https://wa.me/972592480383"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md"
          >
            تواصل عبر واتساب: 0592480383
          </a>
        </div>
      </section>
    );
  }

  // Helper Labels for summary
  const getLayoutLabel = () => {
    const divisor = getLayoutDivisor();
    switch (layout) {
      case '1_per_page': return `صورة واحدة (قسمة ÷ ${divisor})`;
      case '2_per_page': return `صورتين في الورقة (قسمة ÷ ${divisor})`;
      case '4_per_page': return `أربع صور في الورقة (قسمة ÷ ${divisor})`;
      case 'custom': return `تخصيص يدوي (${divisor} شرائح/ورقة)`;
    }
  };

  const getBindingLabel = () => {
    switch (binding) {
      case 'none': return 'بدون تجليد';
      case 'spiral': return 'تجليد حلزوني';
      case 'thermal': return 'تجليد حراري';
      case 'hardcover': return 'غلاف كرتون محمي';
    }
  };

  return (
    <section id="calculator" className="py-14 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      
      {/* Section Title */}
      <div className="text-center mb-10 space-y-1">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading">
          حاسبة الطباعة الشاملة
        </h2>
        <p className="text-slate-500 text-sm">
          حدد خياراتك ويتم تحديث السعر لحظياً
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Summary Card (4 cols on lg) */}
        <div className="lg:col-span-4 order-2 lg:order-1">
          <div className="bg-[#0c1524] text-white rounded-2xl p-6 sm:p-7 shadow-xl space-y-6">
            
            {/* Header */}
            <div>
              <h3 className="font-heading font-extrabold text-lg text-[#caa242]">
                ملخص التسعير
              </h3>
            </div>

            {/* Breakdown List */}
            <div className="space-y-3.5 text-sm">
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-400">نوع الطباعة:</span>
                <span className="font-bold text-white">
                  {printType === 'bw' ? 'أبيض وأسود' : 'ملون'}
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-400">الحجم:</span>
                <span className="font-bold text-white">{paperSize}</span>
              </div>

              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-400">التوزيع:</span>
                <span className="font-bold text-white">{getLayoutLabel()}</span>
              </div>

              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-400">الأوراق الفعلية للنسخة:</span>
                <span className="font-bold text-[#caa242] font-mono">
                  {physicalSheetsCount} ورقة ({pageCount} صفحة ÷ {divisor})
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-400">التجليد:</span>
                <span className="font-bold text-white">{getBindingLabel()}</span>
              </div>

              {binding !== 'none' && (
                <div className="flex items-center justify-between text-slate-300">
                  <span className="text-slate-400">عدد التجليد:</span>
                  <span className="font-bold text-white">{bindingQuantity} × {bindingPricePerUnit.toFixed(2)}₪</span>
                </div>
              )}

              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-400">الصفحات × النسخ:</span>
                <span className="font-bold text-white">{pageCount} × {copyCount}</span>
              </div>

              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-400">الملفات المرفوعة:</span>
                <span className="font-bold text-white">{uploadedFiles.length}</span>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-slate-800 pt-4 space-y-4">
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-semibold text-slate-300">تكلفة الطباعة</span>
                <span className="text-2xl sm:text-3xl font-black text-[#caa242] font-heading">
                  {grandTotal.toFixed(2)}₪
                </span>
              </div>

              {/* Primary Action: Proceed to Checkout */}
              <button
                type="button"
                id="calc-btn-checkout"
                onClick={handleProceedCheckout}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-[#caa242] hover:bg-[#b88f34] text-slate-950 font-extrabold text-sm shadow-md transition-all active:scale-95"
              >
                <span>متابعة إلى إتمام الطلب</span>
                <ArrowLeft className="w-4 h-4" />
              </button>

              {/* Secondary Action: Add to Cart */}
              <button
                type="button"
                id="calc-btn-add-cart"
                onClick={handleAddToCart}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#142033] hover:bg-slate-800 text-slate-200 font-bold text-xs border border-slate-700 transition-all active:scale-95"
              >
                <ShoppingCart className="w-3.5 h-3.5 text-[#caa242]" />
                <span>إضافة إلى السلة</span>
              </button>

              {/* Toast */}
              {showSuccessToast && (
                <div className="p-2.5 bg-emerald-950/90 border border-emerald-600/50 rounded-xl text-emerald-300 text-xs text-center font-bold animate-fadeIn">
                  تمت إضافة ملفات الطباعة إلى السلة!
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Right Side: Options Form (8 cols on lg) */}
        <div className="lg:col-span-8 order-1 lg:order-2 space-y-6">
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-7">
            
            {/* 1. Upload Section */}
            <div className="space-y-3">
              <label className="font-bold text-sm text-slate-900 block">
                رفع الملفات (PDF, Word, صور)
              </label>

              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragOver(false);
                  handleFiles(e.dataTransfer.files);
                }}
                onClick={() => document.getElementById(fileInputId)?.click()}
                className={`border-2 border-dashed rounded-xl p-6 sm:p-8 text-center transition-all cursor-pointer ${
                  isDragOver
                    ? 'border-[#caa242] bg-[#fcf8ed]'
                    : 'border-slate-300 hover:border-[#caa242] bg-slate-50/50 hover:bg-[#fcf8ed]/40'
                }`}
              >
                <input
                  id={fileInputId}
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.png,.jpg,.jpeg"
                  className="hidden"
                  onChange={(e) => handleFiles(e.target.files)}
                />
                <div className="flex flex-col items-center justify-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                    <UploadCloud className="w-5 h-5" />
                  </div>
                  <p className="text-sm font-bold text-slate-800">
                    اضغط لاختيار الملفات أو اسحبها هنا
                  </p>
                  <p className="text-xs text-slate-400">
                    PDF, Word, PowerPoint, صور (الحد الأقصى 500MB)
                  </p>
                </div>
              </div>

              {/* Uploaded Files List */}
              {uploadedFiles.length > 0 && (
                <div className="space-y-2 pt-2">
                  {uploadedFiles.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <FileText className="w-4 h-4 text-[#caa242] shrink-0" />
                        <span className="font-semibold truncate">{file.name}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <label className="text-slate-500">الصفحات:</label>
                        <input
                          type="number"
                          min="1"
                          max="999"
                          value={file.pageCount}
                          onChange={(e) => updateIndividualFilePages(file.id, parseInt(e.target.value) || 1)}
                          className="w-14 px-2 py-1 text-center font-bold bg-white border border-slate-300 rounded-lg outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => removeFile(file.id)}
                          className="p-1 text-rose-500 hover:text-rose-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 2. Print Type */}
            <div className="space-y-2.5">
              <label className="font-bold text-sm text-slate-900 block">
                نوع الطباعة
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  id="btn-print-bw"
                  onClick={() => setPrintType('bw')}
                  className={`py-3 px-4 rounded-xl border-2 text-sm font-bold transition-all text-center ${
                    printType === 'bw'
                      ? 'border-[#caa242] bg-[#fcf8ed] text-slate-950'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  أبيض وأسود
                </button>

                <button
                  type="button"
                  id="btn-print-color"
                  onClick={() => setPrintType('color')}
                  className={`py-3 px-4 rounded-xl border-2 text-sm font-bold transition-all text-center ${
                    printType === 'color'
                      ? 'border-[#caa242] bg-[#fcf8ed] text-slate-950'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  ملون
                </button>
              </div>
            </div>

            {/* 3. Paper Size */}
            <div className="space-y-2.5">
              <label className="font-bold text-sm text-slate-900 block">
                حجم الورق
              </label>
              <div className="grid grid-cols-3 gap-3">
                {(['A4', 'A5', 'A3'] as PaperSize[]).map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setPaperSize(size)}
                    className={`py-3 px-4 rounded-xl border-2 text-sm font-bold transition-all text-center ${
                      paperSize === size
                        ? 'border-[#caa242] bg-[#fcf8ed] text-slate-950'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Single-Page Multi Layout */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="font-bold text-sm text-slate-900 block">
                  نظام الطباعة على الوجه الواحد (توزيع الشرائح)
                </label>
                <span className="text-xs font-bold text-[#b88f34]">
                  معامل التقسيم الفعلي: ÷{divisor}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { 
                    id: '1_per_page' as SinglePageLayout, 
                    label: 'صورة واحدة', 
                    sub: `تقسيم ÷ ${pricing.layoutDivisor1PerPage ?? 1}` 
                  },
                  { 
                    id: '2_per_page' as SinglePageLayout, 
                    label: 'صورتين بالورقة', 
                    sub: `تقسيم ÷ ${pricing.layoutDivisor2PerPage ?? 2}` 
                  },
                  { 
                    id: '4_per_page' as SinglePageLayout, 
                    label: 'أربع صور بالورقة', 
                    sub: `تقسيم ÷ ${pricing.layoutDivisor4PerPage ?? 4}` 
                  },
                  { 
                    id: 'custom' as SinglePageLayout, 
                    label: 'تخصيص يدوي', 
                    sub: `تقسيم ÷ ${customLayoutPages}` 
                  },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setLayout(item.id)}
                    className={`p-3 rounded-xl border-2 text-xs font-bold transition-all text-center flex flex-col items-center justify-center gap-0.5 ${
                      layout === item.id
                        ? 'border-[#caa242] bg-[#fcf8ed] text-slate-950 shadow-xs'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <span>{item.label}</span>
                    <span className="text-[10px] font-mono text-slate-500 font-semibold">{item.sub}</span>
                  </button>
                ))}
              </div>

              {layout === 'custom' && (
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs mt-2">
                  <div className="space-y-0.5">
                    <span className="font-bold text-slate-800 block">حدد معامل التقسيم اليدوي (عدد الشرائح في الورقة):</span>
                    <span className="text-[11px] text-slate-500">سيتم قسمة عدد الصفحات ({pageCount}) على هذا الرقم مباشرة</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      max="32"
                      value={customLayoutPages}
                      onChange={(e) => setCustomLayoutPages(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-20 px-3 py-1.5 text-center font-bold text-sm bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#caa242]"
                    />
                    <span className="font-bold text-slate-600">شرائح/ورقة</span>
                  </div>
                </div>
              )}
            </div>

            {/* 5. Binding Options */}
            <div className="space-y-2.5">
              <label className="font-bold text-sm text-slate-900 block">
                التجليد
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { id: 'none' as BindingOption, label: 'بدون تجليد' },
                  { id: 'spiral' as BindingOption, label: `تجليد حلزوني +${pricing.bindingSpiralPrice}₪` },
                  { id: 'thermal' as BindingOption, label: `تجليد حراري +${pricing.bindingThermalPrice}₪` },
                  { id: 'hardcover' as BindingOption, label: `غلاف كرتون محمي +${pricing.bindingHardcoverPrice}₪` },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setBinding(item.id)}
                    className={`p-3 rounded-xl border-2 text-xs font-bold transition-all text-center flex items-center justify-center ${
                      binding === item.id
                        ? 'border-[#caa242] bg-[#fcf8ed] text-slate-950'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {binding !== 'none' && (
                <div className="flex items-center justify-between gap-3 p-3 bg-[#fcf8ed] border border-[#caa242]/40 rounded-xl">
                  <span className="text-xs font-bold text-slate-800">عدد النسخ/الملفات المراد تجليدها</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setBindingQuantity((prev) => Math.max(1, prev - 1))}
                      className="w-8 h-8 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-bold active:scale-95"
                      aria-label="تقليل عدد التجليد"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <input
                      type="number"
                      min="1"
                      max="500"
                      value={bindingQuantity}
                      onChange={(e) => setBindingQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-16 text-center font-bold text-sm h-8 bg-white border border-slate-200 rounded-lg outline-none"
                      aria-label="عدد النسخ أو الملفات المراد تجليدها"
                    />
                    <button
                      type="button"
                      onClick={() => setBindingQuantity((prev) => prev + 1)}
                      className="w-8 h-8 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-bold active:scale-95"
                      aria-label="زيادة عدد التجليد"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 6. Page Count and Copy Count */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Pages */}
              <div className="space-y-1.5">
                <label className="font-bold text-sm text-slate-900 block">
                  عدد الصفحات
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPageCount((prev) => Math.max(1, prev - 1))}
                    className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 font-bold active:scale-95"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    type="number"
                    min="1"
                    max="5000"
                    value={pageCount}
                    onChange={(e) => setPageCount(Math.max(1, parseInt(e.target.value) || 1))}
                    className="flex-1 text-center font-bold text-base h-10 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setPageCount((prev) => prev + 1)}
                    className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 font-bold active:scale-95"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Copies */}
              <div className="space-y-1.5">
                <label className="font-bold text-sm text-slate-900 block">
                  عدد النسخ
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCopyCount((prev) => Math.max(1, prev - 1))}
                    className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 font-bold active:scale-95"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    value={copyCount}
                    onChange={(e) => setCopyCount(Math.max(1, parseInt(e.target.value) || 1))}
                    className="flex-1 text-center font-bold text-base h-10 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setCopyCount((prev) => prev + 1)}
                    className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 font-bold active:scale-95"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

            </div>

            {/* Optional Notes */}
            <div className="space-y-1.5">
              <label className="font-bold text-xs text-slate-600 block">
                ملاحظات إضافية (اختياري)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="أي تعليمات أو ملاحظات خاصة بالطباعة..."
                rows={2}
                className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#caa242] outline-none text-slate-800"
              ></textarea>
            </div>

          </div>
        </div>

      </div>

    </section>
  );
};

