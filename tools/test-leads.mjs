/**
 * Проверка приёма заявок.
 *
 * Запускается на собранном артефакте, а не на исходнике: важно убедиться, что
 * работает именно то, что поедет на Vercel, включая разбор тела запроса.
 *
 *   vercel build --prod && node tools/test-leads.mjs
 *
 * Секреты не нужны: без токена обработчик помечает заявку как неотправленную,
 * но всю остальную логику — проверку полей, генерацию номера, ограничение
 * частоты — отрабатывает по-настоящему.
 */
import lead from "../.vercel/output/functions/api/lead.func/api/lead.js";
import { commissionFor, formatTenge, makeCode, parseAmount } from "../.vercel/output/functions/api/lead.func/api/_lib.js";

let failed = 0;
function check(name, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) failed += 1;
  console.log(
    `${ok ? "  ok  " : " FAIL "} ${name}${ok ? "" : `  → получено ${JSON.stringify(actual)}, ждали ${JSON.stringify(expected)}`}`,
  );
}

console.log("=== разбор суммы ===");
check("просто число", parseAmount("65000"), 65000);
check("с пробелом", parseAmount("65 000"), 65000);
check("неразрывный пробел", parseAmount("65\u00a0000"), 65000);
check("обычный пробел и мусор вокруг", parseAmount("итого 120 500 руб"), 120500);
check("вместе с кодом", parseAmount("CS-261004-8F3 65000"), 65000);
check("в тысячах", parseAmount("65к"), 65000);
check("со знаком тенге", parseAmount("120 000 ₸"), 120000);
check("без суммы", parseAmount("спасибо"), null);
check("код не съедает сумму", parseAmount("CS-261004-8F3"), null);

console.log("=== комиссия и формат ===");
check("7% от 65 000", commissionFor(65000), 4550);
check("7% от 50 000", commissionFor(50000), 3500);
check("округление", commissionFor(33333), 2333);
check("формат", formatTenge(65000), "65 000 ₸");

console.log("=== формат номера заявки ===");
const code = makeCode(new Date("2026-10-04T10:00:00Z"));
check("совпадает с шаблоном", /^CS-\d{6}-[A-Z0-9]{3}$/.test(code), true);
check("код читается из собственного текста", parseAmount(`Сумма ${code} 42000`), 42000);

console.log("=== обработчик заявки ===");
function makeRes() {
  const out = { code: 0, body: null, headers: {} };
  return {
    out,
    status(c) {
      out.code = c;
      return this;
    },
    json(b) {
      out.body = b;
      return this;
    },
    end() {
      return this;
    },
    setHeader(k, v) {
      out.headers[k] = v;
      return this;
    },
  };
}

const good = {
  code: "CS-261004-8F3",
  pack: "КУЗОВ",
  services: ["Полировка кузова"],
  car: "Toyota Camry 2019",
  date: "2026-10-06",
  time: "10:00",
  name: "Асхат",
  phone: "+7 771 123 45 67",
  channel: "WhatsApp",
  comment: "царапина на крыле",
  estimate: "от 50 000 ₸",
  source: "form",
  company: "",
};

// Каждый вызов идёт со своего IP: иначе тест упирается в собственный лимит
// частоты и проверяет не то, что нужно.
let ipSeq = 0;
async function call(body, method = "POST", ip) {
  const useIp = ip ?? `10.0.0.${++ipSeq}`;
  const res = makeRes();
  await lead({ method, headers: { origin: "https://car-stile.vercel.app", "x-forwarded-for": useIp }, body }, res);
  return res.out;
}

let r = await call(good);
check("заявка принята", [r.code, r.body.ok, r.body.code], [200, true, "CS-261004-8F3"]);
check("без токена помечено как неотправленное", r.body.notified, false);
check("CORS отдан", r.headers["Access-Control-Allow-Origin"], "https://car-stile.vercel.app");

r = await call({ ...good, phone: "123" });
check("короткий телефон отклонён", [r.code, r.body.ok], [422, false]);

r = await call({ ...good, name: "" });
check("без имени отклонено", r.code, 422);

r = await call({ ...good, company: "spam-bot" });
check("приманка для ботов", [r.code, r.body.ok], [200, true]);

r = await call(good, "GET");
check("GET отклонён", r.code, 405);

r = await call(good, "OPTIONS");
check("предполётный запрос", r.code, 204);

r = await call({ ...good, code: "" });
check("код генерируется на сервере", r.body.code && /^CS-\d{6}-[A-Z0-9]{3}$/.test(r.body.code), true);

// Тело строкой: Vercel обычно отдаёт разобранный объект, но клиент может
// прислать строку — разбор не должен падать.
r = await call(JSON.stringify(good));
check("тело строкой", [r.code, r.body.ok], [200, true]);
r = await call("  \n  " + JSON.stringify(good));
check("тело строкой с отступами", [r.code, r.body.ok], [200, true]);
r = await call("{это не json");
check("битый JSON отклонён", r.code, 400);

console.log("=== лимит частоты ===");
let lastCode = 0;
for (let i = 0; i < 8; i += 1) {
  const one = await call({ ...good, code: `CS-261004-L${i}0` }, "POST", "203.0.113.7");
  lastCode = one.code;
}
check("седьмая заявка с одного IP отклонена", lastCode, 429);

console.log(failed === 0 ? "\nВСЕ ПРОВЕРКИ ПРОЙДЕНЫ" : `\nПРОВАЛЕНО: ${failed}`);
process.exit(failed === 0 ? 0 : 1);
