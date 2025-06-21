const Model = require('../models/Model');
const asyncHandler = require('express-async-handler');

// @desc    Create a new model
// @route   POST /api/models
// @access  Private
const createModel = asyncHandler(async (req, res) => {
  const { name, description, specifications } = req.body;

  const model = await Model.create({
    name,
    description,
    specifications // now a string
  });

  res.status(201).json(model);
});

// @desc    Get all models
// @route   GET /api/models
// @access  Public
const getModels = asyncHandler(async (req, res) => {
  const models = await Model.find({});
  res.json(models);
});

// @desc    Get model by ID
// @route   GET /api/models/:id
// @access  Public
const getModelById = asyncHandler(async (req, res) => {
  const model = await Model.findById(req.params.id);
  
  if (!model) {
    res.status(404);
    throw new Error('Model not found');
  }

  res.json(model);
});

// @desc    Update model
// @route   PUT /api/models/:id
// @access  Private
const updateModel = asyncHandler(async (req, res) => {
  const { name, description, specifications, isActive } = req.body;

  const model = await Model.findById(req.params.id);

  if (!model) {
    res.status(404);
    throw new Error('Model not found');
  }

  model.name = name || model.name;
  model.description = description || model.description;
  model.specifications = specifications || model.specifications;
  model.isActive = isActive !== undefined ? isActive : model.isActive;

  const updatedModel = await model.save();
  res.json(updatedModel);
});

// @desc    Delete model
// @route   DELETE /api/models/:id
// @access  Private
const deleteModel = asyncHandler(async (req, res) => {
  const model = await Model.findById(req.params.id);

  if (!model) {
    res.status(404);
    throw new Error('Model not found');
  }

  await model.deleteOne();
  res.json({ message: 'Model removed' });
});

module.exports = {
  createModel,
  getModels,
  getModelById,
  updateModel,
  deleteModel
}; 