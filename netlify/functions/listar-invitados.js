import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.NETLIFY_DATABASE_URL_UNPOOLED,
  ssl: { rejectUnauthorized: false },
});

export const handler = async (event) => {
  if (event.httpMethod && event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ok: false, message: "Method Not Allowed" }),
    };
  }

  try {
    const { rows } = await pool.query(`
      SELECT
        familiaidentificador,
        familiades,
        pases,
        COALESCE(pasesuti, 0) AS pasesuti,
        (pases - COALESCE(pasesuti, 0)) AS disponibles,
        acepto,
        rechazo
      FROM sarahienrique
      ORDER BY familiaidentificador, familiades
    `);

    const totales = {
      total_invitados: rows.length,
      total_aceptaron: 0,
      total_rechazaron: 0,
      total_pendientes: 0,
      total_disponibles: 0,
    };

    const invitadosMapeados = rows.map((i) => {
      const pases = Number(i.pases || 0);
      const pasesuti = Number(i.pasesuti || 0);
      const disponibles = Number(i.disponibles || 0);

      if (i.acepto === true && i.rechazo === false) {
        totales.total_aceptaron++;
      } else if (i.acepto === false && i.rechazo === true) {
        totales.total_rechazaron++;
      } else {
        totales.total_pendientes++;
      }

      totales.total_disponibles += disponibles;

      return {
        familia: i.familiaidentificador,
        familiaNombre: i.familiaidentificador,
        displayname: i.familiades,
        FamiliaDesc: i.familiades,
        pases: pases,
        pasesuti: pasesuti,
        disponibles: disponibles,
        acepto: i.acepto,
        rechazo: i.rechazo,
      };
    });

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ok: true,
        invitados: invitadosMapeados,
        totales,
      }),
    };
  } catch (error) {
    console.error("Error listar invitados:", error);

    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ok: false,
        error: "Error interno del servidor",
      }),
    };
  }
};
