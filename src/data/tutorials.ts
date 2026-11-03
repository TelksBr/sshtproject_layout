import { message as tr } from '../i18n/messages';
import { Smartphone, Wifi, Settings, ShoppingCart, PlaneLanding } from '../utils/icons';
import type { Tutorial } from '../types/Tutorial';

export function youtubeWatchUrl(id: string): string {
  return `https://www.youtube.com/watch?v=${id}`;
}

export function youtubeThumbUrl(id: string): string {
  return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
}

export const tutorials: Tutorial[] = [
  {
    id: 1,
    get title() { return tr("m800c227aab"); },
    get description() { return tr("mc7182ab71d"); },
    icon: Smartphone,
    youtubeId: '4KM2Bsgpmmo',
    links: [
      { get label() { return tr("ma6dba85185"); }, url: 'https://t.me/ssh_t_project_grupo/494' },
      { get label() { return tr("m9ac46a13db"); }, url: 'https://play.google.com/store/apps/details?id=app.sshtproject' },
    ],
  },
  {
    id: 2,
    title: 'Hotspot',
    get description() { return tr("m3f52ce4467"); },
    icon: Wifi,
    steps: [
      { get title() { return tr("m6ce6e00fdf"); }, get description() { return tr("m08fd8431f4"); } },
      { get title() { return tr("md8bac264f8"); }, get description() { return tr("m5bdc0158a4"); } },
      { get title() { return tr("m1e26bd8329"); }, get description() { return tr("m3cf62ab1ae"); } },
      {
        get title() { return tr("m723d8e3410"); },
        get description() { return tr("m62d720d87a"); },
      },
    ],
  },
  {
    id: 3,
    title: 'APN',
    get description() { return tr("mb01a98340b"); },
    icon: Settings,
    youtubeId: '-mM9TKPNDkY',
  },
  {
    id: 4,
    get title() { return tr("m0fa628114e"); },
    get description() { return tr("m451ef75bcd"); },
    icon: ShoppingCart,
    youtubeId: 'lSJ_M4WeXgA',
  },
  {
    id: 5,
    get title() { return tr("m810ec239de"); },
    get description() { return tr("m71a5d87110"); },
    icon: PlaneLanding,
    steps: [
      {
        get title() { return tr("mf356c3f446"); },
        get description() { return tr("m36ae6f9362"); },
      },
      {
        get title() { return tr("mb1ea3a8f79"); },
        get description() { return tr("mb7f1fe21c9"); },
      },
      { get title() { return tr("mdd4329f8cf"); }, get description() { return tr("mb359ced7d3"); } },
      { get title() { return tr("mc40a8ebee4"); }, get description() { return tr("mfce88127fb"); } },
      { get title() { return tr("mfbc4b7cb35"); }, get description() { return tr("m15a8b89c7e"); } },
      { get title() { return tr("m858b0e75ea"); }, get description() { return tr("mae7fd0b14f"); } },
      {
        get title() { return tr("m3e7223731a"); },
        get description() { return tr("m0273ae6a72"); },
      },
    ],
  },
];
