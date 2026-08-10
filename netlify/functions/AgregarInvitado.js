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
    let familiaNombreReq = body.familiaNombre || body.familiaidentificador;

    if (!familiaDesc || pases === undefined) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: "Faltan campos obligatorios (FamiliaDesc, Pases).",
        }),
      };
    }

    // 1. Obtener identificador base: usar el del cliente o generarlo a partir del nombre
    let identificadorBase = "";

    if (familiaNombreReq && familiaNombreReq.trim() !== "") {
      identificadorBase = familiaNombreReq
        .trim()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "-") // Reemplazar caracteres no alfanuméricos con guion
        .replace(/-+/g, "-");
    } else {
      identificadorBase = familiaDesc
        .trim()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, "")
        .replace(/\s+/g, "-");
    }

    let familiaNombreUnico = identificadorBase;

    // 2. Verificar si ya existen registros con ese identificador exacto o con prefijo
    const checkQuery = `
      SELECT COUNT(*) as total 
      FROM "sarahienrique" 
      WHERE "familiaidentificador" = $1 OR "familiaidentificador" LIKE $2;
    `;
    const checkValues = [identificadorBase, `${identificadorBase}-%`];
    const checkResult = await pool.query(checkQuery, checkValues);
    const coincidencias = parseInt(checkResult.rows[0].total, 10);

    // 3. Concatenar consecutivo si el identificador exacto está tomado
    if (coincidencias > 0) {
      familiaNombreUnico = `${identificadorBase}-${coincidencias}`;
    }

    // 4. Insertar en la base de datos
    const insertQuery = `
      INSERT INTO "sarahienrique" ("familiaidentificador", "familiades", "pases")
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
