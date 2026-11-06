export type Lang = 'id' | 'en';
export type Text = { id: string; en: string };
export const t = (id: string, en: string): Text => ({ id, en });
export type PageKind = 'dedication' | 'story' | 'quote' | 'photo' | 'letter' | 'reasons' | 'game' | 'envelope' | 'timeline' | 'guestbook' | 'question' | 'note' | 'final';
export interface BookPage {
  number: number;
  id: string;
  chapter: number;
  kind: PageKind;
  title: Text;
  body: Text;
  detail?: Text;
  photos?: number[];
  layout?: string;
  letter?: number;
  part?: number;
  reasons?: number[];
  game?: number;
  envelope?: number;
  hidden?: Text;
}
export interface Letter {
  title: Text;
  parts: Text[];
}
export interface Chapter { title: Text; subtitle: Text; start: number; end: number; }
export interface PhotoRecord {
  id: string;
  src: string | null;
  filename: string | null;
  caption: Text;
  alt: Text;
  category: string;
  focalX: number;
  focalY: number;
}