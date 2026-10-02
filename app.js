const products=[
{id:1,name:"Stylish Winter Jacket",cat:"Fashion & Clothing",price:999,old:4999,img:"https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=800&q=80"},
{id:2,name:"Smartphone 128GB",cat:"Electronics",price:15980,old:79990,img:"https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80"},
{id:3,name:"Skin Care Combo Kit",cat:"Beauty & Personal Care",price:499,old:2499,img:"https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=800&q=80"},
{id:4,name:"Air Fryer 4.5L",cat:"Home & Kitchen",price:2599,old:12999,img:"https://images.unsplash.com/photo-1585515320310-259814833e62?auto=format&fit=crop&w=800&q=80"},
{id:5,name:"Running Shoes",cat:"Shoes & Footwear",price:799,old:3999,img:"https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80"},
{id:6,name:"Gold Plated Necklace",cat:"Jewellery & Accessories",price:399,old:1999,img:"https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=80"},
{id:7,name:"Travel Backpack",cat:"Bags & Luggage",price:699,old:3499,img:"https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80"},
{id:8,name:"Fitness Dumbbell Set",cat:"Sports & Fitness",price:1299,old:6499,img:"https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=800&q=80"}
];
const cats=[["👕","Fashion & Clothing"],["📱","Electronics"],["💄","Beauty & Personal Care"],["🏠","Home & Kitchen"],["👟","Shoes & Footwear"],["💍","Jewellery & Accessories"],["🧸","Kids & Toys"],["🏋️","Sports & Fitness"],["🎒","Bags & Luggage"],["📚","Books & Stationery"],["🚗","Automotive"],["🐾","Pet Products"],["🎁","Gifts & Other Products"]];
let cart=JSON.parse(localStorage.getItem("cart")||"[]");
let orders=JSON.parse(localStorage.getItem("orders")||"[]");

function money(n){return "₹"+n.toLocaleString("en-IN")}
function save(){localStorage.setItem("cart",JSON.stringify(cart));document.getElementById("cartCount").textContent=cart.reduce((s,x)=>s+x.qty,0)}
function renderCats(){document.getElementById("categories").innerHTML=cats.map(c=>`<div class="cat" onclick="filterCat('${c[1]}')"><div class="icon">${c[0]}</div><div>${c[1]}</div></div>`).join("")}
function renderProducts(list=products){let sort=document.getElementById("sort")?.value;if(sort==="low")list=[...list].sort((a,b)=>a.price-b.price);if(sort==="high")list=[...list].sort((a,b)=>b.price-a.price);document.getElementById("products").innerHTML=list.map(p=>`<article class="card"><span class="badge">80% OFF</span><img src="${p.img}" alt="${p.name}"><div class="card-body"><div class="muted">${p.cat}</div><h3>${p.name}</h3><span class="price">${money(p.price)}</span><span class="old">${money(p.old)}</span><button onclick="add(${p.id})">ADD TO CART</button></div></article>`).join("")}
function add(id){let x=cart.find(i=>i.id===id);x?x.qty++:cart.push({id,qty:1});save();renderCart();location.hash="cart"}
function change(id,d){let x=cart.find(i=>i.id===id);if(!x)return;x.qty+=d;if(x.qty<=0)cart=cart.filter(i=>i.id!==id);save();renderCart()}
function total(){return cart.reduce((s,x)=>{let p=products.find(p=>p.id===x.id);return s+p.price*x.qty},0)}
function renderCart(){let box=document.getElementById("cartBox");if(!cart.length){box.innerHTML="<p class='muted'>Your cart is empty. Add products from Shop All.</p>";return}box.innerHTML=cart.map(x=>{let p=products.find(p=>p.id===x.id);return `<div class="cart-row"><img src="${p.img}"><div class="grow"><b>${p.name}</b><div class="muted">${money(p.price)} each</div></div><div class="qty"><button onclick="change(${p.id},-1)">−</button> ${x.qty} <button onclick="change(${p.id},1)">+</button></div><b>${money(p.price*x.qty)}</b></div>`}).join("")+`<div class="summary"><h3>Total: ${money(total())}</h3><button class="checkout button" onclick="location.hash='checkout';renderCheckout()">PROCEED TO CHECKOUT →</button></div>`}
function renderCheckout(){let s=document.getElementById("checkoutSummary");s.innerHTML=cart.length?`<div class="summary"><h3>Order Summary</h3>${cart.map(x=>{let p=products.find(p=>p.id===x.id);return `<p>${p.name} × ${x.qty} — ${money(p.price*x.qty)}</p>`}).join("")}<hr><h2>${money(total())}</h2></div>`:"<p>Your cart is empty.</p>"}
function filterCat(c){document.getElementById("shop").scrollIntoView();renderProducts(products.filter(p=>p.cat===c))}
function searchProducts(){let q=document.getElementById("searchInput").value.toLowerCase();location.hash="shop";renderProducts(products.filter(p=>(p.name+" "+p.cat).toLowerCase().includes(q)))}
document.getElementById("checkoutForm").addEventListener("submit", async e=>{
  e.preventDefault();
  if(!cart.length) return alert("Your cart is empty.");

  const customer={
    name:document.getElementById("name").value.trim(),
    phone:document.getElementById("phone").value.trim(),
    address:document.getElementById("address").value.trim(),
    city:document.getElementById("city").value.trim(),
    pincode:document.getElementById("pincode").value.trim()
  };

  try{
    const createRes=await fetch("/api/create-order",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({
        items:cart,
        customer
      })
    });
    const createData=await createRes.json();
    if(!createRes.ok) throw new Error(createData.error||"Unable to start payment.");

    const options={
      key:createData.keyId,
      amount:createData.amount,
      currency:createData.currency,
      name:"THE SHOPING",
      description:"Online order payment",
      order_id:createData.orderId,
      prefill:{name:customer.name,contact:customer.phone},
      notes:{order_id:createData.orderId},
      theme:{color:"#d4af37"},
      modal:{ondismiss:()=>{}},
      handler:async function(response){
        try{
          const verifyRes=await fetch("/api/verify-payment",{
            method:"POST",
            headers:{"Content-Type":"application/json"},
            body:JSON.stringify({
              razorpay_order_id:response.razorpay_order_id,
              razorpay_payment_id:response.razorpay_payment_id,
              razorpay_signature:response.razorpay_signature,
              items:cart,
              customer
            })
          });
          const verifyData=await verifyRes.json();
          if(!verifyRes.ok || !verifyData.verified) throw new Error(verifyData.error||"Payment verification failed.");

          const order=verifyData.order;
          orders.unshift(order);
          localStorage.setItem("orders",JSON.stringify(orders));
          cart=[];
          save();
          document.getElementById("successText").textContent=`Order ${order.id} is confirmed. Payment ID: ${response.razorpay_payment_id}`;
          location.hash="success";
          renderOrders();
        }catch(err){
          alert(err.message||"Payment could not be verified. Please contact support.");
        }
      }
    };

    const rzp=new Razorpay(options);
    rzp.on("payment.failed",function(response){
      alert("Payment failed: "+(response.error?.description||"Please try again."));
    });
    rzp.open();
  }catch(err){
    alert(err.message||"Unable to start payment. Please try again.");
  }
});
function renderOrders(){let b=document.getElementById("ordersBox");b.innerHTML=orders.length?orders.map(o=>`<div class="order"><b>${o.id}</b><br><span class="muted">${o.date}</span><h3>${money(o.total)}</h3><span>Order placed</span></div>`).join(""):"<p class='muted'>No orders yet.</p>"}
function init(){renderCats();renderProducts();renderCart();renderOrders();save()}init();