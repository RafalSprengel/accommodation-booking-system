import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Section,
  Text,
} from "@react-email/components";
import { ISiteSettings } from "../db/models/SiteSettings";

interface ContactAutoReplyProps {
  customerName: string;
  message: string;
  siteSettings: Partial<ISiteSettings>;
}

export const ContactAutoReply = ({
  customerName,
  message,
  siteSettings,
}: ContactAutoReplyProps) => {
  const mainStyle = {
    backgroundColor: "#f6f9fc",
    fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif',
  };

  const containerStyle = {
    backgroundColor: "#ffffff",
    margin: "0 auto",
    padding: "40px 20px",
    borderRadius: "8px",
    border: "1px solid #e6ebf1",
    maxWidth: "600px",
  };

  const headingStyle = {
    color: "#1a1a1a",
    fontSize: "24px",
    fontWeight: "bold" as const,
    lineHeight: "1.2",
  };

  const textStyle = {
    fontSize: "16px",
    color: "#4d4d4d",
    lineHeight: "1.5",
  };

  const sectionStyle = {
    backgroundColor: "#f9f9f9",
    padding: "20px",
    borderRadius: "4px",
    margin: "20px 0",
  };

  const sectionTextStyle = {
    fontSize: "14px",
    margin: "8px 0",
    color: "#333",
  };

  const messageStyle = {
    ...sectionTextStyle,
    whiteSpace: "pre-wrap" as const,
  };

  const footerTextStyle = {
    fontSize: "12px",
    color: "#8898aa",
    lineHeight: "1.4",
  };

  const footerHrStyle = {
    borderColor: "#e6ebf1",
    margin: "20px 0",
  };

  const footerLinkStyle = {
    color: "#0070f3",
    fontSize: "12px",
    textDecoration: "none",
  };

  return (
    <Html>
      <Head />
      <Body style={mainStyle}>
        <Container style={containerStyle}>
          <Heading style={headingStyle}>Thank you for your message</Heading>
          <Text style={textStyle}>Hello {customerName},</Text>
          <Text style={textStyle}>
            thank you for contacting Wolf Lodges. We have received your
            message and will get back to you as soon as possible.
          </Text>

          <Section style={sectionStyle}>
            <Text style={sectionTextStyle}>
              <strong>Your message:</strong>
            </Text>
            <Text style={messageStyle}>{message}</Text>
          </Section>

          <Text style={textStyle}>
            If the matter is urgent, you can also reach us by phone:{" "}
            <Link href={`tel:${siteSettings.phone}`}>
              {siteSettings.phone}
            </Link>
            .
          </Text>
          <Text style={textStyle}>Best regards,</Text>
          <Text style={textStyle}>Wolf Lodges</Text>
          <Text style={footerTextStyle}>Email: {siteSettings.email}</Text>
          <Hr style={footerHrStyle} />
          <Link href="http://accommodation.rafalsprengel.com/" style={footerLinkStyle}>
            wolflodges.pl
          </Link>
        </Container>
      </Body>
    </Html>
  );
};

export default ContactAutoReply;