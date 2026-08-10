import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.NETLIFY_DATABASE_URL_UNPOOLED,
  ssl: { rejectUnauthorized: false },
});

export const handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
  };

  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: "OK" }),
    };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Método no permitido." }),
    };
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const id = body.id;

    if (!id) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: "Debe proporcionar el id.",
        }),
      };
    }

    const query = `
      DELETE FROM "IsmaLuisa"
      WHERE id = $1
      RETURNING id;
    `;

    const result = await pool.query(query, [parseInt(id, 10)]);

    if (result.rowCount === 0) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({
          error: "El invitado no existe.",
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
