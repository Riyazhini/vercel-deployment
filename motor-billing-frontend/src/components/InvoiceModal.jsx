import { useRef } from 'react';
import { 
  X, 
  Printer, 
  Download, 
  CheckCircle2, 
  Phone, 
  Mail, 
  MapPin, 
  Info,
  Banknote,
  CreditCard,
  Smartphone,
  User
} from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export default function InvoiceModal({ bill, onClose, preview = false }) {
  const invoiceRef = useRef();

  if (!bill) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    const element = invoiceRef.current;
    const canvas = await html2canvas(element, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`Invoice-${bill.invoiceNumber || 'BILL'}.pdf`);
  };

  const getPaymentIcon = (method) => {
    switch(method) {
      case 'Cash': return <Banknote className="h-4 w-4" />;
      case 'UPI': return <Smartphone className="h-4 w-4" />;
      case 'Card': return <CreditCard className="h-4 w-4" />;
      default: return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm overflow-y-auto modal-overlay">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl flex flex-col max-h-[95vh] overflow-hidden">
        
        {/* Header Actions */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50 print-hidden">
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${preview ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-theme-bg text-theme-primary border-theme-primary/10'}`}>
              {preview ? 'Invoice Preview' : 'Official Invoice'}
            </span>
            <span className="text-sm font-bold text-gray-400">
              #{bill.invoiceNumber}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="group flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all shadow-sm"
            >
              <Printer className="h-4 w-4 text-gray-400 group-hover:text-theme-primary" />
              Print
            </button>
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-2 px-4 py-2 bg-theme-secondary text-white rounded-xl text-sm font-bold hover:bg-theme-hover shadow-lg shadow-theme-secondary/20 transition-all"
            >
              <Download className="h-4 w-4" />
              Download PDF
            </button>
            <button
              onClick={onClose}
              className="ml-2 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Invoice Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-10 bg-gray-50/30 custom-scrollbar">
          <div 
            ref={invoiceRef} 
            className="invoice-print-area bg-white p-12 shadow-sm border border-gray-100 rounded-3xl print:shadow-none print:border-none print:p-0 max-w-3xl mx-auto"
          >
            {/* Store Header */}
            <div className="flex justify-between items-start mb-12">
              <div className="flex-1">
                <h1 className="text-3xl font-black text-gray-900 tracking-tighter italic mb-3">Lumo Industries</h1>
                <div className="space-y-1 text-[11px] text-gray-500 font-medium">
                  <p className="flex items-center gap-2 max-w-[220px]">Motor & Electrical Goods, Chennai, Tamil Nadu</p>
                  <p className="">+91 99765 22310</p>
                  <p className="">GSTIN: <span className="text-gray-900 uppercase">33AAAAA0000AIZ5</span></p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Invoice Number</p>
                <p className="text-2xl font-black text-gray-900 tracking-tighter">{bill.invoiceNumber}</p>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-6 mb-1">Date</p>
                <p className="text-sm font-bold text-gray-900">{new Date(bill.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
              </div>
            </div>

            {/* Customer & Staff Info */}
            <div className="flex justify-between items-end border-y border-gray-100 py-8 mb-12">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-theme-bg rounded-2xl">
                  <User className="h-5 w-5 text-theme-primary" />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Bill To</p>
                  <p className="text-lg font-black text-gray-900 leading-tight">{bill.customer?.name}</p>
                  <p className="text-xs font-bold text-gray-500">{bill.customer?.phone}</p>
                  <p className="text-[11px] font-medium text-gray-400 max-w-[200px] leading-relaxed">{bill.customer?.address || '---'}</p>
                </div>
              </div>
              <div className="text-right space-y-1">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Staff Member</p>
                <p className="text-sm font-bold text-gray-900">Admin User</p>
                <p className="text-[10px] font-medium text-gray-400 italic">Verified Billing Staff</p>
              </div>
            </div>

            {/* Items Table */}
            <table className="w-full mb-12">
              <thead>
                <tr className="border-b-2 border-gray-900 pb-3">
                  <th className="py-4 text-left text-[11px] font-black text-gray-400 uppercase tracking-widest">Product Name</th>
                  <th className="py-4 text-center text-[11px] font-black text-gray-400 uppercase tracking-widest">Category</th>
                  <th className="py-4 text-center text-[11px] font-black text-gray-400 uppercase tracking-widest">Qty</th>
                  <th className="py-4 text-right text-[11px] font-black text-gray-400 uppercase tracking-widest">Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {bill.items.map((item, index) => (
                  <tr key={index}>
                    <td className="py-5">
                      <p className="font-black text-gray-900">{item.product?.name}</p>
                      <p className="text-[10px] font-bold text-gray-400">{item.product?.brand}</p>
                    </td>
                    <td className="py-5 text-center">
                      <span className="px-2 py-1 bg-gray-50 text-gray-500 rounded text-[9px] font-black uppercase tracking-widest">
                        {item.product?.category}
                      </span>
                    </td>
                    <td className="py-5 text-center text-sm font-bold text-gray-900">{item.quantity}</td>
                    <td className="py-5 text-right font-black text-gray-900 whitespace-nowrap">₹{item.price.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Summary Grid */}
            <div className="flex flex-col items-end pt-8 border-t border-gray-100">
              <div className="w-full max-w-xs space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Subtotal</span>
                  <span className="text-gray-900 font-black">₹{(bill.subTotal || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Discount</span>
                  <span className="text-red-500 font-black">- ₹{(bill.discount || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Tax (10% GST)</span>
                  <span className="text-gray-900 font-black">₹{(bill.tax || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center bg-gray-900 text-white p-6 rounded-3xl mt-6 shadow-xl shadow-gray-900/10">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Total Amount</span>
                  <span className="text-3xl font-black tracking-tighter">₹{bill.totalAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Payment & Footer */}
            <div className="mt-16 pt-8 border-t border-gray-100 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Payment Method:</p>
                <div className="flex items-center gap-1.5 text-xs font-black text-gray-900 uppercase">
                  {getPaymentIcon(bill.paymentMethod)}
                  {bill.paymentMethod}
                </div>
              </div>
              <div className="px-4 py-1.5 bg-green-500 text-white rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                <CheckCircle2 className="h-3 w-3" />
                Fully Paid
              </div>
            </div>

            <div className="mt-16 text-center">
              <p className="text-xs font-black text-gray-900 uppercase tracking-widest mb-1">Thank you for your business!</p>
              <p className="text-[10px] text-gray-400 leading-tight">This is a computer generated invoice and does not require a physical signature.</p>
              <p className="text-[9px] font-bold text-theme-primary uppercase tracking-[0.3em] mt-8">Lumo Industries &copy; 2026</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
