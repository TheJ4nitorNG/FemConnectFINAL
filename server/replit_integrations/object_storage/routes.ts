import type { Express, Request, Response, NextFunction } from "express";
import { randomUUID } from "crypto";

function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) return next();
  res.sendStatus(401);
}

export function registerObjectStorageRoutes(app: Express): void {
  
  // 1. Give the frontend a URL to upload to
  app.post("/api/uploads/request-url", isAuthenticated, async (req, res) => {
    try {
      const { name, contentType } = req.body;
      if (!name) return res.status(400).json({ error: "Missing required field: name" });

      const ext = name.split('.').pop() || 'png';
      const filename = `${randomUUID()}.${ext}`;

      res.json({
        // Trick the frontend into sending the file to our custom Relay endpoint below!
        uploadURL: `/api/uploads/relay/${filename}`,
        objectPath: `/objects/${filename}`,
        metadata: req.body,
      });
    } catch (error) {
      console.error("Error generating upload URL:", error);
      res.status(500).json({ error: "Failed to generate upload URL" });
    }
  });

  // 2. The Relay: Catch the file and push it to Supabase
  app.put("/api/uploads/relay/:filename", isAuthenticated, async (req, res) => {
    try {
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

      if (!supabaseUrl || !supabaseKey) {
        console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env variables!");
        return res.status(500).json({ error: "Server storage configuration is missing." });
      }

      // Read the raw binary file from the frontend
      const chunks: Buffer[] = [];
      for await (const chunk of req) {
        chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
      }
      const buffer = Buffer.concat(chunks);

      const filename = req.params.filename;
      const url = `${supabaseUrl}/storage/v1/object/profile-pictures/${filename}`;

      // Push it to Supabase!
      const uploadRes = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': req.headers['content-type'] || 'application/octet-stream',
        },
        body: buffer
      });

      if (!uploadRes.ok) {
        const errText = await uploadRes.text();
        console.error("Supabase upload failed:", errText);
        return res.status(500).json({ error: "Failed to save file to Supabase" });
      }

      res.sendStatus(200);
    } catch (error) {
      console.error("Error uploading relay file:", error);
      res.status(500).json({ error: "Failed to process file upload" });
    }
  });

  // 3. Serve the images by redirecting to the public Supabase URL
  app.get("/objects/:filename(*)", async (req, res) => {
    const supabaseUrl = process.env.SUPABASE_URL;
    if (!supabaseUrl) return res.status(500).send("Storage not configured");
    
    // Redirect the user's browser directly to the public Supabase bucket
    const filename = req.params.filename;
    res.redirect(`${supabaseUrl}/storage/v1/object/public/profile-pictures/${filename}`);
  });
}
