import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import fs from "fs";
import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import multer from "multer";
import crypto from "crypto";

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key-for-dev";

// Initialize Database
const dbPath = path.resolve(process.cwd(), "data.db");
const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    username TEXT,
    password TEXT,
    balance REAL DEFAULT 0.0,
    total_spent REAL DEFAULT 0.0,
    role TEXT DEFAULT 'user'
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    category TEXT,
    service TEXT,
    link TEXT,
    quantity INTEGER,
    price REAL,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    amount REAL,
    screenshot_url TEXT,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
`);

try {
  db.exec("ALTER TABLE payments ADD COLUMN screenshot_hash TEXT;");
} catch (e) {
  // Column might already exist
}

// Create a default admin user if none exists
const adminEmail = "admin@instagrow.com";
const adminUser = db.prepare("SELECT * FROM users WHERE email = ?").get(adminEmail);
if (!adminUser) {
  const hash = bcrypt.hashSync("instagrow444", 10);
  db.prepare("INSERT INTO users (email, username, password, role) VALUES (?, ?, ?, ?)").run(
    adminEmail,
    "Admin",
    hash,
    "admin"
  );
}

// Setup Uploads Directory
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});
const upload = multer({ storage: storage });

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.json());
  app.use("/uploads", express.static(uploadsDir));

  // Authentication Middleware
  const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    if (token == null) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) return res.sendStatus(403);
      req.user = user;
      next();
    });
  };

  const authenticateAdmin = (req: any, res: any, next: any) => {
    authenticateToken(req, res, () => {
      const user = db.prepare("SELECT role FROM users WHERE id = ?").get(req.user.id) as any;
      if (!user || user.role !== "admin") return res.sendStatus(403);
      next();
    });
  };

  // API Routes
  app.post("/api/auth/register", (req, res) => {
    const { email, username, password } = req.body;
    try {
      const hash = bcrypt.hashSync(password, 10);
      const stmt = db.prepare("INSERT INTO users (email, username, password) VALUES (?, ?, ?)");
      const info = stmt.run(email, username, hash);
      const token = jwt.sign({ id: info.lastInsertRowid, email, role: "user" }, JWT_SECRET);
      res.json({ token, user: { id: info.lastInsertRowid, email, username, role: "user" } });
    } catch (error) {
      res.status(400).json({ error: "Email already exists or invalid data" });
    }
  });

  app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body;
    const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as any;
    if (!user) return res.status(400).json({ error: "User not found" });

    const validPassword = bcrypt.compareSync(password, user.password);
    if (!validPassword) return res.status(400).json({ error: "Invalid password" });

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET);
    res.json({
      token,
      user: { id: user.id, email: user.email, username: user.username, role: user.role, balance: user.balance, total_spent: user.total_spent },
    });
  });

  app.get("/api/users/me", authenticateToken, (req: any, res: any) => {
    const user = db.prepare("SELECT id, email, username, balance, total_spent, role FROM users WHERE id = ?").get(req.user.id) as any;
    const orderStats = db.prepare("SELECT COUNT(*) as total FROM orders WHERE user_id = ?").get(req.user.id) as any;
    res.json({ ...user, total_orders: orderStats.total });
  });

  app.post("/api/orders", authenticateToken, (req: any, res: any) => {
    const { category, service, link, quantity, price } = req.body;
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.user.id) as any;
    
    if (user.balance < price) {
      return res.status(400).json({ error: "Insufficient balance" });
    }

    try {
      db.transaction(() => {
        // Deduct balance, add to total_spent
        db.prepare("UPDATE users SET balance = balance - ?, total_spent = total_spent + ? WHERE id = ?").run(price, price, req.user.id);
        // Create order
        db.prepare("INSERT INTO orders (user_id, category, service, link, quantity, price) VALUES (?, ?, ?, ?, ?, ?)").run(
          req.user.id, category, service, link, quantity, price
        );
      })();
      res.json({ message: "Order placed successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to place order" });
    }
  });

  app.get("/api/orders", authenticateToken, (req: any, res: any) => {
    const orders = db.prepare("SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC").all(req.user.id);
    res.json(orders);
  });

  app.post("/api/payments/upload", authenticateToken, upload.single("screenshot"), (req: any, res: any) => {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    
    const amount = parseFloat(req.body.amount);
    if (isNaN(amount) || amount <= 0) {
      try { fs.unlinkSync(req.file.path); } catch (e) {}
      return res.status(400).json({ error: "Invalid amount" });
    }

    try {
      const fileBuffer = fs.readFileSync(req.file.path);
      const hashSum = crypto.createHash('md5');
      hashSum.update(fileBuffer);
      const hex = hashSum.digest('hex');

      const existingPayment = db.prepare("SELECT * FROM payments WHERE screenshot_hash = ?").get(hex);
      if (existingPayment) {
        try { fs.unlinkSync(req.file.path); } catch (e) {}
        return res.status(400).json({ error: "This screenshot has already been used for a payment. One screenshot = One payment." });
      }

      const screenshotUrl = `/uploads/${req.file.filename}`;
      
      db.transaction(() => {
        db.prepare("INSERT INTO payments (user_id, amount, screenshot_url, screenshot_hash, status) VALUES (?, ?, ?, ?, 'approved')").run(
          req.user.id, amount, screenshotUrl, hex
        );
        db.prepare("UPDATE users SET balance = balance + ? WHERE id = ?").run(amount, req.user.id);
      })();

      res.json({ message: "Payment verified and balance added automatically!" });
    } catch (error: any) {
      console.error("Payment processing error:", error);
      try { fs.unlinkSync(req.file.path); } catch (e) {}
      res.status(500).json({ error: "Failed to process payment." });
    }
  });

  app.get("/api/payments", authenticateToken, (req: any, res: any) => {
    const payments = db.prepare("SELECT * FROM payments WHERE user_id = ? ORDER BY created_at DESC").all(req.user.id);
    res.json(payments);
  });

  app.post("/api/admin/promote", authenticateToken, (req: any, res: any) => {
    const { secret } = req.body;
    if (secret === "instagrow444") {
      db.prepare("UPDATE users SET role = 'admin' WHERE id = ?").run(req.user.id);
      res.json({ message: "Promoted to admin" });
    } else {
      res.status(403).json({ error: "Invalid secret" });
    }
  });

  // Admin Routes
  app.get("/api/admin/orders", authenticateAdmin, (req: any, res: any) => {
    const orders = db.prepare(`
      SELECT orders.*, users.username 
      FROM orders 
      JOIN users ON orders.user_id = users.id 
      ORDER BY orders.created_at DESC
    `).all();
    res.json(orders);
  });

  app.put("/api/admin/orders/:id/status", authenticateAdmin, (req: any, res: any) => {
    const { status } = req.body;
    db.prepare("UPDATE orders SET status = ? WHERE id = ?").run(status, req.params.id);
    res.json({ message: "Order updated" });
  });

  app.get("/api/admin/payments", authenticateAdmin, (req: any, res: any) => {
    const payments = db.prepare(`
      SELECT payments.*, users.username 
      FROM payments 
      JOIN users ON payments.user_id = users.id 
      ORDER BY payments.created_at DESC
    `).all();
    res.json(payments);
  });


  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*all", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
