
const jwt = require('jsonwebtoken');
const URLCheck= [];

URLCheck["admin"]=[
    "/admin/dashboard/counts",
    "/admin/dashboard/companies",
    "/admin/dashboard/users",
    "/admin/dashboard/updateStatusOffer",
    "/admin/dashboard/makeActive",
    "/admin/dashboard/changeToCompany",
    "/admin/dashboard/changeToClient",
    "/admin/offers",
    "/admin/dashboard/adminTestLoginAuth",
    "/users/profiles",
    "/companies/profiles",
    "/users/getOffer",
    "/users/offers",
    "/companies/profile/getSettings",
    "/admin/dashboard/getDocuments",
    "/admin/dashboard/uploadDocuments",
    "/admin/dashboard/getRooms",
    "/admin/dashboard/messages",
];
URLCheck["company"]=[
    "/companies/profile/password",
    "/companies/profile/upload",
    "/companies/pay",
    "/companies/offers",
    "/companies/becomeBidder",
    "/users/profiles",
    "/companies/profiles",
    "/companies/profile/getSettings",
    "/companies/profile/upload_photo",
    "/companies/profile/upload_data",
    "/users/getOffer",
    "/companies/profile/settings",
    "/companies/dashboard",
    "/companies/messages",
    "/companies/getRooms",
    "/companies/sendMessage",
    "/companies/sendFileViaMessage",
];
URLCheck["client"]=[
    "/users/profile/password",
    "/companies/profile/getSettings",
    "/users/profile/upload",
    "/companies/profiles",
    "/users/profiles",
    "/users/dashboard",
    "/users/offers",
    "/users/profile/upload_photo",
    "/users/profile/upload_data",
    "/users/getOffer",
    "/users/attendOffer",
    "/users/offers/getBidInfo",
    "/users/messages",
    "/users/getRooms",
    "/users/sendMessage",
    "/users/sendFileViaMessage",
];



module.exports =async  (req, res, next) => {
    try {
        const token = req.headers.authorization.split(" ")[1];
        const decodedToken = jwt.verify(token, 'secret_key');
        if(URLCheck[decodedToken.cid].includes(req.originalUrl)==false){
            return res.status(401).send({
                message: 'Auth failed'
            });
        }

        req.userData=decodedToken
        next();
    }catch(error) {
        return res.status(401).send({
            message: 'Auth failed'
        });
    }
}