import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.NETLIFY_DATABASE_URL_UNPOOLED,
  ssl: { rejectUnauthorized: false },
});

export const handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ok: false, error: "Method Not Allowed" }),
    };
  }

  const { familia } = event.queryStringParameters || {};

  if (!familia) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ok: false, error: "familia requerido" }),
    };
  }

  try {
    const { rows } = await pool.query(
      `
      SELECT
        id,
        familiaidentificador AS familia,
        familiades AS displayname,
        familiaidentificador,
        familiades,
        pases,
        COALESCE(pasesuti, 0) AS pasesuti,
        acepto,
        rechazo
      FROM sarahienrique
      WHERE familiaidentificador = $1
      ORDER BY familiades
    `,
      [familia],
    );

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ok: true,
        invitados: rows,
      }),
    };
  } catch (err) {
    console.error("Error en obtener-invitado-qr:", err);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ok: false, error: err.message }),
    };
  }
};
