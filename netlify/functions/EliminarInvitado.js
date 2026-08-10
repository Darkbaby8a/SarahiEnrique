import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.NETLIFY_DATABASE_URL_UNPOOLED,
  ssl: { rejectUnauthorized: false },
});

export const handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, DELETE, OPTIONS",
    "Content-Type": "application/json",
  };

  // 1. Manejo de Preflight OPTIONS
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: "OK" }),
    };
  }

  // 2. Permitir solo POST y DELETE
  if (event.httpMethod !== "POST" && event.httpMethod !== "DELETE") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Método no permitido." }),
    };
  }

  try {
    const body = JSON.parse(event.body || "{}");
    // Obtener ID desde Query Parameter (?id=123) o desde el Body ({ id: 123 })
    const rawId = event.queryStringParameters?.id || body.id;
    const parsedId = parseInt(rawId, 10);

    if (!rawId || isNaN(parsedId)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: "Debe proporcionar un id válido y numérico.",
        }),
      };
    }

    // Nota: Asegúrate de que la tabla coincida con la de tu entorno actual ("sarahienrique" o "IsmaLuisa")
    const query = `
      DELETE FROM "sarahienrique"
      WHERE id = $1
      RETURNING id;
    `;

    const result = await pool.query(query, [parsedId]);

    if (result.rowCount === 0) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({
          error: "El invitado no existe o ya fue eliminado.",
        }),
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: "Invitado eliminado correctamente.",
        id: result.rows[0].id,
      }),
    };
  } catch (error) {
    console.error("Error al eliminar invitado:", error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: "Error interno del servidor.",
        details: error.message,
      }),
    };
  }
};
