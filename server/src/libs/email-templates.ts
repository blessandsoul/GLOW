export function welcomeEmailHtml(firstName: string, appUrl: string): string {
  return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f8fafc;font-family:Arial,sans-serif;">
  <div style="max-width:600px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
    <div style="background:#3b82f6;padding:32px;text-align:center;">
      <h1 style="color:#fff;margin:0;font-size:24px;">Добро пожаловать в LashMe! 🌟</h1>
    </div>
    <div style="padding:32px;">
      <p style="font-size:16px;color:#374151;">Привет, ${firstName}!</p>
      <p style="font-size:16px;color:#374151;">Твой аккаунт создан. Начни прямо сейчас — загрузи первое фото и получи AI-ретушь за секунды.</p>
      <div style="text-align:center;margin:32px 0;">
        <a href="${appUrl}" style="background:#3b82f6;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-size:16px;font-weight:600;">Начать работу</a>
      </div>
      <p style="font-size:14px;color:#9ca3af;text-align:center;margin-top:32px;border-top:1px solid #f1f5f9;padding-top:16px;"><a href="${appUrl}/unsubscribe" style="color:#9ca3af;">Отписаться</a></p>
    </div>
  </div>
</body>
</html>`;
}

export function photoReadyEmailHtml(firstName: string, jobId: string, appUrl: string): string {
  return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f8fafc;font-family:Arial,sans-serif;">
  <div style="max-width:600px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
    <div style="background:#3b82f6;padding:32px;text-align:center;">
      <h1 style="color:#fff;margin:0;font-size:24px;">Ваше фото готово! ✨</h1>
    </div>
    <div style="padding:32px;">
      <p style="font-size:16px;color:#374151;">Привет, ${firstName}!</p>
      <p style="font-size:16px;color:#374151;">AI закончил обработку вашего фото. Скачайте результат прямо сейчас.</p>
      <div style="text-align:center;margin:32px 0;">
        <a href="${appUrl}/dashboard" style="background:#3b82f6;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-size:16px;font-weight:600;">Посмотреть результат</a>
      </div>
      <p style="font-size:14px;color:#9ca3af;text-align:center;margin-top:32px;border-top:1px solid #f1f5f9;padding-top:16px;"><a href="${appUrl}/unsubscribe" style="color:#9ca3af;">Отписаться</a></p>
    </div>
  </div>
</body>
</html>`;
}

export function day3FollowupHtml(firstName: string, appUrl: string): string {
  return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f8fafc;font-family:Arial,sans-serif;">
  <div style="max-width:600px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
    <div style="background:#3b82f6;padding:32px;text-align:center;">
      <h1 style="color:#fff;margin:0;font-size:24px;">Как оценили клиенты? 💬</h1>
    </div>
    <div style="padding:32px;">
      <p style="font-size:16px;color:#374151;">Привет, ${firstName}!</p>
      <p style="font-size:16px;color:#374151;">Прошло 3 дня с момента регистрации. Поделитесь результатами с клиентами — профессиональные фото увеличивают конверсию на 40%.</p>
      <p style="font-size:14px;color:#9ca3af;text-align:center;margin-top:32px;border-top:1px solid #f1f5f9;padding-top:16px;">Хотите меньше писем? <a href="${appUrl}/unsubscribe" style="color:#9ca3af;">Отписаться</a></p>
    </div>
  </div>
</body>
</html>`;
}

export function day7UpgradeOfferHtml(firstName: string, appUrl: string): string {
  return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f8fafc;font-family:Arial,sans-serif;">
  <div style="max-width:600px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
    <div style="background:linear-gradient(135deg,#3b82f6,#8b5cf6);padding:32px;text-align:center;">
      <h1 style="color:#fff;margin:0;font-size:24px;">Специальное предложение 🎁</h1>
      <p style="color:#e0e7ff;margin:8px 0 0;font-size:18px;">50% скидка только для вас</p>
    </div>
    <div style="padding:32px;">
      <p style="font-size:16px;color:#374151;">Привет, ${firstName}!</p>
      <p style="font-size:16px;color:#374151;">Ваши бесплатные кредиты закончились. Переходите на PRO и обрабатывайте неограниченное количество фото с профессиональным качеством.</p>
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;margin:24px 0;text-align:center;">
        <p style="font-size:24px;font-weight:700;color:#16a34a;margin:0;">−50% на первый месяц</p>
        <p style="font-size:14px;color:#15803d;margin:4px 0 0;">Только в течение 48 часов</p>
      </div>
      <div style="text-align:center;margin:24px 0;">
        <a href="${appUrl}/pricing?promo=WELCOME50" style="background:#3b82f6;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-size:16px;font-weight:600;">Получить скидку</a>
      </div>
      <p style="font-size:14px;color:#9ca3af;text-align:center;margin-top:32px;border-top:1px solid #f1f5f9;padding-top:16px;"><a href="${appUrl}/unsubscribe" style="color:#9ca3af;">Отписаться</a></p>
    </div>
  </div>
</body>
</html>`;
}
