import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.NETLIFY_DATABASE_URL_UNPOOLED,
  ssl: { rejectUnauthorized: false },
});

export const handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const { familia } = event.queryStringParameters || {};

  if (!familia) {
    return {
      statusCode: 400,
      body: JSON.stringify({ ok: false, error: "familia requerido" }),
    };
  }

  try {
    const { rows } = await pool.query(
      `
      SELECT
        id,
        FamiliaNombre,
        FamiliaDesc,
        pases,
        COALESCE(pasesuti,0) as pasesuti,
        acepto,
        rechazo
      FROM IsmaLuisa
      WHERE FamiliaNombre = $1
      ORDER BY FamiliaDesc
    `,
      [familia],
    );

    return {
      statusCode: 200,
      body: JSON.stringify({
        ok: true,
        invitados: rows,
      }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ ok: false, error: err.message }),
    };
  }
};
