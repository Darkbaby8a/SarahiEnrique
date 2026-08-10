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
      body: JSON.stringify({ ok: false, message: "Método no permitido." }),
    };
  }

  try {
    const { familiaNombre, asistira } = JSON.parse(event.body || "{}");

    if (!familiaNombre) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ok: false,
          message: "Nombre de familia requerido.",
        }),
      };
    }

    await pool.query(
      `
        UPDATE "sarahienrique"
        SET 
          acepto = $1,
          rechazo = $2
        WHERE "familiaidentificador" = $3;
      `,
      [asistira === true, asistira === false, familiaNombre],
    );

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ok: true,
        message: "Respuesta actualizada correctamente.",
      }),
    };
  } catch (error) {
    console.error("Error al actualizar asistencia:", error);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ok: false, error: error.message }),
    };
  }
};
