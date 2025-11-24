// ============================== Gemini Client ==============================
// Helper utilities to interact with Google Gemini for movie recommendations.

const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

// Texto usado para guiar al dev cuando no existe API key configurada.
export const GEMINI_API_KEY_PLACEHOLDER = "PON_AQUI_TU_API_KEY_DE_LA_IA";

// Cambia el valor de esta constante por tu API key local (ya añadida en tu repo).
export const GEMINI_EMBEDDED_API_KEY = "AIzaSyAaMuLHbunBGtaRF8S79S0rEn3LuyCqbfc";

const presetKey =
  typeof window !== "undefined" && window.__GEMINI_API_KEY__
    ? String(window.__GEMINI_API_KEY__)
    : "";

const embeddedKey =
  GEMINI_EMBEDDED_API_KEY &&
  GEMINI_EMBEDDED_API_KEY !== GEMINI_API_KEY_PLACEHOLDER
    ? GEMINI_EMBEDDED_API_KEY.trim()
    : "";

let geminiApiKey = (presetKey && presetKey.trim()) || embeddedKey;

export function setGeminiApiKey(key) {
  const normalized = key?.trim();
  geminiApiKey = normalized || embeddedKey;
}

export function getGeminiApiKey() {
  return geminiApiKey;
}

export function hasGeminiApiKey() {
  return Boolean(
    geminiApiKey && geminiApiKey !== GEMINI_API_KEY_PLACEHOLDER
  );
}

export function buildCatalogSummary(items = []) {
  if (!Array.isArray(items) || items.length === 0) {
    return "No hay reseñas disponibles todavía. Usa tu conocimiento general para proponer opciones family-friendly del catálogo de CulturaX.";
  }

  return items
    .map((item, index) => {
      const title = item.title ?? "Sin título";
      const rating =
        typeof item.rating === "number" && item.rating > 0
          ? `${item.rating.toFixed(1)}/5`
          : "sin calificar";
      const genres = Array.isArray(item.genres)
        ? item.genres
        : item.tag
        ? [item.tag]
        : [];
      const genresLabel = genres.length
        ? genres.join(", ")
        : "sin género identificado";
      const blurb = item.description
        ? item.description.slice(0, 220).trim()
        : "Sin descripción disponible.";

      return `${index + 1}. ${title} | Géneros: ${genresLabel} | Rating promedio: ${rating}. Reseña destacada: ${blurb}`;
    })
    .join("\n");
}

const cleanSnippet = (text, max = 220) => {
  if (!text) return "";
  const normalized = String(text).replace(/\s+/g, " ").trim();
  return normalized.length > max ? `${normalized.slice(0, max - 3)}...` : normalized;
};

export function buildUserReviewSummary(reviews = []) {
  if (!Array.isArray(reviews) || reviews.length === 0) {
    return "El usuario aún no registra reseñas personales. Pregunta por sus gustos antes de recomendar.";
  }

  return reviews
    .slice(0, 8)
    .map((review, index) => {
      const title = review.obraTitulo ?? review.titulo ?? "Sin título";
      const category = review.categoria ?? review.kind ?? "Categoría desconocida";
      const rating =
        typeof review.estrellas === "number"
          ? `${Number(review.estrellas).toFixed(1)}/5`
          : "sin rating";
      const comment = cleanSnippet(review.comentario || review.review || "");
      return `Tu reseña sobre ${title} (${category}) fue de ${rating}. Comentaste: ${
        comment || "sin comentario registrado."
      }`;
    })
    .join("\n");
}

export function buildCommunityReviewSummary(reviews = []) {
  if (!Array.isArray(reviews) || reviews.length === 0) {
    return "La comunidad aún no ha dejado reseñas aprovechables para este contexto.";
  }

  return reviews
    .slice(0, 12)
    .map((review, index) => {
      const title = review.obraTitulo ?? review.titulo ?? "Sin título";
      const category = review.categoria ?? review.kind ?? "Categoría desconocida";
      const rating =
        typeof review.estrellas === "number"
          ? `${Number(review.estrellas).toFixed(1)}/5`
          : "sin rating";
      const comment = cleanSnippet(review.comentario || review.review || "");
      const criticName = review.userName?.trim();
      const origin = criticName ? `El usuario ${criticName}` : "La comunidad de CulturaX";
      const commentLabel = comment
        ? `${origin} comenta: ${comment}`
        : `${origin} no dejó un comentario adicional.`;
      return `La comunidad registra ${rating} para ${title} (${category}). ${commentLabel}`;
    })
    .join("\n");
}

const buildGeminiUrl = (model) =>
  `${GEMINI_API_BASE}/${model}:generateContent`;

