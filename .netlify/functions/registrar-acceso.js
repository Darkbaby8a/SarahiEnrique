import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.NETLIFY_DATABASE_URL_UNPOOLED,
  ssl: { rejectUnauthorized: false },
});

export const handler = async (event) => {
  try {
    const { familia, pasesUsar } = JSON.parse(event.body);

    const { rows } = await pool.query(
      `SELECT Pases, pasesuti FROM IsmaLuisa WHERE familiaNombre = $1`,
      [familia],
    );

    if (!rows.length)
      return { statusCode: 404, body: JSON.stringify({ ok: false }) };

    const { pases, pasesuti = 0 } = rows[0];
    if (pasesuti + pasesUsar > pases)
      return {
        statusCode: 400,
        body: JSON.stringify({ ok: false, message: "Pases excedidos" }),
      };

    await pool.query(
      `UPDATE IsmaLuisa
       SET pasesuti = COALESCE(pasesuti,0) + $1
       WHERE familiaNombre = $2`,
      [pasesUsar, familia],
    );

    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ ok: false, error: err.message }),
    };
  }
};
