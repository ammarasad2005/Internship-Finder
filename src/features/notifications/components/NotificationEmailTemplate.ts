export interface EmailMatchData {
  company_name: string;
  role_title: string;
  semantic_score: number;
  explanation: string;
  application_url: string;
}

interface Props {
  matches: EmailMatchData[];
}

export function NotificationEmailTemplate({ matches }: Props): string {
  const matchItems = matches.map((match) => `
    <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 16px; background-color: #ffffff;">
      <h3 style="margin: 0 0 8px 0; color: #111827; font-size: 18px;">
        ${match.company_name} - ${match.role_title}
      </h3>
      <div style="display: inline-block; padding: 4px 8px; background-color: #ecfdf5; color: #065f46; border-radius: 9999px; font-size: 12px; font-weight: 600; margin-bottom: 12px;">
        Match Score: ${match.semantic_score}
      </div>
      <p style="margin: 0 0 16px 0; color: #4b5563; font-size: 14px; line-height: 1.5;">
        ${match.explanation}
      </p>
      <a href="${match.application_url}" style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 8px 16px; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 500;">
        View Internship
      </a>
    </div>
  `).join('');

  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
        <title>New Internship Matches</title>
      </head>
      <body style="background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 20px; margin: 0;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #f9fafb; padding: 24px; border-radius: 12px;">
          <h2 style="color: #111827; text-align: center; margin-bottom: 24px;">
            Your latest internship matches are here!
          </h2>
          <p style="color: #4b5563; font-size: 16px; margin-bottom: 24px; text-align: center;">
            We've found <strong>${matches.length}</strong> new internships that strongly match your profile.
          </p>

          ${matchItems}

          <div style="text-align: center; margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 12px;">
              You received this email because you have notifications enabled for Internship Finder.
              You can change your preferences in your profile settings.
            </p>
          </div>
        </div>
      </body>
    </html>
  `;
}
