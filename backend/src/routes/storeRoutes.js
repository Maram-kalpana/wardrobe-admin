
const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const { protectAdmin } = require("../middleware/authMiddleware");

const {
  getStoreInformation,
  saveStoreInformation,
} = require("../controllers/storeController");

const router = express.Router();

const uploadDir = path.join(
  __dirname,
  "../../uploads/store"
);

fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();

    cb(
      null,
      `store-${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`
    );
  },
});

const upload = multer({
  storage,

  limits: {
    fileSize: 2 * 1024 * 1024,
  },

  fileFilter: (req, file, cb) => {
    const allowed = ["image/png", "image/jpeg", "image/webp"];
    const extensions = [".png", ".jpg", ".jpeg", ".webp"];
    const ext = path.extname(file.originalname).toLowerCase();

    if (allowed.includes(file.mimetype) && extensions.includes(ext)) {
      return cb(null, true);
    }

    cb(new Error("Only JPG, PNG and WEBP images are allowed"));
  },
});

router.get("/", getStoreInformation);

router.put(
  "/",
  protectAdmin,
  upload.single("store_logo"),
  saveStoreInformation
);

module.exports = router;
