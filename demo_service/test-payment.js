// test-payment.js
// Simulates a live production Stripe webhook event hitting demo_service
// Triggers the crash in real-time!

async function sendStripeWebhook() {
  const url = "http://localhost:4000/api/webhook/stripe";

  console.log(`[*] Sending live production Stripe webhook to ${url}...`);

  // Realistic Stripe payload where customer is an ID string ("cus_10482"), not an object with billing_address
  const payload = {
    id: "evt_3N4x98284kjas",
    object: "event",
    type: "invoice.payment_succeeded",
    customer: "cus_10482", 
    amount: 4900,
    currency: "usd"
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const body = await res.json();
    console.log(`Response status: ${res.status}`, body);
  } catch (err) {
    console.error(`Error sending test webhook:`, err.message);
  }
}

sendStripeWebhook();
