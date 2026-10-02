require("dotenv").config();
const express = require("express");
const path = require("path");
const crypto = require("crypto");
const Razorpay = require("razorpay");

const app = express();
const PORT = process.env.PORT || 3000;
const keyId = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;

// Server-side catalog: never trust prices sent by the browser.
const PRODUCTS = new Map([
  [1, {name:"Stylish Winter Jacket", price:999}],
  [2, {name:"Smartphone 128GB", price:15980}],
  [3, {name:"Skin Care Combo Kit", price:499}],
  [4, {name:"Air Fryer 4.5L", price:2599}],
  [5, {name:"Running Shoes", price:799}],
  [6, {name:"Gold Plated Necklace", price:399}],
  [7, {name:"Travel Backpack", price:699}],
  [8, {name:"Fitness Dumbbell Set", price:1299}]
]);

if (!keyId || !keySecret) console.warn("Razorpay keys are not configured.");
const razorpay = new Razorpay({key_id:keyId || "missing", key_secret:keySecret || "missing"});

function paise(rupees){
  const n=Number(rupees);
  if(!Number.isFinite(n) || n<=0) throw new Error("Invalid amount.");
  return Math.round(n*100);
}

function calculateCart(items){
  if(!Array.isArray(items) || !items.length) throw new Error("Cart is empty.");
  let total=0;
  const normalized=[];
  for(const item of items){
    const id=Number(item.id), qty=Number(item.qty);
    const product=PRODUCTS.get(id);
    if(!product || !Number.isInteger(qty) || qty<1 || qty>99) throw new Error("Invalid cart item.");
    total += product.price * qty;
    normalized.push({id, name:product.name, price:product.price, qty});
  }
  return {total, items:normalized};
}

function validCustomer(customer){
  return customer && customer.name && customer.phone && customer.address && customer.city && customer.pincode;
}

// Razorpay webhook endpoint. Keep raw body for signature verification.
app.post("/api/webhook", express.raw({type:"application/json"}), (req,res)=>{
  try{
    if(!process.env.RAZORPAY_WEBHOOK_SECRET) return res.status(503).send("Webhook secret not configured");
    const signature=req.headers["x-razorpay-signature"];
    const expected=crypto.createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET).update(req.body).digest("hex");
    if(!signature || signature.length!==expected.length || !crypto.timingSafeEqual(Buffer.from(expected),Buffer.from(signature))) return res.status(400).send("Invalid signature");
    // Production hook: persist event/payment/order status in your database here.
    console.log("Razorpay webhook:", JSON.parse(req.body.toString()).event);
    return res.json({ok:true});
  }catch(err){ console.error(err); return res.status(400).send("Webhook error"); }
});

app.use(express.json());
app.use(express.static(__dirname));

app.post("/api/create-order", async (req,res)=>{
  try{
    const {items, customer}=req.body || {};
    if(!validCustomer(customer)) return res.status(400).json({error:"Complete delivery details are required."});
    if(!keyId || !keySecret) return res.status(500).json({error:"Payment gateway is not configured yet."});
    const cart=calculateCart(items);
    const order=await razorpay.orders.create({
      amount:paise(cart.total), currency:"INR", receipt:"TS_"+Date.now(), notes:{store:"THE SHOPING"}
    });
    res.json({orderId:order.id, amount:order.amount, currency:order.currency, keyId});
  }catch(err){ console.error(err); res.status(400).json({error:err.message||"Could not create payment order."}); }
});

app.post("/api/verify-payment", async (req,res)=>{
  try{
    const {razorpay_order_id, razorpay_payment_id, razorpay_signature, items, customer}=req.body || {};
    if(!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) return res.status(400).json({error:"Incomplete payment response."});
    if(!validCustomer(customer)) return res.status(400).json({error:"Customer details are missing."});
    const cart=calculateCart(items);
    const expected=crypto.createHmac("sha256", keySecret).update(`${razorpay_order_id}|${razorpay_payment_id}`).digest("hex");
    if(razorpay_signature.length!==expected.length || !crypto.timingSafeEqual(Buffer.from(expected),Buffer.from(razorpay_signature))) return res.status(400).json({verified:false,error:"Invalid payment signature."});

    // Confirm server-side that the Razorpay order/payment match the expected amount and order.
    const rOrder=await razorpay.orders.fetch(razorpay_order_id);
    const payment=await razorpay.payments.fetch(razorpay_payment_id);
    if(rOrder.amount !== paise(cart.total) || payment.order_id !== razorpay_order_id || payment.amount !== rOrder.amount || !["captured"].includes(payment.status))
      return res.status(400).json({verified:false,error:"Payment amount or status could not be verified."});

    const order={
      id:"TS"+Date.now().toString().slice(-8), date:new Date().toLocaleString("en-IN"), total:cart.total,
      paymentId:razorpay_payment_id, razorpayOrderId:razorpay_order_id, customer, items:cart.items
    };
    res.json({verified:true,order});
  }catch(err){ console.error(err); res.status(500).json({verified:false,error:"Payment verification failed."}); }
});

app.get("/api/health",(req,res)=>res.json({ok:true,store:"THE SHOPING"}));
app.get("*",(req,res)=>res.sendFile(path.join(__dirname,"index.html")));
app.listen(PORT,()=>console.log(`THE SHOPING running on port ${PORT}`));
