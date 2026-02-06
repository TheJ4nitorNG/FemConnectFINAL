import type { Express, Request, Response, NextFunction } from "express";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { ObjectAclPolicy } from "./objectAcl";

function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) return next();
  res.sendStatus(401);
}

export function registerObjectStorageRoutes(app: Express): void {
  const objectStorageService = new ObjectStorageService();

  app.post("/api/uploads/request-url", isAuthenticated, async (req, res) => {
    try {
      const { name, size, contentType } = req.body;

      if (!name) {
        return res.status(400).json({
          error: "Missing required field: name",
        });
      }

      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      const objectPath = objectStorageService.normalizeObjectEntityPath(uploadURL);

      res.json({
        uploadURL,
        objectPath,
        metadata: { name, size, contentType },
      });
    } catch (error) {
      console.error("Error generating upload URL:", error);
      res.status(500).json({ error: "Failed to generate upload URL" });
    }
  });

  app.get("/objects/:objectPath(*)", async (req, res) => {
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      // For profile pictures, we make them public
      await objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error serving object:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.status(404).json({ error: "Object not found" });
      }
      return res.status(500).json({ error: "Failed to serve object" });
    }
  });
}

