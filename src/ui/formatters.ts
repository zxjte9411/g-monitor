export function formatResetTime(resetTimeISO: string): string {
    const diff = new Date(resetTimeISO).getTime() - Date.now();
    if (diff <= 0) return 'Ready';

    const totalMinutes = Math.ceil(diff / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours > 0) {
        return `(Resets in ${hours}h ${minutes}m)`;
    }
    return `(Resets in ${minutes}m)`;
}
