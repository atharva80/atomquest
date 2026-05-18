import { Html, Head, Body, Container, Text, Heading, Hr, Button } from '@react-email/components';

interface GoalSubmittedEmailProps {
  managerName: string;
  employeeName: string;
  goalCount: number;
  cycleName: string;
  appUrl: string;
  approvalLink: string;
}

export function GoalSubmittedEmail({ managerName, employeeName, goalCount, cycleName, appUrl, approvalLink }: GoalSubmittedEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={{ backgroundColor: '#f4f4f5', fontFamily: 'sans-serif' }}>
        <Container style={{ backgroundColor: '#ffffff', margin: '40px auto', padding: '32px', borderRadius: '8px', maxWidth: '520px' }}>
          <Heading style={{ color: '#09090b', fontSize: '20px', marginBottom: '8px' }}>
            Goal Sheet Submitted for Review
          </Heading>
          <Text style={{ color: '#71717a' }}>Hi {managerName},</Text>
          <Text style={{ color: '#3f3f46' }}>
            <strong>{employeeName}</strong> has submitted their goal sheet ({goalCount} goals) for <strong>{cycleName}</strong> and it is pending your approval.
          </Text>
          <Button href={approvalLink} style={{ backgroundColor: '#09090b', color: '#ffffff', padding: '12px 20px', borderRadius: '6px', textDecoration: 'none', display: 'inline-block', marginTop: '16px' }}>
            Review Goals →
          </Button>
          <Hr style={{ margin: '24px 0', borderColor: '#e4e4e7' }} />
          <Text style={{ color: '#a1a1aa', fontSize: '12px' }}>Orbit by Atomberg · {appUrl}</Text>
        </Container>
      </Body>
    </Html>
  );
}