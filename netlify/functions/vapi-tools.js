/* ============================================================
   VAPI Tool Handler — Bella Hair Studio demo (fake data)
   ============================================================ */

const SLOTS = {
  monday:    ['9:00 AM', '10:30 AM', '1:00 PM', '3:00 PM', '4:30 PM'],
  tuesday:   ['9:00 AM', '11:00 AM', '12:30 PM', '2:00 PM', '4:00 PM'],
  wednesday: ['10:00 AM', '11:30 AM', '1:30 PM', '3:30 PM', '5:00 PM'],
  thursday:  ['9:30 AM', '11:00 AM', '2:00 PM', '3:30 PM', '5:00 PM'],
  friday:    ['9:00 AM', '10:00 AM', '12:00 PM', '2:30 PM', '4:00 PM'],
  saturday:  ['8:00 AM', '9:30 AM', '11:00 AM', '1:00 PM', '2:30 PM'],
};

const SERVICE_DURATION = {
  haircut:    30,
  blowout:    30,
  colour:     150,
  highlights: 180,
  balayage:   180,
  toner:      45,
  treatment:  60,
};

function normaliseDay(input) {
  const s = (input || '').toLowerCase().trim();
  if (s.includes('mon')) return 'monday';
  if (s.includes('tue')) return 'tuesday';
  if (s.includes('wed')) return 'wednesday';
  if (s.includes('thu')) return 'thursday';
  if (s.includes('fri')) return 'friday';
  if (s.includes('sat')) return 'saturday';
  if (s.includes('sun')) return null;
  // try to match a date like "28 April" — just use next weekday
  return 'friday';
}

function pickSlots(day, count = 3) {
  const all = SLOTS[day] || SLOTS.friday;
  // return first `count` slots (always available in demo)
  return all.slice(0, count);
}

function generateRef() {
  return 'BHS-' + Math.floor(1000 + Math.random() * 9000);
}

function checkAvailability({ date, service }) {
  const day = normaliseDay(date);

  if (!day) {
    return 'Sorry, Bella Hair Studio is closed on Sundays. Would another day work for you?';
  }

  const slots = pickSlots(day);
  const dayLabel = day.charAt(0).toUpperCase() + day.slice(1);

  return `Available slots on ${dayLabel}: ${slots.join(', ')}. Which works for you?`;
}

function createBooking({ date, time, service, name, phone }) {
  const ref = generateRef();
  const day = normaliseDay(date);
  const dayLabel = day ? day.charAt(0).toUpperCase() + day.slice(1) : date;

  return `Booking confirmed! Reference number ${ref}. ${name} is booked in for a ${service || 'appointment'} on ${dayLabel} at ${time}. A confirmation SMS will be sent to ${phone}. See you then!`;
}

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  const toolCalls = body?.message?.toolCallList || [];
  const results = [];

  for (const call of toolCalls) {
    const name = call?.function?.name;
    let args = {};
    try { args = JSON.parse(call?.function?.arguments || '{}'); } catch {}

    let result = 'Sorry, something went wrong.';

    if (name === 'check_availability') {
      result = checkAvailability(args);
    } else if (name === 'create_booking') {
      result = createBooking(args);
    }

    results.push({ toolCallId: call.id, result });
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ results }),
  };
};
