import Phaser from 'phaser';

export enum GameEvents {
  TRADE_EXECUTED = 'trade:executed',
  PRICE_UPDATED = 'price:updated',
  NEWS_RECEIVED = 'news:received',
  DAY_ADVANCED = 'day:advanced',
  OPEN_TRADING = 'ui:open_trading',
  OPEN_NEWS = 'ui:open_news',
  OPEN_PORTFOLIO = 'ui:open_portfolio',
  CLOSE_MODAL = 'ui:close_modal',
}

export const gameEvents = new Phaser.Events.EventEmitter();
