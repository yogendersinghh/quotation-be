const express = require("express");
const router = express.Router();
const {
  createModel,
  getModels,
  getModelById,
  updateModel,
  deleteModel,
} = require("../controllers/modelController");
const { isAdmin, auth } = require("../middleware/auth");

// Public routes
router.get("/", auth, isAdmin, getModels);
router.get("/:id", auth, isAdmin, getModelById);
// Protected routes
router.post("/", auth, isAdmin, createModel);
router.put("/:id", auth, isAdmin, updateModel);
router.delete("/:id", auth, isAdmin, deleteModel);

module.exports = router;
