//importing modules
const {User, validate, updateValidate, changePassValidate} = require('../models/user');
const {Service, serviceValidate, applyServiceValidate} = require('../models/service');
const {AppliedService, validateComments, validateStatus, validateAppliedService} = require('../models/applies_service');
const express = require('express');
const mongoose = require('mongoose');
const Joi = require('joi');
const auth = require('../auth');

//defining express router
const router = express.Router();

//defining routers for applied service APIs
//getting list of applied services by current user
router.get('/', auth(0, ''), async (req, res) => {
    try{
        var query;
        if(req.user_type == 'Customer') query = {applied_by: req.user._id, is_deleted:false};
        else if(req.user_type == 'ServiceProvider') query = {is_deleted:false};
        let applied = await AppliedService.find(query).populate({
            path: 'service',
            select: 'service_category service_name service_by -_id'
        }).select('-applied_by -comments');
        if(!applied) return res.status(400).send("This service does not exists");
        if (req.user_type == 'ServiceProvider'){
            var applied_sp = []
            for (ob in applied){
                console.log(ob)
                if (applied[ob].service.service_by == req.user._id){
                    applied_sp.push(applied[ob]);
                }
            }
            return res.send(applied_sp);
        }else{
            return res.send(applied);
        }
    }catch(err){
        console.log("Error-list applied services: ", err)
        return res.status(500).send("Internal server error");
    }
    //sorting remains
});

//get details of selected applied service
router.get('/:id', auth(0, ''), async (req, res) => {
    try{
        let applied = await AppliedService.findOne({_id: req.params.id, is_deleted:false}).populate({
            path: 'service',
            select: 'service_category service_name -_id',
            populate: {
                path: 'service_by',
                select: 'name email phone -_id'
            }
        }).populate({
            path: 'applied_by',
            select: 'name email phone -_id'
        })
        if(!applied) return res.status(400).send("This service does not exists");
        res.send(applied);
    }catch(err){
        console.log("Error-get service details: ", err);
        return res.status(500).send("Internal server error");
    }
});

//comment on a applied service
router.post('/comment', auth(0, ''), async (req, res) => {
    try{
        let {validation, error} = validateComments(req.body);
        if (error) return res.status(400).send(error.details[0].message);
        let applied_service = await AppliedService.findOne({_id:req.body.applied_service_id, is_deleted:false}).populate('service');
        if(!applied_service) return res.status(400).send("This service request does not exists");
        if(applied_service.service.is_deleted == true) return res.status(400).send("This service is deleted by the service provider.");
        if(applied_service.status!="Accepted") return res.status(400).send("This service is not Accepted or already is completed.")
        if(req.user._id == applied_service.applied_by || req.user._id == applied_service.service.service_by){
            var comment = {
                comment_by: req.user_type,
                comment_text: req.body.comment_text
            };
            applied_service.comments.push(comment);
            await applied_service.save();
            return res.send(comment);
        }else{
            res.status(400).send("This service does not exists.")
        }        
    }catch(err){
        console.log('Error-comment on service: ', err);
        res.status(500).send("internal server error");
    }
});

//change status of an applied service according to user
router.post('/statusChange', auth('ServiceProvider', 'Service status can only be changed by service provider'), async (req, res) => {
    try{
        let {validation, error} = validateStatus(req.body);
        if(error) return res.status(400).send(error.details[0].message);
        let applied_service = await AppliedService.findOne({_id: req.body.applied_service_id, is_deleted:false}).populate('service')
        if(!applied_service) return res.status(400).send("This service request does not exists");
        if(applied_service.service.is_deleted == true) return res.status(400).send("This service is deleted by the service provider.");
        if(applied_service.status == "Accepted" && req.body.status == "Rejected") return res.status(400).send("Request cannot be Rejected as it is already Accepted")
        applied_service.status = req.body.status;
        await applied_service.save();
        res.send("Status Changed");
    }catch(Err){
        console.log("Error-Change status", Err.errors.status.name);
        if (Err.errors.status.name == "ValidatorError"){
            res.status(500).send(Err.errors.status.message);
        }else{
            res.status(500).send("Internal server error!")
        }
    }
})
//delete applied service
router.delete('/delete/:id', auth('Customer', 'Service can only be deleted by Customer'), async (req, res) => {
    try{
        let applied_service = await AppliedService.findOne({_id: req.params.id, is_deleted:false});
        if(!applied_service) return res.status(404).send("Applied service request for the given id was not found");
        if(applied_service.status == "Accepted") return res.status(400).send("Service request is already accepted, so cannot delete");
        applied_service.is_deleted = true;
        await applied_service.save();
        res.send("Service request deleted");
    }catch(err){
        console.log("Error-delete", err)
        return res.status(500).send("Internal server error");
    }
})

module.exports = router;