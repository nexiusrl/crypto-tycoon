import Phaser from 'phaser';
import { gameEvents, GameEvents } from '../events';

export class Newspaper extends Phaser.GameObjects.Container {
  private sprite: Phaser.GameObjects.Image;
  private glow: Phaser.GameObjects.Image;
  private tooltip: Phaser.GameObjects.Container;
  private isHovered = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);
    scene.add.existing(this);

    this.sprite = scene.add.image(0, 0, 'newspaper').setOrigin(0.5);
    this.sprite.setInteractive({ cursor: 'pointer' });
    this.add(this.sprite);

    this.glow = scene.add.image(0, 0, 'glow_newspaper').setOrigin(0.5);
    this.glow.setVisible(false);
    this.add(this.glow);

    this.tooltip = scene.add.container(0, -45);
    const tooltipBg = scene.add.image(0, 0, 'tooltip_bg').setOrigin(0.5);
    const tooltipText = scene.add.text(0, 0, 'Read Market News', {
      fontSize: '12px',
      color: '#e2e8f0',
    }).setOrigin(0.5);
    this.tooltip.add([tooltipBg, tooltipText]);
    this.tooltip.setVisible(false);
    this.tooltip.setDepth(100);
    this.add(this.tooltip);

    this.sprite.on('pointerover', () => {
      this.isHovered = true;
      this.glow.setVisible(true);
      this.tooltip.setVisible(true);
      scene.tweens.add({
        targets: this.sprite,
        scaleX: 1.1,
        scaleY: 1.1,
        duration: 150,
        ease: 'Back.easeOut',
      });
    });

    this.sprite.on('pointerout', () => {
      this.isHovered = false;
      this.glow.setVisible(false);
      this.tooltip.setVisible(false);
      scene.tweens.add({
        targets: this.sprite,
        scaleX: 1,
        scaleY: 1,
        duration: 150,
        ease: 'Back.easeOut',
      });
    });

    this.sprite.on('pointerdown', () => {
      scene.tweens.add({
        targets: this.sprite,
        scaleX: 0.9,
        scaleY: 0.9,
        duration: 80,
        yoyo: true,
        ease: 'Quad.easeInOut',
        onComplete: () => {
          gameEvents.emit(GameEvents.OPEN_NEWS);
        },
      });
    });

    this.setDepth(10);
  }

  getIsHovered(): boolean {
    return this.isHovered;
  }
}
