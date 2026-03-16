import { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  Trash2, 
  Calculator, 
  CheckCircle2, 
  Search, 
  UserPlus, 
  Eye,
  X,
  Minus,
  RefreshCw,
  Printer,
  Download,
  AlertTriangle,
  ChevronDown,
  Info
} from 'lucide-react';
import api from '../services/api';
import InvoiceModal from '../components/InvoiceModal';

export default function Billing() {
  // Data states
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  
  // Selection states
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [customerTotalSpending, setCustomerTotalSpending] = useState(0);
  const [nextInvoiceNum, setNextInvoiceNum] = useState('INV-1001');
  
  const [productSearch, setProductSearch] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  
  const [items, setItems] = useState([]);
  
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  
  // UI states
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [dataError, setDataError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [generatedBill, setGeneratedBill] = useState(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  
  // New Customer Modal state
  const [showNewCustomerModal, setShowNewCustomerModal] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', address: '' });

  const customerDropdownRef = useRef(null);
  const productDropdownRef = useRef(null);

  useEffect(() => {
    fetchInitialData();
    
    // Click outside handler
    const handleClickOutside = (event) => {
      if (customerDropdownRef.current && !customerDropdownRef.current.contains(event.target)) {
        setShowCustomerDropdown(false);
      }
      if (productDropdownRef.current && !productDropdownRef.current.contains(event.target)) {
        setShowProductDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoadingInitial(true);
      setDataError(null);
      const [customersRes, productsRes, invoiceRes] = await Promise.all([
        api.get('/customers'),
        api.get('/products'),
        api.get('/bills/next-invoice')
      ]);
      setCustomers(customersRes.data || []);
      setProducts(productsRes.data || []);
      setNextInvoiceNum(invoiceRes.data?.invoiceNumber || 'INV-1001');
    } catch (error) {
      console.error("Failed to fetch initial billing data:", error);
      setDataError("Database connection failed. Please ensure the backend and MongoDB are running.");
    } finally {
      setLoadingInitial(false);
    }
  };

  useEffect(() => {
    if (selectedCustomerId) {
      fetchCustomerSpending(selectedCustomerId);
    } else {
      setCustomerTotalSpending(0);
    }
  }, [selectedCustomerId]);

  const fetchCustomerSpending = async (id) => {
    try {
      const { data } = await api.get(`/bills/customer-spending/${id}`);
      setCustomerTotalSpending(data.totalSpent);
    } catch (error) {
      console.error("Failed to fetch spending:", error);
    }
  };

  // --- Calculations ---
  const subTotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subTotal * 0.10; // Updated to 10% GST
  const finalTotal = subTotal + tax - discount;

  // --- Customer Selection ---
  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) || 
    c.phone.includes(customerSearch)
  );

  const selectCustomer = (c) => {
    setSelectedCustomerId(c._id);
    setCustomerSearch(c.name);
    setShowCustomerDropdown(false);
  };

  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/customers', newCustomer);
      setCustomers([...customers, data]);
      selectCustomer(data);
      setShowNewCustomerModal(false);
      setNewCustomer({ name: '', phone: '', address: '' });
    } catch (error) {
      alert("Failed to add customer: " + error.message);
    }
  };

  // --- Product Selection ---
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.category?.toLowerCase().includes(productSearch.toLowerCase())
  );

  const addProductToBill = (product) => {
    const productIdStr = String(product._id);
    const existingIndex = items.findIndex(item => String(item.productId) === productIdStr);
    
    if (existingIndex > -1) {
      const newItems = [...items];
      if (newItems[existingIndex].quantity < product.stock) {
        newItems[existingIndex].quantity += 1;
        setItems(newItems);
      } else {
        alert("Cannot add more than available stock!");
      }
    } else {
      setItems([...items, {
        productId: productIdStr,
        name: product.name,
        category: product.category,
        brand: product.brand,
        price: product.price,
        quantity: 1,
        stock: product.stock
      }]);
    }
    setProductSearch('');
    setShowProductDropdown(false);
  };

  const updateQuantity = (index, delta) => {
    const newItems = [...items];
    const newQty = newItems[index].quantity + delta;
    if (newQty > 0 && newQty <= newItems[index].stock) {
      newItems[index].quantity = newQty;
      setItems(newItems);
    } else if (newQty > newItems[index].stock) {
      alert("Insufficient stock!");
    }
  };

  const removeItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const clearBill = () => {
    if (window.confirm("Clear all items?")) {
      setItems([]);
      setDiscount(0);
      setSelectedCustomerId('');
      setCustomerSearch('');
      setGeneratedBill(null);
    }
  };

  const handlePreview = () => {
    if (!selectedCustomerId) return alert("Select a customer first.");
    if (items.length === 0) return alert("Add products first.");
    
    // Create mock bill for modal
    const billData = {
      invoiceNumber: nextInvoiceNum,
      customer: customers.find(c => c._id === selectedCustomerId),
      items: items.map(i => ({
        product: { name: i.name, brand: i.brand, category: i.category },
        quantity: i.quantity,
        price: i.price
      })),
      subTotal,
      tax,
      discount,
      totalAmount: finalTotal,
      paymentMethod,
      date: new Date()
    };
    
    setGeneratedBill(billData);
    setIsPreviewMode(true);
    setShowInvoiceModal(true);
  };

  const submitBill = async () => {
    if (!selectedCustomerId) return alert("Please select a customer.");
    if (items.length === 0) return alert("Please add at least one product.");

    setIsSubmitting(true);
    try {
      const payload = {
        customer: selectedCustomerId,
        items: items.map(i => ({
          product: i.productId,
          quantity: i.quantity,
          price: i.price
        })),
        subTotal,
        tax,
        discount,
        totalAmount: finalTotal,
        paymentMethod
      };

      const { data } = await api.post('/bills/create', payload);
      setGeneratedBill(data);
      setIsPreviewMode(false);
      setShowInvoiceModal(true);
      setSuccessMessage(`Invoice ${data.invoiceNumber} generated!`);
      
      // Reset form ONLY on success
      setItems([]);
      setSelectedCustomerId('');
      setCustomerSearch('');
      setDiscount(0);
      fetchInitialData(); // Refresh stock and next invoice number
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (error) {
      alert(error.response?.data?.message || "Failed to generate bill.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingInitial) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 border-4 border-theme-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Loading POS System...</p>
        </div>
      </div>
    );
  }

  if (dataError) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-100 rounded-3xl p-8 text-center max-w-2xl mx-auto mt-10">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-black text-gray-900 mb-2">System Offline</h2>
          <p className="text-sm text-gray-600 mb-6">{dataError}</p>
          <button 
            onClick={fetchInitialData}
            className="px-6 py-2 bg-theme-primary text-white rounded-xl font-bold shadow-lg shadow-theme-primary/20"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  const selectedCustomer = customers.find(c => c._id === selectedCustomerId);

  return (
    <div className="max-w-[1440px] mx-auto p-4 lg:p-6 space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Billing POS</h1>
          <p className="text-sm text-gray-500">Create new bills and calculate totals. Stock automatically adjusts on generation.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 shadow-sm transition-all">
            <Printer className="h-4 w-4" />
            Print
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-theme-secondary text-white rounded-lg text-sm font-semibold hover:bg-theme-hover shadow-md transition-all">
            <Download className="h-4 w-4" />
            Download PDF
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-100 rounded-xl text-green-800">
          <CheckCircle2 className="h-5 w-5 text-green-500" />
          <span className="text-sm font-medium">{successMessage}</span>
        </div>
      )}

      {/* Customer Loyalty Alert */}
      {customerTotalSpending > 5000 && (
        <div className="flex items-center gap-4 p-4 bg-indigo-50 border border-indigo-100 rounded-2xl">
          <div className="p-2 bg-white rounded-lg shadow-sm">
            <Info className="h-5 w-5 text-indigo-500" />
          </div>
          <p className="text-sm font-bold text-indigo-900">
            Customer spending exceeded ₹5000 (Current total: ₹{customerTotalSpending.toLocaleString()}). <span className="text-indigo-600 underline">Add a discount of 15%</span>
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: POS Controls */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Customer Selection */}
          <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-base font-bold text-gray-900 mb-4">Customer Selection</h3>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1" ref={customerDropdownRef}>
                <input
                  type="text"
                  placeholder="Search by name or phone..."
                  className="w-full pl-4 pr-10 py-2.5 bg-gray-50 border-gray-200 rounded-xl focus:ring-2 focus:ring-theme-primary focus:border-transparent text-sm"
                  value={customerSearch}
                  onChange={(e) => {
                    setCustomerSearch(e.target.value);
                    setShowCustomerDropdown(true);
                  }}
                  onFocus={() => setShowCustomerDropdown(true)}
                />
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                
                {showCustomerDropdown && (
                  <div className="absolute z-30 mt-2 w-full max-h-60 overflow-auto rounded-xl bg-white py-2 shadow-2xl ring-1 ring-black/5 border border-gray-100">
                    {filteredCustomers.length > 0 ? (
                      filteredCustomers.map(c => (
                        <button
                          key={String(c._id)}
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            selectCustomer(c);
                          }}
                          className={`w-full text-left px-4 py-3 hover:bg-theme-bg group transition-colors ${selectedCustomerId === c._id ? 'bg-theme-bg border-l-4 border-theme-primary' : ''}`}
                        >
                          <p className="text-sm font-bold text-gray-900 group-hover:text-theme-primary">{c.name}</p>
                          <p className="text-xs text-gray-500">{c.phone}</p>
                        </button>
                      ))
                    ) : (
                      <p className="px-4 py-3 text-sm text-gray-400 italic text-center">No customers found</p>
                    )}
                  </div>
                )}
              </div>
              <button 
                onClick={() => setShowNewCustomerModal(true)}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-gray-100 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 hover:border-gray-200 transition-all"
              >
                <Plus className="h-4 w-4" />
                Add New Customer
              </button>
            </div>
          </section>

          {/* Product Selection */}
          <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-base font-bold text-gray-900 mb-4">Product Selection</h3>
            <div className="relative mb-6" ref={productDropdownRef}>
              <div 
                className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-50 border-gray-200 rounded-xl cursor-pointer hover:border-gray-300 transition-all"
                onClick={() => setShowProductDropdown(!showProductDropdown)}
              >
                <Search className="h-4 w-4 text-gray-400 mr-3" />
                <input 
                  type="text"
                  placeholder="Search product..."
                  className="bg-transparent border-none focus:ring-0 p-0 text-sm flex-1"
                  value={productSearch}
                  onChange={(e) => {
                    setProductSearch(e.target.value);
                    setShowProductDropdown(true);
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
                <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${showProductDropdown ? 'rotate-180' : ''}`} />
              </div>

              {showProductDropdown && (
                <div className="absolute z-20 mt-2 w-full max-h-[300px] overflow-auto rounded-xl bg-white py-2 shadow-2xl ring-1 ring-black/5 border border-gray-100">
                  {filteredProducts.length > 0 ? (
                    filteredProducts.map(p => (
                      <button
                        key={String(p._id)}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          addProductToBill(p);
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-theme-bg flex items-center justify-between group transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-white transition-colors">
                            <Plus className="h-4 w-4 text-theme-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900">{p.name}</p>
                            <p className="text-xs text-gray-500">Stock: {p.stock} | ₹{p.price}</p>
                          </div>
                        </div>
                      </button>
                    ))
                  ) : (
                    <p className="px-4 py-8 text-sm text-gray-400 italic text-center">No products match your search</p>
                  )}
                </div>
              )}
            </div>

            {/* Added Products Table */}
            {items.length > 0 ? (
              <div className="overflow-hidden border border-gray-100 rounded-xl mb-6">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="px-4 py-3 text-left">Product Name</th>
                      <th className="px-4 py-3 text-left">Category</th>
                      <th className="px-4 py-3 text-center">Qty</th>
                      <th className="px-4 py-3 text-right">Price</th>
                      <th className="px-4 py-3 text-right">Total</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {items.map((item, idx) => (
                      <tr key={item.productId} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-4 font-bold text-gray-900">{item.name}</td>
                        <td className="px-4 py-4 text-gray-500">{item.category || '-'}</td>
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button onClick={() => updateQuantity(idx, -1)} className="p-1.5 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"><Minus className="h-3 w-3"/></button>
                            <span className="w-8 text-center font-bold">{item.quantity}</span>
                            <button onClick={() => updateQuantity(idx, 1)} className="p-1.5 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"><Plus className="h-3 w-3"/></button>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-right text-gray-500 font-medium">₹{item.price.toLocaleString()}</td>
                        <td className="px-4 py-4 text-right font-bold text-gray-900">₹{(item.price * item.quantity).toLocaleString()}</td>
                        <td className="px-4 py-4 text-right">
                          <button onClick={() => removeItem(idx)} className="p-1.5 text-red-500 bg-red-50 rounded-lg hover:bg-red-500 hover:text-white transition-all"><Trash2 className="h-4 w-4"/></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
                <div className="py-12 border-2 border-dashed border-gray-100 rounded-2xl text-center mb-6">
                    <p className="text-sm text-gray-400">Search products above to add to bill</p>
                </div>
            )}

            <div className="flex items-center justify-between gap-4">
              <button 
                onClick={() => setShowProductDropdown(true)}
                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all"
              >
                <Plus className="h-4 w-4" />
                Add Product
              </button>
              
              <div className="flex items-center gap-3">
                <button 
                  onClick={clearBill}
                  className="px-6 py-2.5 text-sm font-bold text-gray-400 hover:text-gray-900 transition-colors"
                >
                  Clear Bill
                </button>
                <button 
                  onClick={handlePreview}
                  className="px-8 py-2.5 bg-theme-primary text-white rounded-xl text-sm font-bold hover:bg-theme-hover shadow-lg shadow-theme-primary/20 transition-all"
                >
                  Preview Invoice
                </button>
              </div>
            </div>
          </section>

          {/* Low Stock Warning */}
          {products.some(p => p.stock < 5) && (
            <div className="flex items-start gap-4 p-5 bg-amber-50 rounded-2xl border border-amber-100">
              <div className="p-2 bg-white rounded-lg shadow-sm">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-amber-900">Low Stock</h4>
                <p className="text-xs text-amber-700 mt-1">
                  {products.filter(p => p.stock < 5).map(p => `${p.name} is low on stock`).join(', ')}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Invoice Preview */}
        <div className="lg:col-span-5 h-[calc(100vh-14rem)] sticky top-6">
          <div className="bg-white rounded-3xl p-6 lg:p-8 shadow-2xl border border-gray-100 flex flex-col h-full overflow-hidden">
            <h3 className="flex items-center gap-2 text-base font-bold text-gray-900 mb-8 pb-4 border-b border-gray-50">
              <Calculator className="h-5 w-5 text-theme-primary" />
              Invoice Preview
            </h3>

            <div className="flex-1 overflow-y-auto space-y-8 pr-2 custom-scrollbar">
              <div className="space-y-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-black text-gray-900 italic tracking-tighter">Lumo Industries</h2>
                    <p className="text-[10px] text-gray-400 leading-tight mt-1 max-w-[180px]">Motor & Electrical Goods, Chennai, Tamil Nadu<br/>+91 99765 22310<br/>GSTIN: 33AAAAA0000AIZ5</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{nextInvoiceNum}</p>
                  </div>
                </div>

                <div className="flex justify-between items-end border-y border-gray-50 py-4 mt-8">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-gray-400 uppercase">Bill To</p>
                    <p className="text-sm font-bold text-gray-900">{selectedCustomer?.name || '---'}</p>
                    <p className="text-[10px] text-gray-500">{selectedCustomer?.phone || '---'}</p>
                    <p className="text-[10px] text-gray-400">{selectedCustomer?.address || '---'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-gray-400 uppercase">Staff Member</p>
                    <p className="text-[10px] text-gray-500 font-bold">Admin</p>
                  </div>
                </div>

                {/* Items Mini Table */}
                <div className="space-y-3">
                  <div className="flex justify-between text-[10px] font-black text-gray-400 uppercase border-b border-gray-50 pb-2">
                    <span>Product Name</span>
                    <div className="flex gap-6">
                      <span className="w-12 text-center">Qty</span>
                      <span className="w-16 text-right">Price</span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {items.map(item => (
                      <div key={item.productId} className="flex justify-between text-xs items-center">
                        <div className="flex-1">
                          <p className="font-bold text-gray-900">{item.name}</p>
                          <p className="text-[9px] text-gray-400 font-bold uppercase">{item.category}</p>
                        </div>
                        <div className="flex gap-6 items-center">
                          <span className="w-12 text-center text-gray-500 font-bold">{item.quantity}</span>
                          <span className="w-16 text-right font-black text-gray-900">₹{item.price.toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                    {items.length === 0 && <p className="text-center py-6 text-[10px] text-gray-300 italic">No products added</p>}
                  </div>
                </div>

                {/* Totals */}
                <div className="space-y-3 border-t border-gray-50 pt-6 mt-6">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400 font-bold uppercase text-[10px]">Subtotal</span>
                    <span className="font-bold text-gray-900 italic">Total</span>
                    <span className="font-bold text-gray-900">₹{subTotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-400 font-bold uppercase text-[10px]">Discount</span>
                    <input 
                      type="number"
                      className="w-20 py-1 text-right font-bold text-gray-900 bg-gray-50 border-none rounded-lg focus:ring-1 focus:ring-theme-primary transition-all text-xs"
                      value={discount}
                      onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400 font-bold uppercase text-[10px]">Tax (10% GST)</span>
                    <span className="font-bold text-gray-900">₹{tax.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center pt-6 mt-4 border-t border-gray-50">
                    <span className="text-sm font-black text-gray-900 uppercase tracking-tighter">Total Amount</span>
                    <span className="text-2xl font-black text-theme-primary tracking-tighter">₹{finalTotal.toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-8">
                  <div className="flex items-center gap-2">
                    <p className="text-[10px] font-black text-gray-400 uppercase">Payment Method:</p>
                    <select 
                      className="text-[10px] font-black uppercase text-theme-primary bg-theme-bg border-none py-1 px-3 rounded-full cursor-pointer focus:ring-0 appearance-none"
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    >
                      <option>Cash</option>
                      <option>UPI</option>
                      <option>Card</option>
                    </select>
                  </div>
                  <span className="px-3 py-1 bg-green-50 text-green-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-green-100 flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    Paid
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-50 text-center">
              <p className="text-[10px] font-bold text-gray-400 italic">Thank you for your business!</p>
              <p className="text-[9px] text-gray-300 mt-1 uppercase tracking-[0.2em] font-black">Lumo Industries - 2026</p>
              
              <div className="grid grid-cols-2 gap-3 mt-8">
                <button 
                    disabled={items.length === 0}
                    onClick={handlePreview}
                    className="flex items-center justify-center gap-2 py-3 bg-gray-50 rounded-2xl text-xs font-bold text-gray-500 hover:bg-gray-100 transition-all disabled:opacity-30"
                >
                  <Eye className="h-4 w-4" />
                  Preview
                </button>
                <button 
                  onClick={submitBill}
                  disabled={isSubmitting || items.length === 0 || !selectedCustomerId}
                  className="flex items-center justify-center py-3 bg-theme-primary text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-theme-hover shadow-xl shadow-theme-primary/20 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'Generating...' : 'Generate Bill'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* New Customer Modal */}
      {showNewCustomerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-8 shadow-2xl relative">
            <button onClick={() => setShowNewCustomerModal(false)} className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-900"><X className="h-6 w-6"/></button>
            <div className="mb-8"><h3 className="text-2xl font-black text-gray-900">Add New Customer</h3><p className="text-sm text-gray-500 mb-6">Create a new profile for billing.</p></div>
            <form onSubmit={handleCreateCustomer} className="space-y-6">
              <div><label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Full Name</label><input type="text" required className="w-full py-3 px-4 bg-gray-50 border-gray-100 rounded-2xl focus:ring-2 focus:ring-theme-primary" value={newCustomer.name} onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})}/></div>
              <div><label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Phone</label><input type="text" required className="w-full py-3 px-4 bg-gray-50 border-gray-100 rounded-2xl focus:ring-2 focus:ring-theme-primary" value={newCustomer.phone} onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})}/></div>
              <div><label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Address</label><textarea className="w-full py-3 px-4 bg-gray-50 border-gray-100 rounded-2xl focus:ring-2 focus:ring-theme-primary" rows="2" value={newCustomer.address} onChange={(e) => setNewCustomer({...newCustomer, address: e.target.value})}/></div>
              <button type="submit" className="w-full py-4 bg-theme-secondary text-white rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-theme-hover transition-all">Save & Continue</button>
            </form>
          </div>
        </div>
      )}

      {/* Invoice Final/Preview Modal */}
      {showInvoiceModal && generatedBill && (
        <InvoiceModal
          bill={generatedBill}
          onClose={() => {
              setShowInvoiceModal(false);
              setGeneratedBill(isPreviewMode ? null : generatedBill); // Keep generated bill if it was a real submission, clear if preview
          }}
          preview={isPreviewMode}
        />
      )}
    </div>
  );
}