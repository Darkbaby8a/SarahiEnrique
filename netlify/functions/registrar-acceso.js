import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.NETLIFY_DATABASE_URL_UNPOOLED,
  ssl: { rejectUnauthorized: false },
});

export const handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ok: false, error: "Method Not Allowed" }),
    };
  }

  try {
    if (!event.body) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ok: false,
          error: "Cuerpo de la petición vacío",
        }),
      };
    }

    const { familia, pasesUsar } = JSON.parse(event.body);

    if (!familia || !pasesUsar || pasesUsar <= 0) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ok: false,
          error: "Datos de entrada inválidos",
        }),
      };
    }

    const { rows } = await pool.query(
      `SELECT pases, COALESCE(pasesuti, 0) AS pasesuti 
       FROM sarahienrique 
       WHERE familiaidentificador = $1`,
      [familia],
    );

    if (!rows.length) {
      return {
        statusCode: 404,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ok: false, error: "Familia no encontrada" }),
      };
    }

    const pasesTotales = Number(rows[0].pases || 0);
    const pasesUtilizados = Number(rows[0].pasesuti || 0);
    const pasesNuevosTotales = pasesUtilizados + Number(pasesUsar);

    if (pasesNuevosTotales > pasesTotales) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ok: false, message: "Pases excedidos" }),
      };
    }

    await pool.query(
      `UPDATE sarahienrique
       SET pasesuti = COALESCE(pasesuti, 0) + $1
       WHERE familiaidentificador = $2`,
      [pasesUsar, familia],
    );

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ok: true,
        message: "Acceso registrado correctamente",
      }),
    };
  } catch (err) {
    console.error("Error en registrar-acceso:", err);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ok: false, error: err.message }),
    };
  }
};
