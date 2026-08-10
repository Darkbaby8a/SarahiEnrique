import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.NETLIFY_DATABASE_URL_UNPOOLED,
  ssl: { rejectUnauthorized: false },
});

export const handler = async (event, context) => {
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
      body: JSON.stringify({ message: "Successful preflight" }),
    };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Método no permitido." }),
    };
  }

  try {
    const { FamiliaDesc, Mesa, Pases } = JSON.parse(event.body);

    if (!FamiliaDesc || !Mesa || Pases === undefined) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Faltan campos obligatorios." }),
      };
    }

    // 1. Crear el identificador base usando URL Encode y pasándolo a minúsculas para consistencia
    const identificadorBase = FamiliaDesc.trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Quita acentos
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "") // Elimina cualquier símbolo
      .replace(/\s+/g, "_"); // Espacios -> _

    let familiaNombreUnico = identificadorBase;

    // 2. Verificar si ya existen registros que empiecen con ese identificador
    const checkQuery = `
      SELECT COUNT(*) as total 
      FROM "IsmaLuisa" 
      WHERE "familiaNombre" = $1 OR "familiaNombre" LIKE $2;
    `;
    const checkValues = [identificadorBase, `${identificadorBase}-%`];
    const checkResult = await pool.query(checkQuery, checkValues);
    const coincidencias = parseInt(checkResult.rows[0].total, 10);

    // 3. Si ya existen registros, le concatenamos el número consecutivo correspondiente
    if (coincidencias > 0) {
      familiaNombreUnico = `${identificadorBase}-${coincidencias}`;
    }

    // 4. Insertar en la base de datos incluyendo el nuevo campo 'familiaNombre'
    const insertQuery = `
      INSERT INTO "IsmaLuisa" ("familiaNombre", "FamiliaDesc", "Mesa", "Pases")
      VALUES ($1, $2, $3, $4)
      RETURNING id, "familiaNombre";
    `;

    const insertValues = [
      familiaNombreUnico,
      FamiliaDesc,
      Mesa,
      parseInt(Pases, 10),
    ];

    const result = await pool.query(insertQuery, insertValues);

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        success: true,
        message: "Invitado agregado exitosamente.",
        id: result.rows[0].id,
        familiaNombre: result.rows[0].familiaNombre, // Te lo devuelvo por si lo necesitas en el frontend
      }),
    };
  } catch (error) {
    console.error("Error al procesar la solicitud:", error);
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        error: "Error interno en el servidor.",
        details: error.message,
      }),
    };
  }
};
