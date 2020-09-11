//importing modules
const express = require('express');
const mongoose = require('mongoose');
const Joi = require('joi');
const auth = require('../auth');

const { commentRequestValidator,
        changeStatusValidator,
        deleteRequestValidator } = require('../middleware/validator');

const { listRequestController,
        listSpecificRequestController,
        commentRequestController,
        changeStatusController,
        deleteRequestController } = require('../controller/request_service.controller');

//defining express router
const router = express.Router();

//defining routers for applied service APIs
//getting list of applied services by current user
router.get('/', listRequestController);
router.get('/:id', listSpecificRequestController);
router.post('/comment', commentRequestValidator, commentRequestController);
router.post('/statusChange', changeStatusValidator, changeStatusController);
router.delete('/delete/:id', deleteRequestValidator, deleteRequestController);

module.exports = router;