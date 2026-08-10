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
      body: JSON.stringify({
        ok: false,
        message: "Método no permitido.",
      }),
    };
  }

  const familia = event.queryStringParameters?.familia;

  if (!familia) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ok: false,
        message: "Familia requerida.",
      }),
    };
  }

  try {
    const result = await pool.query(
      `
        SELECT
            id,
            "familiaidentificador" AS "familiaNombre",
            "familiades" AS "FamiliaDesc",
            "Pases",
            acepto,
            rechazo
        FROM "sarahienrique"
        WHERE "familiaidentificador" = $1
        LIMIT 1;
      `,
      [familia],
    );

    if (result.rowCount === 0) {
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ok: false,
          message: "Invitación no encontrada.",
        }),
      };
    }

    const invitado = result.rows[0];

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ok: true,
        invitado: {
          id: invitado.id,
          familiaNombre: invitado.familiaNombre,
          FamiliaDesc: invitado.FamiliaDesc,
          Pases: invitado.Pases,
          acepto: invitado.acepto,
          rechazo: invitado.rechazo,
        },
      }),
    };
  } catch (error) {
    console.error("Error en la consulta:", error);

    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ok: false,
        error: error.message,
      }),
    };
  }
};
