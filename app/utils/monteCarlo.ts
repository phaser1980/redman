// Linear Congruential Generator parameters
const LCG_PARAMS = [
    { a: 1597, c: 51749, m: 244944 },
    { a: 1664525, c: 1013904223, m: Math.pow(2, 32) },
    { a: 22695477, c: 1, m: Math.pow(2, 32) },
    { a: 69069, c: 1, m: Math.pow(2, 32) }
];

interface LCGParams {
    a: number;
    c: number;
    m: number;
}

class LCGSimulator {
    private a: number;
    private c: number;
    private m: number;
    private currentSeed: number;

    constructor(params: LCGParams, seed: number) {
        this.a = params.a;
        this.c = params.c;
        this.m = params.m;
        this.currentSeed = seed;
    }

    next(): number {
        this.currentSeed = (this.a * this.currentSeed + this.c) % this.m;
        // Map to 1-4 range for card symbols
        return Math.floor((this.currentSeed / this.m) * 4) + 1;
    }

    // Generate a sequence of n symbols
    generateSequence(length: number): number[] {
        return Array(length).fill(0).map(() => this.next());
    }
}

export interface MonteCarloResult {
    bestSeed: number;
    confidence: number;
    matchedSequenceLength: number;
    predictedNext: number[];
    lcgParams: LCGParams;
}

export function sequenceSimilarity(seq1: number[], seq2: number[]): number {
    let matches = 0;
    const length = Math.min(seq1.length, seq2.length);
    for (let i = 0; i < length; i++) {
        if (seq1[i] === seq2[i]) matches++;
    }
    return matches / length;
}

export function findPotentialSeed(observedSequence: number[]): MonteCarloResult {
    let bestResult: MonteCarloResult = {
        bestSeed: 0,
        confidence: 0,
        matchedSequenceLength: 0,
        predictedNext: [],
        lcgParams: LCG_PARAMS[0]
    };

    // Try each LCG parameter set
    for (const params of LCG_PARAMS) {
        // Try multiple seed values
        for (let seed = 1; seed < 1000; seed++) {
            const simulator = new LCGSimulator(params, seed);
            const simulatedSequence = simulator.generateSequence(observedSequence.length);
            const similarity = sequenceSimilarity(observedSequence, simulatedSequence);

            if (similarity > bestResult.confidence) {
                // Generate next few predictions
                const nextPredictions = simulator.generateSequence(5);
                
                bestResult = {
                    bestSeed: seed,
                    confidence: similarity,
                    matchedSequenceLength: Math.floor(similarity * observedSequence.length),
                    predictedNext: nextPredictions,
                    lcgParams: params
                };
            }
        }
    }

    console.log('Monte Carlo findPotentialSeed result:', bestResult);
    return bestResult;
}

export function chiSquareTest(sequence: number[]): {
    statistic: number;
    pValue: number;
    isRandom: boolean;
} {
    // Count occurrences of each symbol
    const observed = new Array(4).fill(0);
    sequence.forEach(symbol => observed[symbol - 1]++);

    // Expected count for uniform distribution
    const expected = sequence.length / 4;

    // Calculate chi-square statistic
    const chiSquare = observed.reduce((sum, count) => 
        sum + Math.pow(count - expected, 2) / expected, 0);

    // Degrees of freedom = 4 - 1 = 3
    // Critical value for p=0.05 with df=3 is 7.815
    const criticalValue = 7.815;
    const pValue = 1 - chiSquare / criticalValue; // Simplified p-value approximation

    console.log('Chi-square test result:', {
        observed,
        expected,
        chiSquare,
        pValue,
        isRandom: chiSquare < criticalValue
    });

    return {
        statistic: chiSquare,
        pValue: Math.max(0, Math.min(1, pValue)),
        isRandom: chiSquare < criticalValue
    };
}
