//importing modules
const {User, validate, updateValidate, changePassValidate} = require('../models/user');
const {Service, serviceValidate, applyServiceValidate} = require('../models/service');
const {AppliedService, validateComments, validateAppliedService} = require('../models/applies_service');
const express = require('express');
const mongoose = require('mongoose');
const Joi = require('joi');
const auth = require('../auth');

//defining express router
const router = express.Router();

//defining routes for services API
//Add service API
router.post('/addService', auth('ServiceProvider', 'Service can only be added by service provider'), async (req, res) => {
    let {validation,error} = serviceValidate(req.body);
    if(error) return res.status(400).send(error.details[0].message);
    let user = await User.findOne({email: req.user.email});
    var service = await Service.findOne({
        service_category: req.body.service_category,
        service_name: req.body.service_name,
        service_by: user
    })
    if (service) return res.status(400).send("Service you are trying to add already exists.");
    service = new Service({
        service_category: req.body.service_category,
        service_name: req.body.service_name,
        service_by: user
    });
    try{
        await service.save();
        res.send("service added");
    }catch(ex){
        console.log("Error-add service: ",Err)
        res.status(500).send("Internal server error");
    }
});

//get list of services
router.get('/', async (req, res) => {
    try{
        let services = await Service.find({is_deleted:false}).populate('service_by', '-password -token -is_deleted -user_type').select("-is_deleted");
        res.send(services);
    }catch(err){
        console.log("Error-list services: ", err);
        res.status(500).send("Internal server error");
    }
});

//apply for a service as a customer
router.post('/apply', auth('Customer', 'Only customers can apply for services'), async (req, res) => {
    let {validation, error} = applyServiceValidate(req.body);
    if(error) return res.status(400).send(error.details[0].message);

    try{
        let service = await Service.findOne({_id: req.body.service_id});
        if (!service) return res.status(404).send("Service with the given ID was not found");

        let user = await User.findOne({email: req.user.email});

        let applied_service = new AppliedService({
            service: service,
            applied_by: user, 
        })
        await applied_service.save();
        res.send("Applied for the service.");
    }catch(err){
        console.log("Error-apply service: ", err);
        res.status(500).send("Internal server error.");
    }
});

//delete a service as a service provider
router.delete('/del/:id', auth('ServiceProvider', 'Only service provider can delete his own service service'), async (req, res) => {
    try{
        let service = await Service.findOne({
            _id: req.params.id,
            service_by: req.user._id,
            is_deleted:false,
        });
        if(!service) return res.status(400).send("This service does not exists");
        let applied_service = await AppliedService.find({ service:service });
        if(!applied_service){
            service.is_deleted = true;
            await service.save();
            return res.send("deleted!");
        }else{
            var accepted = 0
            for (obj in applied_service){
                if(applied_service[obj].status == "Accepted"){
                    accepted += 1;
                }
            }
            if (accepted) return res.status(400).send("This services has accepted requests please complete them before deleting this service.")
            service.is_deleted = true;
            await service.save();
            return res.send("deleted!");
        }
    }catch(err){
        console.log("Error-delete service: ", err)
        return res.status(500).send("Internal server error");
    }
})

module.exports = router;