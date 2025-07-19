const express = require('express');
const router = express.Router();
const { createClient, getAllClients, getClientById, updateClient, deleteClient, getAllCompanyNames } = require('../controllers/clientController');
const { auth } = require('../middleware/auth');
const { checkRole } = require('../middleware/roleCheck');
const pagination = require('../middleware/pagination');

// All routes require authentication
router.use(auth);
router.use(checkRole(['admin', 'manager']));

// Client routes
router.post('/', createClient);
router.get('/', pagination, getAllClients);
router.get('/company-names', getAllCompanyNames);
router.get('/:id', getClientById);
router.put('/:id', updateClient);
router.delete('/:id', deleteClient);

module.exports = router; 