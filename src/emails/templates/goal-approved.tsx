import { Html, Head, Body, Container, Text, Heading, Hr, Button } from '@react-email/components';

interface GoalApprovedEmailProps {
  employeeName: string;
  cycleName: string;
  appUrl: string;
  goalsLink: string;
}

export function GoalApprovedEmail({ employeeName, cycleName, appUrl, goalsLink }: GoalApprovedEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={{ backgroundColor: '#f4f4f5', fontFamily: 'sans-serif' }}>
        <Container style={{ backgroundColor: '#ffffff', margin: '40px auto', padding: '32px', borderRadius: '8px', maxWidth: '520px' }}>
          <Heading style={{ color: '#09090b', fontSize: '20px', marginBottom: '8px' }}>
            Your Goal Sheet Has Been Approved
          </Heading>
          <Text style={{ color: '#71717a' }}>Hi {employeeName},</Text>
          <Text style={{ color: '#3f3f46' }}>
            Great news! Your goals for <strong>{cycleName}</strong> have been approved by your manager.
          </Text>
          <Button href={goalsLink} style={{ backgroundColor: '#09090b', color: '#ffffff', padding: '12px 20px', borderRadius: '6px', textDecoration: 'none', display: 'inline-block', marginTop: '16px' }}>
            View Your Goals →
          </Button>
          <Hr style={{ margin: '24px 0', borderColor: '#e4e4e7' }} />
          <Text style={{ color: '#a1a1aa', fontSize: '12px' }}>Orbit by Atomberg · {appUrl}</Text>
        </Container>
      </Body>
    </Html>
  );
}