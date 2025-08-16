// Utilitário centralizado para tratamento de erros
export class AppError extends Error {
  constructor(
    message: string,
    public code?: string,
    public context?: Record<string, any>
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function handleApiError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }
  
  if (error instanceof Error) {
    return new AppError(error.message, 'UNKNOWN_ERROR', { originalError: error });
  }
  
  return new AppError('Erro desconhecido', 'UNKNOWN_ERROR', { error });
}

export function logError(error: AppError, context?: string): void {
  console.error(`[${context || 'APP'}] ${error.message}`, {
    code: error.code,
    context: error.context,
  });
}