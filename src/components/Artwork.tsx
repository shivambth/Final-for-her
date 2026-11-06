export function BookHeart({ className = '' }: { className?: string }) {
  return <svg viewBox="0 0 100 110" fill="none" className={className} aria-hidden="true"><path d="M50 27C29 1 4 27 18 45c8 10 20 20 32 29 12-9 24-19 32-29C96 27 71 1 50 27Z" stroke="currentColor" strokeWidth="1"/><path d="M50 32C33 10 13 30 24 44c7 9 17 17 26 24 10-7 20-15 26-24C87 30 67 10 50 32Z" stroke="currentColor" strokeWidth=".5" opacity=".5"/><path d="M17 75c2 17 13 22 24 23m-9-4c-13 2-15-6-13-10 8-1 12 4 13 10Zm-9-10c-10 0-13-7-10-11 7 0 11 4 10 11Zm60-9c-2 17-13 22-24 23m9-4c13 2 15-6 13-10-8-1-12 4-13 10Zm9-10c10 0 13-7 10-11-7 0-11 4-10 11Z" stroke="currentColor" strokeWidth=".7"/><path d="M50 85v12m-5-6h10M44 103h12" stroke="currentColor" strokeWidth=".8"/></svg>;
}

export function Botanical({ className = '', flip = false }: { className?: string; flip?: boolean }) {
  return <svg viewBox="0 0 220 320" fill="none" className={className} aria-hidden="true" style={flip ? { transform: 'scaleX(-1) rotate(-12deg)' } : undefined}><g stroke="currentColor" strokeWidth="1" strokeLinecap="round"><path d="M38 309C82 251 105 151 126 26M75 242c-4-58-37-65-44-94 35 6 53 35 44 94Zm14-46c35-18 53-48 60-75-34 7-53 37-60 75Zm15-63c-25-23-25-51-29-76 29 17 35 45 29 76Zm12-54c21-13 34-41 36-61-22 9-36 34-36 61Zm-1 17c33-5 60-21 70-41-33-1-62 16-70 41Zm-50 174c-27-4-45-28-51-50 26 1 45 20 51 50Zm20-32c34-1 67-23 79-51-39 5-64 25-79 51Z"/><path d="M75 242c-7-32-25-52-44-94m58 48c18-29 38-52 60-75m-45 12C93 110 86 87 75 57m41 22c9-22 20-41 36-61m-37 78c23-12 47-25 70-41M65 270c-20-15-34-31-51-50m71 18c25-14 52-30 79-51" opacity=".45"/><path d="M143 277c-8-11-3-25 4-27 9 5 10 18-4 27Zm0 0c12-4 21 0 22 7-8 7-18 3-22-7Zm0 0c-6 4-9 17-3 22 9-2 11-12 3-22Z"/><path d="m172 140 3 8 8 3-8 3-3 8-3-8-8-3 8-3 3-8Zm-127-32 2 5 6 2-6 2-2 6-2-6-6-2 6-2 2-5Z" opacity=".7"/></g></svg>;
}

export function Flourish({ className = '' }: { className?: string }) {
  return <svg viewBox="0 0 120 30" fill="none" className={className} aria-hidden="true"><path d="M3 15h38m38 0h38M45 15c4-6 9-4 15 0 6-4 11-6 15 0-4 6-9 4-15 0-6 4-11 6-15 0Z" stroke="currentColor" strokeWidth=".8"/><path d="m60 7 3 3-3 3-3-3 3-3Zm0 10 3 3-3 3-3-3 3-3Z" stroke="currentColor" strokeWidth=".7"/></svg>;
}

export function Corner({ className = '' }: { className?: string }) {
  return <svg viewBox="0 0 50 50" className={className} fill="none" aria-hidden="true"><path d="M6 45V6h39M11 35V11h24M9 9c13 1 18 8 16 16C17 27 10 22 9 9Z" stroke="currentColor" strokeWidth=".8"/><path d="M13 13c7 1 11 5 12 12" stroke="currentColor" strokeWidth=".7"/></svg>;
}