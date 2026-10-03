import {
  appendToSheet,
  clean,
  corsHeaders,
  leadMessage,
  makeCode,
  parseBody,
  sendTelegram,
  type Lead,
} from "./_lib.js";

/**
 * Приём заявки с сайта.
 *
 * Форма на сайте по-прежнему открывает WhatsApp мастерской — этот обработчик
 * лишь получает копию и уведомляет владельца сайта. Если он недоступен или
 * упал, заявка всё равно уйдёт в WhatsApp: сайт не должен зависеть от нашей
 * инфраструктуры.
 *
 * Публичный адрес защищён тремя вещами: предполётный CORS-запрос (тело только
 * application/json), скрытое поле-приманка для ботов и ограничение частоты по IP.
 */

interface Req {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  body?: unknown;
  socket?: { remoteAddress?: string };
}

interface Res {
  status(code: number): Res;
  json(body: unknown): void;
  setHeader(name: string, value: string): void;
  end(): void;
}

/* Простое ограничение частоты: живёт в памяти тёплого экземпляра функции.
   Холодный старт его сбрасывает — это не защита от целенаправленной атаки,
   а отсечение случайного спама. */
const hits = new Map<string, number[]>();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 6;

function throttled(ip: string): boolean {
  const now = Date.now();
  const list = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  list.push(now);
  hits.set(ip, list);
  if (hits.size > 500) hits.clear();
  return list.length > MAX_PER_WINDOW;
}

function header(req: Req, name: string): string | undefined {
  const value = req.headers[name] ?? req.headers[name.toLowerCase()];
  return Array.isArray(value) ? value[0] : value;
}

export default async function handler(req: Req, res: Res) {
  const origin = header(req, "origin");

  for (const [k, v] of Object.entries(corsHeaders(origin))) res.setHeader(k, v);

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "Только POST" });
    return;
  }

  const ip = header(req, "x-forwarded-for")?.split(",")[0]?.trim() || req.socket?.remoteAddress || "unknown";
  if (throttled(ip)) {
    res.status(429).json({ ok: false, error: "Слишком много заявок, попробуйте позже" });
    return;
  }

  let raw: Record<string, unknown> = {};
  try {
    raw = parseBody(req.body);
  } catch {
    res.status(400).json({ ok: false, error: "Некорректное тело запроса" });
    return;
  }

  /* Приманка: настоящий человек это поле не заполняет. Отвечаем успехом,
     чтобы бот не понял, что его отсекли. */
  if (clean(raw.company, "name")) {
    res.status(200).json({ ok: true });
    return;
  }

  const lead: Lead = {
    code: clean(raw.code, "code"),
    pack: clean(raw.pack, "pack"),
    services: Array.isArray(raw.services) ? raw.services.slice(0, 8).map((s) => clean(s, "pack")) : [],
    car: clean(raw.car, "car"),
    date: clean(raw.date, "date"),
    time: clean(raw.time, "time"),
    name: clean(raw.name, "name"),
    phone: clean(raw.phone, "phone"),
    channel: clean(raw.channel, "channel"),
    comment: clean(raw.comment, "comment"),
    estimate: clean(raw.estimate, "estimate"),
    source: clean(raw.source, "source") || "form",
  };

  const code = lead.code || makeCode(new Date());
  const digits = (lead.phone ?? "").replace(/\D/g, "");
  if (!lead.name || digits.length < 10) {
    res.status(422).json({ ok: false, error: "Нужны имя и телефон" });
    return;
  }

  const sent = await sendTelegram(leadMessage(lead, code), {
    buttons: [
      [
        { text: "💬 Внести сумму", data: `sum:${code}` },
        { text: "✅ Выполнено", data: `done:${code}` },
      ],
      [{ text: "❌ Отказ / не пришёл", data: `no:${code}` }],
    ],
  });

  await appendToSheet({
    action: "lead",
    code,
    name: lead.name,
    phone: lead.phone,
    pack: lead.pack ?? "",
    services: (lead.services ?? []).join(", "),
    car: lead.car ?? "",
    when: [lead.date, lead.time].filter(Boolean).join(" "),
    channel: lead.channel ?? "",
    comment: lead.comment ?? "",
    estimate: lead.estimate ?? "",
    source: lead.source ?? "form",
    status: "новая",
  });

  res.status(200).json({ ok: true, code, notified: sent });
}
