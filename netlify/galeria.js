import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,

  api_key: process.env.CLOUDINARY_API_KEY,

  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function handler(event) {
  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,

      body: JSON.stringify({
        error: "Método no permitido",
      }),
    };
  }

  try {
    const resultado = await cloudinary.search
      .expression("folder:boda")
      .sort_by("created_at", "desc")
      .max_results(200)
      .execute();

    const archivos = resultado.resources.map((item) => ({
      url: cloudinary.url(item.public_id, {
        width: 900,

        quality: "auto",

        fetch_format: "auto",
      }),

      original: item.secure_url,

      tipo: item.resource_type,

      fecha: item.created_at,
    }));

    return {
      statusCode: 200,

      headers: {
        "Content-Type": "application/json",

        "Cache-Control": "public, max-age=60",
      },

      body: JSON.stringify(archivos),
    };
  } catch (error) {
    console.error(error);

    return {
      statusCode: 500,

      body: JSON.stringify({
        error: error.message,
      }),
    };
  }
}
