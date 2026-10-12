import { createGroup, updateGroup, deleteGroup, addGroupMember, removeGroupMember, setGroupAdmin, leaveGroup } from "../services/group.service.js";

const create = async (req,res,next) => { try { const result = await createGroup(req.user.userId, req.body.name, req.body.userIds, req.body.profilePicture || null); res.status(201).json({ message:"Group created", ...result }); } catch(e){ next(e); } };
const update = async (req,res,next) => { try { const conversation = await updateGroup(req.user.userId, req.params.conversationId, req.body); res.json({ conversation }); } catch(e){ next(e); } };
const remove = async (req,res,next) => { try { await deleteGroup(req.user.userId, req.params.conversationId); res.json({ message:"Group deleted" }); } catch(e){ next(e); } };
const addMember = async (req,res,next) => { try { const member = await addGroupMember(req.user.userId, req.params.conversationId, req.body.userId); res.status(201).json({ message:"Member added", member }); } catch(e){ next(e); } };
const removeMember = async (req,res,next) => { try { await removeGroupMember(req.user.userId, req.params.conversationId, req.params.userId); res.json({ message:"Member removed" }); } catch(e){ next(e); } };
const makeAdmin = async (req,res,next) => { try { const conversation = await setGroupAdmin(req.user.userId, req.params.conversationId, req.params.userId); res.json({ conversation }); } catch(e){ next(e); } };
const leave = async (req,res,next) => { try { await leaveGroup(req.user.userId, req.params.conversationId); res.json({ message:"Left group" }); } catch(e){ next(e); } };
export { create, update, remove, addMember, removeMember, makeAdmin, leave };
