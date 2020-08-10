const multer  = require('../images/multer');
var express = require('express');
var auth = require('../middleware/verify');
var adminDashboard = express.Router();
var passport = require("../passport2");
const jwt = require('jsonwebtoken');
const biddingFees = require("../models/bidding_fees");
const profiles =require("../models/user_profiles");
const companies_profiles =require("../models/companies_profiles");
const user =require("../models/users");
const offersModel =require("../models/offers");
const CompanyProfileSettings = require("../models/company_profile_settings");
var path = require('path');
var fs = require('fs');

const mimeTypeToExtension={
    "image/jpeg":"jpg",
    "image/png":"png",
    "image/svg+xml":"svg",
}

adminDashboard.post("/users",auth,multer.upload.none(),async function (req, res) {
    let userList =await user.findAll({raw: true,where:{type:"client"}})
    let profileList =await profiles.findAll({raw: true})
    let profileArray = []
    profileList.filter(profile=>{
        profileArray[profile.users_id]=profile
    })
    let together = []
    userList.filter(user=>{
        together.push({...user,profile:profileArray[user.id]})
    })

    res.send({count:together.length,data:together})
})

adminDashboard.post("/companies",auth,multer.upload.none(),async function (req, res) {
    let userList =await user.findAll({raw: true,where:{type:"company"}})
    let profileList =await companies_profiles.findAll({raw: true})
    let profileArray = []
    profileList.filter(profile=>{
        profileArray[profile.users_id]=profile
    })
    let together = []
    userList.filter(user=>{
        together.push({...user,profile:profileArray[user.id]})
    })
    res.send({count:together.length,data:together})
})

adminDashboard.post("/counts",auth,multer.upload.none(),async function (req, res) {
    let clientCount =await user.count({raw: true,where:{type:"client"}})
    let companiesCount =await user.count({raw: true,where:{type:"company"}})
    let offersConceptCount =await offersModel.count({raw: true,where:{status:"concept"}})
    let offersActiveCount =await offersModel.count({raw: true,where:{status:"active"}})
    let offersAttendCount =await offersModel.count({raw: true,where:{status:"attend"}})
    let offersDoneCount =await offersModel.count({raw: true,where:{status:"done"}})
    let ReactionPartOne = offersConceptCount
    let ReactionPartTwo =await biddingFees.count({raw: true})
    let lastOffers =await offersModel.findAll({raw: true,limit:3});
    res.send({
        offersCount : offersActiveCount+offersConceptCount+offersDoneCount+offersAttendCount,
        companiesCount : companiesCount,
        clientCount : clientCount,
        lastOffers : lastOffers,
        reactionCount: ReactionPartOne+ ReactionPartTwo
    })
})

adminDashboard.post("/changeToCompany",auth,multer.upload.none(),async function (req, res) {

    let userProfileInfo= await profiles.findAll({where:{users_id:req.body.user_id},raw: true})
    let name=userProfileInfo[0].first_name
    userProfileInfo=userProfileInfo[0]
    userProfileInfo.name=name
    delete userProfileInfo.first_name
    delete userProfileInfo.createdAt
    delete userProfileInfo.updatedAt
    delete userProfileInfo.id
    await companies_profiles.create(userProfileInfo).then(async ()=>{
        await profiles.destroy({where:{users_id:req.body.user_id}})
        await user.update({type:"company"},{where:{id:req.body.user_id}})
        await CompanyProfileSettings.create({company_id:req.userData.muuid})
    }).then(
        res.send({
            success: true,
        })
    );
})

adminDashboard.post("/changeToClient",auth,multer.upload.none(),async function (req, res) {
    let companyProfileInfo= await companies_profiles.findAll({where:{users_id:req.body.user_id},raw: true})
    let first_name=companyProfileInfo[0].name
    companyProfileInfo=companyProfileInfo[0]
    companyProfileInfo.first_name=first_name
    delete companyProfileInfo.name
    delete companyProfileInfo.createdAt
    delete companyProfileInfo.updatedAt
    delete companyProfileInfo.id
    await profiles.create(companyProfileInfo).then(async ()=>{
        await companies_profiles.destroy({where:{users_id:req.body.user_id}})
        await user.update({type:"client"},{where:{id:req.body.user_id}})
    }).then(
        res.send({
            success: true,
        })
    );

})

adminDashboard.post("/updateStatusOffer",auth,multer.upload.none(),async function (req, res) {
    offersModel.update({status:req.body.status}, { where: { id: req.body.offerid } })
        .then((result) => {
            let success = false;
            if (result == 1) {
                success = true;
            }
            res.send({
                success: success,
            });
        });
})

adminDashboard.post("/makeActive",auth,multer.upload.array("files[]"),async function (req,res) {
    let folder_name = "uploaded_files/"+req.body.offerId+"_offer"
    let filePaths = [];
    for (let i=0;i<req.files.length;i++) {
        fs.renameSync(req.files[i].path, folder_name+"/new/"+req.files[i].filename+path.extname(req.files[i].originalname))
        filePaths.push(folder_name+"/new/"+req.files[i].filename+path.extname(req.files[i].originalname))
    }
    offersModel.update({files:JSON.stringify(filePaths),status:"active"},{where : {
            id : req.body.offerId
    }}).then((result) => {
        let success = false;
        if (result == 1) {
            success = true;
        }
        res.send({
            success: success,
        });
    });

})


adminDashboard.post("/getDocuments",auth,multer.upload.none(),async function (req,res) {
    let offerInfo=await offersModel.findAll({
        where:{
            id:req.body.offer_id
        }
    })
    res.send({
        offerInfo
    })
})

adminDashboard.post("/uploadDocuments",auth,multer.upload.array("files[]"),async function (req,res) {

    let offer_id=JSON.parse(req.body.offer).offer_id
    let folder_name = "uploaded_files/"+offer_id+"_offer"
    let filePaths = [];
    let offerInfo=await offersModel.findAll({
        where:{
            id:offer_id
        }
    })
    filePaths = JSON.parse(offerInfo[0].files);
    if(filePaths==null){
        filePaths=[]
    }
    for (let i=0;i<req.files.length;i++) {
        fs.renameSync(req.files[i].path, folder_name+"/new/"+req.files[i].filename+path.extname(req.files[i].originalname))
        filePaths.push(folder_name+"/new/"+req.files[i].filename+path.extname(req.files[i].originalname))
    }
    await offersModel.update({files:JSON.stringify(filePaths)},{where : {
            id : offer_id
        }})

    res.send({
        success:true
    })
})


module.exports = adminDashboard;