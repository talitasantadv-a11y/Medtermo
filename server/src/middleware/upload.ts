import fs from "fs";
import path from "path";
import multer from "multer";

const UPLOAD_DIR = path.resolve(__dirname, "..", "..", process.env.UPLOAD_DIR || "../uploads");
const LOGOS_DIR = path.join(UPLOAD_DIR, "logos");

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}
if (!fs.existsSync(LOGOS_DIR)) {
  fs.mkdirSync(LOGOS_DIR, { recursive: true });
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

const TAMANHO_MAXIMO_LOGO_BYTES = 2 * 1024 * 1024; // 2MB

const storageLogo = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, LOGOS_DIR);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const extensao = path.extname(file.originalname).toLowerCase() || ".png";
    cb(null, `cejusc-${req.usuario?.id ?? "0"}-${timestamp}${extensao}`);
  },
});

export const uploadLogo = multer({
  storage: storageLogo,
  limits: { fileSize: TAMANHO_MAXIMO_LOGO_BYTES },
  fileFilter: (_req, file, cb) => {
    const ehImagem = /^image\/(png|jpe?g|svg\+xml|webp)$/.test(file.mimetype);
    if (!ehImagem) {
      return cb(new Error("Envie um arquivo de imagem (PNG, JPG, SVG ou WEBP)."));
    }
    cb(null, true);
  },
});

export { UPLOAD_DIR, LOGOS_DIR };
