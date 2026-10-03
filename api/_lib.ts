/**
 * Общие помощники для приёма заявок с сайта.
 *
 * Файл начинается с подчёркивания, поэтому Vercel не делает из него отдельный
 * маршрут — он только подключается к обработчикам.
 *
 * Все секреты живут в переменных окружения проекта на Vercel и на клиент
 * никогда не попадают: токен бота в браузере означал бы, что любой желающий
 * может отправлять сообщения от его имени.
 */

export interface Lead {
  code: string;
  pack?: string;
  services?: string[];
  car?: string;
  date?: string;
  time?: string;
  name?: string;
  phone?: string;
  channel?: string;
  comment?: string;
  estimate?: string;
  source?: string;
}

export const CODE_RE = /CS-\d{6}-[A-Z0-9]{3}/;

/**
 * Разбирает тело запроса.
 *
 * Vercel с включёнными помощниками отдаёт уже разобранный объект, но если тело
 * пришло строкой — парсим сами. Метку порядка байтов срезаем: некоторые клиенты
 * и прокси ставят её перед JSON, и тогда разбор падает на ровном месте.
 */
export function parseBody(body: unknown): Record<string, unknown> {
  if (typeof body !== "string") return (body as Record<string, unknown>) ?? {};

  /* Берём текст от первой фигурной скобки: так снимается любой мусор и пустые
     строки перед JSON.
     Оговорка: запрос с меткой порядка байтов перед телом отбивает сам разборщик
     Vercel — до этого кода он не доходит. Из браузера такое тело недостижимо
     (наш клиент шлёт результат JSON.stringify), так что чинить здесь нечего. */
  const start = body.indexOf("{");
  const text = start > 0 ? body.slice(start) : body;
  if (!text.trim()) return {};
  return JSON.parse(text) as Record<string, unknown>;
}

const LIMITS: Record<string, number> = {
  code: 24,
  pack: 40,
  car: 120,
  date: 12,
  time: 8,
  name: 80,
  phone: 32,
  channel: 20,
  comment: 500,
  estimate: 40,
  source: 20,
};

