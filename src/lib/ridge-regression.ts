/**
 * Ridge Regression Module
 * 
 * Closed-form solution: w = (X^T X + λI)^-1 X^T y
 * 
 * No external ML libraries needed — pure TypeScript matrix math.
 * Handles up to ~50 features and thousands of samples efficiently.
 */

export interface RegressionResult {
  weights: Record<string, number>;
  bias: number;
  featureNames: string[];
  rSquared: number;
  rmse: number;
  sampleCount: number;
}

/**
 * Train a ridge regression model on feature/label pairs.
 * @param features Array of feature vectors (objects with numeric values)
 * @param labels Array of target values (actual scores)
 * @param lambda L2 regularization strength (default: 1.0)
 * @returns Trained model weights + metrics
 */
export function trainRidgeRegression(
  features: Record<string, number>[],
  labels: number[],
  lambda: number = 1.0
): RegressionResult | null {
  if (features.length === 0 || labels.length === 0 || features.length !== labels.length) {
    return null;
  }

  const n = features.length;
  const featureNames = Object.keys(features[0]).sort();
  const d = featureNames.length;

  // Need at least as many samples as features + 1 for bias
  if (n < d + 1) {
    return null;
  }

  // Center labels (subtract mean) — we learn bias separately
  const meanY = labels.reduce((sum, y) => sum + y, 0) / n;
  const centeredY = labels.map(y => y - meanY);

  // Build design matrix X (n × d)
  const X: number[][] = features.map(f => featureNames.map(name => f[name] ?? 0));

  // Compute X^T X (d × d)
  const XtX: number[][] = Array.from({ length: d }, () => Array(d).fill(0));
  for (let i = 0; i < d; i++) {
    for (let j = 0; j < d; j++) {
      let sum = 0;
      for (let k = 0; k < n; k++) {
        sum += X[k][i] * X[k][j];
      }
      XtX[i][j] = sum;
    }
  }

  // Add λI to diagonal for ridge regularization
  for (let i = 0; i < d; i++) {
    XtX[i][i] += lambda;
  }

  // Compute X^T y (d × 1)
  const Xty: number[] = Array(d).fill(0);
  for (let i = 0; i < d; i++) {
    let sum = 0;
    for (let k = 0; k < n; k++) {
      sum += X[k][i] * centeredY[k];
    }
    Xty[i] = sum;
  }

  // Solve (X^T X + λI) w = X^T y using Gaussian elimination
  const weights = solveLinearSystem(XtX, Xty);
  if (!weights) {
    return null;
  }

  // Build result object
  const weightRecord: Record<string, number> = {};
  featureNames.forEach((name, i) => {
    weightRecord[name] = weights[i];
  });

  // Compute predictions and metrics
  const predictions: number[] = [];
  let ssRes = 0;
  let ssTot = 0;

  for (let k = 0; k < n; k++) {
    let pred = meanY;
    for (let i = 0; i < d; i++) {
      pred += weights[i] * X[k][i];
    }
    predictions.push(pred);
    const residual = labels[k] - pred;
    ssRes += residual * residual;
    const diff = labels[k] - meanY;
    ssTot += diff * diff;
  }

  const rSquared = ssTot > 0 ? 1 - ssRes / ssTot : 0;
  const rmse = Math.sqrt(ssRes / n);

  return {
    weights: weightRecord,
    bias: meanY,
    featureNames,
    rSquared: Math.max(0, rSquared),
    rmse,
    sampleCount: n,
  };
}

/**
 * Predict a score using learned weights.
 */
export function predictWithWeights(
  features: Record<string, number>,
  weights: Record<string, number>,
  bias: number,
  featureNames: string[]
): number {
  let score = bias;
  for (const name of featureNames) {
    score += (weights[name] || 0) * (features[name] || 0);
  }
  return Math.max(1, Math.min(10, score));
}

/**
 * Gaussian elimination with partial pivoting to solve Ax = b.
 * Returns x or null if matrix is singular.
 */
function solveLinearSystem(A: number[][], b: number[]): number[] | null {
  const n = A.length;
  const aug: number[][] = A.map((row, i) => [...row, b[i]]);

  for (let col = 0; col < n; col++) {
    // Partial pivot: find row with max absolute value in this column
    let maxRow = col;
    let maxVal = Math.abs(aug[col][col]);
    for (let row = col + 1; row < n; row++) {
      const val = Math.abs(aug[row][col]);
      if (val > maxVal) {
        maxVal = val;
        maxRow = row;
      }
    }

    // If pivot is effectively zero, matrix is singular
    if (maxVal < 1e-10) {
      return null;
    }

    // Swap rows
    if (maxRow !== col) {
      [aug[col], aug[maxRow]] = [aug[maxRow], aug[col]];
    }

    // Eliminate below
    for (let row = col + 1; row < n; row++) {
      const factor = aug[row][col] / aug[col][col];
      for (let j = col; j <= n; j++) {
        aug[row][j] -= factor * aug[col][j];
      }
    }
  }

  // Back substitution
  const x = Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let sum = aug[i][n];
    for (let j = i + 1; j < n; j++) {
      sum -= aug[i][j] * x[j];
    }
    x[i] = sum / aug[i][i];
  }

  return x;
}
