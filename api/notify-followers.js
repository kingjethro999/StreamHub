import nodemailer from "nodemailer";
import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const { channelId, streamTitle, streamUrl } = req.body;

    if (!channelId || !streamTitle) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    try {
        const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
        // We strictly need the Service Role Key to bypass RLS and read auth.users emails
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Get the channel details to know who went live
        const { data: channelData } = await supabase
            .from("channels")
            .select("name")
            .eq("id", channelId)
            .single();

        const channelName = channelData?.name || "A channel";

        // Find all users following this channel
        const { data: followers, error: followError } = await supabase
            .from("follows")
            .select("user_id")
            .eq("channel_id", channelId);

        if (followError || !followers || followers.length === 0) {
            return res.status(200).json({ message: "No followers found to notify" });
        }

        const followerUserIds = followers.map((f) => f.user_id);
        const emails = [];

        // Fetch their emails from auth.users (Requires Service Role Key)
        for (const userId of followerUserIds) {
            const { data: { user }, error } = await supabase.auth.admin.getUserById(userId);
            if (user && user.email) {
                emails.push(user.email);
            }
        }

        if (emails.length === 0) {
            return res.status(200).json({ message: "No valid email addresses found for followers" });
        }

        // Configure Nodemailer transporter using provided Gmail credentials
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.GMAIL_SMTP_USER,
                pass: process.env.GMAIL_APP_PASSWORD,
            },
        });

        const mailOptions = {
            from: `"StreamHub Alerts" <${process.env.GMAIL_SMTP_USER}>`,
            bcc: emails, // Use BCC so followers can't see each other's emails
            subject: `${channelName} just went live! 🔴`,
            html: `
        <div style="font-family: sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; background-color: #0a0a0a; border-radius: 12px; border: 1px solid #333; color: #fff;">
            <h2 style="color: #8b5cf6; margin-bottom: 20px;">${channelName} is live on StreamHub!</h2>
            <p style="font-size: 16px; color: #ccc;">They just started streaming:</p>
            <p style="font-size: 18px; font-weight: bold; margin-bottom: 30px; color: #fff;">"${streamTitle}"</p>
            <a href="${streamUrl}" style="display: inline-block; padding: 12px 24px; background-color: #8b5cf6; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">Watch Stream Now</a>
            <p style="margin-top: 40px; font-size: 12px; color: #666;">You received this email because you are following ${channelName} on StreamHub. You can disable these in your Settings.</p>
        </div>
      `,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log("Email sent successfully: ", info.messageId);

        return res.status(200).json({ success: true, message: `Dispatched ${emails.length} notifications` });
    } catch (error) {
        console.error("Error setting up mailer or Supabase:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}
