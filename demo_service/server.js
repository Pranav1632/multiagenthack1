const express = require('express');
const app = express();
const port = process.env.PORT || 4000;

app.use(express.json());

// Sentry Webhook Dispatcher
// When an unhandled error happens in production, this sends the real crash payload directly to Incident Commander!
async function notifyIncidentCommander(error, culpritLocation, stackTrace) {
  try {
    const payload = {
      project: "demo-payment-service",
      error_type: error.name || "TypeError",
      message: `${error.name}: ${error.message}`,
      culprit: culpritLocation,
      timestamp: new Date().toISOString(),
      stack_trace: stackTrace
    };

    console.log(`[!] [SENTRY EMULATOR] Dispatched crash alert to Incident Commander webhook at http://localhost:8000/api/webhook/sentry`);

    const response = await fetch("http://localhost:8000/api/webhook/sentry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    console.log(`[+] [INCIDENT COMMANDER RESPONSE]: Incident ${data.incident_id} created! Slack: ${data.slack_channel}, Linear: ${data.linear_ticket}`);
    return data;
  } catch (err) {
    console.error(`[-] Could not notify Incident Commander:`, err.message);
  }
}

// -------------------------------------------------------------
// Payment Webhook Handler (The code the developer "refactored")
// -------------------------------------------------------------
app.post('/api/webhook/stripe', async (req, res) => {
  const payload = req.body;

  try {
    // 🚨 BUG INTRODUCED BY DEVELOPER COMMIT:
    // The developer wrote: payload.customer.billing_address.country
    // But under production webhook payloads, customer is a string ID ("cus_901"), NOT an object!
    // This throws: TypeError: Cannot read properties of undefined (reading 'country')
    const country = payload.customer.billing_address.country;

    res.json({ status: "success", country });
  } catch (err) {
    console.error(`\n🚨 [CRASH TRIGGERED IN DEMO_SERVICE]: ${err.stack}\n`);

    // Sentry SDK catches unhandled exception & fires webhook
    const stackFrames = [
      {
        file: "demo_service/server.js",
        line: 38,
        function: "handle_stripe_webhook",
        code: "const country = payload.customer.billing_address.country;"
      }
    ];

    await notifyIncidentCommander(err, "demo_service/server.js:38 in handle_stripe_webhook", stackFrames);

    res.status(500).json({ error: err.message });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: "ok", service: "demo-payment-service" });
});

if (require.main === module) {
  app.listen(port, () => {
    console.log(`[+] Demo Payment Service listening on http://localhost:${port}`);
  });
}

module.exports = app;
