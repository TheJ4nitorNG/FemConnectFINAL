import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { scrypt, randomBytes, timingSafeEqual, createHash } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { pool } from "./db";
import { User } from "@shared/schema";
import { api } from "@shared/routes";
import { z } from "zod";
import { Resend } from "resend";

const scryptAsync = promisify(scrypt);

// Resend integration via Replit connector
let connectionSettings: any;

async function getResendCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken || !hostname) {
    return null;
  }

  try {
    connectionSettings = await fetch(
      'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=resend',
      {
        headers: {
          'Accept': 'application/json',
          'X_REPLIT_TOKEN': xReplitToken
        }
      }
    ).then(res => res.json()).then(data => data.items?.[0]);

    if (!connectionSettings || !connectionSettings.settings?.api_key) {
      return null;
    }
    return { 
      apiKey: connectionSettings.settings.api_key, 
      fromEmail: connectionSettings.settings.from_email || 'FemConnect <onboarding@resend.dev>'
    };
  } catch (err) {
    console.error("Failed to get Resend credentials:", err);
    return null;
  }
}

async function getResendClient() {
  const credentials = await getResendCredentials();
  if (!credentials) {
    return null;
  }
  return {
    client: new Resend(credentials.apiKey),
    fromEmail: credentials.fromEmail
  };
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const PgStore = connectPgSimple(session);
  
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "r8q,+&1LM3)CD*zAGpx1xm{NeQhc;#",
    resave: false,
    saveUninitialized: false,
    store: new PgStore({
      pool,
      tableName: "session",
      createTableIfMissing: true,
    }),
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    },
  };

  if (app.get("env") === "production") {
    app.set("trust proxy", 1);
  }

  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username.toLowerCase());
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false);
        } else {
          return done(null, user);
        }
      } catch (err) {
        return done(err);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, (user as User).id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  app.post(api.auth.register.path, async (req, res, next) => {
    try {
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).send("Username already exists");
      }

      const hashedPassword = await hashPassword(req.body.password);
      const user = await storage.createUser({
        ...req.body,
        password: hashedPassword,
      });

      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json(user);
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json(err.issues);
      } else {
        next(err);
      }
    }
  });

  app.post(api.auth.login.path, passport.authenticate("local"), (req, res) => {
    res.status(200).json(req.user);
  });

  app.post(api.auth.logout.path, (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get(api.auth.me.path, (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });

  app.post("/api/auth/password-reset/request", async (req, res) => {
    const { email } = req.body;
    if (!email || typeof email !== "string") {
      return res.status(400).json({ error: "Email is required" });
    }

    res.json({ message: "If an account exists with this email, a reset link has been sent." });

    try {
      const user = await storage.getUserByEmail(email.toLowerCase().trim());
      if (!user) return;

      const token = randomBytes(32).toString("hex");
      const hashedToken = hashToken(token);
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

      await storage.createPasswordResetToken(user.id, hashedToken, expiresAt);

      const domain = process.env.REPLIT_DOMAINS?.split(",")[0] || process.env.REPLIT_DEV_DOMAIN;
      const resetUrl = `${domain ? `https://${domain}` : "http://localhost:5000"}/reset-password?token=${token}`;

      const resendClient = await getResendClient();
      if (resendClient) {
        await resendClient.client.emails.send({
          from: resendClient.fromEmail,
          to: user.email,
          subject: "Reset your FemConnect password",
          html: `
            <h2>Password Reset Request</h2>
            <p>Hi ${user.username},</p>
            <p>You requested to reset your password. Click the link below to set a new password:</p>
            <p><a href="${resetUrl}">Reset Password</a></p>
            <p>This link will expire in 30 minutes.</p>
            <p>If you didn't request this, you can safely ignore this email.</p>
            <p>- The FemConnect Team</p>
          `,
        });
      } else {
        console.warn("Password reset email not sent - Resend not configured.");
      }
    } catch (err) {
      console.error("Password reset background task error:", err);
    }
  });

  app.post("/api/auth/password-reset/confirm", async (req, res) => {
    try {
      const { token, password } = req.body;
      
      if (!token || typeof token !== "string") {
        return res.status(400).json({ error: "Token is required" });
      }
      
      if (!password || typeof password !== "string" || password.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters" });
      }

      const hashedToken = hashToken(token);
      const resetToken = await storage.getValidPasswordResetToken(hashedToken);
      
      if (!resetToken) {
        return res.status(400).json({ error: "Invalid or expired reset link" });
      }

      const hashedPassword = await hashPassword(password);
      await storage.updatePassword(resetToken.userId, hashedPassword);
      await storage.markTokenAsUsed(resetToken.id);

      res.json({ message: "Password reset successfully. You can now log in with your new password." });
    } catch (err) {
      console.error("Password reset confirm error:", err);
      res.status(500).json({ error: "Failed to reset password" });
    }
  });
}

export async function sendProfilePictureReminderEmail(user: { username: string; email: string }): Promise<boolean> {
  const resendClient = await getResendClient();
  if (!resendClient) {
    console.warn("Email not sent - Resend not configured");
    return false;
  }

  const domain = process.env.REPLIT_DOMAINS?.split(",")[0] || process.env.REPLIT_DEV_DOMAIN;
  const profileUrl = `${domain ? `https://${domain}` : "http://localhost:5000"}/auth`;

  try {
    await resendClient.client.emails.send({
      from: resendClient.fromEmail,
      to: user.email,
      subject: "Add a profile picture to your FemConnect account",
      html: `
        <h2>Hi ${user.username}!</h2>
        <p>We noticed you haven't added a profile picture to your FemConnect account yet.</p>
        <p>Adding a profile picture helps verify you're a real person and makes our community safer for everyone. It also helps others get to know you better!</p>
        <p><a href="${profileUrl}" style="display: inline-block; padding: 12px 24px; background: linear-gradient(to right, #ec4899, #9333ea); color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">Add Your Photo Now</a></p>
        <p>Thank you for being part of our community!</p>
        <p>- The FemConnect Team</p>
      `,
    });
    return true;
  } catch (err) {
    console.error("Failed to send profile picture reminder email:", err);
    return false;
  }
}

export async function sendMessageNotificationEmail(
  recipient: { username: string; email: string },
  sender: { username: string }
): Promise<boolean> {
  const resendClient = await getResendClient();
  if (!resendClient) {
    console.warn("Message notification email not sent - Resend not configured");
    return false;
  }

  const domain = process.env.REPLIT_DOMAINS?.split(",")[0] || process.env.REPLIT_DEV_DOMAIN;
  const messagesUrl = `${domain ? `https://${domain}` : "http://localhost:5000"}/messages`;

  try {
    await resendClient.client.emails.send({
      from: resendClient.fromEmail,
      to: recipient.email,
      subject: `New message from ${sender.username} on FemConnect`,
      html: `
        <h2>Hi ${recipient.username}!</h2>
        <p>You have a new message from <strong>${sender.username}</strong> on FemConnect!</p>
        <p><a href="${messagesUrl}" style="display: inline-block; padding: 12px 24px; background: linear-gradient(to right, #ec4899, #9333ea); color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">Read Message</a></p>
        <p>- The FemConnect Team</p>
        <p style="font-size: 12px; color: #666;">You can manage email notifications in your profile settings.</p>
      `,
    });
    console.log(`Message notification email sent to ${recipient.email}`);
    return true;
  } catch (err) {
    console.error("Failed to send message notification email:", err);
    return false;
  }
}

export async function sendReportNotificationEmail(
  adminEmails: string[],
  reporterUsername: string,
  reportedUsername: string,
  reason: string
): Promise<boolean> {
  if (adminEmails.length === 0) {
    return false;
  }

  const resendClient = await getResendClient();
  if (!resendClient) {
    console.warn("Report notification email not sent - Resend not configured");
    return false;
  }

  const domain = process.env.REPLIT_DOMAINS?.split(",")[0] || process.env.REPLIT_DEV_DOMAIN;
  const adminUrl = `${domain ? `https://${domain}` : "http://localhost:5000"}/admin`;

  try {
    await resendClient.client.emails.send({
      from: resendClient.fromEmail,
      to: adminEmails,
      subject: `[FemConnect Admin] New Report: ${reason}`,
      html: `
        <h2>New Report Submitted</h2>
        <p><strong>Reporter:</strong> ${reporterUsername}</p>
        <p><strong>Reported User:</strong> ${reportedUsername}</p>
        <p><strong>Reason:</strong> ${reason}</p>
        <p><a href="${adminUrl}" style="display: inline-block; padding: 12px 24px; background: #dc2626; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">View in Admin Panel</a></p>
      `,
    });
    return true;
  } catch (err) {
    console.error("Failed to send report notification email:", err);
    return false;
  }
}
