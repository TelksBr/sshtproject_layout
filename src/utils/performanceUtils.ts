/**
 * Utilitários de Performance - Debounce e Throttle
 * Otimização de funções para melhor performance
 */

/**
 * Debounce - Executa uma função apenas após um período de inatividade
 * Ideal para: inputs de busca, validações, API calls
 * 
 * @param func - Função a ser executada
 * @param delay - Delay em milissegundos
 * @returns Função debounced
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    // Cancela execução anterior se houver
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    // Agenda nova execução
    timeoutId = setTimeout(() => {
      func(...args);
    }, delay);
  };
}

/**
 * Throttle - Limita a execução de uma função a um intervalo específico
 * Ideal para: eventos de scroll, resize, mouse move
 * 
 * @param func - Função a ser executada
 * @param delay - Intervalo mínimo entre execuções
 * @returns Função throttled
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let isThrottled = false;
  let lastArgs: Parameters<T> | null = null;
  
  return (...args: Parameters<T>) => {
    if (isThrottled) {
      // Se está throttled, guarda os argumentos mais recentes
      lastArgs = args;
      return;
    }
    
    // Executa imediatamente
    func(...args);
    isThrottled = true;
    
    // Configura próxima execução permitida
    setTimeout(() => {
      isThrottled = false;
      
      // Se houver argumentos pendentes, executa com os mais recentes
      if (lastArgs) {
        func(...lastArgs);
        lastArgs = null;
        
        // Reinicia o throttle para a execução pendente
        isThrottled = true;
        setTimeout(() => {
          isThrottled = false;
        }, delay);
      }
    }, delay);
  };
}

/**
 * Debounce com cancelamento - Versão avançada com controle de cancelamento
 * 
 * @param func - Função a ser executada
 * @param delay - Delay em milissegundos
 * @returns Objeto com função debounced e método de cancelamento
 */
export function debounceCancelable<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): {
  debounced: (...args: Parameters<T>) => void;
  cancel: () => void;
  flush: (...args: Parameters<T>) => void;
} {
  let timeoutId: NodeJS.Timeout | null = null;
  
  const debounced = (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = setTimeout(() => {
      func(...args);
    }, delay);
  };
  
  const cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };
  
  const flush = (...args: Parameters<T>) => {
    cancel();
    func(...args);
  };
  
  return { debounced, cancel, flush };
}

/**
 * Throttle com Leading e Trailing - Versão avançada
 * 
 * @param func - Função a ser executada
 * @param delay - Intervalo mínimo entre execuções
 * @param options - Opções de configuração
 * @returns Função throttled configurável
 */
export function throttleAdvanced<T extends (...args: any[]) => any>(
  func: T,
  delay: number,
  options: {
    leading?: boolean; // Executa no início do período
    trailing?: boolean; // Executa no final do período
  } = { leading: true, trailing: true }
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;
  let lastCallTime = 0;
  let lastArgs: Parameters<T> | null = null;
  
  return (...args: Parameters<T>) => {
    const now = Date.now();
    
    // Se é a primeira chamada e leading está desabilitado
    if (!lastCallTime && options.leading === false) {
      lastCallTime = now;
    }
    
    const remaining = delay - (now - lastCallTime);
    
    lastArgs = args;
    
    if (remaining <= 0 || remaining > delay) {
      // Tempo passou, executa imediatamente
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      
      lastCallTime = now;
      func(...args);
      lastArgs = null;
      
    } else if (!timeoutId && options.trailing !== false) {
      // Agenda execução para o trailing
      timeoutId = setTimeout(() => {
        lastCallTime = options.leading === false ? 0 : Date.now();
        timeoutId = null;
        
        if (lastArgs) {
          func(...lastArgs);
          lastArgs = null;
        }
      }, remaining);
    }
  };
}

/**
 * Hook personalizado para debounce com React
 */
import { useCallback, useRef, useEffect } from 'react';

export function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
  dependencies: any[] = []
): (...args: Parameters<T>) => void {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Limpa timeout quando componente desmonta ou dependências mudam
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, dependencies);
  
  return useCallback((...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay, ...dependencies]);
}

/**
 * Hook personalizado para throttle com React
 */
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
  dependencies: any[] = []
): (...args: Parameters<T>) => void {
  const isThrottledRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastArgsRef = useRef<Parameters<T> | null>(null);
  
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, dependencies);
  
  return useCallback((...args: Parameters<T>) => {
    if (isThrottledRef.current) {
      lastArgsRef.current = args;
      return;
    }
    
    callback(...args);
    isThrottledRef.current = true;
    
    timeoutRef.current = setTimeout(() => {
      isThrottledRef.current = false;
      
      if (lastArgsRef.current) {
        callback(...lastArgsRef.current);
        lastArgsRef.current = null;
        
        isThrottledRef.current = true;
        timeoutRef.current = setTimeout(() => {
          isThrottledRef.current = false;
        }, delay);
      }
    }, delay);
  }, [callback, delay, ...dependencies]);
}