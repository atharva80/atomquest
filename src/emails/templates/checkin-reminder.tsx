import { Html, Head, Body, Container, Text, Heading, Hr, Button } from '@react-email/components';

interface CheckinReminderEmailProps {
  employeeName: string;
  quarter: string;
  deadline: string;
  appUrl: string;
  checkinsLink: string;
}

export function CheckinReminderEmail({ employeeName, quarter, deadline, appUrl, checkinsLink }: CheckinReminderEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={{ backgroundColor: '#f4f4f5', fontFamily: 'sans-serif' }}>
        <Container style={{ backgroundColor: '#ffffff', margin: '40px auto', padding: '32px', borderRadius: '8px', maxWidth: '520px' }}>
          <Heading style={{ color: '#09090b', fontSize: '20px', marginBottom: '8px' }}>
            Action Required: {quarter} Check-in Due
          </Heading>
          <Text style={{ color: '#71717a' }}>Hi {employeeName},</Text>
          <Text style={{ color: '#3f3f46' }}>
            This is a friendly reminder that your <strong>{quarter}</strong> check-in is due by <strong>{deadline}</strong>.
          </Text>
          <Text style={{ color: '#71717a', marginTop: '8px' }}>
            Please take a few minutes to update your progress on your goals.
          </Text>
          <Button href={checkinsLink} style={{ backgroundColor: '#09090b', color: '#ffffff', padding: '12px 20px', borderRadius: '6px', textDecoration: 'none', display: 'inline-block', marginTop: '16px' }}>
            Submit Check-in →
          </Button>
          <Hr style={{ margin: '24px 0', borderColor: '#e4e4e7' }} />
          <Text style={{ color: '#a1a1aa', fontSize: '12px' }}>Orbit by Atomberg · {appUrl}</Text>
        </Container>
      </Body>
    </Html>
  );
}