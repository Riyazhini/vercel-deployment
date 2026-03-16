import express from "express";
import { createBill, getBills, getBillById, getNextInvoiceNumber, getCustomerSpending } from "../controllers/billController.js";
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(verifyToken);

router.post("/create", createBill);
router.get("/next-invoice", getNextInvoiceNumber);
router.get("/customer-spending/:customerId", getCustomerSpending);
router.get("/", getBills);
router.get("/:id", getBillById);

export default router;