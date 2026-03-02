const STORAGE_KEY = 'superscan_highscores';
const MAX_ENTRIES = 5;

export interface ScoreEntry {
    name: string;
    score: number;
    date: string;
}

export class Leaderboard {
    private scores: ScoreEntry[] = [];

    constructor() {
        this.load();
    }

    private load(): void {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) this.scores = JSON.parse(raw);
        } catch {
            this.scores = [];
        }
    }

    private save(): void {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.scores));
    }

    getScores(): ScoreEntry[] {
        return [...this.scores];
    }

    isHighScore(score: number): boolean {
        if (this.scores.length < MAX_ENTRIES) return true;
        return score > this.scores[this.scores.length - 1].score;
    }

    addScore(name: string, score: number): void {
        const entry: ScoreEntry = {
            name: name.toUpperCase().slice(0, 3) || '???',
            score,
            date: new Date().toLocaleDateString(),
        };
        this.scores.push(entry);
        this.scores.sort((a, b) => b.score - a.score);
        this.scores = this.scores.slice(0, MAX_ENTRIES);
        this.save();
    }
}
