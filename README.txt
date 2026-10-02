THE SHOPING — Razorpay checkout package

Included:
- Premium black/gold Diwali marketplace-style storefront
- All-products categories, search, sorting and cart
- Online payment only; COD is disabled
- Razorpay Checkout
- Server-side total calculation from the product catalog
- Server-side Razorpay signature + order/payment amount/status verification
- Razorpay webhook endpoint with signature validation
- Dockerfile + Render deployment template
- Local order history in browser for prototype use

LOCAL TEST
1. Install Node.js 20+.
2. Run: npm install
3. Copy .env.example to .env
4. Add Razorpay TEST Key ID + Secret.
5. npm start
6. Open http://localhost:3000

LIVE LAUNCH
1. Deploy this Node/Express app to a server such as Render.
2. Add RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET and RAZORPAY_WEBHOOK_SECRET as private environment variables.
3. Switch Razorpay to live keys only after testing.
4. Configure the Razorpay webhook URL as https://YOUR-DOMAIN/api/webhook and use the same webhook secret.

IMPORTANT PRODUCTION NOTE
The browser still keeps its visible order history in localStorage. For a full production store, add a persistent database for orders, customers, inventory and webhook events, plus authentication/admin order management. Do not put RAZORPAY_KEY_SECRET in frontend code or send it in chat.
