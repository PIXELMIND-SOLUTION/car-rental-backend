import express from "express";
import { addOrder, getAllOrders, getOrderById, updateOrder, deleteOrder } from "../Controller/orderController.js";

const router = express.Router();

router.post("/add", addOrder);        // Add Order
router.get("/all", getAllOrders);      // Get All Orders
router.get("/:id", getOrderById);      // Get Single Order
router.put("/update/:id", updateOrder);       // Edit Order
router.delete("/delete/:id", deleteOrder);    // Delete Order

export default router;
