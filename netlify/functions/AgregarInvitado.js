import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.NETLIFY_DATABASE_URL_UNPOOLED,
  ssl: { rejectUnauthorized: false },
});

export const handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
  };

  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: "Successful preflight" }),
    };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Método no permitido." }),
    };
  }

  try {
    const body = JSON.parse(event.body || "{}");

    const familiaDesc = body.FamiliaDesc || body.familiades;
    const pases = body.Pases !== undefined ? body.Pases : body.pases;

    if (!familiaDesc || pases === undefined) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: "Faltan campos obligatorios (FamiliaDesc, Pases).",
        }),
      };
    }

    // 1. Crear el identificador base sin acentos ni símbolos
    const identificadorBase = familiaDesc
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .replace(/\s+/g, "_");

    let familiaNombreUnico = identificadorBase;

    // 2. Verificar si ya existen registros con ese identificador
    const checkQuery = `
      SELECT COUNT(*) as total 
      FROM "IsmaLuisa" 
      WHERE "familiaidentificador" = $1 OR "familiaidentificador" LIKE $2;
    `;
    const checkValues = [identificadorBase, `${identificadorBase}-%`];
    const checkResult = await pool.query(checkQuery, checkValues);
    const coincidencias = parseInt(checkResult.rows[0].total, 10);

    // 3. Concatenar número consecutivo si existe duplicidad
    if (coincidencias > 0) {
      familiaNombreUnico = `${identificadorBase}-${coincidencias}`;
    }

    // 4. Insertar en la base de datos
    const insertQuery = `
      INSERT INTO "IsmaLuisa" ("familiaidentificador", "familiades", "Pases")
      VALUES ($1, $2, $3)
      RETURNING id, "familiaidentificador";
    `;

    const insertValues = [familiaNombreUnico, familiaDesc, parseInt(pases, 10)];

    const result = await pool.query(insertQuery, insertValues);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: "Invitado agregado exitosamente.",
        id: result.rows[0].id,
        familiaNombre: result.rows[0].familiaidentificador,
      }),
    };
  } catch (error) {
    console.error("Error al procesar la solicitud:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: "Error interno en el servidor.",
        details: error.message,
      }),
    };
  }
};
