import { Html, Head, Body, Container, Text, Heading, Hr, Button } from '@react-email/components';

interface CheckinSubmittedEmailProps {
  managerName: string;
  employeeName: string;
  quarter: string;
  goalsReviewed: number;
  appUrl: string;
  reviewLink: string;
}

export function CheckinSubmittedEmail({ managerName, employeeName, quarter, goalsReviewed, appUrl, reviewLink }: CheckinSubmittedEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={{ backgroundColor: '#f4f4f5', fontFamily: 'sans-serif' }}>
        <Container style={{ backgroundColor: '#ffffff', margin: '40px auto', padding: '32px', borderRadius: '8px', maxWidth: '520px' }}>
          <Heading style={{ color: '#09090b', fontSize: '20px', marginBottom: '8px' }}>
            Check-in Submitted by {employeeName}
          </Heading>
          <Text style={{ color: '#71717a' }}>Hi {managerName},</Text>
          <Text style={{ color: '#3f3f46' }}>
            <strong>{employeeName}</strong> has submitted their <strong>{quarter}</strong> check-in for review.
          </Text>
          <Text style={{ color: '#71717a', marginTop: '8px' }}>
            They reviewed <strong>{goalsReviewed} goal{goalsReviewed !== 1 ? 's' : ''}</strong> and provided updates on their progress.
          </Text>
          <Button href={reviewLink} style={{ backgroundColor: '#09090b', color: '#ffffff', padding: '12px 20px', borderRadius: '6px', textDecoration: 'none', display: 'inline-block', marginTop: '16px' }}>
            Review Check-in →
          </Button>
          <Hr style={{ margin: '24px 0', borderColor: '#e4e4e7' }} />
          <Text style={{ color: '#a1a1aa', fontSize: '12px' }}>AtomQuest · {appUrl}</Text>
        </Container>
      </Body>
    </Html>
  );
}