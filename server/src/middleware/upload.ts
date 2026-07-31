import fs from "fs";
import path from "path";
import multer from "multer";

const UPLOAD_DIR = path.resolve(__dirname, "..", "..", process.env.UPLOAD_DIR || "../uploads");

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

export const MAX_ARQUIVOS_POR_PROCESSO = 5;
export const TAMANHO_MAXIMO_BYTES = 10 * 1024 * 1024; // 10MB

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const processoId = req.params.id;
    const timestamp = Date.now();
    const nomeSanitizado = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    cb(null, `${processoId}_${timestamp}_${nomeSanitizado}`);
  },
});

export const uploadPdf = multer({
  storage,
  limits: { fileSize: TAMANHO_MAXIMO_BYTES },
  fileFilter: (_req, file, cb) => {
    const ehPdf =
      file.mimetype === "application/pdf" ||
      file.originalname.toLowerCase().endsWith(".pdf");
    if (!ehPdf) {
      return cb(new Error("Apenas arquivos PDF são aceitos."));
    }
    cb(null, true);
  },
});

export { UPLOAD_DIR };
