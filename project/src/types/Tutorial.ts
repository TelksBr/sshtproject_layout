
import { LucideIcon } from 'lucide-react';

export interface Tutorial {
  id: number;
  title: string;
  description: string;
  icon: LucideIcon;
  content: {
    steps?: { title: string; description: string }[];
    video?: string;
    images?: { src: string; alt: string }[];
    links?: { text: string; url: string; label: string }[];
  };
}