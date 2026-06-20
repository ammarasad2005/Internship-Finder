import React from 'react';

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

export function NotificationEmailTemplate({ matches }: Props) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta httpEquiv="Content-Type" content="text/html; charset=UTF-8" />
        <title>New Internship Matches</title>
      </head>
      <body style={{ backgroundColor: '#f3f4f6', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif", padding: '20px', margin: '0' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', backgroundColor: '#f9fafb', padding: '24px', borderRadius: '12px' }}>
          <h2 style={{ color: '#111827', textAlign: 'center', marginBottom: '24px' }}>
            Your latest internship matches are here!
          </h2>
          <p style={{ color: '#4b5563', fontSize: '16px', marginBottom: '24px', textAlign: 'center' }}>
            We've found <strong>{matches.length}</strong> new internships that strongly match your profile.
          </p>

          {matches.map((match, index) => (
            <div key={index} style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px', marginBottom: '16px', backgroundColor: '#ffffff' }}>
              <h3 style={{ margin: '0 0 8px 0', color: '#111827', fontSize: '18px' }}>
                {match.company_name} - {match.role_title}
              </h3>
              <div style={{ display: 'inline-block', padding: '4px 8px', backgroundColor: '#ecfdf5', color: '#065f46', borderRadius: '9999px', fontSize: '12px', fontWeight: 600, marginBottom: '12px' }}>
                Match Score: {match.semantic_score}
              </div>
              <p style={{ margin: '0 0 16px 0', color: '#4b5563', fontSize: '14px', lineHeight: '1.5' }}>
                {match.explanation}
              </p>
              <a href={match.application_url} style={{ display: 'inline-block', backgroundColor: '#2563eb', color: '#ffffff', padding: '8px 16px', textDecoration: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: 500 }}>
                View Internship
              </a>
            </div>
          ))}

          <div style={{ textAlign: 'center', marginTop: '32px', paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
            <p style={{ color: '#6b7280', fontSize: '12px' }}>
              You received this email because you have notifications enabled for Internship Finder.
              You can change your preferences in your profile settings.
            </p>
          </div>
        </div>
      </body>
    </html>
  );
}
