import Phaser from 'phaser';
import { Room } from '../objects/Room';
import { Computer } from '../objects/Computer';
import { Newspaper } from '../objects/Newspaper';
import { useGameStore } from '../../store/gameStore';

export class OfficeScene extends Phaser.Scene {
  private room!: Room;
  private zoomLevel = 1;
  private lastHour = -1;

  constructor() {
    super({ key: 'OfficeScene' });
  }

  create(): void {
    this.room = new Room(this, 0, 0);
    new Computer(this, 640, 420);
    new Newspaper(this, 750, 480);

    this.cameras.main.setBounds(0, 0, 1280, 720);
    this.cameras.main.setZoom(1);

    this.input.on('wheel', (_pointer: Phaser.Input.Pointer, _gameObjects: unknown, _deltaX: number, deltaY: number) => {
      if (deltaY > 0) {
        this.zoomLevel = Math.max(1, this.zoomLevel - 0.2);
      } else {
        this.zoomLevel = Math.min(2, this.zoomLevel + 0.2);
      }
      this.cameras.main.setZoom(this.zoomLevel);
    });

    this.add.text(640, 40, 'Your Bedroom Office', {
      fontSize: '24px',
      color: '#fbbf24',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(100);

    this.add.text(640, 680, 'Scroll to zoom • Click objects to interact', {
      fontSize: '14px',
      color: '#94a3b8',
    }).setOrigin(0.5).setDepth(100);

    this.time.addEvent({
      delay: 100,
      loop: true,
      callback: () => {
        const hour = useGameStore.getState().hour;
        if (hour !== this.lastHour) {
          this.lastHour = hour;
          this.room.updateDayNight(hour);
        }
      },
    });
  }

  update(): void {
    // Scene update loop
  }
}
