import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import fs from "fs";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import cors from "cors";
import multer from "multer";
import { GoogleGenAI } from "@google/genai";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";

const PORT = 3000;
const DB_FILE = "database.sqlite";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "123456";
let JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  if (process.env.NODE_ENV === "production") {
    console.error("CRITICAL ERROR: JWT_SECRET environment variable is not set.");
    process.exit(1);
  } else {
    console.warn("WARNING: JWT_SECRET environment variable is not set. Using a temporary secret for development.");
    JWT_SECRET = "dev-temporary-secret-do-not-use-in-prod";
  }
}

const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  message: { success: false, error: "Too many login attempts, please try again later." },
});

const changePasswordLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  message: { success: false, error: "Too many password change attempts, please try again later." },
});

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir)
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, uniqueSuffix + path.extname(file.originalname))
  }
});
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("INVALID_FILE_TYPE"));
    }
  }
});

async function autoTranslateCategory(nameFa: string) {
  try {
    const prompt = `You are a translator. Translate this short title "${nameFa}" from Persian into Arabic, English, and Turkish. Return ONLY a valid JSON object in this exact format, with no markdown formatting or extra text: {"ar": "arabic text", "en": "english text", "tr": "turkish text"}`;
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    let text = response.text || '';
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(text);
    return {
      ar: parsed.ar || nameFa,
      en: parsed.en || nameFa,
      tr: parsed.tr || nameFa
    };
  } catch (error) {
    console.error("Translation Error:", error);
    return { ar: nameFa, en: nameFa, tr: nameFa };
  }
}

async function initializeDb() {
  const db = await open({
    filename: DB_FILE,
    driver: sqlite3.Database,
  });

  await db.exec("PRAGMA foreign_keys = ON;");

  const schema = fs.readFileSync(path.join(process.cwd(), "schema.sql"), "utf-8");
  await db.exec(schema);
  
  // Ensure default password exists and is hashed
  const setting = await db.get("SELECT value FROM settings WHERE key = 'admin_password'");
  if (!setting) {
    const defaultHash = await bcrypt.hash("123456", 10);
    await db.run("INSERT INTO settings (key, value) VALUES ('admin_password', ?)", [defaultHash]);
    await db.run("INSERT INTO settings (key, value) VALUES ('password_changed_at', ?)", [Date.now().toString()]);
  } else if (!setting.value.startsWith("$2b$")) {
    const hashed = await bcrypt.hash(setting.value, 10);
    await db.run("UPDATE settings SET value = ? WHERE key = 'admin_password'", [hashed]);
    await db.run("INSERT INTO settings (key, value) VALUES ('password_changed_at', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value", [Date.now().toString()]);
  } else {
    // Ensure password_changed_at exists if we somehow missed it
    const changedAt = await db.get("SELECT value FROM settings WHERE key = 'password_changed_at'");
    if (!changedAt) {
      await db.run("INSERT INTO settings (key, value) VALUES ('password_changed_at', ?)", [Date.now().toString()]);
    }
  }

  const count = await db.get("SELECT COUNT(*) as count FROM categories");
  if (count.count === 0) {
    console.log("Seeding extensive demo data with 4 languages...");
    
    const l1_1 = (await db.run("INSERT INTO categories (parent_id, layer_level, name_fa, name_ar, name_en, name_tr, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)", [null, 1, "پرچم", "علم", "Flag", "Bayrak", 1])).lastID;
    const l1_2 = (await db.run("INSERT INTO categories (parent_id, layer_level, name_fa, name_ar, name_en, name_tr, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)", [null, 1, "کتیبه مخمل", "كتيبة مخملية", "Velvet Katibe", "Kadife Katibe", 1])).lastID;
    const l1_3 = (await db.run("INSERT INTO categories (parent_id, layer_level, name_fa, name_ar, name_en, name_tr, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)", [null, 1, "بنر", "لافتة", "Banner", "Afiş", 1])).lastID;

    const l2_1 = (await db.run("INSERT INTO categories (parent_id, layer_level, name_fa, name_ar, name_en, name_tr, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)", [l1_1, 2, "پرچم رومیزی", "علم مكتبي", "Desktop Flag", "Masa Bayrağı", 1])).lastID;
    const l2_2 = (await db.run("INSERT INTO categories (parent_id, layer_level, name_fa, name_ar, name_en, name_tr, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)", [l1_2, 2, "کتیبه افقی", "كتيبة أفقية", "Horizontal Katibe", "Yatay Katibe", 1])).lastID;

    const l3_1 = (await db.run("INSERT INTO categories (parent_id, layer_level, name_fa, name_ar, name_en, name_tr, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)", [l2_2, 3, "امام حسین (ع)", "الإمام الحسين", "Imam Hussein", "İmam Hüseyin", 1])).lastID;
    const l3_2 = (await db.run("INSERT INTO categories (parent_id, layer_level, name_fa, name_ar, name_en, name_tr, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)", [l2_1, 3, "عمومی", "عام", "General", "Genel", 1])).lastID;

    const l4_1 = (await db.run("INSERT INTO categories (parent_id, layer_level, name_fa, name_ar, name_en, name_tr, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)", [l3_1, 4, "محرم", "محرم", "Muharram", "Muharrem", 1])).lastID;
    const l4_2 = (await db.run("INSERT INTO categories (parent_id, layer_level, name_fa, name_ar, name_en, name_tr, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)", [l3_1, 4, "اربعین", "الأربعين", "Arbaeen", "Erbain", 1])).lastID;

    const d1 = (await db.run("INSERT INTO designs (category_id, sku_code, image_url, is_active) VALUES (?, ?, ?, ?)", [l4_1, "MUH-HUS-100", "https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?q=80&w=600&auto=format&fit=crop", 1])).lastID;
    const d2 = (await db.run("INSERT INTO designs (category_id, sku_code, image_url, is_active) VALUES (?, ?, ?, ?)", [l4_2, "ARB-HUS-200", "https://images.unsplash.com/photo-1601058268499-e52658b8ebf8?q=80&w=600&auto=format&fit=crop", 1])).lastID;

    await db.run("INSERT INTO variants (design_id, size_dimensions, stock_count, is_active) VALUES (?, ?, ?, ?)", [d1, "100x200 cm", 50, 1]);
    await db.run("INSERT INTO variants (design_id, size_dimensions, stock_count, is_active) VALUES (?, ?, ?, ?)", [d2, "200x400 cm", 5, 1]);
  }

  return db;
}

