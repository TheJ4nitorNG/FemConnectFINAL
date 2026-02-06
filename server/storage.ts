import { db } from "./db";
import { users, messages, passwordResetTokens, profilePictures, reports, statusUpdates, type User, type InsertUser, type Message, type InsertMessage, type PasswordResetToken, type ProfilePicture, type InsertProfilePicture, type Report, type InsertReport, type StatusUpdate, type InsertStatusUpdate } from "@shared/schema";
import { eq, and, or, desc, lt, isNull, asc, ilike, gt } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  checkUsernameAvailability(username: string, excludeUserId?: number): Promise<boolean>;
  createUser(user: InsertUser): Promise<User>;
  getUsers(role?: string, region?: string): Promise<User[]>;
  updateUser(id: number, updates: Partial<User>): Promise<User>;
  updatePassword(userId: number, hashedPassword: string): Promise<void>;
  
  createMessage(message: InsertMessage): Promise<Message>;
  getConversation(userId1: number, userId2: number): Promise<Message[]>;
  getConversations(userId: number): Promise<{ partnerId: number; lastMessage: Message }[]>;
  markMessagesAsRead(receiverId: number, senderId: number): Promise<void>;
  getUnreadCount(userId: number): Promise<number>;
  
  createPasswordResetToken(userId: number, hashedToken: string, expiresAt: Date): Promise<PasswordResetToken>;
  getValidPasswordResetToken(hashedToken: string): Promise<PasswordResetToken | undefined>;
  markTokenAsUsed(tokenId: number): Promise<void>;
  
  getProfilePictures(userId: number): Promise<ProfilePicture[]>;
  addProfilePicture(data: InsertProfilePicture): Promise<ProfilePicture>;
  deleteProfilePicture(id: number, userId: number): Promise<boolean>;
  getProfilePictureCount(userId: number): Promise<number>;
  
  getAllUsersForAdmin(): Promise<User[]>;
  shadowBanUser(userId: number, banned: boolean): Promise<User | undefined>;
  deleteUser(userId: number): Promise<boolean>;
  setUserAdmin(userId: number, isAdmin: boolean): Promise<User | undefined>;
  
  // Search
  searchUsers(query: string, includeAll?: boolean): Promise<User[]>;
  
  // Reports
  createReport(report: InsertReport): Promise<Report>;
  getReports(status?: string): Promise<Report[]>;
  getReportById(id: number): Promise<Report | undefined>;
  updateReport(id: number, updates: Partial<Report>): Promise<Report | undefined>;
  getPendingReportsCount(): Promise<number>;
  
  // Status Updates
  createStatusUpdate(data: InsertStatusUpdate): Promise<StatusUpdate>;
  getActiveStatusUpdates(): Promise<StatusUpdate[]>;
  getUserStatusUpdate(userId: number): Promise<StatusUpdate | undefined>;
  deleteExpiredStatusUpdates(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async checkUsernameAvailability(username: string, excludeUserId?: number): Promise<boolean> {
    const existingUser = await this.getUserByUsername(username);
    if (!existingUser) return true;
    if (excludeUserId && existingUser.id === excludeUserId) return true;
    return false;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const email = insertUser.email || `${insertUser.username}@example.com`;
    const [user] = await db.insert(users).values({ ...insertUser, email }).returning();
    return user;
  }

  async getUsers(role?: string, location?: string): Promise<User[]> {
    let conditions = [eq(users.isShadowBanned, false)];
    
    if (role) {
      conditions.push(eq(users.role, role));
    }
    
    if (location) {
      conditions.push(eq(users.location, location));
    }

    return await db.select().from(users).where(and(...conditions));
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User> {
    const [user] = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return user;
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db.insert(messages).values(message).returning();
    return newMessage;
  }

  async getConversation(userId1: number, userId2: number): Promise<Message[]> {
    return await db.select().from(messages).where(
      or(
        and(eq(messages.senderId, userId1), eq(messages.receiverId, userId2)),
        and(eq(messages.senderId, userId2), eq(messages.receiverId, userId1))
      )
    ).orderBy(messages.createdAt);
  }

  async getConversations(userId: number): Promise<{ partnerId: number; lastMessage: Message }[]> {
    const allMessages = await db.select().from(messages).where(
      or(eq(messages.senderId, userId), eq(messages.receiverId, userId))
    ).orderBy(desc(messages.createdAt));

    const conversationMap = new Map<number, Message>();
    for (const msg of allMessages) {
      const partnerId = msg.senderId === userId ? msg.receiverId : msg.senderId;
      if (!conversationMap.has(partnerId)) {
        conversationMap.set(partnerId, msg);
      }
    }

    return Array.from(conversationMap.entries()).map(([partnerId, lastMessage]) => ({
      partnerId,
      lastMessage,
    }));
  }

  async markMessagesAsRead(receiverId: number, senderId: number): Promise<void> {
    await db.update(messages)
      .set({ isRead: true })
      .where(and(eq(messages.receiverId, receiverId), eq(messages.senderId, senderId)));
  }

  async getUnreadCount(userId: number): Promise<number> {
    const unread = await db.select().from(messages).where(
      and(eq(messages.receiverId, userId), eq(messages.isRead, false))
    );
    return unread.length;
  }

  async updatePassword(userId: number, hashedPassword: string): Promise<void> {
    await db.update(users).set({ password: hashedPassword }).where(eq(users.id, userId));
  }

  async createPasswordResetToken(userId: number, hashedToken: string, expiresAt: Date): Promise<PasswordResetToken> {
    const [token] = await db.insert(passwordResetTokens).values({
      userId,
      hashedToken,
      expiresAt,
    }).returning();
    return token;
  }

  async getValidPasswordResetToken(hashedToken: string): Promise<PasswordResetToken | undefined> {
    const [token] = await db.select().from(passwordResetTokens).where(
      and(
        eq(passwordResetTokens.hashedToken, hashedToken),
        isNull(passwordResetTokens.usedAt)
      )
    );
    if (token && new Date(token.expiresAt) > new Date()) {
      return token;
    }
    return undefined;
  }

  async markTokenAsUsed(tokenId: number): Promise<void> {
    await db.update(passwordResetTokens).set({ usedAt: new Date() }).where(eq(passwordResetTokens.id, tokenId));
  }

  async getProfilePictures(userId: number): Promise<ProfilePicture[]> {
    return await db.select().from(profilePictures)
      .where(eq(profilePictures.userId, userId))
      .orderBy(asc(profilePictures.displayOrder));
  }

  async addProfilePicture(data: InsertProfilePicture): Promise<ProfilePicture> {
    const [picture] = await db.insert(profilePictures).values(data).returning();
    return picture;
  }

  async deleteProfilePicture(id: number, userId: number): Promise<boolean> {
    const result = await db.delete(profilePictures)
      .where(and(eq(profilePictures.id, id), eq(profilePictures.userId, userId)))
      .returning();
    return result.length > 0;
  }

  async getProfilePictureCount(userId: number): Promise<number> {
    const pictures = await db.select().from(profilePictures).where(eq(profilePictures.userId, userId));
    return pictures.length;
  }

  async getAllUsersForAdmin(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async shadowBanUser(userId: number, banned: boolean): Promise<User | undefined> {
    const [user] = await db.update(users)
      .set({ isShadowBanned: banned })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async deleteUser(userId: number): Promise<boolean> {
    await db.delete(profilePictures).where(eq(profilePictures.userId, userId));
    await db.delete(messages).where(or(eq(messages.senderId, userId), eq(messages.receiverId, userId)));
    await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, userId));
    const result = await db.delete(users).where(eq(users.id, userId)).returning();
    return result.length > 0;
  }

  async setUserAdmin(userId: number, isAdmin: boolean): Promise<User | undefined> {
    const [user] = await db.update(users)
      .set({ isAdmin })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async searchUsers(query: string, includeAll = false): Promise<User[]> {
    const searchPattern = `%${query}%`;
    const conditions = [
      or(
        ilike(users.username, searchPattern),
        ilike(users.bio, searchPattern),
        ilike(users.location, searchPattern)
      )
    ];
    
    if (!includeAll) {
      conditions.push(eq(users.isShadowBanned, false));
    }
    
    return await db.select().from(users).where(and(...conditions.filter(Boolean)));
  }

  async createReport(report: InsertReport): Promise<Report> {
    const [newReport] = await db.insert(reports).values(report).returning();
    return newReport;
  }

  async getReports(status?: string): Promise<Report[]> {
    if (status) {
      return await db.select().from(reports).where(eq(reports.status, status)).orderBy(desc(reports.createdAt));
    }
    return await db.select().from(reports).orderBy(desc(reports.createdAt));
  }

  async getReportById(id: number): Promise<Report | undefined> {
    const [report] = await db.select().from(reports).where(eq(reports.id, id));
    return report;
  }

  async updateReport(id: number, updates: Partial<Report>): Promise<Report | undefined> {
    const [report] = await db.update(reports).set(updates).where(eq(reports.id, id)).returning();
    return report;
  }

  async getPendingReportsCount(): Promise<number> {
    const pendingReports = await db.select().from(reports).where(eq(reports.status, "pending"));
    return pendingReports.length;
  }

  async createStatusUpdate(data: InsertStatusUpdate): Promise<StatusUpdate> {
    const [status] = await db.insert(statusUpdates).values(data).returning();
    return status;
  }

  async getActiveStatusUpdates(): Promise<StatusUpdate[]> {
    const now = new Date();
    return await db.select().from(statusUpdates).where(gt(statusUpdates.expiresAt, now)).orderBy(desc(statusUpdates.createdAt));
  }

  async getUserStatusUpdate(userId: number): Promise<StatusUpdate | undefined> {
    const now = new Date();
    const [status] = await db.select().from(statusUpdates).where(
      and(eq(statusUpdates.userId, userId), gt(statusUpdates.expiresAt, now))
    ).orderBy(desc(statusUpdates.createdAt));
    return status;
  }

  async deleteExpiredStatusUpdates(): Promise<void> {
    const now = new Date();
    await db.delete(statusUpdates).where(lt(statusUpdates.expiresAt, now));
  }
}

export const storage = new DatabaseStorage();
