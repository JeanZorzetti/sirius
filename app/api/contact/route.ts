import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sendHtmlEmail } from "@/lib/email";
import logger from "@/lib/logger";

const contactSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email invalido"),
  phone: z.string().optional(),
  company: z.string().optional(),
  subject: z.enum(["sales", "support", "partnership", "feedback", "other"], {
    message: "Selecione um assunto",
  }),
  message: z.string().min(10, "Mensagem deve ter pelo menos 10 caracteres"),
});

const subjectLabels: Record<string, string> = {
  sales: "Informacoes Comerciais",
  support: "Suporte Tecnico",
  partnership: "Parcerias",
  feedback: "Feedback e Sugestoes",
  other: "Outros Assuntos",
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const result = contactSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Dados invalidos", details: result.error.issues },
        { status: 400 }
      );
    }

    const { name, email, phone, company, subject, message } = result.data;

    logger.info({
      email,
      subject,
      hasPhone: !!phone,
      hasCompany: !!company,
    }, "Contact form submission");

    // Generate HTML email content
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nova mensagem de contato</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); padding: 30px; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Nova Mensagem de Contato</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Sirius CRM - Formulario de Contato</p>
  </div>

  <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
    <table style="width: 100%; border-collapse: collapse;">
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; font-weight: bold; color: #6b7280; width: 120px;">Nome:</td>
        <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">${name}</td>
      </tr>
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; font-weight: bold; color: #6b7280;">Email:</td>
        <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;"><a href="mailto:${email}" style="color: #7c3aed;">${email}</a></td>
      </tr>
      ${phone ? `
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; font-weight: bold; color: #6b7280;">Telefone:</td>
        <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">${phone}</td>
      </tr>
      ` : ""}
      ${company ? `
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; font-weight: bold; color: #6b7280;">Empresa:</td>
        <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">${company}</td>
      </tr>
      ` : ""}
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; font-weight: bold; color: #6b7280;">Assunto:</td>
        <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
          <span style="background: #7c3aed; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px;">${subjectLabels[subject]}</span>
        </td>
      </tr>
    </table>

    <div style="margin-top: 20px;">
      <h3 style="color: #374151; margin: 0 0 10px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Mensagem:</h3>
      <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb;">
        <p style="margin: 0; white-space: pre-wrap;">${message}</p>
      </div>
    </div>
  </div>

  <div style="background: #374151; padding: 20px; border-radius: 0 0 10px 10px; text-align: center;">
    <p style="color: rgba(255,255,255,0.7); margin: 0; font-size: 12px;">
      Esta mensagem foi enviada atraves do formulario de contato do Sirius CRM
    </p>
    <p style="color: rgba(255,255,255,0.5); margin: 10px 0 0 0; font-size: 11px;">
      ${new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}
    </p>
  </div>
</body>
</html>
`;

    // Send email to support team
    const emailResult = await sendHtmlEmail({
      to: ["contato@roilabs.com.br"],
      subject: `[Sirius CRM] ${subjectLabels[subject]} - ${name}`,
      html: htmlContent,
    });

    if (!emailResult.success) {
      logger.error({
        email,
        error: emailResult.error,
      }, "Failed to send contact email");
      return NextResponse.json(
        { error: "Erro ao enviar mensagem. Tente novamente." },
        { status: 500 }
      );
    }

    // Send confirmation email to user
    const confirmationHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Recebemos sua mensagem</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Recebemos sua Mensagem!</h1>
  </div>

  <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
    <p style="margin: 0 0 20px 0;">Ola <strong>${name}</strong>,</p>
    <p style="margin: 0 0 20px 0;">Obrigado por entrar em contato conosco! Recebemos sua mensagem e nossa equipe ira analisa-la o mais breve possivel.</p>

    <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb; margin: 20px 0;">
      <p style="margin: 0; font-size: 14px; color: #6b7280;"><strong>Assunto:</strong> ${subjectLabels[subject]}</p>
      <p style="margin: 10px 0 0 0; font-size: 14px; color: #6b7280;"><strong>Tempo medio de resposta:</strong> Ate 24 horas uteis</p>
    </div>

    <p style="margin: 0;">Enquanto isso, voce pode:</p>
    <ul style="margin: 10px 0 20px 0; padding-left: 20px;">
      <li>Consultar nossa <a href="https://sirius.roilabs.com.br/help" style="color: #7c3aed;">Central de Ajuda</a></li>
      <li>Conhecer nossos <a href="https://sirius.roilabs.com.br/pricing" style="color: #7c3aed;">Planos e Precos</a></li>
      <li>Explorar as <a href="https://sirius.roilabs.com.br/features" style="color: #7c3aed;">Funcionalidades</a> do Sirius CRM</li>
    </ul>

    <p style="margin: 0;">Atenciosamente,<br><strong>Equipe Sirius CRM</strong></p>
  </div>

  <div style="background: #374151; padding: 20px; border-radius: 0 0 10px 10px; text-align: center;">
    <p style="color: rgba(255,255,255,0.7); margin: 0; font-size: 12px;">
      Sirius CRM - Parte do Grupo ROI Labs
    </p>
    <p style="color: rgba(255,255,255,0.5); margin: 10px 0 0 0; font-size: 11px;">
      <a href="https://sirius.roilabs.com.br" style="color: rgba(255,255,255,0.5);">sirius.roilabs.com.br</a>
    </p>
  </div>
</body>
</html>
`;

    // Send confirmation to user (non-blocking)
    sendHtmlEmail({
      to: email,
      subject: "Recebemos sua mensagem - Sirius CRM",
      html: confirmationHtml,
    }).catch((err) => {
      logger.warn({ email, error: err }, "Failed to send confirmation email to user");
    });

    logger.info({ email, subject }, "Contact form submitted successfully");

    return NextResponse.json({
      success: true,
      message: "Mensagem enviada com sucesso!",
    });
  } catch (error: any) {
    logger.error({ error: error.message }, "Contact form error");
    return NextResponse.json(
      { error: "Erro interno. Tente novamente mais tarde." },
      { status: 500 }
    );
  }
}
