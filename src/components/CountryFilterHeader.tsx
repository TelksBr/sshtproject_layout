import React, { memo } from 'react';
import type { AvailableCountry } from '../utils/countryUtils';
import { vibrate } from '../utils/appFunctions';

interface CountryFilterHeaderProps {
  availableCountries: AvailableCountry[];
  selectedCountry: string;
  onSelectCountry: (code: string) => void;
  hasOtherWithoutFlag?: boolean;
  totalCategories?: number;
  totalConfigs?: number;
}

export const CountryFilterHeader: React.FC<CountryFilterHeaderProps> = memo(
  ({
    availableCountries,
    selectedCountry,
    onSelectCountry,
    hasOtherWithoutFlag = false,
    totalCategories = 0,
    totalConfigs = 0,
  }) => {
    if (availableCountries.length === 0) {
      return null;
    }

    const handleSelect = (code: string) => {
      try {
        vibrate(20);
      } catch {
        /* silencioso */
      }
      onSelectCountry(code);
    };

    return (
      <nav 
        aria-label="Filtro de países"
        className="w-full mb-3"
      >
        <div className="flex items-center justify-between mb-1.5 px-0.5">
          <span 
            className="text-[11px] font-semibold uppercase tracking-wider flex items-center gap-1.5"
            style={{ color: 'var(--text-muted)' }}
          >
            <span>Filtrar por País</span>
            {selectedCountry !== 'all' && (
              <span className="text-[10px] lowercase font-normal opacity-75">
                (filtrado)
              </span>
            )}
          </span>
          <span className="text-[10px]" style={{ color: 'var(--text-muted)', opacity: 0.8 }}>
            {totalCategories} categorias • {totalConfigs} configs
          </span>
        </div>

        <div 
          className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 px-0.5 touch-pan-x"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {/* Botão Todos */}
          <button
            type="button"
            onClick={() => handleSelect('all')}
            className={`
              flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 touch-manipulation active:scale-95
              ${selectedCountry === 'all'
                ? 'shadow-md shadow-[var(--accent)]/20'
                : 'hover:opacity-90'
              }
            `}
            style={{
              background: selectedCountry === 'all' ? 'var(--accent)' : 'var(--surface)',
              color: selectedCountry === 'all' ? '#ffffff' : 'var(--text-muted)',
              border: selectedCountry === 'all' ? '1px solid var(--accent)' : '1px solid var(--border)',
            }}
          >
            <span className="text-sm">🌐</span>
            <span>Todos</span>
            <span
              className="text-[10px] px-1.5 py-0.2 rounded-full font-bold"
              style={{
                background: selectedCountry === 'all' ? 'rgba(255,255,255,0.25)' : 'var(--bg-elevated)',
                color: selectedCountry === 'all' ? '#ffffff' : 'var(--text-muted)',
              }}
            >
              {totalCategories}
            </span>
          </button>

          {/* Botões de cada país */}
          {availableCountries.map((country) => {
            const isSelected = selectedCountry === country.code;
            return (
              <button
                key={country.code}
                type="button"
                onClick={() => handleSelect(country.code)}
                className={`
                  flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 touch-manipulation active:scale-95
                  ${isSelected
                    ? 'shadow-md shadow-[var(--accent)]/20'
                    : 'hover:opacity-90'
                  }
                `}
                style={{
                  background: isSelected ? 'var(--accent)' : 'var(--surface)',
                  color: isSelected ? '#ffffff' : 'var(--text)',
                  border: isSelected ? '1px solid var(--accent)' : '1px solid var(--border)',
                }}
              >
                <span className="text-base leading-none select-none">{country.flag}</span>
                <span className="truncate max-w-[110px]">{country.name}</span>
                <span
                  className="text-[10px] px-1.5 py-0.2 rounded-full font-bold"
                  style={{
                    background: isSelected ? 'rgba(255,255,255,0.25)' : 'var(--bg-elevated)',
                    color: isSelected ? '#ffffff' : 'var(--text-muted)',
                  }}
                >
                  {country.categoryCount}
                </span>
              </button>
            );
          })}

          {/* Botão Outros (se existirem categorias sem bandeira) */}
          {hasOtherWithoutFlag && (
            <button
              type="button"
              onClick={() => handleSelect('OTHER')}
              className={`
                flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 touch-manipulation active:scale-95
                ${selectedCountry === 'OTHER'
                  ? 'shadow-md shadow-[var(--accent)]/20'
                  : 'hover:opacity-90'
                }
              `}
              style={{
                background: selectedCountry === 'OTHER' ? 'var(--accent)' : 'var(--surface)',
                color: selectedCountry === 'OTHER' ? '#ffffff' : 'var(--text-muted)',
                border: selectedCountry === 'OTHER' ? '1px solid var(--accent)' : '1px solid var(--border)',
              }}
            >
              <span className="text-sm">🏳️</span>
              <span>Outros</span>
            </button>
          )}
        </div>
      </nav>
    );
  }
);

CountryFilterHeader.displayName = 'CountryFilterHeader';
