import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.NETLIFY_DATABASE_URL_UNPOOLED,
  ssl: { rejectUnauthorized: false },
});

export const handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const nombre = event.queryStringParameters?.displayname;

  if (!nombre) {
    return {
      statusCode: 400,
      body: JSON.stringify({ ok: false, message: "DisplayName requerido" }),
    };
  }

  try {
    const result = await pool.query(
      `
      SELECT
        familiaNombre,
        pases,
        acepto,
        FamiliaDesc,
        rechazo,
        COALESCE(pasesuti, 0)      AS pasesusados,
        pases - COALESCE(pasesuti, 0) AS disponibles
      FROM public.invitados
      WHERE FamiliaDesc ILIKE $1
      ORDER BY FamiliaDesc
      LIMIT 5;
      `,
      [`%${nombre}%`],
    );

    if (result.rowCount === 0) {
      return {
        statusCode: 200,
        body: JSON.stringify({ ok: false }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        ok: true,
        invitados: result.rows.map((r) => ({
          familia: r.familiaNombre,
          displayname: r.FamiliaDesc,
          pases: r.pases,
          usados: r.pasesusados,
          disponibles: r.disponibles,
          acepto: r.acepto,
          rechazo: r.rechazo,
        })),
      }),
    };
  } catch (error) {
    console.error("ERROR obtener invitado por nombre:", error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        ok: false,
        error: error.message,
      }),
    };
  }
};
