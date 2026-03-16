import { useState, useEffect } from 'react';
import { Eye, Download, Search } from 'lucide-react';
import api from '../services/api';
import InvoiceModal from '../components/InvoiceModal';

export default function SalesHistory() {
  const [historyData, setHistoryData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedBill, setSelectedBill] = useState(null);
  const [loadingBillId, setLoadingBillId] = useState(null);

  useEffect(() => {
    fetchBills();
  }, []);

  const fetchBills = async () => {
    try {
      const { data } = await api.get('/bills');
      const formatted = data.map(bill => ({
        id: bill._id,
        displayId: bill.invoiceNumber || bill._id.substring(bill._id.length - 8).toUpperCase(),
        date: new Date(bill.date).toLocaleDateString('en-IN', { 
          year: 'numeric', month: 'short', day: 'numeric' 
        }),
        customer: bill.customer ? bill.customer.name : 'Unknown User',
        amount: `₹${bill.totalAmount.toLocaleString('en-IN')}`,
        paymentMethod: bill.paymentMethod || 'Cash',
        status: 'Paid' 
      }));
      setHistoryData(formatted.reverse());
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch bills history:', error);
      setLoading(false);
    }
  };

  const openInvoice = async (billId) => {
    setLoadingBillId(billId);
    try {
      const { data } = await api.get(`/bills/${billId}`);
      setSelectedBill(data);
    } catch (error) {
      console.error('Failed to load bill details:', error);
      alert('Could not load invoice details.');
    } finally {
      setLoadingBillId(null);
    }
  };

  const filteredHistory = historyData.filter(h => 
    h.displayId.includes(searchTerm.toUpperCase()) || 
    h.customer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Sales History
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            View past invoices and transaction history.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-900/5">
        <div className="p-4 border-b border-gray-200 sm:flex sm:items-center sm:justify-between">
          <div className="relative rounded-md shadow-sm max-w-sm w-full">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-4 w-4 text-gray-400" aria-hidden="true" />
            </div>
            <input
              type="text"
              name="search"
              id="search"
              className="block w-full rounded-md border-0 py-1.5 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-theme-primary sm:text-sm sm:leading-6"
              placeholder="Search invoices by ID or customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="mt-8 flow-root">
          <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
              {loading ? (
                <div className="text-center py-10 text-gray-500">Loading history...</div>
              ) : filteredHistory.length === 0 ? (
                <div className="text-center py-10 text-gray-500">No bills found.</div>
              ) : (
                <table className="min-w-full divide-y divide-gray-300">
                  <thead>
                    <tr>
                      <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0">
                        Invoice ID
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Date
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Customer
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Amount
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Payment
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Status
                      </th>
                      <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-0">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredHistory.map((invoice) => (
                      <tr key={invoice.id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-theme-primary sm:pl-0">
                          #{invoice.displayId}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{invoice.date}</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">{invoice.customer}</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900 font-medium">{invoice.amount}</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          <span className="inline-flex items-center gap-1">
                            {invoice.paymentMethod}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          <span className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset bg-green-50 text-green-700 ring-green-600/20">
                            {invoice.status}
                          </span>
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-0">
                          <div className="flex justify-end gap-3">
                            <button
                              onClick={() => openInvoice(invoice.id)}
                              disabled={loadingBillId === invoice.id}
                              title="View Invoice"
                              className="text-gray-400 hover:text-theme-primary transition-colors disabled:opacity-50"
                            >
                              {loadingBillId === invoice.id 
                                ? <span className="text-xs">...</span>
                                : <Eye className="h-5 w-5" />
                              }
                            </button>
                            <button
                              onClick={() => openInvoice(invoice.id)}
                              title="Download PDF"
                              className="text-gray-400 hover:text-theme-primary transition-colors"
                            >
                              <Download className="h-5 w-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Invoice Modal */}
      {selectedBill && (
        <InvoiceModal
          bill={selectedBill}
          onClose={() => setSelectedBill(null)}
        />
      )}
    </div>
  );
}
