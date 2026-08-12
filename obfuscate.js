const fs = require("fs");
const JavaScriptObfuscator = require("javascript-obfuscator");

// Lista de archivos que deseas ofuscar
const filesToObfuscate = [
  "scripts.js",
  "agregarinvitados.js",
  "controlacceso.js",
  "galeriacompartida.js",
];

// Opciones de ofuscación
const obfuscatorOptions = {
  compact: true,
  controlFlowFlattening: true,
  controlFlowFlatteningThreshold: 0.75,
  deadCodeInjection: true,
  deadCodeInjectionThreshold: 0.4,
  debugProtection: false, // Cámbialo a true si quieres congelar la consola al abrir DevTools
  disableConsoleOutput: false,
  stringArray: true,
  stringArrayEncoding: ["base64"],
  stringArrayThreshold: 0.75,
  splitStrings: true,
  splitStringsChunkLength: 10,
};

// Iterar y ofuscar cada archivo
filesToObfuscate.forEach((fileName) => {
  const inputFilePath = `./${fileName}`;

  // Reemplaza '.js' por '.min.js' al final del archivo
  // Ejemplo: 'scripts.js' -> './scripts.min.js'
  const outputFilePath = `./${fileName.replace(/\.js$/, ".min.js")}`;

  try {
    if (fs.existsSync(inputFilePath)) {
      const code = fs.readFileSync(inputFilePath, "utf8");

      const obfuscatedResult = JavaScriptObfuscator.obfuscate(
        code,
        obfuscatorOptions,
      );

      fs.writeFileSync(
        outputFilePath,
        obfuscatedResult.getObfuscatedCode(),
        "utf8",
      );
      console.log(`✅ Archivo ofuscado exitosamente: ${fileName}`);
    } else {
      console.warn(`⚠️ El archivo no existe: ${inputFilePath}`);
    }
  } catch (error) {
    console.error(`❌ Error al ofuscar el archivo ${fileName}:`, error);
  }
});
