import { getSettings } from "@/lib/settings";

/**
 * Sends an email through Resend when the service is enabled in the dashboard
 * settings. The API key lives in the settings row — not the environment — so
 * it can be rotated by an admin without a redeploy.
 *
 * Everything is fail-soft: a booking must never fail because an email did.
 * Errors are logged and swallowed.
 */
export async function sendEmail(input: {
  to: string;
  subject: string;
  html: string;
}): Promise<boolean> {
  try {
    const settings = await getSettings();

    if (!settings.emailServiceEnabled || !settings.resendApiKey || !settings.emailFrom) {
      return false;
    }

    const { Resend } = await import("resend");
    const resend = new Resend(settings.resendApiKey);

    const result = await resend.emails.send({
      from: settings.emailFrom,
      to: input.to,
      subject: input.subject,
      html: input.html,
    });

    return !result.error;
  } catch (error) {
    console.error("[email] send failed:", error);
    return false;
  }
}
