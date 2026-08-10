import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.NETLIFY_DATABASE_URL_UNPOOLED,
  ssl: { rejectUnauthorized: false },
});

export const handler = async (event, context) => {
  // Configuración básica de CORS por si acceden desde distintas rutas
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Content-Type": "application/json",
  };

  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: "OK" }),
    };
  }

  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Método no permitido" }),
    };
  }

  try {
    // Consultar todos los invitados ordenados por los más recientes
    const query = `
      SELECT id, "familiaidentificador", "familiades", "pases"
      FROM "sarahienrique" 
      ORDER BY id DESC;
    `;

    const result = await pool.query(query);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        totalInvitados: result.rows.length,
        // Calculamos el total de pases confirmados sumando la columna Pases
        totalPases: result.rows.reduce(
          (sum, row) => sum + (parseInt(row.pases, 10) || 0),
          0,
        ),
        data: result.rows,
      }),
    };
  } catch (error) {
    console.error("Error al obtener invitados:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: "Error interno del servidor",
        details: error.message,
      }),
    };
  }
};
