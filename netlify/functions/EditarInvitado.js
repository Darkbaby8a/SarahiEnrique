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

    // Sincronización con las propiedades que envía el frontend
    const id = body.id;
    const familiaDesc = body.FamiliaDesc || body.familiades;
    const familiaNombre = body.familiaNombre || body.familiaidentificador;
    const pases = body.Pases !== undefined ? body.Pases : body.pases;

    if (!id || !familiaDesc || !familiaNombre || pases === undefined) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error:
            "Faltan campos obligatorios (id, FamiliaDesc, familiaNombre, Pases).",
        }),
      };
    }

    const query = `
      UPDATE "sarahienrique"
      SET
        "familiades" = $1,
        "familiaidentificador" = $2,
        "pases" = $3
      WHERE id = $4
      RETURNING id;
    `;

    const values = [
      familiaDesc,
      familiaNombre,
      parseInt(pases, 10),
      parseInt(id, 10),
    ];

    const result = await pool.query(query, values);

    if (result.rowCount === 0) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({
          error: "No se encontró el invitado.",
        }),
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: "Invitado actualizado correctamente.",
        id: result.rows[0].id,
      }),
    };
  } catch (error) {
    console.error("Error al actualizar invitado:", error);

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
