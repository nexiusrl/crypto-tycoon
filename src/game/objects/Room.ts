import Phaser from 'phaser';

export class Room extends Phaser.GameObjects.Container {
  private nightOverlay: Phaser.GameObjects.Image;
  private window: Phaser.GameObjects.Image;
  private hour = 6;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);
    scene.add.existing(this);

    const bg = scene.add.image(0, 0, 'room_bg').setOrigin(0, 0);
    this.add(bg);

    const floor = scene.add.image(0, 520, 'floor').setOrigin(0, 0);
    this.add(floor);

    const windowFrame = scene.add.rectangle(200, 150, 124, 104, 0x4a3728);
    windowFrame.setDepth(-1);
    this.add(windowFrame);

    this.window = scene.add.image(200, 150, 'window').setOrigin(0.5);
    this.add(this.window);

    const bedFrame = scene.add.rectangle(1000, 480, 184, 144, 0x3d2817);
    bedFrame.setDepth(-1);
    this.add(bedFrame);

    const bed = scene.add.image(1000, 480, 'bed').setOrigin(0.5);
    this.add(bed);

    this.nightOverlay = scene.add.image(0, 0, 'night_overlay').setOrigin(0, 0);
    this.nightOverlay.setAlpha(0);
    this.add(this.nightOverlay);

    this.setDepth(0);
  }

  updateDayNight(hour: number): void {
    this.hour = hour;

    let alpha = 0;

    if (hour >= 20 || hour < 5) {
      alpha = 0.6;
    } else if (hour >= 18) {
      const progress = (hour - 18) / 2;
      alpha = progress * 0.5;
    } else if (hour >= 5 && hour < 6) {
      const progress = (hour - 5);
      alpha = 0.6 - progress * 0.6;
    }

    this.scene.tweens.add({
      targets: this.nightOverlay,
      alpha,
      duration: 500,
      ease: 'Linear',
    });

    if (hour >= 6 && hour < 18) {
      this.window.setTint(0x87CEEB);
    } else if (hour >= 18 && hour < 20) {
      this.window.setTint(0xFF8C00);
    } else {
      this.window.setTint(0x191970);
    }
  }

  getHour(): number {
    return this.hour;
  }
}
