import {
  CODE_RE,
  appendToSheet,
  commissionFor,
  formatTenge,
  parseAmount,
  sendTelegram,
  COMMISSION_RATE,
} from "./_lib.js";

/**
 * Вебхук бота: сюда Telegram присылает нажатия кнопок и ответы.
 *
 * Суммы у каждого заказа разные, поэтому 7% считаются не по прайсу сайта, а по
 * фактической сумме, которую владелец сайта вносит сам. Чтобы не держать базу
 * состояний (функции Vercel живут без памяти), номер заявки берём прямо из
 * текста сообщения, на которое отвечает пользователь: каждая подсказка бота
 * содержит код заявки.
 *
 * Обработчик всегда отвечает 200 — иначе Telegram начнёт слать апдейт заново.
 */

interface Req {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  body?: unknown;
}

interface Res {
  status(code: number): Res;
  json(body: unknown): void;
  end(): void;
  setHeader(name: string, value: string): void;
}

interface TgMessage {
  message_id: number;
  chat: { id: number | string };
  text?: string;
  reply_to_message?: { text?: string };
}

interface TgUpdate {
  message?: TgMessage;
  callback_query?: {
    id: string;
    data?: string;
    message?: { message_id: number; chat: { id: number | string } };
  };
}

function header(req: Req, name: string): string | undefined {
  const value = req.headers[name] ?? req.headers[name.toLowerCase()];
  return Array.isArray(value) ? value[0] : value;
}

function findCode(text: string | undefined): string | null {
  if (!text) return null;
  const match = text.match(CODE_RE);
  return match ? match[0] : null;
}

export default async function handler(req: Req, res: Res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.status(200).json({ ok: true });
    return;
  }

  /* Секрет задаётся при установке вебхука: без него сюда мог бы постучаться кто
     угодно и, например, подделать сумму заказа. */
  const expected = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (expected && header(req, "x-telegram-bot-api-secret-token") !== expected) {
    res.status(401).json({ ok: false });
    return;
  }

  let update: TgUpdate = {};
  try {
    update = typeof req.body === "string" ? JSON.parse(req.body) : ((req.body as TgUpdate) ?? {});
  } catch {
    res.status(200).json({ ok: true });
    return;
  }

  const owner = process.env.TELEGRAM_CHAT_ID;
  const chatIdOf = (m?: TgUpdate["callback_query"]): string | undefined => {
    const id = m?.message?.chat?.id;
    return id === undefined ? undefined : String(id);
  };

  try {
    /* ── Нажатие кнопки ─────────────────────────────────────────────────── */
    if (update.callback_query?.data) {
      const chatId = chatIdOf(update.callback_query);
      if (owner && chatId !== String(owner)) {
        res.status(200).json({ ok: true });
        return;
      }

      const [action, code] = update.callback_query.data.split(":");
      if (!code) {
        res.status(200).json({ ok: true });
        return;
      }

      if (action === "sum") {
        await sendTelegram(
          `Внесите сумму заказа <b>${code}</b>.\n\nОтветьте <b>на это сообщение</b> числом, например:\n<code>65000</code> или <code>65 000</code>.\n\nСчитаю 7% и записываю в таблицу.`,
          { chatId },
        );
      } else if (action === "done" || action === "no") {
        const status = action === "done" ? "выполнена" : "отказ";
        await appendToSheet({ action: "status", code, status });
        await sendTelegram(`Отмечено: <b>${code}</b> — ${status}.`, { chatId });
      }

      res.status(200).json({ ok: true });
      return;
    }

    /* ── Текстовое сообщение ────────────────────────────────────────────── */
    const message = update.message;
    if (!message?.text) {
      res.status(200).json({ ok: true });
      return;
    }

    const chatId = String(message.chat.id);
    if (owner && chatId !== String(owner)) {
      res.status(200).json({ ok: true });
      return;
    }

    /* Код ищем сначала в цитируемом сообщении бота, потом в самом тексте:
       так работает и ответ на уведомление, и сообщение вида «CS-… 65000». */
    const code = findCode(message.reply_to_message?.text) ?? findCode(message.text);
    const amount = parseAmount(message.text);

    if (!code) {
      await sendTelegram(
        "Не вижу номер заявки. Ответьте на сообщение с уведомлением или напишите код и сумму вместе, например: <code>CS-261004-8F3 65000</code>.",
        { chatId, replyTo: message.message_id },
      );
      res.status(200).json({ ok: true });
      return;
    }

    if (!amount) {
      await sendTelegram(
        `Вижу заявку <b>${code}</b>, но не вижу сумму. Пришлите число, например <code>65000</code>.`,
        { chatId, replyTo: message.message_id },
      );
      res.status(200).json({ ok: true });
      return;
    }

    const commission = commissionFor(amount);
    await appendToSheet({
      action: "amount",
      code,
      amount,
      commission,
      status: "выполнена",
    });
    await sendTelegram(
      `Записано по заявке <b>${code}</b>:\n\nСумма заказа: <b>${formatTenge(amount)}</b>\nВаши ${Math.round(
        COMMISSION_RATE * 100,
      )}%: <b>${formatTenge(commission)}</b>`,
      { chatId, replyTo: message.message_id },
    );

    res.status(200).json({ ok: true });
  } catch {
    /* Ошибку не показываем наружу, но и не заставляем Telegram повторять. */
    res.status(200).json({ ok: true });
  }
}
