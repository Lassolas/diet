// Paris wall-clock helpers (ADR 0002). On the user's device the local clock is
// Europe/Paris, so plain local-time reads are correct.

/** Current wall-clock time as 'YYYY-MM-DDTHH:MM' (the value an <input type=datetime-local> uses). */
export function nowLocalInput(): string {
	const d = new Date();
	const p = (n: number) => String(n).padStart(2, '0');
	return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

const TIME_FMT = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' });
const DAY_FMT = new Intl.DateTimeFormat('fr-FR', {
	weekday: 'long',
	day: 'numeric',
	month: 'long'
});

function parseLocal(value: string): Date {
	const [date, time] = value.split('T');
	const [y, m, d] = date.split('-').map(Number);
	const [hh, mm] = (time ?? '00:00').split(':').map(Number);
	return new Date(y, m - 1, d, hh, mm);
}

/** '13:15' from a 'YYYY-MM-DDTHH:MM' value. */
export const formatTime = (eatenAt: string) => TIME_FMT.format(parseLocal(eatenAt));

/** 'jeudi 4 septembre' from a 'YYYY-MM-DD' date. */
export const formatDay = (date: string) => DAY_FMT.format(parseLocal(`${date}T12:00`));

function localDate(d: Date): string {
	const p = (n: number) => String(n).padStart(2, '0');
	return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** 'YYYY-MM-DD' for N days before today (Paris wall-clock). */
export function daysAgoDate(n: number): string {
	const d = new Date();
	d.setDate(d.getDate() - n);
	return localDate(d);
}

/** 'YYYY-MM-DD' for today (Paris wall-clock). */
export const todayDate = () => localDate(new Date());