/** Обрезает поле и убирает управляющие символы, чтобы в сообщении не было мусора. */
export function clean(value: unknown, key: string): string {
  if (typeof value !== "string") return "";
  const max = LIMITS[key] ?? 200;
  return value
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

/** Номер заявки: дата + три символа. Читается человеком и диктуется по телефону. */
export function makeCode(now: Date): string {
  const yy = String(now.getUTCFullYear()).slice(2);
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(now.getUTCDate()).padStart(2, "0");
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let suffix = "";
  for (let i = 0; i < 3; i += 1) {
    suffix += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `CS-${yy}${mm}${dd}-${suffix}`;
}

/** Вытаскивает сумму из сообщения: «65 000», «65000₸», «65к». */
export function parseAmount(raw: string): number | null {
  const withoutCode = raw.replace(CODE_RE, " ");
  const normalized = withoutCode.replace(/\u00a0/g, " ").toLowerCase();

  const thousands = normalized.match(/(\d{1,3}(?:\s\d{3})+)/);
  if (thousands) {
    const n = Number(thousands[1].replace(/\s/g, ""));
    if (Number.isFinite(n) && n > 0) return n;
  }

  /* «65к» = 65 000. Граница слова \b здесь не работает: кириллица не входит
     в \w, поэтому \b после «к» никогда не срабатывает — проверяем сами, что
     дальше не идёт буква. */
  const withK = normalized.match(/(\d+(?:[.,]\d+)?)\s*[кk](?![а-яёa-z])/i);
  if (withK) {
    const n = Math.round(Number(withK[1].replace(",", ".")) * 1000);
    if (Number.isFinite(n) && n > 0) return n;
  }

  const plain = normalized.match(/\d{3,9}/g);
  if (plain) {
    const n = Math.max(...plain.map(Number));
    if (Number.isFinite(n) && n > 0) return n;
  }
  return null;
}

export function formatTenge(value: number): string {
  return `${value.toLocaleString("ru-RU").replace(/\u00a0/g, " ")} ₸`;
}

export const COMMISSION_RATE = 0.07;

export function commissionFor(amount: number): number {
  return Math.round(amount * COMMISSION_RATE);
}

/** Текст уведомления о новой заявке. */
export function leadMessage(lead: Lead, code: string): string {
  const lines: string[] = [`🆕 Заявка с сайта ${code}`, ""];

  const services = lead.pack ? [lead.pack, ...(lead.services ?? [])] : lead.services ?? [];
  if (services.length) lines.push(`Услуга: ${services.join(", ")}`);
  if (lead.car) lines.push(`Авто: ${lead.car}`);
  if (lead.date || lead.time) lines.push(`Когда: ${[lead.date, lead.time].filter(Boolean).join(", ")}`);
  if (lead.name) lines.push(`Имя: ${lead.name}`);
  if (lead.phone) lines.push(`Телефон: ${lead.phone}`);
  if (lead.channel) lines.push(`Связь: ${lead.channel}`);
  if (lead.comment) lines.push(`Комментарий: ${lead.comment}`);

  lines.push("");
  if (lead.estimate) {
    lines.push(`Ориентир с сайта: ${lead.estimate} (не финальная сумма)`);
  }
  lines.push("Фактическую сумму внесите ответом на это сообщение — посчитаю 7%.");

  return lines.join("\n");
}

function api(path: string): string {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN не задан");
  return `https://api.telegram.org/bot${token}/${path}`;
}

/** Отправляет сообщение в чат заявок. Без токена просто ничего не делает. */
export async function sendTelegram(
  text: string,
  options: { chatId?: string; replyTo?: number; buttons?: { text: string; data: string }[][] } = {},
): Promise<boolean> {
  if (!process.env.TELEGRAM_BOT_TOKEN) {
    console.error("[lead] TELEGRAM_BOT_TOKEN не задан — уведомление не отправлено");
    return false;
  }
  const chatId = options.chatId ?? process.env.TELEGRAM_CHAT_ID;
  if (!chatId) {
    console.error("[lead] TELEGRAM_CHAT_ID не задан — уведомление не отправлено");
    return false;
  }

  const payload: Record<string, unknown> = {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    disable_web_page_preview: true,
  };
  if (options.replyTo) payload.reply_to_message_id = options.replyTo;
  if (options.buttons?.length) {
    payload.reply_markup = {
      inline_keyboard: options.buttons.map((row) => row.map((b) => ({ text: b.text, callback_data: b.data }))),
    };
  }

  /* Ошибки пишем в лог функции. Раньше неудачная отправка молча превращалась в
     notified:false, и понять причину было нечем. Токен и содержимое заявки в
     лог не попадают — только статус и ответ Telegram. */
  try {
    const res = await fetch(api("sendMessage"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error("[lead] Telegram отклонил сообщение:", res.status, detail.slice(0, 300));
      return false;
    }
    return true;
  } catch (error) {
    console.error("[lead] запрос к Telegram не прошёл:", error instanceof Error ? error.message : error);
    return false;
  }
}

/** Отправляет строку в Google-таблицу через веб-приложение Apps Script. */
export async function appendToSheet(row: Record<string, unknown>): Promise<boolean> {
  const url = process.env.SHEET_WEBHOOK_URL;
  /* Таблица не обязательна: пока её не подключили, это штатная ситуация,
     поэтому здесь не ошибка, а тихий выход. */
  if (!url) return false;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...row, secret: process.env.SHEET_WEBHOOK_SECRET ?? "" }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error("[lead] таблица отклонила запись:", res.status, detail.slice(0, 300));
      return false;
    }
    return true;
  } catch (error) {
    console.error("[lead] запрос к таблице не прошёл:", error instanceof Error ? error.message : error);
    return false;
  }
}

/** Разрешаем запросы только с нашего домена. */
export function corsHeaders(origin: string | undefined): Record<string, string> {
  const allowed = (process.env.ALLOWED_ORIGIN ?? "https://car-stile.vercel.app").split(",").map((s) => s.trim());
  const ok = origin && allowed.includes(origin);
  return {
    "Access-Control-Allow-Origin": ok ? origin : allowed[0],
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Cache-Control": "no-store",
  };
}
