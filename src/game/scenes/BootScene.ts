import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    const graphics = this.make.graphics({ x: 0, y: 0 });

    graphics.fillStyle(0x8B7355, 1);
    graphics.fillRect(0, 0, 1280, 720);
    graphics.generateTexture('room_bg', 1280, 720);
    graphics.clear();

    graphics.fillStyle(0x5C4033, 1);
    graphics.fillRect(0, 0, 1280, 200);
    graphics.generateTexture('floor', 1280, 200);
    graphics.clear();

    graphics.fillStyle(0x654321, 1);
    graphics.fillRect(0, 0, 200, 120);
    graphics.generateTexture('desk', 200, 120);
    graphics.clear();

    graphics.fillStyle(0x1a1a2e, 1);
    graphics.fillRect(0, 0, 100, 70);
    graphics.generateTexture('computer', 100, 70);
    graphics.clear();

    graphics.fillStyle(0xF5F5DC, 1);
    graphics.fillRect(0, 0, 60, 40);
    graphics.generateTexture('newspaper', 60, 40);
    graphics.clear();

    graphics.fillStyle(0x4682B4, 1);
    graphics.fillRect(0, 0, 180, 140);
    graphics.generateTexture('bed', 180, 140);
    graphics.clear();

    graphics.fillStyle(0x87CEEB, 1);
    graphics.fillRect(0, 0, 120, 100);
    graphics.generateTexture('window', 120, 100);
    graphics.clear();

    graphics.fillStyle(0x000033, 1);
    graphics.fillRect(0, 0, 1280, 720);
    graphics.generateTexture('night_overlay', 1280, 720);
    graphics.clear();

    graphics.fillStyle(0x1e293b, 1);
    graphics.fillRoundedRect(0, 0, 180, 32, 4);
    graphics.generateTexture('tooltip_bg', 180, 32);
    graphics.clear();

    graphics.lineStyle(3, 0xFFD700, 1);
    graphics.strokeRect(0, 0, 104, 74);
    graphics.generateTexture('glow_computer', 104, 74);
    graphics.clear();

    graphics.lineStyle(3, 0xFFD700, 1);
    graphics.strokeRect(0, 0, 64, 44);
    graphics.generateTexture('glow_newspaper', 64, 44);
    graphics.clear();
  }

  create(): void {
    this.scene.start('PreloadScene');
  }
}
