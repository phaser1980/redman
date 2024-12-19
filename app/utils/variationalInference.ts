// Variational Inference for RNG pattern detection
import { sum, mean, std } from 'mathjs';

interface VariationalParameters {
    mu: number[];    // Mean parameters for each symbol
    sigma: number[]; // Standard deviation parameters
    alpha: number[]; // Dirichlet concentration parameters
}

interface VIResult {
    posterior: {
        symbolProbabilities: number[];
        uncertainty: number[];
    };
    elbo: number;
    convergence: boolean;
    iterations: number;
}

// Compute KL divergence between variational distribution and prior
function computeKLDivergence(params: VariationalParameters): number {
    const priorAlpha = Array(4).fill(1); // Symmetric Dirichlet prior
    const totalAlpha = sum(params.alpha);
    const totalPrior = sum(priorAlpha);
    
    // KL divergence for Dirichlet component
    let kl = Math.log(gamma(totalAlpha) / gamma(totalPrior));
    for (let i = 0; i < 4; i++) {
        kl += Math.log(gamma(priorAlpha[i]) / gamma(params.alpha[i]));
        kl += (params.alpha[i] - priorAlpha[i]) * (digamma(params.alpha[i]) - digamma(totalAlpha));
    }
    
    return kl;
}

// Update variational parameters using coordinate ascent
function updateParameters(
    data: number[],
    params: VariationalParameters,
    learningRate: number
): VariationalParameters {
    const counts = Array(4).fill(0);
    data.forEach(symbol => counts[symbol - 1]++);
    
    // Update Dirichlet parameters
    const newAlpha = params.alpha.map((alpha, i) => {
        const gradAlpha = counts[i] * (digamma(sum(params.alpha)) - digamma(alpha)) + 1;
        return alpha + learningRate * gradAlpha;
    });
    
    // Update Gaussian parameters
    const newMu = params.mu.map((mu, i) => {
        const symbolData = data.filter(s => s === i + 1);
        return symbolData.length > 0 ? mean(symbolData) : mu;
    });
    
    const newSigma = params.sigma.map((sigma, i) => {
        const symbolData = data.filter(s => s === i + 1);
        return symbolData.length > 0 ? Math.max(0.1, std(symbolData)) : sigma;
    });
    
    return {
        mu: newMu,
        sigma: newSigma,
        alpha: newAlpha
    };
}

// Helper functions for special mathematical operations
function gamma(x: number): number {
    // Approximation of the gamma function
    if (x === 1) return 1;
    let y = 12 * x - 10;
    return Math.sqrt(2 * Math.PI / x) * Math.pow((x / Math.E), x);
}

function digamma(x: number): number {
    // Approximation of the digamma function
    return Math.log(x) - 1/(2*x);
}

export function runVariationalInference(sequence: number[]): VIResult {
    // Initialize variational parameters
    let params: VariationalParameters = {
        mu: Array(4).fill(0),
        sigma: Array(4).fill(1),
        alpha: Array(4).fill(1)
    };
    
    const maxIter = 100;
    const tolerance = 1e-4;
    const learningRate = 0.01;
    let elbo_old = -Infinity;
    let converged = false;
    let iterations = 0;
    
    // Coordinate ascent variational inference
    for (let iter = 0; iter < maxIter; iter++) {
        params = updateParameters(sequence, params, learningRate);
        const elbo = -computeKLDivergence(params); // Negative KL as part of ELBO
        
        // Check convergence
        if (Math.abs(elbo - elbo_old) < tolerance) {
            converged = true;
            break;
        }
        
        elbo_old = elbo;
        iterations = iter + 1;
    }
    
    // Compute final posterior estimates
    const totalAlpha = sum(params.alpha);
    const symbolProbabilities = params.alpha.map(a => a / totalAlpha);
    const uncertainty = params.sigma.map((s, i) => s * Math.sqrt(params.alpha[i]));
    
    return {
        posterior: {
            symbolProbabilities,
            uncertainty
        },
        elbo: elbo_old,
        convergence: converged,
        iterations
    };
}
