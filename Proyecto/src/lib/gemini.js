// ============================== Gemini Client (via Cloud Function) ==============================
// El cliente ya no expone la API key; todas las peticiones pasan por /api/gemini.

const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_PROXY_URL = "/api/gemini";

// Marcadores mantenidos por compatibilidad; la key vive en Cloud Functions.
export const GEMINI_API_KEY_PLACEHOLDER = "SERVERSIDE_KEY";
export const GEMINI_EMBEDDED_API_KEY = GEMINI_API_KEY_PLACEHOLDER;

export function setGeminiApiKey() {
  // Sin-op: la clave no se gestiona en el cliente
  return null;
}

export function getGeminiApiKey() {
  return GEMINI_API_KEY_PLACEHOLDER;
}

export function hasGeminiApiKey() {
  // Siempre true porque la key se almacena en el backend
  return true;
}

export function buildCatalogSummary(items = []) {
  if (!Array.isArray(items) || items.length === 0) {
    return "No hay resenas disponibles todavia. Usa conocimiento general para proponer opciones family-friendly del catalogo de CulturaX.";
  }

  return items
      .map((item, index) => {
        const title = item.title ?? "Sin titulo";
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
          : "sin genero identificado";
        const blurb = item.description
          ? item.description.slice(0, 220).trim()
          : "Sin descripcion disponible.";

        return `${index + 1}. ${title} | Generos: ${genresLabel} | Rating promedio: ${rating}. Resena destacada: ${blurb}`;
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
    return "El usuario aun no registra resenas personales. Pregunta por sus gustos antes de recomendar.";
  }

  return reviews
      .slice(0, 8)
      .map((review) => {
        const title = review.obraTitulo ?? review.titulo ?? "Sin titulo";
        const category = review.categoria ?? review.kind ?? "Categoria desconocida";
        const rating =
        typeof review.estrellas === "number"
          ? `${Number(review.estrellas).toFixed(1)}/5`
          : "sin rating";
        const comment = cleanSnippet(review.comentario || review.review || "");
        return `Tu resena sobre ${title} (${category}) fue de ${rating}. Comentaste: ${
          comment || "sin comentario registrado."
        }`;
      })
      .join("\n");
}

export function buildCommunityReviewSummary(reviews = []) {
  if (!Array.isArray(reviews) || reviews.length === 0) {
    return "La comunidad aun no ha dejado resenas aprovechables para este contexto.";
  }

  return reviews
      .slice(0, 12)
      .map((review) => {
        const title = review.obraTitulo ?? review.titulo ?? "Sin titulo";
        const category = review.categoria ?? review.kind ?? "Categoria desconocida";
        const rating =
        typeof review.estrellas === "number"
          ? `${Number(review.estrellas).toFixed(1)}/5`
          : "sin rating";
        const comment = cleanSnippet(review.comentario || review.review || "");
        const criticName = review.userName?.trim();
        const origin = criticName ? `El usuario ${criticName}` : "La comunidad de CulturaX";
        const commentLabel = comment
          ? `${origin} comenta: ${comment}`
          : `${origin} no dejo un comentario adicional.`;
        return `La comunidad registra ${rating} para ${title} (${category}). ${commentLabel}`;
      })
      .join("\n");
}

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

async function callGeminiModel(model, payload) {
  const response = await fetch(GEMINI_PROXY_URL, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({model, payload}),
  });

  if (!response.ok) {
    let details = {};
    try {
      details = await response.json();
    } catch {
      // ignore parse error
    }
    const err = new Error(
        details?.error?.message ||
        `El proxy IA respondio con ${response.status}`,
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
    const fallbackText = `No pude generar sugerencias porque la peticion fue bloqueada por ${blockReason}. Intenta reformular tu pregunta con menos contenido sensible.`;
    return {
      text: fallbackText,
      candidate,
      fallback: true,
    };
  }

  return {text, candidate, fallback: false};
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

  const catalogContext =
    catalogSummary ||
    "No hay resenas en este momento, asi que responde con tendencias generales pero avisa que son estimaciones.";
  const userContext =
    userReviewSummary ||
    "El usuario no tiene resenas previas; debes indagar sus gustos durante la conversacion.";
  const communityContext =
    communityReviewSummary ||
    "La comunidad no ha generado resenas recientes; usa el catalogo como referencia principal.";

  const composedPrompt = [
    "Contexto con resenas reales y calificaciones de la comunidad de CulturaX:",
    catalogContext,
    "",
    "Historial del usuario (resenas personales):",
    userContext,
    "",
    "Lo que comenta la comunidad recientemente:",
    communityContext,
    "",
    "Instrucciones:",
    "- Usa SOLO los datos anteriores cuando existan coincidencias.",
    "- Prioriza opciones que se alineen con las resenas personales del usuario.",
    "- Cuando el usuario pregunte por una obra, resume lo que la comunidad opina (si hay datos).",
    '- Si el usuario pide revisar "sus resenas", limita las recomendaciones a titulos presentes en su historial. Si no hay coincidencias, dilo explicitamente antes de sugerir algo nuevo.',
    "- No inventes titulos ni resenas inexistentes; menciona unicamente los contenidos proporcionados.",
    "- Responde en espanol neutro con el tono cercano de CulturIAx, el asistente de ecommerce de CulturaX.",
    "- Entrega texto plano, sin Markdown ni negritas; evita asteriscos dobles o triples.",
    "- Si das recomendaciones, usa hasta 3 lineas con guiones (-) o enumeracion simple, sin vinetas con asteriscos.",
    "- Indica por que cada titulo tiene buenas resenas o encaja con la solicitud.",
    "- Si no encuentras coincidencias, di que no hay datos y sugiere explorar el catalogo.",
    "",
    `Consulta del usuario: ${userMessage.trim()}`,
  ].join("\n");

  const submittedContent = {
    role: "user",
    parts: [{text: composedPrompt}],
  };

  const normalizedHistory = Array.isArray(history) ? history : [];
  const payload = {
    system_instruction: {
      role: "system",
      parts: [
        {
          text: "Eres CulturIAx, el asistente IA de CulturaX. Usas resenas verificadas para recomendar peliculas y series con maximo 120 palabras, estilo conversacional profesional. Responde exclusivamente en texto plano, sin function calls ni respuestas estructuradas.",
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

  const result = await callGeminiModel(GEMINI_MODEL, payload);
  return {
    text: result.text,
    submittedContent,
    model: GEMINI_MODEL,
    fallback: result.fallback,
  };
}

export default requestGeminiRecommendation;
