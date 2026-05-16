import { Html, Head, Body, Container, Text, Button, Preview, Section, Heading, Hr } from '@react-email/components';

interface GoalSubmittedProps {
  employeeName: string;
  goalCount: number;
  reviewUrl: string;
}

export function GoalSubmittedEmail({ employeeName, goalCount, reviewUrl }: GoalSubmittedProps) {
  return (
    <Html>
      <Head />
      <Preview>{employeeName} has submitted goals for review</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>AtomQuest</Heading>
          <Hr style={hr} />
          <Section style={section}>
            <Heading style={h2}>Goal Sheet Submitted</Heading>
            <Text style={text}>
              <strong>{employeeName}</strong> has just submitted <strong>{goalCount}</strong> goals for your review and approval.
            </Text>
            <Text style={text}>
              Please review the proposed targets and weightages. You can approve the sheet to lock the goals, or return it for rework with your feedback.
            </Text>
            <Button style={btn} href={reviewUrl}>
              Review Goals
            </Button>
          </Section>
          <Text style={footer}>
            This is an automated message from the AtomQuest Goal Portal.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = { backgroundColor: '#f8fafc', fontFamily: 'Inter, -apple-system, sans-serif' };
const container = { backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', margin: '40px auto', padding: '20px 0 40px', maxWidth: '600px' };
const section = { padding: '0 40px' };
const h1 = { color: '#4f46e5', fontSize: '24px', fontWeight: 'bold', padding: '0 40px', margin: '20px 0 10px' };
const h2 = { color: '#0f172a', fontSize: '20px', fontWeight: '600', margin: '16px 0' };
const text = { color: '#475569', fontSize: '16px', lineHeight: '24px', margin: '16px 0' };
const btn = { backgroundColor: '#4f46e5', borderRadius: '6px', color: '#fff', fontSize: '16px', fontWeight: '600', textDecoration: 'none', textAlign: 'center' as const, display: 'inline-block', padding: '12px 24px', marginTop: '16px' };
const hr = { borderColor: '#f1f5f9', margin: '20px 0' };
const footer = { color: '#94a3b8', fontSize: '12px', padding: '0 40px', marginTop: '30px' };
