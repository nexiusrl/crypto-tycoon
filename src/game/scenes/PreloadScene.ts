import Phaser from 'phaser';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloadScene' });
  }

  preload(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    this.add.rectangle(width / 2, height / 2, width, height, 0x0f172a);

    this.add.text(width / 2, height / 2 - 80, 'Crypto Tycoon', {
      fontSize: '48px',
      color: '#fbbf24',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const loadingText = this.add.text(width / 2, height / 2 - 20, 'Loading...', {
      fontSize: '20px',
      color: '#94a3b8',
    }).setOrigin(0.5);

    const progressBarBg = this.add.rectangle(width / 2, height / 2 + 30, 400, 24, 0x334155);
    progressBarBg.setOrigin(0.5);

    const progressBar = this.add.rectangle(width / 2 - 196, height / 2 + 30, 0, 20, 0x3b82f6);
    progressBar.setOrigin(0, 0.5);

    const percentText = this.add.text(width / 2, height / 2 + 70, '0%', {
      fontSize: '16px',
      color: '#94a3b8',
    }).setOrigin(0.5);

    this.load.on('progress', (value: number) => {
      progressBar.width = 392 * value;
      percentText.setText(`${Math.round(value * 100)}%`);
    });

    this.load.on('complete', () => {
      loadingText.setText('Ready!');
      progressBar.destroy();
      progressBarBg.destroy();
      percentText.destroy();
      loadingText.destroy();
    });
  }

  create(): void {
    this.scene.start('OfficeScene');
  }
}
