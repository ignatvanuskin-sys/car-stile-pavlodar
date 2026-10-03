/**
 * Приёмник заявок в Google-таблице (Apps Script).
 *
 * Куда вставить: открыть таблицу → Расширения → Apps Script → вставить этот
 * код целиком → сохранить. Затем «Развернуть» → «Новое развёртывание» →
 * тип «Веб-приложение» → «Запуск от имени: я» → «Доступ: все» → развернуть и
 * скопировать URL. Этот URL идёт в переменную окружения SHEET_WEBHOOK_URL.
 *
 * Секрет: тот же текст, что в SHEET_WEBHOOK_SECRET на Vercel. Он отсекает
 * случайные запросы к открытому адресу.
 */

var SECRET = 'ЗАМЕНИТЕ_НА_СВОЙ_СЕКРЕТ';

var HEADERS = [
  'Дата',
  'Код заявки',
  'Имя',
  'Телефон',
  'Услуга',
  'Авто',
  'Когда',
  'Связь',
  'Комментарий',
  'Ориентир с сайта',
  'Источник',
  'Статус',
  'Сумма заказа, ₸',
  'Комиссия 7%, ₸',
  'Оплачено',
];

function doPost(e) {
  var out = { ok: false };
  try {
    var data = JSON.parse(e.postData.contents);
    if (SECRET && data.secret !== SECRET) {
      return reply({ ok: false, error: 'bad secret' });
    }

    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
    ensureHeaders(sheet);

    if (data.action === 'lead') {
      appendLead(sheet, data);
      out = { ok: true, action: 'lead' };
    } else if (data.action === 'status') {
      out = { ok: updateByCode(sheet, data.code, { status: data.status }), action: 'status' };
    } else if (data.action === 'amount') {
      out = {
        ok: updateByCode(sheet, data.code, {
          status: data.status || 'выполнена',
          amount: data.amount,
          commission: data.commission,
        }),
        action: 'amount',
      };
    }
  } catch (err) {
    out = { ok: false, error: String(err) };
  }
  return reply(out);
}

function doGet() {
  return reply({ ok: true, message: 'Приёмник заявок работает. Данные отправляйте методом POST.' });
}

function reply(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function ensureHeaders(sheet) {
  if (sheet.getLastRow() > 0 && sheet.getRange(1, 1).getValue() === HEADERS[0]) return;
  sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]).setFontWeight('bold');
  sheet.setFrozenRows(1);
}

function appendLead(sheet, d) {
  sheet.appendRow([
    new Date(),
    d.code || '',
    d.name || '',
    d.phone || '',
    [d.pack, d.services].filter(String).join(' / '),
    d.car || '',
    d.when || '',
    d.channel || '',
    d.comment || '',
    d.estimate || '',
    d.source || 'form',
    d.status || 'новая',
    '',
    '',
    '',
  ]);
}

/** Находит строку по коду заявки и обновляет нужные колонки. */
function updateByCode(sheet, code, patch) {
  if (!code || sheet.getLastRow() < 2) return false;
  var codes = sheet.getRange(2, 2, sheet.getLastRow() - 1, 1).getValues();
  for (var i = 0; i < codes.length; i++) {
    if (String(codes[i][0]).trim() === String(code).trim()) {
      var row = i + 2;
      if (patch.status) sheet.getRange(row, 12).setValue(patch.status);
      if (patch.amount) sheet.getRange(row, 13).setValue(patch.amount);
      if (patch.commission) sheet.getRange(row, 14).setValue(patch.commission);
      return true;
    }
  }
  return false;
}

/**
 * Запустить один раз вручную: создаёт лист «Итоги» с месячной сводкой.
 * В редакторе Apps Script выберите функцию setup и нажмите «Выполнить».
 */
function setup() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheets()[0];
  ensureHeaders(sheet);

  var name = 'Итоги';
  var totals = ss.getSheetByName(name) || ss.insertSheet(name);
  totals.clear();
  totals.getRange(1, 1, 1, 3).setValues([['Месяц', 'Сумма заказов, ₸', 'Ваша комиссия 7%, ₸']]).setFontWeight('bold');

  var now = new Date();
  for (var i = 0; i < 12; i++) {
    var d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    var key = Utilities.formatDate(d, Session.getScriptTimeZone(), 'yyyy-MM');
    var row = i + 2;
    totals.getRange(row, 1).setValue(key);
    totals
      .getRange(row, 2)
      .setFormula('=SUMIFS(Заявки!M:M, Заявки!A:A, ">="&DATE(' + d.getFullYear() + ',' + (d.getMonth() + 1) + ',1), Заявки!A:A, "<"&EDATE(DATE(' + d.getFullYear() + ',' + (d.getMonth() + 1) + ',1),1))');
    totals
      .getRange(row, 3)
      .setFormula('=SUMIFS(Заявки!N:N, Заявки!A:A, ">="&DATE(' + d.getFullYear() + ',' + (d.getMonth() + 1) + ',1), Заявки!A:A, "<"&EDATE(DATE(' + d.getFullYear() + ',' + (d.getMonth() + 1) + ',1),1))');
  }
  totals.getRange(14, 1, 1, 3).setValues([['Итого за всё время', '', '']]).setFontWeight('bold');
  totals.getRange(14, 2).setFormula('=SUM(B2:B13)');
  totals.getRange(14, 3).setFormula('=SUM(C2:C13)');
}
