import { getProfile, updateProfile } from "../services/user.service.js";
const profile = async (req,res,next)=>{try{res.json({user:await getProfile(req.user.userId)});}catch(e){next(e);}};
const update = async (req,res,next)=>{try{res.json({user:await updateProfile(req.user.userId, req.body)});}catch(e){next(e);}};
export { profile, update };
