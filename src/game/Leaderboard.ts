import { collection, addDoc, onSnapshot, query, orderBy, limit } from "firebase/firestore";
import { db } from "../lib/firebase";

export interface ScoreEntry {
    name: string;
    score: number;
    date: string;
}

const MAX_ENTRIES = 5;

export class Leaderboard {
    private scores: ScoreEntry[] = [];

    constructor() {
        this.load();
    }

    private load(): void {
        const q = query(
            collection(db, "highscores"),
            orderBy("score", "desc"),
            limit(MAX_ENTRIES)
        );

        onSnapshot(q, (snapshot) => {
            this.scores = snapshot.docs.map(doc => doc.data() as ScoreEntry);
        }, (error) => {
            console.error("Error fetching leaderboard: ", error);
        });
    }

    getScores(): ScoreEntry[] {
        return [...this.scores];
    }

    isHighScore(score: number): boolean {
        if (this.scores.length < MAX_ENTRIES) return true;
        return score > this.scores[this.scores.length - 1].score;
    }

    async addScore(name: string, score: number): Promise<void> {
        const entry: ScoreEntry = {
            name: name.toUpperCase().slice(0, 3) || '???',
            score,
            date: new Date().toLocaleDateString(),
        };
        
        try {
            await addDoc(collection(db, "highscores"), entry);
        } catch (e) {
            console.error("Error adding score to leaderboard: ", e);
        }
    }
}
