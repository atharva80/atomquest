import { Html, Head, Body, Container, Text, Heading, Hr, Button } from '@react-email/components';

interface GoalReturnedEmailProps {
  employeeName: string;
  cycleName: string;
  managerComment: string;
  appUrl: string;
  goalsLink: string;
}

export function GoalReturnedEmail({ employeeName, cycleName, managerComment, appUrl, goalsLink }: GoalReturnedEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={{ backgroundColor: '#f4f4f5', fontFamily: 'sans-serif' }}>
        <Container style={{ backgroundColor: '#ffffff', margin: '40px auto', padding: '32px', borderRadius: '8px', maxWidth: '520px' }}>
          <Heading style={{ color: '#09090b', fontSize: '20px', marginBottom: '8px' }}>
            Your Goal Sheet Requires Revision
          </Heading>
          <Text style={{ color: '#71717a' }}>Hi {employeeName},</Text>
          <Text style={{ color: '#3f3f46' }}>
            Your goals for <strong>{cycleName}</strong> have been returned by your manager for revisions.
          </Text>
          <Text style={{ color: '#3f3f46', marginTop: '12px', padding: '12px', backgroundColor: '#fafafa', borderRadius: '6px' }}>
            <strong>Manager feedback:</strong><br />
            {managerComment}
          </Text>
          <Button href={goalsLink} style={{ backgroundColor: '#09090b', color: '#ffffff', padding: '12px 20px', borderRadius: '6px', textDecoration: 'none', display: 'inline-block', marginTop: '16px' }}>
            Revise Your Goals →
          </Button>
          <Hr style={{ margin: '24px 0', borderColor: '#e4e4e7' }} />
          <Text style={{ color: '#a1a1aa', fontSize: '12px' }}>Orbit by Atomberg · {appUrl}</Text>
        </Container>
      </Body>
    </Html>
  );
}