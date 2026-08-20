const express=require('express');
const path=require('path');
const fs=require('fs');
const bcrypt=require('bcryptjs');
const session=require('express-session');

const app=express();
const DB_FILE=process.env.DB_PATH || path.join(__dirname,'guvenlik_data.json');
const empty={users:[],plates:[],vehicle_logs:[],events:[],next:{users:1,plates:1,vehicle_logs:1,events:1}};
function load(){try{return JSON.parse(fs.readFileSync(DB_FILE,'utf8'))}catch(e){fs.writeFileSync(DB_FILE,JSON.stringify(empty,null,2),'utf8');return structuredClone(empty)}}
let db=load();
function save(){const tmp=DB_FILE+'.tmp';fs.writeFileSync(tmp,JSON.stringify(db,null,2),'utf8');fs.renameSync(tmp,DB_FILE)}
function id(type){return db.next[type]++}
app.use(express.json({limit:'1mb'}));
app.use(express.urlencoded({extended:true}));
app.set("trust proxy", 1);

app.use(session({
  secret: process.env.SESSION_SECRET || "CHANGE_THIS_SECRET_IN_PRODUCTION",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    maxAge: 8 * 60 * 60 * 1000
  }
}));
app.use(express.static(path.join(__dirname,'public')));
const now=()=>new Date();
const day=d=>d.toISOString().slice(0,10);
const auth=(req,res,next)=>req.session.user?next():res.status(401).json({error:'Oturum gerekli'});
const clean=s=>String(s||'').trim().toUpperCase().replace(/\s+/g,' ');

app.post('/api/register',(req,res)=>{const u=String(req.body.username||'').trim(),p=String(req.body.password||'');if(!/^[a-zA-Z0-9_.-]{3,30}$/.test(u)||p.length<6)return res.status(400).json({error:'Kullanıcı adı 3-30 karakter, şifre en az 6 karakter olmalı.'});if(db.users.some(x=>x.username.toLowerCase()===u.toLowerCase()))return res.status(409).json({error:'Bu kullanıcı adı zaten kayıtlı.'});const user={id:id('users'),username:u,password_hash:bcrypt.hashSync(p,10),created_at:now().toISOString()};db.users.push(user);save();req.session.user={id:user.id,username:user.username};res.json({ok:true,user:req.session.user})});
app.post('/api/login',(req,res)=>{const u=String(req.body.username||'').trim(),p=String(req.body.password||'');const user=db.users.find(x=>x.username.toLowerCase()===u.toLowerCase());if(!user||!bcrypt.compareSync(p,user.password_hash))return res.status(401).json({error:'Kullanıcı adı veya şifre hatalı.'});req.session.user={id:user.id,username:user.username};res.json({ok:true,user:req.session.user})});
app.post('/api/logout',auth,(req,res)=>req.session.destroy(()=>res.json({ok:true})));
app.get('/api/me',(req,res)=>res.json({user:req.session.user||null}));

app.get('/api/state',auth,(req,res)=>{const selected=String(req.query.day||day(now()));const plates=db.plates.slice().sort((a,b)=>a.plate.localeCompare(b.plate));const logs=db.vehicle_logs.filter(x=>x.day===selected).sort((a,b)=>b.id-a.id);const events=db.events.filter(x=>x.day===selected).sort((a,b)=>b.id-a.id);res.json({user:req.session.user,day:selected,plates,logs,events})});
app.post('/api/plates',auth,(req,res)=>{const plate=clean(req.body.plate),reason=String(req.body.reason||'').trim();if(!plate||!reason)return res.status(400).json({error:'Plaka ve giriş sebebi gerekli.'});if(db.plates.some(x=>x.plate===plate))return res.status(409).json({error:'Bu plaka zaten kayıtlı.'});db.plates.push({id:id('plates'),plate,reason,created_at:now().toISOString()});save();res.json({ok:true})});
app.delete('/api/plates/:id',auth,(req,res)=>{db.plates=db.plates.filter(x=>x.id!==Number(req.params.id));save();res.json({ok:true})});
app.post('/api/vehicle',auth,(req,res)=>{const plate=clean(req.body.plate),type=req.body.type==='Çıkış'?'Çıkış':'Giriş';let reason=String(req.body.reason||'').trim();const fixed=db.plates.find(x=>x.plate===plate);if(!plate)return res.status(400).json({error:'Plaka gerekli.'});if(!reason&&fixed)reason=fixed.reason;if(!reason)return res.status(400).json({error:'Giriş sebebi gerekli.'});const d=now();db.vehicle_logs.push({id:id('vehicle_logs'),plate,reason,type,user_id:req.session.user.id,user_name:req.session.user.username,created_at:d.toISOString(),day:day(d)});save();res.json({ok:true})});
app.post('/api/events',auth,(req,res)=>{const title=String(req.body.title||'').trim(),description=String(req.body.description||'').trim();if(!title)return res.status(400).json({error:'Olay başlığı gerekli.'});const d=now();db.events.push({id:id('events'),title,description,user_id:req.session.user.id,user_name:req.session.user.username,created_at:d.toISOString(),day:day(d)});save();res.json({ok:true})});
app.get('/api/report/:day',auth,(req,res)=>{const selected=req.params.day;const logs=db.vehicle_logs.filter(x=>x.day===selected);const events=db.events.filter(x=>x.day===selected);res.json({day:selected,logs,events})});
app.get('*',(req,res)=>res.sendFile(path.join(__dirname,'public','index.html')));
const port=process.env.PORT||3000;app.listen(port,()=>console.log('Güvenlik Takip server: http://localhost:'+port));
