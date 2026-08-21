import { type LucideIcon } from '../utils/icons';

export interface TutorialStep {
  title: string;
  description: string;
}

export interface TutorialLink {
  label: string;
  url: string;
}

export interface TutorialImage {
  src: string;
  alt: string;
}

export interface Tutorial {
  id: number;
  title: string;
  description: string;
  icon: LucideIcon;
  youtubeId?: string;
  steps?: TutorialStep[];
  images?: TutorialImage[];
  links?: TutorialLink[];
}