function extractTextFromCandidate(candidate) {
  const parts = candidate?.content?.parts;
  if (!Array.isArray(parts)) return "";

  const segments = parts
    .map((part) => {
      if (typeof part.text === "string" && part.text.trim()) {
        return part.text.trim();
      }
      if (part.functionCall) {
        const args = part.functionCall.args
          ? JSON.stringify(part.functionCall.args)
          : "";
        return `Sugerencia estructurada: ${part.functionCall.name} ${args}`;
      }
      if (part.inlineData?.data) {
        return part.inlineData.data;
      }
      if (part.executableCode?.code) {
        return part.executableCode.code;
      }
      if (part.fileData?.mimeType) {
        return `[Archivo ${part.fileData.mimeType}]`;
      }
      return "";
    })
    .filter(Boolean);

  return segments.join("\n").trim();
}

async function callGeminiModel(model, payload, apiKey) {
  const response = await fetch(
    `${buildGeminiUrl(model)}?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    let details = {};
    try {
      details = await response.json();
    } catch {
      // ignore parse error
    }
    const err = new Error(
      details?.error?.message ||
        `El servicio IA respondió con ${response.status}`
    );
    err.code = details?.error?.code ?? response.status;
    err.httpStatus = response.status;
    err.details = details;
    err.model = model;
    throw err;
  }

  const payloadData = await response.json();
  const candidate = payloadData?.candidates?.[0];
  const text = extractTextFromCandidate(candidate);

  if (!text) {
    const blockReason =
      candidate?.finishReason ||
      payloadData?.promptFeedback?.blockReason ||
      "motivos desconocidos";
    const fallbackText = `No pude generar sugerencias porque la petición fue bloqueada por ${blockReason}. Intenta reformular tu pregunta con menos contenido sensible.`;
    return {
      text: fallbackText,
      candidate,
      fallback: true,
    };
  }

  return {
    text,
    candidate,
    fallback: false,
  };
}

export async function requestGeminiRecommendation({
  userMessage,
  catalogSummary = "",
  userReviewSummary = "",
  communityReviewSummary = "",
  history = [],
} = {}) {
  if (!userMessage || !userMessage.trim()) {
    throw new Error("EMPTY_MESSAGE");
  }

  if (!hasGeminiApiKey()) {
    throw new Error("GEMINI_API_KEY_MISSING");
  }

  const catalogContext =
    catalogSummary ||
    "No hay reseñas en este momento, así que responde con tendencias generales pero avisa que son estimaciones.";
  const userContext =
    userReviewSummary ||
    "El usuario no tiene reseñas previas; debes indagar sus gustos durante la conversación.";
  const communityContext =
    communityReviewSummary ||
    "La comunidad no ha generado reseñas recientes; usa el catálogo como referencia principal.";

  const composedPrompt = [
    "Contexto con reseñas reales y calificaciones de la comunidad de CulturaX:",
    catalogContext,
    "",
    "Historial del usuario (reseñas personales):",
    userContext,
    "",
    "Lo que comenta la comunidad recientemente:",
    communityContext,
    "",
    "Instrucciones:",
    "- Usa SOLO los datos anteriores cuando existan coincidencias.",
    "- Prioriza opciones que se alineen con las reseñas personales del usuario.",
    "- Cuando el usuario pregunte por una obra, resume lo que la comunidad opina (si hay datos).",
    "- Si el usuario pide revisar \"sus reseñas\", limita las recomendaciones a títulos presentes en su historial. Si no hay coincidencias, dilo explícitamente antes de sugerir algo nuevo.",
    "- No inventes títulos ni reseñas inexistentes; menciona únicamente los contenidos proporcionados.",
    "- Responde en español neutro con el tono cercano de CulturIAx, el asistente de ecommerce de CulturaX.",
    "- Entrega texto plano, sin Markdown ni negritas; evita asteriscos dobles o triples.",
    "- Si das recomendaciones, usa hasta 3 líneas con guiones (-) o enumeración simple, sin viñetas con asteriscos.",
    "- Indica por qué cada título tiene buenas reseñas o encaja con la solicitud.",
    "- Si no encuentras coincidencias, di que no hay datos y sugiere explorar el catálogo.",
    "",
    `Consulta del usuario: ${userMessage.trim()}`,
  ].join("\n");

  const submittedContent = {
    role: "user",
    parts: [{ text: composedPrompt }],
  };

  const normalizedHistory = Array.isArray(history) ? history : [];
  const payload = {
    system_instruction: {
      role: "system",
      parts: [
        {
          text: "Eres CulturIAx, el asistente IA de CulturaX. Usas reseñas verificadas para recomendar películas y series con máximo 120 palabras, estilo conversacional profesional. Responde exclusivamente en texto plano, sin function calls ni respuestas estructuradas.",
        },
      ],
    },
    contents: [...normalizedHistory, submittedContent],
    generationConfig: {
      temperature: 0.65,
      topP: 0.9,
      topK: 32,
      maxOutputTokens: 2048,
    },
  };

  const result = await callGeminiModel(GEMINI_MODEL, payload, geminiApiKey);
  return {
    text: result.text,
    submittedContent,
    model: GEMINI_MODEL,
    fallback: result.fallback,
  };
}
