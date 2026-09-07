export async function withTimeout(operation, milliseconds = 12000) {
  let timer;
  try {
    return await Promise.race([
      operation,
      new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('Connection timed out; local data is kept.')), milliseconds); }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}
