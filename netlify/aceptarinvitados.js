import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.NETLIFY_DATABASE_URL_UNPOOLED,
  ssl: { rejectUnauthorized: false },
});

export const handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({
        ok: false,
        message: "Método no permitido.",
      }),
    };
  }

  try {
    const { familiaNombre, asistira } = JSON.parse(event.body);

    if (!familiaNombre || typeof asistira !== "boolean") {
      return {
        statusCode: 400,
        body: JSON.stringify({
          ok: false,
          message: "Datos incompletos.",
        }),
      };
    }

    const acepto = asistira;
    const rechazo = !asistira;

    const result = await pool.query(
      `
            UPDATE "IsmaLuisa"
            SET
                acepto = $1,
                rechazo = $2,
                fechaaceptado = NOW()
            WHERE "familiaNombre" = $3
            RETURNING id;
        `,
      [acepto, rechazo, familiaNombre],
    );

    if (result.rowCount === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          ok: false,
          message: "Invitación no encontrada.",
        }),
      };
    }

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ok: true,
        message: asistira ? "Asistencia confirmada." : "Asistencia rechazada.",
        asistira,
      }),
    };
  } catch (error) {
    console.error(error);

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
