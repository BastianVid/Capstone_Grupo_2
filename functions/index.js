const {setGlobalOptions} = require("firebase-functions/v2");
const {onRequest} = require("firebase-functions/v2/https");
const {defineSecret} = require("firebase-functions/params");

const GEMINI_API_BASE =
  "https://generativelanguage.googleapis.com/v1beta/models";

setGlobalOptions({
  region: "us-central1",
  maxInstances: 5,
});

const geminiApiKey = defineSecret("GEMINI_API_KEY");

exports.geminiProxy = onRequest({secrets: [geminiApiKey], cors: true},
    async (req, res) => {
      res.set("Access-Control-Allow-Origin", req.get("Origin") || "*");
      res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
      res.set("Access-Control-Allow-Methods", "POST, OPTIONS");

      if (req.method === "OPTIONS") {
        return res.status(204).send("");
      }

      if (req.method !== "POST") {
        return res.status(405).send({error: "Use POST"});
      }

      const apiKey = geminiApiKey.value();
      if (!apiKey) {
        return res.status(500).send({error: "GEMINI_API_KEY not configured"});
      }

      const model = req.body?.model || req.query.model || "gemini-2.5-flash";
      const payload = req.body?.payload || req.body;

      if (!payload || typeof payload !== "object") {
        return res.status(400).send({error: "Missing payload"});
      }

      try {
        const url = `${GEMINI_API_BASE}/${model}:generateContent?key=` +
          encodeURIComponent(apiKey);
        const upstream = await fetch(
            url,
            {
              method: "POST",
              headers: {"Content-Type": "application/json"},
              body: JSON.stringify(payload),
            },
        );

        const data = await upstream.json().catch(() => ({}));
        if (!upstream.ok) {
          return res.status(upstream.status).send(data);
        }

        return res.status(200).send(data);
      } catch (err) {
        return res.status(500).send({
          error: err?.message || "Gemini proxy error",
        });
      }
    });
