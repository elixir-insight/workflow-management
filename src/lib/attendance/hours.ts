export function parseTimeToMinutes(value: string | null | undefined) {
	if (!value) return null;
	const match = /^(\d{1,2}):(\d{2})(?::(\d{2}))?/.exec(value);
	if (!match) return null;
	const hours = Number(match[1]);
	const minutes = Number(match[2]);
	if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return null;
	if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
	return hours * 60 + minutes;
}

export function clockedHours(inTime: string | null | undefined, outTime: string | null | undefined) {
	const start = parseTimeToMinutes(inTime);
	const end = parseTimeToMinutes(outTime);
	if (start === null || end === null || end < start) return null;
	return Math.round(((end - start) / 60) * 100) / 100;
}

export function formatHours(hours: number | null) {
	if (hours === null) return '—';
	const whole = Math.floor(hours);
	const mins = Math.round((hours - whole) * 60);
	if (mins === 0) return `${whole}h`;
	return `${whole}h ${mins}m`;
}
