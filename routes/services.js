//importing modules
const express = require('express');
const mongoose = require('mongoose');
const Joi = require('joi');
const auth = require('../auth');
const { addServiceValidator,
        requestServiceValidator,
        deleteServiceValidator } = require('../middleware/validator')

const { listServiceController,
        addServiceController,
        requestServiceController,
        deleteServiceController } = require('../controller/service.controller');

//defining express router
const router = express.Router();

//defining routes for services API
router.post('/addService', addServiceValidator, addServiceController);
router.get('/', listServiceController);
router.post('/requestService', requestServiceValidator, requestServiceController);
router.delete('/del/:id', deleteServiceValidator, deleteServiceController);

module.exports = router;