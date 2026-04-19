import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendPasswordResetEmail(to: string, name: string, token: string) {
  const url = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
  await resend.emails.send({
    from: 'Aptica Parking <no-reply@aptica.es>',
    to,
    subject: 'Establece tu contraseña — Aptica Parking',
    html: `
      <p>Hola ${name},</p>
      <p>Pulsa el siguiente enlace para establecer tu contraseña. El enlace caduca en 24 horas.</p>
      <p><a href="${url}" style="color:#6A1873;font-weight:600;">Establecer contraseña</a></p>
      <p style="color:#8E8E93;font-size:12px;">Si no esperabas este correo, ignóralo.</p>
    `,
  });
}
