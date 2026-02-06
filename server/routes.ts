import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth, hashPassword, sendProfilePictureReminderEmail, sendMessageNotificationEmail, sendReportNotificationEmail } from "./auth";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { insertUserSchema, users, statusUpdates } from "@shared/schema";
import { eq, sql } from "drizzle-orm";
import { db } from "./db";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";

async function seed() {
  // Skip seeding in production - test data should not be created in production
  if (process.env.NODE_ENV === "production") {
    return;
  }
  
  try {
    const existing = await storage.getUserByUsername("femboy_cutie");
    if (!existing) {
      const password = await hashPassword("password123");
      await storage.createUser({
        username: "femboy_cutie",
        email: "cutie@example.com",
        password,
        role: "Femboy",
        location: "North America",
        bio: "Just a cute femboy looking for friends :3",
        age: 19,
        connectionGoal: "Looking for friends",
        hasAgreedToRules: true,
        region: "NA",
      } as any);
      
      await storage.createUser({
        username: "daddy_cool",
        email: "daddy@example.com",
        password: await hashPassword("password123"),
        role: "Male",
        location: "Europe",
        bio: "Respectful top looking for a cute femboy.",
        age: 28,
        connectionGoal: "Looking for a relationship",
        hasAgreedToRules: true,
        region: "EU",
      } as any);

      await storage.createUser({
        username: "princess_uwu",
        email: "princess@example.com",
        password: await hashPassword("password123"),
        role: "Femboy",
        location: "Asia",
        bio: "UwU soft boi here.",
        age: 21,
        connectionGoal: "Looking for casual dating",
        hasAgreedToRules: true,
        region: "AS",
      } as any);
    }
  } catch (err) {
    console.warn("Seed skipped (likely already seeded):", (err as Error).message);
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express,
): Promise<Server> {
  setupAuth(app);
  registerObjectStorageRoutes(app);
  await seed();

  app.get(api.users.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    // Simple filter handling
    const role = req.query.role as string | undefined;
    const location = req.query.location as string | undefined;
    
    const users = await storage.getUsers(role, location);
    res.json(users);
  });

  app.get(api.users.get.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const user = await storage.getUser(Number(req.params.id));
    if (!user) return res.sendStatus(404);
    res.json(user);
  });

  app.patch("/api/user", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const { bio, profilePicture, bannerPicture, username } = req.body;
    const userId = (req.user as any).id;
    
    const updates: Record<string, any> = {};
    if (bio !== undefined) updates.bio = bio;
    if (profilePicture !== undefined) updates.profilePicture = profilePicture;
    if (bannerPicture !== undefined) updates.bannerPicture = bannerPicture;
    
    if (username !== undefined) {
      const trimmedUsername = username.trim().toLowerCase();
      if (trimmedUsername.length < 3) {
        return res.status(400).json({ error: "Username must be at least 3 characters" });
      }
      if (trimmedUsername.length > 30) {
        return res.status(400).json({ error: "Username must be at most 30 characters" });
      }
      if (!/^[a-z0-9_]+$/.test(trimmedUsername)) {
        return res.status(400).json({ error: "Username can only contain letters, numbers, and underscores" });
      }
      const isAvailable = await storage.checkUsernameAvailability(trimmedUsername, userId);
      if (!isAvailable) {
        return res.status(400).json({ error: "Username is already taken" });
      }
      updates.username = trimmedUsername;
    }
    
    const updatedUser = await storage.updateUser(userId, updates);
    
    req.login(updatedUser, (err) => {
      if (err) {
        console.error("Session refresh error:", err);
      }
      res.json(updatedUser);
    });
  });

  app.get("/api/messages/conversations", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const userId = (req.user as any).id;
    const conversations = await storage.getConversations(userId);
    
    const conversationsWithUsers = await Promise.all(
      conversations.map(async (conv) => {
        const partner = await storage.getUser(conv.partnerId);
        return { ...conv, partner };
      })
    );
    
    res.json(conversationsWithUsers);
  });

  app.get("/api/messages/unread/count", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const userId = (req.user as any).id;
    const count = await storage.getUnreadCount(userId);
    res.json({ count });
  });

  app.get("/api/messages/:partnerId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const userId = (req.user as any).id;
    const partnerId = Number(req.params.partnerId);
    
    if (isNaN(partnerId)) {
      return res.status(400).json({ error: "Invalid partner ID" });
    }
    
    const partner = await storage.getUser(partnerId);
    if (!partner) {
      return res.status(404).json({ error: "User not found" });
    }
    
    await storage.markMessagesAsRead(userId, partnerId);
    const messages = await storage.getConversation(userId, partnerId);
    res.json(messages);
  });

  app.post("/api/messages", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const userId = (req.user as any).id;
    const sender = req.user as any;
    const { receiverId, content } = req.body;
    
    const parsedReceiverId = Number(receiverId);
    if (!receiverId || isNaN(parsedReceiverId) || parsedReceiverId <= 0) {
      return res.status(400).json({ error: "Valid receiverId is required" });
    }
    
    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return res.status(400).json({ error: "Message content is required" });
    }
    
    if (content.length > 2000) {
      return res.status(400).json({ error: "Message too long (max 2000 characters)" });
    }
    
    if (parsedReceiverId === userId) {
      return res.status(400).json({ error: "Cannot send message to yourself" });
    }
    
    const receiver = await storage.getUser(parsedReceiverId);
    if (!receiver) {
      return res.status(404).json({ error: "Recipient not found" });
    }
    
    const message = await storage.createMessage({
      senderId: userId,
      receiverId: parsedReceiverId,
      content: content.trim(),
    });
    
    if (receiver.emailOnMessage) {
      sendMessageNotificationEmail(
        { username: receiver.username, email: receiver.email },
        { username: sender.username }
      ).catch(err => console.error("Failed to send message notification:", err));
    }
    
    res.json(message);
  });

  app.get("/api/users/:userId/pictures", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const userId = Number(req.params.userId);
    if (isNaN(userId)) return res.status(400).json({ error: "Invalid user ID" });
    
    const pictures = await storage.getProfilePictures(userId);
    res.json(pictures);
  });

  app.post("/api/profile-pictures", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const userId = (req.user as any).id;
    const { objectPath } = req.body;
    
    if (!objectPath || typeof objectPath !== "string") {
      return res.status(400).json({ error: "objectPath is required" });
    }
    
    const count = await storage.getProfilePictureCount(userId);
    if (count >= 6) {
      return res.status(400).json({ error: "Maximum 6 profile pictures allowed" });
    }
    
    const picture = await storage.addProfilePicture({
      userId,
      objectPath,
      displayOrder: count,
    });
    
    res.json(picture);
  });

  app.delete("/api/profile-pictures/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const userId = (req.user as any).id;
    const pictureId = Number(req.params.id);
    
    if (isNaN(pictureId)) {
      return res.status(400).json({ error: "Invalid picture ID" });
    }
    
    const deleted = await storage.deleteProfilePicture(pictureId, userId);
    if (!deleted) {
      return res.status(404).json({ error: "Picture not found" });
    }
    
    res.json({ success: true });
  });

  app.get("/api/admin/users", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const currentUser = req.user as any;
    if (!currentUser.isAdmin) return res.status(403).json({ error: "Admin access required" });
    
    const users = await storage.getAllUsersForAdmin();
    res.json(users);
  });

  app.post("/api/admin/users/:id/shadow-ban", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const currentUser = req.user as any;
    if (!currentUser.isAdmin) return res.status(403).json({ error: "Admin access required" });
    
    const targetId = Number(req.params.id);
    if (isNaN(targetId)) return res.status(400).json({ error: "Invalid user ID" });
    
    if (targetId === currentUser.id) {
      return res.status(400).json({ error: "Cannot shadow ban yourself" });
    }
    
    const { banned } = req.body;
    const user = await storage.shadowBanUser(targetId, banned === true);
    if (!user) return res.status(404).json({ error: "User not found" });
    
    res.json(user);
  });

  app.delete("/api/admin/users/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const currentUser = req.user as any;
    if (!currentUser.isAdmin) return res.status(403).json({ error: "Admin access required" });
    
    const targetId = Number(req.params.id);
    if (isNaN(targetId)) return res.status(400).json({ error: "Invalid user ID" });
    
    const deleted = await storage.deleteUser(targetId);
    if (!deleted) return res.status(404).json({ error: "User not found" });
    
    if (targetId === currentUser.id) {
      req.logout((err) => {
        if (err) console.error("Logout error:", err);
        res.json({ success: true, selfDeleted: true });
      });
      return;
    }
    
    res.json({ success: true });
  });

  app.post("/api/admin/users/:id/set-admin", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const currentUser = req.user as any;
    if (!currentUser.isAdmin) return res.status(403).json({ error: "Admin access required" });
    
    const targetId = Number(req.params.id);
    if (isNaN(targetId)) return res.status(400).json({ error: "Invalid user ID" });
    
    if (targetId === currentUser.id) {
      return res.status(400).json({ error: "Cannot modify your own admin status" });
    }
    
    const { isAdmin } = req.body;
    const user = await storage.setUserAdmin(targetId, isAdmin === true);
    if (!user) return res.status(404).json({ error: "User not found" });
    
    res.json(user);
  });

  app.post("/api/admin/send-profile-pic-reminders", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const currentUser = req.user as any;
    if (!currentUser.isAdmin) return res.status(403).json({ error: "Admin access required" });
    
    const cutoffDate = new Date("2026-01-08T00:00:00Z");
    
    const allUsers = await storage.getAllUsersForAdmin();
    const usersWithoutPics = allUsers.filter(u => 
      !u.profilePicture && 
      u.createdAt && 
      new Date(u.createdAt) < cutoffDate
    );
    
    let sent = 0;
    let failed = 0;
    
    for (const user of usersWithoutPics) {
      const success = await sendProfilePictureReminderEmail({ 
        username: user.username, 
        email: user.email 
      });
      if (success) sent++;
      else failed++;
    }
    
    res.json({ 
      message: `Sent ${sent} reminder emails (${failed} failed)`,
      sent,
      failed,
      total: usersWithoutPics.length
    });
  });

  // User Search
  app.get("/api/users/search", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const currentUser = req.user as any;
    const query = req.query.q as string;
    
    if (!query || query.trim().length < 2) {
      return res.status(400).json({ error: "Search query must be at least 2 characters" });
    }
    
    const includeAll = currentUser.isAdmin;
    const users = await storage.searchUsers(query.trim(), includeAll);
    res.json(users);
  });

  // Self-delete account
  app.delete("/api/account", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const userId = (req.user as any).id;
    
    const deleted = await storage.deleteUser(userId);
    if (!deleted) {
      return res.status(500).json({ error: "Failed to delete account" });
    }
    
    req.logout((err) => {
      if (err) console.error("Logout error after self-delete:", err);
      res.json({ success: true, message: "Your account has been deleted" });
    });
  });

  // Compatibility calculation
  app.get("/api/users/:id/compatibility", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const currentUser = req.user as any;
    const targetId = Number(req.params.id);
    
    if (isNaN(targetId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }
    
    if (targetId === currentUser.id) {
      return res.json({ compatibility: 100, matches: [], total: 0 });
    }
    
    const targetUser = await storage.getUser(targetId);
    if (!targetUser) {
      return res.status(404).json({ error: "User not found" });
    }
    
    const matchFields = [
      { field: "seekingType", label: "Seeking", weight: 2 },
      { field: "relationshipType", label: "Relationship Type", weight: 2 },
      { field: "meetingPreference", label: "Meeting Preference", weight: 1.5 },
      { field: "gamingPlatform", label: "Gaming Platform", weight: 1 },
      { field: "inputPreference", label: "Input Preference", weight: 0.5 },
      { field: "catOrDog", label: "Cat or Dog", weight: 0.5 },
      { field: "drinking", label: "Drinking", weight: 1 },
      { field: "smoking", label: "Smoking", weight: 1 },
      { field: "cokeOrPepsi", label: "Coke or Pepsi", weight: 0.25 },
    ];
    
    const matches: { field: string; label: string; match: boolean }[] = [];
    let totalWeight = 0;
    let matchedWeight = 0;
    
    for (const { field, label, weight } of matchFields) {
      const currentValue = (currentUser as any)[field];
      const targetValue = (targetUser as any)[field];
      
      if (currentValue && targetValue) {
        totalWeight += weight;
        const isMatch = currentValue === targetValue;
        if (isMatch) {
          matchedWeight += weight;
        }
        matches.push({ field, label, match: isMatch });
      }
    }
    
    const compatibility = totalWeight > 0 
      ? Math.round((matchedWeight / totalWeight) * 100) 
      : 0;
    
    res.json({ 
      compatibility, 
      matches, 
      total: matches.length,
      answeredQuestions: totalWeight > 0
    });
  });

  // Reports
  app.post("/api/reports", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const userId = (req.user as any).id;
    const reporter = req.user as any;
    const { reportedUserId, reportedMessageId, reason, details } = req.body;
    
    if (!reason || typeof reason !== "string") {
      return res.status(400).json({ error: "Reason is required" });
    }
    
    if (!reportedUserId && !reportedMessageId) {
      return res.status(400).json({ error: "Must specify either a user or message to report" });
    }
    
    const report = await storage.createReport({
      reporterId: userId,
      reportedUserId: reportedUserId ? Number(reportedUserId) : null,
      reportedMessageId: reportedMessageId ? Number(reportedMessageId) : null,
      reason,
      details: details || null,
    });
    
    const allUsers = await storage.getAllUsersForAdmin();
    const adminEmails = allUsers.filter(u => u.isAdmin).map(u => u.email);
    const reportedUser = reportedUserId ? await storage.getUser(Number(reportedUserId)) : null;
    
    if (adminEmails.length > 0) {
      sendReportNotificationEmail(
        adminEmails,
        reporter.username,
        reportedUser?.username || "Unknown",
        reason
      ).catch(err => console.error("Failed to send report notification:", err));
    }
    
    res.json(report);
  });

  app.get("/api/admin/reports", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const currentUser = req.user as any;
    if (!currentUser.isAdmin) return res.status(403).json({ error: "Admin access required" });
    
    const status = req.query.status as string | undefined;
    const reports = await storage.getReports(status);
    
    const reportsWithDetails = await Promise.all(
      reports.map(async (report) => {
        const reporter = await storage.getUser(report.reporterId);
        const reportedUser = report.reportedUserId ? await storage.getUser(report.reportedUserId) : null;
        return { ...report, reporter, reportedUser };
      })
    );
    
    res.json(reportsWithDetails);
  });

  app.get("/api/admin/reports/count", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const currentUser = req.user as any;
    if (!currentUser.isAdmin) return res.status(403).json({ error: "Admin access required" });
    
    const count = await storage.getPendingReportsCount();
    res.json({ count });
  });

  app.patch("/api/admin/reports/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const currentUser = req.user as any;
    if (!currentUser.isAdmin) return res.status(403).json({ error: "Admin access required" });
    
    const reportId = Number(req.params.id);
    if (isNaN(reportId)) return res.status(400).json({ error: "Invalid report ID" });
    
    const { status, adminNotes } = req.body;
    const updates: any = {};
    
    if (status) {
      updates.status = status;
      if (status !== "pending") {
        updates.resolvedAt = new Date();
        updates.resolvedBy = currentUser.id;
      }
    }
    if (adminNotes !== undefined) updates.adminNotes = adminNotes;
    
    const report = await storage.updateReport(reportId, updates);
    if (!report) return res.status(404).json({ error: "Report not found" });
    
    res.json(report);
  });

  // Status Updates
  app.post("/api/status", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const userId = (req.user as any).id;
    const { content } = req.body;
    
    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return res.status(400).json({ error: "Status content is required" });
    }
    
    if (content.length > 280) {
      return res.status(400).json({ error: "Status too long (max 280 characters)" });
    }
    
    const expiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000);
    
    const status = await storage.createStatusUpdate({
      userId,
      content: content.trim(),
      expiresAt,
    });
    
    res.json(status);
  });

  app.get("/api/status", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    await storage.deleteExpiredStatusUpdates();
    const statuses = await storage.getActiveStatusUpdates();
    
    const statusesWithUsers = await Promise.all(
      statuses.map(async (status) => {
        const user = await storage.getUser(status.userId);
        return { ...status, user };
      })
    );
    
    res.json(statusesWithUsers);
  });

  app.get("/api/status/mine", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const userId = (req.user as any).id;
    
    const status = await storage.getUserStatusUpdate(userId);
    res.json(status || null);
  });

  app.post("/api/status", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const userId = (req.user as any).id;
    const { content } = req.body;
    
    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return res.status(400).json({ error: "Status content is required" });
    }
    
    if (content.length > 280) {
      return res.status(400).json({ error: "Status must be 280 characters or less" });
    }
    
    // Delete any existing status for this user
    await db.delete(statusUpdates).where(eq(statusUpdates.userId, userId));
    
    // Create new status that expires in 12 hours
    const expiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000);
    const status = await storage.createStatusUpdate({
      userId,
      content: content.trim(),
      expiresAt,
    });
    
    res.json(status);
  });

  app.delete("/api/status", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const userId = (req.user as any).id;
    
    await db.delete(statusUpdates).where(eq(statusUpdates.userId, userId));
    res.json({ success: true });
  });

  return httpServer;
}