function buildTree(categories: any[], designs: any[], variants: any[]) {
  const nodeMap = new Map();
  const tree: any[] = [];

  for (const cat of categories) {
    nodeMap.set(cat.id, { ...cat, children: [], designs: [] });
  }

  const variantsByDesign = new Map();
  for (const v of variants) {
    if (!variantsByDesign.has(v.design_id)) {
      variantsByDesign.set(v.design_id, []);
    }
    variantsByDesign.get(v.design_id).push(v);
  }

  for (const d of designs) {
    d.variants = variantsByDesign.get(d.id) || [];
    const catNode = nodeMap.get(d.category_id);
    if (catNode) {
      catNode.designs.push(d);
    }
  }

  for (const cat of categories) {
    const node = nodeMap.get(cat.id);
    if (cat.parent_id) {
      const parent = nodeMap.get(cat.parent_id);
      if (parent) {
        parent.children.push(node);
      }
    } else {
      tree.push(node);
    }
  }

  return tree;
}

async function startServer() {
  const app = express();
  app.use(cors({ origin: process.env.APP_URL || 'http://localhost:3000' }));
  app.use(express.json());
  
  app.use('/api', (req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
  });
  
  app.use('/uploads', express.static(uploadDir));

  const db = await initializeDb();

  // Middleware to protect admin routes dynamically
  const requireAdmin = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const authHeader = req.headers['authorization'] || req.headers['x-admin-password'];
    let token = '';
    if (authHeader && (authHeader as string).startsWith('Bearer ')) {
      token = (authHeader as string).substring(7);
    } else {
      token = authHeader as string;
    }

    if (!token) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;
      const changedAt = await db.get("SELECT value FROM settings WHERE key = 'password_changed_at'");
      if (changedAt && decoded.version !== changedAt.value) {
        return res.status(401).json({ success: false, error: "Token expired due to password change" });
      }
      next();
    } catch(e) {
      res.status(401).json({ success: false, error: "Unauthorized" });
    }
  };

  // Protected: Verify Token
  app.get("/api/verify-token", requireAdmin, (req, res) => {
    res.json({ success: true });
  });

  // Public: Check Auth
  app.post("/api/auth", authLimiter, async (req, res) => {
    try {
      const { password } = req.body;
      const setting = await db.get("SELECT value FROM settings WHERE key = 'admin_password'");
      
      if (setting && await bcrypt.compare(password, setting.value)) {
        const changedAt = await db.get("SELECT value FROM settings WHERE key = 'password_changed_at'");
        const version = changedAt ? changedAt.value : Date.now().toString();
        const token = jwt.sign({ admin: true, version }, JWT_SECRET, { expiresIn: '12h' });
        res.json({ success: true, token });
      } else {
        res.status(401).json({ success: false, error: "رمز عبور اشتباه است." });
      }
    } catch (e) {
      res.status(500).json({ success: false });
    }
  });

  // Change Password
  app.post("/api/change-password", changePasswordLimiter, requireAdmin, async (req, res) => {
    try {
      const { newPassword } = req.body;
      if (!newPassword || newPassword.length < 4) {
        return res.status(400).json({ success: false, error: "رمز عبور جدید باید حداقل 4 کاراکتر باشد." });
      }
      const hashed = await bcrypt.hash(newPassword, 10);
      const newVersion = Date.now().toString();
      await db.run("INSERT INTO settings (key, value) VALUES ('admin_password', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value", [hashed]);
      await db.run("INSERT INTO settings (key, value) VALUES ('password_changed_at', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value", [newVersion]);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // Public: Get Menu
  app.get("/api/menu", async (req, res) => {
    try {
      const categories = await db.all("SELECT * FROM categories WHERE is_active = 1 ORDER BY layer_level ASC, id ASC");
      const designs = await db.all("SELECT * FROM designs WHERE is_active = 1");
      const variants = await db.all("SELECT * FROM variants WHERE is_active = 1");
      const tree = buildTree(categories, designs, variants);
      res.json({ success: true, data: tree });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, error: "Failed to fetch menu." });
    }
  });

  // Protected Admin Routes
  app.post("/api/categories", requireAdmin, async (req, res) => {
    const { parent_id, name_fa } = req.body;
    try {
      let layer_level = 1;
      if (parent_id) {
        const parent = await db.get("SELECT layer_level FROM categories WHERE id = ?", [parent_id]);
        if (!parent) {
          return res.status(400).json({ success: false, error: "دسته‌بندی والد نامعتبر است." });
        }
        layer_level = parent.layer_level + 1;
      }
      const name = name_fa || "بدون نام";
      const translations = await autoTranslateCategory(name);
      
      const result = await db.run(
        "INSERT INTO categories (parent_id, layer_level, name_fa, name_ar, name_en, name_tr, is_active) VALUES (?, ?, ?, ?, ?, ?, 1)",
        [parent_id || null, layer_level, name, translations.ar, translations.en, translations.tr]
      );
      res.json({ success: true, id: result.lastID });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.delete("/api/categories/:id", requireAdmin, async (req, res) => {
    try {
      const id = req.params.id;
      
      const designs = await db.all(`
        SELECT image_url FROM designs 
        WHERE category_id IN (
          WITH RECURSIVE CategoryTree AS (
            SELECT id FROM categories WHERE id = ?
            UNION ALL
            SELECT c.id FROM categories c
            INNER JOIN CategoryTree ct ON c.parent_id = ct.id
          )
          SELECT id FROM CategoryTree
        )
      `, [id]);

      for (const d of designs) {
        if (d.image_url && d.image_url.startsWith('/uploads/')) {
          const filePath = path.join(process.cwd(), d.image_url);
          if (fs.existsSync(filePath)) {
            try { fs.unlinkSync(filePath); } catch(e) {}
          }
        }
      }

      await db.run(`
        WITH RECURSIVE CategoryTree AS (
          SELECT id FROM categories WHERE id = ?
          UNION ALL
          SELECT c.id FROM categories c
          INNER JOIN CategoryTree ct ON c.parent_id = ct.id
        )
        UPDATE categories SET is_active = 0 WHERE id IN (SELECT id FROM CategoryTree)
      `, [id]);
      
      await db.run(`
        UPDATE designs 
        SET is_active = 0,
            sku_code = sku_code || '__deleted_' || ?
        WHERE category_id IN (
          WITH RECURSIVE CategoryTree AS (
            SELECT id FROM categories WHERE id = ?
            UNION ALL
            SELECT c.id FROM categories c
            INNER JOIN CategoryTree ct ON c.parent_id = ct.id
          )
          SELECT id FROM CategoryTree
        ) AND is_active = 1
      `, [Date.now().toString(), id]);
      
      await db.run(`
        UPDATE variants SET is_active = 0
        WHERE design_id IN (
          SELECT d.id FROM designs d
          WHERE d.category_id IN (
            WITH RECURSIVE CategoryTree AS (
              SELECT id FROM categories WHERE id = ?
              UNION ALL
              SELECT c.id FROM categories c
              INNER JOIN CategoryTree ct ON c.parent_id = ct.id
            )
            SELECT id FROM CategoryTree
          )
        )
      `, [id]);
      
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post("/api/designs", requireAdmin, (req, res, next) => {
    upload.single('image')(req, res, (err: any) => {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(413).json({ success: false, error: "حجم عکس انتخاب شده بسیار زیاد است. لطفاً عکس کم‌حجم‌تری انتخاب کنید." });
        }
        if (err.message === "INVALID_FILE_TYPE") {
          return res.status(400).json({ success: false, error: "فرمت عکس نامعتبر است. فقط jpg, png, webp مجاز است." });
        }
        return res.status(500).json({ success: false, error: err.message });
      }
      next();
    });
  }, async (req, res) => {
    const { category_id, sku_code } = req.body;
    if (!sku_code || sku_code.trim() === '') {
      return res.status(400).json({ success: false, error: "کد محصول (SKU) نمی‌تواند خالی باشد." });
    }
    const image_url = req.file ? `/uploads/${req.file.filename}` : (req.body.image_url || '');
    try {
      const result = await db.run(
        "INSERT INTO designs (category_id, sku_code, image_url, is_active) VALUES (?, ?, ?, 1)",
        [category_id, sku_code, image_url]
      );
      res.json({ success: true, id: result.lastID });
    } catch (error: any) {
      console.error(error);
      if (error.message.includes("UNIQUE constraint failed")) {
        res.status(400).json({ success: false, error: "این کد (SKU) قبلاً ثبت شده است. لطفاً کد دیگری وارد کنید." });
      } else {
        res.status(500).json({ success: false, error: error.message });
      }
    }
  });

  app.delete("/api/designs/:id", requireAdmin, async (req, res) => {
    try {
      const d = await db.get("SELECT image_url FROM designs WHERE id = ?", [req.params.id]);
      if (d && d.image_url && d.image_url.startsWith('/uploads/')) {
        const filePath = path.join(process.cwd(), d.image_url);
        if (fs.existsSync(filePath)) {
          try { fs.unlinkSync(filePath); } catch(e) {}
        }
      }
      await db.run("UPDATE designs SET is_active = 0, sku_code = sku_code || '__deleted_' || ? WHERE id = ? AND is_active = 1", [Date.now().toString(), req.params.id]);
      await db.run("UPDATE variants SET is_active = 0 WHERE design_id = ?", [req.params.id]);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post("/api/variants", requireAdmin, async (req, res) => {
    const { design_id, size_dimensions, stock_count } = req.body;
    if (!size_dimensions || size_dimensions.trim() === '') {
      return res.status(400).json({ success: false, error: "ابعاد نمی‌تواند خالی باشد." });
    }
    const stock = Number(stock_count);
    if (isNaN(stock) || stock < 0 || !Number.isInteger(stock)) {
      return res.status(400).json({ success: false, error: "موجودی نامعتبر است." });
    }
    try {
      const result = await db.run(
        "INSERT INTO variants (design_id, size_dimensions, stock_count, is_active) VALUES (?, ?, ?, 1)",
        [design_id, size_dimensions, stock]
      );
      res.json({ success: true, id: result.lastID });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.delete("/api/variants/:id", requireAdmin, async (req, res) => {
    try {
      await db.run("UPDATE variants SET is_active = 0 WHERE id = ?", [req.params.id]);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
