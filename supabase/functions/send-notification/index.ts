import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SmtpClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationRequest {
  userId: string;
  type: 'makeup_approved' | 'makeup_rejected' | 'announcement' | 'class_scheduled' | 'slot_approved' | 'slot_rejected';
  title: string;
  message: string;
  relatedId?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, type, title, message, relatedId }: NotificationRequest = await req.json();

    console.log(`Sending notification to user ${userId}: ${type} - ${title}`);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user profile for email/phone and preferences
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("email, phone, email_notifications, sms_notifications, display_name")
      .eq("user_id", userId)
      .single();

    if (profileError) {
      console.error("Error fetching profile:", profileError);
      throw new Error("User profile not found");
    }

    let emailSent = false;
    let smsSent = false;

    // Send email if enabled and email exists
    if (profile.email_notifications && profile.email) {
      try {
        const smtpHost = Deno.env.get("SMTP_HOST");
        const smtpPort = parseInt(Deno.env.get("SMTP_PORT") || "587");
        const smtpUser = Deno.env.get("SMTP_USER");
        const smtpPass = Deno.env.get("SMTP_PASS");
        const smtpFrom = Deno.env.get("SMTP_FROM_EMAIL");

        if (smtpHost && smtpUser && smtpPass && smtpFrom) {
          const client = new SmtpClient();

          await client.connectTLS({
            hostname: smtpHost,
            port: smtpPort,
            username: smtpUser,
            password: smtpPass,
          });

          const emailHtml = `
            <!DOCTYPE html>
            <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
                .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
                .footer { background: #1f2937; color: #9ca3af; padding: 15px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px; }
                .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; }
                .badge-info { background: #dbeafe; color: #1e40af; }
                .badge-success { background: #dcfce7; color: #166534; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1 style="margin: 0;">🎓 Chess Academy</h1>
                </div>
                <div class="content">
                  <h2 style="color: #667eea; margin-top: 0;">${title}</h2>
                  <p>Hello ${profile.display_name || 'there'},</p>
                  <p>${message}</p>
                  <p style="margin-top: 20px;">
                    <a href="${supabaseUrl.replace('.supabase.co', '.lovable.app')}/dashboard" 
                       style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                      View Dashboard
                    </a>
                  </p>
                </div>
                <div class="footer">
                  <p>Chess Academy - Learn, Play, Excel</p>
                  <p>You received this email because you have notifications enabled.</p>
                </div>
              </div>
            </body>
            </html>
          `;

          await client.send({
            from: smtpFrom,
            to: profile.email,
            subject: `Chess Academy: ${title}`,
            content: "Please view this email in an HTML-compatible email client.",
            html: emailHtml,
          });

          await client.close();
          emailSent = true;
          console.log(`Email sent successfully to ${profile.email}`);
        } else {
          console.log("SMTP not fully configured, skipping email");
        }
      } catch (emailError) {
        console.error("Error sending email:", emailError);
      }
    }

    // Store notification in database
    const { error: notifError } = await supabase
      .from("notifications")
      .insert({
        user_id: userId,
        type,
        title,
        message,
        email_sent: emailSent,
        sms_sent: smsSent,
        related_id: relatedId || null,
      });

    if (notifError) {
      console.error("Error storing notification:", notifError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        emailSent, 
        smsSent,
        message: "Notification processed" 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in send-notification function:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
