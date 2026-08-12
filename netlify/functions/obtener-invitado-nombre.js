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
      body: JSON.stringify({ ok: false, message: "Method Not Allowed" }),
    };
  }

  const nombre = event.queryStringParameters?.displayname;

  if (!nombre) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ok: false, message: "DisplayName requerido" }),
    };
  }

  try {
    const result = await pool.query(
      `
      SELECT
        familiaidentificador,
        familiades,
        pases,
        COALESCE(pasesuti, 0) AS pasesuti,
        acepto,
        rechazo
      FROM sarahienrique
      WHERE familiades ILIKE $1
      ORDER BY familiades
      LIMIT 15;
      `,
      [`%${nombre}%`],
    );

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ok: true,
        invitados: result.rows.map((r) => ({
          familia: r.familiaidentificador,
          displayname: r.familiades,
          pases: Number(r.pases || 0),
          pasesuti: Number(r.pasesuti || 0),
          acepto: r.acepto,
          rechazo: r.rechazo,
        })),
      }),
    };
  } catch (error) {
    console.error("ERROR obtener invitado por nombre:", error);

    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ok: false,
        error: error.message,
      }),
    };
  }
};
