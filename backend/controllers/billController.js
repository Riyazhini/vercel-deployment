import Bill from "../models/Bill.js";
import Product from "../models/Product.js";

// Create a new bill and reduce stock
export const createBill = async (req, res) => {
  try {
    const { customer, items, subTotal, discount, tax, totalAmount, paymentMethod } = req.body;

    // Validate essential data
    if (!customer || !items || items.length === 0) {
      return res.status(400).json({ message: "Customer and items are required" });
    }

    // Process items to check stock
    for (const item of items) {
      const productDoc = await Product.findById(item.product);
      if (!productDoc) {
        return res.status(404).json({ message: `Product ${item.product} not found` });
      }
      if (productDoc.stock < item.quantity) {
        return res.status(400).json({ message: `Insufficient stock for product ${productDoc.name}` });
      }
    }

    // Generate readable sequential invoice number (INV-1001, INV-1002...)
    const lastBill = await Bill.findOne().sort({ date: -1 });
    let nextInvoiceNum = 1001;
    if (lastBill && lastBill.invoiceNumber) {
      const lastNumStr = lastBill.invoiceNumber.split('-')[1];
      if (!isNaN(parseInt(lastNumStr))) {
        nextInvoiceNum = parseInt(lastNumStr) + 1;
      }
    }
    const invoiceNumber = `INV-${nextInvoiceNum}`;

    // Create the bill
    const bill = new Bill({
      invoiceNumber,
      customer,
      items,
      subTotal,
      discount: discount || 0,
      tax: tax || 0,
      totalAmount,
      paymentMethod: paymentMethod || 'Cash'
    });
    
    const savedBill = await bill.save();

    // Deduct stock (This is the only place stock is updated)
    for (const item of items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity }
      });
    }

    // Return the bill populated with customer and product details
    const populatedBill = await Bill.findById(savedBill._id)
      .populate('customer', 'name phone address')
      .populate('items.product', 'name brand category price');

    res.status(201).json(populatedBill);

  } catch (error) {
    console.error("Error creating bill:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get all bills
export const getBills = async (req, res) => {
  try {
    const bills = await Bill.find()
      .populate('customer', 'name phone address') 
      .populate('items.product', 'name brand category price');
      
    res.json(bills);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a single bill by ID (for invoice generation)
export const getBillById = async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id)
      .populate('customer', 'name phone address')
      .populate('items.product', 'name brand category price');

    if (!bill) {
      return res.status(404).json({ message: "Bill not found" });
    }

    res.json(bill);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get next sequential invoice number
export const getNextInvoiceNumber = async (req, res) => {
  try {
    const lastBill = await Bill.findOne().sort({ date: -1 });
    let nextInvoiceNum = 1001;
    if (lastBill && lastBill.invoiceNumber) {
      const lastNumStr = lastBill.invoiceNumber.split('-')[1];
      if (!isNaN(parseInt(lastNumStr))) {
        nextInvoiceNum = parseInt(lastNumStr) + 1;
      }
    }
    res.json({ invoiceNumber: `INV-${nextInvoiceNum}` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get total spending for a specific customer
export const getCustomerSpending = async (req, res) => {
  try {
    const totalSpent = await Bill.aggregate([
      { $match: { customer: req.params.customerId } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } }
    ]);
    res.json({ totalSpent: totalSpent.length > 0 ? totalSpent[0].total : 0 });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};