import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: "Método no permitido",
    };
  }

  try {
    const body = JSON.parse(event.body);

    const resultado = await cloudinary.uploader.upload(
      body.file,

      {
        folder: "boda",

        resource_type: "auto",
      },
    );

    return {
      statusCode: 200,

      body: JSON.stringify({
        ok: true,

        url: resultado.secure_url,

        public_id: resultado.public_id,
      }),
    };
  } catch (error) {
    console.error(error);

    return {
      statusCode: 500,

      body: JSON.stringify({
        ok: false,

        error: error.message,
      }),
    };
  }
}
