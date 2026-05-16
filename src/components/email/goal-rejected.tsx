import { Html, Head, Body, Container, Text, Button, Preview, Section, Heading, Hr } from '@react-email/components';

interface GoalRejectedProps {
  employeeName: string;
  managerComment: string;
  editUrl: string;
}

export function GoalRejectedEmail({ employeeName, managerComment, editUrl }: GoalRejectedProps) {
  return (
    <Html>
      <Head />
      <Preview>Your goal sheet has been returned for rework</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>AtomQuest</Heading>
          <Hr style={hr} />
          <Section style={section}>
            <Heading style={h2}>Action Required: Goal Revision</Heading>
            <Text style={text}>
              Hi {employeeName},
            </Text>
            <Text style={text}>
              Your goal sheet has been reviewed by your manager and returned for rework. Please update your goals based on the following feedback:
            </Text>
            
            <div style={commentBox}>
              <Text style={{ ...text, margin: 0, fontStyle: 'italic' }}>
                &quot;{managerComment}&quot;
              </Text>
            </div>

            <Text style={text}>
              Once you have made the necessary adjustments, please resubmit your goals for approval.
            </Text>
            <Button style={btn} href={editUrl}>
              Edit Goals Now
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
const h2 = { color: '#ea580c', fontSize: '20px', fontWeight: '600', margin: '16px 0' };
const text = { color: '#475569', fontSize: '16px', lineHeight: '24px', margin: '16px 0' };
const commentBox = { backgroundColor: '#fff7ed', borderLeft: '4px solid #f97316', padding: '16px', margin: '20px 0', borderRadius: '0 6px 6px 0' };
const btn = { backgroundColor: '#ea580c', borderRadius: '6px', color: '#fff', fontSize: '16px', fontWeight: '600', textDecoration: 'none', textAlign: 'center' as const, display: 'inline-block', padding: '12px 24px', marginTop: '16px' };
const hr = { borderColor: '#f1f5f9', margin: '20px 0' };
const footer = { color: '#94a3b8', fontSize: '12px', padding: '0 40px', marginTop: '30px' };
