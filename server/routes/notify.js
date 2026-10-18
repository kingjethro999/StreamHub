import nodemailer from "nodemailer"
import { query, queryOne } from "../db.js"
import { badRequest, route, HttpError } from "../errors.js"
import { config } from "../env.js"

function isMailConfigured() {
  return Boolean(config.smtp.user && config.smtp.pass)
}

export default async function notifyRoutes(fastify) {
  fastify.post("/notify-followers", route(async (request, reply) => {
    const { channelId, streamTitle, streamUrl } = request.body ?? {}
    if (!channelId || !streamTitle) throw badRequest("Missing required fields")

    if (!isMailConfigured()) {
      request.log.warn("SMTP is not configured — skipping follower notification")
      return reply.send({ skipped: true, message: "Email is not configured on this server" })
    }

    const channel = await queryOne(`select name from channels where id = $1`, [channelId])
    const channelName = channel?.name || "A channel"

    const followers = await query(
      `select distinct u.email
         from follows f
         join users u on u.id = f.follower_id
        where f.channel_id = $1
          and u.email is not null`,
      [channelId],
    )

    if (followers.length === 0) {
      return reply.send({ message: "No followers found to notify" })
    }

    const emails = followers.map((f) => f.email)
    // Timeouts keep a blocked/unreachable SMTP host from hanging the request
    // indefinitely (the default is no timeout at all).
    const transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.secure,
      auth: config.smtp.user ? { user: config.smtp.user, pass: config.smtp.pass } : undefined,
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 15_000,
    })

    let info
    try {
      info = await transporter.sendMail({
        from: config.smtp.from,
        bcc: emails,
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
      })
    } catch (err) {
      request.log.error({ err }, "failed to dispatch follower notifications")
      throw new HttpError(502, "Could not send notification emails", "EMAIL_FAILED")
    }

    request.log.info({ messageId: info.messageId, recipients: emails.length }, "follower notifications sent")
    return reply.send({ success: true, message: `Dispatched ${emails.length} notifications` })
  }))
}
