import express from "express";
import {
  addProduct,
  getProducts,
  updateProduct,
  deleteProduct
} from "../controllers/productController.js";

import { verifyToken } from "../middleware/authMiddleware.js";
import { isAdmin } from "../middleware/roleMiddleware.js";

const router = express.Router();

// View all products (Admin + Staff)
router.get("/", verifyToken, getProducts);

// Add new product (Admin only)
router.post("/", verifyToken, isAdmin, addProduct);

// Update product (Admin only)
router.put("/:id", verifyToken, isAdmin, updateProduct);

// Delete product (Admin only)
router.delete("/:id", verifyToken, isAdmin, deleteProduct);

export default router;